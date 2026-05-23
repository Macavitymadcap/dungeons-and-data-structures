import {
  abilityModifier,
  skillModifier,
} from "./rules/character.ts";
import { rollD20Check } from "./rules/dice.ts";
import {
  appendLog,
  applyChoiceEffects,
  isChoiceAvailable,
  moveToPassage,
} from "./state.ts";
import { Choice, GameState, RollResult } from "./model.ts";

export interface ResolveChoiceOptions {
  now?: () => Date;
  random?: () => number;
}

export interface ResolveChoiceResult {
  state: GameState;
  roll?: RollResult;
  error?: string;
}

export function resolveChoice(
  state: GameState,
  choice: Choice,
  options: ResolveChoiceOptions = {},
): ResolveChoiceResult {
  const now = options.now ?? (() => new Date());
  const random = options.random ?? Math.random;

  if (!isChoiceAvailable(choice, state)) {
    return { state, error: "That choice is not currently available." };
  }

  let nextPassageId = choice.targetId;
  let nextState = applyChoiceEffects(state, choice.effects, now());
  let roll: RollResult | undefined;

  if (choice.check) {
    const modifier = choice.check.skill
      ? skillModifier(nextState.character, choice.check.ability, choice.check.skill)
      : abilityModifier(nextState.character.abilityScores[choice.check.ability]);
    roll = rollD20Check({
      modifier,
      dc: choice.check.dc,
      mode: choice.check.mode,
      reason: choice.text,
      rng: random,
    });
    nextPassageId = roll.success
      ? choice.check.onSuccess
      : choice.check.onFailure;
    nextState = appendLog(
      nextState,
      `${choice.text}: rolled ${roll.total} against DC ${choice.check.dc}.`,
      now(),
    );
  } else {
    nextState = appendLog(nextState, choice.text, now());
  }

  if (!nextPassageId) {
    return { state, error: "Choice has no target passage." };
  }

  return {
    state: moveToPassage(nextState, nextPassageId, now()),
    roll,
  };
}

