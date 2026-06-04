# Chapter 6: Dice, Probability, And Risk

---

> **The Oracle and the Dice**
>
> The Oracle was a small figure seated behind a large table covered in dice of every possible
> shape. Polyhedral solids, perfect spheres, long narrow rods with numbers stamped at each end.
> She was rolling a twenty-sided die, over and over, making small notes after each result.
>
> "I keep rolling low," said the Adventurer, dropping into the chair across from her. "All
> evening. I've missed four times running."
>
> "Is the die unfair?" said the Oracle.
>
> The Adventurer picked it up and inspected it. "Looks fine."
>
> "Then it's fair."
>
> The adventurer screwed their eyes at the die, muttering "Doesn't feel fair.".
>
> The Oracle set down her quill. "A fair die rolls each face with equal chance. It has no memory
> of what it rolled before, and no obligation to produce an average outcome on your behalf in the
> short term. It is fair in the mathematical sense. Quite different from being kind."
>
> "So four misses in a row is just bad luck?"
>
> "Four misses in a row is entirely consistent with a fair die. So are ten misses in a row. So
> is rolling your exact number four times in a row. The die does not know it owes you anything."
>
> "That's horrible," said the Adventurer.
>
> "It's probability," said the Oracle. "The difference is smaller than you'd think."

---

In Chapter 4, we built a `Character`: a structured record with ability scores, a class, a set of
proficiencies, and the pure functions to derive useful numbers from those facts. In Chapter 5,
we added the template and creation system that assembles a starting character from a chosen class
and race. The character exists. The character can try things. What we haven't yet decided is what
happens when they do.

The answer, in almost every RPG system ever designed, involves a die[^1].

This was not always obvious. D&D's earliest ancestor was a miniatures wargame, Gary Gygax and
Jeff Perren's *Chainmail* (1971), that used percentage dice for combat outcomes. When Gygax and
Dave Arneson created *Dungeons & Dragons* in 1974, they imported the polyhedral dice from
*Chainmail* but applied them to individual characters rather than units, and the d20 became the
core resolution mechanic: roll it, add a bonus, compare to a target number.[^2] The system has
had the same underlying shape ever since, surviving four major editions and a 2024 revision.

Not everyone agreed that a single flat die was the right tool. *Fighting Fantasy*, from 1982,
uses 2d6 for combat resolution: both the adventurer and the enemy roll two dice and add their
combat skill, and the higher result wins the exchange. Two dice summed together produce a
bell-curve distribution rather than a flat one, which means extreme outcomes are rarer and
skill differences are more reliably expressed over several rounds. A hero with a high Skill score
will usually beat a weaker opponent, rather than occasionally losing to a lucky roll. Different
games have different answers to the question of how much randomness the dice should introduce,
and the shape of the probability distribution is the primary lever.[^3]

Daggerheart, a 2024 game from Darrington Press, takes a completely different approach. Rather than 
a single d20, players roll two twelve-sided dice of different colours: the Hope die and the Fear 
die. The total still determines success against a difficulty class (the target number the roll 
must meet), but which die is higher determines the *flavour* of that success. Roll higher on Hope 
and the scene tilts in the player's favour; roll higher on Fear and the GM earns a Fear token they 
can spend to drive the story toward trouble, regardless of whether the player succeeded. The 
character model that sits behind this system needs to track not just ability scores and hit points 
but a Hope and Fear economy at the table level: two parallel resource pools that belong partly to 
the player and partly to the GM.[^4]

This chapter is about what happens between the die leaving your hand and the dungeon master
saying "you succeed" or "you fail". It is about the mechanics of uncertainty: what a roll
actually means, how modifiers shape the odds, how advantage and disadvantage bend the
distribution, and why the software should show the player enough of the arithmetic to trust
the result. It is also about how to implement all of this in a way that is testable, which
requires making randomness something the code can control.

---

## A Die Is A Random Variable

