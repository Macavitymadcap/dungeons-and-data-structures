import { expect, test } from "bun:test";
import { mtGraphnorAdventure } from "../content/mt-graphnor.ts";
import { CHARACTER_TEMPLATES } from "./character.ts";
import {
  ABILITY_RULES,
  CLASS_RULES,
  EQUIPMENT_RULES,
  gamebookRuleAttributions,
  MECHANIC_RULES,
  RACE_RULES,
  RULE_SOURCES,
  SKILL_RULES,
} from "./srd.ts";

test("rule sources preserve SRD 5.1 attribution metadata", () => {
  expect(RULE_SOURCES["srd-5-1-cc"]).toMatchObject({
    title: "Dungeons & Dragons System Reference Document 5.1",
    licence: "Creative Commons Attribution 4.0 International",
    url: "https://media.dndbeyond.com/compendium-images/srd/5.1/SRD_CC_v5.1.pdf",
  });
  expect(gamebookRuleAttributions()).toContain(
    "Dungeons & Dragons System Reference Document 5.1 is licensed under Creative Commons Attribution 4.0 International.",
  );
});

test("structured rules cover the playable character model", () => {
  expect(Object.keys(ABILITY_RULES).sort()).toEqual([
    "charisma",
    "constitution",
    "dexterity",
    "intelligence",
    "strength",
    "wisdom",
  ]);
  expect(SKILL_RULES.stealth.ability).toBe("dexterity");
  expect(SKILL_RULES.persuasion.ability).toBe("charisma");
  expect(Object.keys(CLASS_RULES).sort()).toEqual(
    Object.keys(CHARACTER_TEMPLATES).sort(),
  );
  expect(RACE_RULES.human.abilityBonuses.charisma).toBe(1);
  expect(MECHANIC_RULES["temporary-hit-points"].sourceId).toBe("srd-5-1-cc");
});

test("Mt. Graphnor items are backed by rule catalogue entries", () => {
  const adventureItemIds = mtGraphnorAdventure.items?.map((item) => item.id).sort() ??
    [];

  expect(adventureItemIds).toEqual(Object.keys(EQUIPMENT_RULES).sort());
  for (const item of mtGraphnorAdventure.items ?? []) {
    expect(item.sourceId).toBeDefined();
    expect(RULE_SOURCES[item.sourceId as keyof typeof RULE_SOURCES]).toBeDefined();
  }
});

test("character template inventory references catalogued equipment", () => {
  const templateInventory = Object.values(CHARACTER_TEMPLATES)
    .flatMap((template) => template.inventory);

  for (const itemId of templateInventory) {
    expect(EQUIPMENT_RULES[itemId]).toBeDefined();
  }
});
