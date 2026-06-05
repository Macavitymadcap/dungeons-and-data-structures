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

An inventory is, at its simplest, a collection of item identifiers. The player has acquired a
brass key, some rations, and a thieves' tools set. The game needs to be able to answer three
questions about that collection at any point: what is in it, is a specific thing in it, and what
happens when something is added or removed.

The gamebook's first inventory model reflects this simplicity directly. The `GameState` holds
a `string[]` of item ids, and item definitions in the adventure content give each id a name, a
category, and an optional source reference:

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
the full metadata, and because the definitions can be changed (corrected, expanded, reworded)
without touching existing save files.[^1]

An array is the natural serialisation shape here: it is a standard JSON structure, easy to
iterate, and honest about the fact that a player might carry more than one ration. But as the
Quartermaster observed, carrying two rations is subtly different from carrying one rope: the
rations are a counted resource, where the question is "how many?", and the rope is a membership
question, where the question is "do you have it?"

---

## Membership: Do You Have The Thing?

A locked passage in Mt. Graphnor is gated by a requirement. The brass key choice only appears
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

`itemsAll` is a list of item ids that must all be present. The gate for the locked door might
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
and decides whether to show the option to the player.

For this pattern, a `Set` would be more efficient than an array: `Set.has(id)` is O(1), while
`Array.includes(id)` is O(n) over every item in the pack. The gamebook converts the inventory
array to a `Set` during the check rather than storing it as one, because arrays serialise
cleanly to JSON and the inventory is small enough that the performance difference is
imperceptible. The conversion happens at the point of use, not at the point of storage.[^2]

When a choice is taken, the effects update the collection. The gamebook converts the inventory
array to a `Set`, applies the additions and removals, and serialises the result back to an
array:

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

The `Set` conversion handles duplicates: if a player already has the brass key and somehow
gains it again, the set quietly ignores the duplication rather than adding a second copy. For
items where quantity matters, this is the wrong behaviour. For unique keys and treasures, it is
exactly right.

---

## Quantities: When Membership Is Not Enough

Rations illustrate the limit of pure membership thinking. A player might carry three rations.
They spend one to recover hit points after a fight. Two remain. After a second fight, one
remains. After a third, none.

Representing this as `["ration", "ration", "ration"]` in an array and removing one string per
use is functional but awkward. It works: `inventory.delete("ration")` removes one ration
from the set, which reduces the effective count by one. But it makes it impossible to ask
"how many rations do you have?" without counting instances in the array, and it makes it
impossible to set a maximum or display the resource as a counter rather than a list of
identical entries.

The cleaner model for a counted resource is a record with a current value and an optional
maximum:

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
resource; it is an error that will confuse every downstream calculation that looks at it.
Spending a ration you don't have should produce zero rations, not negative one.[^3]

The gamebook's model represents rations as simple membership items for the sake of
a beginner-sized implementation. The ration recovery choice checks that `"ration"` is in the
inventory and removes one if it is, relying on the set behaviour to enforce uniqueness. For
a five-room adventure this is sufficient. For any game where "how many do you have?"
is a real question, the resource model is the more honest representation.

---

## Maps And Lookups

The item definitions provide a catalogue: a `Map<string, ItemDefinition>` keyed by item id.
When the gamebook renders the inventory for the player, it looks up each id in the catalogue
to find the display name:

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

The actual gamebook uses `itemName` and `itemList` helpers in `src/gamebook/catalog.ts`,
which look up each id against the adventure's item definitions and fall back to the raw id
if a definition is missing.

This is a **lookup by key**: the operation that turns an identifier into the record it names.
It is the most common data-structure operation in application code, and the reason it appears
so often is that systems tend to store references (ids) rather than copies (full records). An
inventory entry does not need to carry the item's full name, weight, and category inside the
save state. It carries the id, and the id is enough to retrieve everything else.

The practical consequence is that editing an item's display name in the adventure content
updates what every player sees, including players mid-game with the item already in their
save. This is usually desirable for editorial changes (correcting a typo, improving a
description). It would be undesirable for changes that alter meaning (renaming "brass key" to
"iron key" when the adventure still refers to the brass ward). Good authoring practice keeps
ids stable and uses them as permanent contracts; display names are allowed to evolve.[^4]

---

## Flags: State Without A Value

Not everything the gamebook tracks has an item identity. Some things are simply facts about
what has happened: the puzzle room has been solved, the trap has been disabled, the hidden
door has been found. These do not live in the inventory; they live in a separate `flags`
collection.

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
in the player's inventory panel: the player can see they have a brass key, and removing it
from the game state corresponds to the in-world event of using it. A flag does not appear
in any panel unless the author explicitly surfaces it; it is a backstage record that the
game system uses to remember history without cluttering the player's view.

Flags can also gate passage content in ways that items cannot. An item can be spent; once
it leaves the inventory it is gone. A flag, once set, stays set. "The puzzle room is solved"
is a permanent fact; there is no meaningful sense in which it can be un-solved. That
permanence is part of the design: the `setFlags` effect adds to the flags array, and there
is deliberately no `removeFlags` effect in the basic implementation.[^5]

---

## Constraints And Choice Gates

The real utility of inventory and flags emerges when they start controlling what choices are
available.

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
Chapter 3 applied at the adventure-content level: the passage only offers the actions that
are actually available from the current state. A player who doesn't have the thieves' tools
never sees the option to pick the lock. They are not told they lack the tools; the option
simply isn't there.

