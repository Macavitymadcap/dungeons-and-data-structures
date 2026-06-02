# Chapter 11: Rules As Structured Data

---

> **The Wizard and the Archivist**
>
> The Wizard had three spellbooks open on the desk at once, each to a different page, each
> describing what appeared to be the same incantation but with discrepancies in the third and
> seventh steps.
>
> "Which one is correct?" said the Wizard.
>
> "That," said the Archivist, "depends on which one you trust, and why."
>
> "They can't all be correct."
>
> "They might all be correct for different purposes. The Gilt Tower edition was transcribed from
> the original manuscript. The Compact edition was revised for field use. The annotated copy was
> corrected against the Gilt Tower edition by someone who disagreed with the field revision."
>
> The Wizard pointed at the annotated copy. "So this one is the authoritative version."
>
> "The annotated copy is authoritative for the scholar who produced the annotation," said the
> Archivist, with the particular care of someone managing an important distinction. "I can tell
> you which spellbook a rule came from, how it was copied, whether it was revised, who revised
> it, and what they changed. I cannot tell you which spellbook is correct in the abstract. That
> is a policy decision, and it belongs to you."
>
> "Then what good are you?"
>
> "I know the provenance of every rule in this library," said the Archivist. "Without provenance,
> you cannot make the policy decision either. You just pick a book and hope."

---

In Chapter 10, we gave the gamebook's source code a structure: separate shelves for each kind
of decision, dependencies pointing in a consistent direction, public surfaces as small as their
callers need. One of those shelves, `src/gamebook/rules/`, holds the domain logic: dice,
character templates, combat resolution.

But there is another shelf that we have been drawing on without looking at directly. The rules
themselves: the vocabulary of ability scores, the names of conditions, the starting equipment
for each character class, the attack profiles, the categories of armour. These are not code.
They are data. Data that has a source, a licence, and a set of decisions about what the
software is allowed to do with it.

This chapter is about how rules become structured data: not just text in a book, but sourced
records that the software can search, filter, render, and publish. The Wizard's three
spellbooks are not a problem if the library card tells you which one to trust and why. They
become a problem the moment the software picks one without recording the choice.

---

## The Difference Between Text And Data

A rule in a physical rulebook is prose. "A shield provides a +2 bonus to Armour Class." That
sentence is useful for a person at a table. It is of limited use to software that needs to
know whether a character is wearing a shield, how much that affects their AC calculation, and
whether the rule is from a source the application is allowed to publish.

Turning prose into data always involves trade-offs. Some nuance is lost; some affordances are
gained. The question is not whether the data is a perfect representation of the prose, but
whether it is sufficient for the software's actual needs.

The gamebook's needs are modest: it needs to know that a shield exists, that it is an
equipment item, that it belongs to the SRD, and that its game-mechanical effect is a +2 armour
class bonus applied at character creation time. The rest of the rulebook prose, the flavour
text, the historical context, the equipment weights in pounds, is not needed by the code.

The smallest useful rule record looks like this:

```typescript
interface NamedRule {
  id: string;
  name: string;
  sourceId: RuleSourceId;
}

interface EquipmentRule extends NamedRule {
  kind: "equipment";
  category: "armour" | "weapon" | "adventuring-gear" | "tool";
  armourClassBonus?: number;
  damageDice?: string;
}
```

`id` is the stable identifier. `name` is the display string. `sourceId` is the identifier of
the source the rule came from. Everything else is the specific mechanical detail that makes
this rule usable.

---

## Start With Source

Before a rule can be stored, the source it came from must be established. This is not
bureaucratic fastidiousness; it has practical consequences.

The source determines what the software may do with the rule. An SRD rule, released under
Creative Commons Attribution 4.0, can appear in a published gamebook with attribution. A rule
from a third-party supplement that has its own licence cannot be published without permission.
A rule from a private campaign note can be used at one table and nowhere else. The software
that stores these rules needs to know which category each one falls into, because the answer
changes what can be exported, published, or shared.

