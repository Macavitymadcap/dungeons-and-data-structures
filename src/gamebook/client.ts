import { createPassageMap } from "./graph.ts";
import {
  Adventure,
  CharacterClass,
  CharacterRace,
  GameState,
} from "./model.ts";
import { resolveChoice } from "./play.ts";
import { renderPassage } from "./render.ts";
import { createCharacter } from "./rules/character.ts";
import {
  createInitialState,
  loadGame,
  parseGame,
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
const saveJson = document.querySelector<HTMLTextAreaElement>("#gamebook-save-json");

if (bootData && passageRoot) {
  const loaded = loadGame(storage, SAVE_KEY, bootData.adventure);
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
      const race = normaliseCharacterRace(formData.get("race"));
      state = createInitialState(
        bootData.adventure,
        createCharacter("hero-1", "Adventurer", characterClass, race),
      );
      saveGame(storage, state);
      renderCurrentState(
        bootData.adventure,
        state,
        passageRoot,
        `Started a new ${race} ${characterClass} game.`,
      );
      return;
    }

    if (form.classList.contains("gamebook-save-import")) {
      event.preventDefault();
      const formData = new FormData(form);
      const rawSave = formData.get("save");
      if (typeof rawSave !== "string" || rawSave.trim() === "") {
        setStatus("Paste exported save JSON before importing.");
        return;
      }

      const imported = parseGame(rawSave, bootData.adventure);
      if (!imported.ok) {
        setStatus(`Import failed: ${imported.error}`);
        return;
      }
      if (imported.state.adventureId !== bootData.adventure.id) {
        setStatus("Import failed: save belongs to a different adventure.");
        return;
      }

      state = imported.state;
      saveGame(storage, state);
      renderCurrentState(
        bootData.adventure,
        state,
        passageRoot,
        "Imported saved game.",
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

    const result = resolveChoice(state, choice, { adventure: bootData.adventure });
    if (result.error) {
      passageRoot.innerHTML =
        `<section class="notice" data-tone="danger" role="alert"><div class="notice-body">${result.error}</div></section>`;
      return;
    }

    state = result.state;
    saveGame(storage, state);
    renderCurrentState(
      bootData.adventure,
      state,
      passageRoot,
      "Progress saved.",
      result.roll,
      result.combat,
    );
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

  document.querySelector("#gamebook-export")?.addEventListener("click", () => {
    if (saveJson) {
      saveJson.value = JSON.stringify(state, null, 2);
      saveJson.focus();
    }
    setStatus("Exported current save JSON.");
  });
}

function normaliseCharacterRace(value: FormDataEntryValue | null): CharacterRace {
  if (
    value === "human" || value === "elf" || value === "dwarf" ||
    value === "halfling"
  ) {
    return value;
  }
  return "human";
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
  combat?: Parameters<typeof renderPassage>[3],
): void {
  target.innerHTML = renderPassage(adventure, state, roll, combat);
  if (saveStatus) {
    setStatus(status);
  }
}

function setStatus(status: string): void {
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
