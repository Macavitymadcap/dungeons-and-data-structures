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

Campaign Ledger was always going to have two audiences. The first was anyone on the internet:
a public-facing site where people could browse SRD content, look up rules, and use the tools
that don't require a private campaign to make sense. The second was me and whoever I happened
to be running a game for: a private campaign space where homebrew content, house rules, and
the specific accumulated nonsense of an ongoing campaign could live without appearing anywhere
public.

The SRD material is redistributable. That is what the Creative Commons Attribution licence
means in practice: you can take the rules vocabulary, the class mechanics, the equipment
lists, the conditions, and put them in a published application, as long as you credit the
source. Homebrew content, on the other hand, is nobody's business but the table it was made
for. A spell invented for a recurring villain in one campaign should not appear in the global
spell browser for a stranger running a completely different game.

When I started designing the rules data model, the first question the schema had to answer was
not "what fields does a spell have?" It was "where did this rule come from, and what am I
allowed to do with it?" Without that field on every record, every query that returned rules
would have to decide the public/private distinction separately. There would be no consistent
policy: just a series of individual decisions made query by query, accumulating quietly into
something unmaintainable.

This chapter is the `sourceId` field: not as an afterthought appended to a working system,
but as the first design constraint that shaped everything else.

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
equipment, that it comes from the SRD, and that its mechanical effect is a +2 armour class
bonus. That is the whole job. The smallest record that does that job looks like this:

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

The `sourceId` field is not metadata sitting alongside the important parts. It is in
`NamedRule`, on the base interface, the first field defined after `id` and `name`, because it
is as fundamental as the name. A rule without a source is a claim without a basis.

---

## Start With Source

Before a rule can be stored, the source it came from must be established.

The source determines what the software may do with the rule. An SRD rule, released under
Creative Commons Attribution 4.0, can appear in a published gamebook with attribution. A rule
from a third-party supplement with its own licence cannot be published without permission. A
rule from a private campaign note can be used at one table and nowhere else. The software that
stores these rules needs to know which category each one falls into, because the answer changes
what can be exported, published, or shared.

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
attribution requirement: the published gamebook must credit the source, which the `attribution`
string provides as ready-made text. The original project content has no such obligation.[^1]

The source record goes on the shelf before any rules are filed. Every rule that follows will
reference one of these sources, and the source's policy governs what can be done with it. The
important thing is that the policy lives in the model, not in a comment, not in a separate
document, not in the institutional memory of the person who wrote the first query. When a new
developer, or a future version of yourself, adds a rule, the schema enforces the question:
where did this come from?

---

## Entities, Mechanics, And The Separation Between Them

There is a distinction worth drawing early, because collapsing it produces a category of bug
that is annoying to diagnose. A rule entity is the named thing: "Shield", "Grappled",
"Wizard", "Bless". A rule mechanic is the machine-readable detail that lets the software act
on it. The entity is the noun; the mechanic is what the code actually reads.

A display page can get away with prose alone. The software cannot. It needs to know whether
"Shield" is armour or a weapon. It needs to know that "Grappled" is a condition with
mechanical effects on movement and attack rolls. It needs to know that "Wizard" is a character
class with a particular hit die, saving throw proficiencies, and spellcasting ability. None of
that is in the name. All of it has to be somewhere else, in a form the code can use without
parsing English.

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

The `hitDie` field uses `DamageExpression` from Chapter 6 rather than a bare number, because
the same dice value object is used consistently throughout the gamebook's rules. The catalogue
contains the minimum the code actually reads: the hit die for calculating starting hit points,
and the spellcasting ability for spell mechanics.[^2]

The entity is the name; the mechanic is the machine-readable detail. A `ClassRule` for the
Wizard does not reproduce the class description. It records the three facts `createCharacter`
actually reads: the hit die, the primary ability, and the spellcasting ability. The rest is not
used, not copied, and not reproduced. This is the honest version of SRD use, and it is also,
not coincidentally, the legally correct one.

---

## What The Gamebook's SRD Catalogue Actually Contains

