# Chapter 7: Combat As An Event Loop

---

> **The Dungeon Master and the Hourglass**
>
> The Hourglass had been standing at the back of the room, and now it spoke.
>
> "You're doing it wrong," said the Hourglass.
>
> The Dungeon Master turned. Around the table, the fight had descended into pleasant chaos: a
> player was mid-gesture demonstrating how her character would sweep the goblin's legs, two
> others were arguing about who had gone last, and the fourth had wandered off to find crisps
> and had not returned.
>
> "Time," said the Hourglass, "moves through events, not through people shouting."
>
> "Yes," said the Dungeon Master, "but..."
>
> "One event. Resolved completely. Then the next. Nothing overlaps. Nothing is left half done.
> Petra declares her action. The action resolves. We learn the outcome. *Then* it is Rowan's
> turn."
>
> "That's exactly what I've been..."
>
> "The goblin is currently mid-swing, mid-fall, mid-shout, and mid-negotiation simultaneously.
> This is not a coherent state."
>
> The Dungeon Master looked at the table. The goblin miniature had, through incremental
> repositioning during the argument, ended up somehow behind the cart it had been standing in
> front of.
>
> "Right," said the Dungeon Master. "From the top. One at a time."
>
> "Thank you," said the Hourglass, and turned itself over.

---

In Chapter 6, we gave the character a way to fail: a d20, a modifier, a difficulty class, and
a structured result that records everything that happened between the die leaving the hand and
the outcome being known. The dice exist. The characters can attempt things. What we haven't
yet built is the machine that runs when two characters meet and one of them is hostile.

This chapter builds that machine. Combat in D&D is a turn-based loop: a sequence of actions,
each resolved completely before the next begins, operating on a shared state that both sides
can see. It is, in software terms, an **event loop**: a pattern that appears everywhere from
browser rendering to network servers, and which the tabletop combat round makes unusually
visible because the players have to sit through it one turn at a time.

---

## Combat Across Systems

Before building anything, it is worth noticing how many different answers the question "how
does fighting work?" has produced.

*Fighting Fantasy* resolves combat in a single step per round: both sides roll 2d6 and add
their combat value, and the higher total wins the exchange. The loser takes a fixed two points
of Stamina damage. There is no separate hit roll and damage roll; the whole thing collapses
into one comparison. The loop is tight: roll, compare, subtract, check for zero, repeat.
The simplicity is a feature: solo gamebooks need combat that moves quickly because the player
is doing everything themselves.[^1]

D&D separates the question into two parts. First, does the attack land? Roll a d20 and add
an attack bonus; if the total meets or beats the target's armour class, the attack hits.
Then, if it hit, how much damage? Roll the appropriate dice and add the relevant modifier.
The separation creates more texture: a hit for maximum damage feels different from a hit for
minimum, and a miss is clearly a miss rather than a weak hit. It also creates more computation,
which at the table is spread across multiple players and the dungeon master. In software, that
computation can run instantly, but the structure still matters because it determines what
information a log entry should contain.[^2]

Daggerheart handles combat through the same Hope/Fear dual-die system it uses for everything
else. A player attacking rolls their Hope and Fear dice; the total determines whether the
attack succeeds against the target's difficulty, and which die was higher determines the
narrative flavour of the result. The GM, meanwhile, has a pool of Fear tokens to spend on
monster actions and complications, which means the GM never rolls dice: their resource is
earned through player rolls and spent on threats, not resolved through their own d20 results.
The asymmetry is deliberate: it puts narrative control in the GM's hands while keeping
mechanical resolution in the players'.[^3]

The gamebook's combat sits closer to D&D than to the others: a separate attack roll against
armour class, a separate damage roll, and a loop that continues until one side is defeated or
the player retreats. The specific types this chapter introduces will reflect that structure.

---

## What Is An Event Loop?

The term **event loop** comes from how programs handle asynchrony: rather than blocking and
waiting whenever something slow might happen, a program processes one event to completion,
then takes the next from a queue, then the next. The browser's event loop works this way:
a click handler runs to completion before anything else can interrupt it, which is why
JavaScript is described as single-threaded.[^4]

