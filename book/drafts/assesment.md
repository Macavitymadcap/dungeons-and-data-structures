# Dungeons & Data Structures: Full Book Assessment

Assessment against the DaDS chapter-writer skill checklist and the author's notes in `00-notes.md`. All fifteen chapters reviewed, including the reinstated Chapter 5.

---

## Structural Overview

The manuscript is now complete across all fifteen chapters. The chapter map holds:

| # | Title | Assessment |
|---|-------|------------|
| 01 | Introduction: From Spreadsheets To Spellcraft | Strong |
| 02 | Choose Your Node Adventure | Strong |
| 03 | Hypertext, HATEOAS, And The Gamebook Page | Good |
| 04 | Character Sheets As Data Models | Strong |
| 05 | Classes, Composition, And The Limits Of Inheritance | Strong |
| 06 | Dice, Probability, And Risk | Strong |
| 07 | Combat As An Event Loop | Strong |
| 08 | Inventory, Resources, And Encumbrance | Good |
| 09 | The Dungeon Master And The Admin | Good |
| 10 | Adventure Modules And Programming Modules | Good |
| 11 | Rules As Structured Data | Good |
| 12 | Saving The Game | Strong |
| 13 | The Name For What We've Been Doing | Strong |
| 14 | Testing The Dungeon | Good |
| 15 | The Labyrinth Never Ends | Good |

---

## Notes in `00-notes.md`: Item-by-Item

### ✅ Introduction explains why a hypertext gamebook
Chapter 1 has a solid paragraph in "How To Read It" explaining the case: the hypertext format demonstrates what software can do that a physical gamebook cannot — conditional logic, persistent state, node-chaining across hundreds of locations, outcomes that depend on earlier choices. The nostalgia justification is present and handled with self-awareness ("considerably cheaper than a sports car"). Addressed.

### ✅ Code cleanliness
Code samples across all chapters are readable throughout. No nested ternaries, no magic numbers, no unexplained language tricks. The `rollD20Check` function in Chapter 6 is the most complex and is well-commented inline. The `Array.from` usage in `rollDamage` is explained in a code comment. 

**One gap:** none of the test code samples in Chapter 14 use the `// Arrange`, `// Act`, `// Assert` comment heading pattern the notes explicitly require. The tests are clear, but they lack the instructional scaffold. This needs adding to all reproduced tests in Chapter 14, and to the guard tests in Chapter 9 if any are reproduced there.

### ✅ Dual audience considered throughout
The book handles this well in all fifteen chapters. RPG concepts (Armour Class, Skill checks, advantage/disadvantage, hit dice, spell slots, saving throws, the Five Room Dungeon) are introduced with enough context that a non-player can follow. Programming concepts are similarly scaffolded. Chapter 6 is particularly strong on this balance. The later chapters (10, 11) are more technically dense and the RPG thread thins — addressed separately below.

### ✅ Stack justification in introduction
"How To Read It" addresses this directly and well: the tools are not claimed to be objectively optimal, but "best in software development most often means the set of tools the team is most comfortable with." Exactly what the notes asked for.

### ✅ Excerpt characters not using meta-language — mostly
Most excerpts are clean. Three cases require attention (detailed in the Excerpt Assessment section below). The broad discipline holds: characters discuss lineages, checkpoint stones, brass plates, ledgers, and test parties rather than inheritance chains, save files, HTML, and test suites.

### ✅ HTTP status code footnote
Chapter 3, footnote 5a gives an excellent overview of all five status code families, and links to the 418 I'm a Teapot. Addressed.

### ⚠️ Formulaic constructions — partially addressed
The "not an X but a Y" pivot appears throughout the manuscript. At an individual chapter level most instances read naturally; the problem is cumulative frequency. A rough count across the book: roughly 20 instances in body prose. Several cluster in Chapters 3, 4, and 13. Chapters 3 and 4 are worth revisiting specifically for this pattern. Elsewhere the prose is varied enough that it reads as a style choice rather than a tic.

One-sentence paragraphs are largely under control. Chapters 9 and 10 contain a few runs where adjacent short paragraphs could be merged without losing anything.

### ✅ Domain-Driven Design thread — now a full chapter
Chapter 13 is entirely the DDD chapter: ubiquitous language, entities and value objects, aggregates, bounded contexts, and the anti-corruption layer. Well-written, earns its place, and connects convincingly to the work done in preceding chapters. The thread is seeded in Chapter 1's "Software Needs A World To Model" and in the footnote at the end of Chapter 4. Addressed.

