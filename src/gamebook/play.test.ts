import { expect, test } from "bun:test";
import { Choice, GameState } from "./model.ts";
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

test("condition effects append readable state-transition log entries", () => {
  const character = createCharacter("hero-1", "Ash", "cleric");
  const state = {
    ...createInitialState(mtGraphnorAdventure, character),
    currentPassageId: "trap-hall",
    conditions: ["rattled"],
  };
  const result = resolveChoice(
    state,
    {
      id: "steady-yourself",
      text: "Steady yourself",
      targetId: "trap-hall",
      effects: {
        addConditions: ["focused"],
        removeConditions: ["rattled"],
      },
    },
    {
      adventure: mtGraphnorAdventure,
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    },
  );
  const messages = result.state.log.map((entry) => entry.message);

  expect(result.error).toBeUndefined();
  expect(result.state.conditions).toEqual(["focused"]);
  expect(messages).toContain("Condition gained: focused.");
  expect(messages).toContain("Condition cleared: rattled.");
});

test("temporary hit point effects append readable state-transition log entries", () => {
  const character = createCharacter("hero-1", "Ash", "cleric");
  const state = {
    ...createInitialState(mtGraphnorAdventure, character),
    currentPassageId: "trap-hall",
  };
  const result = resolveChoice(
    state,
    {
      id: "ward-yourself",
      text: "Ward yourself",
      targetId: "trap-hall",
      effects: {
        temporaryHitPoints: 3,
      },
    },
    {
      adventure: mtGraphnorAdventure,
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    },
  );

  expect(result.error).toBeUndefined();
  expect(result.state.temporaryHitPoints).toBe(3);
  expect(result.state.log.map((entry) => entry.message)).toContain(
    "Gained 3 temporary hit points.",
  );
});

test("Mt. Graphnor can be completed through the puzzle-bypass victory path", () => {
  const character = createCharacter("hero-1", "Ash", "rogue", "elf");
  let state = createInitialState(mtGraphnorAdventure, character);

  state = choose(state, "sneak-guard", [0.95]).state;
  expect(state.currentPassageId).toBe("keyboard-room");

  state = choose(state, "use-tools-on-puzzle").state;
  expect(state.currentPassageId).toBe("keyboard-room-clue");

  state = choose(state, "use-clue").state;
  expect(state.currentPassageId).toBe("trap-hall");
  expect(state.inventory).toContain("brass-key");

  state = choose(state, "use-key").state;
  expect(state.currentPassageId).toBe("climax");

  state = choose(state, "use-puzzle-knowledge").state;
  expect(state.currentPassageId).toBe("reward");

  state = choose(state, "claim-reward").state;
  expect(currentEnding(state)).toBe("victory");
  expect(state.inventory).toContain("graphnor-map");
  expect(state.flags).toContain("reward-claimed");
});

test("Mt. Graphnor can be completed through both combat encounters", () => {
  const character = createCharacter("hero-1", "Ash", "fighter");
  let state = createInitialState(mtGraphnorAdventure, character);

  state = choose(state, "fight-guard").state;
  expect(state.currentPassageId).toBe("guardian-clash");

  let result = choose(state, "win-guardian", [0.95, 0.99]);
  expect(result.combat?.outcome).toBe("victory");
  state = result.state;
  expect(state.currentPassageId).toBe("keyboard-room");

  state = choose(state, "answer-puzzle").state;
  state = choose(state, "use-key").state;
  expect(state.currentPassageId).toBe("climax");

  result = choose(state, "fight-climax", [0.95, 0.99]);
  expect(result.combat?.outcome).toBe("victory");
  state = result.state;
  expect(state.currentPassageId).toBe("reward");

  state = choose(state, "leave-hook").state;
  expect(currentEnding(state)).toBe("cliffhanger");
});

test("Mt. Graphnor has a reachable trap failure path", () => {
  const character = createCharacter("hero-1", "Ash", "wizard");
  let state = {
    ...createInitialState(mtGraphnorAdventure, character),
    currentPassageId: "trap-hall",
  };

  const result = choose(state, "dodge-trap", [0]);
  expect(result.roll?.success).toBe(false);
  state = result.state;
  expect(state.currentPassageId).toBe("trap-hit");

  state = choose(state, "fail-in-trap").state;
  expect(currentEnding(state)).toBe("failure");
});

test("Mt. Graphnor has a reachable retreat path", () => {
  const character = createCharacter("hero-1", "Ash", "cleric");
  let state = createInitialState(mtGraphnorAdventure, character);

  state = choose(state, "fight-guard").state;
  state = choose(state, "retreat-early").state;

  expect(currentEnding(state)).toBe("retreat");
});

function choose(
  state: GameState,
  choiceId: string,
  rolls: number[] = [],
): ReturnType<typeof resolveChoice> {
  const choice = findChoice(state, choiceId);
  let index = 0;
  const result = resolveChoice(state, choice, {
    adventure: mtGraphnorAdventure,
    now: () => new Date("2026-05-23T12:00:00.000Z"),
    random: () => rolls[index++] ?? 0.5,
  });

  if (result.error) {
    throw new Error(result.error);
  }

  return result;
}

function findChoice(state: GameState, choiceId: string): Choice {
  const passage = mtGraphnorAdventure.passages.find((item) =>
    item.id === state.currentPassageId
  );
  const choice = passage?.choices.find((item) => item.id === choiceId);
  if (!choice) {
    throw new Error(`Expected choice ${choiceId} in passage ${state.currentPassageId}.`);
  }

  return choice;
}

function currentEnding(state: GameState) {
  return mtGraphnorAdventure.passages.find((item) => item.id === state.currentPassageId)
    ?.ending;
}
