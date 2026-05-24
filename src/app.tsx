import {
  AppShell,
  Badge,
  Button,
  ButtonGroup,
  Card,
  CodeBlock,
  HxForm,
  Icon,
  LabelledOutput,
  MetadataList,
  Notice,
  PageHeader,
  Panel,
  SelectField,
  Switch,
  TextareaField,
  TimelineList,
  Toolbar,
} from "@macavitymadcap/hyper-dank-ui";
import { FormValues, routeParam } from "@macavitymadcap/hyper-dank-transport";
import { Hono } from "hono";
import { discoveryList, itemList } from "./gamebook/catalog.ts";
import {
  FIVE_ROOM_TEMPLATE,
  validateFiveRoomTemplate,
} from "./gamebook/content/five-room-template.ts";
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
  EndingKind,
  GameState,
  Passage,
  PassageTag,
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

type PassageFilterValue = "all" | PassageTag | EndingKind;

const THEME_STORAGE_KEY = "dads-gamebook-theme";

const PASSAGE_FILTERS: { value: PassageFilterValue; label: string }[] = [
  { value: "all", label: "All" },
  { value: "roleplay", label: "Roleplay" },
  { value: "puzzle", label: "Puzzle" },
  { value: "trap", label: "Trap" },
  { value: "combat", label: "Combat" },
  { value: "reward", label: "Reward" },
  { value: "victory", label: "Victory" },
  { value: "failure", label: "Failure" },
  { value: "retreat", label: "Retreat" },
  { value: "cliffhanger", label: "Cliffhanger" },
];

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
        authorToolsEnabled={authorToolsEnabled}
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
  const templateIssues = validateFiveRoomTemplate(props.adventure);
  const mermaid = exportMermaid(props.adventure);
  const passageFilterCounts = countPassageFilters(props.adventure.passages);
  const audit = buildAdventureAudit(props.adventure);

  return (
    <html lang="en-GB">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Author Tools | {props.appName}</title>
        <ThemeScript />
        <link rel="stylesheet" href="/assets/hyper-dank-ui.css" />
        <link rel="stylesheet" href="/assets/gamebook.css" />
        <script type="module" src="/assets/client.js"></script>
      </head>
      <body className="gamebook-page">
        <SiteHeader appName={props.appName} currentSection="author" showAuthorLink />
        <AppShell
          className="gamebook-author-shell"
          header={
            <PageHeader
              eyebrow={props.appName}
              id="author-header"
              title="Author Tools"
              description="Static validation and graph exports for the gamebook draft."
            />
          }
        >
          <div className="gamebook-author-workspace">
            <div className="gamebook-author-tabs" role="tablist" aria-label="Author tool sections">
              <button
                type="button"
                className="button"
                data-author-tab="checks"
                data-size="compact"
                data-variant="ghost"
                role="tab"
                aria-selected="false"
                aria-controls="author-tab-checks"
                id="author-tab-checks-button"
              >
                <Icon name="check" /> Checks
              </button>
              <button
                type="button"
                className="button"
                data-author-tab="audit"
                data-size="compact"
                data-variant="ghost"
                role="tab"
                aria-selected="false"
                aria-controls="author-tab-audit"
                id="author-tab-audit-button"
              >
                <Icon name="search" /> Audit
              </button>
              <button
                type="button"
                className="button"
                data-author-tab="graph"
                data-size="compact"
                data-variant="primary"
                role="tab"
                aria-selected="true"
                aria-controls="author-tab-graph"
                id="author-tab-graph-button"
              >
                <Icon name="map" /> Graph
              </button>
              <button
                type="button"
                className="button"
                data-author-tab="previews"
                data-size="compact"
                data-variant="ghost"
                role="tab"
                aria-selected="false"
                aria-controls="author-tab-previews"
                id="author-tab-previews-button"
              >
                <Icon name="book" /> Previews
              </button>
            </div>
            <div
              className="gamebook-author-tab-panel gamebook-author-checks-grid"
              data-author-tab-panel="checks"
              id="author-tab-checks"
              role="tabpanel"
              aria-labelledby="author-tab-checks-button"
              hidden
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
              <Panel labelledBy="author-template-title">
                <section aria-labelledby="author-template-title">
                  <h2 id="author-template-title">Five-room template</h2>
                  <MetadataList
                    items={[
                      { label: "Required rooms", value: String(FIVE_ROOM_TEMPLATE.length) },
                      { label: "Template issues", value: String(templateIssues.length) },
                    ]}
                  />
                  <Notice
                    heading={templateIssues.length === 0
                      ? "Template coverage passed"
                      : "Template coverage failed"}
                    tone={templateIssues.length === 0 ? "success" : "danger"}
                  >
                    {templateIssues.length === 0
                      ? "The adventure covers every room role and required ending for the MVP template."
                      : "Review the missing room roles or endings before using this as the template adventure."}
                  </Notice>
                  <ul>
                    {FIVE_ROOM_TEMPLATE.map((room) => (
                      <li>
                        <strong>{room.tag}</strong>: {room.title}. {room.mechanicalRole}
                      </li>
                    ))}
                  </ul>
                  {templateIssues.length > 0
                    ? (
                      <ul>
                        {templateIssues.map((issue) => (
                          <li>
                            <strong>{issue.code}</strong>: {issue.message}
                          </li>
                        ))}
                      </ul>
                    )
                    : null}
                </section>
              </Panel>
            </div>
            <div
              className="gamebook-author-tab-panel"
              data-author-tab-panel="audit"
              id="author-tab-audit"
              role="tabpanel"
              aria-labelledby="author-tab-audit-button"
              hidden
            >
              <Panel labelledBy="author-audit-title">
                <section aria-labelledby="author-audit-title">
                  <h2 id="author-audit-title">Content audit</h2>
                  <div className="gamebook-author-audit-grid">
                    <LabelledOutput
                      label="Passages"
                      value={String(props.adventure.passages.length)}
                      meta="Total authored nodes"
                    />
                    <LabelledOutput
                      label="Choices"
                      value={String(audit.choiceCount)}
                      meta="Interactive routes"
                    />
                    <LabelledOutput
                      label="Checks"
                      value={String(audit.checkChoiceCount)}
                      meta="d20 resolutions"
                    />
                    <LabelledOutput
                      label="Combat choices"
                      value={String(audit.combatChoiceCount)}
                      meta="Encounter loops"
                    />
                    <LabelledOutput
                      label="Gated choices"
                      value={String(audit.gatedChoiceCount)}
                      meta="Item, flag, HP or condition requirements"
                    />
                    <LabelledOutput
                      label="State effects"
                      value={String(audit.effectChoiceCount)}
                      meta="Choices that mutate save state"
                    />
                    <LabelledOutput
                      label="Encounters"
                      value={String(props.adventure.encounters?.length ?? 0)}
                      meta={`${audit.encounterPassageCount} passage references`}
                    />
                    <LabelledOutput
                      label="Items"
                      value={String(props.adventure.items?.length ?? 0)}
                      meta={`${audit.itemTouchCount} choice references`}
                    />
                    <LabelledOutput
                      label="Discoveries"
                      value={String(props.adventure.discoveries?.length ?? 0)}
                      meta={`${audit.flagTouchCount} flag references`}
                    />
                    <LabelledOutput
                      label="Endings"
                      value={String(audit.endingCount)}
                      meta={audit.endingSummary}
                    />
                  </div>
                </section>
              </Panel>
            </div>
            <div
              className="gamebook-author-tab-panel"
              data-author-tab-panel="graph"
              id="author-tab-graph"
              role="tabpanel"
              aria-labelledby="author-tab-graph-button"
            >
              <Panel labelledBy="author-mermaid-title">
                <section aria-labelledby="author-mermaid-title">
                  <h2 id="author-mermaid-title">Mermaid passage graph</h2>
                  <div className="gamebook-mermaid-diagram mermaid">{mermaid}</div>
                  <details className="gamebook-details-card">
                    <summary className="button" data-size="compact" data-variant="ghost">
                      <Icon name="code" /> Mermaid source
                    </summary>
                    <div className="gamebook-details-body">
                      <CodeBlock code={mermaid} language="mermaid" />
                    </div>
                  </details>
                </section>
              </Panel>
            </div>
            <div
              className="gamebook-author-tab-panel"
              data-author-tab-panel="previews"
              id="author-tab-previews"
              role="tabpanel"
              aria-labelledby="author-tab-previews-button"
              hidden
            >
              <Panel labelledBy="author-preview-title">
                <section aria-labelledby="author-preview-title">
                  <h2 id="author-preview-title">Passage previews</h2>
                  <div className="gamebook-passage-filter-bar">
                    <ButtonGroup ariaLabel="Filter passage previews">
                      {PASSAGE_FILTERS.filter((filter) =>
                        filter.value === "all" || (passageFilterCounts.get(filter.value) ?? 0) > 0
                      ).map((filter) => {
                        const count = filter.value === "all"
                          ? props.adventure.passages.length
                          : passageFilterCounts.get(filter.value) ?? 0;

                        return (
                          <button
                            type="button"
                            className="button"
                            data-passage-filter={filter.value}
                            data-size="compact"
                            data-variant={filter.value === "all" ? "primary" : "ghost"}
                            aria-pressed={filter.value === "all" ? "true" : "false"}
                          >
                            {filter.label} <span aria-hidden="true">({count})</span>
                          </button>
                        );
                      })}
                    </ButtonGroup>
                    <p className="gamebook-passage-filter-count" data-passage-filter-count>
                      Showing {props.adventure.passages.length} passages.
                    </p>
                  </div>
                  <div className="gamebook-author-preview-grid">
                    {props.adventure.passages.map((passage) => (
                      <PassagePreview passage={passage} />
                    ))}
                  </div>
                </section>
              </Panel>
            </div>
          </div>
        </AppShell>
      </body>
    </html>
  );
}

