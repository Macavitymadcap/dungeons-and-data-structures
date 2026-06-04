# Chapter 10: Adventure Modules And Programming Modules

---

> **The Scribe and the Archivist**
>
> The Scribe had, over many years of diligent service, developed a system. Everything went into
> the great ledger; maps; laws of various countries; chronicles of great heroes; pressed flowers
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
> "Separate shelves," said the Archivist. "Maps on the maps shelf. Laws on the laws shelf.
> Hero chronicles on their own shelf, indexed by country of hero's origin. Each shelf knows 
> its own business and nothing else. When you want the map, you go to the map shelf. You do 
> not have to know anything about the laws shelf to find it."
>
> "And if something belongs on more than one shelf?"
>
> "Then you decide which shelf owns it," said the Archivist, "and you put a reference on the
> other."

---

In Chapter 9, we drew a boundary around who can access what: the published gamebook omits author
tools, the route guards refuse unauthorised actors, the representation filter withholds private
data. That chapter was about access boundaries at runtime.

This chapter is about a different kind of boundary: one that exists in the source code, before
the program runs at all. The gamebook has accumulated, across nine chapters, a considerable set
of responsibilities. It knows about passages and graphs. It knows about character creation and
derived stats. It knows about dice and combat and inventory. It knows about HTML rendering and
HTTP routing. It knows about local storage and save validation.

If all of that knowledge lives in the same file, the same function, or the same sprawling object,
changes become expensive. Fixing a dice formula requires reading past the rendering code to find
it. Adding a new item type requires navigating save logic to understand where items are applied.
Testing a graph validation rule requires instantiating a full HTTP server to run it.

A **module** is the solution to this problem: a boundary around a decision. It has a name, an
explicit public surface, and a set of internal details that only it needs to know. Other code
depends on the public surface. The internal details can change without breaking anything outside.

---

## The Great Ledger Problem

David Parnas described the essential insight in 1972, in a paper about how to decompose a system
into modules.[^1] His answer was not "group things that are similar" but "group things that change
for the same reason, and hide the decision that might need to change."

The Scribe's great ledger fails this test. Maps and laws and hero chronicles don't change for
the same reason: maps change when the geography of the campaign changes, laws (rules) change when 
the system is updated, hero chronicles (character records) change when a player levels up. Putting 
them all in one place means that any change to one has to navigate past all the others.

The Archivist's shelves pass it. The maps shelf changes when maps change. It knows nothing about
rules. The rules shelf changes when rules change. It knows nothing about maps. Adding a new shelf
for encounter tables does not require reorganising either.

This is the principle of **high cohesion**: things that change together belong together. Its
complement is **low coupling**: things that change independently should not know too much about
each other. The pair shows up in almost every serious piece of software engineering writing,
under various names, and the observation that it is simple in principle and difficult in practice
has been made approximately as many times as software has been written.[^2]

The word "module" is doing double duty in this chapter's title, and the two meanings turn out to
agree. A published D&D adventure is called a module precisely because it is built to plug into a
campaign through a small, well-defined interface. The Game Master needs to know a handful of
things: where the adventure begins, what level of party it expects, what the players carry out
when they leave, and how it hooks into the wider campaign. The internal room layout, the
wandering-monster table, the secret the villain is hiding: those are the module designer's
business, sealed behind that interface. A good adventure module can be dropped into anyone's
campaign because it does not require the surrounding world to know its internals, and it does not
reach out and rearrange that world. High cohesion, low coupling, written on a different kind of
shelf. A software module aspires to exactly the same courtesy.

---

## The Gamebook's Module Map

In all of the 'The Build Move' sections so far, I've told you that files have been created, 
or updated, but there has been no context for where these files exist and how they relate 
to each other. Let's now look at the file structure of the gamebook, and why the pieces are
where they are.

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
adventure content in `content/` knows nothing about HTTP. The `rules/` directory knows nothing
about rendering. `model.ts` sits at the bottom of the tree, importing nothing from the rest of
the gamebook, exporting the shared vocabulary that everything else uses.

The filing principle is clearest when you ask not what each file does, but what would have to
change if something else changed.

---

## What Changes For What Reason

The filing principle is clearest when you ask: if this thing needs to change, what else has
to change with it?

If the passage validation rules tighten: change `graph.ts`. Nothing else needs to know.

If the save document adds a new field: change `model.ts` (the type) and `state.ts` (the
creation, loading, and migration logic). The graph validator, the dice module, and the HTTP
routes do not need to know.

If the rendering of a passage panel changes: change `render.ts` or `player-render.ts`. The
combat rules and the inventory logic are unaffected.

If the adventure content changes: change `content/mt-graphnor.ts`. The validation, state, and
rendering modules operate on whatever adventure data they receive; they do not care which
adventure it is.

