# Chapter 8: Inventory, Resources, And Encumbrance

---

> **The Quartermaster and the Adventurer**
>
> The Adventurer dropped a canvas sack onto the counter. It landed with the kind of thud that
> suggested several categories of problem.
>
> "I need to know what I can carry," said the Adventurer.
>
> The Quartermaster produced a ledger and opened it to a fresh page. "Ok Chief, name of each item;
> whether it's carried or stowed; whether it's in hand or packed; how many, if there are multiples,
> and the purpose, so I know whether we're counting it as kit or as cargo."
>
> "I have a rope," said the Adventurer.
>
> The Quartermaster wrote *rope*. "One length or several?"
>
> "One. And a lantern, three torches, some rations. Not sure how many, I've been
> eating them."
>
> The Quartermaster pulled the quill behind his ear. "Eating them?"
>
> "On the road."
>
> "Ah. See, trouble is, rations are a counted resource. We track how many remain, how many you spend,
> and whether there are any left." A pause. "Are there?"
>
> "Two, I think. Maybe one."
>
> "Maybe, ok," said the Quartermaster, and did not write anything. "That rope enchanted, or
> standard issue?"
>
> "Standard. Why?"
>
> "Enchanted rope's listed differently. It's not rope; it's a specific rope. The difference matters
> when you're asking whether someone has *a* rope versus whether they have *the* rope."
>
> The Adventurer considered this. "My sword's specific. I named it 'Rib Slicer'."
>
> "Then we will list by name. Its weight, its condition, whether it is drawn or sheathed." The
> Quartermaster retrieved the quill. "We will also note that you cannot carry the chest you
> found in the crypt, because you have already told me you have a sword, sorry, Rib Slicer, a shield,
> a pack with the lantern, torches, rope, maybe-one-maybe-two rations, and a partridge in a
> pear tree. The chest stays in the crypt."
>
> "I didn't say anything about a partridge."
>
> "Aye Chief," said the Quartermaster, "but I've found it's better to anticipate these things."

---

In Chapter 7, we built the combat loop: a round that resolves completely, applies its results to
game state, and routes the player to the next passage based on the outcome. Characters can now
fight, take damage, and be defeated. What we haven't tracked carefully is what they bring into
the fight: the items in their pack, the resources they can spend, and the choices that should
only appear when the player has the right thing in hand.

This chapter is about collections: how to represent, query, and update the things a character
carries, and what the software needs to know about each kind of thing.

---

## The Backpack As A Collection

An inventory is, at its simplest, a list of things someone is carrying. What makes it
interesting, from a software perspective, is the moment you try to answer two apparently
identical questions and discover they require completely different operations on that list.

The Quartermaster named this without naming it. "Do you have the rope?" is a membership
question: either the rope is in the pack or it isn't, and a simple yes-or-no suffices.
"How many rations do you have?" is a count: there might be three or there might be one, and
the difference matters when someone is hungry. The same array of strings can answer both.
Whether it answers them *well* depends on which question you're asking more often.

The gamebook's inventory is a `string[]` of item ids in `GameState`. The definitions that
give those ids meaning live in the adventure content:

```typescript
interface ItemDefinition {
  id: string;
  name: string;
  kind: "equipment" | "key" | "consumable" | "treasure";
  sourceId?: string;
}
```

The `inventory` in `GameState` is an array of id strings: `["ration", "ration", "brass-key"]`.
The definitions live in the adventure data and are looked up by id when the game needs a display
name or a category check. The two stay separate because the save state needs only the ids, not
the full metadata, and because the definitions can be updated — corrected, expanded, reworded —
without touching existing save files.[^1]

An array is the natural serialisation shape: standard JSON, easy to iterate, honest about the
fact that a player might carry more than one ration. But as the Quartermaster would note,
"two rations" and "one rope" are not the same kind of thing even when they live in the same
list. The next two sections deal with each in turn.

---

## Membership: Do You Have The Thing?

