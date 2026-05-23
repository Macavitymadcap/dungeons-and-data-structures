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

export function renderPlayerPassage(
  adventure: Adventure,
  state: GameState,
  roll?: RollResult,
  combat?: CombatRoundResult,
): string {
  const passage = createPassageMap(adventure.passages).get(state.currentPassageId);
  if (!passage) {
    return `<section class="notice" data-tone="danger" role="alert"><div class="notice-body">Current passage could not be found.</div></section>`;
  }

  return renderPassagePanel(adventure, passage, state, roll, combat);
}

function renderPassagePanel(
  adventure: Adventure,
  passage: Passage,
  state: GameState,
  roll?: RollResult,
  combat?: CombatRoundResult,
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
      ${choices}
    </article>
  </section>`;
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
