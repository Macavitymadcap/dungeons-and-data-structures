# Chapter 4: Character Sheets As Data Models

---

> **The Scribe and the Hero**
>
> The Scribe uncapped the ink pot, straightened the vellum, and set the quill where it would be
> easy to reach. Then looked up.
>
> "Right," said the Scribe. "Let's start with your name."
>
> "Brandavar the Twice-Born," said the Hero, dropping into the chair and crossing one boot over
> the other knee before the Scribe had finished asking. "Redeemed servant of the Pale Flame.
> Wanderer of the Sunken Roads. Bearer of the Sorrow-Glass."
>
> "That's very good." The Scribe wrote *Brandavar*. "And your calling? Sword, shadow, or
> scripture?"
>
> "I am beyond such distinctions," said the Hero. "I contain multitudes."
>
> The Scribe set the quill down.
>
> "I need to know your calling," said the Scribe, "because it tells me what arms you've trained
> with, what armour your body knows, what oaths you've made and to whom, and how far you've
> walked the road that made you. I have columns for sword-sworn, for shadow-walkers, and for
> those who carry the word of gods. I do not have a column for *multitudes*."
>
> A pause.
>
> "Sword-sworn," said the Hero.
>
> "Good," said the Scribe, picking the quill back up. "Now. Your endurance. How much punishment
> can you take before you stop?"
>
> "I have endured wounds that would fell lesser mortals," said the Hero. "I am, for practical
> purposes, unkillable."
>
> "That will not fit in the ledger," said the Scribe. "I need something I can write next to the
> others, so the healers know when to worry and the commanders know how hard to push. How many
> sword-cuts before you go down?"
>
> The Hero thought about it seriously for the first time.
>
> "Ten," they said.
>
> "Ten," said the Scribe, and wrote it down.

---

In the previous chapter, we built a web surface for the gamebook: passages rendering as HTML,
choices submitting as forms, fragments swapping in over htmx. The dungeon has a door. The door
opens. But who walks through it?

Before a player can make a choice that has mechanical weight, before a Stealth check can succeed
or fail, before a sword can deal damage or a goblin can deal it back, we need a character. Not
a story, not a backstory, not a personality: those come later and are wonderful, but the rules
don't need them. What the rules need is a structured record of specific facts that can be looked
up, calculated from, and updated when something happens.

That record is a **data model**. Building one is the subject of this chapter.

---

## The Sheet As A Record

A character sheet in D&D is a form. A physical, paper form: boxes for numbers, space for names,
a section for equipment, somewhere to tick off spell slots. It organises a character's attributes
into a known shape so that any rule in the game can find what it needs quickly. The six **ability
scores** (Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma) measure a
character's fundamental capacities; from each score, a **modifier** is derived, which is the
number added to relevant dice rolls. **Hit points** represent how much punishment a character can
absorb before going down. **Armour class**, often abbreviated AC, is the target number an attack
roll must meet or exceed to land. The Fighter's attack roll modifier is here. The Wizard's spell
save DC, the difficulty a target must beat to resist a spell's effect, is calculated from that.
The current hit points are there, next to the maximum.

Software has the same problem and uses the same solution. A **record** is a named collection of
related fields: each field has a name, a type, and an allowed set of values. TypeScript expresses
this with an interface:

```typescript
interface Character {
  id: string;
  name: string;
  class: CharacterClass;
  race: CharacterRace;
  level: number;
  abilityScores: Record<Ability, number>;
  maxHitPoints: number;
  armourClass: number;
  skillProficiencies: Skill[];
  inventory: string[];
}
```

This is a minimal but honest `Character`. It contains exactly the facts that the gamebook's rules
will need in the first few chapters: who the character is, what class and race they belong to,
their level, their ability scores, their hit points, their armour class, what they're good at,
and what they're carrying. Nothing more, not yet.

The discipline of keeping a model small is harder than it sounds. The temptation, when building a
character record, is to reach immediately for the full player's handbook: backgrounds, spell
slots, condition immunities, languages, carrying capacity in pounds. All of that is real and
useful. None of it is needed to unlock the first door in the dungeon. A model should fit the
rules it currently serves, and grow when the rules require it.

---

## Closed Doors: Vocabularies And Types

Some fields in the character record are free-form: `name` is whatever string the player types,
`id` is whatever identifier the system assigns. Others are not. A character's class is not an
arbitrary string. It is one of a specific set of options, and the rules behave differently
depending on which one it is.

A **closed vocabulary** is a field whose valid values are known in advance and fixed. TypeScript
expresses these as union types:

