# Dungeons & Data Structures Build Log

Use this log to record major planning, research, manuscript, and gamebook implementation decisions.

## 2026-05-23

- Created the `book/` planning area.
- Seeded draft chapter source from `docs/published`.
- Saved the concept-led book structure plan.
- Saved the first gamebook structure plan under the original **The Dungeon Of Data Structures** working title.
- Confirmed that seed chapters are source material to split, research, rewrite, and SRD-align rather than final manuscript chapters.
- Revised the book structure plan to align each chapter with a concrete gamebook artefact and initial mechanics-first implementation milestone.
- Updated the planning boundary: gamebook work now focuses on mechanics first, with final narrative drafting later. Technical allegory moves into optional Godel, Escher, Bach-style chapter dialogues rather than the playable adventure itself.
- Started the Bun/Hyper-Dank implementation path for the gamebook rather than extending the older Deno examples.
- Added a framework-light `src/gamebook` domain layer for passages, graph validation, Mt. Graphnor content, character templates, dice checks, choice effects, local save state, and shared choice resolution.
- Added a Hono `createApp()` shell that renders the gamebook with Hyper-Dank UI primitives and Hyper-Dank transport helpers.
- Added a static build that outputs `dist/index.html`, `dist/gamebook/index.html`, `dist/assets/client.js`, and `dist/assets/hyper-dank-ui.css`.
- Added a browser client for the static build that continues saved localStorage games, starts a new game with a visible class selector, resets saved progress, applies choices, and re-renders passages with the shared gamebook mechanics.
- Replaced the ad hoc verifier with Hyper-Dank automation gates: TypeScript typecheck, Bun unit tests, static build, static artifact smoke checks, and Playwright static browser smoke.
- Added the first combat layer: encounter definitions, character attack profiles, damage rolls, one-round combat resolution, encounter state updates, combat summaries, and combat wiring for the door guardian and ember statue passages.
- Extended verification so unit, route, and static browser tests cover the combat path through the door guardian.
- Added SRD-safe ancestry/race selection to character creation with Human, Elf, Dwarf, and Halfling options, including small ability, skill, inventory, and hit point effects.
- Added save-load migration for earlier localStorage saves, deeper character validation, and defeated-encounter handling so the combat layer can evolve without silently discarding progress.
- Added explicit save JSON export/import controls to support local-first persistence testing and the future save-document chapter.
- Added item/discovery metadata, labelled inventory and discovery summaries, a thieves' tools puzzle route, and graph validation for combat outcome targets.
- Tightened save and authoring validation for submitted state, missing passages, missing combat encounters, and targetless choices.
- Added a static author tools page with graph validation status and Mermaid passage graph export.
- Added a debug gamebook variant with live passage, item, flag, encounter, and log state for author-mode testing.
- Extended combat passages with visible encounter status, persisted combat round counts, and ration-based recovery actions.
- Added readable log entries for choice effects such as healing, damage, item use, item gains, and newly noted flags.
- Exposed recent game log entries in the debug panel so author mode shows the latest state transitions without opening exported JSON.
- Extended adventure validation to catch duplicate item, discovery, and encounter definitions plus missing item, discovery, and encounter references in choices.
- Formalised the localStorage save document as schema version 2, with version 1 migration for older character and encounter state.
- Added author-mode force navigation so debug sessions can jump to any passage without mutating the adventure graph.
- Tightened author force navigation so development-only debug jumps can recover from stale passage IDs after passage renames.
- Build-gated author/debug tooling so the published static gamebook omits debug pages, author routes, and force-passage controls.
- Split the published browser bundle onto a player-only client and renderer so development-only debug code is not shipped in static assets.
- Added a development asset route that serves an in-memory browser client bundle, using the author-capable client in dev and player-only client when author tools are disabled.
- Added condition-based choice requirements and effects so the existing save-state `conditions` field now participates in mechanics and player summaries.
- Added temporary hit point mechanics so choice and combat damage consume temporary hit points before normal hit points.
- Updated the gamebook roadmap with an explicit Mt. Graphnor MVP completion milestone, replaced obvious placeholder adventure copy, and added content tests for the five-room template shape.
- Added a reusable Five Room Dungeon template contract and companion planning note so Mt. Graphnor can act as the first adventure template.
- Started the authoring-ergonomics epic by surfacing five-room template coverage in development-only author tools.
- Added development-only passage previews so authors can inspect content, tags, and choice targets without using forced navigation.
- Added a development-only content audit tab so authors can scan passage, choice, check, combat, gate, effect, item, discovery, and ending coverage at a glance.
- Refreshed the gamebook and authoring chrome with a Hyper-Dank-inspired site header, stronger page headers, dimensional surfaces, and clearer play/author navigation while keeping author links out of the player-only build.
- Tightened the player passage layout with a distinct story/option structure, compact expandable encounter status, and refreshed screenshot evidence for mobile and desktop play states.
- Added the Hyper-Dank colour-mode switch to gamebook and author headers, persisted the light/dark preference in local storage, and verified expanded mobile detail panels no longer overflow horizontally.
- Polished save management with a visible save summary, downloadable save JSON, import/export smoke coverage, and settings-popover behaviour that does not block the next player choice after starting, importing, or resetting a game.
- Added a structured rules catalogue for SRD 5.1 provenance, playable ability/skill/class/race mechanics, prototype equipment, and Mt. Graphnor attribution coverage.
- Added a structured testing coverage manifest and surfaced it in author tools so chapter 14 can point at concrete graph, state, rules, UI, and static-browser verification evidence.
- Seeded the Chapter 02 **Choose Your Node Adventure** research dossier, then paused further chapter dossiers for an architecture research checkpoint across the gamebook/storybook engine and recent Campaign Ledger work.
- Recorded the checkpoint in `book/architecture-checkpoint-before-further-dossiers.md`: Chapter 02 can proceed, the remaining topics are still sound, and chapters 03 onward should use the refreshed cross-app structure.
- Refreshed `book/book-structure-plan.md`, `book/gamebook-plan.md`, and `book/research/README.md` from the checkpoint so future chapter dossiers can proceed from the current cross-app architecture baseline.
- Seeded the first research dossier for chapter 2, mapping graph vocabulary, gamebook form, Five Room Dungeon structure, Mt. Graphnor implementation files, and rights guardrails for the Choose Your Node Adventure rewrite.
- Seeded the Chapter 03 **Hypertext, HATEOAS, And The Gamebook Page** research dossier, mapping web links, forms, fragments, redirects, htmx controls, gamebook passage rendering, and Campaign Ledger hypermedia evidence.
- Seeded the Chapter 04 **Character Sheets As Data Models** research dossier, mapping SRD-safe character-sheet vocabulary, TypeScript records, validation boundaries, derived-stat helpers, gamebook character templates, and Campaign Ledger sheet-model evidence.
- Seeded the Chapter 05 **Classes, Composition, And The Limits Of Inheritance** research dossier, mapping the old StatBlock inheritance seed material to a composition-first character-template chapter backed by gamebook class/race templates and Campaign Ledger's composed sheet model.
- Seeded the Chapter 06 **Dice, Probability, And Risk** research dossier, mapping dice probability, expected value, advantage/disadvantage, transparent roll results, gamebook d20 checks, and Campaign Ledger's sheet dice controls.
- Seeded the Chapter 07 **Combat As An Event Loop** research dossier, mapping combat rounds to state machines, reducer-shaped transitions, command handling, gamebook encounter loops, and Campaign Ledger resource/rest mutation evidence.
