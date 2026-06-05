# Reader's Report: *Dungeons & Data Structures*

**Submitted by:** Daniel Kiernan  
**Format:** Complete manuscript, 15 chapters + appendices (glossary, bibliography)  
**Genre:** Software/technical — concept-led, narrative non-fiction  
**Comparable shelf:** No Starch Press, Pragmatic Bookshelf, The Pragmatic Programmer imprint

---

## Placement

A concept-led software engineering book for working web developers — roughly 1–4 years in — who learned to code outside formal education, using tabletop RPGs and gamebook fiction as the sustained teaching metaphor and two running code examples (a playable gamebook, *Mt. Graphnor*, and a campaign management app, *Campaign Ledger*) to carry the technical argument from graphs to domain-driven design across thirteen chapters. The closest comps are *The Pragmatic Programmer* (for its practitioner's voice and dual-axis format), *Land of Lisp* (for the single-domain-as-lens structure), and *Software Design by Example* (for the incremental worked example). Unlike all three, this book has a genuine personal origin story that it earns rather than performs.

---

## Overall

This is a genuinely strong concept executed with considerable craft, and I'd read on. The hook is real: learning software development through RPGs is not a cute gimmick here but a structural decision that pays out consistently over fourteen chapters. The voice is confident, warm, and has genuine opinions. The code is clean and idiomatic. The pedagogy is sound. The fictional framing — the epigraph vignettes — is often excellent.

The manuscript has two problems worth naming up front, because both are fixable at revision stage and both matter for the book's commercial position.

The first is audience drift. The introduction promises a beginner-friendly book for readers who have "built things for the web" and are accumulating intuitions they can't yet name. By Chapter 9, the book is discussing RBAC design decisions and bounded contexts. The difficulty curve is real and appropriate — the author flags it honestly — but the *reader* the later chapters actually need is more experienced than the reader the early chapters assume. That gap creates a risk: the person who buys this book for the introduction will feel abandoned by Chapter 10; the person who would genuinely benefit from Chapters 9–13 may not pick it up because the framing sounds too introductory. This isn't unsolvable, but it needs a more precise audience statement and possibly some rewriting at the seams.

The second problem is the Campaign Ledger codas. As currently structured they are the most interesting technical material in the book — genuinely sophisticated, showing what the ideas look like under real production pressure — but they function as opt-in asides ("not required reading") at the end of each chapter. The risk is that the reader who most needs them skips them, and the reader who reads them treats them as supplementary rather than essential. The author needs to decide whether Campaign Ledger is a first-class through-line or a bonus track, and the structure should commit to that choice.

---

## What's Working

**The concept earns its keep.** This is the test a concept-led book lives or dies by — does the central metaphor illuminate the technical ideas, or is it dragged kicking and screaming onto concepts it doesn't fit? For the most part, it genuinely works. The Five Room Dungeon as a graph theory teaching structure (Chapter 2) is elegant; the Quartermaster's taxonomy of items versus counts versus flags (Chapter 8) is the best explanation of collection design choices I've read in any technical book; the Dungeon Master's screen as a concrete model of bounded context and access control (Chapter 9) is quietly delightful. The author has clearly thought hard about where the metaphor earns its keep and where it strains, and the footnote in Chapter 1 that acknowledges this risk directly is exactly the right move.

**The voice.** The prose is characterful without being showy. The author has opinions — the section on *hiding buttons is not access control* is pleasingly combative; the footnote on the DRY principle and its costs is better than most textbook treatments — and the presence of a genuine, sometimes self-deprecating authorial persona (the Five Room Dungeon Python disaster in Chapter 10; the Campaign Ledger `BaseEntity` false start in Chapter 5) creates real trust. The self-contained chapter vignettes are often the best writing in the book: the Wizard and the Apprentice, the Scribe and the Hero, the Doorkeeper scene in Chapter 9. Several of these are genuinely good prose by any standard.

**The pedagogical sequence.** The build-up from data model → rules → state machine → persistence → domain design is the right order, and the "Build Move" sections that close each chapter are a strong structural device. The reader knows exactly what they have after each chapter and where it connects to what came before. The graph validator in Chapter 2 seeding the artifact checker in Chapter 14 is a satisfying long-form payoff.

**The code is good.** This matters more than it sounds: a surprising proportion of concept-led technical books have sloppy or inconsistent code. The TypeScript here is idiomatic, the examples are genuinely minimal, and the separation of concerns (inject the `RandomSource`; keep domain modules framework-free; `StorageAdapter` as a repository interface) is demonstrated rather than merely described. The dice chapter (Chapter 6) in particular — the `RollResult` structure, the injectable RNG, the `DamageExpression` as a value object — is excellent technical pedagogy.

**The footnotes.** They're doing real work: historical context, honest caveats, the occasional dry observation that would interrupt the body but earns its place at the bottom of the page. The footnote on the gambler's fallacy and the footnote distinguishing `Math.random()` from cryptographic security are both better than the standard textbook treatments of the same points.

**The SRD and licence handling.** Chapter 11 on rules as structured data and Chapter 1's note on licences and originality are both handled with a care and clarity unusual in this genre. The manuscript is clearly aware of the legal landscape and has made considered decisions about it. This will matter to any publisher with a legal department.

---

## What an Editor Would Flag

**1. The audience problem (highest priority)**

The introduction's target reader — "built things for the web," "written code that does something real," "accumulated intuitions they can't yet name" — is about a year into their practice. The reader the later chapters actually need is closer to three or four years in, with some exposure to multi-user applications, deployment pipelines, and the experience of inheriting someone else's codebase. These are genuinely different people.

The fix isn't to rewrite the whole book. It's to be more honest in the introduction about the curve — specifically, to say something like: *this book starts at the level of someone who has built a web form; by the end it is addressing someone who has built an application that multiple people use over multiple sessions.* That's actually a selling point, not a caveat, if framed correctly. The introduction currently undersells the back half of the book.

The chapter-level signals are also slightly inconsistent. Chapter 3 says HTML and HTTP verbs are assumed; Chapter 4 says TypeScript interface notation should be readable without introduction; Chapter 9 assumes experience with endpoints and route guards. These are calibrated correctly but they're scattered. A single "who this book is for / what it assumes" section — more precise than what's currently there — would help readers self-select and set expectations more accurately.

**2. The Campaign Ledger codas: commit to a structure**

The codas as currently written are, to be blunt, where the most technically interesting material lives. The Campaign Ledger false start in Chapter 5 is the most useful practical advice in the book. The multi-user access control design in the Chapter 9 coda describes the single most common architectural mistake junior developers make. The bounded context discussion in Chapter 13 is better than Evans himself on the practical implications.

Flagging them as "not required reading" is underselling them badly. One of two structural options:

*Option A:* Elevate them. Cut the coda labelling; weave the Campaign Ledger material into the body of each chapter as the "what this looks like at scale" beat, rather than an afterthought. This makes the book longer but more coherent and correctly signals to the reader who will most benefit from it (a working developer, not a complete beginner) that this is the level the book is actually pitched at.

*Option B:* Commit to the two-track structure more explicitly. Frame the codas as a deliberately optional "advanced" track at the start of the book, and make the split into a feature rather than an apology. Some technical books do this well (sidebars, grey boxes, "want to go deeper?" sections). If the codas are going to be optional reading, they should look like optional reading from page one.

Currently they're neither fish nor fowl: too sophisticated to be afterthoughts, too easily skippable to function as essential material.

**3. The gamebook pacing across chapters 8–12**

The middle chapters (8 through 12) are individually solid but collectively the book's softest section. Chapter 8 (inventory) is a little slow relative to the clarity of the concept; Chapter 12 (persistence) covers the save document in thorough detail but the section on ephemeral versus durable state is ground most working developers have covered and doesn't earn its length. The chapter on modules (Chapter 10) is excellent but front-heavy — the Five Room Dungeon retrospective is charming but runs slightly long before the technical argument gets going.

This isn't a structural problem but a pacing one. A pass focused on tightening these four chapters — probably cutting 10–15% — would improve the book's overall momentum without losing anything essential.

**4. Minor but worth noting: the 2024 framing**

The book references Daggerheart (2024) and its Hope/Fear system across multiple chapters, which is a smart choice — it's a genuinely interesting mechanical comparison and it's current. But it also means the book has a shelf-life concern: a 2024 release is relevant now and will be less relevant in five years. The SRD material, Fighting Fantasy, and the broader software design concepts are durable; Daggerheart as a running comparison is a mild risk. Worth noting for a publisher thinking about longevity.

---

## Marketability

The hook is strong and genuinely differentiating. "Learn software engineering through D&D" is a single clear sentence, which is more than most software books can say. The comp shelf is real: No Starch has published weirder premises (*Land of Lisp*, *Clojure for the Brave and True*) to receptive audiences. Pragmatic Bookshelf is the natural home if the author wants a publisher with an existing web/TypeScript readership. The audience is well-defined by interest if not quite by experience level — the TTRPGs-and-software Venn diagram is large enough on the internet to support a meaningful launch.

The running code examples are a genuine commercial asset. A book that ships with a working, playable gamebook as its teaching artefact has something no other software book currently offers, and that's a strong differentiator for marketing purposes.

The licence handling (SRD CC-BY, original gamebook, no reproduction of Fighting Fantasy IP) is clean and well-documented. A publisher's legal department should be satisfied by what's already in the manuscript.

---

## The Call

**Read on with reservations.** The bones here are excellent — concept, voice, pedagogy, code quality, and structural ambition are all in the top tier for this genre. The reservations are about the audience targeting and the Campaign Ledger coda structure, both of which are revision problems rather than fundamental problems. Neither requires rethinking the book's premise.

**What would move this to a strong yes:** A sharper audience statement in the introduction (honest about the difficulty curve); a structural commitment on Campaign Ledger (elevate or clearly demarcate, don't hedge); and a light pacing pass on Chapters 8–12.

The most useful single sentence in this report: the book is currently selling itself as an entry-level concept guide and delivering a practitioner's manual — and the practitioner's manual is the better book.

---

*This report covers the complete manuscript as submitted. Code has been spot-checked but not compiled or tested against the described outputs; technical accuracy assessment is based on reading rather than execution.*