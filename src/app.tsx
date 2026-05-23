import {
  AppShell,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CodeBlock,
  HxForm,
  Icon,
  IconButton,
  LabelledOutput,
  MetadataList,
  Notice,
  PageHeader,
  Panel,
  SelectField,
  TextareaField,
  TimelineList,
  Toolbar,
} from "@macavitymadcap/hyper-dank-ui";
import { FormValues, routeParam } from "@macavitymadcap/hyper-dank-transport";
import { Hono } from "hono";
import { discoveryList, itemList } from "./gamebook/catalog.ts";
import { mtGraphnorAdventure } from "./gamebook/content/mt-graphnor.ts";
import {
  createPassageMap,
  exportMermaid,
  validateAdventure,
} from "./gamebook/graph.ts";
import {
  Adventure,
  Character,
  CombatRoundResult,
  GameState,
  Passage,
  RollResult,
} from "./gamebook/model.ts";
import { resolveChoice } from "./gamebook/play.ts";
import { abilityModifier, createCharacter } from "./gamebook/rules/character.ts";
import {
  appendLog,
  createInitialState,
  isChoiceAvailable,
  moveToPassage,
  parseGame,
} from "./gamebook/state.ts";

export interface AppDependencies {
  adventure?: Adventure;
  appName?: string;
  authorToolsEnabled?: boolean;
  now?: () => Date;
  random?: () => number;
}

export function createApp(dependencies: AppDependencies = {}) {
  const adventure = dependencies.adventure ?? mtGraphnorAdventure;
  const appName = dependencies.appName ?? "Dungeons & Data Structures";
  const authorToolsEnabled = dependencies.authorToolsEnabled ?? true;
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

  app.get("/assets/gamebook.css", () =>
    new Response(Bun.file("src/gamebook/styles.css"), {
      headers: { "Content-Type": "text/css; charset=utf-8" },
    })
  );

  app.get("/assets/client.js", async () =>
    new Response(await browserClientBundle(authorToolsEnabled), {
      headers: { "Content-Type": "text/javascript; charset=utf-8" },
    })
  );

  app.get("/gamebook", (context) => {
    const characterClass = normaliseCharacterClass(
      context.req.query("class"),
    );
    const race = normaliseCharacterRace(context.req.query("race"));
    const authorMode = authorToolsEnabled && context.req.query("debug") === "1";
    const character = createCharacter("hero-1", "Adventurer", characterClass, race);
    const state = createInitialState(adventure, character, now());

    return context.html(
      <GamebookPage
        appName={appName}
        adventure={adventure}
        passage={passages.get(state.currentPassageId)!}
        state={state}
        authorMode={authorMode}
      />,
    );
  });

  app.get("/gamebook/author", (context) => {
    if (!authorToolsEnabled) {
      return context.notFound();
    }

    return context.html(
      <AuthorPage
        appName={appName}
        adventure={adventure}
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
        authorMode={form.optionalString("authorMode") === "1"}
      />,
    );
  });

  app.post("/gamebook/passages", async (context) => {
    if (!authorToolsEnabled) {
      return context.notFound();
    }

    const form = await FormValues.from(context);
    if (form.optionalString("authorMode") !== "1") {
      return context.html(
        <Notice tone="danger">Force navigation is only available in author mode.</Notice>,
        403,
      );
    }

    const loadedState = parseSubmittedState(
      form.optionalString("state"),
      adventure,
      now(),
      { validateCurrentPassage: false },
    );
    if (!loadedState.ok) {
      return context.html(<Notice tone="danger">{loadedState.error}</Notice>, 400);
    }

    const passageId = form.optionalString("passageId");
    const passage = passageId ? passages.get(passageId) : undefined;
    if (!passage) {
      return context.html(<Notice tone="danger">Forced passage could not be found.</Notice>, 404);
    }

    const forcedState = appendLog(
      moveToPassage(loadedState.state, passage.id, now()),
      `Forced passage to ${passage.id}.`,
      now(),
    );

    return context.html(
      <PassagePanel
        adventure={adventure}
        passage={passage}
        state={forcedState}
        authorMode={true}
      />,
    );
  });

  return app;
}

const clientBundleCache = new Map<string, Promise<string>>();

function browserClientBundle(authorToolsEnabled: boolean): Promise<string> {
  const entrypoint = authorToolsEnabled
    ? "src/gamebook/client.ts"
    : "src/gamebook/player-client.ts";
  const cached = clientBundleCache.get(entrypoint);
  if (cached) {
    return cached;
  }

  const bundle = Bun.build({
    entrypoints: [entrypoint],
    minify: true,
    target: "browser",
  }).then((result) => {
    if (!result.success || result.outputs.length === 0) {
      throw new Error(`Could not build browser client bundle for ${entrypoint}.`);
    }
    return result.outputs[0].text();
  });

  clientBundleCache.set(entrypoint, bundle);
  return bundle;
}

