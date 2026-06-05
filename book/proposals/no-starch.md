# Book Proposal: *Dungeons & Data Structures*

**Submitted to:** No Starch Press  
**Author:** Daniel Kiernan  
**Contact:** danielthekiernan@gmail.com  
**GitHub:** github.com/Macavitymadcap  
**Manuscript status:** Complete first draft, ~70,000 words  
**Projected delivery of revised manuscript:** [6 months from contract]

---

## The Pitch

Somewhere in a Google Drive folder there's a spreadsheet. It tracked hit points, conditions, loot, session notes, NPC names, encounter difficulties, and the slow accumulation of plot hooks I kept forgetting to resolve. It was the most complicated thing I owned, and one evening it ran out of road. So I opened a JavaScript tutorial in the next tab.

That evening was a door. This book is what lay behind it.

*Dungeons & Data Structures* teaches software engineering through tabletop RPGs and adventure gamebooks. Each chapter takes one idea from computer science — directed graphs, data modelling, composition versus inheritance, probability, event loops, access control, domain-driven design — grounds it in an RPG or gamebook analogy, and connects it to a working codebase built across the book's fourteen chapters. The result is a concept-led technical book for working web developers who learned to code outside a classroom, written by someone who did exactly that.

The central teaching vehicle is *Mt. Graphnor*, a short, complete, playable gamebook that grows chapter by chapter from a bare passage model into a branching adventure with character creation, dice checks, combat, inventory, authoring tools, and a full verification suite. Every concept in the book can be traced back to a specific piece of working code. The gamebook is not a metaphor for the concepts; it is an instance of them.

---

## The Book

### What it covers

The book moves through thirteen connected ideas, each embodied in working TypeScript:

- **Directed graphs** — a gamebook as nodes and edges; reachability, validation, Mermaid export
- **Hypertext and HATEOAS** — passages as HTTP responses; forms as intent; htmx fragments
- **Data modelling** — character sheets as records; stored facts versus derived facts; closed vocabularies; runtime validation
- **Composition over inheritance** — character templates versus class hierarchies; the Liskov Substitution Principle; structural typing
- **Probability and risk** — dice as random variables; expected value; advantage/disadvantage; transparent roll logs; injectable randomness for testability
- **Event loops** — combat as a turn-based loop; run-to-completion processing; the reducer pattern
- **Collections** — inventory as membership (Set); quantities as resources; flags as permanent history; choice gates
- **Access control** — authentication versus authorisation; roles versus capabilities; hiding buttons is not enough; structural access at build time
- **Modularity** — cohesion and coupling; dependency direction; Parnas' decomposition criterion; the module boundary as the boundary the domain draws
- **Rules as structured data** — provenance and licence; entities versus mechanics; the attribution panel as generated output
- **Persistence** — ephemeral versus durable state; versioned save documents; validation at the storage boundary; migrations as a promise to old players
- **Domain-driven design** — ubiquitous language; aggregates and bounded contexts; anti-corruption layers; repositories

The fourteenth chapter sends a test party through every door: unit tests, route tests, static build and artifact checks, browser smoke tests with Playwright, accessibility checks with Pa11y, screenshot evidence, and acceptance notes.

### The two running examples

**Mt. Graphnor** is a short, complete gamebook running in a browser on TypeScript, Bun, Hono, htmx, and SQLite. Every feature described in the book is traceable to working code: passage graphs, a hypermedia renderer, a character creator, dice and skill checks, combat encounters, inventory and flags, author and player modes, a modular source structure, a rules catalogue with SRD provenance, a versioned save document, and a verification suite. The gamebook uses mechanics from the D&D 5.1 System Reference Document, released under Creative Commons Attribution 4.0.

**Campaign Ledger** is the application the original D&D campaign spreadsheet eventually became: character sheets, session notes, NPC dossiers, rules references, staged imports, player-safe publishing, role-based access, and a deployment posture with accessibility checks, smoke tests, and acceptance notes. It handles real users and real sessions at a real table. Each chapter closes with a coda showing the same concept in Campaign Ledger's context — more users, more edge cases, more accumulated consequence. The codas are the view from the next floor down.

### The stack

TypeScript and Bun throughout. The gamebook uses Hono for routing and htmx for partial rendering — a deliberate choice that keeps the architecture legible and the JavaScript footprint minimal, which makes the server/client boundary easy to reason about in a teaching context. The concepts are not stack-specific and travel to any web framework; the code just looks a little different.

### Sample chapter

Chapter 6, *Dice, Probability, and Risk*, is included with this proposal. It introduces the `RandomSource` injectable pattern, `RollResult` as a structured value object, advantage/disadvantage as probability distribution manipulation, and `DamageExpression` as a value object with no identity of its own. The chapter begins with a brief survey of how different RPG systems (D&D, Fighting Fantasy, Daggerheart) answer the question "how much should the dice matter?" before building the gamebook's dice layer from first principles. It is representative of the book's voice and approach.

---

## The Market

### Who buys this book

The reader has 1–4 years of commercial web development experience. They learned to code through tutorials, side projects, and stubborn persistence rather than a computer science degree. They have built things that work; they are starting to wonder why they work and whether they could work better. They have encountered terms like "composition over inheritance" or "domain-driven design" and not known what to do with them.

They also, in a significant number of cases, play tabletop RPGs. The overlap between the software development community and the TTRPG community is larger and more organised than publishers outside the space might expect: it has dedicated communities, recurring discourse, and a demonstrated appetite for content that bridges the two. The book is not dependent on that overlap to succeed, but it provides a meaningful launch audience.

