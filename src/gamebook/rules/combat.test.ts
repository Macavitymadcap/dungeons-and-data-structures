import { expect, test } from "bun:test";
import { Encounter, GameState } from "../model.ts";
import { createCharacter } from "./character.ts";
import { applyCombatRound, resolveCombatRound } from "./combat.ts";

const encounter: Encounter = {
  id: "door-guardian",
  name: "Door Guardian",
  armourClass: 12,
  hitPoints: 6,
  attack: {
    name: "Club",
    attackBonus: 3,
    damage: { dice: 1, sides: 4, modifier: 1, type: "bludgeoning" },
  },
};

test("combat resolves player hit and monster defeat", () => {
  const state = testState({ hitPoints: 12, monsterHitPoints: 6 });
  const rolls = sequence([0.95, 0.5]);

  const result = resolveCombatRound({ encounter, state, rng: rolls });

  expect(result.outcome).toBe("victory");
  expect(result.round).toBe(1);
  expect(result.playerAttack.success).toBe(true);
  expect(result.playerDamage?.total).toBe(8);
  expect(result.monsterHitPoints).toBe(0);
  expect(result.monsterAttack).toBeUndefined();
});

test("combat resolves miss and monster counterattack", () => {
  const state = testState({ hitPoints: 12, monsterHitPoints: 6 });
  const rolls = sequence([0, 0.95, 0.5]);

  const result = resolveCombatRound({ encounter, state, rng: rolls });

  expect(result.outcome).toBe("continue");
  expect(result.playerAttack.success).toBe(false);
  expect(result.monsterAttack?.success).toBe(true);
  expect(result.monsterDamage?.total).toBe(4);
  expect(result.playerHitPoints).toBe(8);
});

test("combat can defeat the player", () => {
  const state = testState({ hitPoints: 2, monsterHitPoints: 6 });
  const rolls = sequence([0, 0.95, 0.5]);

  const result = resolveCombatRound({ encounter, state, rng: rolls });

  expect(result.outcome).toBe("defeat");
  expect(result.playerHitPoints).toBe(0);
});

test("combat round updates state encounter and player hit points", () => {
  const state = testState({ hitPoints: 12, monsterHitPoints: 6 });
  const result = resolveCombatRound({
    encounter,
    state,
    rng: sequence([0.95, 0.5]),
  });

  const updated = applyCombatRound(state, result);

  expect(updated.hitPoints).toBe(12);
  expect(updated.encounters["door-guardian"]).toEqual({
    hitPoints: 0,
    defeated: true,
    rounds: 1,
  });
});

test("combat round count increments from existing encounter state", () => {
  const state = testState({ hitPoints: 12, monsterHitPoints: 6, rounds: 3 });

  const result = resolveCombatRound({
    encounter,
    state,
    rng: sequence([0, 0]),
  });

  const updated = applyCombatRound(state, result);

  expect(result.round).toBe(4);
  expect(updated.encounters["door-guardian"].rounds).toBe(4);
});

function testState(input: {
  hitPoints: number;
  monsterHitPoints: number;
  rounds?: number;
}): GameState {
  const character = createCharacter("hero-1", "Adventurer", "fighter");
  return {
    schema: "dads-gamebook-save",
    version: 1,
    adventureId: "test",
    currentPassageId: "guardian-clash",
    character,
    hitPoints: input.hitPoints,
    temporaryHitPoints: 0,
    conditions: [],
    inventory: [...character.inventory],
    flags: [],
    log: [],
    encounters: {
      "door-guardian": {
        hitPoints: input.monsterHitPoints,
        defeated: false,
        rounds: input.rounds ?? 0,
      },
    },
    updatedAt: new Date("2026-05-23T12:00:00.000Z").toISOString(),
  };
}

function sequence(values: number[]) {
  return () => values.shift() ?? 0;
}
