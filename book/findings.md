# Reader's Report findings

---

## Voice & Prose

**1. The voice gap between best and worst chapters**
The sharpest observations tend to live in footnotes rather than body text. Chapters 8, 9, and 11 are the primary offenders.
*Fix:* Audit each of these chapters for footnotes that contain opinions or "why this matters" reasoning — promote those into the body text. Chapter 8 footnote 5 (why `removeFlags` is not an oversight) is the clearest example of something that belongs in the main text.

**2. Chapter 8 body text flatness**
The Quartermaster vignette sets up a sharp register that the chapter doesn't maintain. The technical content is correct but thin on authorial judgment.
*Fix:* Add a paragraph or two of direct opinion about the design decisions being made. The "membership vs counting vs flags" taxonomy is interesting; the chapter tells the reader what the three things are but doesn't fully argue for why you'd choose one over another.

**3. Chapter 9 lacks a single thesis sentence**
The chapter covers authentication vs authorisation, roles vs capabilities, four-layer enforcement, and RBAC — all correct, none building to a single memorable close the way the other chapters do.
*Fix:* Identify the one claim the Doorkeeper vignette is setting up — probably something close to "access control is not about trust, it is about which actors are permitted to affect which resources in which context, verified at every layer" — and make sure the chapter is visibly building toward it.

**4. The "theatre chivalry" claim in Chapter 7**
"What the theatre world calls chivalry" is stated as a named term of art without attribution. If it's a real term, cite the source. If it's the author's framing, say so.
*Fix:* Either find and add the citation (improv/ensemble theatre literature), or reframe as "what I think of as chivalry in the theatre sense" and add a brief gloss.

---

## Structural / Pedagogical

**5. Chapter 13 DDD vocabulary arrives too quickly in the At Scale section**
The At Scale section lists aggregate roots, bounded contexts, anti-corruption layers, and repository interfaces in rapid succession. For the stated reader this may not land on first pass.
*Fix:* Add a brief orienting sentence before the At Scale section names the five patterns the reader is about to see — something like "here is what those five terms from the chapter body look like applied at production scale" — so the reader enters with a frame.

**6. Chapter 14 is thinner than its ambition**
The accessibility section is a sketch; the screenshots/acceptance notes section describes a workflow without fully arguing for why it matters at the same depth as the other gates.
*Fix:* Expand the accessibility section to give Pa11y the same treatment Playwright gets. Bring the acceptance notes argument from footnote 8 into the body text — the "assertions with receipts" observation is strong and belongs in the main discussion.

**7. TDD is discussed substantively but only in a footnote**
Chapter 14 footnote 2 is a full paragraph of considered opinion on TDD, including a critique of its limits and an observation about the cult vs the idea. This is too substantial for a footnote.
*Fix:* Promote this into a short body section after the unit tests discussion — call it "A note on test-first" or similar. It's good writing and the book's honest take on a contested practice; it shouldn't be buried.

---

## Appendix A: Glossary

**8. PbtA / Powered by the Apocalypse missing**
Used in Chapter 5 body text and footnote 5 to illustrate composition-over-inheritance. Named as a design framework with two example titles. No glossary entry.
*Fix:* Add an entry. Briefly: what it is, why it's in the book (playbooks as a non-hierarchical character definition model), cross-reference to *composition* and *character template*.

**9. God Object missing**
Introduced as a formal term in Chapter 10, defined in footnote 2, used as the diagnosis of the Five Room Dungeon project. No glossary entry despite being chapter-body vocabulary.
*Fix:* Add an entry. Two or three sentences; reference the Single Responsibility Principle and *module*.

**10. TDD / Test-Driven Development missing**
The term is used in Chapter 14 and gets a substantive footnote-level treatment. No glossary entry.
*Fix:* Add an entry reflecting the book's actual position: it's a real practice with advantages for domain logic, pedagogically deferred here, not a doctrine.

