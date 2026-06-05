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
sentence is useful for a person at a table who knows what a shield is, understands what Armour
Class means, and can apply the bonus themselves when the time comes. It is of limited use to
software that needs to know whether a character is currently wearing a shield, by exactly how
much that changes their AC, and whether the rule comes from a source the application is allowed
to publish.

Turning prose into data involves a deliberate loss. Flavour text, historical context, the
weight of the item in pounds: none of that travels into the record. What does travel is whatever
the software actually needs to act on. The question is not whether the data perfectly represents
the prose, but whether it is sufficient for the software's specific requirements. This is a
different question, and it has a smaller answer.

The gamebook's requirements are modest: it needs to know that a shield exists, that it is
equipment, that it comes from the SRD, and that its mechanical effect is a +2 armour class bonus.
That is the whole job. The smallest record that does that job looks like this:

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
  damage?: DamageExpression;
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
  hitDie: DamageExpression;
  primaryAbility: Ability;
  spellcastingAbility?: Ability;
}

const CLASS_RULES: ClassRule[] = [
  {
    id: "fighter",
    name: "Fighter",
    sourceId: "srd-5-1-cc",
    kind: "class",
    hitDie: { count: 1, sides: 10, modifier: 0, type: "hit points" },
    primaryAbility: "strength",
  },
  {
    id: "wizard",
    name: "Wizard",
    sourceId: "srd-5-1-cc",
    kind: "class",
    hitDie: { count: 1, sides: 6, modifier: 0, type: "hit points" },
    primaryAbility: "intelligence",
    spellcastingAbility: "intelligence",
  },
  // ... Rogue and Cleric
];
```

The `hitDie` field uses `DamageExpression` from Chapter 6 rather than a bare number, because the
same dice value object is used consistently throughout the gamebook's rules. The catalogue
contains the minimum the code actually reads: the hit die for calculating starting hit points,
the spellcasting ability for any future spell mechanics.[^2]

The entity is the name; the mechanic is the machine-readable detail. A `ClassRule` for the
Wizard does not reproduce the class description. It records the three facts `createCharacter`
actually reads: the hit die, the primary ability, and the spellcasting ability. The rest is not
used, not copied, and not reproduced.

---

## Provenance: Making Bugs Explainable

Provenance is the record of where something came from. In a rules catalogue, it answers a
question that sounds administrative until you need the answer urgently: which source provided
this entity, and is the software allowed to publish it?

The gamebook records provenance through the `sourceId` field on every rule. Every entry in
`srd.ts` carries either `"srd-5-1-cc"` or `"dads-original"`. The build pipeline checks the
source before including anything in the published output: SRD content carries the attribution
requirement; project-original content does not. Without the `sourceId` field, these are rules.
With it, they are rules the software can reason about, filter, and attribute correctly.

The record of where something came from is not a footnote to the real data. It is the condition
under which the real data may be used.[^3]

---

## Source Precedence

The Wizard's three spellbooks are not a contrived problem. Real rules data has overlapping
sources: the same spell might appear in the core SRD and in a third-party supplement with
different mechanics. The same condition might appear in the base rules and in a campaign-specific
house ruling that modifies its effect. The software needs a policy for this before the conflict
arrives, because writing the policy after the fact requires touching every query that assumed
there wasn't one.

The gamebook does not yet face this conflict; it has two sources with no overlapping entities.
The lesson worth carrying forward is that "define the resolution rule before the conflict
exists" is not fastidiousness. It is avoiding a specific class of bug I found the hard way.

In an earlier version of Campaign Ledger, the spell list was a flat file with no provenance
field. When I added a homebrew spell for one campaign, it appeared in the global spell browser
for every campaign, because there was no source-level visibility gate. Filtering it out required
touching every query that returned spells. Adding the `sourceId` field fixed the symptom.
Once source is in the model, that class of bug becomes structurally impossible: a query for
public-only rules does not return private-source records, because the filter is on a field that
every record must have.

---

## The Attribution Panel

Rules provenance has a direct practical consequence for the published gamebook: the attribution
panel. The SRD's Creative Commons licence requires attribution. Rather than writing that
attribution by hand and hoping it stays accurate as the adventure grows, the panel is generated
automatically from `RULE_SOURCES`, filtered to sources actually used by the current adventure.
Adding a new SRD-derived item to the adventure catalogue adds its source to the attribution
list without any manual step.

The gamebook also uses the source model to gate the static build. When publishing, only rules
from sources marked `publicExportEligible` appear in the output. The policy lives at the source
level, not the entity level: a choice that requires a brass key checks for the key's presence;
a rule that belongs to a public source does not need a per-rule export flag. The source covers
it.

The gamebook's item references work on the same indirection principle. An `ItemDefinition`
stores a `sourceId` pointing to the rule source, and `EQUIPMENT_RULES` in
`src/gamebook/rules/srd.ts` holds the catalogue entry. The save state holds the item's id; the
display layer looks up the name and category from the catalogue. When an item's display name
changes, every reference to it by id reflects the update automatically.[^5]

---

## What The Gamebook's SRD Catalogue Actually Contains

It is worth being specific, because the SRD is a large document and the gamebook uses a small
slice of it.

The gamebook uses SRD 5.1-compatible vocabulary and mechanics. It does not reproduce class
feature descriptions, spell descriptions, monster stat blocks, or any extended prose. What it
uses is the structural vocabulary: the names of the six ability scores, the four character
classes, the four playable races, the standard set of conditions, the names and categories of
starting equipment, and the abstract mechanics of proficiency bonuses, ability modifiers, and
dice notation.

The `srd.ts` catalogue holds compact records for these. A `SkillRule` records the skill's name,
the associated ability, and whether the gamebook uses it. An `EquipmentRule` records the item's
name, category, any armour class bonus or damage dice, and its source. The records are factual
rather than descriptive: they contain what the code needs to read, not what a player would find
interesting.[^7]

This is the honest version of SRD use: credit the source, use the mechanics, write your own
prose. The adventure passages in Mt. Graphnor describe the brass key, the rations, and the
locked door in original language. The SRD catalogue tells the code that a quarterstaff is a
weapon with 1d6 damage. The two things live in different files, change for different reasons,
and are governed by different licence obligations. Keeping them separate is not extra work. It
is the work.

---

## From Prose To Panel: A Single Rule's Journey

It is worth tracing one rule the full distance, because the individual pieces are easy to
follow and the chain is easy to lose.

The SRD states, in plain prose: a shield provides a +2 bonus to Armour Class. Sufficient
for a player at a table; not sufficient for code that needs to apply the bonus, attribute
the source, and decide whether to include it in a published export.

Turned into a catalogue record, the same rule looks like this:

```typescript
{
  id: "shield",
  name: "Shield",
  sourceId: "srd-5-1-cc",
  kind: "equipment",
  category: "armour",
  armourClassBonus: 2,
}
```

That record goes into `EQUIPMENT_RULES` in `src/gamebook/rules/srd.ts`. When the adventure
catalogue references `"shield"` as a starting item, the adventure validator checks that the
id exists in `EQUIPMENT_RULES` and that its `sourceId` matches a known `RuleSource`. When
the published gamebook renders its attribution panel, `gamebookRuleAttributions()` finds the
`"srd-5-1-cc"` source and includes the required attribution string automatically.

The SRD prose became a typed record. The typed record connected to a source. The source
carried its licence. The licence generated the attribution. The whole chain runs from one
entry in one catalogue file.

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
template inventory references catalogued equipment. The condition model and the full entity
and mechanic type hierarchy are in the repository; this chapter shows the structural pattern
rather than the complete catalogue.

---

The Archivist's value was never having opinions about which spellbook was correct. It was
having a complete and accurate record of which spellbook was which, what was changed between
editions, and who made the changes. That record is the prerequisite for any policy decision
worth trusting — including the Wizard's.

Software rules data works the same way. The source, the licence, the attribution requirement:
these are not footnotes to the real data. They are the conditions under which the real data
may be used. Without them, you have rules. With them, you have rules you can publish, share,
reason about, and explain when someone asks where they came from.

In Chapter 12, we'll turn from the rules the game runs on to the state the player accumulates
while running it. Saving a game is a contract: a promise that the progress made in one session
can be resumed in another. What that contract requires, how it handles change over time, and
what happens when it breaks are the subjects of the next chapter.

---

## At Scale: Campaign Ledger

The gamebook's source model has two entries. Campaign Ledger's has many, because it imports
rules from external files across multiple sources, editions, and licences, and needs to be able
to explain any record in the database on demand.

Each source carries a `precedence` field. When two sources describe the same entity slug,
the higher-precedence source wins. A campaign-scoped house rule can override the SRD version
for that campaign's queries without touching the shared rules corpus. The public export uses
only sources flagged `publicExportEligible`, which campaign-local sources are not. Source
policy propagates to every entity that carries the source's id: one field update, not a thousand.

Campaign Ledger also separates entity storage from mechanic storage. `rules_entities` stores
the named thing: its source, its entity type, its slug. `rule_mechanics` stores typed JSON
payloads attached to the entity: spell level, spell school, equipment category, action timing,
reset cadence. An entity can accumulate multiple mechanic payloads; each payload can be updated
without touching the entity record. The gamebook's flat `ClassRule` interface is the same idea
with the separation collapsed — sufficient at gamebook scale, instructive to see pulled apart.

Character sheets link to rules by id rather than embedding rule text. A character's prepared
spells, class features, and equipment entries are references. When a rule's text is corrected,
every character sheet that references it reflects the update. When a campaign-scoped rule is
removed, the affected character links can be identified and resolved. The reference is the
source of truth; the copy is the risk.

---

[^1]: The Creative Commons Attribution 4.0 International licence requires attribution but
permits commercial use, modification, and redistribution. For the gamebook, the practical
obligations are: include the attribution notice in the published output, do not imply that
Wizards of the Coast endorses the work, and do not claim that the SRD content is original
material. The licence text is at [creativecommons.org/licenses/by/4.0/legalcode](https://creativecommons.org/licenses/by/4.0/legalcode). The SRD 5.1 PDF is at 
[media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf).

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
`GameState.conditions` array. The gamebook deliberately uses conditions as flags that can
gate choices and display summaries rather than modelling the full mechanical effect of each
one: that level of detail belongs to a tabletop system run by a person, not a five-room
solo adventure. The SRD catalogue names the conditions for attribution. Modelling the full
effect of a condition, which ability checks it affects, which actions it removes, and what
ends it, would use the same source/entity/mechanic pattern this chapter describes, applied
to a system that needs that depth.