### Comparable titles

**No Starch back catalogue comps:**

- *Land of Lisp* (Conrad Barski, 2010) — concept-led, single-domain teaching vehicle, strong personality, unconventional format. The most direct structural comp: an entire language taught through a single sustained analogy. *Dungeons & Data Structures* does the same for software engineering concepts rather than a language.
- *Clojure for the Brave and True* (Daniel Higginbotham, 2015) — irreverent voice, gamified framing, developer community traction, web-native audience.

**Broader comps:**

- *The Pragmatic Programmer, 20th Anniversary Edition* (Thomas & Hunt, 2019) — the practitioner-voice software engineering book; the audience this book shares but approaches differently.
- *Software Design by Example* (Wilson, 2022) — incremental worked example building a complete system; closest to the dual-example structure but without the sustained cultural metaphor and with a narrower audience.

None of these combine a sustained RPG/gamebook cultural frame with a web-native TypeScript codebase and a complete working artefact shipped as part of the book. The gap is real.

### Why now

The D&D 5.1 SRD's release under Creative Commons Attribution 4.0 in 2023 made this book legally clean to write and publish in a way it was not before. The explosion of TTRPG culture — Actual Play shows, Daggerheart's 2024 launch, the continued growth of the hobbyist market — has expanded the relevant reading community considerably since the last wave of comparable concept-led technical books. The TypeScript/Bun/htmx stack the book uses is current without being ephemeral: the concepts it teaches are not pinned to any specific version.

---

## Table of Contents

1. **Introduction: From Spreadsheets to Spellcraft** — the personal origin, the analogy's logic, the two running examples, what the book assumes
2. **Choose Your Node Adventure** — directed graphs; nodes, edges, reachability; DAGs and cycles; validation; the Five Room Dungeon
3. **Hypertext, HATEOAS, and the Gamebook Page** — HTTP as graph traversal; links versus forms; htmx fragments; progressive enhancement; Post/Redirect/Get
4. **Character Sheets as Data Models** — records and types; closed vocabularies; stored versus derived facts; runtime validation at the storage boundary
5. **Classes, Composition, and the Limits of Inheritance** — the inheritance ladder; where it breaks; Liskov; structural typing; composition via templates
6. **Dice, Probability, and Risk** — random variables; uniform distributions; modifiers and DCs; advantage/disadvantage; injectable randomness; `RollResult` as a value object
7. **Combat as an Event Loop** — run-to-completion; the reducer pattern; `CombatRoundResult`; state machines; what the gamebook deliberately omits
8. **Inventory, Resources, and Encumbrance** — membership versus counting; Sets versus arrays; flags as permanent history; `ChoiceRequirement` and `ChoiceEffect`; validation for item references
9. **The Dungeon Master and the Admin** — authentication versus authorisation; roles, capabilities, ownership; structural access control at build time; the artifact check
10. **Adventure Modules and Programming Modules** — cohesion and coupling; Parnas' decomposition criterion; dependency direction; the module map; refactoring with a safety net
11. **Rules as Structured Data** — provenance and licence; `RuleSource`; entities versus mechanics; the SRD catalogue; generated attribution
12. **Saving the Game** — ephemeral versus durable state; the save document; validation at the storage boundary; migrations
13. **The Name for What We've Been Doing** — domain-driven design; ubiquitous language; aggregates; bounded contexts; anti-corruption layers; repositories
14. **Testing the Dungeon** — the five-gate verification pipeline; unit, route, static, browser smoke, accessibility; the verification manifest as living documentation
15. **Conclusion: The Labyrinth Never Ends** — what the dungeon taught; the gamebook as explanation; the reader's next system

**Appendix A:** Glossary (RPG and programming terms interleaved)  
**Appendix B:** Bibliography and further reading

---

## About the Author

Daniel Kiernan is a frontend software consultant based in Bristol with around four years of commercial experience, specialising in Angular, TypeScript, and web platform work primarily for public sector clients. He has designed and shipped production applications and has the specific practitioner's experience of inheriting other people's architectural decisions, which tends to clarify one's opinions about good module design.

He is also a tabletop RPG player, gamemaster, and hobbyist game designer with a long-standing interest in Fighting Fantasy, D&D 5e, and and other systems. His D&D adventure *The Shell of False Gods* has been published independently. He builds audio production tools, web synthesisers, and other software for his own amusement at github.com/Macavitymadcap.

The combination is the point. *Dungeons & Data Structures* is not written by a computer scientist who plays games on weekends, or a game designer who picked up TypeScript. It is written by someone for whom the two domains grew up alongside each other and have been talking to each other for years. The analogies in this book are not chosen for their charm; they are chosen because they are the ones that actually worked, on the author, during the process of learning the concepts they describe.

---

## Production Notes

- **Estimated manuscript length:** 70,000 words (complete first draft in hand)
- **Code examples:** TypeScript throughout; idiomatic, tested, minimal
- **Diagrams:** Mermaid flowcharts (graph structures, state machines, module maps); generated from the codebase rather than drawn separately
- **Licensing:** D&D mechanics used under SRD 5.1 Creative Commons Attribution 4.0; original gamebook content; no reproduction of proprietary IP
- **Companion repository:** Public GitHub repository containing the complete Mt. Graphnor codebase and a reference implementation of the Campaign Ledger patterns demonstrated in the chapter codas. The live Campaign Ledger application is a private personal project; the companion repo provides a clean, documented version of the same architecture suitable for reader use.
- **Revised manuscript delivery:** Six months from contract signature