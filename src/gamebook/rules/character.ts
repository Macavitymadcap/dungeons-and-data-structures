import { Ability, Character, CharacterClass, Skill } from "../model.ts";

export interface CharacterTemplate {
  class: CharacterClass;
  abilityScores: Record<Ability, number>;
  maxHitPoints: number;
  armourClass: number;
  skillProficiencies: Skill[];
  inventory: string[];
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
  level = 1,
): Character {
  const template = CHARACTER_TEMPLATES[characterClass];
  return {
    id,
    name,
    class: characterClass,
    level,
    abilityScores: { ...template.abilityScores },
    maxHitPoints: template.maxHitPoints,
    armourClass: template.armourClass,
    proficiencyBonus: proficiencyBonus(level),
    skillProficiencies: [...template.skillProficiencies],
    inventory: [...template.inventory],
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
