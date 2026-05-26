# Dungeons & Data Structures Book Structure Plan

## Summary

*Dungeons & Data Structures* should be a concept-led, beginner-friendly technical book. Each chapter teaches a computer science or software engineering idea through RPGs, Fighting Fantasy-style gamebooks, D&D 5e SRD mechanics, campaign-ledger lessons, and the planned gamebook implementation.

The gamebook is the running practical thread, but not the table-of-contents spine. Each chapter should end with a build move that advances the gamebook or explains code the reader will later see.

Source material now lives in `docs/published`. These files are seed material, not final chapters. They should be split, researched, rewritten, and SRD-aligned before becoming manuscript chapters.

The companion gamebook now has a concrete planning target: a static TypeScript/HTML adventure prototype set around the working Mt. Graphnor material. The gamebook itself should not be written as a direct computer-science allegory. It should stand as an original fantasy gamebook, while the book uses its mechanics, source code, and selected examples to explain technical concepts.

For now, gamebook planning should focus on mechanics, data contracts, validation, state, and implementation slices. Final narrative writing comes later.

## Current Source Material

- `docs/published/nodes.md` is the strongest first full chapter seed. It already contains the clearest book-shaped material: gamebooks, websites as graphs, graph vocabulary, Five Room Dungeons, and an introductory HTMX gamebook implementation.
- `docs/published/stats.md` and `docs/published/character.md` should be split across separate chapters on data modelling, OOP and composition, and character creation. The current code examples are useful deposits, but the final book should lead with concepts and SRD-safe modelling before deep TypeScript.
- `docs/published/introduction.md` is a short essay introduction. Expand it with the personal reflection from `/Users/dank/Code/personal/scratch.md`.
- `docs/published/conclusion.md` and `docs/published/glossary.md` should be treated as placeholders to revise once the final chapter map settles.

Seed copies have been placed under `book/chapters/seed/` so future manuscript work can proceed without editing the published exports directly.

## Personal Thread

The introduction should preserve and expand the personal story:

- The author did not come from a computer science background.
- The route into programming started from a call-centre job, Google Sheets, and D&D campaign management.
- A spreadsheet limitation led to custom functions and JavaScript tutorials.
- Programming felt like spellcasting: arcane language, mysterious artefacts, and reality altered by careful invocation.
- The journey moved through JavaScript, Python, Bash, Linux, HTML, CSS, and eventually software consultancy.
- The book acts as a dissertation of roughly five years of learning through a nerd-shaped lens.

This personal thread should return lightly throughout the book, especially when discussing campaign-ledger, Hyper-Dank, and the gamebook build.

## Research Programme

Create one research dossier per chapter in `book/research/`. Each dossier should include:

- Research question.
- Core technical concept.
- RPG or gamebook analogy.
- Authoritative sources.
- Campaign-ledger evidence.
- Gamebook implementation angle and the specific `src/gamebook` module it will inform.
- Bibliography entries.
- Open risks or licensing notes.

Use the installed research skills as source lenses:

- `computer-science-research` for graphs, trees, state, search, probability, collections, and algorithms.
- `software-engineering-research` for requirements, roles, testing, architecture, persistence, deployment, maintainability, and refactoring.
- `dnd-5e-srd-research` for SRD 5.1 mechanics, attribution, character creation, combat, conditions, spells, equipment, and stat blocks.
- `fighting-fantasy-gamebook-research` for gamebook form, branching narrative, puzzle gates, paragraph navigation, rights guardrails, and hypertext history.

Research should prioritise:

- Computer science: NIST Dictionary of Algorithms and Data Structures, Open Data Structures, Jeff Erickson's Algorithms, and the existing graph/Five Room Dungeon sources.
- Software engineering: SWEBOK, NASA Systems Engineering Handbook, Fowler's Refactoring Catalogue, and campaign-ledger architecture, docs, and tests.
- D&D: official SRD 5.1 CC BY 4.0 PDF, official SRD resources page, and Creative Commons BY 4.0 licence.
- Gamebooks: official Fighting Fantasy context, The Encyclopedia of Science Fiction, gamebook/puzzle academic sources, and hypertext/HATEOAS/HTMX primary docs where relevant.

### Current Structure Baseline

The architecture checkpoint in `book/architecture-checkpoint-before-further-dossiers.md` confirms
that the current outlined topics are supported by patterns already present in the gamebook/storybook
engine and Campaign Ledger. No planned chapter needs removing.

Use this refreshed structure as the baseline for future dossiers. Each new dossier should name the
relevant gamebook evidence and Campaign Ledger evidence when both apps are relevant, rather than
relying on the older abstract chapter plan.

