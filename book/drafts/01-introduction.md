# Introduction: From Spreadsheets To Spellcraft

---

> **The Wizard and the Apprentice**
>
> The Apprentice found the Wizard bent over her desk, a glowing tablet covered in runes bearing
> the full brunt of her studious gaze.
>
> "Is that a grimoire?" the Apprentice asked, sitting uninvited in the spare chair.
>
> "A spellbook," said the Wizard, eyes still fixed on the tablet.
>
> The Apprentice craned closer. The runes were arranged in a grid: columns of sigils, rows of
> bindings. Each block held an inscription. Some of the inscriptions referenced other blocks by
> coordinate, pulling their values into new calculations. One inscription read something like *if
> the binding in this position weakens past the threshold, the name inscribed here changes; if not,
> it remains.*
>
> "Those are invocations," said the Apprentice slowly. "But the invocations are not for
> incantations. They describe something else. Rules. Relationships. Conditions."
>
> "Yes," said the Wizard.
>
> "And you wrote them."
>
> "Indeed."
>
> The Apprentice considered the glowing grid for a long time.
>
> "Anyone could learn to write these," they said at last. Not quite a statement, not exactly a
> question.
>
> The Wizard looked up for the first time, a sage glow of beatific calm across her face befitting
> one who has patiently waited for an obvious thing to become visible.
>
> "Anyone," she said, "already has."

---

Lurking somewhere in a Google Drive folder I haven't opened for years, there's a spreadsheet. It
tracked hit points, conditions, loot, session notes, NPC names, encounter difficulties, and the
slow accumulation of plot hooks I kept forgetting to resolve. It was not a tidy spreadsheet. It
was a spreadsheet that had eaten three others and felt no remorse.

I can't tell you precisely what the problem was that finally made me reach beyond it. The exact
rule I needed to model, the specific constraint the built-in functions couldn't satisfy: memory is
a saving throw I've failed too many times to be confident of the details.[^1] What I can tell you is
that I ended up with a JavaScript tutorial open in one tab and the spreadsheet in another, and that
by the end of the evening I had written a small function that did something the spreadsheet had
previously refused to do. The rule inside the cell was mine.

That evening was a door. I did not understand at the time what I had stepped through; how far
down the stairs went and what was hidden in its depths.

---

## The Dungeon Below The Spreadsheet

Dungeons, in both the literal and metaphorical sense, have a way of going deeper than they look
from the entrance. The first room is just a room. Then there's a passage, and another room, and a
locked door, and a key somewhere behind a different locked door, and before long you are three
levels underground with torches burning low, wondering what you came here for and realising you've
forgotten how to leave.

Learning to program felt like that.

The spreadsheet was the first room. A small problem, a small solution. I had described a rule
precisely enough for a machine to repeat it, which is, as I came to understand later, most of
what programming actually is. From there: JavaScript tutorials, then Python scripts, then Bash
one-liners that did something useful, then a Linux terminal, then HTML and CSS and web frameworks
and databases and test suites and deployment pipelines, each one a passage into another unexplored
level of the dungeon.

I was not doing this in order to become a software developer. I was doing it because each door
had something interesting behind it.[^2] The job title came later.

---

## Programming As Spellcraft

The analogy that made it feel possible was not an academic one. It came from the fiction I'd grown
up reading.

Fighting Fantasy gamebooks. D&D sourcebooks. Stories about wizards who learned the true names of
things and could therefore change them. The wizard's power was not strength or wealth or luck.
It was precision. An incantation worked because every word was placed correctly. A mis-spoken
syllable redirected the energy in directions nobody wanted. There were consequences.

Programming felt like that. You wrote words in a strange language, according to rules that did not
tolerate ambiguity. If you were precise, the machine did what you said. If you were imprecise, the
machine *still* did exactly what you said, which was usually worse.

I don't want to oversell the romance of it. Programming is frequently tedious, occasionally
maddening, and humbling at a rate that never quite levels off. But there is something genuinely
close to the feeling I got from those fantasy books when a function returns the right answer
after an hour of being wrong: a specific kind of competence, a sense of having learned the rules
of a hidden system and being able to apply them. That feeling kept me going through the long
early period where most of what I understood was not much at all.

---

## Software Needs A World To Model