function AuthorPage(props: {
  appName: string;
  adventure: Adventure;
}) {
  const validation = validateAdventure(props.adventure);
  const mermaid = exportMermaid(props.adventure);

  return (
    <html lang="en-GB">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Author Tools | {props.appName}</title>
        <link rel="stylesheet" href="/assets/hyper-dank-ui.css" />
      </head>
      <body>
        <AppShell
          header={
            <PageHeader
              eyebrow={props.appName}
              id="author-header"
              title="Author Tools"
              description="Static validation and graph exports for the gamebook draft."
            />
          }
        >
          <Panel labelledBy="author-validation-title">
            <section aria-labelledby="author-validation-title">
              <h2 id="author-validation-title">Graph validation</h2>
              <MetadataList
                items={[
                  { label: "Adventure", value: props.adventure.title },
                  { label: "Passages", value: String(props.adventure.passages.length) },
                  {
                    label: "Reachable passages",
                    value: String(validation.reachablePassageIds.size),
                  },
                  { label: "Issues", value: String(validation.issues.length) },
                ]}
              />
              <Notice
                heading={validation.valid ? "Validation passed" : "Validation failed"}
                tone={validation.valid ? "success" : "danger"}
              >
                {validation.valid
                  ? "All passages and endings are currently reachable."
                  : "Review the issue list before publishing this adventure."}
              </Notice>
              {validation.issues.length > 0
                ? (
                  <ul>
                    {validation.issues.map((issue) => (
                      <li>
                        <strong>{issue.code}</strong>: {issue.message}
                      </li>
                    ))}
                  </ul>
                )
                : null}
            </section>
          </Panel>
          <Panel labelledBy="author-mermaid-title">
            <section aria-labelledby="author-mermaid-title">
              <h2 id="author-mermaid-title">Mermaid passage graph</h2>
              <CodeBlock code={mermaid} language="mermaid" />
            </section>
          </Panel>
        </AppShell>
      </body>
    </html>
  );
}

function parseSubmittedState(
  raw: string | undefined,
  adventure: Adventure,
  now: Date,
  options: { validateCurrentPassage?: boolean } = {},
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
  return parseGame(raw, adventure, options);
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
  authorMode: boolean;
}) {
  return (
    <html lang="en-GB">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>{props.adventure.title} | {props.appName}</title>
        <link rel="stylesheet" href="/assets/hyper-dank-ui.css" />
        <link rel="stylesheet" href="/assets/gamebook.css" />
        <script type="module" src="/assets/client.js"></script>
        <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js">
        </script>
      </head>
      <body>
        <AppShell
          className="gamebook-shell"
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
                ...(props.authorMode ? { authorMode: true } : {}),
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
              authorMode={props.authorMode}
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
    <section className="gamebook-command-bar" aria-labelledby="gamebook-controls-title">
      <h2 id="gamebook-controls-title">Game controls</h2>
      <details className="gamebook-popover">
        <summary className="button" data-size="compact" data-variant="outline">
          <Icon name="settings" /> Settings
        </summary>
        <div className="gamebook-popover-panel" role="group" aria-label="Game settings">
          <h3>New game</h3>
          <Toolbar ariaLabel="Character setup controls">
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
            <IconButton
              type="button"
              variant="danger"
              icon="delete"
              label="Reset saved game"
              {...{ "hx-disable": "true" }}
              id="gamebook-reset"
            />
          </Toolbar>
          <h3>Save JSON</h3>
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
                <Icon name="download" /> Export
              </Button>
              <Button type="submit" variant="outline">
                <Icon name="save" /> Import
              </Button>
            </Toolbar>
          </HxForm>
        </div>
      </details>
      <p id="gamebook-save-status" role="status">
        Saved progress continues automatically in this browser.
      </p>
    </section>
  );
}

