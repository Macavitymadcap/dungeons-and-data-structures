# Chapter 13: The Name For What We've Been Doing

---

> **The Scribe and the Wizard**
>
> The Scribe had been keeping the ledger for three years. Hero chronicles with
> closed categories: sword-sworn, shadow-walker, scripture-bearer, no column for
> "multitudes". Tallies that produced standings by formula. A curtain between what the
> heroes' chronicles showed and what sat behind the Dungeon Master's screen. A rule that
> said the great ledger was the truth of what had happened on the road, and the road was
> the truth of what the heroes had done, and the chronicles were the truth of what the
> heroes could do.
>
> The Scribe had arrived at all of this by instinct and necessity, without any particular
> vocabulary for it.
>
> The Wizard looked at the ledger for a long time.
>
> "The names you use," she said at last. "They are the same names the heroes use."
>
> "Of course," said the Scribe. "What other names would I use?"
>
> The Wizard set a book on the desk. It was blue, and heavy.
>
> "What is it?" said the Scribe.
>
> The Wizard said nothing. The Scribe looked at the ledger, then at the book, then back
> at the ledger.

---

In Chapter 12, we gave the save document a schema, a version, and an adventure id. The system
is honest about what it knows. In Chapter 11, rules had provenance. In Chapter 9, every actor
had a context-specific permission rather than a global role. In Chapter 4, the `Character`
interface stored ability scores and derived modifiers from them, because that is what a
character sheet actually does.

None of these decisions were arbitrary. They all followed from paying careful attention to
what the domain, the game of D&D, the gamebook format, the campaign management problem, was
actually like. The software modelled the real thing rather than inventing its own structures
for the programmer's convenience.

There is a name for this approach. It is **domain-driven design**, and it is, more than any
other single idea, what this book has been practising.

---

## The Map Should Match The Territory

A **domain** is the subject matter a piece of software exists to serve. Not the technology,
not the database schema, not the framework: the real-world activity the software represents.

For Campaign Ledger, the domain is tabletop RPG campaign management. For Mt. Graphnor, the
domain is a branching adventure gamebook. The vocabulary of those domains, hit points, armour
class, passages, choices, conditions, saving throws, encounters, does not belong to software.
It belongs to the game. The software borrows that vocabulary because the game is what it is
modelling.

This sounds obvious. It should be obvious. The surprising thing is how often it fails to happen,
and how quickly a codebase can drift from the domain it is supposed to represent. The drift is
usually well-intentioned. It starts with a `BaseEntity` class because it is convenient. It
continues with `AdventureNode` because "node" is the technically correct graph term, even though
nobody in the room would call a gamebook passage a node. Six months later the code speaks a
private language that belongs to no domain in particular.

Eric Evans named and systematised this approach in 2003 in a book that practitioners call the
blue book.[^1] His central argument is deceptively simple: the code should speak the same language
as the domain experts. Not a translation. Not an approximation. The same words, used the same way,
meaning the same things.

When a dungeon master talks about a character's hit points, they mean something precise: a number
that tracks how much damage the character can absorb before falling unconscious. When
`GameState.hitPoints` holds a number that tracks how much damage the character can absorb before
falling unconscious, the code and the domain expert are speaking the same language. There is no
translation layer, no impedance mismatch, no point where the code's concept of hit points diverges
from the game's.

When they diverge, something has gone wrong. The divergence is a signal that the model has drifted
from the domain it was supposed to represent.

---

## Calling Things What They Are

Evans calls the shared vocabulary of a domain and its software the **ubiquitous language**:
the set of terms that should appear identically in conversations, documents, diagrams, and
code. When the domain experts say "saving throw" and the code says `savingThrowCheck`, the
two are almost the same thing. When the domain experts say "saving throw" and the code says
`defensiveRollOutcome`, they have started to diverge, and the divergence will widen over time
as each side evolves independently.

