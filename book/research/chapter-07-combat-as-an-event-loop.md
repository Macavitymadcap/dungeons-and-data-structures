# Chapter 07: Combat As An Event Loop

## Research Question

How can the chapter teach state machines, event loops, command handling, reducers, and turn-based
state transitions through a small combat encounter?

## Core Concept

Combat is a controlled loop over changing state. Each round accepts an intention, resolves rules,
updates state, records what happened, and decides whether to stop or continue.

For this chapter, the key ideas are:

- **State**: the current facts of the encounter, including player HP, temporary HP, enemy HP,
  defeated status, and round count.
- **Event or command**: the player's chosen action, such as attacking, retreating, or recovering.
- **Reducer-like transition**: a function receives previous state plus an event/result and returns
  next state.
- **State machine**: combat moves between recognisable states such as ready, player action, enemy
  response, victory, defeat, retreat, and continue.
- **Event loop**: the repeated cycle that waits for the next action, processes it to completion, and
  then renders the next available choices.
- **Log**: a human-readable record of the state transitions.

The chapter should keep "event loop" beginner-friendly. The gamebook is not implementing the full
browser event loop. It is using the same general shape: take one event, run the rules, update state,
render the next moment, and wait for another event.

## RPG Or Gamebook Analogy

At the table, combat is a ritualised conversation:

1. The Dungeon Master says what is happening.
2. The player chooses an action.
3. The rules resolve rolls, hit/miss, damage, and consequences.
4. The table records the new state.
5. Someone checks whether the fight is over.
6. If not, the next turn begins.

A gamebook has to turn that conversation into a small machine. The page must remember the current
encounter, offer valid actions, process one action, and then decide whether the reader sees victory,
defeat, retreat, or another combat passage.

## Dialogue Or Interlude Idea

**The Dungeon Master and the Hourglass** argue about whose turn it is.

The Hourglass insists that time should simply flow. The Dungeon Master pauses the room after every
action and says: first we resolve this event, then we update the world, then we ask what can happen
next. Their exchange dramatises run-to-completion processing, state transitions, and why a combat
loop can feel orderly even when the story is chaotic.

## Sources

- JavaScript source: MDN on the JavaScript event loop and run-to-completion execution model:
  <https://developer.mozilla.org/en-US/docs/Web/JavaScript/Event_loop>.
- Reducer source: Redux Fundamentals on actions, state, and reducers:
  <https://redux.js.org/tutorials/fundamentals/part-3-state-actions-reducers>.
- State machine source: David Harel, "Statecharts: A Visual Formalism for Complex Systems",
  *Science of Computer Programming*, 1987:
  <https://www.sciencedirect.com/science/article/pii/0167642387900359>.
- Event sourcing source: Martin Fowler on event sourcing as storing state changes as a sequence of
  events:
  <https://www.martinfowler.com/eaaDev/EventSourcing.html>.
- D&D 5e SRD source: System Reference Document 5.1 under Creative Commons Attribution 4.0
  International, especially combat order, attacks, damage, hit points, and conditions:
  <https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf>.
- Licence source: Creative Commons Attribution 4.0 International legal code:
  <https://creativecommons.org/licenses/by/4.0/legalcode.en>.

## Campaign Ledger Evidence

Campaign Ledger is the mature case study for command-driven resource mutation and sheet refreshes.
It is not a combat engine, which is useful to say plainly. Its value here is that it shows the same
state-transition pattern at product scale.

- `/Users/dank/Code/personal/web/campaign-ledger/src/app.tsx`
  - `PATCH /sheet/:characterRef/resources/:resourceId` accepts a current value or delta, updates a
    resource, reloads the sheet, and returns either the sheet header or the focused tab panel.
  - `POST /sheet/:characterRef/conditions` turns a submitted condition label into a condition
    resource and returns an updated sheet header.
  - `POST /sheet/:characterRef/rests/:restType` validates the rest command, plans resource updates,
    applies each mutation, reloads the sheet, and returns the refreshed workspace.