A locked passage in Mt. Graphnor is gated by a requirement. The brass key option only appears
if the player's inventory contains the right id:

```typescript
interface ChoiceRequirement {
  itemsAll?: string[];
  flagsAll?: string[];
  flagsNone?: string[];
  minHitPoints?: number;
  conditionsAll?: string[];
  conditionsNone?: string[];
}
```

`itemsAll` is a list of item ids that must all be present. The gate for a locked door might
look like:

```typescript
{
  text: "Unlock the brass ward.",
  requires: { itemsAll: ["brass-key"] },
  effects: { removeItems: ["brass-key"], setFlags: ["trap-disabled"] },
}
```

Checking whether the requirement is satisfied is a membership question: is this id in the
inventory array? The function `isChoiceAvailable` in `src/gamebook/state.ts` runs this check
and decides whether to show the option to the player at all.

For this pattern, a `Set` would be more efficient than an array: `Set.has(id)` is O(1), while
`Array.includes(id)` is O(n) over every item in the pack. The gamebook converts the inventory
array to a `Set` during the check rather than storing it as one, because arrays serialise
cleanly to JSON and the inventory is small enough that the performance difference is
imperceptible. The conversion happens at the point of use, not at the point of storage.[^2]

When a choice is taken, the effects update the collection using the same conversion:

```typescript
const inventory = new Set(state.inventory);

for (const item of effects.addItems ?? []) {
  inventory.add(item);
}

for (const item of effects.removeItems ?? []) {
  inventory.delete(item);
}

return { ...state, inventory: [...inventory] };
```

The `Set` conversion handles duplicates quietly: if a player already has the brass key and
somehow gains it again, the set ignores the duplication rather than adding a second copy. For
unique keys and treasures, this is exactly right. For consumables where quantity matters, it
is the wrong behaviour — which is why the rations problem needs a different solution.

---

## Quantities: When Membership Is Not Enough

Rations illustrate the limit of pure membership thinking. A player might carry three. They
spend one after a fight, leaving two. After another fight, one. After a third, none. Each
transaction has a before-state and an after-state, and the difference is the quantity.

Representing this as `["ration", "ration", "ration"]` in an array and removing one string per
use is functional but awkward. It works: `inventory.delete("ration")` removes one ration from
the set, which reduces the effective count by one. But it makes it impossible to ask "how many
do you have?" without counting instances in the array, and it makes capping the maximum or
displaying a counter rather than a list of identical entries needlessly complicated.

The cleaner model for a counted resource is a record that says what it is and how much of it
remains:

```typescript
interface Resource {
  id: string;
  label: string;
  current: number;
  max: number | null;
}

function spendOne(resource: Resource): Resource {
  return {
    ...resource,
    current: Math.max(0, resource.current - 1),
  };
}
```

The `Math.max(0, ...)` clamp is not optional. A resource that drops below zero is not a
resource; it is a bug wearing a number's clothes, and it will confuse every downstream
calculation that looks at it. Spending a ration you don't have should produce zero rations,
not negative one.[^3]

The gamebook represents rations as simple membership items for the sake of keeping the
beginner-sized implementation beginner-sized. The ration recovery choice checks that
`"ration"` is in the inventory and removes one if it is. For a five-room adventure this is
sufficient. For any game where "how many do you have?" is a real question, the `Resource`
model is the more honest representation.

---

## Maps And Lookups

The item definitions provide a catalogue: a `Map<string, ItemDefinition>` keyed by item id.
When the gamebook renders the inventory for the player, it looks up each id to find the
display name:

```typescript
function createItemCatalogue(
  items: ItemDefinition[]
): Map<string, ItemDefinition> {
  return new Map(items.map(item => [item.id, item]));
}

function itemDisplayName(
  catalogue: Map<string, ItemDefinition>,
  id: string
): string {
  return catalogue.get(id)?.name ?? id;
}
```

The actual gamebook uses `itemName` and `itemList` helpers in `src/gamebook/catalog.ts`, which
look up each id against the adventure's item definitions and fall back gracefully to the raw id
if a definition is missing.