I have a concrete example from this project. The `src/nodes/` directory that existed in an
earlier version contained an `AdventureNode` type with a `nextNodeId` field and an `isEnding`
flag. Technically accurate. Graph-theoretically correct. And completely wrong for a gamebook.
A gamebook author would not call a passage a "node". They would not say "the next node id" to
mean "where this choice leads". The vocabulary belonged to graph theory, not to gamebooks, and
it showed every time someone tried to explain what the code did.[^2]

Replacing it with `Passage`, `Choice`, and `targetId` was not a technical improvement. Nothing
changed about what the code did. What changed was that the code started describing itself in
terms anyone who had read a gamebook could follow. That is the whole game.

The gamebook's current vocabulary is visible in `src/gamebook/model.ts`: `Passage`, `Choice`,
`Encounter`, `GameState`, `EncounterState`, `EndingKind`. These names were not chosen because
they are good programming vocabulary. They were chosen because they are what a gamebook author
would call these things. A passage is a passage. An encounter is an encounter. An ending is an
ending. The code names them what the domain names them.

---

## Things That Have Identity And Things That Don't

Not everything in a domain has the same relationship to identity. Evans draws a line between
two kinds of things.

An **entity** is something with a meaningful identity that persists through change. A
character is an entity: Brandavar the Twice-Born is still Brandavar after losing hit points,
gaining equipment, levelling up, or changing conditions. The identity is what matters; the
attributes are what describe the current state of that identity. In code, entities have ids.

A **value object** is something defined entirely by its attributes, with no meaningful
independent identity. A damage roll is a value object: `{ count: 1, sides: 8, modifier: 3,
type: "slashing" }`. Two damage rolls with the same values are interchangeable. There is no
meaningful sense in which the damage roll from Tuesday's session is a different object from
an identical damage roll on Wednesday. Value objects can be copied, compared by value, and
replaced without ceremony.[^3]

In the gamebook: `Character` is an entity. `AttackProfile` is a value object. `Passage` is
an entity (it has a stable `id` that the graph, the save file, and the validator all reference
by name). `Choice` is closer to a value object: its identity comes from its parent passage
and its position, not from any independent id. `RollResult` is a value object: a snapshot of
what happened on a roll, with no ongoing identity of its own.

The distinction matters because it determines how you handle change. When an entity changes,
you update it in place and preserve its identity. When a value object changes, you replace it
entirely with a new one. `applyChoiceEffects` in `src/gamebook/state.ts` works this way: it
does not mutate the existing `GameState`; it produces a new `GameState` with the changed
values. The old state was a value snapshot. The new state is a different snapshot of the same
play session, which is the entity whose identity persists.

---

## What Validates Together, Lives Together

Some entities do not stand alone. They exist in clusters where one entity is the root and the
others are subordinates that only make sense within the cluster. Evans calls these
**aggregates**, and the root entity is the **aggregate root**.

The `Adventure` type is an aggregate root. It owns its `passages`, its `encounters`, its
`items`, its `discoveries`, and its `attribution`. None of those things has a meaningful
existence outside an adventure. You do not look up a `Passage` independently; you look it up
within an adventure via `createPassageMap`. The adventure enforces consistency across all of
them: `validateAdventure` checks that every item reference, every passage target, every
encounter id is coherent within the adventure's own catalogue. The aggregate root is the
consistency boundary.

`GameState` is similarly an aggregate root for the play session. It owns the current passage
id, the character, hit points, inventory, flags, encounter states, and log entries. The
consistency rules that govern the save document, the schema, the version, the adventure id
match, the passage id validity, operate across the whole aggregate. `parseGame` validates the
whole `GameState`, not its parts in isolation, because consistency is a property of the whole.

In Campaign Ledger, `Campaign` is an aggregate root. Characters, sessions, notes, NPCs,
imports, and wiki pages are all owned within a campaign. The access control from Chapter 9
follows directly from the aggregate boundary: checking `requireCampaignAccess` is checking
whether an actor has permission to interact with this aggregate. The campaign boundary is the
consistency boundary and the access boundary simultaneously, because the domain made them the
same thing.[^4]

---

## The Same Word Can Mean Two Different Things

A large domain is rarely one coherent model. Different parts of the same organisation, or the
same application, use the same words to mean subtly different things.

