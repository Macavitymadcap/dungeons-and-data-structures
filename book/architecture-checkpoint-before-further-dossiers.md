# Architecture Checkpoint Before Further Dossiers

Date: 2026-05-25

This checkpoint reviews the current outlined book topics after the Chapter 02 **Choose Your Node
Adventure** research dossier. The graph chapter can continue because it sits on the most stable
foundation: passages, choices, reachability, endings, and the Five Room Dungeon template. The
refreshed structure in `book/book-structure-plan.md` now absorbs what the current gamebook engine
and recent Campaign Ledger work prove.

## Decision

- Keep the Chapter 02 dossier as the current research slice.
- Resume additional chapter dossiers after this checkpoint and the refreshed structure plan merge.
- Keep the current fifteen-chapter map, with the refreshed emphases captured in
  `book/book-structure-plan.md`.
- Use Campaign Ledger as a mature parallel case study, not an occasional aside.
- Keep Mt. Graphnor as a mechanics-first gamebook prototype. Do not finalise further narrative or
  chapter commitments until the architecture remains coherent across both apps.

## Verdict On The Current Book Topics

Yes: the current outlined topics are broadly informed by concepts and patterns already used in the
gamebook/storybook app and Campaign Ledger. The table of contents does not need a wholesale rewrite,
and no current topic should be removed at this stage.

The outline needed a structure refresh before more dossiers were created. That refresh is now part
of this PR. The main change is not "new subjects", but sharper emphasis: later chapters should be
grounded in the actual app patterns now visible in both codebases rather than in the older abstract
plan.

| Current topic | Verdict | Why |
| --- | --- | --- |
| Introduction: From Spreadsheets To Spellcraft | Keep | The personal thread still fits Campaign Ledger's origin and the gamebook as a practical learning artefact. |
| Choose Your Node Adventure | Keep and proceed | Directly supported by the gamebook's passage model, choices, graph validation, reachability checks, endings, and Five Room Dungeon template. |
| Hypertext, HATEOAS, And The Gamebook Page | Keep, but strengthen | Supported by both apps. The gamebook has passage and choice fragments; Campaign Ledger adds mature full-page, fragment, redirect, breadcrumb, and discovery patterns. |
| Character Sheets As Data Models | Keep | Supported by the gamebook character model and Campaign Ledger's character sheet domain. Needs fresh SRD/data modelling research before dossier work. |
| Classes, Composition, And The Limits Of Inheritance | Keep | Still valid, but should be grounded in capability composition and character/rules helpers rather than overcommitting to inheritance examples. |
| Dice, Probability, And Risk | Keep | Supported by gamebook dice/check helpers and transparent roll results. Campaign Ledger is less central here, so this chapter should rely more on gamebook and probability research. |
| Combat As An Event Loop | Keep | Supported by the gamebook combat loop, encounter state, outcomes, and logs. Campaign Ledger can provide state-mutation contrast, but the gamebook should lead. |
| Inventory, Resources, And Encumbrance | Keep | Supported by gamebook inventory, flags, item gates, conditions, and choice effects. Campaign Ledger contributes resource and sheet-management parallels. |
| The Dungeon Master And The Admin | Keep, but broaden | Strongly supported by Campaign Ledger's player/Game Master/admin visibility, selected-player NPCs, player preview, and route guards, plus the gamebook's author/player split. |
| Adventure Modules And Programming Modules | Keep, but make more important | Strongly supported by Hyper-Dank adoption, compatibility shims, app-owned boundaries, and the gamebook's domain/module split. This topic may need more prominence than originally planned. |
| Rules As Structured Data | Keep | Strongly supported by gamebook SRD provenance and Campaign Ledger's SRD import/discovery/source boundaries. |
| Saving The Game | Keep | Supported by gamebook localStorage save versioning and Campaign Ledger's browser-local play plus SQLite-owned campaign data. |
| Authoring A Branching Adventure | Keep, but reshape | Supported by gamebook validation, Mermaid export, author tools, and Campaign Ledger's import/wiki/preview workflow. Should become an authoring pipeline chapter, not only content modelling. |
| Testing The Dungeon | Keep | Strongly supported by both apps: gamebook verification manifest and Campaign Ledger's tests, accessibility, smoke, screenshots, and acceptance notes. |
| Conclusion: The Labyrinth Never Ends | Keep | Still fits once the preceding chapters stay tied to real architecture rather than decorative analogies. |

So the answer is: proceed with the outline, using the refreshed chapter plan. Chapters 03 onward
should explicitly cite the relevant gamebook and Campaign Ledger patterns in their dossiers. The
biggest adjustments are to chapters 03, 09, 10, 13, and 14; they are sound topics, but the recent
Campaign Ledger work changes what they should emphasise.

## Research Method