The D&D combat round is an event loop in the same sense, just running at human speed with
physical tokens. Each participant in the encounter takes a turn. Within a turn, the player
declares an action, the rules resolve it, the state updates, and the table moves on. Nothing
interrupts mid-resolution. The goblin's sword swing does not pause halfway through while
another player's fireball lands. Each event runs to completion.

The gamebook's combat is simpler than a full multi-participant encounter, but the shape is
the same. When a player submits a combat action, the server processes the full round:
player attack, possible player damage, possible enemy attack, possible enemy damage, and outcome
determination. It then returns the new state. The player never sees the game mid-round. They
see the state before their action, and then the state after it. One event, resolved
completely, then the next.

This is run-to-completion processing, and it is the right choice for a server-rendered
gamebook. The alternative, streaming partial updates as each step resolves, would be more
technically interesting and considerably more confusing to play.

---

## State: What The Fight Remembers

Before the first attack roll is made, the gamebook needs to know what it is keeping track of.
A combat encounter has state on both sides of the fight.

The enemy's state is straightforward: its current hit points, whether it has been defeated,
and how many rounds the fight has lasted.

```typescript
interface EncounterState {
  hitPoints: number;
  defeated: boolean;
  rounds: number;
}
```

The player's relevant state already lives in `GameState` from Chapter 4: `hitPoints` and
`temporaryHitPoints`. Temporary hit points act as a buffer: incoming damage depletes them
first, and only when they are exhausted does normal hit point damage begin.

The encounter definition, the enemy's statistics, lives in the adventure content rather
than in the save state. It is authored data, not mutable play state. **Armour class** is the
threshold an attack roll must meet or beat to land: higher means harder to hit.

```typescript
interface Encounter {
  id: string;
  name: string;
  armourClass: number;
  hitPoints: number;
  attack: AttackProfile;
}
```

The separation matters. When a player's save is loaded, the encounter's starting statistics
come from the adventure definition, but the current hit points come from the save. This means
the enemy can be made harder or easier by editing the adventure without breaking existing saves,
as long as the save is treated as a record of *what has changed*, not a snapshot of the whole
encounter definition.[^5]

---

## The Combat Round

A single round of combat is a pure function from the current state and a random source to
a result that describes everything that happened:

```typescript
interface CombatRoundResult {
  encounterId: string;
  round: number;
  playerAttackRoll: RollResult;
  playerDamage?: DamageRollResult;
  monsterAttackRoll?: RollResult;
  monsterDamage?: DamageRollResult;
  monsterHitPoints: number;
  playerHitPoints: number;
  playerTemporaryHitPoints: number;
  outcome: "victory" | "defeat" | "continue";
  log: string[];
}
```

Every field is either an input-derived value or a structured record of a roll from Chapter 6.
Nothing in `CombatRoundResult` is opaque: a caller can inspect every die result, every
damage total, every hit-point change, and the final outcome.

The function that produces this result is `resolveCombatRound`. The full listing is shown
here because understanding the shape of the whole thing is the point: one round, two attacks,
three possible outcomes, no hidden state. The simplicity is intentional, and the chapter's
later section on what the gamebook deliberately omits will explain what was left out and why.

