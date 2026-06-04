# Chapter 5: Classes, Composition, And The Limits Of Inheritance

---

> **The Wizard and the Apprentice**
>
> "All practitioners the great Art," said the Wizard, "trace their power back through a 
> lineage of teachers. My power comes from my master, Blorgana the Mysterious, who had it from 
> her master, Afrohorse Of Wyrmshire, who received it from the great Librarian of the Gilt Tower, 
> Dewey the Decimaliser. The line is unbroken; the gift passes through the chain."
>
> "What about her?" said the Apprentice, pointing through the window at a woman in white robes
> who was, at that moment, closing a wound in a soldier's side with nothing but a murmured word
> and an outstretched hand.
>
> The Wizard looked, eyeing the amulet around the woman's robes. "That is a Cleric of Heria."
>
> "She's doing magic."
>
> "Indeed."
>
> "Is she in your lineage?"
>
> "She is not."
>
> "Then where does her power come from?"
>
> The Wizard was quiet for a moment, chewing over an answer that satisfied her professionally but 
> admitted too much for comfort.
>
> "From her god," said the Wizard.
>
> "And your lineage doesn't go through Heria?"
>
> "No."
>
> "So the power doesn't come from the lineage," said the Apprentice. "The power comes from
> wherever it comes from. The lineage is just how *your kind* of power gets passed on."
>
> Another silence.
>
> "There is a tower," said the Wizard finally, "in which this distinction does not matter."
>
> "Where is the tower?"
>
> "Theoretical," said the Wizard, and turned back to her desk.

---

In Chapter 4, we built a `Character` as a plain interface: a flat record of stored facts with
separate pure functions to derive whatever the rules needed. The chapter ended with a deliberate
loose thread: there's a temptation, when you notice that characters and monsters share a lot of
vocabulary, to bundle the data and the behaviour together into a single structure. TypeScript
supports this. Chapter 4 deferred the question of whether it should.

This is that chapter.

I want to be honest about something before we begin: I started building Campaign Ledger the
wrong way. The first version of the character sheet had a `BaseEntity` class at the top of
everything. `Character` extended it. `Monster` extended it. `NpcCharacter` extended
`Character`, because NPCs felt like a kind of character, which they are, but for reasons I'll
explain shortly, that turns out to be the wrong way to express that. Within three months I had
a hierarchy four levels deep and a `BaseEntity` that knew about armour class, because somewhere
along the way I'd convinced myself that both characters and monsters have armour class and
therefore it should live in the shared parent. It took me longer than I'd like to admit to unpick
it. The chapter you're reading is what I wish I'd understood first.

---

## What A Class Actually Is

A **class** in TypeScript (and in most object-oriented languages) is a template for creating
objects that bundle data and behaviour together. Where an interface describes only the *shape* of
data, a class also provides **methods**: functions that operate on that data and belong to the
object itself.

```typescript
class Character {
  name: string;
  level: number;
  hitPoints: number;

  constructor(name: string, level: number, hitPoints: number) {
    this.name = name;
    this.level = level;
    this.hitPoints = hitPoints;
  }

  isAlive(): boolean {
    return this.hitPoints > 0;
  }

  takeDamage(amount: number): void {
    this.hitPoints = Math.max(0, this.hitPoints - amount);
  }
}
```

The `constructor` is a special function that runs when you create a new instance:
`new Character("Brandavar", 1, 10)`. The methods `isAlive` and `takeDamage` belong to every
`Character` object created from this template. Call `brandavar.isAlive()` and you get a boolean.
Call `brandavar.takeDamage(3)` and the hit points change.

This is not inherently better or worse than the interface-and-helpers approach from Chapter 4.
It is a different way of organising the same ideas.[^3] The data and the functions that operate on
it travel together, which can be convenient. Whether that convenience is worth its costs depends
on what the system needs to do next.

---

## The Inheritance Ladder

Classes become more interesting, and more dangerous, when they start inheriting from each other.

**Inheritance** is the mechanism by which one class can be defined as a specialisation of
another. The child class gets everything the parent class has, and can add or override behaviour
on top. TypeScript expresses this with `extends`:

```typescript
const FIGHTER_BASE_HP = 10;

class Fighter extends Character {
  weaponProficiencies: string[];

  constructor(name: string, level: number) {
    super(name, level, FIGHTER_BASE_HP + level);
    this.weaponProficiencies = ["simple", "martial"];
  }

  attack(target: Character, damage: number): void {
    target.takeDamage(damage);
  }
}
```

