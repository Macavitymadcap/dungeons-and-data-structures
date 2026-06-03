# Reader's Report — *Dungeons & Data Structures*

*A full-manuscript editorial appraisal, read as a commissioning editor / slush reader at a software-technical imprint (O'Reilly, No Starch, Pragmatic Bookshelf, Manning, Apress, MIT Press). Read against the book's own declared conventions as well as the genre's. The author has flagged this as an AI-assisted draft to be revised by hand, so the appraisal separates the load-bearing structure from the voice layer throughout.*

---

## Placement

A concept-led, beginner-to-intermediate software engineering book that teaches computer science and architecture through tabletop RPGs and Fighting Fantasy-style gamebooks, built around two parallel running examples: a small complete gamebook (Mt. Graphnor) and a production-scale campaign app (Campaign Ledger). Stack: TypeScript, Bun, Hono, htmx, SQLite. Comp shelf: *Land of Lisp*, *Learn You a Haskell*, the Manning *Grokking* line, *Hypermedia Systems*, the No Starch "learn-X-through-a-thing-you-love" tradition.

## Overall

This is a strong, distinctive, and largely commercial manuscript with a genuine thesis, not just a topic. The central conceit (that a domain like D&D is *already* a well-designed model, and that software gets interesting when it represents a domain faithfully) is real, defensible, and pays off structurally in Chapter 13 rather than being decoration. The two-example architecture is the book's best structural decision: Mt. Graphnor keeps every concept small enough to hold in the head, Campaign Ledger proves each idea survives contact with real users, and the book is disciplined about which one it reaches for. The voice, in most chapters, is exactly what the genre rewards: confident without aloofness, dry, British, fond of a good metaphor and suspicious of a bad one.

It sits well toward the "rough but commercial" end rather than "beautiful but unpublishable." The bones are a clear yes. The work that remains is a voice pass to even out a single conspicuously flatter chapter, plus a continuity-and-consistency sweep that any technical book needs before it goes out.

## Cross-cutting strengths

The fictional excerpts are doing real work. Each one embodies its chapter's technical tension without explaining it (the Cartographer's unreachable Chamber of Answered Questions for graph reachability; the Quartermaster distinguishing "a rope" from "the rope" for membership-versus-count; the Hourglass insisting on one event resolved completely for the event loop). They obey the no-meta-language rule cleanly, and every chapter lands its closing echo back to the excerpt. This is consistent and hard to do; it's a signature of the book.

The footnotes are a genuine asset, carrying historical provenance, attributions, and the dry asides that give the book personality, while keeping the body text moving. The SRD/OGL licensing posture is handled responsibly and repeatedly (Chapter 1's licence note, Chapter 11's whole provenance argument), which pre-empts the first question an acquisitions editor will ask of a D&D-derived book.

The code is, with one exception noted below, clean and faithful to the book's own rules: injectable `RandomSource`, no magic numbers, no nested ternaries, Arrange/Act/Assert tests. The dual-audience discipline (glossing RPG terms in a clause, the same way programming terms are introduced) is well honoured almost everywhere.

## Cross-cutting issues, in priority order

1. **The voice gradient is uneven, and Chapter 5 is the outlier.** Most chapters have fingerprints; Chapter 5 reads as competent-but-anonymous, with little first person and no lived specificity. This is the single highest-value place for the hand-edit, and the author has already identified it.

2. **A continuity slip at the 4→5→6 seam.** Chapter 6 opens "In Chapter 5, we built a character," but the `Character` record was built in Chapter 4; Chapter 5 built the *template and creation* system on top of it. Either reword Chapter 6's callback or make Chapter 5's contribution explicit in that sentence.

3. **Footnote numbering needs a pass, starting in Chapter 6.** Chapter 6's body carries two `[^2]` markers (the Fighting Fantasy 2d6 distribution note and the pseudo-random note) but only one `[^2]` definition; the distribution marker looks like it should point to the later Fighting Fantasy footnote. This is exactly the renumbering hazard to sweep for across all chapters after any edit.

4. **A few file-path and identifier slips between the two examples.** Chapter 9's Build Move locates the NPC visibility filter in `src/gamebook/state.ts`, but that's a Campaign Ledger concern and reads like a copy-paste from the gamebook path. Worth a consistency pass to ensure gamebook paths and Campaign Ledger paths never cross-contaminate, since path precision is part of the book's credibility.

5. **One code example breaks the book's own rules** (Chapter 5; detailed below). Because the rule is stated so firmly elsewhere, the violation stands out.