A twenty-sided die has twenty faces, numbered one through twenty. If the die is fair, each face
is equally likely on any given roll. The chance of rolling exactly twelve is one in twenty, or
5%. The chance of rolling twelve or higher is nine in twenty, or 45%.

That's all a die is: a uniform distribution over a small set of integers. It is the simplest
possible **random variable**: a quantity whose value is determined by chance, with a known set
of possible outcomes and known probabilities for each.

The word "random" in software can be misleading, because computers are deterministic machines.
What `Math.random()` actually produces is a **pseudo-random** number: a value generated by a
deterministic algorithm designed to produce sequences that are statistically indistinguishable
from true randomness for most purposes.[^5] For a gamebook, this is entirely sufficient.
For cryptography or security, it is not, and you should use a different tool. The gamebook is
not a bank.

Converting a floating-point number in the range `[0, 1)` into a die face is straightforward:

```typescript
type RandomSource = () => number;

function rollDie(sides: number, rng: RandomSource = Math.random): number {
  return Math.floor(rng() * sides) + 1;
}
```

`Math.floor(rng() * 20)` gives an integer from 0 to 19. Adding 1 gives an integer from 1 to 20.
The distribution is uniform: every face is equally likely.

The `RandomSource` parameter is the interesting part. Passing `Math.random` by default means the
function works normally in production. But because the random source is injectable, tests can
pass a deterministic function instead and know exactly what the roll will produce. This is the
right way to handle randomness in testable code: contain it, inject it, and never scatter direct
calls to `Math.random()` through the business logic.

---

## Thresholds, Modifiers, And Risk

A bare die result is rarely what determines success in D&D. What matters is the result
*plus a modifier* compared to a *difficulty class*, or DC.

The pattern is always the same:

1. Roll a d20.
2. Add the relevant modifier (an ability modifier, a skill modifier, or an attack bonus).
3. Compare the total to the DC.
4. If the total meets or exceeds the DC, succeed. Otherwise, fail.

```typescript
const roll = rollDie(20);
const total = roll + modifier;
const success = total >= dc;
```

This is a threshold question. What matters is not the exact total but whether it clears the bar.

The modifier is where a character's competence enters the picture. A character with a Strength
modifier of +3 attempting a DC 15 Athletics check needs to roll 12 or higher on the die, which
happens 45% of the time. A weaker character with a modifier of –1 needs to roll 16 or higher,
which happens only 25% of the time. The die is the same; the character is not.

That 20-percentage-point difference is meaningful. It is also specific. When the modifier is
known and the DC is known, the probability of success is a precise number: the fraction of the
twenty die faces that produce a winning total.[^6] There is no mystery here, only arithmetic.

---

## Uniform Does Not Mean Kind

A d20's probability is *uniform*: every face is equally likely, and each face represents a 5%
swing in any threshold comparison. This is a volatile distribution in practice. The distance
between a roll of 1 and a roll of 20 is 19, and every position in between is equally reachable.

The reason is not the mathematics. The reason is context. A missed roll during a casual
exploration check is forgettable. The same roll to hold a bridge against a charging troll, with
the rest of the party trapped on the wrong side, is a story beat. The die doesn't know the
difference. The player does. That gap between statistical frequency and emotional weight is one
of the most studied phenomena in game design, and it has no clean solution.[^7]

What a software implementation *can* do is make the arithmetic visible. If a player misses a DC
15 check with a total of 13, they should be able to see that they rolled an 11 and added a +2
modifier. The miss feels different, and more honest, when the player can see it was close rather
than catastrophic.

This is one argument for keeping roll results as structured data rather than resolving them into
bare strings. A result that shows the raw roll, the modifier, and the total is a record the
player can read, trust, and occasionally argue with. A bare "you failed" is just a verdict.

---

## The Roll Result

The gamebook represents a d20 check as a structured object:

```typescript
interface RollResult {
  notation: string;
  rolls: number[];
  kept: number;
  modifier: number;
  total: number;
  dc?: number;
  success?: boolean;
  mode: RollMode;
  reason?: string;
}

type RollMode = "normal" | "advantage" | "disadvantage";
```