The SRD is a large document. The gamebook uses a small slice of it, and being specific about
which slice matters, because "we use the SRD" and "we use these three fields from four class
entries" are not the same statement legally or practically.

The gamebook uses SRD 5.1-compatible vocabulary and mechanics. It does not reproduce class
feature descriptions, spell descriptions, monster stat blocks, or extended prose of any kind.
What it uses is the structural vocabulary: the names of the six ability scores, the four
character classes, the four playable races, the standard set of conditions, the names and
categories of starting equipment, and the abstract mechanics of proficiency bonuses, ability
modifiers, and dice notation.

The `srd.ts` catalogue holds compact records for these. A `SkillRule` records the skill's
name, the associated ability, and whether the gamebook uses it. An `EquipmentRule` records
the item's name, category, any armour class bonus or damage dice, and its source. The records
are factual rather than descriptive: they contain what the code needs to read, not what a
player would find interesting.[^3]

The SRD 5.1 contains complete class descriptions, subclass options, and level tables all the
way to level 20. The gamebook uses approximately none of this. Three fields per class: hit
die, primary ability, spellcasting ability. That is what `createCharacter` in
`src/gamebook/rules/character.ts` actually reads. The discipline of the minimum viable record
is not modesty; it is avoiding the temptation to store things because they are interesting,
rather than because the software needs to act on them.[^4]

The adventure passages in Mt. Graphnor describe the brass key, the rations, and the locked
door in original language. The SRD catalogue tells the code that a quarterstaff is a weapon
with 1d6 damage. The two things live in different files, change for different reasons, and are
governed by different licence obligations. Keeping them separate is not extra work. It is the
work.

---

## Source Precedence: Defining The Policy Before The Conflict

The Wizard's three spellbooks are not a contrived problem. Real rules data has overlapping
sources, and without a resolution policy written into the model before the conflict arrives,
the policy ends up scattered: a WHERE clause here, a post-filter there, a comment explaining
why this query is different from the one above it. The model makes the careless version
structurally impossible, or it leaves that work to every developer who touches a query.

The gamebook has two sources with no shared entities, so the conflict hasn't arrived yet. But
the `sourceId` field is already in the model, which means when it does arrive, the resolution
goes in one place. The same spell might appear in the core SRD and in a third-party supplement
with different mechanics. The same condition might exist in the base rules and in a
campaign-specific house ruling. The software needs to know which wins, and it needs to know
before the first query is written that assumes there is only one answer.

The two-audience constraint that shaped Campaign Ledger's design is this problem stated in
advance. If the public site and the private campaign draw from the same rules database, and a
homebrew spell and an SRD spell can both appear in a spell query, then every query that returns
spells is implicitly making a visibility decision. Without a source field to filter on, the
only way to implement that decision is to encode it individually into each query. The policy is
present, but scattered across the codebase rather than expressed once in the model.

With a `sourceId` on every rule and a `publicExportEligible` flag on every source, the
decision is made once. A query for publicly visible rules filters on the source's eligibility.
A query for campaign-private rules includes sources that are not public. The homebrew spell
appears exactly where it should and nowhere else: not because each query was written carefully,
but because the model makes the alternative structurally awkward.[^5]

When a conflict eventually appears in the gamebook, the resolution policy goes in one place
and propagates everywhere.

---

## The Attribution Panel

Rules provenance has a direct practical consequence for the published gamebook: the attribution
panel. The SRD's Creative Commons licence requires attribution. Rather than writing that
attribution by hand and hoping it stays accurate as the adventure grows, the panel is generated
automatically from `RULE_SOURCES`, filtered to sources actually used by the current adventure.
Adding a new SRD-derived item to the adventure catalogue adds its source to the attribution
list without any manual step.

The gamebook also uses the source model to gate the static build. When publishing, only rules
from sources marked `publicExportEligible` appear in the output. The policy lives at the
source level, not the entity level.[^6] A rule that belongs to a public source does not need
a per-rule export flag; the source covers it.

