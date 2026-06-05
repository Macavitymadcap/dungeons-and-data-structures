# Chapter 10: Adventure Modules And Programming Modules

---

> **The Scribe and the Archivist**
>
> The Scribe had, over many years of diligent service, developed a system. Everything went into
> the great ledger: maps; laws of various countries; chronicles of great heroes; pressed flowers
> from a dalliance that had concluded pleasantly, if sooner than would have been liked. It was all
> in there somewhere.
>
> "Where," said the Archivist, who had been called in to help find something, "is the map of the
> Fogged Marshes?"
>
> "In the ledger," said the Scribe.
>
> "Which section?"
>
> "The maps are mostly toward the back, except the ones filed under the country they belong to,
> except the ones filed under the cartographer's name, except the ones I found after the ledger
> was full and added to the front."
>
> The Archivist set down the cup of tea they had been hoping to drink before this became
> complicated.
>
> "The issue," said the Archivist, "is not that the information is missing. The issue is that
> nothing tells you where to look, and looking in one place requires knowing what is in every
> other place."
>
> "I know where everything is," said the Scribe.
>
> "You know where everything is *today*," said the Archivist. "What happens when you are not
> here? What happens when the ledger is given to someone else? What happens when you add
> something new and it needs to go somewhere that does not yet exist?"
>
> The Scribe considered this. The ledger was very large, and the Scribe was, now that the
> question had been raised, not entirely certain where the Fogged Marshes map was.
>
> "The map," said the Archivist. "Of the Fogged Marshes."

---

My first significant programming project was a text-based dungeon crawler in Python. This is,
I am told, a rite of passage. The specific dungeon in question was called the Five Room
Dungeon, named for the classic adventure design pattern[^1]: a guarded entrance, a puzzle, a
trick-or-setback, a climactic boss fight, and a twist ending with the treasure. It had
character creation, three playable classes, two boss encounters, a talking wall that judged
you morally, and approximately one thousand lines of Python in a single file.

I was genuinely proud of it, which I mention only because I want to be honest about the
distance between "working" and "well-structured." The code ran. Choices branched, combat
resolved, the wall dispensed opinion. Players could pick fighter, rogue, or wizard and follow
them through to one of several endings. It was, by the standards of a personal project written
to learn the language, a success.

It was also, if you try to read it, a navigational catastrophe.

The `Character` class lived at the top. The `PlayerCharacter` class extended it, immediately
below. Then came three instantiated characters: `fighter`, `rogue`, `wizard`. Then the monster
instances: `animated_knife`, `skeleton`. Then the functions: `roll_d`, `roll_mult_d`,
`choose_option`, `what_do`, `show_sheet`, `enemy_attack`, `player_attack`, `combat_heal`,
`flee`, `combat`, `heal`. Then the variables: `professions`, `yes_no`, `wall_opt`. And then,
occupying the bottom five hundred lines, the actual game: five rooms of imperative narration,
input loops, and branching logic, referencing everything above it by name, with nowhere
obvious to look for any of it.

If you wanted to change how combat damage was calculated, you looked in `player_attack`. Or
possibly `combat_heal`. Or in the `Character` constructor where the initial `attack_damage`
was assigned. If you wanted to add a fourth room, you scrolled to roughly the right depth and
hoped you hadn't broken anything two hundred lines above. If you wanted to understand why the
wall opened the door in some circumstances and not others, you traced a `door_rage` variable
through three nested functions, none of which were called `door_rage_logic`.

The technical term for what I had built is a **God Object**: a single container that knows
everything, owns everything, and can therefore be changed only by someone who has read
everything.[^2] The file was not actually that large by industry standards, but it felt larger
than it was, because nothing told you where to look.

That project is the Scribe's great ledger. Everything was there. The problem was that
"everything is there" and "you can find anything" are not the same claim.

---

## What A Module Actually Is

A **module** is the solution to this problem: a boundary around a decision. It has a name, an
explicit public surface, and a set of internal details that only it needs to know. Other code
depends on the public surface. The internal details can change without breaking anything
outside.