`notation` is a human-readable label: `"1d20+3"` or `"2d20kh1+3"` (two d20s, keep highest, plus
three). `rolls` holds every die that was rolled. `kept` is the die that actually counted. The
rest follows: modifier, total, DC if there is one, success or failure, and a human-readable
reason explaining what the check was for.

This structure means a roll is a complete account of what happened. It can be rendered for the
player, logged for debugging, and tested against known inputs. The function that produces it:

```typescript
function rollD20Check({
  modifier,
  dc,
  mode = "normal",
  reason,
  rng = Math.random,
}: {
  modifier: number;
  dc?: number;
  mode?: RollMode;
  reason?: string;
  rng?: RandomSource;
}): RollResult {
  const rollA = rollDie(20, rng);
  const rollB = mode !== "normal" ? rollDie(20, rng) : undefined;

  const rolls = rollB !== undefined ? [rollA, rollB] : [rollA];

  let kept: number;
  if (mode === "advantage") {
    kept = Math.max(rollA, rollB!);
  } else if (mode === "disadvantage") {
    kept = Math.min(rollA, rollB!);
  } else {
    kept = rollA;
  }

  const total = kept + modifier;
  const success = dc !== undefined ? total >= dc : undefined;

  const modeCode = mode === "advantage" ? "kh" : "kl";
  const modifierStr = modifier >= 0 ? `+${modifier}` : `${modifier}`;
  const notation =
    mode !== "normal"
      ? `2d20${modeCode}1${modifierStr}`
      : `1d20${modifierStr}`;

  return { notation, rolls, kept, modifier, total, dc, success, mode, reason };
}
```

Every call to `rollD20Check` takes the same injectable `rng` parameter that `rollDie` does.
Tests can pass a known sequence of values and verify exact behaviour without fighting the
randomness.

---

## Expected Value And Swinginess

**Expected value** is the long-run average outcome of a repeated experiment. For a fair d20,
the expected value is `(1 + 2 + ... + 20) / 20 = 10.5`. This is a precise and useful number
that also describes no actual roll, because no die face shows 10.5.

Expected value matters for game balance and mechanical design. If a typical first-level character
attempting a typical first-level challenge has a 60% chance of success, the designer has made a
deliberate choice about how often early encounters should go well. If most choices in a gamebook
have a higher chance of success than failure, the game will tend to feel accessible. If the
threshold is pushed the other way, it will feel brutal. Expected value is the lever.

But expected value says nothing about what happens *on a specific roll*. A 60% success chance
means that over many rolls, roughly 60% will succeed. It does not mean that six out of the next
ten rolls will succeed, and it emphatically does not mean that after five successes a failure
is due. Dice have no memory. The probability of success on roll eleven is exactly what it was
on roll one.

This is worth stating plainly because the belief that outcomes "even out" in the short term,
sometimes called the gambler's fallacy, is surprisingly persistent even among people who know
it is wrong. The dice are not keeping score.[^8]

**Variance** is the more useful concept for understanding swinginess. A flat d20 has high
variance: the distance between a roll of 1 and a roll of 20 is 19, and every position in
between is equally reachable. A pool of several dice summed together has lower variance: the
extremes become rarer because producing a very high or very low total requires all dice to agree.
The most common totals cluster in the middle.

This is why different dice systems feel different at the table. A flat d20 creates big swings:
a competent character can still fumble badly, and a novice can sometimes pull off remarkable
feats. Rolled pools compress the extremes, making outcomes more predictable and skill
differentials more reliable. Neither approach is better; they are different relationships between
skill, luck, and narrative tension.

---

## Advantage And Disadvantage

D&D's advantage and disadvantage rules are an elegant solution to a mechanical problem. Rather
than stacking numerical bonuses and penalties, the system changes the shape of the probability
distribution by changing how many dice are rolled.

**Advantage** means rolling two d20s and keeping the higher result. **Disadvantage** means
rolling two d20s and keeping the lower result.

