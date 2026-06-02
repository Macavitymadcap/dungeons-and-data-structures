# Five Room Gamebook Template

Mt. Graphnor is the first reusable adventure template for the gamebook engine. It should stay small enough to test by hand, but complete enough to exercise the systems that later chapters explain.

The source-level contract lives in `src/gamebook/content/five-room-template.ts`. The current adventure implementation lives in `src/gamebook/content/mt-graphnor.ts`.

## Room Contract

| Room | Role | Required mechanics | Book payoff |
| --- | --- | --- | --- |
| Room 1: Entrance And Guardian | First blocker or threshold challenge | Fight, sneak, parley | Branches, checks, early consequences |
| Room 2: Puzzle Or Roleplaying Challenge | Non-combat obstacle with alternate solutions | Answer, investigate, force or tool route | Flags, gated choices, puzzle state |
| Room 3: Trick Or Setback | Trap or setback that preserves consequences | Save, item solution, damage route | State transitions and damage |
| Room 4: Climax | Final meaningful obstacle | Combat, bypass, retreat | Encounter loop and multiple outcomes |
| Room 5: Reward And Twist | Ending resolver | Reward route and hook route | Endings, replay, persistent rewards |

## MVP Requirements

- Use explicit room tags from `room-1` through `room-5`.
- Include victory, failure, retreat, and cliffhanger endings.
- Keep the graph reachable from the start passage.
- Give every non-ending passage at least one choice.
- Avoid placeholder-only body copy.
- Keep final setting and prose polish separate from mechanics work.

## Reuse Notes

Future adventures can change setting, tone, passage count, and encounters, but should preserve the same mechanical coverage while they are being used as book examples. Once the book has taught the basic engine, later adventures can deliberately break this template.
