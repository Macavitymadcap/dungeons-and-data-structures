# Book Proposal: *Dungeons & Data Structures*

**Submitted to:** The Pragmatic Bookshelf  
**Author:** Daniel Kiernan  
**Contact:** danielthekiernan@gmail.com  
**GitHub:** github.com/Macavitymadcap  
**Manuscript status:** Complete first draft, ~70,000 words  
**Projected delivery of revised manuscript:** [6 months from contract]

---

## Overview

*Dungeons & Data Structures* is a concept-led software engineering book for working web developers — roughly 1–4 years in — who learned their craft outside formal education and are ready to put names to the things they've been doing instinctively. It teaches directed graphs, data modelling, composition, probability, event loops, access control, modularity, and domain-driven design through a sustained analogy with tabletop RPGs and adventure gamebooks, grounded throughout in a working TypeScript codebase.

The book builds two running examples across fourteen chapters. The first is *Mt. Graphnor*, a short, complete, playable gamebook that grows from a bare passage graph into a full application with character creation, dice mechanics, combat, inventory, access-controlled authoring tools, and a five-gate verification pipeline. The second is *Campaign Ledger*, a privately hosted campaign management application built for the author's own D&D table, which provides a companion view of the same concepts under real production pressure: multiple users, multiple sessions, real data, real consequences.

The D&D mechanics used in the book are drawn from the SRD 5.1, released under Creative Commons Attribution 4.0, which is handled explicitly and correctly in both the text and the codebase.

---

## The Problem This Book Solves

There is a specific gap in the current technical book market that this book addresses directly.

The reader has built things. They have written routes, designed forms, managed state, debugged production issues, and shipped features that real people use. They have accumulated strong intuitions about what good code feels like. What they often lack is the vocabulary to name those intuitions, to communicate them to colleagues, or to identify the precise nature of the problem when a codebase starts to buckle.

Terms like "domain-driven design," "composition over inheritance," "the Liskov Substitution Principle," and "aggregate root" appear in job descriptions, code reviews, and architectural discussions. Books that cover these concepts tend to be either very long and formal (Evans, Fowler) or very abstract (most of the SOLID-principles genre). There is relatively little that approaches them from the practitioner's perspective — from someone who learned why they matter by watching what happens when they're absent.

This book is written from that perspective. It teaches the concepts not as abstract principles but as the natural consequence of paying careful attention to a real domain and modelling it honestly. The domain happens to be D&D. That turns out to matter less than you'd expect, and more than you'd think.

---

## Why RPGs

The RPG analogy is not decorative. It earns its place in three specific ways.

**Games are systems made explicit.** A D&D rulebook describes a complete system with visible rules: what entities exist, what they can do, how conflict resolves, how resources accumulate and deplete. This makes RPG mechanics unusually legible as domain models. A character sheet is a data model. A gamebook is a directed graph. A combat round is an event loop. A dungeon master's screen is a bounded context boundary made physical. These are not forced analogies; they are structural similarities that emerge from the fact that both RPGs and software are in the business of modelling rule-governed worlds.

**The teaching vehicle is also a working artefact.** Mt. Graphnor is not described; it is built. The code that validates the adventure graph, resolves dice checks, manages inventory gates, and enforces the author/player boundary is the same code the chapters explain. A reader who wants to verify that `validateAdventure` catches unreachable passages can run it. A reader who wants to see what the injectable `RandomSource` pattern looks like in real use can read `src/gamebook/rules/dice.ts`. The gamebook is both the metaphor and the implementation.

**The cultural overlap is real and large.** The TTRPG and software development communities share significant membership, particularly at the web-native end of the developer spectrum. This provides a natural launch audience — readers for whom the premise lands immediately — without restricting the book's appeal to that group. A reader who has never played D&D can follow the book completely; they just encounter the RPG material as interesting context rather than familiar territory.

---

## What the Book Covers

Each chapter teaches one concept from computer science or software engineering, grounds it in an RPG or gamebook analogy, and connects it to the running code examples.

| Chapter | Concept | RPG/Gamebook frame |
|---|---|---|
| 2 | Directed graphs | The gamebook as a passage graph; validation |
| 3 | HTTP, hypertext, HATEOAS | Passages as web pages; forms as intent; htmx |
| 4 | Data modelling | Character sheets as records; stored vs. derived facts |
| 5 | Composition vs. inheritance | Class templates vs. class hierarchies; Liskov |
| 6 | Probability and risk | Dice as random variables; RollResult; injectable RNG |
| 7 | Event loops | Combat rounds; run-to-completion; reducers |
| 8 | Collections | Inventory (membership), resources (count), flags (history) |
| 9 | Access control | DM screen as bounded context; structural access at build time |
| 10 | Modularity | Adventure modules as software modules; Parnas; coupling |
| 11 | Structured data and provenance | Rules as typed records; SRD attribution; licence handling |
| 12 | Persistence | Save documents; versioning; validation; migrations |
| 13 | Domain-driven design | Ubiquitous language; aggregates; bounded contexts; repositories |
| 14 | Testing | Five-gate pipeline: unit, route, static, browser smoke, a11y |

The Campaign Ledger codas at the end of each chapter show the same concept applied to a production multi-user application: more users, more edge cases, more accumulated architectural consequence. They are the practitioner's view of what the concept costs and what it buys when the stakes are real.