Evans calls these regions **bounded contexts**: areas within which a particular model and its
vocabulary are consistent and authoritative. At the boundary between two contexts, translation
is required.

The gamebook has two bounded contexts. The **adventure context** knows about passages,
choices, encounters, items, the graph, and validation. The **play context** knows about game
state, save documents, inventory effects, dice checks, and persistence. `model.ts` defines
the shared types that cross the boundary; `graph.ts` and `state.ts` are the domain logic of
their respective contexts.

The fact that both contexts use `Passage` does not mean they use it in the same way. The
adventure context treats a `Passage` as a node in a static graph to be validated. The play
context treats the current passage id as a pointer into that graph, looked up at runtime.
The same word; different use. Keeping the contexts separate means each can evolve
independently: tightening the validation rules in `graph.ts` does not require changes in
`state.ts`.[^5]

Campaign Ledger's bounded contexts are more clearly separated. The `campaigns` context knows
about sessions, prep, NPCs, wikis, and imports. The `characters` context knows about sheets,
abilities, skills, resources, and equipment. The `rules` context knows about sources, entities,
and mechanics. Each has its own repository, its own read models, and its own vocabulary for
the same underlying domain concepts. A "character" in the characters context is a full sheet
with abilities and resources. A "character" in the local play context is a summary with a
name, a class, and a level. Same word, different shape, appropriate to each context's needs.

---

## The Anti-Corruption Layer

When a bounded context must import vocabulary or data from outside its own model, Evans
recommends a translation boundary he calls an **anti-corruption layer**: a layer that converts
the external representation into the internal domain language, preventing the external model's
concepts from leaking into the internal one.

Chapter 11 described this without naming it. The SRD import in Campaign Ledger converts SRD
5.1 prose and structured JSON into the application's own `rules_entities` and `rule_mechanics`
schema. The importer is the anti-corruption layer. It translates "this is what the SRD calls
a Wizard" into "this is what the application's rules model calls a class entity with a
d6 hit die and intelligence spellcasting". The SRD's vocabulary does not leak into the
application's domain model. The application decides what it needs; the importer bridges the
gap.

The same pattern appears in the import pipeline for campaign content. A Game Master's Google
Doc is translated into normalised Markdown, with private URLs stripped and source metadata
preserved, before it enters the campaign domain. The importer prevents the Google Docs format,
its headings, its link structure, its embedded content, from polluting the internal
representation of campaign notes. The campaign domain speaks its own language; the importer
speaks both.[^6]

---

## Ask For What You Need, Not How To Get It

A **repository** is a domain-language interface for retrieving and storing domain objects.
The key word is "domain-language": the repository speaks in terms of the domain, not in terms
of the storage technology.

Campaign Ledger defines repository interfaces like `CharacterRepository`, `CampaignRepository`,
and `RulesRepository`. These interfaces say things like `getCharacter(id)`,
`listNpcSummariesForCampaign(campaignId, viewerId, viewerRole)`, and `updateResourceCurrent(resourceId,
delta)`. They do not say `SELECT * FROM characters WHERE id = ?`. The domain logic knows what
it needs; the repository knows how to get it. The SQLite implementation satisfies the
repository interface without the routes or domain modules ever knowing SQLite is involved.

The gamebook uses the same principle more simply. `StorageAdapter` from Chapter 12 is a
repository interface for the save document: `getItem`, `setItem`, `removeItem`. The play
session code knows it needs to load and save state; the browser provides `localStorage` and
the tests provide an in-memory object. Neither the play logic nor the tests know about the
other's storage reality.[^7]

---

## The Game Already Solved This

The reason D&D maps onto these ideas so naturally is that D&D is itself a well-designed
domain model. Decades of iteration by designers and millions of players have produced a
vocabulary that is precise, stable, and widely understood.

"Saving throw" does not mean "any roll to avoid something bad". It means a specific kind of
roll against a specific ability score, triggered by a specific category of effect, with
specific consequences for success and failure. The term is loaded with meaning. When the
gamebook's `CheckDefinition` has a `kind: "savingThrow"` field, it is borrowing that
precision without having to re-invent it.