This review inspected local source and history in two repositories:

- Dungeons & Data Structures at `/Users/dank/Code/personal/web/dungeons-and-data-structures`.
- Campaign Ledger at `/Users/dank/Code/personal/web/campaign-ledger`, current branch
  `feat/sheet-0070` at `628657d`.

The review used the current implementation rather than the older plan as the source of truth. It
looked at:

- Gamebook domain modules, route shell, author tools, static build split, and verification manifest.
- Campaign Ledger commits from the Hyper-Dank adoption line through `sheet-0076`.
- Campaign Ledger route architecture, wiki and import helpers, player/Game Master visibility flows,
  Hyper-Dank compatibility tests, accessibility targets, smoke/screenshot verification, and
  acceptance notes.

This is local project research, not external literature review. Future chapter dossiers still need
source-specific research for CS, software engineering, SRD, gamebook history, and hypermedia
references.

## Dungeons And Data Structures Engine Review

The gamebook/storybook engine structure is still sound.

- `src/gamebook/model.ts` keeps the domain vocabulary explicit: `Adventure`, `Passage`, `Choice`,
  encounters, items, discoveries, `Character`, and versioned `GameState`.
- `src/gamebook/graph.ts` protects authoring with reachability, missing-target, duplicate-reference,
  empty-passage, missing-content-reference, and unreachable-ending checks.
- `src/gamebook/state.ts` treats local storage as a versioned save contract with migration,
  validation, readable load errors, import parsing, effects, requirements, conditions, inventory,
  flags, hit points, temporary hit points, and encounter state.
- `src/gamebook/play.ts` centralises choice resolution so checks, combat, effects, logging, and
  passage movement are not scattered through rendering code.
- `src/gamebook/rules/` keeps character, dice, combat, and SRD provenance logic separate from
  passage content and UI.
- `src/app.tsx` is mostly an application shell around those modules: Hono routes, Hyper-Dank UI
  primitives, author-tool gating, player and author pages, fragment responses, and browser bundle
  selection.
- `src/gamebook/testing.ts` now makes verification coverage inspectable in author tools, tying the
  book's testing chapter to concrete gates rather than vague reassurance.

The main structural caution is that the book plan still names a future `src/gamebook/ui/` directory,
while the implementation currently keeps rendering in `src/app.tsx`, `src/gamebook/render.ts`, and
`src/gamebook/player-render.ts`. That is fine for the prototype, but chapters 03, 09, 10, 13, and 14
should either document the current split honestly or move toward the planned UI boundary before
those dossiers are drafted.

### Dungeons And Data Structures Evidence Map

| Concern | Current evidence | Book implication |
| --- | --- | --- |
| Graph and content model | `src/gamebook/model.ts`, `src/gamebook/graph.ts`, `src/gamebook/content/mt-graphnor.ts`, `src/gamebook/content/five-room-template.ts` | Chapter 02 can proceed because the model, validation, and Five Room Dungeon template already align. |
| State and persistence | `src/gamebook/state.ts`, `src/gamebook/state.test.ts`, static browser smoke | Chapter 12 should treat save files as versioned contracts, not just browser storage. |
| Rules and provenance | `src/gamebook/rules/character.ts`, `dice.ts`, `combat.ts`, `srd.ts`, tests | Chapters 04 through 07 and 11 can use the engine as a compact worked example, but need SRD/source research before prose. |
| Play resolution | `src/gamebook/play.ts`, `src/gamebook/play.test.ts` | Chapters on checks, combat, and consequences should show command/result style transitions. |
| Authoring and review | `src/app.tsx`, `src/gamebook/testing.ts`, `src/app.test.tsx` | Chapters 09, 13, and 14 should connect author tools to validation and evidence, not just debug convenience. |
| Published player build | `src/gamebook/player-client.ts`, `src/gamebook/player-render.ts`, `scripts/build-static.ts`, `scripts/check-static.ts` | The author/player boundary is already real enough to support the permissions chapter, but the rendering boundary needs naming clarity. |

## Campaign Ledger Review

Recent Campaign Ledger work makes the case-study role stronger than the original plan assumed.

- Hyper-Dank adoption is now a real package-boundary case study: UI shims, transport helpers, data
  lifecycle boundaries, automation helpers, compatibility tests, package-update audits, and explicit
  app-owned boundaries are recorded in `docs/operations/hyper-dank-adoption-acceptance.md`.
- Game Master prep has become a full product architecture example: private/public NPC dossiers,
  selected-player visibility, wiki pages, image libraries, staged imports, Google Docs manual
  import, player preview, and verification evidence are recorded in
  `docs/operations/game-master-prep-acceptance.md`.
- `src/campaigns/wiki.ts` shows a deliberately small Markdown rendering boundary for campaign
  content, asset references, escaping, headings, lists, emphasis, and figures.
