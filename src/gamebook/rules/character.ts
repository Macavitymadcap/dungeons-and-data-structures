import {
  Ability,
  AttackProfile,
  Character,
  CharacterClass,
  CharacterRace,
  Skill,
} from "../model.ts";

export interface CharacterTemplate {
  class: CharacterClass;
  abilityScores: Record<Ability, number>;
  maxHitPoints: number;
  armourClass: number;
  skillProficiencies: Skill[];
  inventory: string[];
  attack: AttackProfile;
}

export const CHARACTER_TEMPLATES: Record<CharacterClass, CharacterTemplate> = {
  fighter: {
    class: "fighter",
    abilityScores: {
      strength: 16,
      dexterity: 12,
      constitution: 14,
      intelligence: 10,
      wisdom: 11,
      charisma: 10,
    },
    maxHitPoints: 12,
    armourClass: 16,
    skillProficiencies: ["athletics", "perception"],
    inventory: ["sword", "shield", "ration"],
    attack: {
      name: "Sword",
      attackBonus: 5,
      damage: { dice: 1, sides: 8, modifier: 3, type: "slashing" },
    },
  },
  rogue: {
    class: "rogue",
    abilityScores: {
      strength: 10,
      dexterity: 16,
      constitution: 12,
      intelligence: 13,
      wisdom: 11,
      charisma: 12,
    },
    maxHitPoints: 9,
    armourClass: 14,
    skillProficiencies: ["stealth", "sleightOfHand", "investigation"],
    inventory: ["shortsword", "thieves-tools", "ration"],
    attack: {
      name: "Shortsword",
      attackBonus: 5,
      damage: { dice: 1, sides: 6, modifier: 3, type: "piercing" },
    },
  },
  wizard: {
    class: "wizard",
    abilityScores: {
      strength: 8,
      dexterity: 13,
      constitution: 12,
      intelligence: 16,
      wisdom: 12,
      charisma: 10,
    },
    maxHitPoints: 7,
    armourClass: 11,
    skillProficiencies: ["arcana", "history", "investigation"],
    inventory: ["staff", "spellbook", "ration"],
    attack: {
      name: "Staff",
      attackBonus: 3,
      damage: { dice: 1, sides: 6, modifier: 1, type: "bludgeoning" },
    },
  },
  cleric: {
    class: "cleric",
    abilityScores: {
      strength: 13,
      dexterity: 10,
      constitution: 14,
      intelligence: 10,
      wisdom: 16,
      charisma: 12,
    },
    maxHitPoints: 10,
    armourClass: 16,
    skillProficiencies: ["insight", "persuasion"],
    inventory: ["mace", "shield", "holy-symbol", "ration"],
    attack: {
      name: "Mace",
      attackBonus: 5,
      damage: { dice: 1, sides: 6, modifier: 3, type: "bludgeoning" },
    },
  },
};

export interface RaceTemplate {
  race: CharacterRace;
  abilityBonuses: Partial<Record<Ability, number>>;
  inventory?: string[];
  skillProficiencies?: Skill[];
}

export const RACE_TEMPLATES: Record<CharacterRace, RaceTemplate> = {
  human: {
    race: "human",
    abilityBonuses: {
      strength: 1,
      dexterity: 1,
      constitution: 1,
      intelligence: 1,
      wisdom: 1,
      charisma: 1,
    },
  },
  elf: {
    race: "elf",
    abilityBonuses: { dexterity: 2 },
    skillProficiencies: ["perception"],
  },
  dwarf: {
    race: "dwarf",
    abilityBonuses: { constitution: 2 },
    inventory: ["stone-token"],
  },
  halfling: {
    race: "halfling",
    abilityBonuses: { dexterity: 2 },
    inventory: ["lucky-charm"],
  },
};

export function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}

export function proficiencyBonus(level: number): number {
  if (!Number.isInteger(level) || level < 1) {
    throw new Error("Level must be a positive integer.");
  }
  return Math.ceil(level / 4) + 1;
}

export function createCharacter(
  id: string,
  name: string,
  characterClass: CharacterClass,
  race: CharacterRace = "human",
  level = 1,
): Character {
  const template = CHARACTER_TEMPLATES[characterClass];
  const raceTemplate = RACE_TEMPLATES[race];
  const abilityScores = applyAbilityBonuses(
    template.abilityScores,
    raceTemplate.abilityBonuses,
  );
  const skillProficiencies = unique([
    ...template.skillProficiencies,
    ...(raceTemplate.skillProficiencies ?? []),
  ]);
  const inventory = [...template.inventory, ...(raceTemplate.inventory ?? [])];

  return {
    id,
    name,
    class: characterClass,
    race,
    level,
    abilityScores,
    maxHitPoints: template.maxHitPoints + abilityModifier(abilityScores.constitution) -
      abilityModifier(template.abilityScores.constitution),
    armourClass: template.armourClass,
    proficiencyBonus: proficiencyBonus(level),
    skillProficiencies,
    inventory,
    attack: { ...template.attack, damage: { ...template.attack.damage } },
  };
}

export function skillModifier(
  character: Character,
  ability: Ability,
  skill: Skill,
): number {
  const base = abilityModifier(character.abilityScores[ability]);
  return character.skillProficiencies.includes(skill)
    ? base + character.proficiencyBonus
    : base;
}

function applyAbilityBonuses(
  scores: Record<Ability, number>,
  bonuses: Partial<Record<Ability, number>>,
): Record<Ability, number> {
  return Object.fromEntries(
    Object.entries(scores).map(([ability, score]) => [
      ability,
      score + (bonuses[ability as Ability] ?? 0),
    ]),
  ) as Record<Ability, number>;
}

function unique<T>(values: T[]): T[] {
  return [...new Set(values)];
}
