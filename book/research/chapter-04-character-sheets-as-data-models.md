# Chapter 04: Character Sheets As Data Models

## Research Question

How can a beginner learn records, types, validation, and derived values by modelling a character
sheet before seeing the same ideas in a fuller campaign-management application?

## Core Concept

A character sheet is a data model: a named record with fields, allowed values, nested structures,
and values that can be calculated from other values.

For this chapter, the key split is:

- **Stored facts**: name, class, race or species, level, ability scores, maximum hit points, armour
  class sources, inventory, proficiencies, resources, and conditions.
- **Derived facts**: ability modifiers, proficiency bonus, skill modifiers, saving throw modifiers,
  attack bonuses, armour class totals, and display formats such as `+3`.
- **Closed vocabularies**: abilities, classes, races, skills, conditions, and resource kinds.
- **Boundary validation**: checks needed when data enters from a form, save document, import, or
  database row.

The useful beginner lesson is not "make a giant character sheet". It is "choose the smallest record
that can support the next rule honestly".

## RPG Or Gamebook Analogy

A character sheet is not the adventurer. It is the adventurer's structured shadow: enough facts for
the rules to answer questions.

When the player tries to force a door, the system does not need a biography. It needs the
character's Strength score, any relevant proficiency, the d20 result, and the target difficulty.
When the player takes damage, the system needs current hit points, temporary hit points, maximum hit
points, and any conditions that alter the result.

That makes the sheet a friendly way to introduce records. A record gathers related fields under one
name. A good model also makes illegal or meaningless states harder to express.

## Dialogue Or Interlude Idea

**The Scribe and the Hero** argue about whether writing something down makes it true.

The Hero insists they are brave, wounded, hungry, and very hard to describe. The Scribe replies that
the rules only need some facts right now: level, ability scores, hit points, armour class,
inventory, and a list of current conditions. Their argument dramatises the difference between the
living story and the structured model that software can safely use.

## Sources

- Authoritative software source: TypeScript's object-types documentation for object shapes,
  property types, and structural typing:
  <https://www.typescriptlang.org/docs/handbook/2/objects.html>.
- Data validation source: JSON Schema's object reference for object properties and validation
  vocabulary:
  <https://json-schema.org/understanding-json-schema/reference/object>.
- D&D 5e SRD source: System Reference Document 5.1 under Creative Commons Attribution 4.0
  International:
  <https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf>.
- Licence source: Creative Commons Attribution 4.0 International legal code:
  <https://creativecommons.org/licenses/by/4.0/legalcode.en>.
- Campaign Ledger evidence: character read models, SQLite checks, calculation helpers, and sheet
  update routes in the local Campaign Ledger app.

## Campaign Ledger Evidence

Campaign Ledger is the mature case study for this chapter. It shows that the small gamebook model is
not a toy idea; it is the seed of a real sheet workflow.

- `/Users/dank/Code/personal/web/campaign-ledger/src/db/model.ts`
  - `AbilityName` is a closed vocabulary for the six ability names.
  - `CharacterAbility`, `CharacterSkill`, `CharacterResource`, `CharacterEquipment`,
    `ArmourClassSource`, and `CharacterDefence` split the sheet into smaller records.
  - `CharacterSheetReadModel` gathers abilities, classes, hit points, armour class, resources,
    skills, proficiencies, senses, speed, species, and display identifiers into one read model.
  - `CharacterRepository` exposes focused update methods for sheet summary, abilities, skills,
    armour class sources, defences, equipment, resources, proficiencies, and senses.
- `/Users/dank/Code/personal/web/campaign-ledger/src/db/schema.ts`
  - The `characters` table uses constraints for level, proficiency bonus, armour class, speed, hit
    points, and temporary hit points.
  - `character_abilities` constrains ability names to the six ability values and score values to
    `1..30`.
  - `character_skills` constrains ability names and proficiency levels while keeping skill names as
    data.
  - The schema demonstrates a second validation layer beneath TypeScript: persisted data still
    needs database boundaries.