## Manuscript, Opening Fiction, And Gamebook Integration

The book should use the gamebook as a cumulative worked example. Each chapter should leave behind one of three artefacts:

- **Concept artefact**: a diagram, glossary, or research-backed explanation.
- **Model artefact**: a TypeScript type, schema, content format, or state shape.
- **Playable artefact**: a feature that appears in the gamebook mechanics prototype.

Each chapter should open with a short fictional excerpt before the technical explanation begins.
Prefer one of two forms:

- **Gamebook passage**: a second-person paragraph with two or three choices that embody the chapter's
  problem before the reader sees the code.
- **Table transcript**: a brief D&D-session exchange between the Game Master and players that exposes
  the same tension in play.

These openings should break up the dry material, but they should not become loose skits. Each one
must set up the chapter's core technical question and point naturally into the worked example. The
playable gamebook proper should remain an original adventure whose mechanics the book analyses; the
chapter openings may be allegorical, but the published gamebook should not become a lecture.

Useful recurring voices and roles:

- **The Cartographer and the Adventurer**: graphs, maps, traversal, reachability, paths, and dead ends.
- **The Wizard and the Apprentice**: functions, spells, abstraction, composition, and type systems.
- **The Dungeon Master and the Scribe**: state, rules, source of truth, persistence, and provenance.
- **The Doorkeeper and the Admin**: permissions, roles, capabilities, and access boundaries.
- **The Oracle and the Dice**: probability, uncertainty, risk, and randomness.
- **The Blacksmith and the Quartermaster**: inventory, constraints, resource trade-offs, and collections.

The dossiers should describe the opening as a passage or table transcript. They may name these
characters, but the form should be concrete: what the reader sees first, what the conflict is, and
how it leads into the chapter.

The gamebook implementation should stay framework-light at the domain layer. Treat this source shape as the working architecture:

```text
src/gamebook/
├── model.ts
├── graph.ts
├── state.ts
├── play.ts
├── content/
│   ├── five-room-template.ts
│   └── mt-graphnor.ts
├── rules/
│   ├── character.ts
│   ├── combat.ts
│   ├── dice.ts
│   └── srd.ts
├── render.ts
├── player-render.ts
├── client.ts
├── player-client.ts
└── testing.ts
```

The Hono route shell and author pages currently live in `src/app.tsx`. That is an acceptable
prototype boundary, but chapters on hypermedia, permissions, modules, authoring, and testing should
be honest about the split between framework-light gamebook modules, shared renderers, player-only
bundles, and the app shell.

Chapter prose should introduce these modules gradually. Avoid dropping a finished engine on the reader too early; let the mechanics grow by pressure from the playable requirements.

## Chapter-To-Gamebook Build Map

| Chapter | Opening fiction premise | Gamebook artefact | Main module or file |
| --- | --- | --- | --- |
| Introduction | The Wizard explains why a spreadsheet can become a spellbook | Project promise, original adventure premise, licence/originality boundaries | `book/build-log.md` |
| Choose Your Node Adventure | The Cartographer and the Adventurer argue about whether a room exists before it is reachable | Passage, choice, graph validation, prototype adventure outline | `src/gamebook/model.ts`, `src/gamebook/graph.ts`, `src/gamebook/content/mt-graphnor.ts` |
| Hypertext, HATEOAS, And The Gamebook Page | A door refuses to say where it leads until the Adventurer asks correctly | Passage renderer, choice controls, full-page routes, fragments, redirects, breadcrumbs, and discovery paths | `src/app.tsx`, `src/gamebook/render.ts`, `src/gamebook/player-render.ts` |
| Character Sheets As Data Models | The Scribe tries to describe a hero without accidentally becoming the hero | Versioned character state and derived stats | `src/gamebook/model.ts`, `src/gamebook/rules/character.ts` |
| Classes, Composition, And The Limits Of Inheritance | The Wizard asks whether every spellcaster must inherit from Wizard | Character creator options and capability composition | `src/gamebook/rules/character.ts` |
| Dice, Probability, And Risk | The Oracle explains why a fair die still feels unfair | Roll result model and transparent d20 log | `src/gamebook/rules/dice.ts` |
| Combat As An Event Loop | The Dungeon Master pauses time to ask whose turn it is | Encounter state, player turn, monster turn, retreat/defeat transitions | `src/gamebook/rules/combat.ts` |
| Inventory, Resources, And Encumbrance | The Quartermaster refuses one more impossible thing in the backpack | Item and flag-gated choices | `src/gamebook/model.ts`, `src/gamebook/state.ts` |
| The Dungeon Master And The Admin | The Doorkeeper checks whether the Admin is actually in the party | Author/debug mode, player-mode boundary, and player-safe visibility comparison | `src/app.tsx`, `src/gamebook/player-client.ts`, `src/gamebook/player-render.ts` |
| Adventure Modules And Programming Modules | The Scribe files a dungeon room in the wrong adventure | Separation between content, rules, state, graph, rendering, app shell, and shared package boundaries | `src/gamebook/`, `src/app.tsx` |
| Rules As Structured Data | The Wizard demands to know which spellbook a rule came from | SRD attribution notes and small rule lookup tables | `src/gamebook/rules/` |
| Saving The Game | The Adventurer learns that memory is a contract, not a vibe | Local-storage save document, reset, export/import | `src/gamebook/state.ts` |
| Authoring A Branching Adventure | The Cartographer finds a beautiful corridor that no one can enter | Passage-content conventions, validation reports, Mermaid graph output, preview, import, and player-safe authoring pipelines | `src/gamebook/content/`, `src/gamebook/graph.ts`, `src/app.tsx` |
| Testing The Dungeon | The Dungeon Master sends a test party into every door | Test suite, verification manifest, static smoke, accessibility expectations, screenshots, and acceptance evidence | `src/gamebook/testing.ts`, `src/app.test.tsx`, `scripts/` |
| Conclusion | The Wizard closes one spellbook and opens another | Reflection on the completed gamebook as a graph of choices, constraints, state, and meaning | `book/build-log.md` |