### ⚠️ Chapter 12 forward reference to Chapter 13 is wrong
Chapter 12's closing paragraph promises a Chapter 13 about "the other kind of authoring: not the player's state, but the adventure's content itself — Writing a branching adventure is not just prose; it is building a structure that a validator can inspect..." This describes the old Chapter 13 (authoring pipeline), not the current one (DDD). The forward reference needs rewriting to promise the DDD chapter.

### ✅ Mt. Graphnor treated as finished product — with one exception
Chapters 1–14 treat Mt. Graphnor as a short, complete, real adventure. Chapter 15 is the exception: the "What We Have Not Built" section explicitly states that the accessibility gate "is described in Chapter 14 and not yet implemented." The notes say to treat Mt. Graphnor as finished and not to speculate about future development. This sentence should be removed or the framing adjusted so it does not present a known unimplemented feature in the shipped product. The other items in that section (the larger 400-node adventure, a second adventure to validate the module system) are correctly framed as future work on different projects, not gaps in Mt. Graphnor itself.

Chapter 11, footnote 7, refers to "the prototype" in relation to the gamebook's condition implementation. Should read "the current implementation" or "the gamebook."

### ✅ RPG/fantasy thread in chapters — mostly consistent
Strongest in Chapters 1–8 and 13–15, where the RPG vocabulary is either the subject of the chapter or woven naturally into examples. The weakest points:

- **Chapter 10** (modules): The Scribe/Archivist excerpt is strong, but the body text drops the archive metaphor after the opening and stays in pure software territory for most of its length. A brief paragraph linking cohesion/coupling back to why adventure modules in D&D have explicit interfaces (the GM knows the module's start and end, but the internal room layout is the designer's business) would cost little and strengthen the thread.
- **Chapter 12** (persistence): Good excerpt and good body text, but the chapter doesn't mention how different tabletop systems handle "saving a game" — the Fighting Fantasy scratch-off approach, D&D's "we ended here" convention, the checkpoint stone as a genre trope. A short paragraph noting this context would earn its place.

### ✅ Glossary — not yet present
No glossary appendix exists in the uploaded files. This may be planned for a separate document not included in this batch, but every bolded term introduced in body text (HATEOAS, DAG, Liskov Substitution Principle, ubiquitous language, aggregate root, bounded context, idempotent, progressive enhancement) should appear in a glossary with a Dr Johnson-inflected definition. The notes are explicit about this.

### ✅ Bibliography — not yet present
Similarly absent. The footnotes throughout are extensive and well-sourced, making the bibliography straightforward to compile, but it does not exist yet.

---

## Voice and Style Assessment

### Overall verdict
The voice is consistent and strong across all fifteen chapters. British English is maintained throughout; no American spellings found. The author's characteristic register — technically confident, lightly funny, personally grounded, honest about uncertainty — is present and natural. The prose does not condescend. Personal specificity is deployed well (the spreadsheet that "had eaten three others and felt no remorse" earns its place; "Lurking somewhere in a Google Drive folder" is characterful rather than neutral).

### Em Dashes
**Three instances require attention:**

- **Chapter 2**, lines 70–71: "is no longer playable as Robertson intended — the platform evolved in ways that broke the edge structure — which makes it an accidental illustration..." These two em dashes are used as parenthetical pivots in body prose, which is explicitly prohibited. Rewrite as: "...is no longer playable as Robertson intended. The platform evolved in ways that broke the edge structure, which makes it an accidental illustration..."
- **Chapter 7**, lines 18 and 24: Two interrupted speech instances in the excerpt — `"Yes," said the Dungeon Master, "but—"` and `"That's exactly what I've been—"`. These are interrupted dialogue. The spirit of the rule is to prevent em dashes being used as stylistic substitutes for correct punctuation in prose; interrupted speech in dialogue is a different usage. However, since the rule in the skill document is stated absolutely, replace with ellipsis: `"but..."` and `"been..."`.
- **Chapter 14**, line 19: Same case — `"The seventh one—"` in the excerpt, interrupted mid-sentence. Same fix: ellipsis.

### British Spelling
Clean throughout. "Armour", "colour", "organised", "recognise", "behaviour" — all correct.

### Closing Echoes
All fifteen chapters pass this check. Every closing returns to the opening excerpt's characters, objects, or tensions:

