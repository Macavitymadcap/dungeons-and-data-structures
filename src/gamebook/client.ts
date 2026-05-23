import { createPassageMap } from "./graph.ts";
import { Adventure, CharacterClass, GameState } from "./model.ts";
import { resolveChoice } from "./play.ts";
import { renderPassage } from "./render.ts";
import { createCharacter } from "./rules/character.ts";
import {
  createInitialState,
  loadGame,
  resetGame,
  saveGame,
  SAVE_KEY,
} from "./state.ts";

interface BootData {
  adventure: Adventure;
  state: GameState;
}

const storage = window.localStorage;
const bootData = readBootData();
const passageRoot = document.querySelector<HTMLElement>("#gamebook-passage");
const saveStatus = document.querySelector<HTMLElement>("#gamebook-save-status");

if (bootData && passageRoot) {
  const loaded = loadGame(storage, SAVE_KEY);
  let state = loaded.ok && loaded.state.adventureId === bootData.adventure.id
    ? loaded.state
    : bootData.state;

  saveGame(storage, state);
  renderCurrentState(
    bootData.adventure,
    state,
    passageRoot,
    loaded.ok ? "Continued saved game." : "Started a new game.",
  );

  document.body.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }

    if (form.classList.contains("gamebook-new-game")) {
      event.preventDefault();
      const formData = new FormData(form);
      const characterClass = normaliseCharacterClass(formData.get("class"));
      state = createInitialState(
        bootData.adventure,
        createCharacter("hero-1", "Adventurer", characterClass),
      );
      saveGame(storage, state);
      renderCurrentState(
        bootData.adventure,
        state,
        passageRoot,
        `Started a new ${characterClass} game.`,
      );
      return;
    }

    if (!form.classList.contains("gamebook-choice")) return;

    event.preventDefault();
    const formData = new FormData(form);
    const choiceId = formData.get("choiceId");
    if (typeof choiceId !== "string") {
      return;
    }

    const passage = createPassageMap(bootData.adventure.passages).get(state.currentPassageId);
    const choice = passage?.choices.find((item) => item.id === choiceId);
    if (!choice) {
      passageRoot.innerHTML =
        `<section class="notice" data-tone="danger" role="alert"><div class="notice-body">Choice not found.</div></section>`;
      return;
    }

    const result = resolveChoice(state, choice);
    if (result.error) {
      passageRoot.innerHTML =
        `<section class="notice" data-tone="danger" role="alert"><div class="notice-body">${result.error}</div></section>`;
      return;
    }

    state = result.state;
    saveGame(storage, state);
    renderCurrentState(bootData.adventure, state, passageRoot, "Progress saved.", result.roll);
  });

  document.querySelector("#gamebook-reset")?.addEventListener("click", () => {
    resetGame(storage);
    state = bootData.state;
    renderCurrentState(
      bootData.adventure,
      state,
      passageRoot,
      "Saved game reset.",
    );
  });
}

function readBootData(): BootData | null {
  const element = document.querySelector<HTMLScriptElement>("#gamebook-data");
  if (!element?.textContent) {
    return null;
  }

  return JSON.parse(element.textContent) as BootData;
}

function renderCurrentState(
  adventure: Adventure,
  state: GameState,
  target: HTMLElement,
  status: string,
  roll?: Parameters<typeof renderPassage>[2],
): void {
  target.innerHTML = renderPassage(adventure, state, roll);
  if (saveStatus) {
    saveStatus.textContent = status;
  }
}

function normaliseCharacterClass(value: FormDataEntryValue | null): CharacterClass {
  if (
    value === "fighter" || value === "rogue" || value === "wizard" ||
    value === "cleric"
  ) {
    return value;
  }
  return "fighter";
}