interface AdventureAudit {
  checkChoiceCount: number;
  choiceCount: number;
  combatChoiceCount: number;
  effectChoiceCount: number;
  encounterPassageCount: number;
  endingCount: number;
  endingSummary: string;
  flagTouchCount: number;
  gatedChoiceCount: number;
  itemTouchCount: number;
}

function buildAdventureAudit(adventure: Adventure): AdventureAudit {
  const choices = adventure.passages.flatMap((passage) => passage.choices);
  const endings = adventure.passages.flatMap((passage) => passage.ending ? [passage.ending] : []);

  return {
    checkChoiceCount: choices.filter((choice) => choice.check).length,
    choiceCount: choices.length,
    combatChoiceCount: choices.filter((choice) => choice.combat).length,
    effectChoiceCount: choices.filter((choice) => choice.effects).length,
    encounterPassageCount: adventure.passages.filter((passage) => passage.encounterId).length,
    endingCount: endings.length,
    endingSummary: endings.length > 0 ? endings.join(", ") : "No endings",
    flagTouchCount: choices.reduce((total, choice) => total + countFlagTouches(choice), 0),
    gatedChoiceCount: choices.filter((choice) => choice.requires).length,
    itemTouchCount: choices.reduce((total, choice) => total + countItemTouches(choice), 0),
  };
}

