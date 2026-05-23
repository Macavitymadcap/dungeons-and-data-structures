import {
  CombatRoundResult,
  Encounter,
  EncounterState,
  GameState,
} from "../model.ts";
import { RandomSource, rollD20Check, rollDamage } from "./dice.ts";

export interface ResolveCombatRoundInput {
  encounter: Encounter;
  state: GameState;
  rng?: RandomSource;
}

export function resolveCombatRound({
  encounter,
  state,
  rng = Math.random,
}: ResolveCombatRoundInput): CombatRoundResult {
  const existingEncounter = state.encounters[encounter.id] ??
    initialEncounterState(encounter);
  const round = existingEncounter.rounds + 1;
  const log: string[] = [];

  const playerAttack = rollD20Check({
    modifier: state.character.attack.attackBonus,
    dc: encounter.armourClass,
    reason: state.character.attack.name,
    rng,
  });

  let monsterHitPoints = existingEncounter.hitPoints;
  let playerDamage;
  if (playerAttack.success) {
    playerDamage = rollDamage(state.character.attack.damage, rng);
    monsterHitPoints = Math.max(0, monsterHitPoints - playerDamage.total);
    log.push(
      `${state.character.attack.name} hits ${encounter.name} for ${playerDamage.total} ${playerDamage.type} damage.`,
    );
  } else {
    log.push(`${state.character.attack.name} misses ${encounter.name}.`);
  }

  if (monsterHitPoints <= 0) {
    log.push(`${encounter.name} is defeated.`);
    return {
      encounterId: encounter.id,
      round,
      playerAttack,
      playerDamage,
      monsterHitPoints,
      playerHitPoints: state.hitPoints,
      outcome: "victory",
      log,
    };
  }

  const monsterAttack = rollD20Check({
    modifier: encounter.attack.attackBonus,
    dc: state.character.armourClass,
    reason: encounter.attack.name,
    rng,
  });

  let playerHitPoints = state.hitPoints;
  let monsterDamage;
  if (monsterAttack.success) {
    monsterDamage = rollDamage(encounter.attack.damage, rng);
    playerHitPoints = Math.max(0, playerHitPoints - monsterDamage.total);
    log.push(
      `${encounter.name}'s ${encounter.attack.name} hits for ${monsterDamage.total} ${monsterDamage.type} damage.`,
    );
  } else {
    log.push(`${encounter.name}'s ${encounter.attack.name} misses.`);
  }

  return {
    encounterId: encounter.id,
    round,
    playerAttack,
    playerDamage,
    monsterAttack,
    monsterDamage,
    monsterHitPoints,
    playerHitPoints,
    outcome: playerHitPoints <= 0 ? "defeat" : "continue",
    log,
  };
}

export function applyCombatRound(
  state: GameState,
  result: CombatRoundResult,
): GameState {
  return {
    ...state,
    hitPoints: result.playerHitPoints,
    encounters: {
      ...state.encounters,
      [result.encounterId]: {
        hitPoints: result.monsterHitPoints,
        defeated: result.outcome === "victory",
        rounds: result.round,
      },
    },
  };
}

function initialEncounterState(encounter: Encounter): EncounterState {
  return {
    hitPoints: encounter.hitPoints,
    defeated: false,
    rounds: 0,
  };
}