The shift this creates is significant but not uniform. The probability of rolling 15 or higher
on a normal d20 is 30%. With advantage, it becomes roughly 51%: the chance of failing twice in
a row is 70% × 70% = 49%, so success rises to 51%. With disadvantage, the chance of *succeeding*
on both rolls is 30% × 30% = 9%, so the effective success rate drops to 9%.

The effect is largest in the middle of the range and smallest at the extremes. If you're trying
to roll a 1 or higher (certain success normally), advantage doesn't help. If you're trying to
roll a 20 exactly (5% normally), advantage nearly doubles that to roughly 10%. The middle cases,
the DC 10 and DC 15 checks where a point or two genuinely matters, are where advantage and
disadvantage exert the most influence.[^9]

The implementation in `rollD20Check` handles this with the `mode` parameter. Normal mode rolls
once; advantage and disadvantage both roll twice and keep accordingly. The `rolls` array records
both dice, so the player can see what the unchosen die showed.

---

## Damage Rolls

Attack rolls are d20 checks against armour class. Damage rolls are a separate kind of roll:
not a threshold comparison, but a quantity. When a fighter hits with a longsword, they roll a
single eight-sided die for the weapon and add their Strength modifier. The result is how many
hit points the target loses.

A damage roll has no identity of its own. It is defined entirely by its parts: how many dice,
of what size, with what bonus, dealing what kind of harm. A thing defined wholly by its
attributes is a **value object**, a small bundle of data that can be copied, compared, and
replaced without ceremony. The gamebook describes one as a `DamageExpression`:

```typescript
type DamageType =
  | "bludgeoning"
  | "piercing"
  | "slashing"
  | "fire"
  | "cold"
  | "lightning"
  | "hit points";

interface DamageExpression {
  count: number;
  sides: number;
  modifier: number;
  type: DamageType;
}
```

A longsword swing from a Strength +3 fighter is `{ count: 1, sides: 8, modifier: 3, type:
"slashing" }`: one eight-sided die, a flat +3, dealing slashing damage. The familiar dice
notation `1d8+3` is a human-readable label derived from this object, not the object itself.
Keeping the structured form as the source of truth means nothing ever has to parse a string to
discover how many dice to roll or what kind of damage they deal.

```typescript
interface DamageRollResult {
  notation: string;
  rolls: number[];
  modifier: number;
  total: number;
}

function formatDamage(expr: DamageExpression): string {
  const dice = `${expr.count}d${expr.sides}`;
  if (expr.modifier === 0) return dice;
  return expr.modifier > 0 ? `${dice}+${expr.modifier}` : `${dice}${expr.modifier}`;
}

function rollDamage(
  expr: DamageExpression,
  rng: RandomSource = Math.random
): DamageRollResult {
  // Array.from with a length and a mapping function creates an array of `expr.count` items,
  // each produced by calling the function once. It is the standard way to roll a pool of dice.
  const rolls = Array.from({ length: expr.count }, () => rollDie(expr.sides, rng));
  const total = rolls.reduce((sum, die) => sum + die, 0) + expr.modifier;

  return { notation: formatDamage(expr), rolls, modifier: expr.modifier, total };
}
```

The `DamageExpression` is the structured description; `formatDamage` turns it into the `1d8+3`
label for display and logging; `rollDamage` rolls it and returns a `DamageRollResult`. Because
the notation is generated from the object, the two can never disagree.

---

## Making Randomness Testable

There is a recurring tension in software that involves randomness: the same property that makes
a die interesting in play, its unpredictability, makes it difficult to test in code. A test that
calls `rollD20Check` with real `Math.random()` will produce a different result each time. You
can't assert that the total was 15 if you don't know what the die rolled.

The solution is the injectable `RandomSource` pattern used throughout this chapter. The
production code passes `Math.random` by default; tests pass a controlled function instead.

