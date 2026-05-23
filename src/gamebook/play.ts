import {
  abilityModifier,
  skillModifier,
} from "./rules/character.ts";
import { rollD20Check } from "./rules/dice.ts";
import { applyCombatRound, resolveCombatRound } from "./rules/combat.ts";
import {
  appendLog,
  applyChoiceEffects,
  isChoiceAvailable,
  moveToPassage,
} from "./state.ts";
import {
  Adventure,
  Choice,
  CombatRoundResult,
  GameState,
  RollResult,
} from "./model.ts";

export interface ResolveChoiceOptions {
  adventure?: Adventure;
  now?: () => Date;
  random?: () => number;
}

export interface ResolveChoiceResult {
  state: GameState;
  roll?: RollResult;
  combat?: CombatRoundResult;
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
  let combat: CombatRoundResult | undefined;

  if (choice.combat) {
    const encounter = options.adventure?.encounters?.find((item) =>
      item.id === choice.combat?.encounterId
    );
    if (!encounter) {
      return { state, error: `Encounter ${choice.combat.encounterId} was not found.` };
    }
    if (nextState.encounters[encounter.id]?.defeated) {
      nextState = appendLog(nextState, `${encounter.name} has already been defeated.`, now());
      nextPassageId = choice.combat.onVictory;
      return {
        state: moveToPassage(nextState, nextPassageId, now()),
      };
    }

    combat = resolveCombatRound({
      encounter,
      state: nextState,
      rng: random,
    });
    nextState = applyCombatRound(nextState, combat);
    nextState = combat.log.reduce(
      (currentState, message) => appendLog(currentState, message, now()),
      nextState,
    );
    nextPassageId = combat.outcome === "victory"
      ? choice.combat.onVictory
      : combat.outcome === "defeat"
      ? choice.combat.onDefeat
      : choice.combat.onContinue;
  } else if (choice.check) {
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
    combat,
  };
}