```typescript
function resolveCombatRound({
  encounter,
  state,
  rng,
}: {
  encounter: Encounter;
  state: GameState;
  rng: RandomSource;
}): CombatRoundResult {
  const encounterState = state.encounters[encounter.id];
  const round = (encounterState?.rounds ?? 0) + 1;
  const log: string[] = [];

  // Player attacks
  const playerAttack = rollD20Check({
    modifier: state.character.attack.attackBonus,
    dc: encounter.armourClass,
    reason: state.character.attack.name,
    rng,
  });

  let monsterHitPoints = encounterState?.hitPoints ?? encounter.hitPoints;

  if (playerAttack.success) {
    const playerDamage = rollDamage(state.character.attack.damage, rng);
    monsterHitPoints = Math.max(0, monsterHitPoints - playerDamage.total);
    log.push(
      `${state.character.attack.name} hits ${encounter.name} for ${playerDamage.total} ${state.character.attack.damage.type} damage.`
    );

    if (monsterHitPoints === 0) {
      log.push(`${encounter.name} is defeated.`);
      return {
        encounterId: encounter.id,
        round,
        playerAttack,
        playerDamage,
        monsterHitPoints: 0,
        playerHitPoints: state.hitPoints,
        outcome: "victory",
        log,
      };
    }
  } else {
    log.push(`${state.character.attack.name} misses ${encounter.name}.`);
  }

  // Monster attacks back
  const monsterAttack = rollD20Check({
    modifier: encounter.attack.attackBonus,
    dc: state.character.armourClass,
    reason: encounter.attack.name,
    rng,
  });

  let playerHitPoints = state.hitPoints;
  let playerTemporaryHitPoints = state.temporaryHitPoints;

  if (monsterAttack.success) {
    const monsterDamage = rollDamage(encounter.attack.damage, rng);
    const absorbed = Math.min(playerTemporaryHitPoints, monsterDamage.total);
    playerTemporaryHitPoints -= absorbed;
    playerHitPoints = Math.max(0, playerHitPoints - (monsterDamage.total - absorbed));
    log.push(`${encounter.attack.name} hits for ${monsterDamage.total} ${encounter.attack.damage.type} damage.`);

    if (playerHitPoints === 0) {
      log.push(`${state.character.name} falls.`);
      return {
        encounterId: encounter.id,
        round,
        playerAttack,
        monsterAttack,
        monsterDamage,
        monsterHitPoints,
        playerHitPoints: 0,
        playerTemporaryHitPoints: 0,
        outcome: "defeat",
        log,
      };
    }
  } else {
    log.push(`${encounter.attack.name} misses.`);
  }

  return {
    encounterId: encounter.id,
    round,
    playerAttack,
    monsterAttack,
    monsterHitPoints,
    playerHitPoints,
    playerTemporaryHitPoints,
    outcome: "continue",
    log,
  };
}
```

The early return after a killing blow avoids the slightly absurd situation of a dead enemy
attacking back. Everything else flows to a `"continue"` result if neither side is down.

---

## Reducers: State Plus Result Equals Next State

`resolveCombatRound` produces a `CombatRoundResult`. That result then needs to be applied to
the game state to produce the next game state. These are two separate steps on purpose.

The separation follows a pattern common in functional programming and state-management
libraries: a **reducer** takes previous state and an event (or result), and returns the next
state. The calculation is separate from the storage. This makes both parts easier to test:
`resolveCombatRound` can be tested with a known random source and known inputs to verify
that rolls and damage are computed correctly; `applyCombatRound` can be tested with a known
`CombatRoundResult` to verify that state transitions happen correctly, without needing any
randomness at all.

```typescript
function applyCombatRound(
  state: GameState,
  result: CombatRoundResult
): GameState {
  return {
    ...state,
    hitPoints: result.playerHitPoints,
    temporaryHitPoints: result.playerTemporaryHitPoints,
    encounters: {
      ...state.encounters,
      [result.encounterId]: {
        hitPoints: result.monsterHitPoints,
        defeated: result.outcome === "victory",
        rounds: result.round,
      },
    },
    log: [
      ...state.log,
      ...result.log,
    ],
  };
}
```

`applyCombatRound` does no calculation. It receives a result, spreads the unchanged state,
and overwrites exactly the fields that changed: the player's hit points, the encounter's
current state, and the log. Spread syntax keeps everything else intact.[^6]

Together, `resolveCombatRound` and `applyCombatRound` form the full round-processing
pipeline: compute the result, then apply it.

---

## State Machines: The Shape Of A Fight

The possible states of an encounter form a small **state machine**: a finite set of
configurations and the transitions between them.

```
ready → resolving → continue → resolving → ...
                  ↘ victory
                  ↘ defeat
                  ↘ retreat
```

