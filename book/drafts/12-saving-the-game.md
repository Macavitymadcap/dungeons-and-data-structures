# Chapter 12: Saving The Game

---

> **The Adventurer and the Timekeeper**
>
> The Adventurer paused at the threshold of the stone of memory, one hand on the carved sigil.
> Beyond lay the deeper dungeon. Behind, three hours of progress: the guardian defeated, the
> puzzle solved, the brass key spent and the trap disarmed.
>
> "Touch the stone," said the Timekeeper, "and it will remember."
>
> "Remember what, exactly?"
>
> "Where you are. What you carry. What you have done. The state of the world as it stands at
> this moment." The Timekeeper consulted the ledger, tracing a line with one careful finger.
> "Entry sealed under the name of this dungeon, in the manner of the second reckoning. The
> passage you stand before, named in the register. The hour of sealing, noted in the margin."
>
> The Adventurer looked at the stone. "And if the dungeon changes while I'm away? If the
> Game Warden rearranges the passages, updates the guardian's armour, adds a new room?"
>
> "Then the stone's memory and the current dungeon may disagree," said the Timekeeper. "At that
> point, when you return, we must decide what the stone actually recorded: what it knew at the
> time, which may no longer match what exists. Some of it we can migrate. Some of it we must
> discard. Some of it we may refuse to load at all."
>
> "That seems unreliable."
>
> "All memory is unreliable," said the Timekeeper. "The question is how unreliable, in which
> directions, and whether the system is honest about the limits."
>
> The Adventurer considered this, and then touched the stone.

---

Fighting Fantasy books come with an adventure sheet. It has boxes for your Skill, Stamina, and
Luck scores, a grid for tracking your gold and provisions, and a notes section at the bottom.
The notes section is officially for recording items and clues. In practice, for most readers,
it was also where you wrote the paragraph number you stopped at.[^1]

This was not the intended save mechanism. The books do not tell you to do it. The intended
mechanism is that you start again when you die, like a sensible person. But three hours into
*Citadel of Chaos* with a Skill of 9 and a pocket full of useful items, the gap between
"sensible" and "write down paragraph 173 and come back tomorrow" was not a gap most of us
chose to jump. So you wrote the number in the notes section, closed the book, and came back
to it later.

The system trusted you completely. There was no mechanism to verify that the number you wrote
was the paragraph you actually stopped at, rather than the one just before the puzzle you
couldn't solve, or the one that happened to have a better inventory. Nobody was checking. The
save was whatever you wrote down, and its integrity was entirely dependent on your honesty and
the legibility of your handwriting.

Software persistence is solving the same problem with different tools. The player needs to
close the browser and come back tomorrow without losing three hours of progress. The question
is: what do you write down, where do you write it, and how much do you trust what you read
back?

---

## Memory Is Not Persistence

When a player closes the browser tab, the JavaScript runtime stops. Everything in memory,
every variable, every object, every piece of state the gamebook was tracking, disappears. The
next time the tab opens, the runtime starts fresh. There is no memory of the previous session.

This is what programmers mean by **ephemeral state**: data held in memory that does not
survive the process ending. Most of the interesting state in a running application is
ephemeral. It is fast to access and trivially updated, but it vanishes the moment the process
does.

**Durable state** is state that has been written to something that persists beyond the process:
a file, a database, a browser storage API. The writing is called **serialisation**, the reading
back is called **deserialisation**, and the place where data crosses from memory to durable
storage is the **storage boundary**.

The storage boundary is where most persistence bugs live. Data looks correct in memory. It
looks correct in storage. The problem appears when the two are not perfectly synchronised:
when a write fails halfway through, when the format on one side does not match the format the
reader expects, or when the stored data was written by a version of the code that no longer
exists. The Fighting Fantasy adventure sheet had no storage boundary in the technical sense;
the notes section and your memory were the same system. Software persistence involves two
separate representations of the same state, and every time data crosses the boundary between
them, it has to survive the journey intact.

---

## The Smallest Useful Save