- `/Users/dank/Code/personal/web/campaign-ledger/src/characters/rests.ts`
  - `planRestResourceUpdates` is a reducer-like planning helper for long-rest recovery.
  - It restores hit points, clears temporary hit points, restores spell slots and feature uses, and
    recovers part of hit dice while leaving short rests explicit for later rules.
- `/Users/dank/Code/personal/web/campaign-ledger/src/db/sqlite.ts`
  - `updateResourceCurrent` clamps resource updates and mirrors hit point or temporary hit point
    resource changes back onto the character row.
  - `upsertConditionResource` creates or reactivates a condition as a character resource.
- `/Users/dank/Code/personal/web/campaign-ledger/src/app.test.tsx`
  - Tests cover condition commands, resource deltas, spell slot spending, long-rest recovery,
    invalid rest commands, invalid tab commands, and refreshed HTMX fragments.
- `/Users/dank/Code/personal/web/campaign-ledger/src/characters/rests.test.ts`
  - Unit tests lock down the long-rest transition plan for hit points, temporary hit points, hit
    dice, spell slots, and feature uses.

Inference from project context: Campaign Ledger shows the grown-up version of the same rule-loop
discipline. Commands should validate input, apply bounded state changes, refresh the representation,
and leave enough evidence for tests and users to trust what changed.

## Gamebook Build Payoff

This chapter explains the current encounter loop for Mt. Graphnor:

- `src/gamebook/model.ts`
  - `Encounter` stores enemy armour class, hit points, and attack profile.
  - `EncounterState` stores current enemy hit points, defeated status, and round count.
  - `CombatRoundResult` records player attack, optional player damage, optional monster attack,
    optional monster damage, player/monster HP, outcome, and log entries.
- `src/gamebook/rules/combat.ts`
  - `resolveCombatRound` runs one complete round: player attack, player damage on hit, early
    victory if the enemy drops, monster attack if needed, monster damage on hit, and final outcome.
  - `applyCombatRound` turns a `CombatRoundResult` into the next `GameState`.
  - The split between resolving and applying gives the chapter a simple reducer-shaped example.
- `src/gamebook/play.ts`
  - `resolveChoice` treats a combat choice as a command.
  - It skips rolls for already-defeated encounters, resolves a round, applies state updates, appends
    combat log entries, and routes to victory, defeat, or continue passages.
- `src/gamebook/content/mt-graphnor.ts`
  - The door guardian and ember statue provide compact encounters with armour class, HP, attack
    bonus, damage dice, and combat choices.
  - Combat passages include continue, defeat, victory, retreat, and recovery routes.
- `src/gamebook/rules/combat.test.ts`
  - Tests cover player victory, miss plus counterattack, player defeat, temporary HP absorbing
    damage, state updates, and round increments.
- `src/app.tsx`, `src/gamebook/render.ts`, and `src/gamebook/player-render.ts`
  - Combat summaries and recent-event logs make the loop visible after each submitted choice.

The build move should explain and, if needed, refine the one-round encounter loop. It should not
pretend the prototype has full initiative, multi-actor queues, reactions, or complex condition
timing yet.

## Notes For The Draft

### Opening Move

Start in the guardian passage after the player chooses "Trade blows with the guardian".

Ask what the program must do before it can show the next page:

- Load the current state.
- Find the encounter.
- Roll the player's attack.
- Apply damage if the attack hits.
- Stop immediately if the enemy is defeated.
- Otherwise roll the enemy attack.
- Apply damage to temporary HP before normal HP.
- Decide victory, defeat, or continue.
- Save the new state and show the result.

That sequence is the event loop in miniature.

### Sections

1. **The Round As A Loop**
   - Introduce loop thinking through combat rounds.
   - A loop is not only `while`; it can also be a repeated request/response cycle.
   - One submitted choice resolves to completion before the next choice is offered.

2. **State: What The Fight Remembers**
   - Player HP and temporary HP.
   - Encounter HP, defeated status, and round count.
   - Current passage and available choices.
   - Recent log entries.

3. **Commands And Events**
   - A combat choice is a command from the player.
   - The result contains events worth logging: hit, miss, damage, defeat.
   - Keep the difference practical rather than doctrinal.

