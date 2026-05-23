import { expect, test } from "bun:test";
import { rollD20Check, rollDie } from "./dice.ts";

test("rollDie maps a random source to an integer die result", () => {
  expect(rollDie(6, () => 0)).toBe(1);
  expect(rollDie(6, () => 0.999)).toBe(6);
});

test("d20 checks include modifier, DC, and success", () => {
  const result = rollD20Check({
    modifier: 3,
    dc: 15,
    rng: () => 0.6,
    reason: "test check",
  });

  expect(result.rolls.length).toBe(1);
  expect(result.kept).toBe(13);
  expect(result.total).toBe(16);
  expect(result.success).toBe(true);
  expect(result.reason).toBe("test check");
});

test("advantage keeps the higher d20 roll", () => {
  const rolls = [0.1, 0.9];
  const result = rollD20Check({
    mode: "advantage",
    rng: () => rolls.shift() ?? 0,
  });

  expect(result.rolls).toEqual([3, 19]);
  expect(result.kept).toBe(19);
});

test("disadvantage keeps the lower d20 roll", () => {
  const rolls = [0.1, 0.9];
  const result = rollD20Check({
    mode: "disadvantage",
    rng: () => rolls.shift() ?? 0,
  });

  expect(result.rolls).toEqual([3, 19]);
  expect(result.kept).toBe(3);
});