This is a deliberate design choice, and it has implications for authoring. Every choice with
a requirement needs an alternative, because removing an option from a player who doesn't
meet it only works if there is still somewhere for the player to go. A passage with three
choices, two of which require items the player is unlikely to have, is effectively a
dead-end passage for most players. The authoring tools in the development build surface this
problem by showing choice requirements in passage previews, so the author can see which
players reach a passage with which items and whether the gates make structural sense.

It is worth noting how different this is from the approaches other RPG systems take to the
same problem. *Fighting Fantasy* handles inventory with almost no system at all: an Equipment
section on the adventure sheet, a small box for Gold pieces, and no weight or slot rules.
The constraint is narrative; the author writes "you cannot take the chest" and that is the
rule.[^6] D&D sits at the other extreme, with carrying capacity in pounds, optional
encumbrance thresholds, and a rule few tables actually enforce because the bookkeeping
overhead outweighs the tactical interest.[^7] The gamebook's model sits closer to *Fighting
Fantasy*: the constraint is the requirement gate, not a weight calculation, and the
cognitive overhead stays low enough that the mechanics stay invisible.

---

## Effects: Add, Remove, Spend

Going back to the gamebook, the `ChoiceEffect` type covers the mutations the game can apply
when a choice is taken:

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

These effects apply in a defined order inside `applyChoiceEffects` in `src/gamebook/state.ts`:
items are added and removed, flags are set, and then hit points change. The order matters when
a choice both removes a consumable and uses it to heal: the item should be removed before the
healing is confirmed, so that a later validation pass cannot find the item still in the
inventory and re-apply the effect.

Each effect is also logged. When a player spends a ration and gains four hit points, the game
log records "Used ration. Recovered 4 hit points." The log is the player's account of what
happened to their resources. It serves the same transparency role that the dice log served in
Chapter 6: the player should be able to follow the arithmetic without having to trust the
system blindly.

The author also sees these log entries in the debug panel during development, which makes it
straightforward to verify that the right effects are firing for the right choices without
running through the whole adventure manually.

---

## Adventure Validation For Items

The graph validator from Chapter 2 checks structural problems in the passage graph. The same
validation extends to items and flags: if a choice requires `"brass-key"` but no passage
in the adventure ever grants `"brass-key"` via an effect, that requirement will never be
satisfiable, and the validator should say so.

The adventure in `src/gamebook/graph.ts` checks for:

- Item ids referenced in requirements that have no corresponding `ItemDefinition` in the
  adventure's catalogue.
- Item ids referenced in effects that have no corresponding `ItemDefinition`.
- Duplicate `ItemDefinition` entries (two items with the same id).
- Discovery and encounter ids with the same kinds of reference problems.

These are authoring errors. A choice that requires an item that cannot be acquired is a
structural problem, not a playtester problem. Catching it in the validator is cheaper than
catching it in a playtest session when someone asks "wait, where was I supposed to get the
brass key?"

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
- `isChoiceAvailable(choice, state)` in `src/gamebook/state.ts` checks all
  requirements and returns `false` if any are unmet, hiding the choice from the player.
- `applyChoiceEffects(state, effects)` in `src/gamebook/state.ts` converts the inventory to
  a `Set`, applies additions and removals, serialises back to an array, sets flags, and
  applies hit point changes.
- `itemName(adventure, id)` and `itemList(adventure, ids)` in `src/gamebook/catalog.ts`
  look up display names from the adventure's item catalogue for rendering the inventory.
- Adventure validation in `src/gamebook/graph.ts` checks for undefined item references,
  undefined flag references, and duplicate item definitions.

The rations, brass key, thieves' tools, and Graphnor map in Mt. Graphnor exercise all of
these paths: gaining an item, spending a consumable, using a key once, and acquiring treasure
that unlocks acknowledgement in the ending passage.

---

The Quartermaster was right that "I have a rope" and "I have three rations" are different
questions. One is a membership check; the other is a count. Both are collection questions, but
the data structure that serves one cleanly serves the other awkwardly. The brass key is not the
same kind of thing as the rations, even though they live in the same inventory array.

The gamebook's model is deliberately minimal: everything is a string id, the quantities implied
by the array, the membership enforced by a Set. That is enough for a first dungeon where the
items are few and the rules are small. The resource model, the quantity field, the slot
constraint: those are the next room.

In Chapter 9, we'll look at a different kind of constraint entirely. Not what a player is
allowed to carry, but what different kinds of users are allowed to see. The Dungeon Master's
screen, the author tools, the debug panel, and the published player-only build are all the same
system with different visibility rules. That is access control, and it's the subject of Chapter 9.

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
integrity problem. The clamp is cheap, explicit, and prevents both. The Campaign Ledger schema
enforces this at the database level with a `CHECK (current_value >= 0)` constraint, which means
the invariant holds even if the application layer has a bug. Defence in depth.

[^4]: This is one of the reasons stable identifiers matter in data design. Display names are user
interface: they change when copy improves, when translations are added, or when a name turns out
to be confusing in context. Identifiers are contracts: the save file uses them, the validation
checks them, the graph validator refers to them. Changing an id is a migration. Changing a
display name is editorial. They have different lifecycles and should be in different fields.

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