import { expect, test } from "bun:test";
import { mtGraphnorAdventure } from "./content/mt-graphnor.ts";
import { resolveChoice } from "./play.ts";
import { createCharacter } from "./rules/character.ts";
import { createInitialState } from "./state.ts";

test("combat choices skip rolls when the encounter is already defeated", () => {
  const character = createCharacter("hero-1", "Ash", "fighter");
  const state = {
    ...createInitialState(mtGraphnorAdventure, character),
    currentPassageId: "guardian-clash",
    encounters: {
      "door-guardian": { hitPoints: 0, defeated: true, rounds: 1 },
    },
  };
  const passage = mtGraphnorAdventure.passages.find((item) =>
    item.id === "guardian-clash"
  );
  const choice = passage?.choices.find((item) => item.id === "win-guardian");

  if (!choice) {
    throw new Error("Expected guardian combat choice to exist.");
  }

  const result = resolveChoice(state, choice, {
    adventure: mtGraphnorAdventure,
    random: () => {
      throw new Error("Already defeated encounters should not roll dice.");
    },
  });

  expect(result.error).toBeUndefined();
  expect(result.combat).toBeUndefined();
  expect(result.state.currentPassageId).toBe("keyboard-room");
  expect(result.state.log.at(-1)?.message).toBe(
    "Door Guardian has already been defeated.",
  );
});

test("choice effects append readable state-transition log entries", () => {
  const character = createCharacter("hero-1", "Ash", "fighter");
  const state = {
    ...createInitialState(mtGraphnorAdventure, character),
    currentPassageId: "guardian-clash",
    hitPoints: character.maxHitPoints - 3,
  };
  const passage = mtGraphnorAdventure.passages.find((item) =>
    item.id === "guardian-clash"
  );
  const choice = passage?.choices.find((item) => item.id === "catch-breath-guardian");

  if (!choice) {
    throw new Error("Expected recovery choice to exist.");
  }

  const result = resolveChoice(state, choice, {
    adventure: mtGraphnorAdventure,
    now: () => new Date("2026-05-23T12:00:00.000Z"),
  });
  const messages = result.state.log.map((entry) => entry.message);

  expect(result.error).toBeUndefined();
  expect(result.state.hitPoints).toBe(character.maxHitPoints - 1);
  expect(messages).toContain("Recovered 2 hit points.");
  expect(messages).toContain("Used ration.");
  expect(messages).toContain("Use a ration and catch your breath");
  expect(messages.indexOf("Use a ration and catch your breath")).toBeLessThan(
    messages.indexOf("Recovered 2 hit points."),
  );
  expect(messages.indexOf("Use a ration and catch your breath")).toBeLessThan(
    messages.indexOf("Used ration."),
  );
});