The aggregate structure is visible in the published rulebooks. A character sheet is a
character aggregate: the character is the root entity, and their abilities, skills, inventory,
conditions, and resources are owned within it. The dungeon master's screen is a bounded
context boundary made physical: on one side, the information available to players; on the
other, the information the GM holds. The adventure module is an aggregate: encounters, rooms,
NPCs, and maps are all owned by the adventure and meaningless outside it.

Game designers made these structural decisions for the same reasons software architects make
them. They needed consistency: a character's proficiency bonus should be the same everywhere
it appears on the sheet. They needed bounded visibility: players should not know what the GM
rolls behind the screen. They needed stable identity: Brandavar is still Brandavar regardless
of which adventure they appear in. The game solved the same problems the software solves,
independently, decades earlier, and called the solutions by different names.[^8]

---

## What This Looks Like In Practice

Domain-driven design is not a collection of patterns to be applied mechanically. It is an
attitude: the code's job is to represent the domain honestly. Every naming decision, every
boundary, every interface is an opportunity to either reflect the domain faithfully or to
obscure it under implementation concerns.

In practice, this comes down to a few questions you start asking by reflex.

When you are naming a type, ask: what does the domain expert call this thing? Not what is
technically accurate, not what is convenient to type, but what does the person who actually
lives in this domain call it. If they call it a "saving throw", call it a saving throw. If
they call it a "campaign session", call it a campaign session. The name in the code is a
claim about the domain. It should be an honest claim.

When you are drawing a module boundary, ask: where does the domain say the responsibility
ends? The gamebook separates `graph.ts` from `state.ts` not because it is good module
structure in the abstract, but because adventure validation and play-session management are
genuinely different domain concerns. The boundary in the code follows the boundary in the
domain. If the domain does not draw a line there, you should be suspicious of the module.

When you are writing validation, ask: what does the domain say is valid? The `Character`
interface constrains `class` to four named values because the domain has four playable classes.
The save document requires an `adventureId` because you cannot have a play session without an
adventure. These are not arbitrary technical constraints. They are domain rules, expressed in
code.

There is a test I find useful for checking whether a model has stayed honest. Take the type
definitions and read them to a domain expert, someone who knows D&D but not TypeScript. Can
they recognise the things being described? If `interface Character` with its `abilityScores`,
`maxHitPoints`, `armourClass`, `skillProficiencies`, and `inventory` looks like a character
sheet to a D&D player, the model is working. If it looks like a generic data structure that
could represent anything, the model has drifted from the territory it was supposed to map.[^9]

---

## The Build Move

This chapter does not introduce new code. It introduces a vocabulary for code that already
exists.

Looking back across the gamebook:

- `Adventure`, `Passage`, `Choice`, `Encounter` in `src/gamebook/model.ts` are the **entities**
  and **value objects** of the adventure domain, named in the domain's language.
- `Adventure` and `GameState` are **aggregate roots**: each enforces consistency across its
  owned objects through `validateAdventure` and `parseGame` respectively.
- `src/gamebook/graph.ts` and `src/gamebook/state.ts` are two distinct domain services,
  each representing a **bounded context**: adventure authoring and play session management.
- `StorageAdapter` in `src/gamebook/state.ts` is a **repository interface**: the play logic
  depends on the abstraction, not the browser storage implementation.
- The SRD catalogue in `src/gamebook/rules/srd.ts` is the gamebook's small
  **anti-corruption layer**: SRD vocabulary translated into the application's domain model,
  with source attribution preserved.

The ubiquitous language of the gamebook is `Passage`, `Choice`, `Encounter`, `GameState`,
`EndingKind`, `RollResult`: words a gamebook author would use, not words a database
administrator would use. That alignment was not accidental. It was the whole strategy.

---

The Scribe's three years of instinctive modelling and the blue book on the Wizard's desk
describe the same activity. The instinct comes first; the vocabulary comes when you want to
talk to other people about it, read about what has worked for others, or recognise when you
are about to make a well-documented mistake.