This is a **lookup by key**: the operation that turns an identifier into the record it names.
It shows up constantly in application code because systems store references rather than copies.
The inventory entry does not carry the item's full name, category, and source inside the save
state. It carries the id, and the id is enough to retrieve everything else when the time comes.

The practical benefit of this separation is that editing an item's display name in the
adventure content updates what every player sees, including players mid-game with the item
already in their save. The id is a contract; the display name is editorial. Contracts are
stable; editorial changes are welcome. Keep them in different fields and each can evolve at
its own pace.[^4]

---

## Flags: State Without A Value

Not everything the gamebook tracks has an item identity or a quantity. Some things are simply
facts about what has happened: the puzzle room has been solved, the trap has been disabled, the
hidden passage has been found. These live in a separate `flags` collection rather than the
inventory, because they are not things a player carries. They are things a dungeon remembers.

```typescript
interface GameState {
  // ...
  inventory: string[];
  flags: string[];
}
```

A flag is a membership question with no associated value. Either the fact is recorded or it
is not. `flags.includes("puzzle-solved")` returns `true` or `false`, and the choice gate
checks for it the same way it checks for an item id.

The distinction between items and flags matters for display and authoring. An item appears
in the player's inventory panel: they can see they have the brass key, and spending it removes
it from view as well as from the data. A flag does not appear in any panel unless the author
explicitly surfaces it; it is a backstage record that the game uses to remember history without
cluttering the player's side of the screen.

The more important distinction is permanence. An item can be spent; once it leaves the
inventory, it is gone. A flag, once set, stays set. "The puzzle room is solved" is a permanent
fact about what happened on this playthrough. There is no meaningful sense in which it can be
un-solved, and the gamebook reflects this: the `setFlags` effect adds to the flags array, and
there is deliberately no `removeFlags` effect in the basic implementation.[^5]

---

## Constraints And Choice Gates

The real utility of inventory and flags is that they control what choices appear at all.
`isChoiceAvailable` runs before a passage renders and removes any option the player cannot
currently take:

```typescript
function isChoiceAvailable(
  choice: Choice,
  state: GameState
): boolean {
  const req = choice.requires;
  if (!req) return true;

  if (req.itemsAll) {
    const inv = new Set(state.inventory);
    if (!req.itemsAll.every(id => inv.has(id))) return false;
  }

  if (req.flagsAll) {
    const flags = new Set(state.flags);
    if (!req.flagsAll.every(f => flags.has(f))) return false;
  }

  if (req.flagsNone) {
    const flags = new Set(state.flags);
    if (req.flagsNone.some(f => flags.has(f))) return false;
  }

  if (req.minHitPoints !== undefined) {
    if (state.hitPoints < req.minHitPoints) return false;
  }

  if (req.conditionsAll) {
    const conditions = new Set(state.conditions);
    if (!req.conditionsAll.every(condition => conditions.has(condition))) return false;
  }

  if (req.conditionsNone) {
    const conditions = new Set(state.conditions);
    if (req.conditionsNone.some(condition => conditions.has(condition))) return false;
  }

  return true;
}
```

A choice that fails this check is not shown to the player at all. This is HATEOAS from
Chapter 3 applied at the adventure-content level: the passage offers only the actions that
are actually available from the current state. A player who doesn't have the thieves' tools
never sees the option to pick the lock. They are not told they lack them; the option is simply
absent.

This is a deliberate design choice with an important consequence for authoring. Every gated
choice needs an alternative path, because silently removing an option only works if there is
still somewhere for the player to go. A passage with three choices, two of which require items
most players won't carry, is a dead end for most players. The authoring tools in the
development build surface this by showing which items are required at each choice and
whether any combination of them produces a passage with no exits.