David Parnas described the essential insight in 1972, in a paper about how to decompose a
system into modules.[^3] His answer was not "group things that are similar" but "group things
that change for the same reason, and hide the decision that might need to change."

The Five Room Dungeon fails this test immediately. `enemy_attack` and `player_attack` change
for the same reason: they both calculate combat outcomes. `combat_heal` changes for a
different reason: it changes when healing rules change, not damage rules. `room_2_knife_door`
changes for yet another reason: it changes when the second room's puzzle changes. All three
lived in the same flat list, with no indication of which concern each one belonged to.

Splitting them does not make them easier to write. It makes them easier to find, easier to
change, and easier to hand to someone who didn't write them. The principle is sometimes called
**high cohesion**: things that change together belong together. Its complement is **low
coupling**: things that change independently should not know too much about each other.[^4]

The word "module" is doing double duty in this chapter's title, and the two meanings agree
more than they should. A published D&D adventure is called a module precisely because it
plugs into a campaign through a small, well-defined interface. A Game Master running *Curse
of Strahd*[^5] needs to know what level to start the party at, how they enter Barovia, and
how the players might be drawn into Strahd's curse. The layout of Castle Ravenloft and
Strahd's true motivations are the designer's business, sealed behind that interface. A good
adventure module can be dropped into anyone's campaign because it does not require the
surrounding world to know its internals. A software module aspires to exactly the same
courtesy.

---

## The Gamebook's Module Map

Each Build Move section in the previous chapters has named files as they were introduced.
What has not yet been made explicit is how those files relate to each other. Here is the full
module map of the gamebook, and why the pieces are where they are.

```
src/gamebook/
├── model.ts
├── graph.ts
├── state.ts
├── play.ts
├── content/
│   ├── mt-graphnor.ts
│   └── five-room-template.ts
├── rules/
│   ├── character.ts
│   ├── combat.ts
│   ├── dice.ts
│   └── srd.ts
├── render.ts
├── player-render.ts
├── client.ts
├── player-client.ts
└── testing.ts
```

And then, outside `src/gamebook/`, the application shell:

```
src/
├── app.tsx
└── index.ts
```

This is not a random filing arrangement. The dependencies flow inward: `app.tsx` at the top
imports from the domain modules; the domain modules do not import from `app.tsx`. The
adventure content in `content/` knows nothing about HTTP. The `rules/` directory knows
nothing about rendering. `model.ts` sits at the bottom of the tree, importing nothing from
the rest of the gamebook, exporting the shared vocabulary that everything else uses.

Compare this to the Five Room Dungeon's structure, which had no inward flow at all. The room
scripts referenced `player` directly, `player` was an instance of `PlayerCharacter`,
`PlayerCharacter` was defined above it, and the combat functions lived between them. The
dependency direction was "wherever I happened to write it."

---

## What Changes For What Reason

The filing principle becomes clearest when you ask not what a file does, but what you would
have to touch if something else changed.

Tighten the passage validation rules and only `graph.ts` needs to know. Add a new field to
the save document and only `model.ts` and `state.ts` need updating; the graph validator, the
dice module, and the HTTP routes have no opinion on save schemas. Change the rendering of a
passage panel and the combat rules and inventory logic are unaffected. Change the adventure
content and the modules that process it are unaffected, because they operate on whatever
adventure data they receive, without caring which adventure it is. Replace Hono with a
different web framework and the domain logic survives intact: `graph.ts`, `state.ts`, `rules/`,
none of them import Hono.

That last one is worth pausing on. The domain modules are framework-light by design: they use
standard TypeScript and have no opinions about HTTP. `app.tsx` depends on them; they do not
depend on `app.tsx`. The direction of knowledge flows inward, not outward.

Robert C. Martin calls this the **Dependency Inversion Principle**: high-level policy should
not depend on low-level details.[^6] The game rules are high-level policy. The web framework
is a low-level detail. If the policy depended on the detail, swapping the framework would
require rewriting the rules. The module boundary keeps them separate so that each can change
independently, which is the whole point of having a module boundary at all.