## Campaign Ledger Case Study

Campaign Ledger should provide concrete software-engineering evidence, not just an aside. Use it as the mature case study for:

- Role-based access: player, Game Master, admin, capabilities, ownership, selected-player visibility, player preview, and route guards.
- HTMX and hypermedia: full pages versus fragments, state transitions, focused swaps, action redirects, breadcrumbs, and discovery paths.
- Local-first persistence: SQLite as source of truth, browser-local play documents, export/import, and hosted rehearsal.
- SRD import and provenance: local corpus, importer boundaries, source categories, public versus private rules, discoverability, and attribution.
- Authoring pipelines: wiki rendering, staged imports, Google Docs manual export, preview, warnings, source metadata, and player-safe publishing.
- Testing and delivery: repository tests, route tests, component tests, Pa11y, screenshots, smoke tests, acceptance notes, and `bun run verify`.
- Hyper-Dank adoption: package boundaries, compatibility tests, and shared framework primitives versus app-owned domain logic.

## Proposed Book Structure

### Part I: Enter The Dungeon

1. **Introduction: From Spreadsheets To Spellcraft**
   - Expand the published introduction with the personal story.
   - Establish the book as a five-year learning dissertation and practical gamebook build.
   - Promise that games are systems made visible, not just decorative examples.
   - Introduce the gamebook as an original companion adventure and worked mechanics example.
   - Set licence guardrails: SRD mechanics with attribution, gamebook form as inspiration, original adventure prose.
   - Opening fiction: the Wizard shows the Apprentice how a spreadsheet becomes a spellbook.

2. **Choose Your Node Adventure**
   - Rewrite and expand `book/chapters/seed/choose-your-node-adventure.md`.
   - Teach graphs, nodes, edges, directed graphs, DAGs, cycles, trees, adjacency lists, and adjacency matrices.
   - Use gamebooks, websites, Five Room Dungeons, and table adventures as graph examples.
   - Build move: define `Passage`, `Choice`, start passage, endings, and graph validation for the prototype adventure.
   - Opening fiction: a gamebook passage offers a room that no choice can reach.

3. **Hypertext, HATEOAS, And The Gamebook Page**
   - Split the HTMX/gamebook material out from the graph chapter.
   - Teach links, forms, fragments, redirects, state transitions, HTMX swaps, breadcrumbs, and hypermedia as application state.
   - Use the gamebook passage/choice flow as the beginner example and Campaign Ledger's full-page, fragment, redirect, breadcrumb, and discovery architecture as the mature case study.
   - Build move: render a static adventure passage, visible choices, and a progressive enhancement path for fragment swaps and refreshable routes.
   - Opening fiction: a door reveals only the valid actions available from the current passage.

### Part II: Characters, Rules, And State

4. **Character Sheets As Data Models**
   - Teach records, types, validation, ability scores, modifiers, hit points, armour class, and resources.
   - Start from SRD 5.1-safe mechanics.
   - Keep the first character model small enough for a beginner: identity, class, level, abilities, HP, AC, inventory, conditions.
   - Build move: define the gamebook's `Character` and derived-stat helpers.
   - Opening fiction: a table transcript where the Scribe must turn a messy hero into structured facts.