The gamebook's first useful save is two lines:

```typescript
const key = "dads-gamebook-save";
localStorage.setItem(key, JSON.stringify(state));
```

`localStorage` is a browser API that stores key/value pairs as strings, persisted across page
reloads for the same origin.[^2] `JSON.stringify` converts the JavaScript state object to a
string. The two together write the current state somewhere that will survive a browser reload.

Loading is the reverse:

```typescript
const raw = localStorage.getItem(key);
const state = raw ? JSON.parse(raw) : createInitialState(adventure, character);
```

If there is something stored under the key, parse it and use it. If there is nothing, start
fresh. This is the minimal viable save: it works, it is portable, and it fits in four lines.

It is also the software equivalent of writing the paragraph number in the notes section.
Functional, but completely without verification. The stored string is a raw serialisation of
whatever object happened to be in memory at save time. There is no record of which game it
belongs to, which version of the save format it uses, or whether the data inside is
structurally valid. Load it into a version of the code that has added or removed fields, and
the result is undefined. Nobody is checking. The save is whatever was written, and its
integrity is entirely dependent on whether the code that wrote it was correct at the time.

---

## The Save Document

A more honest save is not just a serialised object. It is a document with a declared identity.

```typescript
interface GameState {
  schema: "dads-gamebook-save";
  version: 2;
  adventureId: string;
  currentPassageId: string;
  character: Character;
  hitPoints: number;
  temporaryHitPoints: number;
  conditions: string[];
  inventory: string[];
  flags: string[];
  encounters: Record<string, EncounterState>;
  log: string[];
  updatedAt: string;
}
```

Three fields do the identifying work. `schema` is a fixed string that names the document
type: any loader can check whether what it has is actually a gamebook save rather than an
arbitrary JSON blob. `version` is the save format's revision number: if the format changes to
add new fields or reorganise existing ones, the version number increments and the loader knows
what shape to expect. `adventureId` names the adventure this save belongs to: loading a Mt.
Graphnor save into a different adventure is almost certainly an error.

These three fields are the document's passport. Without them, a save file is a mystery box.
With them, a loader can say: "This is a `dads-gamebook-save` document, version 2, for Mt.
Graphnor, last updated on this date. I know how to read it."

The constants that define this identity:

```typescript
export const SAVE_KEY = "dads-gamebook-save";
export const SAVE_SCHEMA = "dads-gamebook-save";
export const CURRENT_SAVE_VERSION = 2;
```

They are named constants rather than inline literals so that every part of the code that
refers to them refers to the same thing, and so that a decision to change them is made
consciously rather than accidentally.[^3]

---

## Validate Before You Trust

The adventure sheet trusted you completely, and that was fine, because you were the only person
using it. The storage boundary of a software application requires more scepticism. Everything
on the far side of that boundary was written by code that may no longer exist, by a player who
may have edited the file, or by a failed write that produced a partially correct document. The
application must not trust it automatically.

Validation is the gate between untrusted input and trusted application state. It is worth
pausing on why this cannot be left to TypeScript's type system: TypeScript's types are erased
at compile time and do not exist at runtime. A function that declares its parameter as
`GameState` receives whatever was actually passed, with no runtime guarantee that the shape
matches the declared type. When data arrives from `localStorage` or a paste box, it arrives
as `unknown`, and the type system cannot help. Validation must be explicit, exhaustive, and
produce readable errors.

The gamebook's save loader in `src/gamebook/state.ts` checks in order:

```typescript
function parseGame(raw: string, adventure: Adventure): LoadResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return { ok: false, error: "Not valid JSON." };
  }

  if (typeof parsed !== "object" || parsed === null) {
    return { ok: false, error: "Save data is not an object." };
  }

  const doc = parsed as Record<string, unknown>;

  if (doc.schema !== SAVE_SCHEMA) {
    return { ok: false, error: `Wrong schema: expected "${SAVE_SCHEMA}".` };
  }

  if (typeof doc.version !== "number") {
    return { ok: false, error: "Missing or invalid version field." };
  }

  if (doc.version > CURRENT_SAVE_VERSION) {
    return {
      ok: false,
      error: `Save version ${doc.version} is from a future version of the game.`,
    };
  }

  if (doc.adventureId !== adventure.id) {
    return {
      ok: false,
      error: `This save is for "${doc.adventureId}", not "${adventure.id}".`,
    };
  }

  // ... further field checks
}
```

