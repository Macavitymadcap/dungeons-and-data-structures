export type PassageId = string;

export type Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

export type Skill =
  | "athletics"
  | "acrobatics"
  | "arcana"
  | "deception"
  | "history"
  | "insight"
  | "investigation"
  | "perception"
  | "persuasion"
  | "sleightOfHand"
  | "stealth";

export type CharacterClass = "fighter" | "rogue" | "wizard" | "cleric";

export type CharacterRace = "human" | "elf" | "dwarf" | "halfling";

export type EndingKind = "victory" | "failure" | "retreat" | "cliffhanger";

export type PassageTag =
  | "start"
  | "room-1"
  | "room-2"
  | "room-3"
  | "room-4"
  | "room-5"
  | "combat"
  | "puzzle"
  | "roleplay"
  | "trap"
  | "reward";

export type RollMode = "normal" | "advantage" | "disadvantage";

export interface Adventure {
  id: string;
  title: string;
  startPassageId: PassageId;
  passages: Passage[];
  encounters?: Encounter[];
  items?: ItemDefinition[];
  discoveries?: DiscoveryDefinition[];
  attribution: string[];
}

export interface ItemDefinition {
  id: string;
  name: string;
  kind: "equipment" | "key" | "consumable" | "treasure";
}

export interface DiscoveryDefinition {
  id: string;
  name: string;
}

export interface Passage {
  id: PassageId;
  title: string;
  body: string;
  choices: Choice[];
  ending?: EndingKind;
  tags?: PassageTag[];
  encounterId?: string;
}

export interface Choice {
  id: string;
  text: string;
  targetId?: PassageId;
  check?: CheckDefinition;
  combat?: CombatChoiceDefinition;
  requires?: ChoiceRequirement;
  effects?: ChoiceEffect;
}

export interface CombatChoiceDefinition {
  encounterId: string;
  onVictory: PassageId;
  onDefeat: PassageId;
  onContinue: PassageId;
}

export interface CheckDefinition {
  kind: "ability" | "skill" | "savingThrow";
  ability: Ability;
  skill?: Skill;
  dc: number;
  mode?: RollMode;
  onSuccess: PassageId;
  onFailure: PassageId;
}

export interface ChoiceRequirement {
  conditionsAll?: string[];
  conditionsNone?: string[];
  flagsAll?: string[];
  flagsNone?: string[];
  hitPointsBelowMax?: boolean;
  itemsAll?: string[];
  minHitPoints?: number;
}

export interface ChoiceEffect {
  addConditions?: string[];
  setFlags?: string[];
  addItems?: string[];
  removeConditions?: string[];
  removeItems?: string[];
  damage?: number;
  heal?: number;
  temporaryHitPoints?: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  race: CharacterRace;
  level: number;
  abilityScores: Record<Ability, number>;
  maxHitPoints: number;
  armourClass: number;
  proficiencyBonus: number;
  skillProficiencies: Skill[];
  inventory: string[];
  attack: AttackProfile;
}

export interface AttackProfile {
  name: string;
  attackBonus: number;
  damage: DamageRoll;
}

export interface DamageRoll {
  dice: number;
  sides: number;
  modifier: number;
  type: string;
}

export interface Encounter {
  id: string;
  name: string;
  armourClass: number;
  hitPoints: number;
  attack: AttackProfile;
}

export interface GameState {
  schema: "dads-gamebook-save";
  version: 2;
  adventureId: string;
  currentPassageId: PassageId;
  character: Character;
  hitPoints: number;
  temporaryHitPoints: number;
  conditions: string[];
  inventory: string[];
  flags: string[];
  log: GameLogEntry[];
  encounters: Record<string, EncounterState>;
  updatedAt: string;
}

export interface EncounterState {
  hitPoints: number;
  defeated: boolean;
  rounds: number;
}

export interface GameLogEntry {
  id: string;
  message: string;
  createdAt: string;
}

export interface RollResult {
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

export interface DamageRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
  type: string;
}

export interface CombatRoundResult {
  encounterId: string;
  round: number;
  playerAttack: RollResult;
  playerDamage?: DamageRollResult;
  monsterAttack?: RollResult;
  monsterDamage?: DamageRollResult;
  monsterHitPoints: number;
  playerHitPoints: number;
  playerTemporaryHitPoints?: number;
  outcome: "victory" | "defeat" | "continue";
  log: string[];
}