If Hono is replaced with a different web framework: change `app.tsx` and `index.ts`. The
domain modules do not import Hono. They would survive the replacement without modification.

This last point is the dependency direction principle. The domain modules, `model.ts`,
`graph.ts`, `state.ts`, `play.ts`, and `rules/`, are framework-light. They use standard
TypeScript. They have no opinions about HTTP. `app.tsx` depends on them; they do not depend
on `app.tsx`. The direction of knowledge goes inward, not outward.

Robert C. Martin describes this as the **Dependency Inversion Principle**: high-level policy
should not depend on low-level details.[^3] In the gamebook's terms, the game rules are
high-level policy. The HTTP framework is a low-level detail. If the policy depended on the
detail, changing the detail would require changing the policy. Keeping them independent means
each can change without affecting the other.

---

## Public Contracts And Private Internals

A module's public surface is the set of names it exports. Everything else is private.

`src/gamebook/model.ts` exports the types that the rest of the system uses: `Passage`,
`Choice`, `Adventure`, `Character`, `GameState`, and so on. Those exports are a contract:
other modules depend on them. If a type's shape changes, every importer must be updated.
That is the cost of sharing.

`src/gamebook/graph.ts` exports `validateAdventure`, `exportMermaid`, and
`createPassageMap`. It does not export its internal `collectTargetIds` helper or its
traversal queue implementation. Those are details. They can change without breaking the
callers.

The question to ask of any export is: does another module genuinely need this, or is it
only here because it was convenient during development? A sprawling barrel export that makes
every internal function public is not a module; it is a filing cabinet with the doors
removed. The API surface should be as small as the callers actually need.[^4]

---

## The Author/Player Boundary As A Module Boundary

Chapter 9 explained the author/player split as an access control problem. It is also a module
boundary problem.

The published gamebook ships `player-client.ts`. Development uses `client.ts`. The two files
are not the same file with a feature flag: they are separate entry points with separate imports.
`player-client.ts` does not import the author debug code, the forced navigation handler, or
the development-only passage preview logic. Those modules are simply absent from the player
build's dependency tree.

This is what a structural boundary means in practice. It is not a conditional:

```typescript
// This is not a module boundary. It is a runtime flag.
if (authorToolsEnabled) {
  renderDebugPanel(state);
}
```

It is a separate file:

```typescript
// player-client.ts: the debug panel module is never imported.
// It cannot be reached by any code path. It is not in the bundle.
import { startNewGame, saveGame, loadGame } from "./state.ts";
import { renderPassagePanel } from "./player-render.ts";
```

The debug code's absence from the player bundle is guaranteed not by a conditional, but by the
import graph. If `player-client.ts` does not import the debug module, the build tool cannot
include it. The artifact check from Chapter 9 confirms this structurally: it verifies that the
forbidden strings are absent from the published output, which would fail if the import graph
had been accidentally widened.

This is one of the more concrete ways that module design and access control overlap. The access
boundary ("players should not see debug tools") is enforced partly by runtime guards and partly
by the import structure of the build. Both layers matter.

---

## Coupling: The Cost Of Knowing Too Much

Coupling is the tax you pay for knowledge. The more one module knows about another's internals,
the more tightly they are bound: a change in one requires a corresponding change in the other.

The most expensive coupling is when a module imports concrete implementation details rather than
abstractions. If `play.ts` reached directly into the SQLite tables in Campaign Ledger rather than
calling repository functions, then changing the database schema would require changing `play.ts`.
The two are now coupled through the schema. A change to one is a change to both.

The solution is to import the abstraction, not the implementation. Repository interfaces in
Campaign Ledger define what the data layer can do: `getCharacter`, `updateResource`,
`listNpcSummaries`. The routes import these interfaces. The SQLite implementation satisfies
them. The routes never import the SQLite details directly. If the database engine changes, the
repository implementations change. The routes do not.

In the gamebook, the equivalent is the injectable `RandomSource` from Chapter 6. The dice
module does not call `Math.random()` directly throughout the business logic. It accepts a
function parameter. Tests inject a deterministic source. Production uses `Math.random`. The
business logic is decoupled from the specific random number generator.

The pattern is the same: depend on the contract, not the implementation. Name what you need;
let someone else provide the thing that satisfies the name.[^5]

---

## Adapters And Compatibility Shims

Coupling does not always come from direct imports. Sometimes it comes from a shared library
updating in a way that changes its public surface.

Campaign Ledger uses a set of shared UI primitives from a library called Hyper-Dank, a
collection of pre-built interface components (buttons, form fields, breadcrumbs, HTMX wiring)
that the application depends on for its standard interface elements. A compatibility shim in
this context is something like a translation layer between two editions of the same rulebook
at the same table: both are playing the same game, but one set of procedures has been updated
and the old character sheets need a conversion guide rather than a full rewrite.

