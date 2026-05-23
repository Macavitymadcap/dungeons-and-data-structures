# Gamebook Mechanics Plan

## Summary

The first gamebook should be a small, complete, static web adventure prototype that doubles as the running code example for *Dungeons & Data Structures*.

Working title for the mechanics prototype: **Mt. Graphnor**.

The gamebook should be:

- Static TypeScript and HTML.
- Local-storage-backed.
- Inspired by gamebook form without copying Fighting Fantasy text, maps, encounters, or trade dress.
- Built around original mechanics and working room concepts from the book seed chapters.
- Mechanically compatible with D&D 5e SRD 5.1 where useful.
- Framework-light in the domain layer so a later Deno-to-Hyper-Dank/Bun migration can preserve the core code.

This plan is intentionally about mechanics, data, validation, and implementation structure. Final narrative writing, tone, setting, names, and prose style come later. The playable gamebook should not be a direct computer-science allegory; the book can use separate dialogues and examples to explain technical concepts.

## Player Loop

1. Create or load a character.
2. Read the current passage.
3. Choose a link or action.
4. Resolve checks, combat, flags, items, or conditions.
5. Update local game state.
6. Move to the next passage.
7. Reach victory, failure, retreat, or cliffhanger ending.

## Progressive Feature Layers

### 1. Passage Graph

Implement passages as structured data:

- Passage ID.
- Title.
- Prose.
- Choices.
- Ending marker.
- Optional tags for room, encounter, puzzle, combat, reward, and failure.

Validation should catch:

- Missing choice targets.
- Missing start passage.
- Unreachable passages.
- Non-ending passages with no choices.
- Endings that cannot be reached.

This layer supports the graph chapter.

### 2. State And Persistence

Define a versioned local-storage document:

- Schema name and version.
- Current passage ID.
- Character summary.
- Hit points and temporary hit points.
- Conditions.
- Inventory.
- Flags.
- Roll and event log.
- Updated timestamp.

Use campaign-ledger's browser-local play document as inspiration: versioned JSON, validation on import, readable errors, and clear ownership of browser-local data.

This layer supports the persistence chapter.

### 3. Character Creator

Start with a small SRD-safe set:

- Fighter.
- Rogue.
- Wizard.
- Cleric.

Use SRD 5.1-compatible concepts:

- Ability scores and modifiers.
- Proficiency bonus.
- Armour class.
- Hit points.
- Skills.
- Simple attacks.
- Simple equipment.

Avoid non-SRD subclasses, protected named characters, setting-specific lore, and non-SRD rules text.

This layer supports the data modelling, OOP/composition, and rules-as-data chapters.

### 4. Checks And Dice

Implement:

- d20 rolls.
- Ability checks.
- Skill checks.
- Saving throws.
- DC comparison.
- Advantage and disadvantage.
- Transparent roll log.

Roll results should include enough structure for prose and tests:

- Dice rolled.
- Modifier.
- Total.
- DC where applicable.
- Success/failure.
- Reason or source.

This layer supports the dice/probability chapter.

### 5. Combat

Implement a small turn-based encounter loop:

- Player action.
- Monster action.
- Hit or miss.
- Damage.
- Defeat.
- Retreat.
- End-of-encounter transition.

Attach small encounter definitions to passages rather than hard-coding combat into UI components.

This layer supports the event-loop/combat chapter.

### 6. Inventory And Flags

Implement:

- Items that can be gained, spent, equipped, or used.
- Flags for visited rooms, puzzle answers, defeated monsters, opened doors, and ending conditions.
- Choice gating by item, flag, stat, condition, or previous passage.

This layer supports the inventory/resources and authoring chapters.

### 7. Authoring And Debug Tools

Add development-only tools:

- Graph validator output.
- Mermaid graph export.
- Debug state panel.
- Reset save button.
- Force passage navigation.
- Author/player mode distinction.

This layer supports the RBAC and testing chapters.

## Initial Mechanical Prototype

The first complete prototype should use a Five Room Dungeon shape. Room labels below describe mechanical roles, not final narrative content.

### Room 1: Entrance And Guardian

Mechanical role: first branching obstacle with a small SRD-safe guardian or equivalent blocker.

Choices:

- Fight.
- Sneak.
- Parley.

Concept payoff:

- Branching choices.
- Ability checks.
- Early consequences without ending the adventure immediately.

### Room 2: Puzzle Or Roleplaying Challenge

Mechanical role: non-combat challenge with at least one answer path, one force path, and one investigation path.

Choices:

- Answer correctly.
- Force the mechanism.
- Search for another clue.

Concept payoff:

- Flags.
- Puzzle gates.
- Alternate solutions.

### Room 3: Trick Or Setback

Mechanical role: trap or setback that can damage the character, spend an item, set a flag, or redirect the path.

Choices:

- Dexterity save to escape.
- Use an item.
- Take damage and continue.
- Trigger a failure ending only on severe consequences.

Concept payoff:

- State transitions.
- Damage.
- Consequences that persist.

### Room 4: Climax

Mechanical role: climax encounter. Avoid an impossible level-1 dragon fight. Use one of:

- A hatchling-scale original creature.
- A dragon statue that animates.
- A fire-breathing illusion with real mechanical danger.
- A guardian using SRD-safe stat assumptions.