The Five Room Dungeon had no such separation. The presentation layer, the rules layer, and the
content layer were the same layer. Every `print()` call lived next to every `combat()`
calculation, which lived next to every room description. Changing the text of the talking
wall's dialogue required scrolling past the combat damage formula to find it.

---

## Public Contracts And Private Internals

A module's public surface is the set of names it exports. Everything else is private.

`src/gamebook/model.ts` exports the types the rest of the system uses: `Passage`, `Choice`,
`Adventure`, `Character`, `GameState`, and so on. Those exports are a contract: other modules
depend on them. If a type's shape changes, every importer must be updated. That is the cost of
sharing, and it is why the surface should be kept as small as the callers actually need.

`src/gamebook/graph.ts` exports `validateAdventure`, `exportMermaid`, and `createPassageMap`.
It does not export its internal `collectTargetIds` helper or its traversal queue
implementation. Those are details. They can change without touching the callers, because the
callers never asked for them.

The question to ask of any export is: does another module genuinely need this, or is it only
here because it was convenient during development? A sprawling barrel export that makes every
internal function public is not a module; it is a filing cabinet with the doors removed. Every
exported name is a commitment. Adding an export is easy; removing one is a breaking change for
every caller. When in doubt, keep it private.[^7]

The Five Room Dungeon's equivalent was that everything was implicitly public, because
everything was at module scope. `door_rage` was technically a local variable inside
`room_3_flirtatious_wall`, but `get_intentions` was defined inside that same function and
closed over it, and both called `choose_option` which was defined two hundred lines above.
There was no concept of "this function is only for internal use." There was no inside or
outside. There was just the file.

---

## The Author/Player Boundary As A Module Boundary

Chapter 9 explained the author/player split as an access control problem. It is also a module
boundary problem, and the two framings reinforce each other.

The published gamebook ships `player-client.ts`. Development uses `client.ts`. The two files
are not the same file with a feature flag: they are separate entry points with separate import
lists. `player-client.ts` does not import the author debug code, the forced navigation
handler, or the development-only passage preview logic. Those modules are simply absent from
the player build's dependency tree.

This is what a structural boundary means in practice. It is not a conditional:

```typescript
// This is not a module boundary. It is a runtime flag.
if (authorToolsEnabled) {
  renderDebugPanel(state);
}
```

It is a separate file:

```typescript
// player-client.ts — the debug panel module is never imported.
// It cannot be reached by any code path. It is not in the bundle.
import { startNewGame, saveGame, loadGame } from "./state.ts";
import { renderPassagePanel } from "./player-render.ts";
```

The debug code's absence from the player bundle is guaranteed not by a conditional but by the
import graph. If `player-client.ts` does not import the debug module, the build tool cannot
include it. The artifact check from Chapter 9 confirms this structurally, verifying that the
forbidden strings are absent from the published output. A future change that accidentally
widens the import graph would fail that check before reaching a player.

The Five Room Dungeon had no such distinction. There was one file and one audience. If I had
wanted to add development tools, an invulnerability flag or a room-skip command, they would
have lived in the same namespace as the actual game and been accessible to players by
accident, or not at all.

---

## Coupling: The Cost Of Knowing Too Much

Coupling is the tax you pay for knowledge. The more one module knows about another's
internals, the more tightly they are bound: a change in one requires a corresponding change
in the other.

The most expensive coupling is when a module reaches past an abstraction to import concrete
implementation details. The gamebook demonstrates the correct alternative with the injectable
`RandomSource` from Chapter 6. The dice module does not call `Math.random()` directly through
the business logic. It accepts a function parameter. Tests inject a deterministic source.
Production uses `Math.random`. The business logic is decoupled from the specific random
number generator; the parameter is the contract, and contracts are stable in a way that
implementations are not.

