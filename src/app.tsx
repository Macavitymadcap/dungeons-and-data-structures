import {
  AppShell,
  Button,
  HxForm,
  MetadataList,
  Notice,
  PageHeader,
  Panel,
  SelectField,
  TextareaField,
  Toolbar,
} from "@macavitymadcap/hyper-dank-ui";
import { FormValues, routeParam } from "@macavitymadcap/hyper-dank-transport";
import { Hono } from "hono";
import { discoveryList, itemList } from "./gamebook/catalog.ts";
import { mtGraphnorAdventure } from "./gamebook/content/mt-graphnor.ts";
import { createPassageMap } from "./gamebook/graph.ts";
import {
  Adventure,
  Character,
  CombatRoundResult,
  GameState,
  Passage,
  RollResult,
} from "./gamebook/model.ts";
import { resolveChoice } from "./gamebook/play.ts";
import { createCharacter } from "./gamebook/rules/character.ts";
import {
  createInitialState,
  isChoiceAvailable,
  parseGame,
} from "./gamebook/state.ts";

export interface AppDependencies {
  adventure?: Adventure;
  appName?: string;
  now?: () => Date;
  random?: () => number;
}

export function createApp(dependencies: AppDependencies = {}) {
  const adventure = dependencies.adventure ?? mtGraphnorAdventure;
  const appName = dependencies.appName ?? "Dungeons & Data Structures";
  const now = dependencies.now ?? (() => new Date());
  const random = dependencies.random ?? Math.random;
  const passages = createPassageMap(adventure.passages);

  const app = new Hono();

  app.get("/healthz", (context) => context.json({ ok: true }));

  app.get("/", (context) => context.redirect("/gamebook", 302));

  app.get("/assets/hyper-dank-ui.css", () =>
    new Response(Bun.file("node_modules/@macavitymadcap/hyper-dank-ui/src/styles.css"), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    })
  );

  app.get("/gamebook", (context) => {
    const characterClass = normaliseCharacterClass(
      context.req.query("class"),
    );
    const race = normaliseCharacterRace(context.req.query("race"));
    const character = createCharacter("hero-1", "Adventurer", characterClass, race);
    const state = createInitialState(adventure, character, now());

    return context.html(
      <GamebookPage
        appName={appName}
        adventure={adventure}
        passage={passages.get(state.currentPassageId)!}
        state={state}
      />,
    );
  });

  app.post("/gamebook/choices/:choiceId", async (context) => {
    const form = await FormValues.from(context);
    const loadedState = parseSubmittedState(
      form.optionalString("state"),
      adventure,
      now(),
    );
    if (!loadedState.ok) {
      return context.html(<Notice tone="danger">{loadedState.error}</Notice>, 400);
    }
    const passage = passages.get(loadedState.state.currentPassageId);
    if (!passage) {
      return context.html(
        <Notice tone="danger">Current passage could not be found.</Notice>,
        404,
      );
    }

    const choice = passage.choices.find((item) =>
      item.id === routeParam(context, "choiceId")
    );
    if (!choice) {
      return context.html(<Notice tone="danger">Choice not found.</Notice>, 404);
    }

    const result = resolveChoice(loadedState.state, choice, {
      adventure,
      now,
      random,
    });
    if (result.error) {
      return context.html(<Notice tone="danger">{result.error}</Notice>, 403);
    }

    const nextPassage = passages.get(result.state.currentPassageId);
    if (!nextPassage) {
      return context.html(
        <Notice tone="danger">Next passage could not be found.</Notice>,
        500,
      );
    }

    return context.html(
      <PassagePanel
        adventure={adventure}
        passage={nextPassage}
        state={result.state}
        roll={result.roll}
        combat={result.combat}
      />,
    );
  });

  return app;
}

function parseSubmittedState(
  raw: string | undefined,
  adventure: Adventure,
  now: Date,
): { ok: true; state: GameState } | { ok: false; error: string } {
  if (typeof raw !== "string") {
    return {
      ok: true,
      state: createInitialState(
        adventure,
        createCharacter("hero-1", "Adventurer", "fighter"),
        now,
      ),
    };
  }
  return parseGame(raw, adventure);
}

function normaliseCharacterClass(value: string | undefined): Character["class"] {
  if (
    value === "fighter" || value === "rogue" || value === "wizard" ||
    value === "cleric"
  ) {
    return value;
  }
  return "fighter";
}

function normaliseCharacterRace(value: string | undefined): Character["race"] {
  if (
    value === "human" || value === "elf" || value === "dwarf" ||
    value === "halfling"
  ) {
    return value;
  }
  return "human";
}

function GamebookPage(props: {
  appName: string;
  adventure: Adventure;
  passage: Passage;
  state: GameState;
}) {
  return (
    <html lang="en-GB">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.adventure.title} | {props.appName}</title>
        <link rel="stylesheet" href="/assets/hyper-dank-ui.css" />
        <script type="module" src="/assets/client.js"></script>
        <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js">
        </script>
      </head>
      <body>
        <AppShell
          header={
            <PageHeader
              eyebrow={props.appName}
              id="gamebook-header"
              title={props.adventure.title}
              description="A mechanics-first static gamebook prototype."
            />
          }
        >
          <script
            id="gamebook-data"
            type="application/json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                adventure: props.adventure,
                state: props.state,
              }),
            }}
          />
          <GameControls
            characterClass={props.state.character.class}
            race={props.state.character.race}
          />
          <div id="gamebook-passage" aria-live="polite">
            <PassagePanel
              adventure={props.adventure}
              passage={props.passage}
              state={props.state}
            />
          </div>
        </AppShell>
      </body>
    </html>
  );
}

