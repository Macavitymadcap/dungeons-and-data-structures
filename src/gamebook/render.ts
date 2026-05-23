import { createPassageMap } from "./graph.ts";
import { Adventure, GameState, Passage, RollResult } from "./model.ts";
import { isChoiceAvailable } from "./state.ts";

export function renderPassage(
  adventure: Adventure,
  state: GameState,
  roll?: RollResult,
): string {
  const passage = createPassageMap(adventure.passages).get(state.currentPassageId);
  if (!passage) {
    return `<section class="notice" data-tone="danger" role="alert"><div class="notice-body">Current passage could not be found.</div></section>`;
  }

  return renderPassagePanel(passage, state, roll);
}

function renderPassagePanel(
  passage: Passage,
  state: GameState,
  roll?: RollResult,
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
      ${renderStateSummary(state)}
      ${roll ? renderRollSummary(roll) : ""}
      ${choices}
    </article>
  </section>`;
}

function renderStateSummary(state: GameState): string {
  return `<dl class="metadata-list">
    <div class="metadata-list-row"><dt>Class</dt><dd>${escapeHtml(state.character.class)}</dd></div>
    <div class="metadata-list-row"><dt>HP</dt><dd>${state.hitPoints}/${
    state.character.maxHitPoints
  }</dd></div>
    <div class="metadata-list-row"><dt>Inventory</dt><dd>${
    escapeHtml(state.inventory.join(", ") || "Empty")
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