---

## The Pragmatic Fit

This book aligns with the Pragmatic Bookshelf's stated emphasis on working software, practitioner experience, and books that help developers think differently rather than simply covering a topic.

Specifically:

**It is tool-forward without being tool-dependent.** The codebase uses TypeScript, Bun, Hono, and htmx — a current, minimal, web-native stack — but every chapter makes explicit that the concepts are not stack-specific. A reader using Node, Express, and React will find the ideas transfer completely; the code just looks a little different. This mirrors the Pragmatic approach of teaching transferable skills rather than framework tutorials.

**The working example is genuinely worked.** The Mt. Graphnor gamebook is not a toy. It has a validation suite, an access-controlled author mode, a versioned persistence layer, and a five-gate verification pipeline. The Campaign Ledger coda shows what happens when the same ideas are applied to an application with authentication, concurrent users, and schema migrations. Readers can inspect, run, and extend the code; it is not illustrative pseudocode.

**The author is a practitioner.** The book is written from the experience of building production applications, inheriting other people's architectural decisions, and learning the cost of missing module boundaries by paying it. The false start described in Chapter 5 — the `BaseEntity` hierarchy that had to be ripped out — is the kind of war story that does more teaching work than a clean abstract presentation. The Pragmatic tradition values exactly this kind of honest, experience-grounded voice.

---

## Comparable Pragmatic Titles and Differentiation

- *The Pragmatic Programmer* (Thomas & Hunt) — the obvious ancestor in terms of practitioner voice and maxim-based wisdom. *Dungeons & Data Structures* is more narrowly focused (web/TypeScript, a single domain analogy) and more code-forward.
- *Domain Modeling Made Functional* (Wlaschin) — strong overlap in subject matter for Chapters 12–13; different audience (functional/F# focus, more experienced reader) and no sustained cultural metaphor.
- *A Philosophy of Software Design* (Ousterhout) — concept-led, practitioner-voice, opinionated. No code. *Dungeons & Data Structures* is the code-forward complement.

There is no current title in the Pragmatic catalogue that combines: a sustained cultural metaphor, a web-native TypeScript codebase, a complete working artefact, and a practitioner's progression from data modelling through to domain-driven design. The gap is real.

---

## Sample Material

Chapter 6, *Dice, Probability, and Risk*, is attached as sample material. It demonstrates the book's handling of a concept with both a mathematical component (probability distributions, expected value, advantage/disadvantage) and an implementation component (the injectable `RandomSource` pattern, `RollResult` as a structured value object, `DamageExpression` as a typed dice descriptor). The chapter opens with a brief comparative survey of how different RPG systems answer the question "how much should randomness matter?" — D&D's flat d20, Fighting Fantasy's 2d6 bell curve, Daggerheart's dual-die Hope/Fear system — before building the gamebook's dice layer from first principles.

The introduction and Chapter 4 (Character Sheets as Data Models) are also available on request; together with Chapter 6 they give a representative cross-section of early, middle, and conceptually dense material.

---

## About the Author

Daniel Kiernan is a frontend software consultant based in Bristol with around four years of commercial experience in TypeScript and Angular, primarily delivering for public sector clients including geospatial and data platform applications. He has the specific practical experience of working on long-lived codebases with accumulated technical debt, which tends to produce strong opinions about module design and the cost of missing boundaries.

He is also a tabletop RPG player, gamemaster, and game designer. His interest in TTRPGs and his interest in software engineering grew up alongside each other; the analogies in this book are the ones that actually worked during the process of learning the concepts they describe, not ones retrofitted afterward for pedagogical purposes.

The author bio is intentionally dual because the book is intentionally dual. The authority to write *Dungeons & Data Structures* comes equally from having built production software and having run enough D&D sessions to understand why the dungeon master's screen is a bounded context boundary.

Portfolio and public work: github.com/Macavitymadcap

---

## Production Notes

**Manuscript length:** ~70,000 words (complete first draft in hand)  
**Diagrams:** Mermaid-generated flowcharts and state diagrams, produced from the codebase
**Companion repository**: Public GitHub repository containing the complete Mt. Graphnor codebase and a reference implementation of the Campaign Ledger patterns demonstrated in the chapter codas. The live Campaign Ledger application is a private personal project; the companion repo provides a clean, documented version of the same architecture suitable for reader use.  
**Code examples:** TypeScript throughout; idiomatic, tested, minimal 
**Licensing:** D&D mechanics used under SRD 5.1 Creative Commons Attribution 4.0 (handled explicitly in Chapter 11 and the Introduction); original gamebook content; no proprietary IP reproduction  
**Beta/early access:** The author is open to the Pragmatic beta model; a complete first draft is in hand, with revision to follow editorial feedback  
**Revised manuscript delivery:** Six months from contract signature

---

## Summary

*Dungeons & Data Structures* teaches software engineering concepts that working developers need but often can't name — graphs, data modelling, composition, event loops, access control, domain-driven design — through a sustained analogy with tabletop RPGs and a working TypeScript codebase that is both the teaching vehicle and the proof of concept. It is written by a practitioner for practitioners, at the level of someone who has built real things and is ready to understand why they work.

The manuscript is complete. The code runs. The gamebook is playable. The concepts are sound.