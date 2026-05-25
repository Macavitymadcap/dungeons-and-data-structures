import {
  Ability,
  CharacterClass,
  CharacterRace,
  DamageRoll,
  Skill,
} from "../model.ts";

export type RuleSourceId = "srd-5-1-cc" | "dads-original";

export interface RuleSource {
  id: RuleSourceId;
  title: string;
  licence: string;
  url?: string;
  licenceUrl?: string;
  attribution: string;
}

export interface NamedRule<TId extends string = string> {
  id: TId;
  name: string;
  sourceId: RuleSourceId;
  note?: string;
}

export interface SkillRule extends NamedRule<Skill> {
  ability: Ability;
}

export interface ClassRule extends NamedRule<CharacterClass> {
  primaryAbility: Ability;
  hitDie: DamageRoll;
}

export interface RaceRule extends NamedRule<CharacterRace> {
  abilityBonuses: Partial<Record<Ability, number>>;
}

export interface EquipmentRule extends NamedRule {
  kind: "equipment" | "key" | "consumable" | "treasure";
}

export const RULE_SOURCES: Record<RuleSourceId, RuleSource> = {
  "srd-5-1-cc": {
    id: "srd-5-1-cc",
    title: "Dungeons & Dragons System Reference Document 5.1",
    licence: "Creative Commons Attribution 4.0 International",
    url: "https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/legalcode",
    attribution:
      "Dungeons & Dragons System Reference Document 5.1 is licensed under Creative Commons Attribution 4.0 International.",
  },
  "dads-original": {
    id: "dads-original",
    title: "Dungeons & Data Structures original gamebook material",
    licence: "Project-owned original material",
    attribution:
      "Mt. Graphnor adventure prose, item framing, discoveries, and encounters are original Dungeons & Data Structures material.",
  },
};

export const ABILITY_RULES: Record<Ability, NamedRule<Ability>> = {
  strength: { id: "strength", name: "Strength", sourceId: "srd-5-1-cc" },
  dexterity: { id: "dexterity", name: "Dexterity", sourceId: "srd-5-1-cc" },
  constitution: {
    id: "constitution",
    name: "Constitution",
    sourceId: "srd-5-1-cc",
  },
  intelligence: {
    id: "intelligence",
    name: "Intelligence",
    sourceId: "srd-5-1-cc",
  },
  wisdom: { id: "wisdom", name: "Wisdom", sourceId: "srd-5-1-cc" },
  charisma: { id: "charisma", name: "Charisma", sourceId: "srd-5-1-cc" },
};

export const SKILL_RULES: Record<Skill, SkillRule> = {
  athletics: {
    id: "athletics",
    name: "Athletics",
    ability: "strength",
    sourceId: "srd-5-1-cc",
  },
  acrobatics: {
    id: "acrobatics",
    name: "Acrobatics",
    ability: "dexterity",
    sourceId: "srd-5-1-cc",
  },
  arcana: {
    id: "arcana",
    name: "Arcana",
    ability: "intelligence",
    sourceId: "srd-5-1-cc",
  },
  deception: {
    id: "deception",
    name: "Deception",
    ability: "charisma",
    sourceId: "srd-5-1-cc",
  },
  history: {
    id: "history",
    name: "History",
    ability: "intelligence",
    sourceId: "srd-5-1-cc",
  },
  insight: {
    id: "insight",
    name: "Insight",
    ability: "wisdom",
    sourceId: "srd-5-1-cc",
  },
  investigation: {
    id: "investigation",
    name: "Investigation",
    ability: "intelligence",
    sourceId: "srd-5-1-cc",
  },
  perception: {
    id: "perception",
    name: "Perception",
    ability: "wisdom",
    sourceId: "srd-5-1-cc",
  },
  persuasion: {
    id: "persuasion",
    name: "Persuasion",
    ability: "charisma",
    sourceId: "srd-5-1-cc",
  },
  sleightOfHand: {
    id: "sleightOfHand",
    name: "Sleight of Hand",
    ability: "dexterity",
    sourceId: "srd-5-1-cc",
  },
  stealth: {
    id: "stealth",
    name: "Stealth",
    ability: "dexterity",
    sourceId: "srd-5-1-cc",
  },
};