Each check fails with a specific, readable message. "Not valid JSON" and "This save is for a
different adventure" are messages a player can understand and a developer can act on.[^4]

The distinction between `parseGame` and `loadGame` is also worth noting. `parseGame` takes a
raw string and validates it strictly. `loadGame` takes the storage adapter and the adventure,
calls `parseGame`, and falls back to a new game on validation failure. The two functions do
different jobs: one validates, one manages the browser storage lifecycle. Keeping them separate
means `parseGame` can be tested with known inputs without touching the browser.

---

## Migrations: A Promise To Old Players

A save file created by version 1 of the gamebook will eventually be read by version 2. This is
not an edge case; it is a certainty for any game that updates while players are mid-adventure.

This is actually the one area where the Fighting Fantasy adventure sheet had an advantage.
If you put the book down at paragraph 173 and came back after a revised edition had been
published, your pencilled number still worked, because the paragraphs had not moved. The save
format had not changed; there was nothing to migrate. Software is not so lucky. Add a field,
remove a field, rename a field: every player with an existing save now holds a document that
does not match the current schema, and the loader must decide what to do with it.

The answer is a migration: a function that takes an old save and returns a valid current one,
filling in missing fields with sensible defaults. It is a promise to the player who put the
book down at paragraph 173 and came back to find the dungeon had been refurbished in their
absence. Their progress was real. Their save deserves to survive.

```typescript
function migrateIfNeeded(doc: VersionedSave, adventure: Adventure): GameState {
  if (doc.version === CURRENT_SAVE_VERSION) {
    return doc as GameState;
  }

  if (doc.version === 1) {
    return migrateV1ToV2(doc, adventure);
  }

  throw new Error(`Cannot migrate from version ${doc.version}.`);
}

function migrateV1ToV2(doc: SaveV1, adventure: Adventure): GameState {
  return {
    ...doc,
    version: 2,
    // V2 added temporaryHitPoints; default to zero for old saves
    temporaryHitPoints: 0,
    // V2 added encounter state; rebuild from adventure definition
    encounters: Object.fromEntries(
      (adventure.encounters ?? []).map(encounter => [
        encounter.id,
        { hitPoints: encounter.hitPoints, defeated: false, rounds: 0 },
      ])
    ),
    // V2 added the updatedAt timestamp
    updatedAt: new Date().toISOString(),
  };
}
```

The migration fills in missing fields with sensible defaults. A version 1 save had no
`temporaryHitPoints` field; the migration adds it at zero, which is correct. It had no
`encounters` record; the migration rebuilds it from the current adventure definition, giving
encounters their starting hit points even if the player was mid-fight when the format
changed.[^5]

The migration is tested. `state.test.ts` includes a fixture that represents the oldest
supported save format and asserts that migrating it produces a valid current-version save.
When a future format change adds a version 3, a new migration function handles the step from
2 to 3, and the test suite adds a version 2 fixture. The oldest fixture stays in place,
verifying the complete chain.[^6]

---

## Three Storage Strategies

The gamebook uses three persistence mechanisms, each serving a different need.

**Browser local storage** is synchronous, string-valued, per-origin, and cleared by the user
on demand. It is the right tool for a single-player browser game with no server: fast to
access, zero setup, and sufficient for a save that lives on one device. Its limits are equally
clear: local to one browser, invisible to a server, subject to eviction under storage pressure,
and inaccessible on a different device.[^7] It is the notes section of the adventure sheet:
convenient, personal, and completely dependent on the device you are holding.