```typescript
type RuleSourceId = "srd-5-1-cc" | "dads-original";

interface RuleSource {
  id: RuleSourceId;
  title: string;
  licence: string;
  url?: string;
  licenceUrl?: string;
  attribution: string;
}

const RULE_SOURCES: Record<RuleSourceId, RuleSource> = {
  "srd-5-1-cc": {
    id: "srd-5-1-cc",
    title: "Dungeons & Dragons System Reference Document 5.1",
    licence: "Creative Commons Attribution 4.0 International",
    url: "https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf",
    licenceUrl: "https://creativecommons.org/licenses/by/4.0/",
    attribution:
      "This content uses material from the Dungeons & Dragons System Reference " +
      "Document 5.1, available under Creative Commons Attribution 4.0 International.",
  },
  "dads-original": {
    id: "dads-original",
    title: "Dungeons & Data Structures original gamebook material",
    licence: "Project-owned original material",
    attribution: "Original content created for the Dungeons & Data Structures gamebook.",
  },
};
```

The two sources have different licences and different implications. SRD content carries an
attribution requirement: the published gamebook must credit the source, which the
`attribution` string provides as a ready-made text. The original project content has no
such obligation.[^1]

The source record goes on the shelf before any rules are filed. Every rule that follows will
reference one of these sources, and the source's policy will govern what can be done with it.

---

## Entities, Mechanics, And The Separation Between Them

A rule entity is the named thing: "Shield", "Grappled", "Wizard", "Bless". An entity can be
described with prose alone, and that description might be sufficient for a display page.

But the software often needs more than a description. It needs to know whether "Shield" is
armour or a weapon. It needs to know that "Grappled" is a condition with mechanical effects.
It needs to know that "Wizard" is a character class with a particular hit die, saving throw
proficiencies, and spellcasting ability. These details are what turn a named entity into
something the application can filter, link, and use.

The gamebook keeps these at the level of detail it actually needs. The SRD catalogue in
`src/gamebook/rules/srd.ts` holds compact records:

```typescript
interface ClassRule extends NamedRule {
  kind: "class";
  hitDie: DamageRoll;
  primaryAbility: Ability;
  spellcastingAbility?: Ability;
}

const CLASS_RULES: ClassRule[] = [
  {
    id: "fighter",
    name: "Fighter",
    sourceId: "srd-5-1-cc",
    kind: "class",
    hitDie: { dice: 1, sides: 10, modifier: 0, type: "hit points" },
    primaryAbility: "strength",
  },
  {
    id: "wizard",
    name: "Wizard",
    sourceId: "srd-5-1-cc",
    kind: "class",
    hitDie: { dice: 1, sides: 6, modifier: 0, type: "hit points" },
    primaryAbility: "intelligence",
    spellcastingAbility: "intelligence",
  },
  // ... Rogue and Cleric
];
```

The `hitDie` field uses `DamageRoll` from Chapter 6 rather than a bare number, because the
same dice notation type is used consistently throughout the gamebook's rules. The catalogue
contains the minimum the code actually reads: the hit die for calculating starting hit points,
the spellcasting ability for any future spell mechanics.[^2]

Campaign Ledger separates this more formally into two database tables. `rules_entities` stores
the named thing: its source, its entity type, its slug. `rule_mechanics` stores typed JSON
payloads attached to the entity: spell level, spell school, equipment category, action timing,
reset cadence. The separation means an entity can accumulate multiple mechanic payloads, and
each payload can be updated or replaced without touching the entity record itself.

For the gamebook, a flat TypeScript interface is sufficient. The design principle is the same:
the entity is the name; the mechanic is the machine-readable detail. They have different
reasons to change and should be changed independently where possible.

---

## Provenance: Making Bugs Explainable

Provenance is the record of where something came from. For rules data, provenance answers:
which source provided this entity, when it was imported, and what path it followed from the
source into the application.

The gamebook records provenance through the `sourceId` field on every rule. That field is
enough to satisfy the attribution requirement and to answer the policy question: can this rule
appear in the published static build?