export const CLASS_RULES: Record<CharacterClass, ClassRule> = {
  fighter: {
    id: "fighter",
    name: "Fighter",
    primaryAbility: "strength",
    hitDie: { dice: 1, sides: 10, modifier: 0, type: "hit points" },
    sourceId: "srd-5-1-cc",
    note: "Simplified level-one template for the static gamebook.",
  },
  rogue: {
    id: "rogue",
    name: "Rogue",
    primaryAbility: "dexterity",
    hitDie: { dice: 1, sides: 8, modifier: 0, type: "hit points" },
    sourceId: "srd-5-1-cc",
    note: "Simplified level-one template for the static gamebook.",
  },
  wizard: {
    id: "wizard",
    name: "Wizard",
    primaryAbility: "intelligence",
    hitDie: { dice: 1, sides: 6, modifier: 0, type: "hit points" },
    sourceId: "srd-5-1-cc",
    note: "Simplified level-one template for the static gamebook.",
  },
  cleric: {
    id: "cleric",
    name: "Cleric",
    primaryAbility: "wisdom",
    hitDie: { dice: 1, sides: 8, modifier: 0, type: "hit points" },
    sourceId: "srd-5-1-cc",
    note: "Simplified level-one template for the static gamebook.",
  },
};

export const RACE_RULES: Record<CharacterRace, RaceRule> = {
  human: {
    id: "human",
    name: "Human",
    abilityBonuses: {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1,
    },
    sourceId: "srd-5-1-cc",
  },
  elf: {
    id: "elf",
    name: "Elf",
    abilityBonuses: { dexterity: 2 },
    sourceId: "srd-5-1-cc",
  },
  dwarf: {
    id: "dwarf",
    name: "Dwarf",
    abilityBonuses: { constitution: 2 },
    sourceId: "srd-5-1-cc",
  },
  halfling: {
    id: "halfling",
    name: "Halfling",
    abilityBonuses: { dexterity: 2 },
    sourceId: "srd-5-1-cc",
  },
};

export const MECHANIC_RULES: Record<string, NamedRule> = {
  "ability-modifier": {
    id: "ability-modifier",
    name: "Ability modifier",
    sourceId: "srd-5-1-cc",
  },
  "proficiency-bonus": {
    id: "proficiency-bonus",
    name: "Proficiency bonus",
    sourceId: "srd-5-1-cc",
  },
  "d20-check": {
    id: "d20-check",
    name: "d20 check against a DC",
    sourceId: "srd-5-1-cc",
  },
  "advantage-disadvantage": {
    id: "advantage-disadvantage",
    name: "Advantage and disadvantage",
    sourceId: "srd-5-1-cc",
  },
  "attack-roll": {
    id: "attack-roll",
    name: "Attack roll",
    sourceId: "srd-5-1-cc",
  },
  "damage-roll": {
    id: "damage-roll",
    name: "Damage roll",
    sourceId: "srd-5-1-cc",
  },
  "temporary-hit-points": {
    id: "temporary-hit-points",
    name: "Temporary hit points",
    sourceId: "srd-5-1-cc",
  },
};

export const EQUIPMENT_RULES: Record<string, EquipmentRule> = {
  sword: {
    id: "sword",
    name: "Sword",
    kind: "equipment",
    sourceId: "dads-original",
    note: "Simplified weapon label for the prototype fighter.",
  },
  shield: { id: "shield", name: "Shield", kind: "equipment", sourceId: "srd-5-1-cc" },
  ration: { id: "ration", name: "Ration", kind: "consumable", sourceId: "srd-5-1-cc" },
  shortsword: {
    id: "shortsword",
    name: "Shortsword",
    kind: "equipment",
    sourceId: "srd-5-1-cc",
  },
  "thieves-tools": {
    id: "thieves-tools",
    name: "Thieves' tools",
    kind: "equipment",
    sourceId: "srd-5-1-cc",
  },
  staff: { id: "staff", name: "Staff", kind: "equipment", sourceId: "srd-5-1-cc" },
  spellbook: {
    id: "spellbook",
    name: "Spellbook",
    kind: "equipment",
    sourceId: "srd-5-1-cc",
  },
  mace: { id: "mace", name: "Mace", kind: "equipment", sourceId: "srd-5-1-cc" },
  "holy-symbol": {
    id: "holy-symbol",
    name: "Holy symbol",
    kind: "equipment",
    sourceId: "srd-5-1-cc",
  },
  "stone-token": {
    id: "stone-token",
    name: "Stone token",
    kind: "treasure",
    sourceId: "dads-original",
  },
  "lucky-charm": {
    id: "lucky-charm",
    name: "Lucky charm",
    kind: "treasure",
    sourceId: "dads-original",
  },
  "brass-key": {
    id: "brass-key",
    name: "Brass key",
    kind: "key",
    sourceId: "dads-original",
  },
  "graphnor-map": {
    id: "graphnor-map",
    name: "Graphnor map",
    kind: "treasure",
    sourceId: "dads-original",
  },
};

export function ruleSourceAttributions(sourceIds: RuleSourceId[]): string[] {
  return [...new Set(sourceIds)].map((sourceId) => RULE_SOURCES[sourceId].attribution);
}

export function gamebookRuleAttributions(): string[] {
  return ruleSourceAttributions(["dads-original", "srd-5-1-cc"]);
}