4. **Reducers: Previous State Plus Result Equals Next State**
   - Use `applyCombatRound` as the core example.
   - Show why the calculation is easier to test when the result object is explicit.
   - Compare with Campaign Ledger's `planRestResourceUpdates`.

5. **State Machines: Victory, Defeat, Continue**
   - Draw the encounter states as `ready -> resolving -> victory | defeat | continue`.
   - Keep the first machine small.
   - Mention that full initiative can be modelled later as a queue or a richer state machine.

6. **Run To Completion**
   - Borrow the event-loop idea carefully from JavaScript.
   - One combat submission should not half-apply player damage and then wait in an ambiguous state.
   - The response should represent a complete transition.

7. **Logs As Player Trust**
   - The log turns state transitions into readable story.
   - "Sword hits for 8 slashing damage" is both feedback and debugging evidence.
   - Connect this to Campaign Ledger's visible resource counts and refreshed fragments.

### Diagrams

Use three diagrams:

- **Combat round pipeline**:
  `combat choice -> player attack -> player damage? -> victory? -> monster attack -> monster
  damage? -> outcome`.
- **Reducer split**:
  `GameState + CombatRoundResult -> applyCombatRound -> GameState`.
- **Encounter state machine**:
  `ready -> resolving -> continue -> resolving`, with exits to `victory`, `defeat`, and `retreat`.

### Code Examples

Start with a minimal result type:

```ts
interface CombatRoundResult {
  encounterId: string;
  round: number;
  monsterHitPoints: number;
  playerHitPoints: number;
  outcome: "victory" | "defeat" | "continue";
  log: string[];
}
```

Then show a reducer-shaped state update:

```ts
function applyCombatRound(state: GameState, result: CombatRoundResult): GameState {
  return {
    ...state,
    hitPoints: result.playerHitPoints,
    encounters: {
      ...state.encounters,
      [result.encounterId]: {
        hitPoints: result.monsterHitPoints,
        defeated: result.outcome === "victory",
        rounds: result.round,
      },
    },
  };
}
```

Then show the outcome routing:

```ts
const nextPassageId =
  combat.outcome === "victory"
    ? choice.combat.onVictory
    : combat.outcome === "defeat"
      ? choice.combat.onDefeat
      : choice.combat.onContinue;
```

Useful project snippets:

- `src/gamebook/rules/combat.ts` for the encounter loop.
- `src/gamebook/play.ts` for command handling and outcome routing.
- `src/gamebook/model.ts` for combat result and encounter state types.
- `src/gamebook/content/mt-graphnor.ts` for compact encounters and combat passages.
- `/Users/dank/Code/personal/web/campaign-ledger/src/characters/rests.ts` for command planning and
  resource transitions.
- `/Users/dank/Code/personal/web/campaign-ledger/src/app.tsx` for resource, condition, and rest
  commands returning refreshed representations.

### SRD-Safe Handling

Use SRD-compatible combat concepts as structure: rounds, attacks, armour class, hit points, damage,
conditions, and rests. Paraphrase rules and use small original encounter examples. Avoid copying
class features, monster stat blocks, encounter text, or non-SRD combat options.

The gamebook's door guardian and ember statue remain original teaching encounters. Their mechanics
can be SRD-informed without importing protected monsters or adventure expression.

### Chapter Boundary

Keep the chapter about one combat loop and state transitions. Save probability detail for Chapter
06, inventory/resource accounting for Chapter 08, permissions and author/debug boundaries for
Chapter 09, and full verification strategy for Chapter 14.

Mention initiative queues as future growth, but do not require the prototype to implement full
initiative before the chapter can be drafted.

## Risks

- **Event-loop overclaim**: be clear that the chapter borrows the event-loop shape; it does not
  implement the browser event loop.
- **Combat complexity creep**: avoid adding reactions, multi-monster initiative, conditions timing,
  spell effects, or full SRD tactical combat too early.
- **Reducer jargon**: use reducer language only after the reader sees `state + result -> state`.
- **Hidden state changes**: every HP/resource mutation should be visible in the log, sheet, or
  rendered result.
- **Licence blur**: keep combat examples original and SRD-safe.