```typescript
type CharacterClass = "fighter" | "rogue" | "wizard" | "cleric";

type CharacterRace = "human" | "elf" | "dwarf" | "halfling";

type Ability =
  | "strength"
  | "dexterity"
  | "constitution"
  | "intelligence"
  | "wisdom"
  | "charisma";
```

The value `"fighter"` is not just a label. It is a stable identifier that every part of the
system can use to look things up. A function that calculates a Fighter's hit dice can check
`character.class === "fighter"` without worrying that someone has entered `"Fighter"`, `"FIGHTER"`,
or `"swordsman"` instead. The type system enforces the vocabulary at compile time; the validation
layer enforces it at runtime, when data comes in from forms, save files, or anywhere else the
type checker can't see.

`Record<Ability, number>` uses this vocabulary directly: it means a JavaScript object with
exactly one key for each of the six ability names, each holding a number. The type checker will
complain if any ability is missing or misspelled. It is the closest thing TypeScript offers to
a typed tuple with named positions.[^1]

---

## Stored Facts And Derived Facts

Here is a distinction that will save considerable pain later: some fields in a character record
are **stored facts** and others are **derived facts**, and they should be treated differently.

A stored fact is a value that must be recorded because nothing else can produce it. Ability scores
are stored facts: you rolled them, or you chose them with a point-buy system, or your dungeon
master handed them to you. They do not follow from any other field in the record. If you don't
write them down, they are lost.

A derived fact is a value that can be calculated from stored facts whenever it's needed. The
ability modifier for a Strength score of 14 is always +2, by the formula `floor((score - 10) / 2)`.
You do not need to store the modifier if you have the score. In fact, storing it creates a risk:
the modifier and the score can become inconsistent, because two copies of the same information
can be independently updated in different directions.[^2]

The cleaner approach is to store the score and calculate the modifier:

```typescript
function abilityModifier(score: number): number {
  return Math.floor((score - 10) / 2);
}
```

Four lines. No state to go wrong. The same is true of the proficiency bonus, which in the
SRD[^5] follows a stepped table by level, and skill modifiers, which are the sum of an ability
modifier and an optional proficiency bonus:

```typescript
function proficiencyBonus(level: number): number {
  return Math.floor((level - 1) / 4) + 2;
}

function skillModifier(
  character: Character,
  ability: Ability,
  skill: Skill
): number {
  const mod = abilityModifier(character.abilityScores[ability]);
  const isProficient = character.skillProficiencies.includes(skill);
  return isProficient ? mod + proficiencyBonus(character.level) : mod;
}
```

These helpers live in `src/gamebook/rules/character.ts`. They are pure functions: given the same
inputs, they always return the same output. They have no side effects. They are trivially easy to
test. When the rules say "roll 1d20 and add your Dexterity modifier", the code can call
`abilityModifier(character.abilityScores.dexterity)` and trust the answer completely.

This pattern, store the minimum and derive everything else, is not a gamebook-specific idea. It
appears in database design, functional programming, spreadsheet architecture, and anywhere else
that people have learned the hard way what happens when derived values are allowed to drift
from their sources.

---

## A Note On What We Haven't Done

The approach in this chapter, a plain interface for the data and separate pure functions for the
derived values, is not the only way to model a character in TypeScript, and it may not be the
first approach that feels natural. There is a temptation, when you notice that characters and
monsters share a lot of the same vocabulary, to bundle the data and the behaviour together into
a single structure that can represent both. TypeScript supports this, and there are good reasons
to consider it.

There are also reasons not to, particularly when the shared vocabulary starts to diverge in
ways that are hard to anticipate. That tension is the whole subject of the next chapter, and it
needs more space than a section at the end of this one. For now it is enough to say: the gamebook
uses plain interfaces and pure functions because they are easy to understand, easy to test, and
honest about what they are. We'll look at the alternatives, and at what they cost, in Chapter 5.

---

## Validation At The Gate

TypeScript's type system is a compile-time tool. It catches mistakes while you write code: if you
try to assign `"barbarian"` to a `CharacterClass` field, the compiler will tell you before the
program runs. This is enormously useful and covers the majority of mistakes that happen during
development.

It covers none of the mistakes that happen at runtime.

When a player's save file is loaded from local storage, when an imported JSON file arrives over a
form, when a URL parameter is parsed, the type checker is not present. The incoming data is
a string. It might be a valid serialised `GameState`, or it might be the corrupted remnant of an
earlier version, or the save file from a different adventure, or something a curious player hand-
edited to give themselves a thousand hit points. The program needs to handle all of these
gracefully.[^6]

The validation layer in `src/gamebook/state.ts` does this explicitly. When a save is loaded, it
checks:

