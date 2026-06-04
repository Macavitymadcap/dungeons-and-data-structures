# Reader's Report: *Dungeons & Data Structures*

*A full manuscript appraisal of all fifteen chapters plus glossary and bibliography (~66,000 words).*

---

## Placement

A concept-led technical book that teaches software engineering and computer science through tabletop RPGs and a Fighting Fantasy-style hypertext gamebook, built in TypeScript/Bun/Hono/htmx/SQLite. The shelf is No Starch / Pragmatic Bookshelf / Manning: the playful-but-rigorous "learn the hard ideas through one running project" tradition. Comps below.

## Overall

This is good. Not "promising for a first-timer" good; good in the way that survives a stranger picking it up in a shop and reading three pages. The central conceit (a gamebook *is* a directed graph, a save file *is* a versioned persistence contract, so let's build a real one and name the ideas as they surface) is not a gimmick stretched over a syllabus. It actually holds for thirteen chapters, which is the thing these books usually fail to do by chapter four. The voice is distinctive and consistent, the SRD licensing is handled with a care that will save you a great deal of grief, and the structural discipline (every chapter opens on a fictional excerpt and closes by returning to it) is executed cleanly enough that I stopped noticing the scaffolding and just read.

So this is not the "beautiful but unpublishable" case, nor the "rough but commercial" one. It's the rarer middle: a manuscript that already works on its own terms and needs a technical-accuracy pass, not a rewrite. The single thing standing between this draft and a confident yes is that **the printed code does not currently typecheck as a set, and the book's entire thesis is "show me it works, don't just assert it."** That gap is fixable and mechanical, but until it's closed it quietly undermines the exact value the book is selling. More on that below, because it's the most important sentence in this report.

Read on with strong interest, conditional on a correctness pass.

## What's working (protect this)

**The voice is a real asset, and it is not AI-flat.** The tell of a generated draft is fluent, rule-obedient, and fingerprintless. This isn't that. The spreadsheet "that had eaten three others and felt no remorse"; the admission that you "used to write 'all tests passing ✓' in PR descriptions and feel quite good about it"; the `BaseEntity` confession that opens Chapter 5 ("I started building Campaign Ledger the wrong way"); the homebrew-spell-leak story in Chapter 11. These are lived, specific, and slightly self-incriminating in the way real practitioner writing is. They're also load-bearing: they're where a reader decides to trust you. Keep reaching for them. The lowest-voltage passages in the book are the ones where this hand lifts off (see below).

**The dual-example architecture earns its keep.** Mt. Graphnor as the hold-it-in-your-head teaching engine and Campaign Ledger as "the same idea after it grew up and met real users" is a genuinely smart structural decision. It lets you teach `Character` as a flat interface and then show the same concept as a composed read model across SQLite tables without either feeling like a bait-and-switch. The Chapter 5 inheritance-to-composition arc, anchored by the real false start, is the best chapter in the book for this reason.

**The closing-echo convention works every single time.** The Cartographer's unreachable Chamber, the Oracle's fair-but-unkind die, the Hourglass and the goblin-behind-the-cart, Ad Min at the gate. Each excerpt sets a tension and each chapter pays it back without over-explaining. This is hard to sustain and you've sustained it. The Chapter 7 close ("Running the round to completion before showing the result is not a performance optimisation. It is a commitment to coherent state") is the model.

**The SRD/rights posture is exemplary and de-risks the book commercially.** CC-BY 4.0 named, linked, footnoted; dedicated `RuleSource` records; a glossary attribution note; explicit separation of "we use the mechanics and write our own prose." Daggerheart, Fighting Fantasy, Lone Wolf and the rest appear as influence and comparison, not reproduction. An acquisitions editor's legal reflex relaxes here, which matters.

**Footnotes are doing genuine Pratchett-tradition work** without becoming a parallel book. The 418 teapot, "you die alone," the gambler's-fallacy aside, the Xanadu "almost finished for six decades" line. They carry the digressions so the body stays clean. Good discipline.

**Concept sequencing is mostly honest.** You track what the reader knows and largely refuse to use a construct before introducing it. The injectable `RandomSource` is introduced once and then pays dividends across testing, combat, and the DDD chapter. That's the sign of a real spine rather than a topic pile.

## What an editor would flag (priority order)

### 1. The printed code does not typecheck as a whole, and that is a thesis-level problem

This is the one that matters. Your book argues, repeatedly and well, for "visible proof over confident assertion," and Chapter 15 says outright: *"the code is not illustrative of the ideas: the code is the ideas, running."* A reader who types in the listings, or who simply reads them as a careful programmer, will find that several core types and functions contradict each other across chapters. That doesn't read as a typo; it reads as the code never having been compiled as a set, which is precisely the sin the book spends a chapter warning against. Fix this and most of the rest of the report is polish.

The errata I found on a single read (almost certainly not exhaustive):

- **The damage/dice type has three or four incompatible shapes.** Chapter 6 models damage as **string notation** with `rollDamage(notation: string, modifier: number, rng)`. Chapter 7's `resolveAttack` types `attack.damage` as a `DamageExpression` **object**, calls `rollDamage(attack.damage, rng)` (two args, an object), and reads `attack.damage.type`. Chapter 11's `ClassRule.hitDie` is a `DamageRoll` object `{ dice, sides, modifier, type }`, while `EquipmentRule.damageDice` is a **string**. Chapter 13 then defines the damage-roll value object as `{ dice, sides, modifier, type }`. Chapter 5's `AttackProfile` is `{ name, bonus, damageDice, damageType }`. These cannot all be the same codebase. Two footnotes also claim `DamageExpression` / `DamageRoll` are "from Chapter 6," but Chapter 6 defines neither. **Fix:** pick one canonical damage representation, define it once where it's first used, and propagate. This is the highest-value single edit in the book.

- **Chapter 7, `CombatRoundResult` vs `resolveCombatRound`.** The interface declares `playerAttackRoll` and `monsterAttackRoll`; every return literal uses `playerAttack` and `monsterAttack`. The victory branch also omits the required `playerTemporaryHitPoints`, which `applyCombatRound` then reads. As printed, this does not compile.

- **Chapter 9, `listNpcSummariesForCampaign`.** The body references `viewerId`, which is never a parameter (the params are `campaignId` and `viewerRole`); `campaignId` is unused and `npcs` is unscoped. As printed it throws.

- **Chapter 14, the headline unit test contradicts the Chapter 2 validator.** The test "reports an unreachable passage" asserts issue codes `"dead-end"` and `"unreachable"`, but the `ValidationIssue` union in Chapter 2 uses `"unreachable-passage"`, `"empty-passage"`, `"targetless-choice"`, etc. The flagship example of your testing chapter would fail against your own validator. This one is especially costly because it's *in the testing chapter*.

- **`GameState.log` drifts.** Chapter 7 treats `log` as `string[]` (it pushes string literals and spreads them into `state.log`); Chapter 12's `GameState` declares `log: GameLogEntry[]`.

- **Minor signature drift.** `isChoiceAvailable` is `(choice, state)` in the Chapter 8 body but `(choice, state, adventure)` in that chapter's Build Move; the body also names a `requirementsMet` helper that's never shown and isn't in the Build Move.

The likely root cause is benign: you're hand-extracting simplified snippets from a real, evolving repo, and the snippets were edited across drafts without being recompiled together. The cure is mechanical and worth building into the production pipeline: extract every fenced code block into a single TypeScript file (or a tested companion repo), run `tsc --noEmit` and `bun test` over the union, and treat a green run as a gate before the manuscript can ship. A literate-programming or doctest-style extraction would make drift structurally impossible, which is, pleasingly, exactly the argument Chapter 14 makes about artifact checks. Practising it on your own listings would be the most on-brand thing the book could do.

### 2. Decide, in one sentence, who this reader is, and hold them steady

The intro says: not for complete beginners, comfortable with HTML/HTTP by Chapter 3 and TypeScript interface notation by Chapter 4, but no CS background assumed. The gamebook track honours that beautifully. The **Campaign Ledger** comparisons sometimes don't: by the back half you're casually deploying SQL `CHECK` constraints, denormalised read models, anti-corruption layers, repository interfaces, bounded contexts, the Liskov Substitution Principle, and the Dependency Inversion Principle. That's a more advanced reader than the one who needed `interface` explained in Chapter 4. The two-track structure ("gamebook teaches it small, Ledger shows it grown up, you needn't follow both") is a reasonable answer, and you state it. But state the contract more sharply up front, and audit the Campaign Ledger sections for the moments they stop explaining and start assuming. The risk isn't that the advanced material is wrong; it's that the near-beginner you invited in Chapter 1 quietly drowns in Chapter 11.

### 3. The chapter template is your backbone and your main pacing risk

Every chapter runs the same beats: excerpt, "In Chapter N we…", H2 sections, a cross-system comparison (Fighting Fantasy / D&D / Daggerheart / Skyrim), a Campaign Ledger comparison, the Build Move, the closing echo, footnotes. The uniformity is mostly a strength, but the **"how other systems do it" + "Campaign Ledger comparison"** double-beat is the most formulaic and lowest-voltage section in nearly every chapter, and by Chapters 8 through 12 a reader can feel it coming. These are also exactly the passages where your voice flattens toward competent-technical-exposition. Two fixes: (a) vary the mid-chapter beat occasionally, or fold the cross-system comparison into the prose rather than running it as a labelled section; (b) cut the Campaign Ledger comparison entirely in the one or two chapters where it adds least, so its appearance stays a treat rather than a tax.

### 4. Honest but worth reconciling: the gamebook's "done" list runs slightly ahead of reality

The introduction lists the finished gamebook's features in confident present tense ("a verification suite," author/player modes, etc.), and Chapter 15 says Mt. Graphnor's published build "contains no author tooling," its graph is sound, and so on. But Chapter 14 admits the Pa11y accessibility gate "is the next step in the verify pipeline rather than the current one" and "the gamebook will match it when the book goes to press," and Chapter 15's "What We Have Not Built" is candid about the rest. The honesty is genuinely a strength and very on-brand. Just make sure the intro's present-tense feature list and Chapter 14's "this part is still aspirational" admissions agree, or the careful reader (your reader) catches the seam.

### 5. A planned chapter appears to have been dropped without the intro noticing

Your own chapter plan had a Chapter 13 "Authoring A Branching Adventure"; the manuscript's Chapter 13 is the domain-driven-design chapter, and there's no dedicated walkthrough of *authoring* an adventure (writing content, using the preview/validation surface as an author). The authoring tools are described piecemeal across Chapters 2, 9 and 14, which may well be enough. But the intro still sells "an authoring surface with previews and validation" as a thing, and a reader expecting a hands-on authoring chapter won't find one. Either add a short authoring chapter or adjust the framing so nothing is promised that the book doesn't deliver.

### 6. Line-level errata (a representative sample, not a full proof)

You asked for the fine-toothed comb, so: Ch2 excerpt "But How do you get in?" (capital mid-sentence) and "a pencil and an rubber" ("a rubber"); Ch4 the muddled "Not a story; backstory or personality" and an inconsistent `"Good"`/`"Good,"` in the same excerpt; Ch6 `muttering "Doesn't feel fair.".` (doubled stop); Ch8 "The Quartermaster pull the quill" ("pulled") and the leftover "The same validation **runs extends** to items and flags"; Ch5 footnote `[^4]` is missing its colon; Ch13 references a `CheckDefinition` with a `kind` field that's never shown. And a real cross-reference bug: the **glossary ends with "See Appendix C for full attribution," but there is no Appendix C** (you have Appendix A glossary, Appendix B bibliography). Point that at the bibliography or add the attribution appendix. Finally, a counting slip: Chapter 15 repeatedly says "fourteen connected ideas / fourteen rooms / fourteen chapters," but the enumerated list runs Chapter 2 through Chapter 14, which is thirteen. Either say thirteen or fold the introduction explicitly into the count.

## Marketability

**Hook, in a sentence:** *learn how real software is designed by building a working Fighting Fantasy gamebook, with D&D as the worked domain.* That's a strong, sayable hook with a built-in audience: the enormous overlap between people who write code and people who play tabletop RPGs. It is also a hook that survives the elevator, which most technical books' don't.

**Audience:** advanced-beginner to early-intermediate developers who want the "why" of structure (graphs, data modelling, composition, state machines, access control, DDD, testing) rather than another framework tutorial; secondarily, RPG-literate hobbyists levelling up their programming. The dual-audience handling (briefly orienting non-programmers to code and non-players to D&D) is mostly well judged.

**Comps** (real, checkable, and useful for positioning): *Land of Lisp* (Barski, No Starch) for the playful-teaching-through-games register; Scott Wlaschin's *Domain Modeling Made Functional* (Pragmatic Bookshelf) for the DDD-through-a-domain spine, which your Chapter 13 is squarely in conversation with; *Game Programming Patterns* (Nystrom) for patterns-via-games; Al Sweigart's game-based intros for the "build a real thing" pedagogy. The closest and most important to address head-on is **Carson Gross et al, *Hypermedia Systems*** (the htmx book): you share its HATEOAS/progressive-enhancement thesis, you cite it, and you should position this book as its gentler, narrative, RPG-flavoured cousin rather than risk looking derivative of it. "No direct competitor" would be a red flag here; happily, you have several, and a clear differentiator: nobody else is teaching this particular bundle of concepts through a *playable, buildable, licence-clean gamebook*.

**Rights/legal:** handled. The SRD attribution is correct and present, the Fighting Fantasy/Daggerheart references are influence-not-reproduction, and `@macavitymadcap/hyper-dank-ui` is your own. No snags I can see.

**Shelf-life:** the concepts (graphs, DDD, state machines, persistence contracts, access control) are durable and will age well, which is what editors want. The stack is the exposure: Bun and especially htmx are fashionable-now and could date, and a 2027 reader may find htmx less ubiquitous than the prose assumes. You've insulated against this correctly ("the concepts travel; the code just looks different"), but consider one more explicit sentence somewhere prominent reassuring the reader that the book is pegged to the ideas, not the tools' current releases.

## The call

**Read on with reservations, leaning toward request-the-full-and-strong-yes once the correctness pass is done.** This is a publishable book with a genuine angle, a real voice, and an unusually clean rights position. It is held back from an unqualified yes by one specific, mechanical, and fully fixable thing: the code listings contradict each other and would not compile as a set, which is fatal to a book whose whole argument is that you should be able to *see* it work.

What moves it up a tier, in order:

1. **Make every printed listing compile and the printed tests pass, as a verified set.** Build the extraction-and-`tsc`/`bun test` gate into production. This is the difference between "trust me" and the thing the book keeps telling the reader to demand.
2. **Pick one canonical damage/dice type** and propagate it so the concept ledger stays honest end to end.
3. **Sharpen the audience contract** and audit the Campaign Ledger sections for the moment they stop teaching and start assuming.
4. **Vary or thin the recurring comparison beat** so the back half keeps the momentum the front half has.
5. **Sweep the errata** (the Appendix C reference, the "fourteen," the typos) in a standard copyedit.

Do those and this is a book I'd be confident putting in front of an acquisitions meeting. The hard part, the part most authors can't do and you already have, is the voice and the spine. The rest is craft you clearly know how to apply; you wrote a whole chapter about it.