It is worth noting how differently other RPG systems approach the same problem. *Fighting
Fantasy* handles inventory with almost no system at all: an Equipment section, a box for Gold
pieces, and no weight or slot rules. The constraint is narrative; the author writes "you cannot
take the chest" and trusts the player.[^6] D&D sits at the opposite extreme, with carrying
capacity in pounds, optional encumbrance thresholds, and a rule that most tables ignore because
the bookkeeping overhead is rarely worth the tactical interest it creates.[^7] The gamebook's
model sits closer to *Fighting Fantasy*: the constraint is the requirement gate, not a weight
calculation, and the cognitive overhead stays low enough that the mechanics stay invisible.

---

## Effects: Add, Remove, Spend

The `ChoiceEffect` type covers the mutations the game applies when a choice is resolved:

```typescript
interface ChoiceEffect {
  addItems?: string[];
  removeItems?: string[];
  setFlags?: string[];
  heal?: number;
  damage?: number;
  temporaryHitPoints?: number;
}
```

These apply in a defined order inside `applyChoiceEffects`: items are added and removed first,
then flags are set, then hit points change. The order matters. When a choice removes a
consumable and uses it to heal, the item should be gone before the healing is confirmed,
because a careless implementation that heals first and removes second has a window in which the
item exists in the inventory, the healing has already applied, and something could go wrong in
between. There is no such window if the removal comes first.

Each effect is also logged. When a player spends a ration and gains four hit points, the game
records "Used ration. Recovered 4 hit points." This is the same transparency principle the
dice log served in Chapter 6: the player should be able to follow what happened without having
to trust the system on faith. The author sees the same log entries in the debug panel during
development, which makes verifying that the right effects fire for the right choices a matter
of reading rather than guessing.

---

## Adventure Validation For Items

The graph validator from Chapter 2 checks structural problems in the passage graph. The same
validation extends to items and flags, because the authoring errors here are exactly as
invisible as unreachable passages until someone hits them in play.

If a choice requires `"brass-key"` but no passage in the adventure ever grants it via an
effect, the requirement can never be satisfied. The validator catches this:

- Item ids referenced in requirements with no corresponding `ItemDefinition` in the catalogue.
- Item ids referenced in effects with no corresponding `ItemDefinition`.
- Duplicate `ItemDefinition` entries where two items share the same id.
- The same reference checks for encounter and discovery ids.

These are authoring errors, not playtesting problems. Catching them in the validator is
cheaper than catching them in a session when someone asks "wait, where was I supposed to get
the brass key?" The answer to that question at the table is a difficult conversation. The
answer in the validator output is a line in a report.

---

## The Build Move

By the end of this chapter, the gamebook has a working inventory and flags layer:

- `ItemDefinition` in `src/gamebook/model.ts` defines the catalogue shape: `id`, `name`,
  `kind`, and an optional `sourceId` for SRD-derived or project-original items.
- `ChoiceRequirement` in `src/gamebook/model.ts` gates choices on `itemsAll` (required item
  ids), `flagsAll` and `flagsNone` (required and forbidden flags), `conditionsAll` and
  `conditionsNone` (required and forbidden conditions), and `minHitPoints`.
- `ChoiceEffect` in `src/gamebook/model.ts` applies `addItems`, `removeItems`, `setFlags`,
  and hit point changes when a choice is taken.
- `isChoiceAvailable(choice, state)` in `src/gamebook/state.ts` checks all requirements and
  returns `false` if any are unmet, hiding the choice from the player.
- `applyChoiceEffects(state, effects)` in `src/gamebook/state.ts` converts the inventory to a
  `Set`, applies additions and removals, serialises back to an array, sets flags, and applies
  hit point changes in that order.
- `itemName(adventure, id)` and `itemList(adventure, ids)` in `src/gamebook/catalog.ts` look
  up display names from the adventure's item catalogue for rendering the inventory.
- Adventure validation in `src/gamebook/graph.ts` checks for undefined item references,
  undefined flag references, and duplicate item definitions.

The rations, brass key, thieves' tools, and Graphnor map in Mt. Graphnor exercise all of
these paths: gaining an item, spending a consumable, using a key once, and acquiring treasure
that unlocks acknowledgement in the ending passage.