Something I've come to believe, which is not original to me but took me a while to properly feel: 
software is interesting in isolation, but the real magic happens when it intersects with another 
domain and starts to *represent* something. A business, an archive, a game, a city's transport 
network, an encyclopaedia, an e-commerce catalogue. The intersection is where the work gets 
meaningful.

A spreadsheet full of arbitrary numbers is a curiosity. A spreadsheet that models a D&D campaign,
with characters, conditions, encounters, loot tables, and session history, is a system for
representing something that matters to the people using it. The software serves a domain that has
its own vocabulary, its own rules, its own logic. Learning to model that domain well is a large
part of what software development actually involves.

D&D is a domain. It has entities: characters, monsters, spells, items, conditions. It has rules:
how damage is calculated, how conditions interact, when a saving throw applies. It has
relationships: a character belongs to a party; a spell belongs to a class; an encounter happens in
a location. When I started building tools to manage my campaign, I was trying, without yet knowing
the vocabulary for it, to model a domain in software.

This book is about how to do that: how to recognise the shape of a domain's data, the logic of
its rules, the boundaries between its concerns. RPGs and gamebooks are the domain we'll work in,
because they're the domain I know best and because the two concepts, TTRPGs and software, map
remarkably well onto each other.

---

## Games Are Systems You Can Touch

There is a more practical reason to learn software development through games, beyond the personal,
philosophical and nerdy.

Games are systems made explicit. When you play Dungeons and Dragons, you are handed a rulebook that
describes how the world operates: what a character can do, how conflict resolves, what the
consequences of decisions are, how resources accumulate and deplete, what information different
people are allowed to see. The rules are *visible*. You can argue about them, modify them, or
ignore them with full awareness of what you're ignoring.

Software systems work the same way, but the rules are usually less legible. The logic that
determines what a user can see, what changes when they submit a form, or what happens when two
actions conflict is often buried in implementation details rather than written in a player's
handbook.

RPGs and gamebooks make these ideas touchable:

- **Data structures** are character sheets: organised records of facts with types, constraints,
  and values derived from other values.
- **Graphs** are gamebook passages: nodes connected by directed edges called choices.
- **State machines** are combat rounds: a system that moves from one configuration to the next
  in response to events.
- **Access control** is the Dungeon Master's screen: a boundary between what different
  participants are allowed to know.
- **Modules** are adventure modules: separated concerns with explicit interfaces and private
  internals.
- **Tests** are playtesting: sending a scout through every door before the session.

This does not mean RPG systems are secretly computer science textbooks. It means they solve
*some* of the same problems, and that one familiar domain can provide a low-stakes place to
encounter the other.[^3]

---

## What This Book Is

This book is roughly five years of self-directed learning, written down in a form someone else can
follow.

I came to software development not through a degree programme or a bootcamp, but through a
spreadsheet that needed one more thing. The route was crooked, largely unmapped, occasionally
backtracked. The map in this book is made in retrospect.

It is concept-led and beginner-friendly. Each chapter teaches one idea from computer science or
software engineering, grounds it in an RPG or gamebook analogy, and connects it to working code.
That code comes from two places: a small companion gamebook called Mt. Graphnor, and a larger
campaign-management application called Campaign Ledger.

It is not a complete computer science curriculum. It does not cover sorting algorithms, operating
systems, compiler design, or machine learning. What it does cover is the subset of ideas that kept
appearing in my work as a software consultant, lit up by the games I happened to know: graphs,
data models, composition, probability, state machines, collections, access control, modularity,
structured data, persistence, authoring pipelines, and verification.

It is not a D&D rules guide. The book uses mechanics from the D&D 5th Edition System Reference
Document,[^4] which is released under a Creative Commons licence and can be used freely with
attribution. Those mechanics appear as teaching examples, not as an invitation to play a particular
edition. The gamebook accompanying this text is original work, inspired by the Fighting Fantasy
format without reproducing it.

---

## The Running Examples

Every chapter in this book produces something: a diagram, a type definition, a helper function,
or a feature that advances one of the two running examples.

**Mt. Graphnor** is a short, complete, playable gamebook that runs in a browser, stores progress in
local storage, and grows chapter by chapter from a bare passage model into a branching adventure
with character creation, dice checks, combat, inventory, authoring tools, and a verification suite.
It is a real gamebook: every passage is reachable, every ending is achievable, the mechanics work,
and you can play it. It is short by design, built to be small enough that every feature the book
discusses can be traced back to a specific piece of working code. Building it is also how the engine
got built in the first place, which turns out to be the same thing as writing this book.

