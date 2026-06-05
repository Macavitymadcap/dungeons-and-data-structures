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

In Chapter 11, we structured the rules the game runs on: sources, entities, mechanics, and
provenance. That data is authored and stable. The character classes do not change between
sessions. The SRD attribution does not expire.

What does change between sessions is the player's progress. Where they are in the dungeon.
How many hit points remain. Which items are in the pack. Which flags have been set, which
encounters defeated, which endings reached. This is the player's **save state**: a record of
everything that has changed since the adventure began.

Saving a game is the act of writing that record somewhere durable. Loading a game is the act
of reading it back and trusting it. Both acts are more complex than they look. The record must
survive browser reloads. It must survive the player sharing it to a different device. It must
survive the adventure being updated. It must be readable by future versions of the code that
did not exist when it was written. And when any of these conditions are not met, it must fail
gracefully rather than silently corrupting progress.

Tabletop and gamebook traditions each solve this in their own way, and the solutions are worth
holding in mind before the code arrives. A *Fighting Fantasy* gamebook saves by asking you to
scribble your Skill, Stamina, and Luck on a paper sheet and pencil in the paragraph number you
stopped at; the save is whatever you wrote down, and its integrity depends entirely on your
handwriting and your honesty. A D&D table saves by consensus: someone notes "we ended outside
the sanctum, half the party at low health," and the group reconstructs the rest from memory next
week. Video games formalised the whole business into the checkpoint, the quicksave slot, and the
autosave that quietly records your position whenever you cross a threshold. The checkpoint stone
in the excerpt is that last idea wearing a fantasy costume. What follows is the same idea again,
expressed in a form a browser can keep.

---

## Memory Is Not Persistence

When a player closes the browser tab, the JavaScript runtime stops. Everything in memory,
every variable, every object, every piece of state the gamebook was tracking, disappears.
The next time the tab opens, the runtime starts fresh. There is no memory of the previous
session.

This is what programmers mean by **ephemeral state**: data held in memory that does not
survive the process ending. Most of the interesting state in a running application is
ephemeral. It is fast to access and trivially updated, but it vanishes the moment the
process does.

**Durable state** is state that has been written to something that persists beyond the
process: a file, a database, a browser storage API. The writing is called **serialisation**,
the reading back is called **deserialisation**, and the place where data crosses from memory
to durable storage is the **storage boundary**.

The storage boundary is where most persistence bugs live. Data looks correct in memory. It
looks correct in storage. The problem appears when the two are not perfectly synchronised:
when a write fails halfway through, when the format on one side does not match the format the
reader expects, or when the stored data was written by a version of the code that no longer
exists.

---

## The Smallest Useful Save

The gamebook's first useful save is two lines:

```typescript
const key = "dads-gamebook-save";
localStorage.setItem(key, JSON.stringify(state));
```

`localStorage` is a browser API that stores key/value pairs as strings, persisted across
page reloads for the same origin.[^1] `JSON.stringify` converts the JavaScript state object
to a string. The two together write the current state somewhere that will survive a browser
reload.

Loading is the reverse:

```typescript
const raw = localStorage.getItem(key);
const state = raw ? JSON.parse(raw) : createInitialState(adventure, character);
```

If there is something stored under the key, parse it and use it. If there is nothing, start
fresh. This is the minimal viable save: it works, it is portable, and it fits in four lines.

It is also insufficient as soon as the game grows. The stored string is a raw serialisation
of whatever object happened to be in memory at save time. There is no record of which game
it belongs to, which version of the save format it uses, or whether the data inside is
structurally valid. Load it into a version of the code that has added or removed fields, and
the result is undefined.

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
type: any loader can check whether the string it has is actually a gamebook save rather than
an arbitrary JSON blob. `version` is the save format's revision number: if the format changes
to add new fields or reorganise existing ones, the version number increments and the loader
knows what shape to expect. `adventureId` names the adventure this save belongs to: loading
a Mt. Graphnor save into a different adventure is almost certainly an error.

These three fields are the document's passport. Without them, a save file is a mystery box.
With them, a loader can say: "This is a dads-gamebook-save document, version 2, for Mt.
Graphnor, last updated on this date. I know how to read it."

The constants that define this identity:

```typescript
export const SAVE_KEY = "dads-gamebook-save";
export const SAVE_SCHEMA = "dads-gamebook-save";
export const CURRENT_SAVE_VERSION = 2;
```

They are named constants rather than inline literals so that every part of the code that
refers to them refers to the same thing, and so that the decision to change them is made
consciously rather than accidentally.[^2]

---

## Validate Before You Trust

The storage boundary is where untrusted data enters the application. Everything on the far
side of that boundary was written by code that may no longer exist, modified by a player who
wanted a thousand hit points, or corrupted by a failed write. The application must not trust
it automatically.

