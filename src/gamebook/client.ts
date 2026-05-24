import mermaid from "mermaid";
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
  appendLog,
  createInitialState,
  loadGame,
  moveToPassage,
  parseGame,
  resetGame,
  saveGame,
  SAVE_KEY,
} from "./state.ts";

interface BootData {
  adventure: Adventure;
  authorMode?: boolean;
  state: GameState;
}

const storage = window.localStorage;
const bootData = readBootData();
const passageRoot = document.querySelector<HTMLElement>("#gamebook-passage");
const saveStatus = document.querySelector<HTMLElement>("#gamebook-save-status");
const saveJson = document.querySelector<HTMLTextAreaElement>("#gamebook-save-json");

renderMermaidDiagrams();
initAuthorTabs();

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

    if (form.classList.contains("gamebook-force-passage")) {
      event.preventDefault();
      if (!bootData.authorMode) {
        setStatus("Force navigation is only available in author mode.");
        return;
      }

      const formData = new FormData(form);
      const passageId = formData.get("passageId");
      const passage = typeof passageId === "string"
        ? createPassageMap(bootData.adventure.passages).get(passageId)
        : undefined;
      if (!passage) {
        setStatus("Forced passage could not be found.");
        return;
      }

      state = appendLog(
        moveToPassage(state, passage.id),
        `Forced passage to ${passage.id}.`,
      );
      saveGame(storage, state);
      renderCurrentState(
        bootData.adventure,
        state,
        passageRoot,
        `Forced passage to ${passage.id}.`,
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
  target.innerHTML = renderPassage(
    adventure,
    state,
    roll,
    combat,
    bootData?.authorMode ?? false,
  );
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

function renderMermaidDiagrams(): void {
  const diagrams = Array.from(document.querySelectorAll<HTMLElement>(".mermaid"));
  if (diagrams.length === 0) {
    return;
  }

  mermaid.initialize({
    securityLevel: "strict",
    startOnLoad: false,
    theme: "base",
  });
  void mermaid.run({ nodes: diagrams }).catch((error) => {
    console.error("Could not render Mermaid diagrams.", error);
  });
}

function initAuthorTabs(): void {
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>("[data-author-tab]"));
  const panels = Array.from(document.querySelectorAll<HTMLElement>("[data-author-tab-panel]"));
  if (tabs.length === 0 || panels.length === 0) {
    return;
  }

  const activate = (tabName: string) => {
    for (const tab of tabs) {
      const active = tab.dataset.authorTab === tabName;
      tab.setAttribute("aria-selected", String(active));
      tab.dataset.variant = active ? "primary" : "ghost";
    }
    for (const panel of panels) {
      panel.hidden = panel.dataset.authorTabPanel !== tabName;
    }
  };

  for (const tab of tabs) {
    tab.addEventListener("click", () => {
      const tabName = tab.dataset.authorTab;
      if (tabName) {
        activate(tabName);
      }
    });
  }
}
