# Research Dossiers

Create one dossier per planned chapter before drafting full prose.

## Current Baseline

The architecture checkpoint in `book/architecture-checkpoint-before-further-dossiers.md` confirms
that the outlined book topics are supported by patterns already present in the gamebook/storybook
engine and Campaign Ledger. The refreshed structure in `book/book-structure-plan.md` is now the
baseline for new dossiers.

Resume one dossier at a time and name exact evidence from both apps whenever a chapter depends on
both. Chapter 02 can proceed from the existing graph dossier; chapters 03 onward should use the
refreshed emphasis in the structure plan.

## Dossiers

- [Supplementary Reading List](supplementary-reading-list.md)
- [Chapter 01: From Spreadsheets To Spellcraft](chapter-01-from-spreadsheets-to-spellcraft.md)
- [Chapter 02: Choose Your Node Adventure](chapter-02-choose-your-node-adventure.md)
- [Chapter 03: Hypertext, HATEOAS, And The Gamebook Page](chapter-03-hypertext-hateoas-and-the-gamebook-page.md)
- [Chapter 04: Character Sheets As Data Models](chapter-04-character-sheets-as-data-models.md)
- [Chapter 05: Classes, Composition, And The Limits Of Inheritance](chapter-05-classes-composition-and-the-limits-of-inheritance.md)
- [Chapter 06: Dice, Probability, And Risk](chapter-06-dice-probability-and-risk.md)
- [Chapter 07: Combat As An Event Loop](chapter-07-combat-as-an-event-loop.md)
- [Chapter 08: Inventory, Resources, And Encumbrance](chapter-08-inventory-resources-and-encumbrance.md)
- [Chapter 09: The Dungeon Master And The Admin](chapter-09-the-dungeon-master-and-the-admin.md)
- [Chapter 10: Adventure Modules And Programming Modules](chapter-10-adventure-modules-and-programming-modules.md)
- [Chapter 11: Rules As Structured Data](chapter-11-rules-as-structured-data.md)
- [Chapter 12: Saving The Game](chapter-12-saving-the-game.md)
- [Chapter 13: Authoring A Branching Adventure](chapter-13-authoring-a-branching-adventure.md)
- [Chapter 14: Testing The Dungeon](chapter-14-testing-the-dungeon.md)
- [Chapter 15: The Labyrinth Never Ends](chapter-15-the-labyrinth-never-ends.md)

## Dossier Template

```markdown
# Chapter NN: Working Title

## Research Question

What does this chapter need to prove or explain?

## Core Concept

Name the computer science or software engineering idea.

## RPG Or Gamebook Analogy

Explain the reader-friendly metaphor.

## Opening Passage Or Table Transcript

Describe the short gamebook passage or D&D-session transcript that should open the chapter. Name any
recurring characters only if they help. The excerpt should embody the chapter's problem before the
technical explanation begins.

## Sources

- Authoritative CS/software source:
- D&D 5e SRD source, if relevant:
- Gamebook/hypertext source, if relevant:
- Campaign Ledger evidence, if relevant:

## Shelf References

List real books or physical references to revisit while drafting. Prefer books the author owns or can
reasonably find in a library. Explain what each book contributes, and keep licence/originality
guardrails explicit for D&D and gamebook sources.

## Campaign Ledger Evidence

List exact files, features, or workflows from campaign-ledger that support the chapter.

## Gamebook Build Payoff

Name the gamebook feature and module this chapter advances.

Keep this mechanical unless the chapter is explicitly about narrative design. Final gamebook prose comes later.

## Notes For The Draft

Beginner-friendly explanation, examples, diagrams, code snippets, and sidebars.

Include at least one Mermaid diagram idea. Prefer a fenced `mermaid` block in the dossier so the
draft has a concrete starting point.

Optional subsections can include code examples, sidebar ideas, chapter boundaries, SRD-safe handling,
bibliography entries, reusable sentences, or chapter echoes where they genuinely help the draft.

## Risks

Licensing, over-complexity, unclear analogy, or missing evidence.
```

## Defaults

- Keep source quotations short and prefer paraphrase.
- Label inference separately from sourced fact.
- Use SRD 5.1-compatible mechanics unless the chapter explicitly compares editions.
- Treat Fighting Fantasy as form inspiration and history, not as material to copy.
- Tie the chapter back to the gamebook mechanics wherever practical.
- Use opening gamebook passages or table transcripts for allegory; do not force the playable gamebook to explain computer science in-world.
- Every dossier should include at least one Mermaid diagram idea or draft diagram.
- Every dossier should include shelf references to concrete books where useful, alongside web
  sources and implementation evidence.
