import { createPassageMap } from "./graph.ts";
import { discoveryList, itemList } from "./catalog.ts";
import {
  Adventure,
  CombatRoundResult,
  GameState,
  Passage,
  RollResult,
} from "./model.ts";
import { isChoiceAvailable } from "./state.ts";

export function renderPassage(
  adventure: Adventure,
  state: GameState,
  roll?: RollResult,
  combat?: CombatRoundResult,
  authorMode = false,
): string {
  const passage = createPassageMap(adventure.passages).get(state.currentPassageId);
  if (!passage) {
    return `<section class="notice" data-tone="danger" role="alert"><div class="notice-body">Current passage could not be found.</div></section>`;
  }

  return renderPassagePanel(adventure, passage, state, roll, combat, authorMode);
}

function renderPassagePanel(
  adventure: Adventure,
  passage: Passage,
  state: GameState,
  roll?: RollResult,
  combat?: CombatRoundResult,
  authorMode = false,
): string {
  const availableChoices = passage.choices.filter((choice) =>
    isChoiceAvailable(choice, state)
  );
  const choices = passage.ending
    ? `<section class="notice" data-tone="success" role="status">
        <h2>Ending</h2>
        <div class="notice-body"><span data-ending="${escapeHtml(passage.ending)}">${
      escapeHtml(passage.ending)
    }</span></div>
      </section>`
    : `<fieldset class="button-group gamebook-choice-list">
      <legend>Choices</legend>${
      availableChoices.map((choice) =>
        `<form class="gamebook-choice" action="/gamebook/choices/${
          escapeHtml(choice.id)
        }" method="post" hx-post="/gamebook/choices/${
          escapeHtml(choice.id)
        }" hx-target="#gamebook-passage" hx-swap="innerHTML">
          <input type="hidden" name="state" value="${escapeHtml(JSON.stringify(state))}" />
          <input type="hidden" name="choiceId" value="${escapeHtml(choice.id)}" />
          ${authorMode ? `<input type="hidden" name="authorMode" value="1" />` : ""}
          <button class="button" type="submit" data-size="default" data-variant="outline">${
          iconMarkup("book")
        } ${
          escapeHtml(choice.text)
        }</button>
        </form>`
      ).join("")
    }</fieldset>`;

  return `<section class="card gamebook-passage-card" aria-labelledby="${
    escapeHtml(passage.id)
  }-title">
    <article data-passage-id="${escapeHtml(passage.id)}">
      <div class="gamebook-passage-kicker">${
    (passage.tags ?? []).slice(0, 3).map((tag) => `<span class="badge">${escapeHtml(tag)}</span>`)
      .join("")
  }</div>
      <h2 id="${escapeHtml(passage.id)}-title">${escapeHtml(passage.title)}</h2>
      <p>${escapeHtml(passage.body)}</p>
      ${renderStateStrip(state)}
      ${renderCharacterSheet(adventure, state)}
      ${passage.encounterId ? renderEncounterStatus(adventure, passage.encounterId, state) : ""}
      ${roll ? renderRollSummary(roll) : ""}
      ${combat ? renderCombatSummary(combat) : ""}
      ${authorMode ? renderDebugPanel(adventure, state) : ""}
      ${choices}
    </article>
  </section>`;
}

function renderDebugPanel(adventure: Adventure, state: GameState): string {
  return `<details class="gamebook-popover gamebook-debug-popover" data-author-debug="true">
    <summary class="button" data-size="compact" data-variant="ghost">Debug</summary>
    <section class="gamebook-popover-panel" aria-labelledby="debug-state-title">
    <h2 id="debug-state-title">Debug state</h2>
    <dl class="metadata-list">
      <div class="metadata-list-row"><dt>Passage ID</dt><dd>${escapeHtml(state.currentPassageId)}</dd></div>
      <div class="metadata-list-row"><dt>Flag IDs</dt><dd>${escapeHtml(state.flags.join(", ") || "None")}</dd></div>
      <div class="metadata-list-row"><dt>Item IDs</dt><dd>${escapeHtml(state.inventory.join(", ") || "Empty")}</dd></div>
      <div class="metadata-list-row"><dt>Encounter state</dt><dd>${escapeHtml(encounterDebugText(state))}</dd></div>
      <div class="metadata-list-row"><dt>Log entries</dt><dd>${String(state.log.length)}</dd></div>
    </dl>
    <h3>Recent log</h3>
    <ol data-debug-log="recent">
      ${state.log.slice(-5).map((entry) => `<li>${escapeHtml(entry.message)}</li>`).join("")}
    </ol>
    <form class="gamebook-force-passage" action="/gamebook/passages" method="post" hx-post="/gamebook/passages" hx-target="#gamebook-passage" hx-swap="innerHTML">
      <input type="hidden" name="authorMode" value="1" />
      <input type="hidden" name="state" value="${escapeHtml(JSON.stringify(state))}" />
      <label for="debug-force-passage">Force passage</label>
      <select id="debug-force-passage" name="passageId">
        ${adventure.passages.map((passage) =>
          `<option value="${escapeHtml(passage.id)}"${
            passage.id === state.currentPassageId ? " selected" : ""
          }>${escapeHtml(`${passage.title} (${passage.id})`)}</option>`
        ).join("")}
      </select>
      <button class="button" type="submit" data-size="default" data-variant="outline">Go</button>
    </form>
    </section>
  </details>`;
}