- `/Users/dank/Code/personal/web/campaign-ledger/src/characters/calculations.ts`
  - `abilityModifier`, `savingThrowModifier`, `skillModifier`, `armourClassTotal`, and
    `formatModifier` keep derived values in named helpers.
  - This is a useful contrast with fields that are stored for editing and persistence.
- `/Users/dank/Code/personal/web/campaign-ledger/src/app.tsx`
  - Sheet routes update individual model slices such as summary, abilities, skills, armour class,
    defences, proficiencies, senses, and resources.
  - The product workflow reinforces the chapter's modelling point: each interface action touches a
    specific part of the character model rather than rewriting the whole sheet at once.
- `/Users/dank/Code/personal/web/campaign-ledger/src/components/pages/Sheet/Sheet.tsx`
  and related sheet organisms
  - The UI consumes a read model rather than reaching directly into persistence.
  - This gives the chapter a practical bridge from "record" to "view model" without requiring the
    beginner to learn repository architecture yet.

Inference from project context: Campaign Ledger is the grown-up version of the Chapter 04 lesson.
It stores more fields, supports more edit flows, and adds database constraints, but it still depends
on the same conceptual moves: name the fields, constrain the vocabulary, calculate derived values in
one place, and validate incoming data at the boundary.

## Gamebook Build Payoff

This chapter explains the gamebook's first character model and its derived-stat helpers:

- `src/gamebook/model.ts`
  - `Ability`, `Skill`, `CharacterClass`, and `CharacterRace` are closed vocabularies.
  - `Character` stores identity, class, race, level, ability scores, maximum hit points, armour
    class, proficiency bonus, skill proficiencies, inventory, and an attack profile.
  - `GameState` keeps the selected `character` separate from mutable play state such as current hit
    points, temporary hit points, conditions, inventory, flags, log entries, and encounter state.
- `src/gamebook/rules/character.ts`
  - `CHARACTER_TEMPLATES` provides beginner-sized class templates.
  - `RACE_TEMPLATES` applies small ability, skill, and inventory changes.
  - `createCharacter` combines a class, race, name, and level into a playable record.
  - `abilityModifier`, `proficiencyBonus`, and `skillModifier` give the chapter concrete derived
    helpers.
- `src/gamebook/rules/srd.ts`
  - `RULE_SOURCES` records SRD and project-owned provenance.
  - `ABILITY_RULES`, `SKILL_RULES`, `CLASS_RULES`, `RACE_RULES`, and `MECHANIC_RULES` make the
    SRD-informed vocabulary explicit without copying large rules text into prose.
- `src/gamebook/state.ts`
  - Save creation, migration, serialisation, and validation give the chapter a later bridge to the
    save-document chapter.

The build move should define a deliberately small `Character` type and derived-stat helpers. It
should resist modelling every character-sheet detail at once. The reader only needs the pieces that
support Chapter 04's checks, combat, inventory, and state examples.

## Notes For The Draft

### Opening Move

Start with a blank character sheet and a locked door.

Ask the reader what the rules need to know before the character can try the door. Name, biography,
and favourite breakfast may be delightful, but the check needs a small set of fields. That gives a
natural route into records, fields, allowed values, and derived helpers.

### Sections

1. **A Sheet Is A Record**
   - A record groups named fields.
   - A character record can start small: identity, class, race, level, ability scores, hit points,
     armour class, inventory, and conditions.
   - Use the SRD as the source for the six ability names and core character-sheet vocabulary, but
     paraphrase and keep quotations short.

2. **Names, Types, And Closed Doors**
   - Explain closed vocabularies with `Ability`, `CharacterClass`, and `CharacterRace`.
   - Show why `"dexterity"` is safer than a free-form text field when rules need to look up the
     same concept repeatedly.
   - Connect TypeScript object types to the gamebook's `Character` interface.