```typescript
// A deterministic rng that always returns 0.7, producing a roll of 15 on a d20
const mockRng = () => 0.7;

const result = rollD20Check({
  modifier: 3,
  dc: 15,
  rng: mockRng,
});

// result.rolls is [15], result.total is 18, result.success is true
```

This approach is simple, explicit, and requires no test framework magic. The random source is
a parameter, and parameters can be controlled. The function is pure: given the same inputs, it
produces the same output. That is all testability requires.

The tests in `src/gamebook/rules/dice.test.ts` use this pattern throughout. Each test case
provides a known sequence of values and verifies the exact result. A test for disadvantage
provides two values and verifies that the lower is kept. A test for a critical DC comparison
provides a value that produces exactly the difficulty class and verifies that `success` is
`true`.

---

## Skill Checks In The Gamebook

When a player chooses an option that triggers a skill check, the gamebook resolves a
`RollResult` and uses it to determine which passage to navigate to:

```typescript
const result = rollD20Check({
  modifier: skillModifier(character, check.ability, check.skill),
  dc: check.dc,
  mode: check.mode ?? "normal",
  reason: check.reason,
  rng,
});

const targetId = result.success ? check.onSuccess : check.onFailure;
```

The `skillModifier` function from Chapter 4 computes the total modifier: the ability modifier
for the relevant ability, plus the proficiency bonus if the character is proficient in the skill.
That number goes into the check, the check produces a `RollResult`, and the result determines
the next passage.

The `RollResult` is also stored in the game log, where it is rendered with enough detail for the
player to follow the arithmetic: "Stealth check: rolled 9, +4 Dexterity (Stealth), total 13
against DC 12. Success." The player can see the story of the roll, not only its outcome.

---

## The Build Move

By the end of this chapter, the gamebook has a working dice layer:

- `RandomSource` is a type alias for `() => number`, injectable everywhere a random value is
  needed.
- `rollDie(sides, rng)` rolls a single die of any denomination.
- `RollMode` is a union type: `"normal" | "advantage" | "disadvantage"`.
- `RollResult` is the structured record of a completed d20 check: all dice rolled, the die that
  counted, the modifier, the total, the DC if there was one, the success flag, the mode, and a
  human-readable reason.
- `rollD20Check(options)` produces a `RollResult` from a modifier, an optional DC, an optional
  mode, and an injectable random source. The `notation` field uses standard dice notation:
  `1d20+3` for a normal check, `2d20kh1+3` for advantage (two d20s, keep highest), and
  `2d20kl1+3` for disadvantage (two d20s, keep lowest).
- `DamageType` is a union of the damage categories the gamebook uses, including `"slashing"`,
  `"bludgeoning"`, and `"hit points"` for hit dice.
- `DamageExpression` is the value object describing a damage roll: a dice `count`, the number
  of `sides`, a flat `modifier`, and a damage `type`.
- `formatDamage(expr)` renders a `DamageExpression` as its human-readable label (`"1d8+3"`).
- `DamageRollResult` records the notation, the individual dice rolled, the modifier, and the total.
- `rollDamage(expr, rng)` rolls a `DamageExpression` and returns a `DamageRollResult`.

These live in `src/gamebook/rules/dice.ts`. The choice resolution in `src/gamebook/play.ts`
calls `rollD20Check` to resolve any choice that carries a check. The combat loop in Chapter 7
will use both `rollD20Check` for attack rolls and `rollDamage` for damage.

---

The die is a simple object. Twenty faces, equal probability, no memory, no mercy. What turns
it from a physical curiosity into a meaningful game mechanic is the rest of the system: the
modifier that reflects who you are, the DC that reflects what you're attempting, the advantage
that reflects good circumstances, and the log that reflects what actually happened.

The Oracle was right that a fair die is different from a kind one. But she was also right that
the difference is smaller than it looks. The die isn't kind, but the software around it can be
honest: here is the roll, here is the modifier, here is why you failed, here is how close it
was. That honesty doesn't change the outcome. It just lets the player be there for it.

Probability doesn't care about your story. The gamebook does. Making the arithmetic visible is
how the two things coexist.