6. **Housekeeping the chapter map.** The running order here is Intro (1), thirteen content chapters (2–14), Conclusion (15), plus two appendices, and the conclusion's recap is internally consistent with that. Just verify every forward reference resolves to the right number after edits, and that no planned-but-cut chapter (e.g. a standalone branching-adventure authoring chapter) is still referenced anywhere.

---

## Chapter-by-chapter

### Chapter 1 — Introduction: From Spreadsheets To Spellcraft
**Working:** One of the strongest chapters. The spreadsheet-that-had-eaten-three-others origin is specific, funny, and earns trust immediately; "considerably cheaper than a sports car" and "a saving throw I've failed too many times" are exactly the register the genre wants. The RPG-to-CS mapping table is a clean promise of the book's structure, and the "what this book is not" section is honest in a way that disarms the obvious objections. Licence and originality are addressed up front.
**Flag:** Very minor — the introduction is long; confirm it doesn't front-load so much framing that an impatient reader doesn't reach Chapter 2. Nothing to cut, just something to watch in proof.
**Call:** Publishable as-is, pending a light trim check.

### Chapter 2 — Choose Your Node Adventure
**Working:** Excellent breadth without losing the thread: Sorcery!/Lone Wolf as escalating state, Colossal Cave/Zork, The Dark Room as an accidental lesson in edges that depend on infrastructure you don't control. Graph vocabulary is introduced precisely and glossed for non-CS readers; the Five Room Dungeon ties design to graph structure and grounds Mt. Graphnor's scope. Code (the `Passage`/`Choice` types, `validateAdventure`, the id-as-contract argument) is clean and motivated.
**Flag:** Dense with examples and footnotes; make sure the through-line ("a gamebook is a directed graph, printed out of order") stays foregrounded so the chapter reads as one argument rather than a tour.
**Call:** Strong yes.

### Chapter 3 — Hypertext, HATEOAS, And The Gamebook Page
**Working:** The brass-panel door is a near-perfect HATEOAS analogy, and "HATEOAS Without The Fog Machine" earns its title by demystifying rather than name-dropping. Links-versus-forms (navigation versus intent), progressive enhancement, and Post/Redirect/Get are explained with real motivation; the 303/HX-Redirect detail and the Google Web Accelerator footnote are the kind of specifics that build authority.
**Flag:** Footnote labelling is irregular here (`[^5a]` then `[^5]`); normalise the scheme. Otherwise clean.
**Call:** Strong yes.

### Chapter 4 — Character Sheets As Data Models
**Working:** The Scribe-and-Hero excerpt ("I do not have a column for *multitudes*") is a standout, and the stored-versus-derived-facts distinction is the chapter's spine, taught well. The cross-system survey (Fighting Fantasy's three numbers, Daggerheart's Hope/Fear, Skyrim's derive-everything model) is genuinely illuminating about modelling trade-offs. Validation-at-the-gate and the Campaign Ledger read-model scale-up are well placed.
**Flag:** The closing deliberately sets up Chapter 5's tension, which is good; just ensure the "we haven't done this" section and Chapter 5's opening don't repeat the same framing almost verbatim (they currently come close).
**Call:** Strong yes.