**Exported JSON** is a snapshot: a complete record of state at a particular moment, written to
a file the player can download, keep, and share. It is not a live store and does not
auto-update. What it is, is portable: the player holds it, and no server needs to be running
for them to hand it to someone else or load it on a new machine. This is the equivalent of
photocopying the adventure sheet before returning the book to a friend.

The gamebook uses both, plus an import mechanism for reading an exported file back in. Local
storage is the autosave on every choice; exported JSON is the manual download the player can
archive or transfer; import is the mechanism for loading that file back. The three serve
different needs and do not substitute for each other.[^8]

---

## The Build Move

By the end of this chapter, the gamebook has a complete persistence layer:

- `SAVE_KEY`, `SAVE_SCHEMA`, and `CURRENT_SAVE_VERSION` in `src/gamebook/state.ts` define
  the document identity constants.
- `GameState` in `src/gamebook/model.ts` is the versioned save document type, with `schema`,
  `version`, and `adventureId` as the identifying fields shown in this chapter.
- `createInitialState(adventure, character)` creates a fresh version-2 save with correct
  defaults for all fields.
- `parseGame(raw, adventure)` validates a raw string against the schema, version, adventure
  id, and field structure, returning a readable error for each failure mode.
- `loadGame(storage, key, adventure)` loads from the storage adapter, calls `parseGame`, and
  falls back to a fresh save on failure.
- `saveGame(storage, key, state)` serialises and writes. It is intentionally trivial: save is
  simpler than load because the application controls what it writes.
- `migrateV1ToV2(doc, adventure)` upgrades a version-1 save to the current format, filling
  missing fields with correct defaults.
- `StorageAdapter` is the injectable interface used in tests: `{ getItem, setItem, removeItem }`.
  The browser client passes `window.localStorage`; tests pass an in-memory object.

The browser smoke in `scripts/test-static-gamebook.ts` exercises the full persistence
lifecycle: start a new game, make choices, export, download, reset, and import the saved file
to verify that the restored passage and encounter state match.

---

The Timekeeper was honest about the limits. All memory is unreliable. The stone remembers what
it knew at the moment of saving, not what the dungeon will look like next week. The question is
not whether a save is perfect but whether the system is honest about what it recorded, explicit
about the version it understands, and graceful when the two sides of the boundary disagree.

Writing paragraph 173 in the notes section worked because the book was static. The dungeon did
not change while you were away. Software persistence is harder precisely because both sides of
the contract can change independently: the player's save evolves as they play, and the
application evolves as it is developed. The schema, the version field, and the migration
function are how the system stays honest about that. They are what separates "I know how to
read this" from "I will load whatever this is and hope for the best."

In Chapter 13, we'll name the approach the book has been taking: the discipline of building
software that models a real domain faithfully, using the domain's own vocabulary, drawing
boundaries where the domain draws them. The work has been practice all along. The next chapter
gives it a name.

---

## At Scale: Campaign Ledger

Campaign Ledger is not yet in production, so this section is different from the ones that
preceded it in earlier chapters. Rather than describing what I learned running the application
at a table, I can describe the design decisions I made in anticipation of the problems this
chapter covers, and be honest about the ones I won't know were right until the thing is
actually running.

The gamebook's persistence layer uses two mechanisms: browser local storage for the autosave,
and exported JSON for portability. Campaign Ledger adds a third: SQLite as a server-side
source of truth. A campaign management tool used across multiple sessions by multiple players
cannot live only in one browser. Character sheets change between sessions. The DM updates an
NPC's hit points mid-campaign. A player wants to check their spell slots on their phone before
the session starts. All of that requires state that lives somewhere shared, not in whoever
happened to open the app last.

The versioned-document pattern from this chapter applies to Campaign Ledger's local play mode,
which allows a player to create a character without an account. The local play document is
stored in `localStorage` under a versioned key, structured exactly like the gamebook's save:
explicit schema, declared version, validation before accepting imported data, readable errors
on failure. The player is told clearly what the boundary means: characters stored here exist
only in this browser, and here is how to export them if that changes.[^9]