In the next chapter, we'll put the dice to work. Characters have modifiers; enemies have armour
class and hit points; the gamebook has encounters. Combat is a loop that runs until someone
wins, loses, or runs. That loop is the subject of Chapter 7.

---

[^1]: The singular is *die* and the plural is *dice*. Easy way to remember it: unless you have passengers, you die alone.

[^2]: *Chainmail* (1971) by Gary Gygax and Jeff Perren was a medieval miniatures wargame published
by Guidon Games. Its "Fantasy Supplement" chapter introduced monsters, heroes, and spells,
and it used the same dice. *Dungeons & Dragons* (1974), co-designed by Gygax and Dave Arneson
and published by TSR, drew directly from *Chainmail* while shifting focus to individual character
adventure. The d20 as the universal resolution mechanic was present from the beginning, though
early editions also used percentile dice and other rolls extensively. The consolidated "d20
System" that most players now associate with D&D was formalised in the Third Edition (2000).

[^3]: The *Fighting Fantasy* series uses a 2d6 system for combat: both sides roll two dice and
add their combat value, and the higher result wins the exchange. The bell-curve distribution
means that skill differences express themselves reliably over several rounds, rather than being
regularly wiped out by a single lucky or unlucky result. D&D's d20 is more swingy by design,
which makes it feel more dramatic and more occasionally outrageous, depending on when you ask.

[^4]: *Daggerheart* was designed by Spenser Starke and Rowan Hall and published by Darrington
Press in 2024. The Hope/Fear system was one of the more discussed design decisions during the
game's open beta: early versions separated the dice more sharply, and the final design was
refined in response to playtest feedback about the interaction between the two dice. The result
is a check mechanic that produces a total, a binary success/failure, and a narrative register
all at once: three outputs from two dice.

[^5]: The algorithm underlying `Math.random()` is not specified by the JavaScript standard and
varies between engines. V8, which powers both Chrome and Bun, uses xorshift128+, which has good
statistical properties for games and simulations but is not cryptographically secure. The
important practical point is that it is fast, uniform over `[0, 1)`, and entirely sufficient for
determining whether a goblin hits. Do not use it for passwords, tokens, or anything an adversary
might try to predict.

[^6]: The general formula is: if your modifier is `m` and the DC is `d`, then the probability
of success is `max(0, min(20, 21 + m - d)) / 20`. A modifier of +3 against DC 15 gives
`max(0, min(20, 21 + 3 - 15)) / 20 = 9/20 = 45%`. At the edges, natural 1s don't
automatically fail ability checks in SRD 5.1 (only attack rolls), and natural 20s don't
automatically succeed, so the formula is fully correct for most checks in the gamebook.

[^7]: This is the subject of an entire literature in game studies. Jesse Schell's *The Art of
Game Design* has a useful treatment of risk, reward, and the emotional geometry of chance.
Elias, Garfield, and Gutschera's *Characteristics of Games* approaches it more analytically.
Neither resolves the tension, because the tension is a feature: a game where outcomes were
fully predictable would not be interesting.

[^8]: The gambler's fallacy is the belief that a random process is somehow "due" a result it
hasn't produced recently. It arises from a genuine statistical truth: in the long run,
outcomes do approach their expected frequencies. The fallacy is the misunderstanding
of what "the long run" means and how quickly it arrives. Dice rolls are independent. The die
that rolled poorly in the last combat has no obligation to perform better in this one. Telling
it so, while emotionally satisfying, has not been shown to be effective.

[^9]: The exact probabilities for advantage and disadvantage can be worked out from first
principles. For a roll of at least `k` with advantage, the probability is
`1 - ((k - 1) / 20)^2`, because you need *both* dice to fail. For disadvantage, it's
`((21 - k) / 20)^2`, because you need both dice to succeed. The effect is largest around the
midpoint of the range, where `k` is near 10 or 11, and smallest near the extremes, where one
outcome is already near-certain or near-impossible.