Choices:

- Fight.
- Use a clue or item.
- Retreat.

Concept payoff:

- Combat loop.
- Encounter state.
- Multiple endings.

### Room 5: Reward And Twist

Mechanical role: ending resolver with reward, partial success, failure, or hook state.

Possible outcomes:

- Victory with treasure.
- Partial success after retreat.
- Failure after defeat or trap.
- Cliffhanger involving an egg, map, or deeper dungeon.

Concept payoff:

- Endings.
- Replay paths.
- Persistent choices.

## Mt. Graphnor MVP Completion

Before expanding the engine or drafting the final adventure setting, finish Mt. Graphnor as a short, playable MVP and reusable Five Room Dungeon template.

The MVP should:

- Replace obvious placeholder passage and ending prose with concise original adventure copy.
- Keep the prose light and functional rather than final; this is still a template and testbed, not the finished literary pass.
- Preserve the five-room structure with explicit `room-1` through `room-5` tags.
- Keep each room mechanically distinct: guardian branch, puzzle gate, setback/trap, climax encounter, reward/twist.
- Include victory, failure, retreat, and cliffhanger endings.
- Document through data and tests what each room demonstrates.
- Stay SRD-safe and avoid protected gamebook text, maps, trade dress, named encounters, or setting detail.

Completion tests should assert:

- Every room tag from `room-1` through `room-5` appears in the adventure.
- The expected template passages exist for entrance, puzzle, trap, climax, reward, and endings.
- The content no longer contains obvious placeholder or prototype-only body text.
- The ending set covers victory, failure, retreat, and cliffhanger.
- The graph still validates and every ending remains reachable.

The reusable template contract lives in `src/gamebook/content/five-room-template.ts`, with a prose-facing explanation in `book/gamebook-template.md`.

## Suggested Source Shape

Use this future structure:

```text
src/gamebook/
├── model.ts
├── graph.ts
├── state.ts
├── content/
│   └── mt-graphnor.ts
├── rules/
│   ├── character.ts
│   ├── combat.ts
│   └── dice.ts
└── ui/
```

Suggested responsibilities:

- `model.ts`: `Passage`, `Choice`, `GameState`, `Character`, `Encounter`, `Item`, `Condition`, and `RollResult` types.
- `content/mt-graphnor.ts`: first adventure content.
- `graph.ts`: validation, reachability, and Mermaid export.
- `state.ts`: local-storage document, save, load, reset, export, and import.
- `rules/dice.ts`: dice roller and probability-friendly roll results.
- `rules/character.ts`: ability modifiers, proficiency, and derived stats.
- `rules/combat.ts`: attack, damage, and turn resolution.
- `ui/`: static rendering, controls, character creator, passage view, and state panel.

## Test Plan

### Graph Tests

- Missing target IDs fail validation.
- Unreachable passages are reported.
- Start passage exists.
- Every non-ending passage has choices.
- Every ending is reachable.

### State Tests

- Empty save creates a valid versioned document.
- Save/load preserves current passage, character, flags, inventory, and log.
- Invalid imported JSON is rejected with readable errors.
- Future migration path can upgrade save version.

### Rules Tests

- Ability modifier calculations match SRD expectations.
- d20 checks handle DC, modifiers, advantage, and disadvantage.
- Combat resolves hit, miss, damage, defeat, and retreat.
- Item/flag-gated choices appear only when valid.

### Content Tests

- The prototype has at least one victory ending.
- The prototype has at least one failure ending.
- The prototype has at least one retreat or partial-success ending.
- Each room contributes a mechanic the book can analyse.
- No protected Fighting Fantasy text, maps, encounters, or trade dress are copied.
- SRD-derived mechanics have attribution notes.

## Book Chapter Links

- Passage graph -> chapter 2, **Choose Your Node Adventure**.
- Hypertext rendering -> chapter 3, **Hypertext, HATEOAS, And The Gamebook Page**.
- Character creator -> chapters 4 and 5.
- Dice -> chapter 6.
- Combat -> chapter 7.
- Inventory and flags -> chapter 8.
- Author/debug mode -> chapter 9.
- Modular source shape -> chapter 10.
- SRD data and attribution -> chapter 11.
- Local-storage saves -> chapter 12.
- Adventure authoring -> chapter 13.
- Validation and tests -> chapter 14.

## Narrative Boundary

The gamebook should eventually become its own fantasy narrative, not a thinly disguised explanation of computer science.

For the mechanical prototype:

- Use working names freely.
- Prefer clear mechanical coverage over polished prose.
- Avoid finalising the setting too early.
- Avoid jokes or names that make the adventure feel like a lecture unless they are clearly temporary.
- Record narrative questions for later rather than solving them during mechanics work.

The book can still use allegory through separate dialogues and examples. Those dialogues can explain graphs, state, dice, rules, or permissions, while the playable gamebook remains immersive.

## Assumptions

- The first gamebook should be small, complete, and teachable rather than large.
- The domain modules should stay independent of a particular UI framework.
- SRD 5.1 mechanics can be used with correct attribution, but the adventure prose and setting should be original.
- Fighting Fantasy is an inspiration for form and reader experience, not a source to imitate directly.
- Mechanics come first; final narrative drafting comes after the prototype proves the system.