function PassagePanel(props: {
  adventure: Adventure;
  passage: Passage;
  state: GameState;
  roll?: RollResult;
  combat?: CombatRoundResult;
  authorMode?: boolean;
}) {
  const availableChoices = props.passage.choices.filter((choice) =>
    isChoiceAvailable(choice, props.state)
  );

  return (
    <Card as="section" className="gamebook-passage-card">
      <article data-passage-id={props.passage.id}>
        <div className="gamebook-passage-layout">
          <section className="gamebook-story-column" aria-labelledby={`${props.passage.id}-title`}>
            <div className="gamebook-passage-kicker">
              {props.passage.tags?.slice(0, 3).map((tag) => <Badge>{tag}</Badge>)}
            </div>
            <h2 id={`${props.passage.id}-title`}>{props.passage.title}</h2>
            <p>{props.passage.body}</p>
            {props.passage.ending
              ? (
                <Notice heading="Ending" tone="success">
                  <span data-ending={props.passage.ending}>{props.passage.ending}</span>
                </Notice>
              )
              : (
                <ButtonGroup ariaLabel="Choices" className="gamebook-choice-list">
                  {availableChoices.map((choice) => (
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
                      {props.authorMode
                        ? <input type="hidden" name="authorMode" value="1" />
                        : null}
                      <Button type="submit" variant="outline">
                        <Icon name="book" /> {choice.text}
                      </Button>
                    </HxForm>
                  ))}
                </ButtonGroup>
              )}
          </section>
          <aside className="gamebook-side-rail" aria-label="Character and play details">
            <StateStrip state={props.state} />
            <CharacterSheet adventure={props.adventure} state={props.state} />
            {props.passage.encounterId
              ? (
                <EncounterStatus
                  adventure={props.adventure}
                  encounterId={props.passage.encounterId}
                  state={props.state}
                />
              )
              : null}
            {props.roll || props.combat
              ? <ActionDetails roll={props.roll} combat={props.combat} />
              : null}
            <ActionLog state={props.state} />
            {props.authorMode
              ? <DebugPanel adventure={props.adventure} state={props.state} />
              : null}
          </aside>
        </div>
      </article>
    </Card>
  );
}

function DebugPanel(props: { adventure: Adventure; state: GameState }) {
  return (
    <details className="gamebook-details-card gamebook-debug-panel" data-author-debug="true">
      <summary className="button" data-size="compact" data-variant="ghost">
        <Icon name="database" /> Debug
      </summary>
      <section className="gamebook-details-body" aria-labelledby="debug-state-title">
        <h2 id="debug-state-title">Debug state</h2>
        <MetadataList
          items={[
            { label: "Passage ID", value: props.state.currentPassageId },
            { label: "Flag IDs", value: props.state.flags.join(", ") || "None" },
            { label: "Item IDs", value: props.state.inventory.join(", ") || "Empty" },
            { label: "Encounter state", value: encounterDebugText(props.state) },
            { label: "Log entries", value: String(props.state.log.length) },
          ]}
        />
        <h3>Recent log</h3>
        <ol data-debug-log="recent">
          {props.state.log.slice(-5).map((entry) => <li>{entry.message}</li>)}
        </ol>
        <HxForm
          action="/gamebook/passages"
          className="gamebook-force-passage"
          method="post"
          {...{
            "hx-post": "/gamebook/passages",
            "hx-target": "#gamebook-passage",
            "hx-swap": "innerHTML",
          }}
        >
          <input type="hidden" name="authorMode" value="1" />
          <input type="hidden" name="state" value={JSON.stringify(props.state)} />
          <SelectField
            id="debug-force-passage"
            label="Force passage"
            name="passageId"
            value={props.state.currentPassageId}
            options={props.adventure.passages.map((passage) => ({
              label: `${passage.title} (${passage.id})`,
              value: passage.id,
            }))}
          />
          <Button type="submit" variant="outline">Go</Button>
        </HxForm>
      </section>
    </details>
  );
}

function encounterDebugText(state: GameState): string {
  return Object.entries(state.encounters).map(([id, encounter]) =>
    `${id}: ${encounter.hitPoints} HP, round ${encounter.rounds}${
      encounter.defeated ? ", defeated" : ""
    }`
  ).join("; ") || "None";
}

function CombatSummary(props: { combat: CombatRoundResult }) {
  return (
    <Notice
      heading={`Combat round ${props.combat.round}`}
      tone={props.combat.outcome === "victory" ? "success" : "info"}
    >
      <div className="gamebook-output-grid">
        <LabelledOutput
          label="Your attack"
          value={`${props.combat.playerAttack.total} vs AC ${
            props.combat.playerAttack.dc ?? "?"
          }`}
          meta={props.combat.playerAttack.success ? "Hit" : "Miss"}
        />
        <LabelledOutput
          label="Foe HP"
          value={String(props.combat.monsterHitPoints)}
          meta={props.combat.outcome}
        />
        {props.combat.monsterAttack
          ? (
            <LabelledOutput
              label="Foe attack"
              value={`${props.combat.monsterAttack.total} vs AC ${
                props.combat.monsterAttack.dc ?? "?"
              }`}
              meta={props.combat.monsterAttack.success ? "Hit" : "Miss"}
            />
          )
          : null}
      </div>
      <p>{props.combat.log.join(" ")}</p>
    </Notice>
  );
}

function ActionDetails(props: { roll?: RollResult; combat?: CombatRoundResult }) {
  return (
    <details className="gamebook-details-card">
      <summary className="button" data-size="compact" data-variant="ghost">
        <Icon name="dice" /> Action details
      </summary>
      <div className="gamebook-details-body">
        {props.roll ? <RollSummary roll={props.roll} /> : null}
        {props.combat ? <CombatSummary combat={props.combat} /> : null}
      </div>
    </details>
  );
}