The migration question is where I expect the most difficulty when the application goes live.
Schema migrations on a local play document are manageable because the data lives on one
device. Schema migrations on a shared SQLite database are a different problem: a change to
the character sheet structure has to be applied to every existing record, correctly, and it
cannot be undone without a restore. The versioned save format, the explicit migration
functions, and the test fixtures with known golden records are all preparation for that moment.
Whether the preparation is sufficient is something I will not know until it happens.

That uncertainty is its own kind of honesty. The Timekeeper could not guarantee that the
dungeon would not change. The best the stone of memory could do was record what it knew,
declare the version of the reckoning it used, and be explicit about what would happen if the
dungeon and the record disagreed. That is still the whole job, whether the store is a browser
notes section, a `localStorage` string, or a SQLite database on a server I have not yet
deployed.

---

[^1]: The Fighting Fantasy series was explicit about intended play. Most books include
something along the lines of "if you are killed, you must begin the adventure again." The
intended mode was a complete run from the beginning, with death as a genuine consequence.
The actual play mode for most readers involved, at minimum, the adventure sheet notes
section, and at maximum a full walkthrough in a magazine or, later, online. Whether this
constitutes cheating is a philosophical question the books cannot resolve for you.

[^2]: `localStorage` stores data per origin: the combination of protocol, hostname, and port.
Data stored at `https://example.com` is not accessible at `https://other.com` or even at
`http://example.com`. This means a gamebook hosted at one URL cannot accidentally read saves
from a gamebook hosted at a different URL, even if both use the same key string. The schema
and adventure-id checks in the validator are a second layer of protection against collisions
within the same origin.

[^3]: Named constants rather than inline literals is an old principle with many names: Don't
Repeat Yourself, single source of truth, magic-number avoidance. The practical benefit here
is specific: the schema string appears in the stored JSON, in the validator, in the test
fixtures, and in error messages. If it needs to change, one constant changes and every
reference updates. If it were an inline literal, one change might miss an occurrence and leave
the validator checking a different string than the serialiser writes.

[^4]: The error message quality argument applies to developer tooling as much as to user
interfaces. "Save version 3 is from a future version of the game" tells the developer exactly
what happened and what to do about it. "Load failed" tells the developer nothing and tells
the player less. Writing good error messages requires knowing what can go wrong, which requires
having thought through the failure modes before they occur rather than at the moment they do.

[^5]: The decision to rebuild encounter state from the adventure definition on migration
rather than from the save file is intentional. If the adventure has been updated to change
an encounter's hit points, a migration that copies the old encounter state would preserve
outdated values. Rebuilding from the current definition means the migrated save reflects the
current adventure. This is a design choice, not a universal rule: in some games, preserving
the exact mid-fight state would be the right call. The gamebook prefers the current adventure
definition because the adventure is the source of truth for authored data.

[^6]: The migration test fixture is an example of a golden record: a known-good input
preserved so that future code changes cannot silently break the ability to load old saves.
Golden records are especially important for persistence code, where the format was fixed at
a specific point in time and must be read correctly forever after. Adding a new migration does
not remove the obligation to test the old migration path; it extends the test chain.

[^7]: Browser local storage is not a substitute for server-backed storage where the player
uses multiple devices or the developer needs visibility into player state. It is also not
guaranteed: browsers can clear local storage under storage pressure, and private browsing
modes typically do not persist it across sessions. The gamebook documents this honestly in
the UI: the save exists in this browser. Export your save if you want to keep it.

[^8]: The three-layer approach, autosave to local storage, manual export to JSON, manual
import from JSON, is a common pattern for browser-based games that want portability without
requiring an account. The cost is that the player must remember to export. The benefit is
that there is no server to break, no account to lose access to, and no privacy concern beyond
what the browser stores locally.

[^9]: "Characters stored here exist only in this browser" is the kind of product copy that
requires having thought through the storage model before writing it. The sentence is short and
accurate because the design decision behind it is clear. When the storage model is unclear,
the copy tends to become vague, not from dishonesty but because the writer does not yet know
what they are trying to say.