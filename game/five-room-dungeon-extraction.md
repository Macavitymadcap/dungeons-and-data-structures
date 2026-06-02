# Five Room Dungeon Narrative Extraction

Source: `/Users/dank/Downloads/five_room_dungeon.py`

## Feasibility

This is a feasible starting point for the gamebook narrative. The Python already has a clean five-room adventure shape, a comic narrator, a memorable setting in Mt. Bryntor, two combat encounters, a puzzle entrance, inventory rewards, a social gate, and a strong final twist: the treasure is cursed, and greedy adventurers become the next skeletal guardian.

It is not a drop-in replacement for the current Mt. Graphnor prototype because the old script uses a few mechanics the current engine only partly supports. The story can still be represented now by expanding choices into flags and passages, but it would be better with a small mechanics pass before implementation.

## Node Count

This draft uses **55 numbered nodes**.

That count assumes a gamebook-style adaptation where most meaningful choice states become passages. With stronger engine mechanics, it could compress to about **34-38 passages** by using reusable combat actions, class-conditioned text, ordered puzzle state, and a numeric wall attitude score. If implemented in the current engine without numeric variables, the safest version is closer to **50-55 passages**, because `door_rage`, the entrance sequence, combat flee states, and conditional endings need to be represented with flags or explicit branches.

For a larger Fighting-Fantasy-scale version, treat this draft as the source extraction rather than the final adventure shape. Character creation, generic fleeing, and give-up branches should move out of the numbered adventure or be dropped. The five original rooms should become keystone encounters inside a larger dungeon. See `book/five-room-dungeon-400-node-plan.md`.

## Mechanics Needed

The current gamebook engine already supports:

- Passage choices and endings.
- Items and item-gated choices.
- Flags.
- Ability and skill checks.
- Simple combat encounters.
- Healing items as choice effects.

The adaptation would benefit from adding:

- **Ordered puzzle input**: the entrance requires `clouds -> waves -> trees`. This can be done with passages, but a first-class puzzle sequence mechanic would be cleaner.
- **Hidden story variables**: the talking wall uses an internal attitude score, with thresholds for crushed, grudging, friendly, and romance endings. The player should never see this value directly.
- **Class-conditioned prose**: fighter, rogue, and wizard each get different lines in the wall flirtation and sarcophagus inspection.
- **Class and species world interactions**: the larger game should let fighters smash or brace, rogues pick and disarm, wizards read magic and see through illusions, clerics interpret holy signs and ward undead, and species options reveal different routes or clues.
- **Enemy saving throws and spell-like effects**: cleric and wizard options should be able to force creatures, objects, illusions, or curse mechanisms to make saving throws. The original Python omitted this because of implementation experience, not because the game should avoid it.
- **Reusable combat options**: the Python combat loop supports attack, heal, and flee. The current engine has attack rounds and healing as passage choices, but fleeing from a live combat encounter wants a clearer first-class outcome.
- **Combat defeat routing**: the script exits immediately on death. The gamebook should route defeated combat to explicit ending nodes.
- **Cursed reward transformation**: claiming treasure is not ordinary failure; it is a time-loop or role-replacement ending where the player becomes the next skeleton.
- **Conditional epilogue**: leaving the treasure produces either the wall-companion ending or the village-legend ending depending on wall attitude.

## Node Draft

### 1. Well Met, Adventurer

Well met, adventurer. Choose your name and class: fighter, rogue, or wizard.

The narrator greets the player with class-specific banter:

- Fighter: "Stab things and ask questions later."
- Wizard: "When in doubt, set it aflame."
- Rogue: "Sneaking around keeps you alive."

**Mechanics:** Character creation. Use existing class templates where possible. Current source classes are fighter, rogue, and wizard.

**Choices:**

- If ready to face the Five Room Dungeon, turn to 2.
- If not ready, turn to 3.

### 2. Legend Of Mt. Bryntor

Legend tells of a dungeon beneath Mt. Bryntor, said to contain treasures of incalculable wealth. No one has retrieved them. The dungeon is famous for puzzles, traps, monsters, and other alliterative dangers.

You leave town in search of wealth, glory, and, most importantly, the entrance.

**Mechanics:** Prologue. Optional class-coloured sentence based on fighter, rogue, or wizard.

**Choice:** Travel to the mountain, turn to 4.

### 3. Anti-Climax

You decide not to face the dungeon after all.

**Ending:** Failure by refusal.