Validation is the gate between untrusted input and trusted application state. It is not the
type system: TypeScript's type system does not run at runtime and cannot protect against
malformed JSON arriving from local storage or a paste box. Validation must be explicit,
exhaustive, and produce readable errors.

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
different adventure" are messages a player can understand. They are also messages a developer
can act on. Generic errors like "Load failed" help no one.[^3]

The distinction between `parseGame` and `loadGame` is also worth noting. `parseGame` takes a
raw string and validates it strictly. `loadGame` takes the storage adapter and the adventure,
calls `parseGame`, and falls back to a new game on validation failure. The two functions do
different jobs: one validates, one manages the browser storage lifecycle. Keeping them
separate means `parseGame` can be tested with known inputs without touching the browser.

---

## Migrations: A Promise To Old Players

A save file created by version 1 of the gamebook will eventually be read by version 2.
This is not an edge case; it is a certainty for any game that updates while players are
mid-adventure.

The save format's version field exists precisely to handle this. When the loader reads a
version 1 save, it runs the version 1 migration before treating the data as current:

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
`encounters` record; the migration rebuilds it from the current adventure definition,
which gives the encounters their starting hit points even if the player was mid-fight when
the format changed.[^4]

The migration is tested. `state.test.ts` includes a fixture that represents the oldest
supported save format and asserts that migrating it produces a valid current-version save.
When a future format change adds a version 3, a new migration function handles the step
from 2 to 3, and the test suite adds a version 2 fixture. The oldest fixture stays in
place, verifying the complete migration chain.[^5]

---

## Three Storage Strategies

The gamebook uses three persistence mechanisms, each serving a different need.

**Browser local storage** is synchronous, string-valued, per-origin, and cleared by the
user on demand. It is the right tool for a single-player browser game with no server: fast
to access, zero setup, and sufficient for a save that lives on one device. Its limits are
equally clear: local to one browser, invisible to a server, subject to eviction under storage
pressure, and inaccessible on a different device.[^6]

**Exported JSON** is a snapshot: a complete record of state at a particular moment, written
to a file the player can download, keep, and import. It is not a live store and does not
auto-update. What it is, is portable: the player holds it, and no server needs to be running
for them to hand it to someone else or load it on a new machine.

The gamebook uses both, plus a third layer that combines them: local storage is the automatic
save on every choice; exported JSON is the manual download the player can share or archive;
import is the mechanism for loading that file back. The three serve different needs and do not
substitute for each other.[^7]

---

## The Build Move

By the end of this chapter, the gamebook has a complete persistence layer:

- `SAVE_KEY`, `SAVE_SCHEMA`, and `CURRENT_SAVE_VERSION` in `src/gamebook/state.ts` define
  the document identity constants.
- `GameState` in `src/gamebook/model.ts` is the versioned save document type, with `schema`,
  `version`, and `adventureId` as the identifying fields shown in this chapter.
- `createInitialState(adventure, character)` creates a fresh version-2 save with correct
  defaults for all fields.
- `parseGame(raw, adventure)` validates a raw string against the schema, version,
  adventure id, and field structure, returning a readable error for each failure mode.
- `loadGame(storage, key, adventure)` loads from the storage adapter, calls `parseGame`, and
  falls back to a fresh save on failure.
- `saveGame(storage, key, state)` serialises and writes. It is intentionally trivial: save
  is simpler than load because the application controls what it writes.
- `migrateV1ToV2(doc, adventure)` upgrades a version-1 save to the current format, filling
  missing fields with correct defaults.
- `StorageAdapter` is the injectable interface used in tests: `{ getItem, setItem, removeItem }`.
  The browser client passes `window.localStorage`; tests pass an in-memory object.

The browser smoke in `scripts/test-static-gamebook.ts` exercises the full persistence
lifecycle: start a new game, make choices, export, download, reset, and import the saved
file to verify that the restored passage and encounter state match.

---

The Timekeeper was honest about the limits. All memory is unreliable. The stone of memory
remembers what it knew at the moment of saving, not what the dungeon will look like next
week. The question is not whether a save is perfect but whether the system is honest about
what it recorded, explicit about the version it understands, and graceful when the two
sides of the boundary do not match.

A save file is not a snapshot of the game. It is a snapshot of the game as it was at one
moment, in one version of the code, in one adventure. Treating it as anything more leads to
the kind of silent data corruption that produces confusing bugs and frustrated players.
Treating it honestly, with explicit schemas, readable validation errors, and careful
migrations, makes it something the player can trust.

In Chapter 13, we'll name the approach the book has been taking: the discipline of building
software that models a real domain faithfully, using the domain's own vocabulary, drawing
boundaries where the domain draws them. The work has been practice all along. The next chapter
gives it a name.

---

## At Scale: Campaign Ledger