function EncounterStatus(props: {
  adventure: Adventure;
  encounterId: string;
  state: GameState;
}) {
  const encounter = props.adventure.encounters?.find((item) =>
    item.id === props.encounterId
  );
  const encounterState = props.state.encounters[props.encounterId];
  if (!encounter || !encounterState) {
    return null;
  }

  return (
    <Notice heading="Encounter status" tone={encounterState.defeated ? "success" : "info"}>
      {encounter.name}: {encounterState.hitPoints}/{encounter.hitPoints} HP, round{" "}
      {encounterState.rounds}
      {encounterState.defeated ? ", defeated." : "."}
    </Notice>
  );
}

function StateStrip(props: { state: GameState }) {
  return (
    <div className="gamebook-status-strip" aria-label="Character status">
      <LabelledOutput label="HP" value={hitPointSummary(props.state)} />
      <LabelledOutput label="Class" value={props.state.character.class} />
      <LabelledOutput label="Ancestry" value={props.state.character.race} />
    </div>
  );
}

function CharacterSheet(props: { adventure: Adventure; state: GameState }) {
  const character = props.state.character;
  return (
    <details className="gamebook-details-card gamebook-character-sheet">
      <summary className="button" data-size="compact" data-variant="ghost">
        <Icon name="document" /> Character
      </summary>
      <div className="gamebook-details-body" role="group" aria-label="Character sheet">
        <div className="gamebook-output-grid">
          <LabelledOutput label="Armour class" value={String(character.armourClass)} />
          <LabelledOutput label="Level" value={String(character.level)} />
          <LabelledOutput
            label="Proficiency"
            value={`+${character.proficiencyBonus}`}
          />
        </div>
        <MetadataList
          items={[
            {
              label: "Attack",
              value: `${character.attack.name} +${character.attack.attackBonus}, ${
                damageNotation(character.attack.damage)
              }`,
            },
            {
              label: "Abilities",
              value: abilitySummary(character),
            },
            {
              label: "Trained skills",
              value: character.skillProficiencies.join(", ") || "None",
            },
            {
              label: "Conditions",
              value: props.state.conditions.join(", ") || "None",
            },
            { label: "Inventory", value: itemList(props.adventure, props.state.inventory) },
            {
              label: "Discoveries",
              value: discoveryList(props.adventure, props.state.flags),
            },
          ]}
        />
      </div>
    </details>
  );
}

function ActionLog(props: { state: GameState }) {
  const entries = props.state.log.slice(-4).reverse();
  return (
    <details className="gamebook-details-card gamebook-action-log">
      <summary className="button" data-size="compact" data-variant="ghost">
        <Icon name="clock" /> Recent events
      </summary>
      <div className="gamebook-details-body">
        <TimelineList
          items={entries.map((entry) => ({
            label: entry.message,
            time: entry.createdAt,
            meta: shortTime(entry.createdAt),
          }))}
        />
      </div>
    </details>
  );
}

function hitPointSummary(state: GameState): string {
  const summary = `${state.hitPoints}/${state.character.maxHitPoints}`;
  return state.temporaryHitPoints > 0
    ? `${summary} (+${state.temporaryHitPoints} temp)`
    : summary;
}

function RollSummary(props: { roll: RollResult }) {
  return (
    <Notice heading="Roll result" tone={props.roll.success ? "success" : "info"}>
      <div className="gamebook-output-grid">
        <LabelledOutput label="Rolls" value={props.roll.rolls.join(", ")} />
        <LabelledOutput label="Kept" value={String(props.roll.kept)} />
        <LabelledOutput
          label="Total"
          value={String(props.roll.total)}
          meta={props.roll.dc === undefined ? undefined : `DC ${props.roll.dc}`}
        />
      </div>
      <p>
        {props.roll.reason ?? "Check"}
        {props.roll.success === undefined
          ? "."
          : props.roll.success
          ? ": success."
          : ": failure."}
      </p>
    </Notice>
  );
}

function abilitySummary(character: Character): string {
  return Object.entries(character.abilityScores).map(([ability, score]) => {
    const modifier = abilityModifier(score);
    return `${ability.slice(0, 3)} ${score} (${modifier >= 0 ? "+" : ""}${modifier})`;
  }).join(", ");
}

function damageNotation(damage: Character["attack"]["damage"]): string {
  return `${damage.dice}d${damage.sides}${damage.modifier >= 0 ? "+" : ""}${
    damage.modifier
  } ${damage.type}`;
}

function shortTime(value: string): string {
  return new Date(value).toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
}