- Ch01: Spreadsheet still there. "There's a door ahead. You know what to do." ✅
- Ch02: Chamber of Answered Questions, the Cartographer's unresolved question. ✅
- Ch03: The brass plate panel, "the door that did not lie." ✅
- Ch04: Scribe's instinct and Hero's instinct, both correct in different registers. ✅
- Ch05: The Wizard's lineage model, good for one kind of magic but not magic in general. ✅
- Ch06: The Oracle's distinction between a fair die and a kind one. ✅
- Ch07: The Hourglass, the goblin behind the cart, run-to-completion. ✅
- Ch08: The Quartermaster, membership vs counting, the next room. ✅
- Ch09: The Admin's keys, the Doorkeeper's objection, the right actor/wrong resource. ✅
- Ch10: The great ledger, the Archivist's separate shelves. ✅
- Ch11: The three spellbooks, provenance as prerequisite for policy. ✅
- Ch12: The checkpoint stone, the Timekeeper's honesty about memory. ✅
- Ch13: The blue book, the Scribe having done it for three years without the vocabulary. ✅
- Ch14: The test party, the gap between designed, built, published, and received. ✅
- Ch15: Wizard closes the spellbook, Apprentice writes the next one. ✅

---

## Excerpt Assessment

| Chapter | Excerpt | Assessment |
|---------|---------|------------|
| 01 | Wizard & Apprentice (spreadsheet/spellbook) | Excellent. Atmospheric, allegorical, no meta-language. The "Anyone already has" punchline earns its position. |
| 02 | Cartographer & Adventurer (Chamber of Answered Questions) | Excellent. One of the best in the book. The unreachable beautiful room is precisely the chapter's argument. |
| 03 | Adventurer & the Door (brass plates) | Good. The panel offering exactly the available choices is clean HATEOAS allegory without naming HATEOAS. |
| 04 | Scribe & Hero (Brandavar) | Excellent. "I contain multitudes" / "That will not fit in the ledger" lands well. The Scribe's patience is earned. |
| 05 | Wizard & Apprentice (lineage vs Cleric's power) | Excellent. The allegory for inheritance vs composition is implicit — the reader draws it themselves. "Theoretical" is the right comic note to end on. No meta-language. |
| 06 | Oracle & Dice | Strong. "The difference is smaller than you'd think" is a good closing line. No meta-language. |
| 07 | Dungeon Master & Hourglass | Good. The goblin ending up behind the cart is the right image for inconsistent state. No meta-language. |
| 08 | Quartermaster & Adventurer | Strong. "Eating them." lands. The partridge anticipation joke works. No meta-language. |
| 09 | Doorkeeper & Admin | Good. "You are *an* admin" lands. The repeated-conversation patience is nicely characterised. No meta-language. |
| 10 | Scribe & Archivist (the great ledger) | Excellent. The longest excerpt in the book, but earns the length — every beat maps onto a module design principle without making it explicit. No meta-language. |
| 11 | Wizard & Archivist (three spellbooks) | Strong. "Without provenance, you just pick a book and hope." No meta-language. |
| 12 | Adventurer & Timekeeper (checkpoint stone) | Excellent. The Timekeeper dictating "schema: dungeon-progress, version: two" is this book's best gag — technical vocabulary in allegorical mouth, played completely straight. Arguably meta-language, but earns a pass because the joke *is* the chapter's thesis and the incongruity is deliberate and flagged. |
| 13 | Scribe & Wizard (blue book) | **Needs revision.** The Wizard explicitly says "The vocabulary of the code matches the vocabulary of the game" and "You have been speaking domain-driven design." These are technical concepts spoken directly by an allegorical character. The Wizard should describe what the Scribe has been doing in the domain's own terms: the names in the ledger match the names in the world, the boundaries in the records match the boundaries the campaign actually has, the rules in the scrolls describe rules the campaign actually follows. The phrase "domain-driven design" should not appear in the excerpt. The chapter can — and does — use the technical name once the excerpt closes. |
| 14 | Dungeon Master & Test Party | Strong. The five-role test party maps onto test types without forcing the allegory. "Send them in again" is the right note. No meta-language. |
| 15 | Wizard & Apprentice (verification report) | **Borderline.** "Routes. Handlers. A passage graph rendered in a diagram she had generated from code." The word "code" and the terms "Routes" and "Handlers" appear as things the Apprentice reads on the Wizard's magical tablet. The excerpt works as a closing mirror to Chapter 1, and the magical-tablet framing gives some allegorical cover, but "Routes" and "Handlers" are implementation vocabulary that a character in this world should render differently. A small adjustment — "pathways", "the bound rules for each room", "a map she had rendered from her calculations" — would preserve the echo without the tech terms. |

---

## Chapter 5 Specific Assessment

Chapter 5 is strong and slots cleanly into its position. Specific notes:

**Excerpt:** The Wizard/Apprentice lineage conversation is among the better excerpts in the book. The allegory for inheritance vs composition is entirely implicit — nowhere does anyone say "this is like object-oriented programming." The Cleric standing outside the lineage exactly captures why a single-inheritance tree breaks when the domain is richer than the taxonomy. "Theoretical" as the last word is precisely calibrated. No meta-language anywhere.

**Chapter 4 promise kept:** Chapter 4's closing paragraph promises "classes, composition, and the limits of inheritance." Chapter 5 delivers on all three, in order. The thread is intact.

**RPG thread:** One of the stronger chapters for this. The Fighter/Rogue/Wizard/Cleric example is the chapter's core structure, not an aside. The Paladin, Ranger, Eldritch Knight, and Arcane Trickster are invoked as real problems that break the hierarchy — these are genuine D&D edge cases that any player will recognise immediately. The domain vocabulary (capability bundle, class features, multiclassing) runs throughout.

**Liskov footnote:** Well-placed and correctly attributed. The plain-English restatement is clear.

**Chapter 15 summary:** The Chapter 15 summary of Chapter 5 — "the word 'class' means twice over... Composition assembles a character from templates... Inheritance promises a subtype can stand in for its parent anywhere the parent is expected, a promise that is harder to keep than it looks" — accurately reflects the chapter's content.

**`skillProficiencies: Skill[]`:** The `CharacterTemplate` type in Chapter 5's Build Move lists `skillProficiencies: Skill[]`, which is correct per the consistency rules. No regression from the old `proficiencies: Ability[]` error.

**No em dashes, no double hyphens.** Clean throughout.

---

## Forward Reference Integrity

| Chapter | Forward Ref | Status |
|---------|-------------|--------|
| Ch01 | "Chapter 10, when we talk about what modules actually are" (in Ch02 Build Move) | ✅ Correct |
| Ch02 | "In the next chapter" → Ch03 | ✅ Correct |
| Ch03 | "Chapter 4" for data models | ✅ Correct |
| Ch04 | "Chapter 5" for classes/composition | ✅ Correct |
| Ch05 | "Chapter 6" for dice | ✅ Correct |
| Ch06 | "Chapter 7" for combat | ✅ Correct |
| Ch07 | "Chapter 8" for inventory | ✅ Correct |
| Ch08 | "Chapter 9" for access control | ✅ Correct |
| Ch09 | "Chapter 10" for modules | ✅ Correct |
| Ch10 | "Chapter 11" for rules as structured data | ✅ Correct |
| Ch11 | "Chapter 12" for saving | ✅ Correct |
| Ch12 | "Chapter 13" → promises old authoring chapter | ❌ Wrong — must be updated to promise the DDD chapter |
| Ch13 | "Chapter 14" for testing | ✅ Correct |
| Ch14 | "Chapter 15" for closing | ✅ Correct |

---

## RPG Thread Scorecard

| Chapter | RPG Connection | Strength |
|---------|---------------|----------|
| 01 | Central theme — spreadsheet, D&D, gamebooks, spellcraft metaphor | Strong |
| 02 | Fighting Fantasy, Lone Wolf, Sorcery!, Dark Room, Miyazaki, Borges, websites as gamebooks | Strong |
| 03 | Gamebook choices as hypermedia actions, HATEOAS as brass plate | Good |
| 04 | Character sheets, six ability scores, Fighting Fantasy minimalism, Daggerheart, Skyrim | Strong |
| 05 | Entire chapter uses D&D class taxonomy as its subject; Paladin/Ranger multiclass problem; lineage metaphor | Strong |
| 06 | Chainmail, d20 history, Fighting Fantasy 2d6, Daggerheart Hope/Fear, gambler's fallacy in game context | Strong |
| 07 | Fighting Fantasy combat, D&D attack/damage separation, Daggerheart asymmetry, initiative as future hook | Strong |
| 08 | Fighting Fantasy inventory, D&D encumbrance (SRD rules nobody follows), Daggerheart card slots | Good |
| 09 | DM screen metaphor in opening, access control as "not your table" in footnote | Adequate |
| 10 | Archivist/Scribe excerpt, then mostly software territory in body | Thin in body |
| 11 | Three spellbooks, SRD provenance throughout | Moderate |
| 12 | Checkpoint stone excerpt; body text could note Fighting Fantasy/D&D/video game save conventions | Thin in body |
| 13 | Campaign management as domain throughout; D&D vocabulary as ubiquitous language examples | Good |
| 14 | Test party as dungeon scouts from excerpt through chapter structure | Good |
| 15 | Closes all RPG threads via chapter summaries | Adequate |

---

## Summary: Actions Required

### Critical (one item remains)
1. **Rewrite Chapter 13 excerpt.** The Wizard uses "code" and "domain-driven design" as terms spoken in the allegorical world. The allegory must stay allegorical: the Wizard describes what the Scribe has been doing using the domain's own vocabulary, and the technical name "domain-driven design" is introduced only after the excerpt closes, in the chapter's first body paragraph.

### Important
2. **Fix Chapter 12's forward reference** to Chapter 13. Currently promises an authoring-pipeline chapter; must instead promise the DDD chapter. Suggested revision: "In Chapter 13, we'll name the approach the book has been taking — the discipline of building software that models a real domain faithfully, using the domain's vocabulary, drawing boundaries where the domain draws them. The work has been practice; the next chapter gives it a name."

3. **Add Arrange/Act/Assert comment headings** to all test code examples in Chapter 14. The notes explicitly require this for non-programmer comprehension. No test sample in Chapter 14 currently has these headings.

4. **Remove or rephrase the accessibility gate statement** in Chapter 15 ("not yet implemented"). The book presents Mt. Graphnor as a finished product; a named unimplemented feature in the conclusion contradicts this. Either implement it before publication, move the sentence to a "future work" framing that refers to the larger adventure project, or remove it.

5. **Fix em dashes** in Chapters 2, 7, and 14. Chapter 2's two body-prose em dashes need restructuring as sentences or commas. Chapters 7 and 14's interrupted dialogue in excerpts should use ellipsis.

6. **Revise Chapter 15 excerpt** to remove "Routes", "Handlers", and "code" as terms read on screen. Light reframing preserves the echo: "pathways, the rules for each decision, a map of connections she had rendered from her calculations."

7. **Change "prototype" to "the gamebook"** in Chapter 11, footnote 7.

### Recommended
8. **Strengthen RPG body-text thread in Chapters 10 and 12.** A short paragraph each: Ch10 connecting module boundaries to why D&D adventure modules have explicit entry/exit interfaces; Ch12 briefly comparing Fighting Fantasy, D&D, and video game save conventions before diving into the software implementation.

9. **Audit "not X but Y" constructions** in Chapters 3 and 4 specifically. Three or four instances per chapter is the natural ceiling; both chapters currently exceed it.

10. **Draft glossary and bibliography appendices.** All bolded defined terms from body text belong in the glossary; the footnotes are ready-made bibliography source material.

---

## What Is Working Well

The book is in strong shape. Specific strengths worth noting:

- **Excerpts for Chapters 2, 4, 5, 8, 10, and 12** are among the best in the book. The Cartographer discovering the unreachable room, the Scribe who needs something that will fit in the ledger, the Wizard's "theoretical" tower, the Quartermaster's patient taxonomy, the great ledger, and the Timekeeper reading schema version numbers aloud are all memorable.
- **Build Moves** are cleanly scoped to each chapter. No forward references to unbuilt features, no retrospective additions.
- **Chapter 5** reinstated exactly where it belongs. The composition-vs-inheritance argument is made through the D&D class system without ever becoming a dry OOP lecture. The Liskov footnote is accurate and well-placed.
- **Chapter 13 (DDD)** earns its position as the penultimate substantive chapter. The connections back to earlier chapters are specific and earned, not asserted.
- **Footnotes throughout** are consistently good: academically honest, lightly entertaining where appropriate, and well-sourced. The Montfort reference, the Lawford paper, the Berners-Lee/Fielding citations are all there when they need to be.
- **Dual-audience balance** is well-maintained. The book genuinely works for a reader who knows programming but not RPGs, and for the reverse.