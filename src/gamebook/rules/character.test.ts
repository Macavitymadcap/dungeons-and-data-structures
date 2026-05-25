import { expect, test } from "bun:test";
import {
  abilityModifier,
  createCharacter,
  proficiencyBonus,
  RACE_TEMPLATES,
  skillModifier,
} from "./character.ts";
import { RACE_RULES } from "./srd.ts";

test("ability modifiers follow SRD-style score maths", () => {
  expect(abilityModifier(1)).toBe(-5);
  expect(abilityModifier(8)).toBe(-1);
  expect(abilityModifier(10)).toBe(0);
  expect(abilityModifier(15)).toBe(2);
  expect(abilityModifier(20)).toBe(5);
});

test("proficiency bonus scales by level band", () => {
  expect(proficiencyBonus(1)).toBe(2);
  expect(proficiencyBonus(4)).toBe(2);
  expect(proficiencyBonus(5)).toBe(3);
  expect(proficiencyBonus(9)).toBe(4);
  expect(proficiencyBonus(17)).toBe(6);
});

test("character templates create independent level-one characters", () => {
  const rogue = createCharacter("hero-1", "Ash", "rogue");

  expect(rogue.class).toBe("rogue");
  expect(rogue.race).toBe("human");
  expect(rogue.proficiencyBonus).toBe(2);
  expect(rogue.inventory.includes("thieves-tools")).toBe(true);
  expect(skillModifier(rogue, "dexterity", "stealth")).toBe(5);
});

test("race templates apply ability, skill, inventory, and hit point changes", () => {
  const elfWizard = createCharacter("hero-1", "Ash", "wizard", "elf");
  const dwarfFighter = createCharacter("hero-2", "Bran", "fighter", "dwarf");
  const halflingRogue = createCharacter("hero-3", "Pip", "rogue", "halfling");

  expect(elfWizard.race).toBe("elf");
  expect(elfWizard.abilityScores.dexterity).toBe(15);
  expect(elfWizard.skillProficiencies.includes("perception")).toBe(true);

  expect(dwarfFighter.abilityScores.constitution).toBe(16);
  expect(dwarfFighter.maxHitPoints).toBe(13);
  expect(dwarfFighter.inventory.includes("stone-token")).toBe(true);

  expect(halflingRogue.inventory.includes("lucky-charm")).toBe(true);
});

test("race templates reuse the structured race rule bonuses", () => {
  expect(RACE_TEMPLATES).toMatchObject({
    human: { abilityBonuses: RACE_RULES.human.abilityBonuses },
    elf: { abilityBonuses: RACE_RULES.elf.abilityBonuses },
    dwarf: { abilityBonuses: RACE_RULES.dwarf.abilityBonuses },
    halfling: { abilityBonuses: RACE_RULES.halfling.abilityBonuses },
  });
});