3. **Stored Values And Derived Values**
   - Store ability scores; derive ability modifiers.
   - Store level; derive proficiency bonus for the simplified gamebook.
   - Store armour class directly in the small gamebook model, but show how Campaign Ledger stores
     armour class sources and derives totals.
   - Name the trade-off: storing derived values can make display faster or persistence simpler, but
     it creates consistency work.

4. **Validation At The Gate**
   - TypeScript protects code while code is being written.
   - Runtime validation protects imported saves, form submissions, URLs, database rows, and old save
     versions.
   - Use JSON Schema vocabulary as a general validation reference, then point to the app's custom
     save and graph validation instead of introducing JSON Schema as a new dependency.
   - Use Campaign Ledger's SQLite `CHECK` constraints as the mature data-boundary example.

5. **From Small Model To Large Sheet**
   - Compare the gamebook `Character` with Campaign Ledger's `CharacterSheetReadModel`.
   - Show how larger apps split a sheet into sub-records: abilities, classes, resources, equipment,
     defences, senses, proficiencies, and background entries.
   - Keep the beginner conclusion generous: a small model is not wrong; it is a fit-for-purpose
     model.

6. **The Scribe's Rule**
   - Every field should earn its keep.
   - Every derived value should have one obvious calculation.
   - Every outside input should pass through a gate before the rules trust it.

### Diagrams

Use two diagrams:

- **Character record**:
  `Character -> abilityScores -> Ability keys -> numeric scores`.
- **Stored to derived flow**:
  `score -> abilityModifier(score) -> skillModifier(character, ability, skill) -> d20 check`.

Optional third diagram:

- **Small model to large model**:
  gamebook `Character` on the left; Campaign Ledger `CharacterSheetReadModel` on the right; arrows
  to shared concepts such as abilities, HP, AC, skills, and resources.

### Code Examples

Start with a tiny record:

```ts
type Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";

interface Character {
  name: string;
  level: number;
  abilityScores: Record<Ability, number>;
}
```

Then add the derived helper:

```ts
function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
```

Then show a boundary check in prose or pseudocode:

```ts
function isAbility(value: string): value is Ability {
  return [
    "strength",
    "dexterity",
    "constitution",
    "intelligence",
    "wisdom",
    "charisma",
  ].includes(value);
}
```

Useful project snippets:

- `src/gamebook/model.ts` for the beginner-facing `Character` shape.
- `src/gamebook/rules/character.ts` for template composition and derived helpers.
- `/Users/dank/Code/personal/web/campaign-ledger/src/characters/calculations.ts` for a more
  complete set of derived character calculations.
- `/Users/dank/Code/personal/web/campaign-ledger/src/db/schema.ts` for persisted validation
  constraints.

### SRD-Safe Handling

Use SRD 5.1-compatible vocabulary and mechanics as structural examples. Do not reproduce class,
race, spell, or equipment text beyond very short necessary labels. The gamebook can say it is
informed by SRD concepts such as ability scores, modifiers, proficiency, hit points, armour class,
skills, and character classes while keeping its tutorial prose and Mt. Graphnor content original.

The repo's `RULE_SOURCES` catalogue should remain the implementation anchor for attribution and
licence awareness.

### Chapter Boundary

Keep this chapter focused on modelling a playable character record. Save deeper persistence,
serialisation, migrations, and save-file compatibility for the save-document chapter. Save encounter
math and probabilistic combat outcomes for later dice/probability chapters.

## Risks

- **Over-modelling**: a full tabletop character sheet is too large for a first record example. Keep
  the model small and explain what is intentionally omitted.
- **TypeScript overclaim**: static types do not validate old saves, imported JSON, form fields, or
  database rows. The chapter must name runtime validation separately.
- **Derived-value drift**: if the draft stores and recalculates the same concept in different
  places, readers may miss the distinction between source facts and calculated facts.
- **Licence blur**: use SRD concepts and short labels, not copied descriptive text or trade dress.
- **Vocabulary mismatch**: the gamebook currently says `race`; Campaign Ledger uses `species`.
  Present this as a naming-evolution note rather than a contradiction.