A larger adventure using the same engine is planned once the mechanics are proven here. That one
will be a proper 400-or-so node narrative adventure, the kind where the story is the point. Mt.
Graphnor came first because a short gamebook is a better teaching example than a long one, and
because you need a working engine before you can fill it with story.[^5]

**Campaign Ledger** is the application the original D&D campaign spreadsheet eventually became,
after many years, many tutorials, and a career change. It is a private, locally hosted web app I
run for my own table: character sheets, session notes, NPC dossiers, rules references, staged
imports, player-safe publishing, role-based access, and a deployment posture with accessibility
checks, smoke tests, screenshots, and acceptance notes. It handles real users and real sessions.
It is not a public product, and was never intended to be. It is built with the same care as something
that would be, and that care is the point.

Where Mt. Graphnor is small enough to hold in your head all at once, Campaign Ledger is large
enough to show how the same ideas grow under real-world pressure. When a chapter needs a
beginner-sized example, it uses Mt. Graphnor. When it needs to show the same idea surviving
contact with a real application, it uses Campaign Ledger. The two don't require you to understand
both at once. When a Campaign Ledger section moves into SQL schemas, repository interfaces, or bounded 
contexts without stopping to introduce them, that's intentional: those sections are aimed at the reader 
who already has some of that ground. Read past them and the concept still lands from the gamebook side;
come back when the territory feels more familiar and they'll read differently.

---

## What This Book Is Not

It is not a claim that every programming idea has an RPG counterpart. Some ideas in this book map
neatly. Others are shoehorned in for entertainment value and labelled accordingly. The domain is a
lens, not the whole picture.

It is not a history of gamebooks or a critical study of the Fighting Fantasy series. The book will
make use of both, briefly, as context and formal precedent. The historical and critical literature
on interactive fiction is richer than this book needs; readers who want to go deeper are pointed
towards Nick Montfort's *Twisty Little Passages*[^6] and the recommended reading list at the end.

It is not a promise that Mt. Graphnor is a long or ambitious adventure. It is a short, complete
gamebook whose mechanics work as described and whose code a reader can inspect, run, and learn
from. The adventure is genuine; it is just compact. If you finish it in ten minutes and want
something with a hundred more passages and a proper narrative arc, that is the other book, the
one that gets built after this one, on the same engine.

It is not neutral on the subject of evidence. The book has a preference for visible proof over
confident assertion. It likes tests, validation reports, and acceptance notes, not because those
things are glamorous (they are not), but because they're the difference between "I think it works"
and "I can show you that it works."

---

## How To Read It

Each chapter opens with a short fictional excerpt, either a gamebook passage or a D&D-session
transcript, that embodies the chapter's central problem before the technical explanation begins.
These excerpts are doors. Step through them. The dungeon starts immediately after.

The chapters build on each other loosely, not strictly. You can read in order, or skip to the
subjects that matter most, or return to earlier chapters once later ones have changed what you're
looking for. The code examples are written in TypeScript[^7] and run on the Bun runtime,[^8]
but the concepts don't require TypeScript. If you read JavaScript, most examples will translate
without difficulty.

A word on what this book assumes. It is not a book for complete beginners to programming: by
Chapter 3 it expects that HTML, HTTP verbs, and the idea of a form submission are familiar
territory, and by Chapter 4 it expects TypeScript interface notation to be readable without
introduction. What it does not assume is any prior exposure to formal software design: no
computer science degree, no bootcamp, no previous encounter with graphs, data models,
composition, or domain-driven design. The intended reader has some web experience, has written
code that does something useful, and has started to suspect there are better ways to organise
it. If that describes you, you are in the right place.

A reasonable question at this point is why a gamebook at all. Text adventures were some of the
earliest computer games precisely because of technical constraints, but what they demonstrated,
even in their constraints, was something a physical Fighting Fantasy book could never show: complex
conditional logic, persistent state, node-chaining across hundreds of locations, outcomes that
depended on what you'd done three passages ago. The hypertext gamebook is a natural teaching
vehicle because it *is* software in its most legible form. What the player experiences as story,
the developer experiences as a graph traversal over a state machine with a persistence layer. Put
it that way and the comparison sounds dry. Play it and it doesn't. I grew up with Fighting Fantasy
before graduating to D&D and computers, and as I approach middle age I believe I am allowed a
certain amount of nostalgia.

