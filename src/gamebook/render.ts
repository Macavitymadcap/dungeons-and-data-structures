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
    ? `<p data-ending="${escapeHtml(passage.ending)}">Ending: ${
      escapeHtml(passage.ending)
    }</p>`
    : `<menu class="button-group">${
      availableChoices.map((choice) =>
        `<li>
          <form class="gamebook-choice" action="/gamebook/choices/${
            escapeHtml(choice.id)
          }" method="post" hx-post="/gamebook/choices/${
            escapeHtml(choice.id)
          }" hx-target="#gamebook-passage" hx-swap="innerHTML">
            <input type="hidden" name="state" value="${escapeHtml(JSON.stringify(state))}" />
            <input type="hidden" name="choiceId" value="${escapeHtml(choice.id)}" />
            ${authorMode ? `<input type="hidden" name="authorMode" value="1" />` : ""}
            <button class="button" type="submit" data-size="default" data-variant="outline">${
              escapeHtml(choice.text)
            }</button>
          </form>
        </li>`
      ).join("")
    }</menu>`;

  return `<section class="panel" data-width="default" aria-labelledby="${
    escapeHtml(passage.id)
  }-title">
    <article data-passage-id="${escapeHtml(passage.id)}">
      <h2 id="${escapeHtml(passage.id)}-title">${escapeHtml(passage.title)}</h2>
      <p>${escapeHtml(passage.body)}</p>
      ${renderStateSummary(adventure, state)}
      ${passage.encounterId ? renderEncounterStatus(adventure, passage.encounterId, state) : ""}
      ${roll ? renderRollSummary(roll) : ""}
      ${combat ? renderCombatSummary(combat) : ""}
      ${authorMode ? renderDebugPanel(adventure, state) : ""}
      ${choices}
    </article>
  </section>`;
}

function renderDebugPanel(adventure: Adventure, state: GameState): string {
  return `<section class="panel" data-width="default" data-author-debug="true" aria-labelledby="debug-state-title">
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
  </section>`;
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

function renderStateSummary(adventure: Adventure, state: GameState): string {
  return `<dl class="metadata-list">
    <div class="metadata-list-row"><dt>Class</dt><dd>${escapeHtml(state.character.class)}</dd></div>
    <div class="metadata-list-row"><dt>Ancestry</dt><dd>${escapeHtml(state.character.race)}</dd></div>
    <div class="metadata-list-row"><dt>HP</dt><dd>${state.hitPoints}/${
    state.character.maxHitPoints
  }</dd></div>
    <div class="metadata-list-row"><dt>Conditions</dt><dd>${
    escapeHtml(state.conditions.join(", ") || "None")
  }</dd></div>
    <div class="metadata-list-row"><dt>Inventory</dt><dd>${
    escapeHtml(itemList(adventure, state.inventory))
  }</dd></div>
    <div class="metadata-list-row"><dt>Discoveries</dt><dd>${
    escapeHtml(discoveryList(adventure, state.flags))
  }</dd></div>
  </dl>`;
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