Domain-driven design does not solve software problems. It names a way of thinking about them
that keeps the code honest about what it represents. The domain is the dungeon. The software
is the map. A good map does not impose its own structure on the territory; it follows the
territory's structure faithfully enough that someone who knows the territory can read the map,
and someone who can read the map can find their way through the territory.

In Chapter 14, we will send a test party through every door to verify that the map is
accurate: that the code does what it claims, the published build contains what it should, and
the access boundaries hold under pressure.

---

[^1]: Eric Evans, *Domain-Driven Design: Tackling Complexity in the Heart of Software*
(Addison-Wesley, 2003). The book is long, dense, and worth reading slowly. Its core
arguments are clear; much of its bulk is examples and pattern catalogues. Martin Fowler's
website at [martinfowler.com](https://martinfowler.com/tags/domain%20driven%20design.html)
provides shorter, searchable treatments of the individual patterns. The blunt entry point is
Fowler's article "UbiquitousLanguage", which makes the core claim in about six paragraphs.

[^2]: The `src/nodes/` directory and its `AdventureNode` model are visible in the project's
early history. The migration to `src/gamebook/model.ts` with its `Passage` and `Choice`
types was exactly the kind of refactoring Evans describes: not changing what the code does,
but changing what the code says it is. The technical behaviour was equivalent. The model
became honest.

[^3]: The entity/value object distinction has a useful practical implication for equality.
Two entities with the same attributes are still two different entities if they have different
ids. Two value objects with the same attributes are the same thing. `AttackProfile`s with
identical fields can be compared by value and swapped freely. Characters with identical fields
but different ids are different characters. TypeScript does not enforce this distinction
automatically; it is a design commitment, not a type-system feature. Making it explicit, naming
it, helps the team maintain it consistently.

[^4]: The aggregate root as consistency boundary is one of Evans' most practically useful
ideas. It answers the question "what validates together?" The adventure validates as a whole
because the consistency rules, passage targets, item references, encounter ids, span the whole
adventure. You cannot validate a passage in isolation from the adventure that defines its
items and encounters. The aggregate root is the boundary at which you can meaningfully ask
"is this correct?"

[^5]: This is Evans' concept of context mapping: understanding which contexts exist, where
their boundaries are, and what translation is required at each boundary. Campaign Ledger's
architecture documents describe this implicitly in the repository interfaces: each repository
speaks its context's language, and the routes coordinate between contexts without the contexts
directly knowing about each other.

[^6]: The anti-corruption layer pattern is one of Evans' more widely adopted ideas, partly
because it solves a very practical problem: integrating with external systems without letting
the external system's design choices infect the internal model. Every system that consumes an
external API or imports from an external format benefits from an explicit translation layer.
The alternative, letting the external vocabulary in directly, accumulates as technical debt:
the code starts to speak the external system's language rather than the domain's language, and
the two become harder to disentangle.

[^7]: The repository pattern also makes testing significantly easier, which is one practical
argument for it that does not require any commitment to DDD philosophy. If the application
logic depends on a `StorageAdapter` interface rather than directly on `localStorage`, tests
can inject a simple in-memory object and verify behaviour without needing a browser. This is
the same injectable dependency pattern used for `RandomSource` in Chapter 6: depend on the
contract, not the implementation, and the tests can control the implementation.

[^8]: This observation is not unique to D&D. Any sufficiently mature domain develops a rich
and precise vocabulary over time. Legal systems have terms of art with exact meanings. Medical
systems have clinical vocabulary. Financial systems have accounting terms. In each case,
domain-driven design's advice is the same: use the domain's vocabulary, do not invent your
own. The domain experts have usually spent considerably more time thinking about their domain
than the developers have, and their vocabulary reflects that.

[^9]: The "read the types" test is one I find genuinely useful. If the type definitions read
like a description of the domain, the model is honest. If they read like a description of the
database schema, or the API response format, or the programmer's convenience, the model has
been built upside down. Types describe what things are; the domain already knows what things
are; the code should agree.