function countFlagTouches(choice: Passage["choices"][number]): number {
  return (choice.requires?.flagsAll?.length ?? 0) +
    (choice.requires?.flagsNone?.length ?? 0) +
    (choice.effects?.setFlags?.length ?? 0);
}

function countItemTouches(choice: Passage["choices"][number]): number {
  return (choice.requires?.itemsAll?.length ?? 0) +
    (choice.effects?.addItems?.length ?? 0) +
    (choice.effects?.removeItems?.length ?? 0);
}

function countPassageFilters(passages: Passage[]): Map<PassageFilterValue, number> {
  const counts = new Map<PassageFilterValue, number>();
  for (const passage of passages) {
    for (const facet of passageFilterFacets(passage)) {
      counts.set(facet, (counts.get(facet) ?? 0) + 1);
    }
  }
  return counts;
}

function passageFilterFacets(passage: Passage): PassageFilterValue[] {
  const facets = new Set<PassageFilterValue>(passage.tags ?? []);
  if (passage.ending) {
    facets.add(passage.ending);
  }
  return [...facets];
}

function PassagePreview(props: { passage: Passage }) {
  const filterFacets = passageFilterFacets(props.passage);

  return (
    <article
      className="gamebook-author-passage-preview"
      data-passage-preview
      data-passage-filters={filterFacets.join(" ")}
    >
      <div className="gamebook-passage-kicker">
        {props.passage.tags?.map((tag) => <Badge>{tag}</Badge>)}
        {props.passage.ending ? <Badge>{props.passage.ending}</Badge> : null}
      </div>
      <h3>{props.passage.title}</h3>
      <MetadataList
        items={[
          { label: "ID", value: props.passage.id },
          { label: "Choices", value: String(props.passage.choices.length) },
          {
            label: "Encounter",
            value: props.passage.encounterId ?? "None",
          },
        ]}
      />
      <p>{props.passage.body}</p>
      {props.passage.choices.length > 0
        ? (
          <ol>
            {props.passage.choices.map((choice) => (
              <li>
                {choice.text} {"->"} {choiceTargetSummary(choice)}
              </li>
            ))}
          </ol>
        )
        : null}
    </article>
  );
}