### 4. The Handleless Door

After miles of treacherous ground, you reach the south side of Mt. Bryntor. A smooth rectangle has been carved into the stone, six feet high and two feet wide. It might be a door, except it has no handle.

**Choices:**

- Investigate the area, turn to 5.
- Go back home, turn to 6.

### 5. The Grey Slab

A patch of lighter stone catches your eye. Three raised buttons sit at its top, each marked with a symbol: trees, waves, and clouds.

Below them is carved: "The world was formed of three parts. Choose the order in which the parts came to be to reveal the entrance."

**Mechanics:** Ordered puzzle. Correct order is clouds, waves, trees.

**Choices:**

- Press clouds, turn to 7.
- Press waves, turn to 10.
- Press trees, turn to 10.

### 6. The First Hurdle

For many a year will tales be told of how you gave up your epic quest at the first hurdle.

**Ending:** Retreat/failure.

### 7. First Button

The raised stone clicks into place. One choice has been accepted.

**Choices:**

- Press waves, turn to 8.
- Press clouds, turn to 10.
- Press trees, turn to 10.

### 8. Second Button

The second stone clicks into place. The would-be door remains still, waiting for the last part of the world's making.

**Choices:**

- Press trees, turn to 9.
- Press clouds, turn to 10.
- Press waves, turn to 10.

### 9. Stone On Stone

The third button sinks into place. You hear stone groaning against stone and see the handleless door slide away, revealing a tunnel down into the mountain.

**Choices:**

- Descend into the dungeon, turn to 11.
- Go back home, turn to 12.

### 10. The Buttons Reset

The door remains shut. The buttons pop back up, resetting the puzzle.

**Choice:** Try the puzzle again, turn to 5.

### 11. Torchlit Descent

You light a torch and enter the tunnel. It slopes down for forty feet before opening into a small chamber. On the south wall is a wooden door. In the middle of the room is a table.

**Choice:** Inspect the chamber, turn to 13.

### 12. Scared By The Door

The tale will say you were brave enough to open the door, but not brave enough to walk through it.

**Ending:** Retreat/failure.

### 13. Knife Room

The wooden door has a brass lock and handle. The table holds a kitchen knife, a brass key, and a glass bottle filled with red liquid.

**Choices:**

- Examine the door, turn to 14.
- Inspect the table, turn to 15.

### 14. The Locked Wooden Door

The door is solid wood. Its brass handle turns, but the lock holds fast. You currently have no means of changing that.

**Choice:** Inspect the table, turn to 15.

### 15. The Animated Knife

As your hand reaches for the table, the kitchen knife springs to life and flies at your face.

**Combat:** Animated Knife. Suggested stats from source: AC 17, HP 12, attack +4, dagger damage 1d4 + 1.

**Choices:**

- Fight the animated knife. On victory, turn to 16. On defeat, turn to 47.
- Flee combat. On success, turn to 48. On failure, continue the combat.
- Use a potion of healing if carried, then continue the combat.

### 16. The Table After The Fight

The knife falls to the ground, no longer animate. The brass key and red bottle remain on the table.

**Mechanics:** Add item `knife-room-key`.

**Choices:**

- Inspect the bottle, turn to 17.
- Go to the door with the key, turn to 19.

### 17. Potion Of Healing

You pick up the bottle. Written on the base are the words: "Potion of Healing."

**Mechanics:** Add item `potion-of-healing`.

**Choices:**

- Put it in your backpack, turn to 18.
- Drink it now, turn to 18.

### 18. Potion Choice Resolved

If you drank the potion, recover hit points. If you packed it away, it may come in handy later.

**Mechanics:** Drinking heals 2d4 + 2, capped at maximum hit points. Packing keeps `potion-of-healing`.

**Choice:** Go to the door, turn to 19.

### 19. The Corridor Beyond

The key fits the lock. The door opens onto a corridor extending at least forty feet.

**Choices:**

- Walk into the corridor, turn to 20.
- Flee the dungeon in terror, turn to 21.

### 20. The Circular Chamber

You walk on until the corridor opens into a circular chamber. A face is carved onto the east wall.

**Choices:**

- Examine the face, turn to 22.
- Pack in and leave the dungeon, turn to 23.

### 21. Fear Gets The Best Of You

You came so far, but fear got the best of you.

**Ending:** Retreat/failure.

### 22. The Sleeping Wall-Face

