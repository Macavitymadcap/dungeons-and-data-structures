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