- Is this a valid JSON string?
- Does it have the right `schema` field?
- Is the `version` one the code knows how to read?
- Does the `adventureId` match the current adventure?
- Is the `currentPassageId` a passage that actually exists?
- Is the `character.class` a valid `CharacterClass`?
- Is the `character.race` a valid `CharacterRace`?
- Are the ability scores within plausible bounds?

Each check that fails produces a readable error rather than a crash or a corrupted game state.
The player sees "This save file is for a different adventure" rather than a blank screen, which
is a small thing and also the right thing.

The rule of thumb is: trust the type system inside the application, and trust nothing that arrives
from outside it. The gate between them is where validation lives.

---

## Characters Across Systems

The D&D character sheet is one answer to the question "what does the software need to know about
a character?" but it is not the only one, and looking at the alternatives is instructive.

*Fighting Fantasy* takes the most minimal approach: three numbers. **Skill** measures combat
ability and luck; **Stamina** is hit points with a different name; **Luck** is a resource you can
spend to modify outcomes, decreasing each time you use it. That is the entire model. It is small
enough to hold in one hand, fast to generate, and sufficient to run a complete adventure. The
character sheet for a *Fighting Fantasy* hero fits on a bookmark.

*Daggerheart*, a 2024 tabletop RPG from Darrington Press, takes a different approach to the core
task of resolving uncertain actions. Rather than a single d20, players roll two twelve-sided dice
of different colours: the Hope die and the Fear die. The total still determines success against a
difficulty class (the target number the roll must meet), but which die is higher determines the
*flavour* of that success. Roll higher on Hope and the scene tilts in the player's favour; roll
higher on Fear and the GM earns a Fear token they can spend to drive the story toward trouble,
regardless of whether the player succeeded. The character model that sits behind this system needs
to track not just ability scores and hit points but a Hope and Fear economy at the table level:
two parallel resource pools that belong partly to the player and partly to the GM.[^3]

Video games face a version of the same problem. Skyrim's character model derives almost all of
its numbers from a single stored fact: the level of each individual skill. One-handed, Archery,
Sneak, Restoration: each skill increases with use, and the character's effective level follows
from the skill totals. There is no separate ability score system. The model is not a record of
who the character is at creation; it is a record of what the character has done. This means the
software must constantly recalculate derived values from accumulated skill experience rather than
from a fixed roll made at character creation.[^4]

Each of these models reflects a different answer to the same design question: what should the
character record store, and what should the rules derive? Fighting Fantasy minimises the record.
D&D stores base scores and derives modifiers. Skyrim stores skill histories and derives
everything else. Daggerheart stores per-character resources and connects them to a shared table
economy. These are not better or worse models in the abstract; they are different fits for
different play experiences.

The gamebook's model is closest to the D&D approach, for reasons of familiarity and SRD
availability. But the principle, store the minimum and derive the rest, is common to all of them.

---

## From Small Model To Large Sheet

It is worth stepping back briefly to see what this model looks like when it grows up.

Campaign Ledger's `CharacterSheetReadModel` assembles a full character sheet from several related
database tables: a `characters` row for the summary, `character_abilities` for the six ability
scores, `character_classes` for multi-class support, `character_resources` for hit dice (the dice
a character rolls when spending a short rest to recover hit points) and spell slots (limited-use
resources that power magic) and custom counters, `character_equipment` for the inventory,
`character_defences` for damage resistances and immunities, `character_skills` for proficiencies,
and a handful of others.
The ability modifier calculation, the proficiency bonus, and the skill modifier formulae are the
same functions; they just operate on data retrieved from a relational database rather than a flat
TypeScript object.

The database schema enforces its own validation layer. The `character_abilities` table has a
constraint requiring that the `ability_name` column is one of the six valid ability names. The
`level` column requires a value between 1 and 20. The `current_hit_points` column requires a
non-negative integer. These are the closed vocabularies and bounds from earlier in this chapter,
expressed in SQL rather than TypeScript, operating at a different level of the stack but serving
the same purpose.

The small gamebook model and the large Campaign Ledger model are not different ideas implemented
twice. They are the same idea at different scales. A `Character` in Mt. Graphnor is a flat record
suited to local storage and a single-player browser game. A `CharacterSheetReadModel` in
Campaign Ledger is a composed view across a relational schema suited to a shared application
with multiple users, concurrent sessions, and a need to update individual slices of the sheet
without rewriting the whole thing. The concepts are identical; the requirements determine the
shape.[^7]

---

## The Build Move

By the end of this chapter, the gamebook has a playable character model:

- `Character` in `src/gamebook/model.ts` stores identity, class, race, level, ability scores,
  maximum hit points, armour class, skill proficiencies, a starting inventory, and an attack
  profile.
- `GameState` keeps the mutable play state, current hit points, conditions, inventory, flags,
  and log, separate from the fixed character definition. Changing what you're carrying doesn't
  change who you are.
- `CHARACTER_TEMPLATES` and `RACE_TEMPLATES` in `src/gamebook/rules/character.ts` provide
  starting configurations for Fighter, Rogue, Wizard, and Cleric, and for Human, Elf, Dwarf,
  and Halfling. These are data, not subclasses.
- `abilityModifier`, `proficiencyBonus`, and `skillModifier` are pure functions that derived
  values can be calculated from on demand.
- The save validation in `src/gamebook/state.ts` checks that loaded data contains a valid class,
  a valid race, and ability scores within reasonable bounds before trusting it.

At the end of the character creation screen, the player has a `Character`. At the end of this
chapter, we understand what that character actually is: a structured record, a set of closed
vocabularies, a boundary between trusted internal state and untrusted external input, and a
handful of pure functions that turn stored facts into useful numbers.

---

The Scribe's instinct, that the rules need specific facts in a known shape, is exactly right. The
Hero's instinct, that their character transcends easy categorisation, is also right, just not for
the game mechanics. The two things can coexist: a character can be unknowable and mythic in the
story while being a `CharacterClass` and ten hit points in the code.

In the next chapter, we'll look at what happens when that `CharacterClass` field starts to feel
insufficient: when the Fighter wants to cast a spell, when the Cleric needs to carry a sword,
when the record's clean taxonomy starts to buckle under the weight of what the game can actually
do. That is the chapter about classes, composition, and the limits of inheritance.

---

[^1]: `Record<K, V>` is TypeScript's utility type for objects with a fixed set of keys of type
`K`, each holding a value of type `V`. `Record<Ability, number>` is equivalent to writing out
`{ strength: number; dexterity: number; constitution: number; ... }` by hand, but safer: if you
add a new value to the `Ability` union, TypeScript will remind you to add a corresponding entry
to any `Record<Ability, number>` you've created, rather than silently allowing the new ability
to be undefined.

[^2]: This is a specific instance of the broader principle sometimes called the single source of
truth: every piece of information should have one authoritative location. Duplication creates
synchronisation problems. Synchronisation problems create bugs. Bugs create the specific variety
of despair that comes from debugging a character sheet at eleven o'clock on a Thursday night.

[^3]: *Daggerheart* was designed by Spenser Starke and Rowan Hall and published by Darrington
Press in 2024. The Hope/Fear dual-die system is the game's most distinctive mechanical feature:
it replaces the D&D pass/fail binary with a four-quadrant outcome space (succeed/fail combined
with hope/fear), which gives the GM a resource economy even when players succeed. The character
model includes domains, subclasses, ancestry, community, experiences, and a card-based loadout
for abilities, all of which the data layer needs to track.

[^4]: Skyrim's skill-based model is a descendant of the *Elder Scrolls* series' earlier approach,
which went even further: *Morrowind* (2002) made almost every roll explicit, with chance-to-hit
numbers that produced the notorious situation where a beginning character could swing a sword
directly at an enemy and miss because the underlying skill value was too low. Skyrim smoothed
this out by making skill improvements felt through ability unlocks rather than raw chance, but
the underlying data model, accumulated skill experience rather than assigned base stats, remains
the same.

[^5]: The proficiency bonus progression in SRD 5.1 is: +2 at levels 1-4, +3 at levels 5-8,
+4 at levels 9-12, +5 at levels 13-16, +6 at levels 17-20. The formula `floor((level - 1) / 4) + 2`
produces the same result for all twenty levels. It is the kind of elegant compact formula that
makes you feel obscurely proud of whoever designed the underlying table, even though they probably
didn't design it from the formula.

[^6]: A thousand hit points is actually easy to handle. The interesting case is the player who
edits the save to give themselves a `currentPassageId` that points to a passage they haven't
reached yet. The validation layer should catch this because it checks passage existence. But it
raises the question of whether *preventing* this is the right call in a single-player browser
game with no server verification. That is a game design question as much as a software question,
and this book has opinions about both.

[^7]: This is one of the core arguments of domain-driven design: the model should fit the domain's
actual requirements, not a theoretical ideal. A model that perfectly represents every possible
D&D character across all editions, supplements, and house rules would be a genuinely impressive
piece of engineering. It would also be completely wrong for a small solo gamebook running in a
browser.