A `Fighter` is a `Character`. It has a name, a level, hit points, `isAlive`, and `takeDamage`,
because those come from `Character` via `extends`. It also has `weaponProficiencies` and
`attack`, which belong only to Fighters. The `super(...)` call passes the required arguments up
to the `Character` constructor; the base hit points are extracted to a named constant rather
than buried as a magic number. The `attack` method takes a pre-rolled damage value from the
caller: dice-rolling is a separate concern, and we'll build the right infrastructure for it in
Chapter 6.

This is the **inheritance** relationship: Fighter *is-a* Character. The type system enforces
this: anywhere the code expects a `Character`, you can pass a `Fighter`, because a Fighter has
everything a Character has, and then some.

The appeal is obvious. You write the shared logic once, in `Character`. Each subclass adds what
it specifically needs. The four character options become:

```typescript
class Fighter extends Character { /* sword stuff */ }
class Rogue   extends Character { /* stealth stuff */ }
class Wizard  extends Character { /* spell stuff */ }
class Cleric  extends Character { /* healing stuff */ }
```

Four classes, one parent, clean lines of specialisation. It looks, at this scale, exactly right.

---

## Where It Breaks

The problem is not visible yet. It appears when the system grows.

Wizards and Clerics both cast spells. Where does the spellcasting logic go? It could go in
`Character`, so that all characters have it — but then Fighters and Rogues carry spell logic
they can never use. It could go in both `Wizard` and `Cleric` separately — but then the same
logic exists in two places, and when the rules change, both must be updated.[^1]


The common response is a new level in the hierarchy: a `Spellcaster` class that sits between
`Character` and the casting subclasses:

```typescript
class Character { /* shared basics */ }
class Spellcaster extends Character { /* spell stuff */ }
class Wizard extends Spellcaster { /* wizard-specific */ }
class Cleric extends Spellcaster { /* cleric-specific */ }
class Fighter extends Character { /* sword stuff */ }
class Rogue extends Character { /* stealth stuff */ }
```

This is coherent for as long as the categories stay clean. But D&D does not keep categories
clean. Paladins are half Fighter, half Cleric. Rangers mix martial skill with a limited spell
list. Eldritch Knights are Fighters who have learned some Wizard magic. Arcane Tricksters are
Rogues who have picked up a handful of spells alongside their lockpicking. Every one of these
breaks the hierarchy because they need capabilities from multiple branches that a
single-inheritance ladder cannot combine.

The hierarchy either grows a new branch for every combination, which produces a class for every
possible intersection of capabilities, or it pushes everything into the top-level `Character`
class, which defeats the purpose of having specialised subclasses. Neither option scales.

This is, more or less, what happened in my first attempt at Campaign Ledger. The `NpcCharacter`
that extended `Character` accumulated methods for encounter setup that had nothing to do with the
`Character` interface. The `BaseEntity` grew an armour class field because it was convenient.
Every time I added a new feature to one branch, I had to check whether the other branches
expected the same behaviour. The hierarchy that had looked clean on day one was a maintenance
problem by month three. I ripped it out and started over with tables.

---

## The Liskov Problem

There is a more precise way to name what goes wrong. In 1987, Barbara Liskov articulated a
principle that has since become a foundational test for inheritance:[^2] a subtype should be able
to stand in for its parent type without breaking the behaviour that code relying on the parent
expects.

This is the **Liskov Substitution Principle**, and it's worth keeping in mind whenever you reach
for `extends`. The question is not just "does this compile?" but "if I swap a parent for a
child, does everything still work as expected?"

A `Fighter` standing in for a `Character` passes this test. A `Character` has hit points; a
`Fighter` has hit points. A `Character` can take damage; a `Fighter` can take damage. No
surprises.

A `Spellcaster` standing in for a `Character` might not. Code that works with characters
generally — the combat system, the inventory system, the save/load layer — is now receiving
objects that carry spell slot state, prepared spell lists, and a spellcasting ability score.
That code didn't ask for any of that. If the spellcasting subclass overrides a method in a
way that depends on spell slots being present, code that doesn't know about spell slots can
produce unexpected results.

