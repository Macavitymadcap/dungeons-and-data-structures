import { Ability, RollMode, RollResult, Skill } from "../model.ts";

export type RandomSource = () => number;

export interface D20CheckInput {
  modifier?: number;
  dc?: number;
  mode?: RollMode;
  reason?: string;
  rng?: RandomSource;
}

export interface AbilityCheckInput extends D20CheckInput {
  ability: Ability;
  skill?: Skill;
}

export function rollDie(
  sides: number,
  rng: RandomSource = Math.random,
): number {
  if (!Number.isInteger(sides) || sides < 2) {
    throw new Error("A die must have at least two integer sides.");
  }
  return Math.floor(rng() * sides) + 1;
}

export function rollD20Check(input: D20CheckInput = {}): RollResult {
  const mode = input.mode ?? "normal";
  const modifier = input.modifier ?? 0;
  const first = rollDie(20, input.rng);
  const rolls = mode === "normal" ? [first] : [first, rollDie(20, input.rng)];
  const kept = keepD20(rolls, mode);
  const total = kept + modifier;
  const success = input.dc === undefined ? undefined : total >= input.dc;

  return {
    notation: "1d20",
    rolls,
    kept,
    modifier,
    total,
    dc: input.dc,
    success,
    mode,
    reason: input.reason,
  };
}

function keepD20(rolls: number[], mode: RollMode): number {
  if (mode === "advantage") {
    return Math.max(...rolls);
  }
  if (mode === "disadvantage") {
    return Math.min(...rolls);
  }
  return rolls[0];
}