```typescript
// dice.ts
export type RandomSource = () => number;

export function rollD(sides: number, random: RandomSource): number {
  return Math.floor(random() * sides) + 1;
}
```

```typescript
// In tests
const fixed: RandomSource = () => 0.99; // Always rolls maximum
expect(rollD(20, fixed)).toBe(20);

// In production
const result = rollD(20, Math.random);
```

The pattern is the same wherever you reach for an external dependency: depend on the contract,
not the implementation. Name what you need; let the caller provide the thing that satisfies
the name. If that thing later changes, the module does not need to know.[^8]

The Five Room Dungeon's `roll_d` called `randint(1, x)` directly throughout. Every combat
function, every puzzle check, every heal roll went through the same Python `random` module
with no indirection. This is fine for a personal project and fine for learning. But it made
the damage calculations untestable without mocking the standard library; and when I wanted to
add a "lucky" mechanic that weighted certain rolls, I had no clean place to put the
weighting.

---

## Refactoring Without Breaking The Dungeon

Restructuring code is only safe when the external behaviour stays the same. The technical term
is **refactoring**: changing the internal structure of a system without changing what it does
from the outside.

The safety net for refactoring is tests. The tests describe what the system does. After a
restructuring, the tests should still pass. If they do, the external behaviour is preserved.
If they fail, something that was previously guaranteed is now broken. The tests are not
checking your work; they are defining it.

The gamebook's verification suite exists precisely for this. Before any significant
restructuring, run `bun run verify`: typecheck, unit tests, static build, static artifact
check, and browser smoke. If everything passes, the module boundaries can be shifted, files
can be moved, and internal logic can be reorganised, with confidence that the published
gamebook still behaves as described.

The important corollary is that tests must cover the boundary you are about to move. If graph
validation is tested only through the HTTP routes, moving `graph.ts` to a different location
might break the routes without the tests catching it, because the test is exercising the wrong
boundary. `graph.test.ts` tests `graph.ts` directly, not through `app.tsx`. Moving the file
does not change what the test imports, which is exactly the point: the test is coupled to the
module it describes, not to the incidental details of how that module is currently exposed.[^9]

The Five Room Dungeon had no tests, which meant there was no safety net for refactoring,
which meant I never refactored it. Once the file reached a certain size it became a thing to
be modified carefully, not restructured. I treated it as load-bearing in all directions, like
a dry-stone wall I was afraid to pull a stone from. A test suite would not have made the
structure better on its own; but it would have given me confidence to try.

---

## The Rendering Split As A Named Decision

There is a deliberate trade-off in the current module structure worth naming explicitly. The
rendering logic lives in `render.ts` and `player-render.ts` alongside the application shell
in `app.tsx`, rather than in a fully separated `src/gamebook/ui/` directory. This is not an
oversight; it is a scale decision.

At the current size of the gamebook, `render.ts` and `app.tsx` are coupled enough that
changing one often means reading the other. That coupling is manageable: the files are short,
their relationship is clear, and the tests cover the rendered output through
`src/app.test.tsx`. The cost of the coupling is low. The benefit of separating it into
another layer would be modest. At this scale, the current arrangement is the right one.

The signals that would suggest the time had come to draw a clearer boundary are specific:
finding yourself reading more rendering code than expected to make a routing change, or more
routing code than expected to adjust a component's markup. When those costs arrive reliably
and repeatedly, the separation earns its keep. Right now it does not, and adding structure
before the pain justifies it is its own kind of technical debt.[^10]

---

## The Build Move

By the end of this chapter, the gamebook's module structure is explicit and named:

- `src/gamebook/model.ts` owns the shared vocabulary. It imports nothing from the rest of
  `src/gamebook/`. Every other module may import from it.
- `src/gamebook/graph.ts`, `src/gamebook/state.ts`, and `src/gamebook/play.ts` are the three
  domain modules, introduced across Chapters 2 through 8, each owning a single design
  decision.
- `src/gamebook/rules/` owns the domain logic for character creation, dice, combat, and SRD
  provenance. The modules here do not know about HTTP or HTML.