A second reasonable question is why this particular stack: TypeScript, Bun, Hono, htmx, SQLite.
They are not the objectively optimal tools for any specific task, and I wouldn't claim they are.
They are the tools I know best, having spent several years using them professionally. In practice,
"best" in software development most often means "the set of tools the team is most comfortable
with". This is a web project, so the stack is web-native. The concepts are not stack-specific;
they travel. If you use a different framework, a different runtime, or a different language, the
ideas in each chapter remain the same. The code just looks a little different.

The gamebook grows as the book progresses. By the final chapter, Mt. Graphnor contains every
feature described in the preceding pages: passage graphs, a hypermedia renderer, a character
creator, dice and skill checks, combat encounters, inventory and flags, author and player modes, a
modular source structure, a rules catalogue, a versioned save document, an authoring surface with
previews and validation, and a verification suite. You don't have to build it yourself to follow
the book. The code is there, explained in full. But the option is open, and the dungeon is
deeper if you do.

---

## A Note On Licences And Originality

The D&D System Reference Document 5.1 is released under Creative Commons Attribution 4.0
International.[^9] This book uses the SRD for mechanics, vocabulary, and example data: ability
scores, character classes, skill names, conditions, dice notation, combat rules, and equipment
categories, all with attribution. It does not reproduce the *Player's Handbook*, the *Dungeon
Master's Guide*, or the *Monster Manual*, which are separate proprietary works.

Mt. Graphnor is original work. It takes the form of a Fighting Fantasy-inspired gamebook and
draws on the conventions of that genre: linked passages, reader agency, dice-led risk, inventory,
failure endings, and replay. It does not reproduce maps, encounter designs, puzzle solutions, named
characters, or prose from any published gamebook.[^10]

When this book discusses Fighting Fantasy or other gamebook series by name, it does so as
historical and formal context. The line I'm holding is between influence, which is unavoidable and
fine, and reproduction, which is not.

---

The spreadsheet is still there somewhere. The campaign it served ended years ago. The habit it
started, of reaching for code when the problem outgrows the tools available, is still with me.
This book is what that habit became.

There's a door ahead. You know what to do.

---

[^1]: Memory in this context functions something like a d20 roll against a difficulty class I
can't quite determine. Sometimes I pass. The specific triggering problem, not so lucky.

[^2]: On reflection, a reasonable heuristic for most things.

[^3]: The risk is that the analogy eventually becomes more interesting than the concept, and the
reader leaves understanding gamebooks better but no clearer on graphs. The book tries to watch
for this.

[^4]: The SRD 5.1 is available at [dndbeyond.com](https://media.wizards.com/2023/downloads/dnd/SRD_CC_v5.1.pdf)
under Creative Commons Attribution 4.0 International. You can use it, build on it, and publish
with it, as long as you include the attribution notice. This book does.

[^5]: Mt. Graphnor is short by design. A short gamebook is a better teaching example than a long
one: you can hold the whole graph in your head, trace every mechanic back to a specific passage,
and understand the full save state without a PhD in the subject. The plan is to build a much
larger narrative adventure on the same engine once this book has proven the approach. That
adventure is not this book's concern. This book's concern is proving the engine works, which
Mt. Graphnor does.

[^6]: Nick Montfort, *Twisty Little Passages: An Approach to Interactive Fiction* (MIT Press,
2003). The title comes from a famously disorienting room description in *Adventure*, the 1976
text game. The book is the strongest single bridge between gamebook form, parser fiction, and the
history of hypertext narrative. Highly recommended if any part of this book makes you want to go
deeper into the tradition.

[^7]: TypeScript: [typescriptlang.org](https://www.typescriptlang.org/)

[^8]: Bun: [bun.sh](https://bun.sh/)

[^9]: Creative Commons Attribution 4.0 International: [creativecommons.org/licenses/by/4.0](https://creativecommons.org/licenses/by/4.0/)

[^10]: The [Fighting Fantasy](https://www.fightingfantasy.com/) series was created by Steve
Jackson and Ian Livingstone and published by Puffin/Wizard Books. The form is an inspiration.
The content, maps, encounters, puzzle answers, named characters, trade dress, remains their
work, not mine.