function choiceTargetSummary(choice: Passage["choices"][number]): string {
  if (choice.targetId) {
    return choice.targetId;
  }
  if (choice.check) {
    return `${choice.check.onSuccess} / ${choice.check.onFailure}`;
  }
  if (choice.combat) {
    return `${choice.combat.onVictory} / ${choice.combat.onDefeat} / ${choice.combat.onContinue}`;
  }
  return "No target";
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
  authorToolsEnabled: boolean;
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
        <ThemeScript />
        <link rel="stylesheet" href="/assets/hyper-dank-ui.css" />
        <link rel="stylesheet" href="/assets/gamebook.css" />
        <script type="module" src="/assets/client.js"></script>
        <script src="https://unpkg.com/htmx.org@2.0.4/dist/htmx.min.js">
        </script>
      </head>
      <body className="gamebook-page">
        <SiteHeader
          appName={props.appName}
          currentSection="play"
          showAuthorLink={props.authorToolsEnabled}
        />
        <AppShell
          className="gamebook-shell"
          header={
            <PageHeader
              eyebrow={props.appName}
              id="gamebook-header"
              title={props.adventure.title}
              description="A five-room static gamebook demo."
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
            state={props.state}
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

function SiteHeader(props: {
  appName: string;
  currentSection: "author" | "play";
  showAuthorLink?: boolean;
}) {
  return (
    <header className="gamebook-site-header">
      <nav className="gamebook-site-nav" aria-label="Primary">
        <a className="gamebook-site-brand" href="/gamebook">
          <span className="gamebook-site-mark" aria-hidden="true">D</span>
          <span>
            <span className="gamebook-site-title">{props.appName}</span>
            <span className="gamebook-site-subtitle">Gamebook lab</span>
          </span>
        </a>
        <div className="gamebook-site-links">
          <Switch
            id="gamebook-theme-toggle"
            label="Colour mode"
            dataThemeToggle
            offIcon="☀"
            onIcon="☾"
            variant="compact"
          />
          <a
            className="button"
            data-size="compact"
            data-variant={props.currentSection === "play" ? "primary" : "ghost"}
            aria-current={props.currentSection === "play" ? "page" : undefined}
            href="/gamebook"
          >
            <Icon name="book" /> Play
          </a>
          {props.showAuthorLink
            ? (
              <a
                className="button"
                data-size="compact"
                data-variant={props.currentSection === "author" ? "primary" : "ghost"}
                aria-current={props.currentSection === "author" ? "page" : undefined}
                href="/gamebook/author"
              >
                <Icon name="search" /> Author
              </a>
            )
            : null}
        </div>
      </nav>
    </header>
  );
}

function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
(() => {
  const storageKey = ${JSON.stringify(THEME_STORAGE_KEY)};

  const getStoredTheme = () => {
    try {
      return window.localStorage.getItem(storageKey);
    } catch {
      return null;
    }
  };

  const storeTheme = (theme) => {
    try {
      window.localStorage.setItem(storageKey, theme);
    } catch {
    }
  };

  const getPreferredTheme = () => {
    const stored = getStoredTheme();
    if (stored === "light" || stored === "dark") return stored;

    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  };

  const syncToggle = (theme) => {
    const toggle = document.querySelector("[data-theme-toggle]");
    if (!toggle) return;

    const isDark = theme === "dark";
    toggle.checked = isDark;
    toggle.setAttribute("aria-checked", String(isDark));
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    syncToggle(theme);
  };

  applyTheme(getPreferredTheme());

  window.addEventListener("DOMContentLoaded", () => {
    const toggle = document.querySelector("[data-theme-toggle]");
    const currentTheme = document.documentElement.dataset.theme || getPreferredTheme();
    syncToggle(currentTheme);

    toggle?.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;

      event.preventDefault();
      toggle.checked = !toggle.checked;
      toggle.dispatchEvent(new Event("change", { bubbles: true }));
    });

    toggle?.addEventListener("change", () => {
      const nextTheme = toggle.checked ? "dark" : "light";
      storeTheme(nextTheme);
      applyTheme(nextTheme);
    });
  });
})();
        `,
      }}
    />
  );
}

function GameControls(props: {
  characterClass: Character["class"];
  race: Character["race"];
  state: GameState;
}) {
  return (
    <section className="gamebook-command-bar" aria-labelledby="gamebook-controls-title">
      <h2 id="gamebook-controls-title">Game controls</h2>
      <details className="gamebook-popover">
        <summary className="button" data-size="compact" data-variant="outline">
          <Icon name="settings" /> Settings
        </summary>
        <div className="gamebook-popover-panel" role="group" aria-label="Game settings">
          <div className="gamebook-popover-header">
            <h3>Settings</h3>
            <p>New games, local saves, and JSON import tools.</p>
          </div>
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
          </Toolbar>
          <h3>Save summary</h3>
          <div className="gamebook-save-summary">
            <SaveSummaryOutput
              label="Passage"
              value={props.state.currentPassageId}
              meta="Current node"
              dataAttribute="data-save-current-passage"
            />
            <SaveSummaryOutput
              label="Version"
              value={String(props.state.version)}
              meta={props.state.schema}
              dataAttribute="data-save-version"
            />
            <SaveSummaryOutput
              label="Updated"
              value={formatSaveTime(props.state.updatedAt)}
              meta="Browser local save"
              dataAttribute="data-save-updated"
            />
          </div>
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
              <Button
                type="button"
                variant="outline"
                {...{ "hx-disable": "true" }}
                id="gamebook-download-save"
              >
                <Icon name="document" /> Download JSON
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
      <Button
        type="button"
        variant="danger"
        {...{ "hx-disable": "true" }}
        id="gamebook-reset"
      >
        <Icon name="delete" /> Reset
      </Button>
    </section>
  );
}

function SaveSummaryOutput(props: {
  dataAttribute: string;
  label: string;
  meta: string;
  value: string;
}) {
  return (
    <div className="labelled-output">
      <output className="labelled-output-label">{props.label}</output>
      <output className="labelled-output-value" {...{ [props.dataAttribute]: "" }}>
        {props.value}
      </output>
      <span className="labelled-output-meta">{props.meta}</span>
    </div>
  );
}

function formatSaveTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "Unknown";
  }

  return date.toLocaleString("en-GB", {
    dateStyle: "short",
    timeStyle: "short",
  });
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
            <div className="gamebook-story-panel">
              <div className="gamebook-passage-kicker">
                {props.passage.tags?.slice(0, 3).map((tag) => <Badge>{tag}</Badge>)}
              </div>
              <h2 id={`${props.passage.id}-title`}>{props.passage.title}</h2>
              <p>{props.passage.body}</p>
            </div>
            {props.passage.ending
              ? (
                <Notice heading="Ending" tone="success">
                  <span data-ending={props.passage.ending}>{props.passage.ending}</span>
                </Notice>
              )
              : (
                <section className="gamebook-choice-panel" aria-labelledby={`${props.passage.id}-choices`}>
                  <h3 id={`${props.passage.id}-choices`}>Options</h3>
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
                </section>
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
    <details className="gamebook-details-card gamebook-encounter-status">
      <summary className="button" data-size="compact" data-variant="ghost">
        <Icon name="shield" /> Encounter
      </summary>
      <div className="gamebook-details-body">
        <Notice
          heading={encounterState.defeated ? "Encounter cleared" : "Encounter status"}
          tone={encounterState.defeated ? "success" : "info"}
        >
          <div className="gamebook-output-grid">
            <LabelledOutput label="Foe" value={encounter.name} />
            <LabelledOutput
              label="HP"
              value={`${encounterState.hitPoints}/${encounter.hitPoints}`}
            />
            <LabelledOutput label="Round" value={String(encounterState.rounds)} />
          </div>
        </Notice>
      </div>
    </details>
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