- `src/gamebook/content/` owns the adventure data. It imports from `model.ts` and from
  `rules/` for the SRD catalogue, and nothing else.
- `src/gamebook/render.ts` and `src/gamebook/player-render.ts` are two rendering entry
  points, introduced in Chapter 3. Their separation is a structural access boundary as much
  as a performance concern.
- `src/gamebook/client.ts` and `src/gamebook/player-client.ts` are two browser entry points.
  The player-only client does not import the author modules.
- `src/app.tsx` is the application shell. It sits at the top of the dependency tree and
  depends on everything below it. Nothing below it depends on it.
- `src/index.ts` owns process startup. It depends on `src/app.tsx` and on environment
  configuration. Nothing else depends on it.

---

The Scribe's great ledger was not useless. Everything was there. The problem was that
"everything is there" and "you can find anything" are not the same claim. Finding the Fogged
Marshes map required knowing where other things were not, eliminating sections, and relying
on a mental index that existed only in the Scribe's head and would not survive the Scribe's
absence.

My Five Room Dungeon still exists. I can run it; Python hasn't changed that much. But I
cannot easily add a sixth room, or a fourth character class, or a different combat
resolution, because the decisions are woven into each other without seams. The wall's moral
judgment calls the same `heal()` function that the potions do. The boss fight's skeleton
references the same `combat()` that the knife encounter uses, but with different enemy stats
threaded through as arguments rather than encapsulated anywhere. It works. It is not
changeable.

Separate shelves do not make the information easier to produce. They make it easier to find,
easier to update, and easier to hand to someone who has not been maintaining the ledger for
fifteen years. The Archivist was not proposing a revolution; they were proposing a filing
system. That is a more modest promise than "everything in one place," and it is a more honest
one.

In Chapter 11, we'll look at a particular kind of content that needs its own shelf and its
own careful handling: the rules themselves. Spells, conditions, equipment, class features;
the data that makes the game's mechanics run. How structured data represents those rules,
where it comes from, and how to be honest about that provenance is the subject of the next
chapter.

---

## At Scale: Campaign Ledger

The coupling principle from this chapter takes a concrete form in a multi-tier application.
Where the gamebook uses an injectable `RandomSource` to decouple the dice module from
`Math.random`, Campaign Ledger uses repository interfaces to decouple routes from the
database. The routes define what they need: `getCharacter`, `updateResource`,
`listNpcSummaries`. The SQLite implementation provides it. If the database engine changes,
the repository implementations change. The routes do not.

Shared dependencies introduce a different kind of coupling: a library that updates its public
surface can break every importer at once. The adapter pattern handles this without a mass
refactor. When Campaign Ledger's component library changed its exports, a thin re-export
module presented the new primitive under the old local name:

```typescript
// src/components/atoms/Button/index.ts
export { Button, type ButtonProps } from "@macavitymadcap/hyper-dank-ui";
```

Every existing import of `Button` continued to work. The implementation changed; the contract
did not. The shim is a migration tool, not a permanent state. What keeps it honest is a
compatibility test that verifies the re-export is still accurate after every library update,
and catches the subtler case where the library adds a new export that silently collides with
a local component name:

```typescript
it("no new Hyper-Dank UI exports shadow unreviewed local components", () => {
  // Arrange
  const sharedExports = Object.keys(require("@macavitymadcap/hyper-dank-ui"));
  const localComponents = listLocalComponentNames();

  // Act
  const unreviewed = sharedExports.filter(
    name => localComponents.includes(name) && !REVIEWED_OVERLAPS.includes(name)
  );

  // Assert
  expect(unreviewed).toEqual([]);
});
```

The test fails not when behaviour is wrong, but when a change has been made without a
conscious decision. It is testing for awareness as much as correctness.

This is a different problem to the one I had with the Five Room Dungeon, where there were no
modules to collide. But the principle is the same: the boundary has to be actively maintained
or it quietly stops being a boundary. In the Five Room Dungeon the boundary eroded because it
never existed. In Campaign Ledger the boundary is preserved because something checks it.

