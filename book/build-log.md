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
