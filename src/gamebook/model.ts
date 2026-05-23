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
  | "trap"
  | "reward";

export type RollMode = "normal" | "advantage" | "disadvantage";

export interface Adventure {
  id: string;
  title: string;
  startPassageId: PassageId;
  passages: Passage[];
  attribution: string[];
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
  requires?: ChoiceRequirement;
  effects?: ChoiceEffect;
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
  flagsAll?: string[];
  flagsNone?: string[];
  itemsAll?: string[];
  minHitPoints?: number;
}

export interface ChoiceEffect {
  setFlags?: string[];
  addItems?: string[];
  removeItems?: string[];
  damage?: number;
  heal?: number;
}

export interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  level: number;
  abilityScores: Record<Ability, number>;
  maxHitPoints: number;
  armourClass: number;
  proficiencyBonus: number;
  skillProficiencies: Skill[];
  inventory: string[];
}

export interface GameState {
  schema: "dads-gamebook-save";
  version: 1;
  adventureId: string;
  currentPassageId: PassageId;
  character: Character;
  hitPoints: number;
  temporaryHitPoints: number;
  conditions: string[];
  inventory: string[];
  flags: string[];
  log: GameLogEntry[];
  updatedAt: string;
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