The DRY principle,[^1] Liskov, and the combinatorial explosion of the D&D multiclass problem
are all pointing at the same thing. They arrive via different routes, but the destination is
identical: inheritance is a good fit for genuinely hierarchical relationships, and a poor fit
for everything else. Before every `extends`, ask whether the child truly keeps all the promises
the parent makes. If the answer requires squinting, reach for something else.

---

## Composition: Building From Parts

The gamebook does not use class hierarchies for characters. Instead it uses **composition**: the
`Character` interface is assembled from smaller, independent pieces, and pure functions operate
on those pieces.

Rather than a `Wizard` class that extends `Character` and adds spellcasting, there is a
`CharacterTemplate` record that describes everything a starting Wizard needs:

```typescript
interface AttackProfile {
  name: string;
  attackBonus: number;
  damage: DamageExpression;
}

interface CharacterTemplate {
  class: CharacterClass;
  maxHitPoints: number;
  armourClass: number;
  skillProficiencies: Skill[];
  inventory: string[];
  attack: AttackProfile;
}

const WIZARD_TEMPLATE: CharacterTemplate = {
  class: "wizard",
  maxHitPoints: 6,
  armourClass: 11,
  skillProficiencies: ["arcana", "history"],
  inventory: ["spellbook", "quarterstaff"],
  attack: {
    name: "Quarterstaff",
    attackBonus: 2,
    damage: { count: 1, sides: 6, modifier: 0, type: "bludgeoning" },
  },
};
```

The `attack` here is an `AttackProfile`: a name, an attack bonus, and a `damage` value. That
`damage` is a small dice value object, `DamageExpression`, which Chapter 6 defines in full; for
now, read it as a single six-sided die of bludgeoning damage.

There is no inheritance. There is no `extends`. There is data describing what a Wizard starts
with, and a `createCharacter` function that combines a template with a name and a race to
produce a `Character`. The function is pure: same inputs, same output, every time.

The Cleric does not need to share a parent class with the Wizard just because both can
eventually use magic. The Cleric has its own template with its own starting values. If a future
character type needs both martial and magical capabilities, a new template can describe that
combination directly, without restructuring what already exists. The Eldritch Knight is not a
design problem; it is a new constant in a file.

This is also how games outside D&D handle the same problem. Powered by the Apocalypse[^4] games
use **playbooks**: a character's class is a bundle of starting stats, special moves, and
equipment, chosen at creation, composable rather than hierarchical. Daggerheart's class/ancestry
/community layers work on the same principle: three independent axes of character definition,
each contributing a different slice of what the character can do, combined at creation into a
single coherent record. Neither system builds a class hierarchy. Both systems produce a richer
variety of characters than a fixed taxonomy would allow.

---

## Polymorphism Without Inheritance

Inheritance is not the only way to achieve **polymorphism**: the ability to write code that
works with multiple different types through a shared contract.

TypeScript uses **structural typing**: a value satisfies a type if it has the right shape,
regardless of whether it was declared with `extends` or `implements`. Any object with a `name`
field and an `abilityScores` record will satisfy the `Character` interface, whether it was
created by `createCharacter`, built by hand in a test, or assembled from a save file.

This means a function that operates on any character can be written against the interface:

```typescript
function describeCharacter(character: Character): string {
  const str = abilityModifier(character.abilityScores.strength);
  const sign = str >= 0 ? "+" : "";
  return `${character.name}, level ${character.level} ${character.class} (STR ${sign}${str})`;
}
```

This function works for Fighters, Rogues, Wizards, and Clerics without knowing which one it
has. It works for any future character type that satisfies `Character`. No inheritance required.
No class hierarchy required. The contract is the interface; the type system enforces it; the
function doesn't care about the rest.

Structural typing is a distinctive feature of TypeScript compared to languages like Java or C#,
where two classes must explicitly share a declared ancestor before one can substitute for the
other. TypeScript asks only: does this thing have the right shape? If yes, it fits. This makes
composition significantly easier to work with in practice, because your composed objects
automatically satisfy any interface they structurally match.

---

## A Mature Comparison

Campaign Ledger handles the same problem at larger scale, and the solution it landed on after
the false start I described earlier is the same one the gamebook uses.

A full character sheet in a shared campaign app has abilities, classes, skills, resources,
equipment, defences, and proficiencies. These are not modelled as a deep class hierarchy. They
are modelled as separate database tables, each with its own schema, assembled into a
`CharacterSheetReadModel` when the sheet needs to be displayed.

