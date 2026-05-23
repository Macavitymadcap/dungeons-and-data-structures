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