---

[^1]: The Five Room Dungeon is a well-established adventure design template in the tabletop
community, attributed to various sources and popularised through game design blogs in the
mid-2000s. The pattern, entrance with guardian, puzzle, trick or complication, boss fight,
and reward with twist, is as applicable to video game level design as to tabletop encounters.
It is a useful constraint precisely because it is short enough to build quickly but complex
enough to practice all the relevant skills. As a structure for a first programming project it
has considerable merits.

[^2]: The God Object is the informal name for a class or module that has taken on too many
responsibilities. The more formal description comes from the Single Responsibility Principle:
a module should have one, and only one, reason to change. A God Object has as many reasons to
change as it has responsibilities, which is usually all of them.

[^3]: David L. Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules",
*Communications of the ACM*, volume 15, issue 12, December 1972. The paper is short, readable,
and has aged remarkably well. Its central claim, that the right decomposition criterion is not
"what things go together" but "what decisions should be hidden", is still the most useful
single sentence in software modularity literature. The paper is available through the ACM
digital library and is worth reading in full.

[^4]: Cohesion and coupling are typically attributed to Larry Constantine and Ed Yourdon, who
formalised them in *Structured Design* (1975). They appear in essentially every subsequent
text on software architecture, sometimes under different names but always as the same
observation: things that belong together should be together, and things that don't belong
together should not know about each other. The reason the observation has been made so many
times is that it is violated at roughly the same rate.

[^5]: Jeremy Crawford, Laura Hickman, Tracy Hickman, Christopher Perkins et al, *Curse of
Strahd* (Wizards of the Coast, 2016). Widely considered the strongest adventure module of D&D
5th edition, it is a reworking of the Hickmans' 1983 standalone adventure *Ravenloft*, with
the core 5e team expanding and enriching the original premise with genuine horror, a mood that
5e is sometimes criticised for handling unevenly.

[^6]: Robert C. Martin (aka Uncle Bob), *Clean Architecture: A Craftsman's Guide to Software
Structure and Design* (Prentice Hall, 2017). The Dependency Inversion Principle is one of the
five SOLID principles Martin is associated with. The formulation here, "high-level policy
should not depend on low-level details; both should depend on abstractions," is more useful
when read as a practical question: if the framework changes, which parts of my system should
not have to change? The answer is the domain logic. The boundary that protects it is the
module.

[^7]: The minimal API surface principle appears in various guises across the software design
literature: Joshua Bloch's advice on API design in *Effective Java*, the YAGNI principle in
extreme programming, Sandi Metz's guidance in *Practical Object-Oriented Design*. The common
thread is that every exported name is a commitment. Adding an export is easy; removing one is
a breaking change for every caller. When in doubt, keep it private.

[^8]: This is the interface segregation principle in its practical form: depend on the
smallest interface that satisfies your need. A module that needs to load a character does not
need to import the whole storage layer. It needs a `getCharacter` function. If the underlying
implementation later changes, the module does not know or care. The contract stays constant;
the implementation changes behind it.

[^9]: This is one of the arguments for testing modules directly rather than only through
integration. An integration test that exercises the full HTTP stack tests the whole system
correctly, but it does not tell you which module broke when the test fails. A unit test that
imports `validateAdventure` from `graph.ts` directly will continue to pass after a routing
change, a rendering change, or an unrelated rule modification. The test is coupled to the
module it describes, not to the incidental details of how that module is currently exposed.

[^10]: Martin Fowler calls the accumulation of structural problems "technical debt": not
inherently bad, since sometimes the correct move is to ship now and restructure later, but
requiring conscious management to avoid becoming unmanageable. The signals of excessive
coupling, reading more code than expected to make a change, changes rippling outward to
unexpected places, reluctance to modify a module because touching it is unpredictable, are
the debt service notices arriving. When they come frequently, the debt is due.