The face is detailed and expressive: furrowed eyebrows, wrinkles, scars, and a great bushy beard. Its eyes are shut. Its mouth hangs open as if asleep.

**Choices:**

- Shout at the face, turn to 24.
- Poke its eye, turn to 25.
- Caress its cheek, turn to 26.

### 23. Couldn't Face It

In the end you just couldn't face it.

**Ending:** Retreat/failure.

### 24. Wakey Wakey

You bellow at the face. The chamber shakes. Its eyes blink open and it complains that you have been exceptionally rude.

**Mechanics:** Increase `wall-rage` by 2.

**Choices:**

- Apologise, turn to 27.
- Deflect with a bad joke, turn to 28.
- Double down, turn to 29.

### 25. Poking Around

You jab the stone eye. It is surprisingly squishy. The mouth screams, the eyes roll around, and the face asks what in the world you did that for.

**Mechanics:** Increase `wall-rage` by 1.

**Choices:**

- Apologise, turn to 27.
- Deflect with a bad joke, turn to 28.
- Double down, turn to 29.

### 26. The Flirtatious Wall

You gently caress the carved cheek. The face wakes with a flirtatious greeting and class-specific innuendo about your wand, daggers, or sword.

**Choices:**

- Be literal, turn to 30.
- Play along, turn to 31.

### 27. Apology Accepted

You apologise. The face accepts that you have not met many talking walls before.

**Mechanics:** Decrease `wall-rage` by 1.

**Choice:** Continue the conversation, turn to 32.

### 28. Poorly Timed Joke

You try to joke your way out of the situation. The face narrows its eyes and makes it clear the attempt has not helped.

**Mechanics:** Increase `wall-rage` by 1.

**Choice:** Continue the conversation, turn to 32.

### 29. Right Back At You

You double down. The face gives as good as it gets.

**Mechanics:** Increase `wall-rage` by 2.

**Choice:** Continue the conversation, turn to 32.

### 30. Literal-Minded Adventurer

You explain your wand, daggers, or sword with total sincerity. The face goes blank and says, "Oh. Cool."

**Mechanics:** Increase `wall-rage` by 1.

**Choice:** Continue the conversation, turn to 32.

### 31. Can't It Be Both?

You play along and wink. A hint of red crosses the grey stone of the face's cheeks.

**Mechanics:** Set flag `wall-flirted`. Do not increase `wall-rage`.

**Choice:** Continue the conversation, turn to 32.

### 32. What Can I Do You For?

The face says, "Well, you've woken me up. What can I do you for?"

**Choices:**

- State your business, turn to 33.
- Ask about the face, turn to 34.

### 33. Fight, Puzzles, Treasure

You say you are here to fight monsters, solve puzzles, and claim treasure. If you have already annoyed the face, it rolls its eyes and says, "Great, another one."

**Choice:** Answer the morality question, turn to 35.

### 34. The Wall's Story

You ask the wall about itself. It is bashful; no one usually asks. It explains that it was built by the mage who made the dungeon to test the morality of those who enter.

**Mechanics:** Decrease `wall-rage` by 1.

**Choices:**

- If `wall-rage` is 2 or higher, answer the morality question, turn to 35.
- If `wall-rage` is 1 or lower, the wall decides you are a sweetheart and opens the way. Turn to 42.

### 35. The Morality Question

The face asks what you plan to do with the spoils if you escape the dungeon.

**Choices:**

- Help others, turn to 36.
- Go on a bender, turn to 37.
- Admit you do not know, turn to 38.

### 36. A Noble Endeavour

You say you will use the treasure to help your village. The face calls this a noble endeavour.

**Mechanics:** Decrease `wall-rage` by 1.

**Choice:** Receive judgement, turn to 39.

### 37. A Less Noble Endeavour

You announce plans involving shiny rings, mead, and a spectacularly poor life choice. The face sizes you up and says, "I see."

**Mechanics:** Increase `wall-rage` by 1.

**Choice:** Receive judgement, turn to 39.

### 38. Honest Ignorance

You admit you have not thought that far ahead. The face says it can believe that.

**Mechanics:** No attitude change.

**Choice:** Receive judgement, turn to 39.

### 39. The Wall's Judgement

The face weighs your choices.

**Choices:**

- If `wall-rage` is 4 or higher, turn to 40.
- If `wall-rage` is 2 or 3, turn to 41.
- If `wall-rage` is 1 or lower, turn to 42.

### 40. Crushed By The Test