The gamebook's item references work on the same indirection principle. An `ItemDefinition`
stores a `sourceId` pointing to the rule source, and `EQUIPMENT_RULES` in
`src/gamebook/rules/srd.ts` holds the catalogue entry. The save state holds the item's id;
the display layer looks up the name and category from the catalogue. When an item's display
name changes, every reference to it by id reflects the update automatically. The reference is
the source of truth; the copy is the risk.[^7]

---

## From Prose To Panel: A Single Rule's Journey

It is worth tracing one rule the full distance, because the individual pieces are easy to
follow and the chain is easy to lose.

The SRD states, in plain prose: a shield provides a +2 bonus to Armour Class. Sufficient for
a player at a table; not sufficient for code that needs to apply the bonus, attribute the
source, and decide whether to include it in a published export.

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
id exists in `EQUIPMENT_RULES` and that its `sourceId` matches a known `RuleSource`. When the
published gamebook renders its attribution panel, `gamebookRuleAttributions()` finds the
`"srd-5-1-cc"` source and includes the required attribution string automatically.

The SRD prose became a typed record. The typed record connected to a source. The source
carried its licence. The licence generated the attribution. The whole chain runs from one
entry in one catalogue file, and every link in the chain is something the code can check.

---

## The Build Move

By the end of this chapter, the gamebook has an explicit, attributed rules catalogue:

- `RuleSourceId` and `RuleSource` in `src/gamebook/rules/srd.ts` define the two sources the
  gamebook draws on: SRD 5.1 Creative Commons and project-original material. Each source
  carries a title, a licence, and a ready-to-use attribution string.
- `RULE_SOURCES` is the catalogue of sources, keyed by `RuleSourceId`.
- `NamedRule`, `SkillRule`, `ClassRule`, `RaceRule`, and `EquipmentRule` are the compact rule
  entity types shown in this chapter.
- `ABILITY_RULES`, `SKILL_RULES`, `CLASS_RULES`, `RACE_RULES`, and `EQUIPMENT_RULES` are the
  structured catalogues in `src/gamebook/rules/srd.ts`. Each entry carries a `sourceId`.
- `gamebookRuleAttributions()` generates the attribution strings for all sources used by the
  current adventure, suitable for the published gamebook's legal section. It derives this from
  the `RULE_SOURCES` catalogue automatically.
- `ItemDefinition.sourceId` in `src/gamebook/model.ts` connects items in the adventure
  catalogue to their rule source.

The adventure validation in `src/gamebook/graph.ts` checks that every item's `sourceId`
matches a known `RuleSource`. `srd.test.ts` verifies that the SRD source has the correct
metadata, that the catalogue entries cover the playable character model, and that character
template inventory references catalogued equipment. The condition model and the full entity
and mechanic type hierarchy are in the repository; this chapter shows the structural pattern
rather than the complete catalogue.

---

The Archivist's value was never having opinions about which spellbook was correct. It was
having a complete and accurate record of which spellbook was which, what had changed between
editions, and who made the changes. That record is the prerequisite for any policy decision
worth trusting, including the Wizard's.

A rules database without provenance has names and descriptions and statistics. It has
everything required to display and search content. What it cannot do is answer the question
the Archivist answers: where did this come from, and what are you allowed to do with it?
Without that, the policy distinguishing public content from private has to be reconstructed
separately in every query that cares about the difference. With it, the policy is stated once
and the queries inherit it.

In Chapter 12, we'll turn from the rules the game runs on to the state the player accumulates
while running it. Saving a game is a contract: a promise that the progress made in one session
can be resumed in another. What that contract requires, how it handles change over time, and
what happens when it breaks are the subjects of the next chapter.

---

## At Scale: Campaign Ledger

The gamebook's source model has two entries. Campaign Ledger's will have more, because it
needs to serve the two audiences described at the start of this chapter: a public site drawing
on redistributable SRD content, and a private campaign space that can hold homebrew material
without it appearing anywhere it shouldn't.

Each source in Campaign Ledger carries a `precedence` field. When two sources describe the
same entity slug, the higher-precedence source wins. A campaign-scoped house rule can override
the SRD version for that campaign's queries without touching the shared corpus. The public
export uses only sources flagged `publicExportEligible`, which campaign-local sources are not.
Changing a source's export eligibility propagates to every entity carrying that source's id:
one field update, not a query-by-query audit.[^8]