An encounter starts as `ready` (the player hasn't engaged yet). Once the first combat choice
is submitted, it enters `resolving`. After each round it transitions to `continue` (more
fighting needed), `victory` (the enemy is defeated), `defeat` (the player is down), or
`retreat` (the player chose to withdraw before the round resolved).

In the gamebook, these states are not stored as an explicit enum. They are implicit in the
combination of `EncounterState.defeated`, `GameState.hitPoints`, and the outcome field on
`CombatRoundResult`. A future version of the code could make the state machine explicit: a
named `CombatStatus` type that the rest of the code dispatches on. For a first combat
loop the implicit version is easier to reason about.[^7]

The passages in the adventure handle routing. A combat choice in Mt. Graphnor looks roughly
like this:

```typescript
{
  id: "fight-guardian",
  text: "Draw your weapon and fight.",
  combat: {
    encounterId: "guardian",
    onVictory: "passage-after-victory",
    onDefeat: "defeat-ending",
    onContinue: "fight-guardian",
  },
}
```

`onContinue` points back to the same passage, creating the loop: the player submits the
combat action, the round resolves, and if the fight continues, the next passage is the same
combat passage again with an updated encounter state. The loop is in the data, not the code.

---

## What The Gamebook Deliberately Omits

The structure above handles the D&D-adjacent case well, but it is worth noting what it
deliberately omits.

Full D&D combat has initiative: at the start of an encounter, every participant rolls a d20
and adds their Dexterity modifier, and the resulting order determines who acts when. The
gamebook skips this, for the same reason the gamebook skips multi-monster encounters,
reactions, opportunity attacks, and action economy: each of these is a real feature of
tabletop combat, and each one adds complexity that the beginner implementation does not yet
need. The `rounds` counter in `EncounterState` exists as a hook for future development:
if a later design requires initiative-ordered turns, that counter becomes the baseline for
tracking where in a full round the encounter sits.[^8]

The Daggerheart approach of making the GM's combat resource a pool rather than a roll
also points at something interesting: the current implementation always gives the monster
a retaliatory attack. In a more sophisticated model, the GM (or the game engine acting as
GM) might choose when to spend Fear tokens on monster actions rather than automatically
retaliating. That would require the combat state machine to grow a "GM resource" dimension,
and the event loop to have a way of deciding whether to spend it. That is a much larger
feature, and it lives in the game design space rather than the software architecture space.
The point is that the architecture chosen here is a particular set of tradeoffs, not the only
possible set.

---

## The Build Move

By the end of this chapter, the gamebook has a working one-round combat system:

- `EncounterState` is the mutable state of a single in-progress fight: the enemy's current
  hit points, whether it has been defeated, and the round count.
- `Encounter` is the authored definition of an enemy: its name, armour class, starting hit
  points, and an `attack: AttackProfile` containing the attack bonus, damage dice, damage
  modifier, damage type, and attack name.
- `CombatRoundResult` is the complete record of one resolved round: both attack rolls (as
  `RollResult` from Chapter 6), both damage rolls (as `DamageRollResult` from Chapter 6),
  the resulting hit point values, the outcome, and a list of human-readable log entries.
- `resolveCombatRound({ encounter, state, rng })` runs a single round to completion and
  returns a `CombatRoundResult`. It uses `rollD20Check` and `rollDamage` from Chapter 6
  for all rolls, and references `state.character.attack` for the player's attack profile.
- `applyCombatRound(state, result)` applies a `CombatRoundResult` to the current `GameState`
  and returns the next `GameState`. It performs no calculation.

These live in `src/gamebook/rules/combat.ts`. Combat choices in Mt. Graphnor use
`encounterId`, `onVictory`, `onDefeat`, and `onContinue` fields to route between passages
based on the round outcome. The choice resolution in `src/gamebook/play.ts` calls
`resolveCombatRound`, then `applyCombatRound`, then uses the outcome to select the next
passage id.

---

The Hourglass was right. One event at a time, resolved completely, then the next. The goblin
behind the cart was the consequence of not following that rule: each incremental adjustment
to its position was coherent in isolation, and the accumulated result was nonsense. Software
combat has the same failure mode. A round that partially applies player damage, then waits
for a user action before applying monster damage, is in an inconsistent state. Something could
go wrong in the gap. The save could be loaded. The browser could close. The goblin ends up
behind the cart.

Running the round to completion before showing the result is not a performance optimisation.
It is a commitment to coherent state.

In the next chapter, we'll step back from the combat loop and look at what the characters are
carrying into it. Inventory, flags, gated choices, and the question of what it means to spend
an item are the subject of Chapter 8.

---

[^1]: *Fighting Fantasy* combat is deliberately minimal because the series was designed to be
played alone, with one hand managing the book and one hand rolling dice. The two-point Stamina
loss on a losing exchange is a fixed cost that keeps the maths simple while ensuring that even
a winning hero takes attrition damage over a long fight. The variant where both sides lose
Stamina on certain results (some later Fighting Fantasy books) adds texture at the cost of
additional table lookup. Joe Dever's *Lone Wolf* system introduced more graduated damage
categories; the *Sorcery!* series kept the core system but added spells as a separate
resource layer.

[^2]: The separation of attack roll from damage roll in D&D goes back to the original 1974
rules, which inherited it from the wargaming tradition of *Chainmail*. The wargame question
"did the hit land?" (attack roll) and "how much did it hurt?" (damage roll) are modelling
different sources of variance: accuracy and impact. Many modern RPGs have collapsed this back
into a single roll; D&D 5e kept both because the separation gives the player more information
about what went wrong on a miss versus a weak hit.

[^3]: The asymmetric GM/player relationship in Daggerheart's combat is a deliberate design
choice that separates narrative authority from mechanical resolution. The GM describes and
threatens but does not roll; the players roll but share the consequences of their Fear results
with the GM. The fear economy means the GM is always building toward something rather than
waiting for a random result to justify monster action. It is a different theory of what
combat is *for* compared to D&D, and the data model it requires (particularly the GM's
Fear pool as a shared table resource) is not easily mapped onto the per-character state
model the gamebook uses.

[^4]: The JavaScript event loop is one of the language's most important and most misunderstood
features. The key insight is that JavaScript is not truly concurrent: only one piece of
synchronous code runs at a time, and that code runs to completion before the event loop can
process anything else. This is why long synchronous operations block the browser. Asynchronous
operations (promises, `setTimeout`, I/O callbacks) register callbacks with the event loop and
return immediately; the callbacks run later, when the current call stack is empty. Philip
Roberts' talk "What the heck is the event loop anyway?" from JSConf EU 2014 remains the
clearest explanation of this for beginners.

[^5]: This separation, authored definition versus mutable save state, is the same pattern
the gamebook uses for the adventure graph itself. Passage content is authored. Which passage
the player is currently in is save state. The rule is: authored data describes what is possible;
save state records what has changed. Mixing the two causes subtle bugs when the adventure is
updated: if the monster's starting hit points were stored in the save, editing the adventure to
make the monster harder would not affect players mid-fight, which might or might not be the
intended behaviour.

[^6]: TypeScript's spread syntax (`{ ...state, newField: value }`) produces a shallow copy of
the object with the specified fields overwritten. It does not mutate the original. For the
gamebook's flat state object, this is safe; for deeply nested state, spread syntax only copies
one level deep and nested objects are still shared references. The gamebook avoids this problem
by keeping `encounters` as a flat `Record<string, EncounterState>` rather than nesting
`EncounterState` inside other mutable objects.

[^7]: The idea of making implicit state machines explicit, naming the states, naming the
transitions, making invalid states unrepresentable, is one of the more powerful tools in the
functional design toolkit. David Khourshid's XState library applies this idea systematically
to JavaScript/TypeScript state management. For a small gamebook combat loop, the overhead is
not worth it; the pattern is worth knowing for when the state machine grows.

[^8]: The full D&D initiative system, rolling Dexterity (Initiative) at the start of combat,
ordering all participants highest to lowest, and cycling through that order until the encounter
ends, is a meaningful game feature that creates suspense and tactical planning. It is also,
for software purposes, a sorted queue that needs to be constructed at the start of combat and
maintained as participants are added, removed, incapacitated, or delayed. Adding it to the
gamebook is a well-defined future extension; omitting it now is a deliberate scope decision
rather than an architectural limitation.