5. **Classes, Composition, And The Limits Of Inheritance**
   - Teach OOP, inheritance, composition, polymorphism, and Liskov through character classes and stat blocks.
   - Use `stats.md` and `character.md` as raw material, but split examples into smaller pieces.
   - Contrast the early abstract `StatBlock` idea with a more flexible capability model.
   - Build move: create beginner-friendly Fighter, Rogue, Wizard, and Cleric options without non-SRD subclasses.
   - Opening fiction: the Apprentice challenges the Wizard's claim that all spellcasters belong in one inheritance tower.

6. **Dice, Probability, And Risk**
   - Rewrite `docs/dice-systems.md`.
   - Teach random variables, distributions, expected value, advantage/disadvantage, and probability curves.
   - Use prototype choices that trigger checks: sneak past a guardian, force a mechanism, escape a trap.
   - Build move: transparent d20 roller with structured roll logs.
   - Opening fiction: the Oracle lets the table feel the difference between fairness and risk.

7. **Combat As An Event Loop**
   - Teach state machines, queues, events, reducers, and command handling through initiative and combat rounds.
   - Use campaign-ledger resource mutation, rests, conditions, and sheet refreshes as evidence.
   - Keep the first combat loop small: player action, monster action, hit/miss, damage, defeat, retreat.
   - Build move: encounter loop for the prototype climax.
   - Opening fiction: the Dungeon Master pauses a chaotic fight and resolves one event at a time.

8. **Inventory, Resources, And Encumbrance**
   - Rewrite `docs/inventory-systems.md` and relevant parts of `docs/game-economy-systems.md`.
   - Teach collections, constraints, stacks, nested containers, search, and resource accounting.
   - Use clue, potion, key, treasure, or tool choices as examples.
   - Build move: inventory and flag-gated choices.
   - Opening fiction: the Quartermaster refuses one more impossible thing until the inventory rules are named.

### Part III: Adventures As Software Systems

9. **The Dungeon Master And The Admin**
   - Teach role-based access control, capabilities, ownership, permissions, and guard placement.
   - Compare DM/player roles with admin/user roles.
   - Use campaign-ledger's role guards, selected-player NPC visibility, player preview, campaign reads, and capability model as the mature case study.
   - Keep the gamebook version intentionally lightweight: player mode for normal play, author/debug mode for validation, forced navigation, and player-only static publishing.
   - Build move: debug state panel and author/player mode distinction.
   - Opening fiction: the Doorkeeper checks whether the Admin is actually allowed through this door.

10. **Adventure Modules And Programming Modules**
   - Teach modularity, boundaries, public contracts, dependency inversion, package adoption, and refactoring.
   - Use Campaign Ledger's Hyper-Dank adoption, compatibility shims, breadcrumbs, app-owned boundaries, and package-update audit as the mature evidence.
   - Use the `src/gamebook` shape as the beginner module map, including the current split between domain modules, renderers, player-only bundles, and `src/app.tsx`.
   - Build move: separate adventure content, graph validation, rules, state, rendering, app-shell routes, and author tooling.
   - Opening fiction: the Scribe files a dungeon room in the wrong adventure and breaks the table's map.

11. **Rules As Structured Data**
    - Teach parsing, provenance, source precedence, schema design, and licence-aware data import.
    - Use campaign-ledger's SRD importer, `rules_sources`, `rules_entities`, `rule_mechanics`, and character rule links.
    - Keep the gamebook rules table modest; do not import a full rules corpus into the first static gamebook.
    - Build move: small SRD-attributed lookup tables for conditions, attacks, equipment, or class options.
    - Opening fiction: the Wizard demands to know which spellbook a rule came from.

12. **Saving The Game**
    - Teach persistence trade-offs: local storage, JSON documents, SQLite, export/import, schema versioning, and migrations.
    - Use campaign-ledger browser-local play documents and SQLite architecture as evidence.
    - Compare the static gamebook's local-storage document with campaign-ledger's browser-local play export and SQLite source of truth.
    - Build move: versioned gamebook save document with validation, reset, export/import, and migration notes.
    - Opening fiction: the Adventurer learns that memory is a contract, not a vibe.

### Part IV: Building The Book's Gamebook

