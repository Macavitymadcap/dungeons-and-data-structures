// Consolidated extraction of the reconciled core listings from
// Dungeons & Data Structures, Chapters 4-14, after the "object canonical"
// damage/dice unification. Compiled with `tsc --strict` to prove the
// printed code now coheres as a single set.

// ---------------------------------------------------------------------------
// Chapter 6: dice and the canonical damage value object
// ---------------------------------------------------------------------------

type RandomSource = () => number;

function rollDie(sides: number, rng: RandomSource = Math.random): number {
  return Math.floor(rng() * sides) + 1;
}

type DamageType =
  | "bludgeoning"
  | "piercing"
  | "slashing"
  | "fire"
  | "cold"
  | "lightning"
  | "hit points";

interface DamageExpression {
  count: number;
  sides: number;
  modifier: number;
  type: DamageType;
}

interface DamageRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
}

function formatDamage(expr: DamageExpression): string {
  const dice = `${expr.count}d${expr.sides}`;
  if (expr.modifier === 0) return dice;
  return expr.modifier > 0 ? `${dice}+${expr.modifier}` : `${dice}${expr.modifier}`;
}

function rollDamage(
  expr: DamageExpression,
  rng: RandomSource = Math.random
): DamageRollResult {
  const rolls = Array.from({ length: expr.count }, () => rollDie(expr.sides, rng));
  const total = rolls.reduce((sum, die) => sum + die, 0) + expr.modifier;
  return { notation: formatDamage(expr), rolls, modifier: expr.modifier, total };
}

type RollMode = "normal" | "advantage" | "disadvantage";

interface RollResult {
  notation: string;
  rolls: number[];
  kept: number;
  modifier: number;
  total: number;
  dc?: number;
  success?: boolean;
  mode: RollMode;
  reason?: string;
}

function rollD20Check({
  modifier,
  dc,
  mode = "normal",
  reason,
  rng = Math.random,
}: {
  modifier: number;
  dc?: number;
  mode?: RollMode;
  reason?: string;
  rng?: RandomSource;
}): RollResult {
  const rollA = rollDie(20, rng);
  const rollB = mode !== "normal" ? rollDie(20, rng) : undefined;
  const rolls = rollB !== undefined ? [rollA, rollB] : [rollA];

  let kept: number;
  if (mode === "advantage") {
    kept = Math.max(rollA, rollB!);
  } else if (mode === "disadvantage") {
    kept = Math.min(rollA, rollB!);
  } else {
    kept = rollA;
  }

  const total = kept + modifier;
  const success = dc !== undefined ? total >= dc : undefined;

  const modeCode = mode === "advantage" ? "kh" : "kl";
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const notation =
    mode !== "normal" ? `2d20${modeCode}1${modifierStr}` : `1d20${modifierStr}`;

  return { notation, rolls, kept, modifier, total, dc, success, mode, reason };
}

// ---------------------------------------------------------------------------
// Chapters 4 & 5: character vocabulary and the attack profile value object
// ---------------------------------------------------------------------------

type Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

type Skill = "arcana" | "history" | "stealth" | "athletics" | "perception";

interface AttackProfile {
  name: string;
  attackBonus: number;
  damage: DamageExpression;
}

interface Character {
  id: string;
  name: string;
  level: number;
  abilityScores: Record<Ability, number>;
  maxHitPoints: number;
  armourClass: number;
  skillProficiencies: Skill[];
  inventory: string[];
  attack: AttackProfile;
}

// ---------------------------------------------------------------------------
// Chapter 7: combat as an event loop
// ---------------------------------------------------------------------------

interface EncounterState {
  hitPoints: number;
  defeated: boolean;
  rounds: number;
}

interface Encounter {
  id: string;
  name: string;
  armourClass: number;
  hitPoints: number;
  attack: AttackProfile;
}

interface GameState {
  schema: "dads-gamebook-save";
  version: 2;
  adventureId: string;
  currentPassageId: string;
  character: Character;
  hitPoints: number;
  temporaryHitPoints: number;
  conditions: string[];
  inventory: string[];
  flags: string[];
  encounters: Record<string, EncounterState>;
  log: string[];
  updatedAt: string;
}

interface CombatRoundResult {
  encounterId: string;
  round: number;
  playerAttack: RollResult;
  playerDamage?: DamageRollResult;
  monsterAttack?: RollResult;
  monsterDamage?: DamageRollResult;
  monsterHitPoints: number;
  playerHitPoints: number;
  playerTemporaryHitPoints: number;
  outcome: "victory" | "defeat" | "continue";
  log: string[];
}

interface AttackOutcome {
  attack: RollResult;
  damage?: DamageRollResult;
  log: string[];
}