The gamebook's persistence layer is local storage plus an exported JSON file. Campaign Ledger
adds a third tier: SQLite as the server-side source of truth for everything that needs to
survive across devices and sessions. When a player updates their character sheet, the change
goes to SQLite. When they open the app on a different device, they see the same state because
the state lives on the server, not in their browser.

Campaign Ledger also applies the same versioned-document pattern to a local play mode for
users without an account. The local play document is stored in `localStorage` under a
versioned key, structured exactly like the gamebook's save: explicit schema, declared version,
validation before accepting imported data, readable errors on failure. It stores only a
character summary rather than a full sheet; the full sheet lives in SQLite and requires
authentication. The player is told plainly what the boundary means: characters stored here
exist only in this browser, and here is how to take them elsewhere.

A fourth layer sits above all three: the hosted backup. The backup script runs SQLite's
`VACUUM INTO` to write a clean compacted copy of the database to a new file, accompanied by
an asset snapshot, a manifest, and a timestamp. The restore operation requires an explicit
confirmation, because it will overwrite the current database and cannot be undone without
another backup.

The operational lesson generalises: any state worth storing is worth backing up, and any
backup worth taking is worth testing. Campaign Ledger's backup is verified against a test
instance before the real restore is ever needed. A backup that has never been restored is
an untested claim that recovery is possible.

---

[^1]: `localStorage` stores data per origin: the combination of protocol, hostname, and port.
Data stored at `https://example.com` is not accessible at `https://other.com` or even
`http://example.com`. This is the browser's same-origin policy applied to storage. It means
a gamebook hosted at one URL cannot accidentally read saves from a gamebook hosted at a
different URL, even if they use the same key string. The schema and adventure-id checks in
the validator are a second layer of protection against collisions within the same origin.

[^2]: Named constants rather than inline literals is an old principle with many names: Don't
Repeat Yourself, single source of truth, magic-number avoidance. The practical benefit here
is specific: the schema string appears in the stored JSON, in the validator, in the test
fixtures, and in error messages. If it needs to change, one constant changes and every
reference is updated by the type system. If it were an inline literal, one change might miss
an occurrence and leave the validator checking against a different string than the serialiser
writes.

[^3]: This is the error-message quality argument from user experience applied to developer
tooling. "Save version 3 is from a future version of the game" is a message that tells the
developer exactly what happened and exactly what to do about it (wait for the code to catch
up, or provide a newer build). "Load failed" tells the developer nothing and tells the player
less. Writing good error messages is not a luxury; it is the difference between a debugging
session that takes five minutes and one that takes an hour.

[^4]: The decision to rebuild encounter state from the adventure definition on migration
rather than from the save file is intentional. If the adventure has been updated to change
an encounter's hit points, a migration that copies the old encounter state would preserve the
outdated values. Rebuilding from the current definition means the migrated save reflects the
current adventure. This is a design choice, not a universal rule: in some games, preserving
the mid-fight state exactly as it was would be the right call. The gamebook prefers the
current adventure definition because the adventure is the source of truth for authored data.

[^5]: The migration test fixture is an example of a golden record: a known good input
preserved as a test fixture so that future code changes cannot silently break the ability to
load old saves. Golden records are especially important for persistence code, where the
format was designed at a specific point in time and must be read correctly forever after.
Adding a new migration later does not remove the obligation to test the old migration path;
it extends the test chain to cover the new step.

[^6]: Browser local storage is not a substitute for server-backed storage in any context
where the player uses multiple devices or the developer needs visibility into player state.
It is also not guaranteed: browsers can clear local storage under storage pressure, and
private browsing modes typically do not persist local storage across sessions. The gamebook
documents this honestly in the UI: the save exists in this browser. Export your save if you
want to keep it.

[^7]: The three-layer approach (autosave to local storage, manual export to JSON, manual
import from JSON) is a common pattern for browser-based games that want to feel modern
without requiring an account. It solves the "different device" problem by making export and
import explicit player actions rather than invisible infrastructure. The cost is that the
player must remember to export; the benefit is that there is no server to break, no account
to lose access to, and no privacy concern beyond what the browser stores locally.

[^8]: Campaign Ledger's local play copy is deliberately unambiguous: "Characters stored here
exist only in this browser." The sentence is short, specific, and accurate. Writing this kind
of honest product copy requires knowing what the system actually does, which in turn requires
having thought through the storage model carefully. The data model and the product copy are
two expressions of the same design decision.

[^9]: The principle that a backup worth taking is a backup worth testing comes from operations
practice and is violated constantly. A backup that has never been restored is an untested
claim that recovery is possible. Campaign Ledger's hosted backup tests are a minimal version
of a restoration exercise: they verify that the backup command produces a file, that the
restore command can read that file, and that the resulting database has the expected state.
Real disaster recovery practice would go further, but this is enough to prove the mechanism
works.