Campaign Ledger also separates entity storage from mechanic storage in a way the gamebook
collapses for simplicity. `rules_entities` stores the named thing: its source, its entity
type, its slug. `rule_mechanics` stores typed JSON payloads attached to the entity: spell
level, spell school, equipment category, action timing, reset cadence. An entity can
accumulate multiple mechanic payloads; each payload can be updated without touching the
entity record. The gamebook's flat `ClassRule` interface is the same idea with the separation
collapsed: sufficient at gamebook scale, but instructive to see pulled apart.

Character sheets link to rules by id rather than embedding rule text. A character's prepared
spells, class features, and equipment entries are references. When a rule's text is corrected,
every character sheet that references it reflects the update. When a campaign-scoped rule is
removed, the affected character links can be identified in one query. The reference is the
source of truth; the copy is the risk.

---

[^1]: The Creative Commons Attribution 4.0 International licence requires attribution but
permits commercial use, modification, and redistribution. For the gamebook, the practical
obligations are: include the attribution notice in the published output, do not imply that
Wizards of the Coast endorses the work, and do not claim that the SRD content is original
material. The licence text is at
[creativecommons.org/licenses/by/4.0/legalcode](https://creativecommons.org/licenses/by/4.0/legalcode).
The SRD 5.1 PDF is at
[media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf).

[^2]: The `hitDie` field could have been stored as a plain integer: 6 for a Wizard, 10 for a
Fighter. It uses `DamageExpression` instead because `createCharacter` feeds it directly into
the same dice-rolling infrastructure that handles combat, and keeping the type consistent
means the dice module needs no special case for character creation. Consistency in a small
system saves very little. Inconsistency in a growing one accumulates.

[^3]: Provenance in data systems has a formal literature. Tim Berners-Lee's linked data
design principles (published at
[w3.org/DesignIssues/LinkedData.html](https://www.w3.org/DesignIssues/LinkedData.html))
include the idea that data on the web should be linked to its source, which is partly a
usability argument and partly a trust argument. In the context of rules data, provenance is
what makes it possible to say "this rule comes from source X, which has licence Y, which
permits use Z." Without the chain from rule to source to licence, every rule is an assertion
without a basis.

[^4]: The SRD 5.1 defines Wizard subclasses, arcane traditions, spell slot tables by level,
and a great deal of other material the gamebook has no use for. The temptation when building
a rules catalogue is to be comprehensive; comprehensiveness feels like thoroughness. What it
actually produces is a catalogue of things the code will never read, which is to say a
catalogue of things that will silently fall out of date.

[^5]: The precedence resolution in Campaign Ledger is deterministic: given the same set of
sources and the same entity slug, the importer always produces the same result. Determinism
matters for debugging and for testing. A non-deterministic import that produces different
results on different runs creates a class of bugs that are notoriously difficult to reproduce.
The sort order and precedence comparison should be tested with fixtures that include
overlapping sources.

[^6]: The alternative, adding an export flag to every rule entity individually, is technically
equivalent but much harder to manage. It requires auditing every rule in the database when a
source's licence changes, rather than updating one source record. Source-level policy is a
specific instance of the principle from Chapter 4: store the minimum and derive the rest. The
derived fact is "can this rule be exported?"; the stored fact is "does this rule's source
permit export?" One update propagates correctly; a thousand updates accumulate errors.

[^7]: This is the normalisation argument from database design: store each fact once, in the
right place, and reference it everywhere it is needed. Denormalisation trades consistency for
query performance. For display names that rarely change and are queried frequently,
denormalisation is sometimes worth the trade. For names that change occasionally, the
consistency argument is stronger: one corrected record fixes every reference to it.

[^8]: The precedence approach also makes the resolution auditable. Because the winning source
is determined by a field on the source record rather than by insertion order or query
coincidence, a developer debugging an unexpected rule value can read the source records and
understand immediately why one won. This sounds obvious. It is only obvious once you have
debugged something that lacked it.