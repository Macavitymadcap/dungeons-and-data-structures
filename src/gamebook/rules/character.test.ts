import { expect, test } from "bun:test";
import {
  abilityModifier,
  createCharacter,
  proficiencyBonus,
  skillModifier,
} from "./character.ts";

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
  expect(rogue.proficiencyBonus).toBe(2);
  expect(rogue.inventory.includes("thieves-tools")).toBe(true);
  expect(skillModifier(rogue, "dexterity", "stealth")).toBe(5);
});