Campaign Ledger goes further, because it imports rules from external files and needs to be
able to explain any rule record in the database:

```typescript
interface RuleMechanicPayload {
  originalPath?: string;
  ruleType?: string;
  source?: string;
  srdVersion?: string;
}
```

`originalPath` is the file path the rule was imported from. `ruleType` is what the importer
inferred the rule to be. `source` is the source's abbreviation. `srdVersion` identifies which
edition of the SRD the rule belongs to.

These fields are not for display. They are for debugging. When a rule in Campaign Ledger
renders unexpectedly, or when a question arises about whether a particular rule is
SRD-eligible, the provenance fields make the answer available without manually tracing the
import history. The record of where something came from is part of the data.[^3]

---

## Source Precedence

The Wizard's three spellbooks describe the same incantation with different details. This is not
a hypothetical problem. Real rules data has overlapping sources: a spell might appear in the
core SRD and in a third-party supplement with additional flavour text and revised mechanics.
A condition might appear in the base rules and in a campaign-specific house ruling that modifies
its effect.

The software needs a policy for this. When two sources describe the same entity, which one
wins?

Campaign Ledger answers with a `precedence` field on each source:

```typescript
interface RulesSource {
  slug: string;
  name: string;
  contentCategory: "srd" | "third_party" | "local";
  visibility: "public" | "campaign";
  publicExportEligible: boolean;
  precedence: number;
}
```

Higher precedence wins. When the importer encounters two records for the same entity slug,
it keeps the one from the higher-precedence source. If a campaign has a house-ruled version
of a condition, stored in a campaign-scoped source with high precedence, it overrides the
SRD version for that campaign's queries. The public export, however, uses only sources with
`publicExportEligible: true`, which the campaign-local source is not.[^4]

The gamebook does not yet need this level of source management. It has two sources: SRD 5.1
and project-original material. The SRD content has priority for attribution purposes; the
project-original content has priority for the game's specific mechanics. There is no conflict
requiring a precedence resolution. The important lesson to carry forward is: define the
resolution rule before the conflict exists, not after.

---

## Visibility And Public Export

Some rules belong to everyone. Some belong to a specific campaign. Some belong to neither, in
the sense that they are drafts not yet ready for any audience.

This is the visibility problem, and it appears in every system that manages information for
multiple audiences at once. In Campaign Ledger, it maps directly onto the access control
concepts from Chapter 9:

```typescript
type SourceVisibility = "public" | "campaign";
```

A `public` source can be browsed by any visitor to the rules reference page. A `campaign`
source is visible only within the campaign context it belongs to. The `publicExportEligible`
flag on a source determines whether its rules may appear in exports, downloads, or the
published static gamebook.

The practical consequence: when the gamebook builds its static output, it uses only rules from
`publicExportEligible` sources. It does not need to ask whether each individual rule is
exportable; it asks whether the rule's source is. The policy lives at the source level, not
the entity level.

This is another instance of the principle from Chapter 8: gate at the right level of
abstraction. A choice that requires a brass key checks for the key's presence. A rule that
belongs to a public source does not need a per-rule export flag; the source's export policy
covers it.[^5]

---

## The Rules Page As A Product Feature

Rules provenance is not just a data-integrity concern. In Campaign Ledger, it has become a
visible product feature.

The rules reference page filters by source category, entity type, equipment category, and
spell level. A player browsing for spells sees only SRD-eligible spells. A game master
browsing within a campaign can also see campaign-scoped rules from imported supplements.
The visibility filtering is the same filter from the access control layer: the reader's
context determines what they see, and the source's visibility category determines whether
it appears in that context.

This means that adding a new rules source to Campaign Ledger is not just a data operation.
It is a product decision: the source's `contentCategory`, `visibility`, and
`publicExportEligible` fields determine how its rules participate in browsing, searching, and
exporting. The data model encodes a policy, and the UI expresses it.

