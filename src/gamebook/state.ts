import {
  Adventure,
  Character,
  CharacterClass,
  CharacterRace,
  Choice,
  ChoiceEffect,
  ChoiceRequirement,
  EncounterState,
  GameLogEntry,
  GameState,
} from "./model.ts";
import { createCharacter } from "./rules/character.ts";

export const SAVE_KEY = "dads-gamebook-save";

export interface StorageAdapter {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export type LoadResult =
  | { ok: true; state: GameState }
  | { ok: false; error: string };

export function createInitialState(
  adventure: Adventure,
  character: Character,
  now = new Date(),
): GameState {
  return {
    schema: "dads-gamebook-save",
    version: 1,
    adventureId: adventure.id,
    currentPassageId: adventure.startPassageId,
    character,
    hitPoints: character.maxHitPoints,
    temporaryHitPoints: 0,
    conditions: [],
    inventory: [...character.inventory],
    flags: [],
    encounters: Object.fromEntries(
      (adventure.encounters ?? []).map((encounter) => [
        encounter.id,
        { hitPoints: encounter.hitPoints, defeated: false },
      ]),
    ),
    log: [
      createLogEntry("Game started.", now),
    ],
    updatedAt: now.toISOString(),
  };
}

export function isChoiceAvailable(choice: Choice, state: GameState): boolean {
  if (!choice.requires) {
    return true;
  }

  return requirementsMet(choice.requires, state);
}

export function applyChoiceEffects(
  state: GameState,
  effects: ChoiceEffect | undefined,
  now = new Date(),
): GameState {
  if (!effects) {
    return { ...state, updatedAt: now.toISOString() };
  }

  const inventory = new Set(state.inventory);
  for (const item of effects.addItems ?? []) {
    inventory.add(item);
  }
  for (const item of effects.removeItems ?? []) {
    inventory.delete(item);
  }

  const flags = new Set(state.flags);
  for (const flag of effects.setFlags ?? []) {
    flags.add(flag);
  }

  const damagedHitPoints = Math.max(0, state.hitPoints - (effects.damage ?? 0));
  const hitPoints = Math.min(
    state.character.maxHitPoints,
    damagedHitPoints + (effects.heal ?? 0),
  );

  return {
    ...state,
    hitPoints,
    inventory: [...inventory],
    flags: [...flags],
    updatedAt: now.toISOString(),
  };
}

export function moveToPassage(
  state: GameState,
  passageId: string,
  now = new Date(),
): GameState {
  return {
    ...state,
    currentPassageId: passageId,
    updatedAt: now.toISOString(),
  };
}

export function appendLog(
  state: GameState,
  message: string,
  now = new Date(),
): GameState {
  return {
    ...state,
    log: [...state.log, createLogEntry(message, now)],
    updatedAt: now.toISOString(),
  };
}

export function saveGame(
  storage: StorageAdapter,
  state: GameState,
  key = SAVE_KEY,
): void {
  storage.setItem(key, JSON.stringify(state));
}

export function loadGame(
  storage: StorageAdapter,
  key = SAVE_KEY,
  adventure?: Adventure,
): LoadResult {
  const raw = storage.getItem(key);
  if (!raw) {
    return { ok: false, error: "No saved game was found." };
  }

  try {
    return parseGame(raw, adventure);
  } catch {
    return { ok: false, error: "Saved game is not valid JSON." };
  }
}

export function parseGame(raw: string, adventure?: Adventure): LoadResult {
  try {
    const parsed = JSON.parse(raw);
    return validateGameState(parsed, adventure);
  } catch {
    return { ok: false, error: "Saved game is not valid JSON." };
  }
}

export function resetGame(storage: StorageAdapter, key = SAVE_KEY): void {
  storage.removeItem(key);
}

function requirementsMet(
  requirements: ChoiceRequirement,
  state: GameState,
): boolean {
  return allIncluded(state.flags, requirements.flagsAll) &&
    noneIncluded(state.flags, requirements.flagsNone) &&
    allIncluded(state.inventory, requirements.itemsAll) &&
    (requirements.minHitPoints === undefined ||
      state.hitPoints >= requirements.minHitPoints);
}

function allIncluded(
  values: string[],
  required: string[] | undefined,
): boolean {
  return (required ?? []).every((value) => values.includes(value));
}

function noneIncluded(
  values: string[],
  blocked: string[] | undefined,
): boolean {
  return (blocked ?? []).every((value) => !values.includes(value));
}

function createLogEntry(message: string, now: Date): GameLogEntry {
  return {
    id: `${now.getTime()}-${message.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    message,
    createdAt: now.toISOString(),
  };
}

function validateGameState(value: unknown, adventure?: Adventure): LoadResult {
  if (!isRecord(value)) {
    return { ok: false, error: "Saved game must be an object." };
  }
  if (value.schema !== "dads-gamebook-save") {
    return { ok: false, error: "Saved game schema is not recognised." };
  }
  if (value.version !== 1) {
    return { ok: false, error: "Saved game version is not supported." };
  }
  if (
    typeof value.adventureId !== "string" ||
    typeof value.currentPassageId !== "string" ||
    typeof value.hitPoints !== "number" ||
    typeof value.temporaryHitPoints !== "number" ||
    !isStringArray(value.conditions) ||
    !isStringArray(value.inventory) ||
    !isStringArray(value.flags) ||
    !Array.isArray(value.log) ||
    typeof value.updatedAt !== "string"
  ) {
    return { ok: false, error: "Saved game is missing required fields." };
  }

  const character = upgradeCharacter(value.character);
  if (!character) {
    return { ok: false, error: "Saved game character is not valid." };
  }

  const encounters = upgradeEncounters(value.encounters, adventure);
  if (!encounters) {
    return { ok: false, error: "Saved game encounters are not valid." };
  }

  return {
    ok: true,
    state: {
      ...value,
      character,
      encounters,
    } as unknown as GameState,
  };
}

function upgradeCharacter(value: unknown): Character | null {
  if (!isRecord(value)) {
    return null;
  }
  if (
    typeof value.id !== "string" ||
    typeof value.name !== "string" ||
    !isCharacterClass(value.class)
  ) {
    return null;
  }

  const race = isCharacterRace(value.race) ? value.race : "human";
  const level = typeof value.level === "number" && Number.isInteger(value.level) &&
      value.level > 0
    ? value.level
    : 1;

  return createCharacter(value.id, value.name, value.class, race, level);
}

function upgradeEncounters(
  value: unknown,
  adventure?: Adventure,
): Record<string, EncounterState> | null {
  if (!isRecord(value)) {
    if (!adventure) {
      return null;
    }
    return Object.fromEntries(
      (adventure.encounters ?? []).map((encounter) => [
        encounter.id,
        { hitPoints: encounter.hitPoints, defeated: false },
      ]),
    );
  }

  const encounters: Record<string, EncounterState> = {};
  for (const [id, encounter] of Object.entries(value)) {
    if (!isRecord(encounter)) {
      return null;
    }
    if (
      typeof encounter.hitPoints !== "number" ||
      typeof encounter.defeated !== "boolean"
    ) {
      return null;
    }
    encounters[id] = {
      hitPoints: encounter.hitPoints,
      defeated: encounter.defeated,
    };
  }

  for (const encounter of adventure?.encounters ?? []) {
    encounters[encounter.id] ??= {
      hitPoints: encounter.hitPoints,
      defeated: false,
    };
  }

  return encounters;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) &&
    value.every((item) => typeof item === "string");
}

function isCharacterClass(value: unknown): value is CharacterClass {
  return value === "fighter" || value === "rogue" || value === "wizard" ||
    value === "cleric";
}

function isCharacterRace(value: unknown): value is CharacterRace {
  return value === "human" || value === "elf" || value === "dwarf" ||
    value === "halfling";
}