### Chapter 5 — Classes, Composition, And The Limits Of Inheritance
*(Examined in depth separately; summarised here for the bundle.)*
**Working:** The Wizard/Apprentice lineage excerpt is excellent and the multiclassing argument (Paladin, Ranger, Eldritch Knight, Arcane Trickster as the thing single inheritance can't express) is the strongest technical beat — a domain-grounded version of "favour composition over inheritance." Structure and closing echo are correct.
**Flag:** This is the book's flattest chapter — little first person, no lived anecdote, and the Campaign Ledger section asserts tables-not-hierarchy abstractly where a war story belongs. The `Fighter.attack` example breaks the book's own rules (`Math.floor(Math.random()*8)+1` is inline RNG plus magic numbers; `10 + level` is a magic number), and it pre-empts Chapter 6's injectable-`RandomSource` pattern badly. `Spellcaster`/`SpellcastingCharacter` drift; Eldritch Knight and Arcane Trickster want a one-clause gloss. Risk of a "principle parade" (DRY, Liskov, composition, polymorphism, structural typing in quick succession).
**Call:** Read on, conditional on the voice-and-code pass. Highest-priority chapter for the hand-edit.

### Chapter 6 — Dice, Probability, And Risk
**Working:** The Oracle's "fair in the mathematical sense, which is quite different from being kind" frames the whole chapter, and the gambler's-fallacy and expected-value material is correct and well-pitched. The injectable `RandomSource`, the structured `RollResult`, and the "make the arithmetic visible" argument are exactly right, and the advantage/disadvantage probabilities are worked correctly with the formula relegated to a footnote.
**Flag:** The duplicate `[^2]` marker (see cross-cutting issue 3). Confirm the V8/xorshift footnote claim stays accurate for the Bun version you target. The chapter is long; the damage-roll section could tighten.
**Call:** Strong yes, after the footnote fix.

### Chapter 7 — Combat As An Event Loop
**Working:** The Hourglass excerpt ("the goblin is currently mid-swing, mid-fall, mid-shout, and mid-negotiation simultaneously") is a vivid, accurate picture of inconsistent state, and the closing payoff ("the goblin ends up behind the cart") is one of the book's best echoes. The resolve/apply split (pure round resolution versus reducer) is taught cleanly, and "What The Gamebook Deliberately Omits" models honest scoping rather than hand-waving.
**Flag:** The `resolveCombatRound` listing is long for a beginner-facing book; consider trimming the inline body and pushing some detail to the repo, or annotating more heavily. The implicit-versus-explicit state machine note is good but could confuse a beginner — make sure the "we did the simple thing on purpose" framing is unmissable.
**Call:** Strong yes.

### Chapter 8 — Inventory, Resources, And Encumbrance
**Working:** The Quartermaster ("but I find it better to anticipate these things") is delightful, and the membership-versus-count distinction is the cleanest articulation of that idea I've read in a teaching context. Set-at-point-of-use, flags as valueless permanent facts, the no-`removeFlags` design decision, choice gates as HATEOAS-at-the-content-level, and the Campaign Ledger denormalised-HP trade-off are all strong.
**Flag:** Filename in the title is "Encumberance" (typo for "Encumbrance"; correct inside). The chapter is the longest content chapter by word count and covers a lot (items, quantities, maps, flags, gates, cross-system survey, Campaign Ledger, effects, validation); watch for fatigue and consider whether the maps/lookups section could fold into the catalogue discussion.
**Call:** Strong yes, after the title fix.

### Chapter 9 — The Dungeon Master And The Admin
**Working:** The Doorkeeper-and-Admin excerpt nails the role-versus-context distinction, and the chapter is rigorous: authentication/authorisation/role/capability/ownership cleanly separated, "hiding a button is decoration" stated plainly, the deliberate absence of an admin bypass, representation-level filtering, and the structural (not conditional) player bundle. The 401/403/404 footnote on information leakage is exactly the kind of nuance that signals authority.
**Flag:** The Build Move places the NPC visibility filter at `src/gamebook/state.ts` (cross-cutting issue 4) — fix the path. The forged-mode-flags section slightly overlaps the "hiding buttons" section; tighten so they don't restate each other.
**Call:** Strong yes, after the path fix.

### Chapter 10 — Adventure Modules And Programming Modules
**Working:** The double meaning of "module" (a published adventure plugs into a campaign through a small interface; a code module hides a decision) is the chapter's best move and is genuinely clarifying. Parnas, cohesion/coupling, dependency direction, minimal API surface, the import graph as structural access control, and the Hyper-Dank compatibility shim with its shadow-detection test are all well chosen. The "rendering split as a named decision" section, where the book explicitly justifies *not* over-structuring yet, is unusually mature and honest.
**Flag:** The module-map directory tree plus the per-file walkthrough plus "what changes for what reason" risks redundancy; the three sections say overlapping things. Consider compressing the per-file list once the tree is shown.
**Call:** Strong yes.

### Chapter 11 — Rules As Structured Data
**Working:** The three-spellbooks excerpt reframes provenance as the precondition for any policy decision, which is a sophisticated idea delivered lightly. Source-before-rule, the licence-determines-what-you-may-publish argument, precedence, visibility/export eligibility gated at the source level, and the auto-generated attribution panel are all strong, and the chapter doubles as the book's definitive answer to the SRD-rights question.
**Flag:** Confirm the Build Move's `gamebookRuleAttributions()` matches the name used in the body. This is one of the more abstract chapters; a single concrete "here is the bug this prevented" anecdote would lift it and match the book's better chapters.
**Call:** Strong yes.

### Chapter 12 — Saving The Game
**Working:** Among the best chapters. The Timekeeper's "all memory is unreliable; the question is how unreliable, in which directions, and whether the system is honest about the limits" is a thesis statement for the whole topic. Ephemeral-versus-durable, the save *document* with schema/version/adventureId as a "passport," validation with readable per-failure errors, migrations as "a promise to old players," golden-record fixtures, and the three storage strategies are all taught with real motivation. The tabletop framing (Fighting Fantasy's pencil-and-honesty save, the D&D table's save-by-consensus) is a lovely touch.
**Flag:** Very little. Long, but earns its length. Confirm the `localStorage` same-origin footnote and the `VACUUM INTO` detail stay accurate to the versions you target.
**Call:** Strong yes.

### Chapter 13 — The Name For What We've Been Doing
**Working:** Structurally the keystone, and it works: the book has been *practising* domain-driven design for eleven chapters and only now names it, which makes the vocabulary feel earned rather than imposed. The `src/nodes/AdventureNode` → `src/gamebook/Passage` refactor as a concrete example of ubiquitous-language drift is excellent. Entities/value objects, aggregates as consistency boundaries, bounded contexts, anti-corruption layers, and repositories are each tied back to code the reader has already seen. "D&D As A Well-Designed Domain" is a genuinely original framing.
**Flag:** Dense with named patterns; pace and the "read the types" test help, but watch for the parade effect, and make sure a reader who skipped a chapter can still follow the callbacks.
**Call:** Strong yes.

### Chapter 14 — Testing The Dungeon
**Working:** The test-party excerpt (scout, ledger-keeper, retreating fighter, reader in poor light, suspicious archivist) maps onto the test types beautifully and pays off with "the secret door on level two opens into a wall." The layered posture (unit → route → static build → artifact check → browser smoke), the emphasis on testing *negative* capabilities, "assertions with receipts," accessibility, screenshots, and acceptance notes is comprehensive and practitioner-real.
**Flag:** The longest chapter, and it risks reading as a tour of artefacts; the verification-manifest-as-living-documentation and PR-summary sections, while good, push it past where a beginner stays engaged. Consider whether acceptance notes / PR summaries could compress, since they're process rather than testing per se. The chapter is candid that the gamebook doesn't yet have a Pa11y gate — fine, but make sure that honesty doesn't read as a gap to a skimming reviewer.
**Call:** Strong yes, with a trim.

### Chapter 15 — Conclusion: The Labyrinth Never Ends
**Working:** A genuinely good close. The Wizard/Apprentice frame returns ("the next one will be yours to write"), the per-chapter recap is accurate and useful, and "the gamebook as a mirror" lands the book's core claim cleanly: the code is not illustrative of the ideas, the code *is* the ideas running. "What We Have Not Built" is the honest-scope move the book has earned the right to make.
**Flag:** The fourteen-idea recap is long; some readers will skim it. That's acceptable in a conclusion, but it could be a touch tighter. Confirm every chapter number in the recap matches the final running order.
**Call:** Publishable as-is, pending a number check.

### Appendix A — Glossary
**Working:** Exactly the right register: clear, self-contained definitions with occasional Dr-Johnson dryness ("one of the few genuinely elegant bits of arithmetic in a game otherwise full of tables") used sparingly. Interleaving RPG and programming terms suits the book's thesis. Cross-references ("See also:") are handled well.
**Flag:** Verify completeness against the body — every bolded term defined in a chapter should appear here (spot-check shows good coverage). Keep the humour at roughly its current density; one wry entry per several is right.
**Call:** Strong yes.

### Appendix B — Bibliography
**Working:** Three-part structure (cited / consulted / further reading) is correct for the genre, and the annotations are written "for the true nerds" exactly as intended — the Borges "fewer subscribers" and Montfort "a passage that has no guaranteed exit" notes are a pleasure and reinforce the voice even in the back matter. Citations are accurate and properly attributed.
**Flag:** Confirm the Liskov citation year/venue formatting is consistent (the text footnote and the bibliography entry give slightly different framings of 1987 OOPSLA vs 1988 SIGPLAN — both are defensible but should be reconciled). Otherwise clean.
**Call:** Strong yes.

---

## The call, for the book

Request the full, with enthusiasm. The concept is differentiated and commercial, the structure is sound and consistently executed, and the voice is, in the large majority of chapters, the kind that sells a technical book in a crowded category. The path to "acquirable" runs through: (1) a voice pass on Chapter 5 to bring it level with its neighbours; (2) a continuity-and-footnote sweep (the 4→5→6 seam, the Chapter 6 footnote, the gamebook/Campaign-Ledger path slips); (3) trims to the three longest chapters (8, 14, and the conclusion's recap); and (4) locking the SRD/OGL attribution and the chapter-numbering map before submission. None of these is structural. The book underneath is already built.