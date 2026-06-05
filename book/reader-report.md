# Reader's Report: *Dungeons & Data Structures*

**Submission:** Full manuscript, Chapters 1–15, with Glossary and Bibliography  
**Genre:** Software/technical, concept-led non-fiction  
**Comp shelf:** Pragmatic Bookshelf, No Starch Press; comps include *The Pragmatic Programmer* (Hunt & Thomas), *Domain-Driven Design* (Evans), *A Philosophy of Software Design* (Ousterhout)  
**Word count (estimated):** ~95,000 words

---

## One-Line Placement

A concept-led software engineering book for intermediate web developers, teaching graphs, data models, state machines, modules, and persistence through a playable gamebook and a campaign management application, with a confident and characterful voice that is largely its own best argument for the approach.

---

## Overall

This book works. That is the honest headline. The central conceit holds, the voice is alive, the structure is coherent, and the technical content is largely correct and well-sequenced. A developer who has been writing working code for a year or two and suspects there are better ways to organise it will find this book genuinely useful. That reader exists, the book is pitched at them accurately, and there is no direct competitor doing exactly this.

That said, the manuscript as submitted has real problems, and at least two of them are structural enough to require attention before acquisition. The voice is excellent in the first seven chapters and deteriorates measurably in the second half. The two running examples, Mt. Graphnor and Campaign Ledger, are not in balance; the Campaign Ledger sections grow progressively thicker as the book proceeds, and by Chapters 9 through 12 they are not illustrating the concept so much as documenting the application. There is also an unresolved tension in the book's intended audience that the introduction gestures toward without resolving: the book says it requires some web experience, then Chapter 3 assumes knowledge of HTTP idioms, then Chapter 4 introduces TypeScript interfaces without preamble, then Chapter 9 presents a mature `requireCampaignAccess` guard function that would baffle anyone who has not already built authenticated multi-user applications. The reader the introduction describes and the reader the later chapters require are not the same person.

None of this is fatal. The bones are sound. But the manuscript needs a structural edit, not a polish pass.

---

## What's Working

### The Voice

The strongest element of this manuscript is the prose. The author has a genuine voice: confident without being aloof, funny without undermining the technical content, personally specific in a way that earns trust. The footnotes in particular are excellent: the best of them extend the argument with genuine wit ("Four misses in a row is entirely consistent with a fair die. So are ten misses in a row. So is rolling your exact number four times in a row. The die does not know it owes you anything"), and they do not apologise for the book's nerdy preoccupations. The observation in Chapter 6 that "a fair die is different from a kind one" is a genuinely good sentence. The introduction's "programming felt like spellcraft" is a credible hook that does not overpromise.

The fictional excerpts are working well in the first half of the book. The Cartographer and the Adventurer (Chapter 2) and the Scribe and the Hero (Chapter 4) are particularly good: they dramatise the chapter's core tension without explaining it, and they reward the closing-echo at the end. The Doorkeeper sequence (Chapter 9) lands. The Timekeeper (Chapter 12) is one of the best in the book.

### The Concept

The core insight is real and well-executed: RPG systems and software systems share structural problems, and using one to illuminate the other is not forced. The book earns this claim through the details. The adjacency list explanation in Chapter 2 is clearer for the gamebook framing than it would be cold. The `Record<Ability, number>` discussion in Chapter 4 is a genuinely elegant use of a genuinely elegant TypeScript feature, explained well. The advantage/disadvantage probability analysis in Chapter 6 is mathematically accurate and pedagogically sound.

The DDD chapter (Chapter 13) is one of the better popular introductions to Evans' ideas that this reader has encountered: it is specific, it is grounded in code already written, and it does not oversell the framework as a prescription. The observation that the `Adventure` type is an aggregate root *because the domain made it one* is the kind of precise claim that distinguishes a writer who has actually used these ideas from one who has read about them.

### The Code

The code examples are, on the whole, clean, idiomatic, and correct. The injectable `RandomSource` pattern (Chapter 6) is a good teaching artefact for dependency injection without requiring the concept to be named. The reducer pattern in `applyCombatRound` (Chapter 7) is clean and well-motivated. The `isChoiceAvailable` function (Chapter 8) is readable and demonstrates multiple collection operations naturally.

### Structure Within Chapters

The Build Move convention is effective and consistently executed. The fictional excerpt / exposition / Build Move arc gives each chapter a recognisable shape, and knowing what to expect from the structure reduces the reader's cognitive overhead. The forward and backward links between chapters are well-maintained.

The bibliography is excellent. The annotations are written with genuine enthusiasm and point the reader toward real sources rather than performing scholarship. The footnote to the gambler's fallacy in Chapter 6 is exactly the right length and tone.

---

## What an Editor Would Flag

### 1. Audience Drift (Priority: Critical)

The introduction says the book is for a reader who has "some web experience, has written code that does something useful, and has started to suspect there are better ways to organise it." This reader is well-defined and reachable.