The `CharacterSheetReadModel` is not a subclass of anything. It is a composed view: a flat
record assembled from related tables, shaped to match exactly what the UI needs. When the rules
for armour class change, the armour class table changes. It does not cascade through a class
hierarchy. The other tables are unaffected.

When I originally put armour class inside `BaseEntity` because it was convenient, changing the
armour class calculation meant touching every class that extended `BaseEntity`, verifying that
none of them had overridden the relevant method in a way that would break, and then running the
full test suite to find out which ones had. With separate tables, the same change touches one
file. The other tables have not heard of armour class and do not care.

This is composition at the persistence level, and it reflects the same instinct as the
gamebook's template approach: model the axes of change independently, and assemble what you
need when you need it.

---

## The Build Move

By the end of this chapter, the gamebook has a working character creation system:

- `CharacterTemplate` in `src/gamebook/rules/character.ts` describes what each starting class
  provides: hit points, armour class, skill proficiencies, starting inventory, and attack
  profile. It is data, not a class.
- `RaceTemplate` describes what each ancestry adds: small ability score adjustments, optional
  extra inventory, optional extra proficiencies.
- `CHARACTER_TEMPLATES` and `RACE_TEMPLATES` are plain objects mapping class and race names to
  their respective templates.
- `createCharacter` takes a class, a race, a name, and a level, and returns a fully populated
  `Character` by combining the template with derived values. It is a pure function.
- The four options, Fighter, Rogue, Wizard, and Cleric, are implemented as templates without any
  of them needing to know about the others.

The character creator screen in the gamebook uses these templates to populate the selection UI.
The player picks a class and a race, enters a name, and `createCharacter` does the rest. The
result is a `Character` that satisfies the same interface the rest of the game has been using
since Chapter 4. No class, no hierarchy, no `extends`.

---

The Wizard's lineage is real. Within the tower, the chain of transmission is unbroken and the
rules are clear. The difficulty is that the world outside the tower contains Clerics, and
Rangers, and Paladins, and people who learned three spells from a hedge witch and use them to
light campfires. The lineage model is a good description of one kind of magic. It is a poor
description of magic in general.

Software inheritance works the same way. It is a precise and useful tool for one kind of
relationship. When the relationship is genuinely hierarchical, use it. When it is "these things
share some vocabulary but diverge in ways I can't predict," reach for composition instead. The
tower is theoretical. The dungeon outside it contains Eldritch Knights.

In the next chapter, we'll add something the characters have been missing: the ability to fail.
Dice, probability, and the particular relationship between a difficulty class and a modifier
are the subject of Chapter 6.

---
[^1]: This is the **DRY principle**: Don't Repeat Yourself. When the same logic exists in two
places, changes must be made twice, and eventually they won't be. The cure is worse than the
disease only when the shared ancestor accumulates so much logic that it becomes impossible to
understand. Finding the right level of abstraction is most of the craft.

[^2]: Barbara Liskov, "Data Abstraction and Hierarchy", OOPSLA 1987. The principle is usually
stated as: if `S` is a subtype of `T`, then objects of type `T` may be replaced with objects of
type `S` without altering any of the desirable properties of the program. In plain English: a child
class should not surprise code that was written expecting the parent. The formal publication appeared
in SIGPLAN Notices 23(5), 1988, as a revised version of the keynote; both sources are cited in the
bibliography.

[^3]: TypeScript's `class` syntax compiles down to JavaScript prototype chains, which differ from
classical OOP in languages like Java or C# in a few notable ways: there is no true method overloading,
access modifiers like `private` are enforced only at compile time and not at runtime, and the prototype
system means that methods are shared objects rather than per-instance copies. For the purposes of this
chapter, none of that matters. The inheritance model `extends` provides is close enough to classical
OOP to make the comparison useful, and the composition arguments apply equally regardless of the
underlying mechanism.

[^4] Powered by the Apocalypse (PbtA) is not so much a set of game rules as it is a design framework 
for TTRPGs that focuses on playing a role rather than rolling to play. Its mechanics are storytelling
and narrative-driven, and it has provided the gaming world with amazing titles, including but not 
limited to *Monster of the Week* and *Thirsty Sword Lesbians*.