- `src/campaigns/imports.ts` shows import normalisation as product architecture: source metadata,
  private-link stripping, small safe HTML conversion, warnings, title detection, and Google Docs
  reference normalisation.
- `src/app.test.tsx` and the verification scripts demonstrate the mature route-testing, HTMX
  fragment, accessibility, smoke, and screenshot posture that the book's later testing and delivery
  chapters should learn from.

This means Campaign Ledger should influence more than RBAC and testing. It should also inform
chapters on hypermedia, modular boundaries, source provenance, import pipelines, player-safe views,
local-first ownership, compatibility testing, and review evidence.

### Recent Campaign Ledger Development Trail

| Commit | Development | Evidence inspected | Structure signal |
| --- | --- | --- | --- |
| `31dc170` after `sheet-0041` through `sheet-0046` | Hyper-Dank adoption acceptance | `docs/operations/hyper-dank-adoption-acceptance.md`, `scripts/hyper-dank-compat.test.tsx` | Campaign Ledger now has a concrete package-boundary story: shared primitives are adopted through compatibility shims while app-owned routes, copy, schema, permissions, and domain flows remain local. |
| `5c85e14` / PR #78 | Game Master prep, private NPCs, and content import | `docs/operations/game-master-prep-acceptance.md`, `src/app.tsx`, `src/campaigns/imports.ts`, `src/campaigns/wiki.ts` | The app is now a mature example of player-safe information architecture, import boundaries, source metadata, preview routes, and visibility-based reads. |
| `58ae4aa` / PR #87 | SRD rules discovery | `src/components/pages/Rules/Rules.tsx`, `src/rules/importer.ts`, screenshot paths under `docs/pr-screenshots/sheet-0072*` | Rules provenance is a product feature. Chapter 11 should include discoverability and source confidence, not only data shape. |
| `c13822a` / PR #89 | Sheet edit disclosure replacement | `src/app.tsx`, `src/components/organisms/*`, route tests | Interaction design moved toward clearer task surfaces. Later chapters should treat UI structure as part of architecture. |
| `7ced3a8` / PR #90 | Home and player roster simplification | `src/components/pages/Home/Home.tsx`, `src/components/pages/Characters/Characters.tsx`, tests and screenshots | Entry points were simplified around role and task. The book structure should avoid overloading early chapters with too many running examples. |
| `3026209` / PR #91 | Hyper-Dank breadcrumbs | `src/components/molecules/Breadcrumbs/index.ts`, `src/components/pages/*`, `scripts/hyper-dank-compat.test.tsx` | Shared navigation became a package-adoption case study; chapter 03 should connect hypermedia navigation with orientation and return paths. |
| `628657d` / PR #92 | Player wiki discovery | `src/components/pages/Campaign/Campaign.tsx`, `src/components/molecules/SiteHeader/SiteHeader.tsx`, screenshots under `docs/pr-screenshots/sheet-0076` | Campaign knowledge is now deliberately surfaced for players. This matters for chapters about discovery, visibility, and authoring, not only RBAC. |

### Campaign Ledger Evidence Map

| Concern | Current evidence | Book implication |
| --- | --- | --- |
| Hypermedia routes | `src/app.tsx`, `HttpResponder`, `FormValues`, HTMX redirect and fragment tests in `src/app.test.tsx` | Chapter 03 should compare full-page refreshable URLs, HTMX fragments, and action redirects across both apps. |
| Package boundaries | `scripts/hyper-dank-compat.test.tsx`, Hyper-Dank acceptance note, breadcrumb adoption | Chapter 10 should be a real module/package boundary chapter, not just "put files in folders". |
| Visibility and permissions | `requireCampaignAccess`, `campaignViewerRole`, player preview route, NPC list/detail branches | Chapter 09 should use Campaign Ledger as the mature permissions case and the gamebook author/player split as the small analogue. |
| Source provenance | SRD importer, rules pages, hosted data script, rule-source docs | Chapter 11 should include import provenance, public/private rules, and discoverability. |
| Writing/import pipeline | `src/campaigns/imports.ts`, `src/campaigns/wiki.ts`, Google Docs manual import route | Chapters 13 and possibly 10 should cover authoring pipelines: normalise, preview, warn, save, and render. |
| Verification culture | `scripts/verify.ts`, `scripts/test-a11y.ts`, `scripts/smoke-mvp.ts`, `scripts/capture-screenshots.ts`, PR screenshot folders | Chapter 14 should include acceptance evidence as a product habit: tests, accessibility, smoke, screenshots, and PR notes. |

## Cross-App Architecture Findings