function resolveAttack({
  attack,
  targetArmourClass,
  targetName,
  rng,
}: {
  attack: AttackProfile;
  targetArmourClass: number;
  targetName?: string;
  rng: RandomSource;
}): AttackOutcome {
  const attackRoll = rollD20Check({
    modifier: attack.attackBonus,
    dc: targetArmourClass,
    reason: attack.name,
    rng,
  });

  if (!attackRoll.success) {
    return {
      attack: attackRoll,
      log: [
        targetName
          ? `${attack.name} misses ${targetName}.`
          : `${attack.name} misses.`,
      ],
    };
  }

  const damage = rollDamage(attack.damage, rng);

  return {
    attack: attackRoll,
    damage,
    log: [
      targetName
        ? `${attack.name} hits ${targetName} for ${damage.total} ${attack.damage.type} damage.`
        : `${attack.name} hits for ${damage.total} ${attack.damage.type} damage.`,
    ],
  };
}

interface PlayerAttackOutcome {
  attack: RollResult;
  damage?: DamageRollResult;
  monsterHitPoints: number;
  outcome: "victory" | "continue";
  log: string[];
}

function resolvePlayerAttack({
  encounter,
  state,
  monsterHitPoints,
  rng,
}: {
  encounter: Encounter;
  state: GameState;
  monsterHitPoints: number;
  rng: RandomSource;
}): PlayerAttackOutcome {
  const result = resolveAttack({
    attack: state.character.attack,
    targetArmourClass: encounter.armourClass,
    targetName: encounter.name,
    rng,
  });

  if (!result.damage) {
    return {
      attack: result.attack,
      monsterHitPoints,
      outcome: "continue",
      log: result.log,
    };
  }

  const remainingHitPoints = Math.max(0, monsterHitPoints - result.damage.total);

  if (remainingHitPoints === 0) {
    return {
      attack: result.attack,
      damage: result.damage,
      monsterHitPoints: 0,
      outcome: "victory",
      log: [...result.log, `${encounter.name} is defeated.`],
    };
  }

  return {
    attack: result.attack,
    damage: result.damage,
    monsterHitPoints: remainingHitPoints,
    outcome: "continue",
    log: result.log,
  };
}

interface MonsterAttackOutcome {
  attack: RollResult;
  damage?: DamageRollResult;
  playerHitPoints: number;
  playerTemporaryHitPoints: number;
  outcome: "defeat" | "continue";
  log: string[];
}

function resolveMonsterAttack({
  encounter,
  state,
  rng,
}: {
  encounter: Encounter;
  state: GameState;
  rng: RandomSource;
}): MonsterAttackOutcome {
  const result = resolveAttack({
    attack: encounter.attack,
    targetArmourClass: state.character.armourClass,
    rng,
  });

  let playerHitPoints = state.hitPoints;
  let playerTemporaryHitPoints = state.temporaryHitPoints;

  if (!result.damage) {
    return {
      attack: result.attack,
      playerHitPoints,
      playerTemporaryHitPoints,
      outcome: "continue",
      log: result.log,
    };
  }

  const absorbed = Math.min(playerTemporaryHitPoints, result.damage.total);
  playerTemporaryHitPoints -= absorbed;
  playerHitPoints = Math.max(0, playerHitPoints - (result.damage.total - absorbed));

  if (playerHitPoints === 0) {
    return {
      attack: result.attack,
      damage: result.damage,
      playerHitPoints: 0,
      playerTemporaryHitPoints: 0,
      outcome: "defeat",
      log: [...result.log, `${state.character.name} falls.`],
    };
  }

  return {
    attack: result.attack,
    damage: result.damage,
    playerHitPoints,
    playerTemporaryHitPoints,
    outcome: "continue",
    log: result.log,
  };
}

function resolveCombatRound({
  encounter,
  state,
  rng,
}: {
  encounter: Encounter;
  state: GameState;
  rng: RandomSource;
}): CombatRoundResult {
  const encounterState = state.encounters[encounter.id];
  const round = (encounterState?.rounds ?? 0) + 1;
  const monsterHitPoints = encounterState?.hitPoints ?? encounter.hitPoints;

  const playerResult = resolvePlayerAttack({
    encounter,
    state,
    monsterHitPoints,
    rng,
  });

  if (playerResult.outcome === "victory") {
    return {
      encounterId: encounter.id,
      round,
      playerAttack: playerResult.attack,
      playerDamage: playerResult.damage,
      monsterHitPoints: 0,
      playerHitPoints: state.hitPoints,
      playerTemporaryHitPoints: state.temporaryHitPoints,
      outcome: "victory",
      log: playerResult.log,
    };
  }

  const monsterResult = resolveMonsterAttack({ encounter, state, rng });
  const log = [...playerResult.log, ...monsterResult.log];

  if (monsterResult.outcome === "defeat") {
    return {
      encounterId: encounter.id,
      round,
      playerAttack: playerResult.attack,
      monsterAttack: monsterResult.attack,
      monsterDamage: monsterResult.damage,
      monsterHitPoints: playerResult.monsterHitPoints,
      playerHitPoints: 0,
      playerTemporaryHitPoints: 0,
      outcome: "defeat",
      log,
    };
  }

  return {
    encounterId: encounter.id,
    round,
    playerAttack: playerResult.attack,
    monsterAttack: monsterResult.attack,
    monsterHitPoints: playerResult.monsterHitPoints,
    playerHitPoints: monsterResult.playerHitPoints,
    playerTemporaryHitPoints: monsterResult.playerTemporaryHitPoints,
    outcome: "continue",
    log,
  };
}