---

The Quartermaster's two questions turn out to be a useful lens for any collection in software:
is this a membership question, or is this a count? The brass key is either there or it isn't.
The rations need a number. The flags are membership with no associated item. Each calls for a
different shape of data, and using the wrong shape doesn't produce an error; it produces
something that mostly works until the edge case arrives. The gamebook's model is deliberately
minimal: string ids in an array, `Set` semantics at the point of use. That is enough for a
five-room dungeon with a handful of items. The resource model, the slot constraint, the weight
calculation: those are the rooms further in.

In Chapter 9, we'll look at a different kind of constraint entirely. Not what a player is
allowed to carry, but what different kinds of user are allowed to see. The Dungeon Master's
screen, the author tools, the debug panel, and the published player-only build are all the same
system with different visibility rules. That is access control, and it's the subject of
Chapter 9.

---

[^1]: The separation of save-state ids from catalogue definitions is an instance of the
indirection principle that appears throughout the gamebook: store references, not copies. The
save file is a set of pointers into the adventure definition. When the adventure changes, the
save still works as long as the ids it references still exist. When an id changes, the save
validator can catch the mismatch and either migrate it or report a readable error. This is why
the validation in Chapter 4's `src/gamebook/state.ts` checks `currentPassageId` against the
adventure's passage map: a renamed passage id would otherwise silently strand the player.

[^2]: The O(1) versus O(n) distinction is real but rarely the right reason to choose a data
structure for a small game. A player inventory of twenty items means the difference between
twenty comparisons and one lookup; at that scale, the legibility of the code matters more than
the performance. The `Set` conversion is done at call time rather than stored because the
inventory is serialised as an array for JSON compatibility, and keeping it as a Set in memory
would require converting back to an array for every save. Converting at the point of use is the
cleaner trade-off.

[^3]: Negative resource values are a class of bug that tends to appear late, in edge cases, and
with confusing symptoms. A healing potion applied to a character at full hit points that takes
them to "above maximum" is annoying; a ration that takes the ration count to −1 is a data
integrity problem. The clamp is cheap, explicit, and prevents both. Defence in depth costs very
little here.

[^4]: This is one of the reasons stable identifiers matter in data design. Display names are
user interface: they change when copy improves, when translations are added, or when a name
turns out to be confusing in context. Identifiers are contracts: the save file uses them, the
validation checks them, the graph validator refers to them. Changing an id is a migration.
Changing a display name is editorial. They have different lifecycles and should be in
different fields.

[^5]: The decision not to implement `removeFlags` is not an oversight. A flag that says "the
puzzle room has been solved" should not be removable by any in-game action, because the
solution to the puzzle was a one-time event. Adding a `removeFlags` effect would mean every
flag is now potentially impermanent, which changes the semantics of flags from "recorded
history" to "current state". If the gamebook later needs both permanent records and toggleable
state, those should be different collections with different names, not the same collection with
an extra effect type.

[^6]: The *Fighting Fantasy* approach to inventory is implicitly a narrative constraint rather
than a mechanical one. The books routinely include passages like "you cannot carry the heavy
chest" or "you must leave behind all your weapons" as prose instructions, and the player is
expected to cross things off the adventure sheet accordingly. The trust goes both ways: the
player trusts the author to set reasonable constraints, and the author trusts the player not
to claim they put the dragon's treasure in their pocket. The system scales to exactly one
player reading alone and falls apart immediately in a competitive or adversarial context.

[^7]: The carrying capacity rules in SRD 5.1 are technically in force and almost universally
ignored. The optional Encumbrance variant, which adds threshold effects at five times and ten
times the Strength score in pounds, sees occasional use at tables that want some mechanical
weight to their packs. The Dungeon Master's Guide notes that tracking weight can slow the game
and recommends against it for groups that value pace. This is one of the more honest admissions
in an official rulebook that a rule exists primarily to be there rather than to be followed.