The gamebook's smaller version of this is the attribution panel: a section of the published
gamebook that lists every source, its licence, and the required attribution text. This panel
is generated from `RULE_SOURCES`, filtered to sources actually used by the current adventure.
It is produced automatically rather than written by hand, which means it stays accurate as
the adventure's content evolves. Adding a new SRD-derived item to the adventure catalogue
automatically adds its source to the attribution list.

---

## Linking Rules To Play Objects

Rules data earns its keep when it is connected to the things that use it.

In Campaign Ledger, characters link to rules. A character has a list of prepared spells, each
of which is a reference to a rule entity. A character has selected class features, each linked
to a source. A character has equipment entries, each connected to the equipment catalogue. The
character sheet is assembled partly from mutable play state (current hit points, conditions,
resources) and partly from rule links (spell descriptions, class feature text, equipment names
and categories).

The link from the character to the rule is stable: it stores the rule's slug, not a copy of
its text. When the rule's text is corrected or expanded, the character sheet reflects the
update automatically. When a campaign-scoped rule is removed, any character links to it can
be identified and resolved. The reference is the source of truth; the copy is the risk.

The gamebook does the same thing at the item level. An `ItemDefinition` stores a `sourceId`
that points to the rule source, and `EQUIPMENT_RULES` in `src/gamebook/rules/srd.ts` holds
the catalogue entry. The item in the save state holds the item's id; the display layer looks
up the name and category from the catalogue. When an item's display name changes, every
reference to it by id reflects the update.[^6]

---

## What The Gamebook's SRD Catalogue Actually Contains

It is worth being specific about what the gamebook uses from the SRD and what it does not.

The gamebook uses SRD 5.1-compatible vocabulary and mechanics. It does not reproduce class
feature descriptions, spell descriptions, monster stat blocks, or any other extended prose
from the SRD. What it uses is the structural vocabulary: the names of the six ability scores,
the four character classes, the four playable races, the standard set of conditions, the names
and categories of starting equipment, and the abstract mechanics of proficiency bonuses,
ability modifiers, and dice notation.

The `srd.ts` catalogue holds compact records for these. A `SkillRule` records the skill's
name, the associated ability, and whether the gamebook uses it. An `EquipmentRule` records
the item's name, category, any armour class bonus or damage dice, and whether it is SRD-derived
or project-original. The records are factual rather than descriptive: they contain what the
code needs, not what a reader would find interesting.[^7]

This is the honest version of SRD use: credit the source, use the mechanics, write your own
prose. The adventure passages in Mt. Graphnor describe the brass key, the rations, and the
locked door in original language. The SRD catalogue tells the code that a quarterstaff is a
weapon with 1d6 damage. The two things are in different files, maintained independently,
and governed by different licence obligations.

---

## The Build Move

By the end of this chapter, the gamebook has an explicit, attributed rules catalogue:

- `RuleSourceId` and `RuleSource` in `src/gamebook/rules/srd.ts` define the two sources
  the gamebook draws on: SRD 5.1 Creative Commons and project-original material. Each source
  carries a title, a licence, and a ready-to-use attribution string.
- `RULE_SOURCES` is the catalogue of sources, keyed by `RuleSourceId`.
- `NamedRule`, `SkillRule`, `ClassRule`, `RaceRule`, and `EquipmentRule` are the compact rule
  entity types shown in this chapter.
- `ABILITY_RULES`, `SKILL_RULES`, `CLASS_RULES`, `RACE_RULES`, and `EQUIPMENT_RULES` are the
  structured catalogues in `src/gamebook/rules/srd.ts`. Each entry carries a `sourceId`.
- `gamebookRuleAttributions()` generates the attribution strings for all sources used by
  the current adventure, suitable for the published gamebook's legal section. It derives
  this from the `RULE_SOURCES` catalogue automatically.
- `ItemDefinition.sourceId` in `src/gamebook/model.ts` connects items in the adventure
  catalogue to their rule source.

The adventure validation in `src/gamebook/graph.ts` checks that every item's `sourceId`
matches a known `RuleSource`, and `srd.test.ts` verifies that the SRD source has the correct
metadata, that the catalogue entries cover the playable character model, and that character
template inventory references catalogued equipment.