By Chapter 3, the book requires familiarity with HTTP verbs, status codes, and AJAX. By Chapter 4, it expects TypeScript interfaces to be "readable without introduction." By Chapter 9, it presents multi-tenant access control with campaign membership, ownership hierarchies, and route guards. The Campaign Ledger sections in Chapters 9 through 12 read as architecture documentation for an application the reader has never seen and cannot run, rather than as teaching examples. By Chapter 13, the DDD vocabulary is introduced correctly but leans heavily on the assumed weight of "the blue book" as a shared cultural reference that the stated beginner audience is unlikely to have.

This is the most significant structural problem. The fix is not simply adding more introductory caveats. It requires a decision: is this book for a developer who has built some things and wants conceptual vocabulary, or for a developer who has built substantial things and wants to name what they already know? The introduction promises the former; much of the content delivers the latter. The Campaign Ledger sections are the primary driver of this drift, and many of them could be significantly shortened or moved to a "how this looks at scale" epilogue within each chapter.

**Direction:** Audit every Campaign Ledger section in Chapters 9–12 against the stated reader. If the section requires knowledge the stated reader is explicitly said not to have, either cut it, rework the stated audience, or restructure it as a "here is what this looks like when the application grows up" coda rather than an integral part of the chapter.

### 2. Voice Degradation in the Second Half (Priority: High)

Chapters 1 through 7 are the strongest writing in the manuscript. The author's voice is consistent, the jokes land, the paragraphs have rhythm. From Chapter 8 onwards, something changes. The prose becomes more procedural and less characterful. The Quartermaster opening of Chapter 8 is good, but the chapter body reads closer to technical documentation than the earlier chapters. Chapter 10 is the weakest chapter in the book: the Scribe and the Archivist excerpt is adequate, but the body text about cohesion and coupling is the most generic piece of writing in the manuscript. The claim that high cohesion and low coupling are "stated as the observation that it is simple in principle and difficult in practice" and have been made "approximately as many times as software has been written" is the kind of vague filler that the author would have cut in the first half.

The chapter on DDD (Chapter 13) recovers some of the voice, but Chapters 8, 10, and 11 need work. This is almost certainly a draft-sequencing artefact: the later chapters were written after the earlier ones and received less iteration. The second half needs another pass with the author's voice as the primary criterion.

**Direction:** Chapter 10 in particular needs to be nearly rewritten. The Parnas observation about decomposition is the conceptual anchor; the chapter body should build outward from it with the same personal specificity the introduction brings to the spreadsheet anecdote. The current version catalogues module-related principles correctly but does not earn them.

### 3. The Fictional Excerpts in Chapters 8, 10, and 11 (Priority: Medium-High)

Several of the later excerpts are too on-the-nose. The Quartermaster discussing "counted resources" versus "membership questions" in Chapter 8 is the excerpt telling the reader what the chapter is about rather than dramatising the chapter's tension. The Scribe and the Archivist in Chapter 10 is doing the same thing: the Archivist explicitly names the problem ("nothing tells you where to look") in terms that could appear in the chapter's body text without translation. The best excerpts (Cartographer, Scribe and Hero, Timekeeper) introduce a problem the reader feels before they can name it; the weaker ones resolve the problem before the chapter begins.

**Direction:** The excerpt's job is to dramatise the *consequence* of the problem, not explain the solution. The Archivist should be discovering the filing disaster, not diagnosing it. The Quartermaster should be the moment of reckoning, not the taxonomy lecture.

### 4. The Chapter 9 Access Control Section (Priority: Medium)

Chapter 9 is conceptually sound but structurally overloaded. The gamebook's author/player split, the Campaign Ledger authentication model, the NPC visibility filter, the "forged mode flags" section, the player-safe publishing pipeline, and the artifact check are all present in one chapter. The result is a chapter that tries to be both a beginner introduction to access control and a reference for the specific implementation choices made in a private application. Neither audience is fully served.

The NPC visibility filter section in particular reads as Campaign Ledger implementation documentation rather than teaching material. The reader the book describes does not yet have NPCs with visibility flags. The concept the section is illustrating (filter at the data layer, not the rendering layer) is important and worth keeping; the specific Campaign Ledger code around it could be reduced to a paragraph with a single function signature.

**Direction:** The gamebook section (author/player split, artifact check) is doing real work and should stay. The Campaign Ledger sections should be distilled to the conceptual points they illustrate, not reproduced as working code.

### 5. Chapter 14 Is Incomplete (Priority: Medium)

The testing chapter is the thinnest in the manuscript. It has a good opening and a clear structure (the verification gates), but the sections on route tests, accessibility checks, and screenshots are not present beyond brief mentions. The chapter promises "a herald who checked whether the entrance proclamation was legible by torchlight" and "a suspicious archivist who read every scrolls looking for mechanisms the dungeon had not declared to its visitors," but neither of these is actually demonstrated. The route test section trails off with a single example, and the accessibility gate is acknowledged but not shown.