| Finding | Dungeons & Data Structures | Campaign Ledger | Structural conclusion |
| --- | --- | --- | --- |
| Keep the domain layer boring and explicit | `model`, `graph`, `state`, `play`, `rules` are mostly framework-light | Repositories, auth, rules, campaign content, imports, and wiki helpers hold domain behaviour outside components | The book should keep teaching small explicit contracts before abstractions. |
| UI is architecture when it changes access or navigation | Author/player bundle split, debug routes, author page, forced navigation | Breadcrumbs, player preview, player wiki discovery, roster/home simplification | UX changes should not be treated as surface polish only; they alter mental models and route contracts. |
| Provenance is part of the data model | `rules/srd.ts` and attribution panel | SRD import, public/private rule sources, hosted data preparation | Chapter 11 should centre trust, licence, and source boundaries. |
| Local-first does not mean casual persistence | Versioned localStorage save document, import/export, migration | Browser-local play plus SQLite-owned campaign data and hosted rehearsal | Chapter 12 should compare ownership boundaries rather than rank storage tools. |
| Authoring needs validation and preview | Graph validation, Mermaid export, passage previews, testing manifest | Import preview, player preview, wiki rendering, screenshot evidence | Chapters 13 and 14 should be paired: authoring creates risk; verification makes it shippable. |

## Structure Implications

- Chapter 02 remains a good next manuscript target: graph theory, gamebooks, websites, Five Room
  Dungeons, and `src/gamebook/graph.ts` are aligned.
- Chapter 03 should include both apps: the gamebook's passage responses and Campaign Ledger's
  full-page/fragment HTMX contracts.
- Chapter 09 should compare author/player mode in the gamebook with Campaign Ledger's richer
  player, Game Master, admin, ownership, selected-player, and preview boundaries.
- Chapter 10 should become more explicitly about package and module boundaries, using Hyper-Dank
  adoption as the mature refactoring example and `src/gamebook/` as the beginner-scale example.
- Chapter 11 should connect SRD provenance in the gamebook to Campaign Ledger's rules import and
  source-boundary posture.
- Chapter 12 should compare the static gamebook save document with Campaign Ledger's browser-local
  play and SQLite-owned campaign data.
- Chapters 13 and 14 should use the gamebook author tools and Campaign Ledger PR evidence habits
  together: validation reports, Mermaid output, route tests, accessibility, smoke tests, screenshots,
  and acceptance notes.

## Revised Dossier Order

After this PR merges, the remaining chapter dossiers are unblocked. Create them one at a time and
use the refreshed structure plan as the baseline.

1. Create Chapter 03's dossier next, because both apps have fresh hypermedia/navigation evidence.
2. Create Chapter 09 or Chapter 10 next, depending on whether the next implementation work is
   author/player boundary hardening or gamebook rendering/module cleanup.
3. Draft Chapters 04 through 08 against the now-implemented rules, dice, combat, inventory, and
   state modules rather than the older seed prose alone.
4. Draft Chapters 13 and 14 with an explicit authoring and verification evidence check, especially
   around the current `src/app.tsx` versus `src/gamebook/render.ts` boundary.

## Open Questions For Future Dossiers

- Should Chapter 03 teach hypermedia primarily through the gamebook first, then use Campaign Ledger
  as the mature example, or should both apps appear side by side?
- Should Chapters 09 and 10 swap order? Campaign Ledger now makes package/module boundaries feel
  more urgent than RBAC alone, but the gamebook author/player split is easier for beginners.
- Should the planned `src/gamebook/ui/` boundary become a real refactor before the chapter map is
  frozen, or should the book teach the current split as an honest intermediate state?
- Does the book need an explicit "authoring pipeline" thread across Chapters 10, 13, and 14, using
  Campaign Ledger imports/wiki and gamebook passage validation together?
- How much Campaign Ledger history belongs in the main prose versus sidebars? The case study is now
  strong enough to overtake the beginner gamebook if not paced deliberately.

## Unblock Criteria For More Dossiers

This PR satisfies the structure-refresh blocker by updating `book/book-structure-plan.md`,
`book/gamebook-plan.md`, and `book/research/README.md`. Before drafting each new chapter dossier,
confirm the following:

- The chapter map still names the right Campaign Ledger evidence for chapters 03 through 14.
- The gamebook implementation paths in `book/book-structure-plan.md` and `book/gamebook-plan.md`
  match current files or deliberately describe planned refactors.
- The research dossier template asks for both gamebook build payoff and Campaign Ledger evidence.
- The next dossier names exact files from both apps when both apps are relevant.
- Any chapter that depends on UI screenshots, author tools, or route behaviour has a verification
  expectation before the dossier is treated as ready.

## Follow-Up Tickets

- Reconcile the planned `src/gamebook/ui/` boundary with the current rendering split.
- Resume dossiers one at a time, starting with Chapter 03, after this PR lands.