function GameControls(props: {
  characterClass: Character["class"];
  race: Character["race"];
}) {
  return (
    <Panel labelledBy="gamebook-controls-title">
      <section aria-labelledby="gamebook-controls-title">
        <h2 id="gamebook-controls-title">Save controls</h2>
        <Toolbar ariaLabel="Gamebook save controls">
          <HxForm
            action="/gamebook"
            className="gamebook-new-game"
            method="get"
          >
            <SelectField
              id="gamebook-class"
              label="Character class"
              name="class"
              value={props.characterClass}
              options={[
                { label: "Fighter", value: "fighter" },
                { label: "Rogue", value: "rogue" },
                { label: "Wizard", value: "wizard" },
                { label: "Cleric", value: "cleric" },
              ]}
            />
            <SelectField
              id="gamebook-race"
              label="Ancestry"
              name="race"
              value={props.race}
              options={[
                { label: "Human", value: "human" },
                { label: "Elf", value: "elf" },
                { label: "Dwarf", value: "dwarf" },
                { label: "Halfling", value: "halfling" },
              ]}
            />
            <Button type="submit">New game</Button>
          </HxForm>
          <Button
            type="button"
            variant="danger"
            {...{ "hx-disable": "true" }}
            ariaLabel="Reset saved game"
            id="gamebook-reset"
          >
            Reset
          </Button>
        </Toolbar>
        <HxForm
          action="/gamebook"
          className="gamebook-save-import"
          method="post"
        >
          <TextareaField
            id="gamebook-save-json"
            label="Save JSON"
            name="save"
            rows={5}
          />
          <Toolbar ariaLabel="Save import and export controls">
            <Button
              type="button"
              variant="outline"
              {...{ "hx-disable": "true" }}
              id="gamebook-export"
            >
              Export save
            </Button>
            <Button type="submit" variant="outline">Import save</Button>
          </Toolbar>
        </HxForm>
        <p id="gamebook-save-status" role="status">
          Saved progress continues automatically in this browser.
        </p>
      </section>
    </Panel>
  );
}

function PassagePanel(props: {
  adventure: Adventure;
  passage: Passage;
  state: GameState;
  roll?: RollResult;
  combat?: CombatRoundResult;
}) {
  const availableChoices = props.passage.choices.filter((choice) =>
    isChoiceAvailable(choice, props.state)
  );

  return (
    <Panel labelledBy={`${props.passage.id}-title`}>
      <article data-passage-id={props.passage.id}>
        <h2 id={`${props.passage.id}-title`}>{props.passage.title}</h2>
        <p>{props.passage.body}</p>
        <StateSummary adventure={props.adventure} state={props.state} />
        {props.roll ? <RollSummary roll={props.roll} /> : null}
        {props.combat ? <CombatSummary combat={props.combat} /> : null}
        {props.passage.ending
          ? <p data-ending={props.passage.ending}>Ending: {props.passage.ending}</p>
          : (
            <menu className="button-group">
              {availableChoices.map((choice) => (
                <li>
                  <HxForm
                    action={`/gamebook/choices/${choice.id}`}
                    method="post"
                    className="gamebook-choice"
                    {...{
                      "hx-post": `/gamebook/choices/${choice.id}`,
                      "hx-target": "#gamebook-passage",
                      "hx-swap": "innerHTML",
                    }}
                  >
                    <input
                      type="hidden"
                      name="state"
                      value={JSON.stringify(props.state)}
                    />
                    <input type="hidden" name="choiceId" value={choice.id} />
                    <Button type="submit" variant="outline">{choice.text}</Button>
                  </HxForm>
                </li>
              ))}
            </menu>
          )}
      </article>
    </Panel>
  );
}

function CombatSummary(props: { combat: CombatRoundResult }) {
  return (
    <Notice heading="Combat round" tone={props.combat.outcome === "victory" ? "success" : "info"}>
      {props.combat.log.join(" ")}
    </Notice>
  );
}

function StateSummary(props: { adventure: Adventure; state: GameState }) {
  return (
    <MetadataList
      items={[
        { label: "Class", value: props.state.character.class },
        { label: "Ancestry", value: props.state.character.race },
        {
          label: "HP",
          value: `${props.state.hitPoints}/${props.state.character.maxHitPoints}`,
        },
        { label: "Inventory", value: itemList(props.adventure, props.state.inventory) },
        {
          label: "Discoveries",
          value: discoveryList(props.adventure, props.state.flags),
        },
      ]}
    />
  );
}

function RollSummary(props: { roll: RollResult }) {
  return (
    <Notice heading="Roll result" tone={props.roll.success ? "success" : "info"}>
      Rolled {props.roll.rolls.join(", ")}; kept {props.roll.kept}; total{" "}
      {props.roll.total}
      {props.roll.dc === undefined ? "" : ` against DC ${props.roll.dc}`}
      {props.roll.success === undefined
        ? "."
        : props.roll.success
        ? ": success."
        : ": failure."}
    </Notice>
  );
}
