import { expect, test } from "bun:test";
import { mtGraphnorAdventure } from "./content/mt-graphnor.ts";
import { createCharacter } from "./rules/character.ts";
import {
  applyChoiceEffects,
  createInitialState,
  isChoiceAvailable,
  loadGame,
  resetGame,
  saveGame,
  StorageAdapter,
} from "./state.ts";

test("initial state creates a versioned save document", () => {
  const now = new Date("2026-05-23T12:00:00.000Z");
  const character = createCharacter("hero-1", "Ash", "fighter");
  const state = createInitialState(mtGraphnorAdventure, character, now);

  expect(state.schema).toBe("dads-gamebook-save");
  expect(state.version).toBe(1);
  expect(state.currentPassageId).toBe("entrance");
  expect(state.hitPoints).toBe(character.maxHitPoints);
  expect(state.updatedAt).toBe(now.toISOString());
});

test("choice requirements can gate by inventory and flags", () => {
  const character = createCharacter("hero-1", "Ash", "fighter");
  const state = createInitialState(mtGraphnorAdventure, character);
  const choice = {
    id: "use-key",
    text: "Use key",
    targetId: "next",
    requires: {
      itemsAll: ["brass-key"],
      flagsAll: ["puzzle-solved"],
    },
  };

  expect(isChoiceAvailable(choice, state)).toBe(false);
  const updated = applyChoiceEffects(state, {
    addItems: ["brass-key"],
    setFlags: ["puzzle-solved"],
  });
  expect(isChoiceAvailable(choice, updated)).toBe(true);
});

test("choice effects update inventory, flags, hit points, and timestamp", () => {
  const now = new Date("2026-05-23T12:00:00.000Z");
  const character = createCharacter("hero-1", "Ash", "rogue");
  const state = createInitialState(mtGraphnorAdventure, character, now);
  const updated = applyChoiceEffects(state, {
    addItems: ["brass-key"],
    removeItems: ["ration"],
    setFlags: ["puzzle-solved"],
    damage: 2,
  }, new Date("2026-05-23T12:01:00.000Z"));

  expect(updated.inventory.includes("brass-key")).toBe(true);
  expect(updated.inventory.includes("ration")).toBe(false);
  expect(updated.flags.includes("puzzle-solved")).toBe(true);
  expect(updated.hitPoints).toBe(character.maxHitPoints - 2);
  expect(updated.updatedAt).toBe("2026-05-23T12:01:00.000Z");
});

test("save and load round-trip through a storage adapter", () => {
  const storage = new MemoryStorage();
  const character = createCharacter("hero-1", "Ash", "cleric");
  const state = createInitialState(mtGraphnorAdventure, character);

  saveGame(storage, state);
  const result = loadGame(storage);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.state.currentPassageId).toBe("entrance");
    expect(result.state.character.class).toBe("cleric");
  }
});

test("load upgrades earlier saves with missing ancestry and encounter state", () => {
  const storage = new MemoryStorage();
  const character = createCharacter("hero-1", "Ash", "rogue");
  const oldSave = createInitialState(mtGraphnorAdventure, character);
  const { encounters: _encounters, character: _character, ...saveWithoutEncounters } =
    oldSave;

  storage.setItem(
    "dads-gamebook-save",
    JSON.stringify({
      ...saveWithoutEncounters,
      character: {
        id: character.id,
        name: character.name,
        class: character.class,
        level: character.level,
        abilityScores: character.abilityScores,
        maxHitPoints: character.maxHitPoints,
        armourClass: character.armourClass,
        proficiencyBonus: character.proficiencyBonus,
        skillProficiencies: character.skillProficiencies,
        inventory: character.inventory,
      },
    }),
  );

  const result = loadGame(storage, "dads-gamebook-save", mtGraphnorAdventure);

  expect(result.ok).toBe(true);
  if (result.ok) {
    expect(result.state.character.race).toBe("human");
    expect(result.state.character.attack.name).toBe("Shortsword");
    expect(result.state.encounters["door-guardian"]).toEqual({
      hitPoints: 6,
      defeated: false,
    });
  }
});

test("load rejects saves with invalid character classes", () => {
  const storage = new MemoryStorage();
  const character = createCharacter("hero-1", "Ash", "cleric");
  const state = createInitialState(mtGraphnorAdventure, character);

  storage.setItem(
    "dads-gamebook-save",
    JSON.stringify({
      ...state,
      character: { ...state.character, class: "bard" },
    }),
  );

  const result = loadGame(storage, "dads-gamebook-save", mtGraphnorAdventure);

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBe("Saved game character is not valid.");
  }
});

test("invalid save JSON is rejected with a readable error", () => {
  const storage = new MemoryStorage();
  storage.setItem("dads-gamebook-save", "{nope");

  const result = loadGame(storage);

  expect(result.ok).toBe(false);
  if (!result.ok) {
    expect(result.error).toBe("Saved game is not valid JSON.");
  }
});

test("reset removes the saved game", () => {
  const storage = new MemoryStorage();
  storage.setItem("dads-gamebook-save", "{}");
  resetGame(storage);

  expect(storage.getItem("dads-gamebook-save")).toBeNull();
});

class MemoryStorage implements StorageAdapter {
  #values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.#values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.#values.set(key, value);
  }

  removeItem(key: string): void {
    this.#values.delete(key);
  }
}