function encounterDebugText(state: GameState): string {
  const entries = Object.entries(state.encounters).map(([id, encounter]) =>
    `${id}: ${encounter.hitPoints} HP, round ${encounter.rounds}${
      encounter.defeated ? ", defeated" : ""
    }`
  );
  return entries.join("; ") || "None";
}

function renderCombatSummary(combat: CombatRoundResult): string {
  const tone = combat.outcome === "victory" ? "success" : "info";
  return `<section class="notice" data-tone="${tone}" role="status">
    <h2>Combat round</h2>
    <div class="notice-body">Round ${combat.round}: ${escapeHtml(combat.log.join(" "))}</div>
  </section>`;
}

function renderEncounterStatus(
  adventure: Adventure,
  encounterId: string,
  state: GameState,
): string {
  const encounter = adventure.encounters?.find((item) => item.id === encounterId);
  const encounterState = state.encounters[encounterId];
  if (!encounter || !encounterState) {
    return "";
  }
  const tone = encounterState.defeated ? "success" : "info";
  return `<section class="notice" data-tone="${tone}" role="status">
    <h2>Encounter status</h2>
    <div class="notice-body">${escapeHtml(encounter.name)}: ${encounterState.hitPoints}/${encounter.hitPoints} HP, round ${encounterState.rounds}${encounterState.defeated ? ", defeated." : "."}</div>
  </section>`;
}

function renderStateStrip(state: GameState): string {
  return `<div class="gamebook-status-strip" aria-label="Character status">
    ${labelledOutput("HP", hitPointSummary(state))}
    ${labelledOutput("Class", state.character.class)}
    ${labelledOutput("Ancestry", state.character.race)}
  </div>`;
}

function renderCharacterSheet(adventure: Adventure, state: GameState): string {
  return `<details class="gamebook-popover">
    <summary class="button" data-size="compact" data-variant="ghost">Character</summary>
    <div class="gamebook-popover-panel" role="group" aria-label="Character sheet">
      <div class="gamebook-output-grid">
        ${labelledOutput("Armour class", String(state.character.armourClass))}
        ${labelledOutput("Level", String(state.character.level))}
        ${labelledOutput("Proficiency", `+${state.character.proficiencyBonus}`)}
      </div>
      <dl class="metadata-list">
        <div class="metadata-list-row"><dt>Conditions</dt><dd>${
    escapeHtml(state.conditions.join(", ") || "None")
  }</dd></div>
        <div class="metadata-list-row"><dt>Inventory</dt><dd>${
    escapeHtml(itemList(adventure, state.inventory))
  }</dd></div>
        <div class="metadata-list-row"><dt>Discoveries</dt><dd>${
    escapeHtml(discoveryList(adventure, state.flags))
  }</dd></div>
      </dl>
    </div>
  </details>`;
}

function labelledOutput(label: string, value: string): string {
  return `<div class="labelled-output">
    <output class="labelled-output-label">${escapeHtml(label)}</output>
    <output class="labelled-output-value">${escapeHtml(value)}</output>
  </div>`;
}

function iconMarkup(name: string): string {
  return `<span aria-hidden="true" class="icon icon-neutral" data-icon="${escapeHtml(name)}">${iconSvg(name)}</span>`;
}

function iconSvg(name: string): string {
  if (name === "book") {
    return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><path d="M4 5.5c3 0 5 .7 8 2.2 3-1.5 5-2.2 8-2.2v12c-3 0-5 .7-8 2.2-3-1.5-5-2.2-8-2.2z" fill="none" stroke="currentColor" stroke-linejoin="round" stroke-width="2"></path></svg>`;
  }
  return `<svg aria-hidden="true" focusable="false" viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.25" fill="none" stroke="currentColor" stroke-width="2.5"></circle></svg>`;
}

function hitPointSummary(state: GameState): string {
  const summary = `${state.hitPoints}/${state.character.maxHitPoints}`;
  return state.temporaryHitPoints > 0
    ? `${summary} (+${state.temporaryHitPoints} temp)`
    : summary;
}

function renderRollSummary(roll: RollResult): string {
  const tone = roll.success ? "success" : "info";
  const outcome = roll.success === undefined
    ? "."
    : roll.success
    ? ": success."
    : ": failure.";

  return `<section class="notice" data-tone="${tone}" role="status">
    <h2>Roll result</h2>
    <div class="notice-body">Rolled ${
    roll.rolls.join(", ")
  }; kept ${roll.kept}; total ${roll.total}${
    roll.dc === undefined ? "" : ` against DC ${roll.dc}`
  }${outcome}</div>
  </section>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