13. **Authoring A Branching Adventure**
    - Teach content modelling, passage IDs, choice constraints, dead-end checks, reachability, endings, puzzle gates, preview, import, warnings, and player-safe publishing.
    - Apply Fighting Fantasy-inspired structure without copying protected expression.
    - Use Campaign Ledger's wiki renderer, staged import, Google Docs manual import, source metadata, and player preview as the mature authoring-pipeline case study.
    - Finalise the prototype room contracts: guardian, puzzle, trap, climax, reward/twist.
    - Build move: content conventions for passages, choices, checks, encounters, flags, endings, validation, and previewable authoring surfaces.
    - Narrative note: this is still mechanics planning. Final prose and setting detail come later.
    - Opening fiction: the Cartographer finds a beautiful corridor that no one can enter.

14. **Testing The Dungeon**
    - Teach verification, smoke tests, route/component tests, accessibility checks, screenshots, acceptance notes, and evidence-led PR review.
    - Use Campaign Ledger's verification posture as the mature case study: tests, Pa11y targets, MVP smoke, screenshots, compatibility tests, and acceptance notes.
    - Use the gamebook's verification manifest as the compact worked example.
    - Build move: graph, state, rules, content, route, static build, static browser, and accessibility-style tests for the gamebook.
    - Opening fiction: the Dungeon Master sends a test party into every door.

15. **Conclusion: The Labyrinth Never Ends**
    - Return to the personal story.
    - Reflect on moving from spreadsheet formulas to systems thinking.
    - Show how the gamebook and the book mirror each other: both are graphs of choices, constraints, state, and meaning.

## Gamebook Topics That Feed The Book

- Static TypeScript/HTML gamebook with local-storage state.
- Passage graph validation: missing links, unreachable nodes, dead ends, cycles, ending coverage.
- Character creator based on SRD 5.1-compatible concepts.
- Dice roller, checks, saves, attacks, damage, rests, conditions.
- Inventory, flags, puzzle locks, scene state, and endings.
- Author/player/debug modes.
- SRD attribution and legal page.
- Export/import save state.
- Test harness for graph traversal and state transitions.
- Optional authoring tools: Mermaid graph output, passage previews, and adventure-content linting.
- Opening gamebook passages or table transcripts that explain chapter concepts without making the playable gamebook itself an allegory.

## Initial Gamebook Milestones

The gamebook should be developed in slices that match the book's teaching order:

1. **Graph skeleton**
   - Prototype passages, choices, endings, validation, and Mermaid export.
   - Supports chapters 2 and 13.

2. **Static passage UI**
   - Passage rendering, choice controls, restart, and basic styling.
   - Supports chapter 3.

3. **Character and save state**
   - Character creator, derived stats, local-storage save, reset, and import/export shape.
   - Supports chapters 4, 5, and 12.

4. **Dice and checks**
   - d20, advantage/disadvantage, DCs, saving throws, and roll logs.
   - Supports chapter 6.

5. **Combat and consequences**
   - Small encounter loop, damage, defeat, retreat, conditions, and ending transitions.
   - Supports chapter 7.

6. **Inventory, flags, and gated choices**
   - Puzzle items, clues, treasure, room flags, and alternate routes.
   - Supports chapter 8.

7. **Authoring and validation tools**
   - Debug panel, forced passage navigation, validation reports, and content tests.
   - Supports chapters 9, 10, 13, and 14.

## Gamebook Narrative Boundary

The playable gamebook should be planned mechanically first and written narratively later.

- Do not make the playable adventure a direct allegory for graphs, data structures, or software engineering.
- Do use the adventure's mechanics as examples in the book.
- Do use separate chapter-opening passages or table transcripts for playful allegory.
- Treat names like "Mt. Graphnor" and "The Dungeon Of Data Structures" as working/prototype labels unless they still feel good once narrative drafting begins.
- Final narrative goals will be decided after the mechanical prototype proves the graph, state, checks, combat, inventory, flags, and validation model.

## Acceptance Criteria

- Every chapter has a core concept, an RPG/gamebook analogy, and a gamebook build payoff.
- Every user-specified topic is covered: RBAC, dungeon rooms as graph nodes, gamebooks as hypermedia, OOP and character classes, event loops and combat counters, and adventure modules versus programming modules.
- Campaign-ledger contributes specific engineering lessons.
- SRD and Fighting Fantasy material has explicit licence/originality guardrails.
- Existing source material is mapped to a future chapter or treated as placeholder material.
- The book remains beginner-friendly, with deeper material moved into sidebars or appendices.
- The build map stays aligned with `book/gamebook-plan.md`.
- The first implementation target remains a small, complete mechanical prototype rather than a sprawling engine.
- The playable gamebook remains narratively independent from the book's allegorical opening excerpts.