At some point, the library exports changed: components were renamed, props were adjusted, new
primitives were added that overlapped with local components Campaign Ledger had already built.

The migration strategy was an **adapter**, sometimes called a compatibility shim: a thin local
module that re-exports the library primitive under the local name the rest of the application
expects.

```typescript
// src/components/atoms/Button/index.ts
// Before the migration, this was a locally defined component.
// After the migration, it is a re-export of the shared primitive.
export { Button, type ButtonProps } from "@macavitymadcap/hyper-dank-ui";
```

Every import of `Button` in Campaign Ledger continues to work. The import path is unchanged.
The implementation now delegates to the shared library. The rest of the codebase did not need
to be updated.

The shim is not a permanent solution. It is a migration tool. Its purpose is to change the
implementation without changing every call site at once. Once the migration is stable and
the old paths are verified, the shims can either remain as stable re-export boundaries or
be removed in favour of direct imports from the shared library.[^6]

What makes the shim approach safe is the compatibility test that accompanies it. Campaign
Ledger has a `test:hyper-dank` gate that imports the shared library primitives through their
public paths and verifies that the local shims re-export them correctly. Running this test
before and after a library update catches the moment when a shared export changes in a way
that breaks the local assumption.

```typescript
// scripts/hyper-dank-compat.test.tsx
it("Button shim re-exports the Hyper-Dank Button", () => {
  const { Button: local } = require("../../src/components/atoms/Button");
  const { Button: shared } = require("@macavitymadcap/hyper-dank-ui");
  expect(local).toBe(shared);
});

it("no new Hyper-Dank UI exports shadow unreviewed local components", () => {
  const sharedExports = Object.keys(require("@macavitymadcap/hyper-dank-ui"));
  const localComponents = listLocalComponentNames();
  const unreviewed = sharedExports.filter(
    name => localComponents.includes(name) && !REVIEWED_OVERLAPS.includes(name)
  );
  expect(unreviewed).toEqual([]);
});
```

The second test is the less obvious one. It catches the case where the shared library adds a
new export that happens to share a name with a local component. Without the test, the local
component and the shared one could coexist silently, each used in different places, diverging
over time without anyone noticing. The test forces a deliberate decision: review the overlap,
decide which one wins, and record the decision in `REVIEWED_OVERLAPS`.[^7]

---

## Refactoring Without Breaking The Dungeon

Restructuring code is only safe when the external behaviour stays the same. The technical term
is **refactoring**: changing the internal structure of a system without changing what it does
from the outside.

The safety net for refactoring is tests. The tests describe what the system does. After a
restructuring, the tests should still pass. If they do, the external behaviour is preserved.
If they fail, something that was previously guaranteed is now broken.

The gamebook's verification suite exists precisely for this. Before any significant restructuring,
run `bun run verify`: typecheck, unit tests, static build, static artifact check, and browser
smoke. If everything passes, the module boundaries can be shifted, files can be moved, and
internal logic can be reorganised, with a reasonable guarantee that the published gamebook
still works.

The important corollary is that tests must cover the boundary you are about to move. If the
graph validation is tested only through the HTTP routes, moving `graph.ts` to a different
location might break the routes without the tests catching it, because the test is exercising
the wrong boundary. Tests should be as close as possible to the unit whose behaviour they
describe. `graph.test.ts` tests `graph.ts` directly, not through `app.tsx`. `state.test.ts`
tests `state.ts` directly. Moving the file does not change what the test imports.[^8]

---

## The Rendering Split As A Named Decision

There is a deliberate trade-off in the current module structure worth naming explicitly: the
rendering logic lives in `render.ts` and `player-render.ts` alongside the application shell
in `app.tsx`, rather than in a fully separated `src/gamebook/ui/` directory. This is not an
oversight; it is a scale decision.

At the current size of the gamebook, `render.ts` and `app.tsx` are coupled enough that
changing one often means reading the other. That coupling is manageable: the files are short,
their relationship is clear, and the tests cover the rendered output through `src/app.test.tsx`.
The cost of the coupling is low. The benefit of separating it into another layer would be
modest. At this scale, the current arrangement is the right one.

The signals that would suggest the time had come to draw a clearer boundary would be: finding
yourself reading more rendering code than expected to make a routing change, or more routing
code than expected to adjust a component's markup. When those costs arrive reliably and
repeatedly, the separation earns its keep. Right now it does not, and adding structure before
the pain justifies it is its own kind of technical debt.[^9]

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