**11. REST missing (with HATEOAS present)**
Chapter 3 uses REST as a named concept and cites Fielding's dissertation. HATEOAS has an entry; REST does not.
*Fix:* Either add a brief REST entry, or add a "see also: HATEOAS" redirect for readers who search for it.

**12. Text Adventure / Parser Fiction missing**
Cited repeatedly in Chapters 1 and 2, with a full bibliography section on interactive fiction scholarship. No glossary entry.
*Fix:* Add a brief "Text Adventure" entry pointing to the gamebook tradition and the bibliography section on interactive fiction scholarship.

**13. OWASP missing**
Referenced in Chapter 9 footnote 1 with a URL, positioned as a recommended resource. The other referenced standards (WCAG, SRD) have entries; OWASP does not.
*Fix:* Add a one or two sentence entry consistent with how WCAG is treated.

**14. Playwright missing**
Named as the primary end-to-end testing tool in Chapter 14, with a substantive footnote. Pa11y is mentioned but also has no dedicated entry.
*Fix:* Add entries for both Playwright and Pa11y, consistent with how htmx and Hono are handled — brief, what it is, where it's used in the book.

**15. Single Responsibility Principle missing**
Referenced in Chapter 10 footnote 2 alongside the God Object definition. The SOLID principles are mentioned in the Dependency Inversion Principle entry. The SRP is arguably the most invoked of the five and has no entry.
*Fix:* Add a brief entry; cross-reference *module*, *high cohesion*, and *God Object*.

---

## Appendix B: Bibliography

**16. Miyazaki / Dark Souls citation is unsourced**
Chapter 2 makes the specific claim that "Miyazaki has cited Fighting Fantasy as a significant influence" and footnote 6 says "in several interviews over the years." No specific interview is cited. This is directly inconsistent with the book's own stated value of visible proof over confident assertion.
*Fix:* Either locate and cite a specific interview (widely reported; should be findable), or soften the body text to "has spoken in interviews about" and note in the footnote that a specific citation wasn't pinned down. The latter is more honest if the former isn't achievable.

**17. Curse of Strahd missing from bibliography**
Cited in Chapter 10 footnote 5 with full author credits. *Ravenloft* (1983) is also named in the same footnote. Neither appears in the bibliography.
*Fix:* Add both to the Games section: Crawford et al., *Curse of Strahd*, Wizards of the Coast, 2016; and Hickman & Hickman, *Ravenloft*, TSR, 1983.

**18. Powered by the Apocalypse missing from bibliography**
Named and described in Chapter 5. The other RPG design frameworks and series cited in the book all have bibliography entries; PbtA does not.
*Fix:* Add: Baker, Vincent, and Meguey Baker. *Apocalypse World.* lumpley games, 2010 (second edition 2016). With a brief annotation noting it as the source of the playbook/move framework described in Chapter 5.

**19. Chapter 11 footnote 3 references Berners-Lee without a citation**
"Tim Berners-Lee's linked data principles" is cited as conceptual context but points to no specific work. The Further Reading section has the Scientific American article, which is only loosely related.
*Fix:* Either add the W3C linked data design notes (available at w3.org/DesignIssues/LinkedData.html) as the direct source, or update the footnote to point to the Further Reading entry explicitly.

**20. Kent Beck missing from chapter footnotes**
*Test-Driven Development: By Example* is in Works Consulted, attributed as background for the book's testable-code habits. Chapter 14 discusses TDD substantively. Beck is never cited in a footnote.
*Fix:* Add a footnote reference in Chapter 14 alongside Freeman & Pryce — something like "Beck's *Test-Driven Development: By Example* is the source of the practice as a named discipline; Freeman & Pryce's *Growing Object-Oriented Software, Guided by Tests* applies it at the system level."

**21. The Scrum Guide not cited in any chapter footnote**
Listed in Works Consulted as background for Chapter 14's acceptance notes approach, but Chapter 14 never points to it.
*Fix:* Add a brief footnote in Chapter 14 near the acceptance notes discussion, pointing to the Scrum Guide and the sprint review's "working software demonstrated not asserted" principle as the instinct behind it.