---

The Archivist's value is not having opinions about which spellbook is correct. It is having a
complete and accurate record of which spellbook is which, what was changed in each edition,
and who made the changes. That record is the prerequisite for any policy decision worth
trusting.

Software rules data works the same way. The source, the licence, the attribution requirement,
the visibility category, the export eligibility: these are not footnotes to the real data.
They are the conditions under which the real data may be used. Without them, you have rules.
With them, you have rules you can publish, share, reason about, and explain to someone who
asks where they came from.

In Chapter 12, we'll turn from the rules the game runs on to the state the player accumulates
while running it. Saving a game is a contract: a promise that the progress made in one session
can be resumed in another. What that contract requires, how it handles change over time, and
what happens when it breaks are the subjects of the next chapter.

---

[^1]: The Creative Commons Attribution 4.0 International licence requires attribution but
permits commercial use, modification, and redistribution. For the gamebook, the practical
obligations are: include the attribution notice in the published output, do not imply that
Wizards of the Coast endorses the work, and do not claim that the SRD content is original
material. The licence text is at [creativecommons.org/licenses/by/4.0/legalcode](https://creativecommons.org/licenses/by/4.0/legalcode).
The SRD 5.1 PDF is at [media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf).

[^2]: The SRD 5.1 contains complete class descriptions, subclass options, and tables for every
level up to 20. The gamebook uses approximately none of this. It uses the hit die, the
saving throw proficiencies, and the spellcasting ability score, because those three facts
are what `createCharacter` in `src/gamebook/rules/character.ts` needs to build a level-one
character. The rest is not used, not copied, and not reproduced. The minimum viable rule
record is not a summary of the class; it is the three fields the code actually reads.

[^3]: Provenance in data systems has a formal literature. Tim Berners-Lee's linked data
principles include the idea that data on the web should be linked to its source, which is
partly a usability argument and partly a trust argument. In the context of rules data, the
provenance is what makes it possible to say "this rule comes from source X, which has
licence Y, which permits use Z." Without the chain from rule to source to licence, every
rule is an assertion without a basis.

[^4]: The precedence resolution in Campaign Ledger is deterministic: given the same set of
sources and the same entity slug, the importer always produces the same result. Determinism
is important for debugging and for testing. A non-deterministic import that produces
different results on different runs creates a class of bugs that are notoriously difficult to
reproduce and fix. The sort order and precedence comparison should be tested with fixtures
that include overlapping sources.

[^5]: The alternative, adding an export flag to every rule entity individually, is technically
equivalent but much harder to manage. It requires auditing every rule in the database when
a licence changes, rather than updating one source record. Source-level policy is a specific
instance of the principle from Chapter 4: store the minimum and derive the rest. The
derived fact is "can this rule be exported?" and the stored fact is "does this rule's source
permit export?" One update propagates correctly; one thousand updates accumulate errors.

[^6]: This is the normalisation argument from database design: store each fact once, in the
right place, and reference it everywhere it is needed. Denormalisation, storing the same fact
in multiple places, trades consistency for query performance. For display names that rarely
change and are queried frequently, denormalisation is sometimes worth it. For names that
change occasionally, like a corrected item description, the consistency argument is stronger:
fixing one record fixes every reference to it.

[^7]: The SRD 5.1 defines conditions including Blinded, Charmed, Deafened, Frightened,
Grappled, Incapacitated, Paralysed, Petrified, Poisoned, Prone, Restrained, Stunned, and
Unconscious. The gamebook's condition model stores condition names as strings in the
`GameState.conditions` array. The full mechanical effects of each condition are not yet
implemented in the prototype; the gamebook uses conditions as flags that can gate choices and
display summaries. The SRD catalogue names them for attribution. A future expansion would
add mechanic records for each condition: which ability checks are affected, which actions are
unavailable, and what removes the condition. That expansion would use the same source/entity/
mechanic pattern this chapter describes.