The Hyper-Dank compatibility test in Campaign Ledger's `scripts/hyper-dank-compat.test.tsx`
is introduced in this chapter as the mature example of a module boundary actively protected
by automated checks.

---

The Scribe's great ledger was not useless. Everything was there. The problem was that
"everything is there" and "you can find anything" are not the same claim. Finding the Fogged
Marshes map required knowing where other things were not, eliminating sections, and relying
on a mental index that existed only in the Scribe's head and would not survive the Scribe's
absence.

Separate shelves do not make the information easier to produce. They make it easier to find,
easier to update, and easier to hand to someone who has not been maintaining the ledger for
fifteen years. That is a more modest promise than "everything in one place", and it is a more
honest one.

In Chapter 11, we'll look at a particular kind of content that needs its own shelf and its own
careful handling: the rules themselves. Spells, conditions, equipment, class features: the
data that makes the game's mechanics run. How structured data represents those rules, where
it comes from, and how to be honest about that provenance is the subject of the next chapter.

---

[^1]: David L. Parnas, "On the Criteria To Be Used in Decomposing Systems into Modules",
*Communications of the ACM*, volume 15, issue 12, December 1972. The paper is short, readable,
and has aged remarkably well. Its central claim, that the right decomposition criterion is not
"what things go together" but "what decisions should be hidden", is still the most useful
single sentence in software modularity literature. The paper is available through the ACM
digital library and is worth reading in full.

[^2]: Cohesion and coupling are typically attributed to Larry Constantine and Ed Yourdon, who
formalised them in *Structured Design* (1975). They appear in essentially every subsequent
text on software architecture, sometimes under different names but always as the same
observation: things that belong together should be together, and things that don't belong
together should not know about each other. The reason the observation has been made so many
times is that it is violated at roughly the same rate.

[^3]: Robert C. Martin (aka Uncle Bob), *Clean Architecture: A Craftsman's Guide to Software Structure and
Design* (Prentice Hall, 2017). The Dependency Inversion Principle is one of the five SOLID
principles Martin is associated with. The formulation here, "high-level policy should not
depend on low-level details; both should depend on abstractions", is more useful when read
as a practical question: if the framework changes, which parts of my system should not have
to change? The answer is the domain logic. The boundary that protects it is the module.

[^4]: The minimal API surface principle appears in various guises across the software design
literature: Joshua Bloch's advice on API design in *Effective Java*, the YAGNI principle in
extreme programming, Sandi Metz's guidance in *Practical Object-Oriented Design*. The common
thread is that every exported name is a commitment. Adding an export is easy; removing one
is a breaking change for every caller. When in doubt, keep it private.

[^5]: This is the interface segregation principle in its practical form: depend on the smallest
interface that satisfies your need. A route that needs to load a character does not need to
import the whole SQLite repository. It needs a `getCharacter` function. If the underlying
implementation later changes from SQLite to Postgres, or to an in-memory store for tests, the
route does not know or care. The contract stays constant; the implementation changes behind it.

[^6]: The fate of compatibility shims in real codebases is interesting. The migration plan
always includes "remove the shims once the migration is stable." In practice, shims often
persist for months or years, becoming invisible infrastructure that nobody wants to touch
because they work and because removing them requires updating every import site. This is fine
as long as the shim is a re-export that adds no behaviour of its own. It becomes a problem
when the shim starts accumulating local modifications that diverge from the shared library.
Track shims, test them, and schedule the eventual cleanup before the divergence becomes
expensive.

[^7]: This kind of "shadow detection" test is unusual enough to be worth noting. Most test
suites assert that something specific does what it should. This test asserts that a structural
property holds: the shared library has not added any new exports that silently collide with
local names. The test fails not when behaviour is wrong, but when a change has been made
without a conscious decision. It is testing for awareness as much as correctness. The pattern
generalises: whenever a change in one place could silently affect another without breaking
existing assertions, a structural test that requires a deliberate decision is worth writing.

[^8]: This is one of the arguments for testing modules directly rather than only through
integration. An integration test that exercises the full HTTP stack tests the whole system
correctly, but it does not tell you which module broke when the test fails. A unit test that
imports `validateAdventure` from `graph.ts` directly will continue to pass after a routing
change, a rendering change, or an unrelated rule modification. The test is coupled to the
module it describes, not to the incidental details of how that module is exposed.

[^9]: Martin Fowler calls the accumulation of structural problems "technical debt": not
inherently bad, since sometimes the correct move is to ship now and restructure later, but
requiring conscious management to avoid becoming unmanageable. The signals of excessive
coupling, reading more code than expected to make a change, changes rippling outward to
unexpected places, reluctance to modify a module because touching it is unpredictable, are
the debt service notices arriving. When they come frequently, the debt is due.