This chapter is arguably the most important one in the book for the target reader. A developer who suspects there are better ways to organise code is very likely someone who has been bitten by the absence of tests rather than by an inheritance hierarchy. The chapter needs to match the ambition of the analogy.

**Direction:** Expand the route test section to demonstrate at least one full test of player-visible behaviour. Add a concrete accessibility example. The Pa11y mention in the conclusion is not sufficient.

### 6. Minor Technical Quibble: The `ChoiceEffect` Ordering Claim (Chapter 8)

Chapter 8 states that effects apply "in a defined order inside `applyChoiceEffects`: items are added and removed, flags are set, and then hit points change. The order matters when a choice both removes a consumable and uses it to heal: the item should be removed before the healing is confirmed, so that a later validation pass cannot find the item still in the inventory and re-apply the effect." This is correct as a design intent, but the chapter does not demonstrate that there is, in fact, a "later validation pass" that would catch this. A technically literate reader will notice the gap between the stated reason and the demonstrated mechanism. Either show the validation pass or rephrase the motivation.

### 7. Chapter 11's Code Volume (Priority: Low-Medium)

Chapter 11 contains a large volume of TypeScript type definitions with limited running narrative between them. The `NamedRule`, `EquipmentRule`, `ClassRule`, `RaceRule`, `RuleSource`, `RULE_SOURCES` constant, and `RuleMechanicPayload` definitions appear in rapid succession without the kind of connective tissue that makes the earlier chapters' code feel purposeful. The chapter makes its central argument (source provenance governs what can be published) clearly and well; the volume of type definitions around it feels like it was included for completeness rather than teaching value.

### 8. Pretermitted Promised Mermaid Diagram (Chapter 7)

Chapter 7 includes a Mermaid state diagram for the combat state machine. The chapter text then says: "In the gamebook, these states are not stored as an explicit enum. They are implicit in the combination of `EncounterState.defeated`, `GameState.hitPoints`, and the outcome field on `CombatRoundResult`." This is a reasonable design decision. But the state diagram is presented as if illustrating the implementation, when it actually illustrates a design the implementation chose not to take. The diagram would be more useful either labelled as "here is the conceptual model, even though the code makes it implicit" or replaced with a diagram that accurately reflects the implicit state.

---

## Marketability

**Audience and hook:** The audience is real, the hook is credible, and there is no book currently doing exactly this on the main technical shelves. The gamebook format is distinctive without being gimmicky; the comparison to *The Pragmatic Programmer* is apt in the sense that both books are about programming attitudes rather than specific tool knowledge.

**Comps:** The closest current books are *A Philosophy of Software Design* (Ousterhout, Yaknyam Press) for the concept-led approach, and the Pragmatic Bookshelf back catalogue for the accessible-but-serious tone. Neither is a direct competitor on the RPG angle. *Land of Lisp* (Barski, No Starch) and *Structure and Interpretation of Computer Programs* are distant ancestors in the "teach CS through an unusual lens" tradition, but neither is this book's shelf.

**Shelf life:** The book's longevity is reasonably good. The core concepts (graphs, data models, state machines, modules, persistence, access control, DDD) are durable. The specific stack (TypeScript/Bun/Hono/htmx) is current but not faddish; the book correctly argues that the concepts travel even if the tooling does not. The risk is the Campaign Ledger sections, which contain enough implementation-specific detail that a reader in two years may find parts of them dated. This is a minor concern rather than a structural one.

**Rights and licensing:** The SRD 5.1 attribution handling is correctly managed throughout. The Fighting Fantasy references are historical and properly framed. No issues flagged on this front; the book is notably careful about the distinction between using SRD mechanics and reproducing proprietary content.

**Format:** At approximately 95,000 words, this is on the long side for the concept-led technical category; Pragmatic Bookshelf titles tend to run 60,000–80,000 words. The trim could come largely from the Campaign Ledger sections in Chapters 9–12 without losing any teaching content.

---

## The Call

**Read on with reservations.** This is not a pass. The book has genuine merit, a real audience, and a distinctive voice. The central argument is credible and executed with more technical rigour than most books in the RPG-as-metaphor subgenre manage. But it is not currently ready to publish without structural work.

The single thing most worth fixing is the audience drift. The book needs to decide which reader it is for and hold that reader steady from Chapter 1 through Chapter 14. The Campaign Ledger sections are valuable as a "here is how this scales" contrast, but they have grown to the point where they are competing with rather than illustrating the gamebook examples. The reader who would benefit most from this book is the one who can follow Mt. Graphnor without difficulty and finds Campaign Ledger aspirational but slightly over their head. That reader needs to feel welcomed through the whole book, not just the introduction.

What would move this to a strong yes: a revision pass that trims the Campaign Ledger sections to their conceptual payload, expands Chapter 14 to match its ambition, and brings the voice of Chapters 1–7 to Chapters 8–12. The structure is there. The argument is there. The voice is there, just unevenly distributed. This book can be finished, and it's worth finishing.