The face refuses to let you continue. The ground shakes, the exit vanishes, and stones fall from the ceiling. The face closes its eyes before you are crushed.

**Ending:** Failure.

### 41. Grudging Passage

The wall decides you are "a bit of a knob", but it has seen worse. A western passage opens.

**Mechanics:** Set flag `wall-grudging`.

**Choices:**

- Sally forth, turn to 43.
- Go back home, turn to 44.

### 42. Warm Passage

The wall judges you mostly honourable and opens the next room. It asks you to be careful, and perhaps to come back and say hello if you survive.

**Mechanics:** Set flag `wall-friendly`.

**Choices:**

- Sally forth, turn to 43.
- Go back home, turn to 44.

### 43. The Sarcophagus Chamber

The passage opens into a large chamber. A stone sarcophagus stands in the centre. On the east wall, a golden door reflects your torchlight.

**Choices:**

- Look at the golden door, turn to 45.
- Examine the sarcophagus, turn to 46.

### 44. Weirded Out

After speaking to a wall, you decide to give up and go home.

**Ending:** Retreat/failure.

### 45. The Golden Door

The golden door has a lock and handle. The handle turns, but the lock holds. You currently have no means of opening it.

**Choice:** Inspect the sarcophagus, turn to 46.

### 46. The Skeletal Challenger

The sarcophagus is covered in sigils and runes. Wizards recognise necromancy and chronomancy.

When you knock, the lid grinds aside. A skeleton steps out with a golden key around its neck and a sword in hand. It says it was once a challenger like you.

**Combat:** Skeleton. Suggested stats from source: AC 13, HP 13, attack +4, shortsword damage 1d6 + 2.

**Choices:**

- Fight the skeleton. On victory, turn to 49. On defeat, turn to 47.
- Look again at the locked door, turn to 45.
- Flee the dungeon, turn to 48.
- Use a potion of healing if carried, then continue the combat.

### 47. Slain In Combat

You are slain by the dungeon's guardian.

**Ending:** Failure.

### 48. Fleeing Combat

You try to escape the fight. If you succeed, you escape the enemy but abandon the quest. If you fail, the enemy attacks and the combat continues.

**Mechanics:** The Python used a d100 flee roll with success above 50. In the gamebook engine this could be a Dexterity check or explicit combat-flee action.

**Ending:** Retreat on success.

### 49. The Golden Key

The skeleton shrieks and crumples, finally dead rather than undead. You take the golden key and open the golden door.

**Mechanics:** Add item `golden-key`; set flag `skeleton-defeated`.

**Choices:**

- Go forth, turn to 50.
- Back out, turn to 51.

### 50. The Treasure Chamber

At the end of the passage, your torch dazzles against heaps of gold, gems, artworks, and other treasures. You have reached the prize.

**Choices:**

- Grab some treasure, turn to 52.
- Leave the dungeon without taking treasure, turn to 53.

### 51. So Close

Having defeated the boss, you give up rather than claim your prize.

**Ending:** Retreat/failure.

### 52. The Cursed Treasure

You load jewels and coins into your backpack until your hands tingle. Flesh peels away from them. You scream, lose even your breath, and fall into darkness.

You wake to stone scraping above you. You lift your head and find yourself in the sarcophagus chamber, beside the golden door, facing a new plucky adventurer.

Now you understand why no one ever comes back from the Five Room Dungeon.

**Mechanics:** Set flag `claimed-cursed-treasure`; transform ending into next skeleton guardian.

**Ending:** Cursed failure/cliffhanger.

### 53. Walking Away

You look over the treasures and realise no amount of gold will fill the void in your life. You turn back through the dungeon.

**Choices:**

- If `wall-friendly` or `wall-flirted` is set and `wall-rage` is 1 or lower, turn to 54.
- Otherwise, turn to 55.

### 54. The Greatest Treasure

You return to the talking wall and talk for what seems an age. You find you have a lot in common. Together, you make something of life in a dark, cruel world.

The wall tells you the treasure was cursed: had you claimed it, you would have become the next skeleton in the sarcophagus.

Years pass. Whenever another adventurer arrives, you hide. Whenever you do, you smile, knowing you found the greatest treasure of all.

**Ending:** Victory, comic romance.

### 55. The Only One To Return

You return to the village. Some call you a fool for leaving the treasure behind. Others find the tale of your exploits amusing.

Forevermore you are known as the only person to come back from the Five Room Dungeon.

**Ending:** Victory.