function applyCombatRound(state: GameState, result: CombatRoundResult): GameState {
  return {
    ...state,
    hitPoints: result.playerHitPoints,
    temporaryHitPoints: result.playerTemporaryHitPoints,
    encounters: {
      ...state.encounters,
      [result.encounterId]: {
        hitPoints: result.monsterHitPoints,
        defeated: result.outcome === "victory",
        rounds: result.round,
      },
    },
    log: [...state.log, ...result.log],
  };
}

// ---------------------------------------------------------------------------
// Chapter 8: choice gating, now including conditions
// ---------------------------------------------------------------------------

interface ChoiceRequirement {
  itemsAll?: string[];
  flagsAll?: string[];
  flagsNone?: string[];
  minHitPoints?: number;
  conditionsAll?: string[];
  conditionsNone?: string[];
}

interface Choice {
  id: string;
  text: string;
  targetId: string;
  requires?: ChoiceRequirement;
}

function isChoiceAvailable(choice: Choice, state: GameState): boolean {
  const req = choice.requires;
  if (!req) return true;

  if (req.itemsAll) {
    const inv = new Set(state.inventory);
    if (!req.itemsAll.every(id => inv.has(id))) return false;
  }

  if (req.flagsAll) {
    const flags = new Set(state.flags);
    if (!req.flagsAll.every(f => flags.has(f))) return false;
  }

  if (req.flagsNone) {
    const flags = new Set(state.flags);
    if (req.flagsNone.some(f => flags.has(f))) return false;
  }

  if (req.minHitPoints !== undefined) {
    if (state.hitPoints < req.minHitPoints) return false;
  }

  if (req.conditionsAll) {
    const conditions = new Set(state.conditions);
    if (!req.conditionsAll.every(condition => conditions.has(condition))) return false;
  }

  if (req.conditionsNone) {
    const conditions = new Set(state.conditions);
    if (req.conditionsNone.some(condition => conditions.has(condition))) return false;
  }

  return true;
}

// ---------------------------------------------------------------------------
// Chapter 2 & 14: the validation issue codes the Ch14 test now asserts
// ---------------------------------------------------------------------------

type ValidationIssue =
  | { code: "missing-start"; message: string }
  | { code: "missing-target"; passageId: string; choiceId: string; targetId: string }
  | { code: "targetless-choice"; passageId: string; choiceId: string }
  | { code: "unreachable-passage"; passageId: string }
  | { code: "unreachable-ending"; passageId: string }
  | { code: "empty-passage"; passageId: string };

// These are exactly the codes the corrected Chapter 14 test asserts; they must
// be valid members of the Chapter 2 union.
const ch14Expected: ValidationIssue[] = [
  { code: "empty-passage", passageId: "orphan" },
  { code: "unreachable-passage", passageId: "orphan" },
];

// ---------------------------------------------------------------------------
// Smoke usage so nothing above is dead and inference is exercised end to end
// ---------------------------------------------------------------------------

const sequence = [0.7, 0.1, 0.9, 0.4];
let i = 0;
const fixedRng: RandomSource = () => sequence[i++ % sequence.length]!;

const hero: Character = {
  id: "hero-1",
  name: "Brandavar",
  level: 1,
  abilityScores: {
    strength: 16,
    dexterity: 12,
    constitution: 14,
    intelligence: 10,
    wisdom: 10,
    charisma: 8,
  },
  maxHitPoints: 12,
  armourClass: 16,
  skillProficiencies: ["athletics"],
  inventory: ["brass-key"],
  attack: {
    name: "Longsword",
    attackBonus: 5,
    damage: { count: 1, sides: 8, modifier: 3, type: "slashing" },
  },
};

const goblin: Encounter = {
  id: "guardian",
  name: "Goblin",
  armourClass: 13,
  hitPoints: 7,
  attack: {
    name: "Scimitar",
    attackBonus: 4,
    damage: { count: 1, sides: 6, modifier: 2, type: "slashing" },
  },
};

const state: GameState = {
  schema: "dads-gamebook-save",
  version: 2,
  adventureId: "mt-graphnor",
  currentPassageId: "fight-guardian",
  character: hero,
  hitPoints: 12,
  temporaryHitPoints: 0,
  conditions: [],
  inventory: ["brass-key"],
  flags: [],
  encounters: {},
  log: [],
  updatedAt: new Date().toISOString(),
};

const round = resolveCombatRound({ encounter: goblin, state, rng: fixedRng });
const next = applyCombatRound(state, round);

const door: Choice = {
  id: "unlock",
  text: "Unlock the brass ward.",
  targetId: "trap-hall",
  requires: { itemsAll: ["brass-key"], conditionsNone: ["blinded"] },
};

export const proof = {
  notation: rollDamage(hero.attack.damage, fixedRng).notation,
  roundOutcome: round.outcome,
  nextHitPoints: next.hitPoints,
  doorAvailable: isChoiceAvailable(door, next),
  expectedCodes: ch14Expected.map(issue => issue.code),
};