# Appendix A: Glossary

Terms are listed alphabetically. Programming terms and RPG terms are interleaved, on the principle that the reader has been doing the same thing for the preceding fifteen chapters and has earned the right to find them together.

Where a term has a conventional abbreviation in common use, both are listed. Where the definition admits a wry observation without sacrificing accuracy, one has been admitted.

---

## A

**Ability Score**
In D&D and related systems, one of six fundamental measures of a character's physical and mental capability: Strength, Dexterity, Constitution, Intelligence, Wisdom, and Charisma. Each score is a number, typically between 3 and 20 in play, from which a modifier is derived. The score is the stored fact; the modifier is the derived one.

**Ability Modifier**
A number added to dice rolls involving the corresponding ability score, derived by the formula `floor((score - 10) / 2)`. A score of 10 gives a modifier of 0. A score of 16 gives +3. A score of 8 gives −1. One of the few genuinely elegant bits of arithmetic in a game otherwise full of tables.

**Access Control**
The practice of deciding which actors may perform which actions on which resources. Comprises authentication (knowing who is asking), authorisation (deciding whether they may), and the enforcement of both at every layer where the boundary might be crossed. Hiding a button is not access control. See also: *authentication*, *authorisation*, *capability*, *role*.

**Acyclic**
Describing a graph in which no path leads back to its own starting node. An adventure in which every choice moves you forward rather than allowing you to loop back and buy more potions is acyclic. See also: *cyclic*, *DAG*, *directed acyclic graph*.

**Adapter** (also: Compatibility Shim)
A thin translation layer that presents an existing interface under a different name, typically used when a library's public surface changes and the rest of the codebase should not need to know. The adapter changes the wiring; nothing else changes. Like a travel adaptor: same electricity, different shape.

**Adjacency List**
A data structure for representing a graph in which each node stores the list of nodes it connects to. Practical for sparse graphs where most nodes connect to only a small number of others, which describes most gamebooks. See also: *adjacency matrix*.

**Adjacency Matrix**
A data structure for representing a graph as a grid, with a row and column for every node and a mark at each intersection representing a connection. Efficient for dense graphs; wasteful for sparse ones, where most of the grid is empty. See also: *adjacency list*.

**Advantage**
In D&D, a condition on a d20 roll in which two dice are rolled and the higher result is kept. It shifts the distribution upward without changing the die itself: the average result of two-keep-highest is meaningfully better than a single roll, though the range stays 1 to 20. The gamebook represents it as the `"advantage"` value of `RollMode`. See also: *disadvantage*, *RollMode*, *d20 check*.

**Aggregate** (Domain-Driven Design)
A cluster of related entities and value objects that are treated as a single unit for the purposes of data changes. An `Adventure` is an aggregate: it owns its passages, encounters, items, and catalogue, and enforces consistency across all of them. Changes to things inside an aggregate go through its root. See also: *aggregate root*, *entity*, *value object*.

**Aggregate Root**
The entry point to an aggregate: the entity through which all access to the aggregate's contents is mediated. The aggregate root enforces the consistency rules that apply across the whole cluster. In the gamebook, `Adventure` is an aggregate root; you look up a passage through the adventure, not directly. See also: *aggregate*.

**Anti-Corruption Layer**
A translation boundary between two bounded contexts, or between a system and an external model it depends on. Prevents the external model's vocabulary and assumptions from leaking into the internal domain. The SRD importer in Campaign Ledger is an anti-corruption layer: it converts SRD data into the application's own representation rather than letting SRD structures propagate into domain code. See also: *bounded context*.

**Armour Class (AC)**
In D&D, the number an attack roll must meet or exceed to land. Higher armour class means harder to hit. A Fighter in full plate has AC 18; an unarmoured commoner has AC 10. In code, a threshold against which a roll result is compared. See also: *attack roll*, *difficulty class*.

**Attack Roll**
In D&D, a d20 roll plus an attack bonus compared against the target's Armour Class to determine whether an attack lands. Structurally a d20 check: roll, add modifier, compare to threshold. See also: *armour class*, *d20 check*, *damage roll*.

**Authentication**
The act of verifying who is making a request. A username and password are an authentication mechanism. A signed session cookie is an authentication token. Authentication answers "who are you?"; authorisation answers "are you allowed to do this?". See also: *authorisation*, *access control*.

**Authorisation**
The act of deciding whether an authenticated actor may perform a requested action on a specific resource, in a specific context. Being authenticated is a prerequisite for authorisation, not a substitute for it. See also: *authentication*, *capability*, *role*, *ownership*.

---

## B

**Bounded Context** (Domain-Driven Design)
A region within which a particular model and its vocabulary are consistent and authoritative. At the boundary between two contexts, translation is required: a "character" in a player-facing context is a different shape of data from a "character" in a campaign-management context. Keeping contexts separate lets each evolve independently. See also: *anti-corruption layer*, *ubiquitous language*.

**Breadth-First Search (BFS)**
A graph traversal algorithm that visits all nodes at the current depth before moving deeper. In the gamebook validator, BFS starts at the start passage and works outward, marking everything it visits; anything not visited by the end is unreachable. One of those algorithms that looks intimidating in a textbook and obvious in thirty lines of code. See also: *reachability*.

**Build Move**
The summary section at the end of each chapter in this book, listing exactly what was built in that chapter, where it lives in the codebase, and why the files are where they are. Not a feature in any framework; a structural convention of this book.

---

## C

**Campaign Ledger**
The second running example in this book: a privately hosted web application for managing tabletop RPG campaigns, used at the author's own table. It handles character sheets, session notes, NPC dossiers, rules references, role-based access, and a deployment posture with accessibility checks and acceptance notes. Not a public product. The mature, production-scale counterpart to Mt. Graphnor. See also: *Mt. Graphnor*.

**Capability**
A specific thing an actor is permitted to do: read a campaign, write a character sheet, access the author tools. More granular than a role, and more precise for access control decisions. See also: *role*, *authorisation*, *access control*.

**Character Class**
In D&D, a character's primary vocation: Fighter, Rogue, Wizard, Cleric, and many others. Determines hit dice, armour proficiency, weapon proficiency, available abilities, and spell access. In the gamebook's code, a closed vocabulary of string literals used to look up class-specific data. See also: *closed vocabulary*, *character template*.

**Character Template**
In the gamebook, a data record describing what a particular class or race provides at character creation: starting hit points, armour class, skill proficiencies, inventory, and attack profile. A plain object, not a class in the object-oriented sense. The design choice that makes composition possible without inheritance. See also: *composition*, *inheritance*.

**Choice**
In a gamebook, a single available action presented to the player, leading from one passage to another. In the graph, a choice is a directed edge; in the code, a `Choice` object with an `id`, display text, and a `targetId` naming the passage it leads to. A choice may carry requirements that gate whether it is offered at all. See also: *passage*, *directed edge*, *gate*.

**Closed Vocabulary**
A field whose valid values are a fixed, known set. `CharacterClass`, `Ability`, `Skill`, and `RollMode` are closed vocabularies in the gamebook: they can only hold values declared in their union type, and the compiler enforces this. The alternative is an open string field, which can hold anything and is checked by nobody until something explodes at runtime.

**Cohesion** (see: *high cohesion*)

**Combat Loop**
The turn-based structure that resolves a fight: one participant's action is taken to completion (an attack roll, then a damage roll if it lands, then the result applied) before the next begins. Modelled in the gamebook as a sequence of complete rounds, each computed by a reducer and then applied to the encounter state. The combat equivalent of an event loop. See also: *event loop*, *reducer*, *encounter*, *EncounterState*.

**Compatibility Shim** (see: *adapter*)

**Composition**
An approach to building complex data types by assembling them from smaller, independent parts rather than inheriting them from a parent class. "Prefer composition over inheritance" is one of the oldest pieces of advice in object-oriented design, though the Gang of Four had to write a whole book to make people believe it. See also: *inheritance*, *character template*.

**Conditions**
In D&D, status effects applied to creatures during play: Blinded, Charmed, Grappled, Prone, Stunned, and others. Each has defined mechanical effects on what the affected creature can do. In the gamebook, stored as strings in `GameState.conditions` and used to gate choices. See also: *GameState*, *flags*.

**Coupling** (see: *low coupling*)

**Cyclic**
Describing a graph in which at least one path leads back to its own starting node. A shopping district in an adventure game is typically cyclic: you can visit the alchemist three times. Most websites are cyclic graphs. See also: *acyclic*, *directed cyclic graph*.

---

## D

**d20 Check**
The fundamental resolution mechanic in D&D: roll a twenty-sided die, add a modifier, compare to a difficulty class. Success if the total meets or exceeds the DC; failure otherwise. Expressed in the gamebook as a `RollResult` containing every piece of arithmetic that produced the outcome. See also: *difficulty class*, *modifier*, *RollResult*.

**DAG** (Directed Acyclic Graph)
A directed graph with no cycles: every path through it moves forward, with no way to return to a previously visited node via the same route. Most gamebooks are DAGs, or close to them. The abbreviation sounds like something lurking in a dungeon, which is appropriate. See also: *directed graph*, *acyclic*.

**Damage Roll**
In D&D, the roll that determines how much damage a successful attack deals. Separate from the attack roll. A longsword deals 1d8 damage; a dagger 1d4. In the gamebook, represented as a `DamageRollResult` with the notation, individual rolls, modifier, and total. See also: *attack roll*, *DamageExpression*, *DamageRollResult*.

**DamageExpression**
The value object the gamebook uses to describe a quantity of damage: a dice `count`, the number of `sides` per die, a flat `modifier`, and a damage `type`. `{ count: 1, sides: 8, modifier: 3, type: "slashing" }` is a longsword hit from a Strength +3 fighter. The human-readable form (`1d8+3`) is derived from it for display, not stored. See also: *damage roll*, *DamageRollResult*, *value object*.

**DamageRollResult**
The structured type in the gamebook that records a completed damage roll: the notation (`"1d8+2"`), all individual dice rolled, the modifier, and the total. See also: *damage roll*, *RollResult*.

**Data Model**
A structured representation of the facts a system needs to know about the things in its domain. A character sheet is a data model for a D&D character. A `Character` interface is a data model in code. The discipline of building a good data model is most of what this book is about.

**Dependency Inversion Principle**
The principle that high-level policy should not depend on low-level implementation details; both should depend on abstractions. In the gamebook, the domain modules do not import the web framework; the application shell imports them. The direction of dependency points inward, toward the domain. One of the SOLID principles, most usefully read as: "if the framework changes, does my domain logic have to change?" If yes, something is pointing the wrong way. See also: *module*, *high cohesion*, *low coupling*.

**Derived Fact**
A value that can be calculated from stored facts and therefore should not be stored independently. The ability modifier is a derived fact: given the ability score, the formula always produces the same result. Storing it separately creates a risk of inconsistency. See also: *stored fact*, *pure function*.

**Deserialisation**
The act of reading serialised data (a string, a file, a byte stream) and reconstructing a usable in-memory representation from it. The inverse of serialisation. The storage boundary is where deserialisation happens, and where validation must happen immediately after. See also: *serialisation*, *storage boundary*, *validation*.

**Difficulty Class (DC)**
In D&D, the target number a d20 roll plus modifier must meet or exceed for an action to succeed. A Difficulty Class of 15 for a Stealth check means the total rolled (die + Dexterity modifier + proficiency if applicable) must be at least 15. See also: *d20 check*, *ability modifier*, *proficiency bonus*.

**Digraph** (see: *directed graph*)

**Directed Acyclic Graph** (see: *DAG*)

**Directed Edge**
A connection between two nodes in a graph that has direction: it goes from A to B, but not necessarily from B to A. In a gamebook, a choice is a directed edge. In a web application, a link is a directed edge. In life, most decisions are directed edges and some are rather hard to reverse.

**Directed Graph** (also: Digraph)
A graph in which all edges have a direction. Gamebooks, websites, dependency trees, and version control histories are directed graphs. See also: *directed edge*, *DAG*, *directed cyclic graph*.

**Directed Cyclic Graph** (also: DCG)
A directed graph in which at least one cycle exists. Most websites are directed cyclic graphs: you can navigate back to where you started. See also: *cyclic*, *directed acyclic graph*.

**Disadvantage**
In D&D, the mirror of advantage: two d20s are rolled and the lower result is kept, shifting the distribution downward without changing the range. The gamebook represents it as the `"disadvantage"` value of `RollMode`. Advantage and disadvantage do not stack or accumulate; a roll is made at advantage, at disadvantage, or normally, and having both at once cancels to normal. See also: *advantage*, *RollMode*, *d20 check*.

**Domain**
The subject matter a piece of software exists to serve. Not the technology, not the schema, not the framework: the real-world activity the software represents and supports. For Campaign Ledger, the domain is tabletop RPG campaign management. For Mt. Graphnor, the domain is a branching gamebook adventure. Understanding the domain is a prerequisite for modelling it well. See also: *domain-driven design*, *ubiquitous language*.

**Domain-Driven Design (DDD)**
An approach to software development, named and systematised by Eric Evans in 2003, in which the structure and vocabulary of the code deliberately match the structure and vocabulary of the domain it serves. The code speaks the domain's language. The boundaries in the code reflect the boundaries that exist in the domain. Most practitioners arrive at the approach by instinct before they encounter the name. The book exists for when you want to discuss it with other people. See also: *domain*, *ubiquitous language*, *bounded context*, *aggregate*, *entity*, *value object*.

**DRY Principle** (Don't Repeat Yourself)
The principle that every piece of knowledge should have a single, authoritative representation in a system. When the same logic exists in two places, changes must be made twice; eventually they won't be. The cure, a shared abstraction, becomes its own problem when it accumulates so much logic that no single use case is well-served by it.

**Durable State**
State that has been written to persistent storage and will survive the process ending. The opposite of ephemeral state. A character's progress through Mt. Graphnor becomes durable state when it is written to `localStorage`. See also: *ephemeral state*, *serialisation*, *storage boundary*.

---

## E

**Edge**
In graph theory, a connection between two nodes. In a gamebook, a choice is an edge from one passage to another. In a website, a link is an edge. Edges are the reason graphs are interesting: a set of nodes without edges is just a list, which is considerably less exciting and does not have its own branch of mathematics. See also: *node*, *directed edge*.

**Encounter**
In D&D and the gamebook, a structured conflict between the player character and one or more enemies, resolved through a turn-based loop of attack rolls, damage rolls, and outcome determination. Defined by authored data (enemy statistics); state tracked separately during play. See also: *EncounterState*, *combat loop*.

**EncounterState**
The mutable record of an in-progress fight: the enemy's current hit points, whether it has been defeated, and the round count. Distinguished from the `Encounter` authored definition because the definition doesn't change; the state does.

**Entity** (Domain-Driven Design)
A domain object with a meaningful identity that persists through change. A character is an entity: Brandavar is still Brandavar after gaining a level, losing hit points, or changing armour. The identity (the `id` field) is what matters; the attributes describe its current state. Contrast with value objects, which have no independent identity. See also: *value object*, *aggregate*.

**Ephemeral State**
State held in memory that does not survive the process ending. Everything a running application tracks in variables is ephemeral until it is written to durable storage. See also: *durable state*.

**Event Loop**
A pattern for processing asynchronous work: one event is processed to completion, then the next is taken from the queue, and so on. JavaScript's runtime uses an event loop; so does a D&D combat round, in the sense that each participant's turn is resolved completely before the next begins. Run to completion; then proceed. See also: *reducer*, *state machine*.

**Expected Value**
The long-run average outcome of a repeated experiment. The expected value of a fair d20 is 10.5. Useful for reasoning about game balance and mechanic design. Says nothing about what will happen on the next specific roll, regardless of what has happened on the previous ten. See also: *random variable*, *variance*.

---

## F

**Fighting Fantasy**
A series of single-player adventure gamebooks created by Steve Jackson and Ian Livingstone, first published by Puffin Books in 1982. The first volume, *The Warlock of Firetop Mountain*, established the format: second-person narration, numbered passages, a two-stat character system (Skill and Stamina), and dice-driven combat. A significant influence on this book and on a generation of game designers, including those who have never held a physical copy.

**Five Room Dungeon**
A compact adventure-design template giving each of five structural beats a distinct mechanical role: entrance/guardian, puzzle or social challenge, trick or setback, climax, and reward or conclusion. The five beats are not necessarily five literal rooms; they are a pacing structure. Mt. Graphnor uses this template. A graph-theoretic analysis by Steve Lawford shows that five nodes can be connected in twenty-one distinct ways, which is twenty-one different dungeons from the same five rooms.

**Flags**
Boolean facts about what has happened in a play session, stored as strings in `GameState.flags`. A flag is either set or not; it has no associated value. Once set, flags are permanent within a session: "the puzzle room has been solved" is a historical fact, not a current state that can be reversed. Contrast with items (which can be spent) and resources (which have quantities). See also: *GameState*, *conditions*.

**Fragment**
In the context of htmx and server-side rendering, a partial HTML response rather than a complete page document. When a player makes a choice in Mt. Graphnor, the server returns just the updated passage panel rather than a full page reload. The fragment is swapped into the correct position by htmx; the rest of the page is undisturbed. The appeal of fragments is the same as the appeal of a good dungeon door: it opens exactly the part of the wall you need, without requiring the entire dungeon to move.

---

## G

**GameState**
The versioned save document in the gamebook: a single object containing everything that has changed since the adventure began. Schema, version, adventure ID, current passage, character, hit points, inventory, flags, encounter states, conditions, and log. The aggregate root for the play session.

**Gate**
A requirement checked before a choice is offered or a passage is entered: a needed item, a set flag, a minimum value. If the gate is not satisfied, the action does not appear. The gamebook checks gates when assembling the choices for a passage, so the player is never shown an action they cannot take. See also: *choice*, *flags*, *item*.

**Graph**
A mathematical structure consisting of nodes (also called vertices) connected by edges. Gamebooks, websites, social networks, dependency trees, tube maps, and version control histories are all graphs. Once you start seeing them you find them everywhere, which is either illuminating or mildly unsettling, depending on temperament. See also: *node*, *edge*, *directed graph*, *DAG*.

---

## H

**HATEOAS** (Hypermedia As The Engine Of Application State)
One of the constraints Roy Fielding described in his doctoral dissertation defining REST. The core idea: a response should tell the client what it can do next, rather than requiring the client to know the available actions in advance. A gamebook passage embodies this: it presents the available choices for the current state, and choices that cannot be taken in the current state simply do not appear. Named for a principle, which is more than can be said for most acronyms.

**Hit Dice**
In D&D, the dice a character class uses to determine starting and recovered hit points. A Fighter uses d10 hit dice; a Wizard uses d6. Spent during a short rest to recover hit points; the number available resets on a long rest.

**Hit Points (HP)**
In D&D and most RPG systems, a numerical measure of how much damage a character can sustain before falling unconscious. Depleted by damage; restored by healing. The stored fact on a character sheet; the value that changes most during play. See also: *ability score*, *armour class*.

**High Cohesion**
The principle that things which change for the same reason should be grouped together in the same module. A file containing the graph validation logic should contain all of the graph validation logic, not half of it and some unrelated rendering code. The complement of low coupling. See also: *low coupling*, *module*.

**Hono**
A fast, lightweight web framework for TypeScript, running on Bun and several other runtimes. Used in this book as the application shell for Mt. Graphnor: routing, middleware, and request/response handling. The domain modules do not know Hono exists.

**htmx**
A JavaScript library that extends HTML to allow any element to make HTTP requests and swap responses into the page. Used in this book to make gamebook choice forms submit as AJAX requests rather than full page reloads. Built on the observation that most of what JavaScript frameworks do could be expressed as HTML attributes, if HTML were willing. See also: *fragment*, *HATEOAS*, *progressive enhancement*.

**Hypertext**
Text that links to other text: a reading experience that branches, connects, and navigates rather than proceeding in a single sequence. The word was coined by Ted Nelson in 1965. The web is built on it. Gamebooks are printed hypertext.

---

## I

**Idempotent**
Describing an operation that produces the same result whether performed once or many times. GET requests are idempotent: loading a page five times changes nothing. POST requests are typically not: submitting a form five times may place five orders. The web's distinction between safe methods (GET) and unsafe ones (POST) is largely a distinction between idempotent and non-idempotent operations.

**Inheritance**
A mechanism in object-oriented programming by which one class can be defined as a specialisation of another, gaining all of the parent's data and behaviour and adding or overriding on top. Useful when the relationship is genuinely hierarchical and the Liskov Substitution Principle is respected. Reaches its limit when a domain has multi-dimensional variation that a single-parent tree cannot express: a D&D Paladin, for instance, is part Fighter, part Cleric, and entirely awkward to fit into any single-parent hierarchy. See also: *Liskov Substitution Principle*, *composition*.

**Interface** (TypeScript)
A TypeScript declaration that describes the shape of a value: its fields, their names, and their types. Interfaces describe contracts; classes and plain objects may satisfy them. The gamebook's `Character`, `Passage`, and `Choice` are interfaces: they describe what these things must contain, not how they are created.

**Item**
In the gamebook, an entry in the player's inventory, stored as an id string in `GameState.inventory`. Items can be required by a gate, consumed by a choice, or simply carried. Membership ("do I have the brass key?") is a Set question; an item is either present or absent, with no associated quantity. Resources, which have counts, are modelled separately. See also: *gate*, *flags*, *resource*.

---

## L

**Liskov Substitution Principle**
The principle, formalised by Barbara Liskov in 1987, that a subtype should be substitutable for its parent type without breaking the behaviour that code using the parent type expects. A Fighter standing in for a Character is fine: it has everything a Character has. A subclass that overrides methods in ways that would surprise code written for the parent is breaking the principle. The test: if I swap a parent for a child, does everything still work as expected? See also: *inheritance*, *composition*.

**Low Coupling**
The principle that things which change independently should not know too much about each other. A graph validation module should not import the HTTP routing layer. The domain logic should not import the database implementation. Each change should be as local as possible. The complement of high cohesion. See also: *high cohesion*, *module*, *dependency inversion principle*.

**`localStorage`**
A browser API that stores key-value pairs as strings, persisted across page reloads for the same origin. Used in Mt. Graphnor for automatic save-on-every-choice. Cleared by the user on demand, not accessible from other devices, not visible to the server. The right tool for a single-player browser game and the wrong tool for anything that needs to synchronise across devices. See also: *storage boundary*, *durable state*.

---

## M

**Migration**
In the context of save files and databases: code that converts data from an older format to a newer one. A migration is a promise to old players that progress made under an earlier format will survive a format change. Migrations should be tested with fixtures representing the oldest supported format.

**Modifier**
In D&D, a number derived from an ability score and added to dice rolls. Derived by the formula `floor((score − 10) / 2)`. A modifier of +3 on a d20 check raises the effective success chance by 15 percentage points. See also: *ability score*, *proficiency bonus*, *d20 check*.

**Module**
A boundary around a design decision: a file, directory, or package with a name, an explicit public surface, and private internals. Other code depends on the public surface. The private internals can change without breaking anything outside. Good modules have high cohesion internally and low coupling externally. The book that introduced the key concepts is Parnas (1972); the number of times the lesson has had to be relearned since then is not countable in finite time. See also: *high cohesion*, *low coupling*, *dependency inversion principle*.

**Mt. Graphnor**
The first running example in this book: a short, complete, playable gamebook that runs in a browser. Every passage is reachable, every ending is achievable, the mechanics work, and it can be played in a single sitting. Built to be small enough that the entire engine can be understood at once and every concept in the book can be traced to a specific piece of working code. See also: *Campaign Ledger*, *Five Room Dungeon*.

---

## N

**Node** (also: Vertex)
A point in a graph. In a gamebook, a passage is a node. In a website, a page is a node. In a social network, a person is a node. Connected to other nodes by edges. See also: *graph*, *edge*, *vertex*.

---

## O

**Ownership**
The relationship between a user and a specific resource, granting access rights that a global role does not. A player owns their character sheet regardless of any admin's title. A Game Master owns the campaign prep for their campaign, not for other campaigns. Ownership ties a permission to a specific resource rather than granting it globally. See also: *role*, *capability*, *authorisation*.

---

## P

**Passage**
In a gamebook, a numbered (or named) unit of prose describing a moment in the adventure, accompanied by a set of choices. The fundamental node in the gamebook's graph. In the codebase, a `Passage` interface with an `id`, a `body`, a list of `Choice` objects, and an optional `ending`. See also: *choice*, *graph*, *node*.

**Polymorphism**
The ability to write code that works with multiple different types through a shared contract, without needing to know which specific type it has. TypeScript achieves this through structural typing: if a value has the right shape, it satisfies the interface, regardless of how it was created. A function that accepts a `Character` works with any object that satisfies the `Character` interface. See also: *interface*, *structural typing*.

**Post/Redirect/Get (PRG)**
A web application pattern for handling form submissions that change server state. The POST is processed, the state changes, and the response is a redirect (303 See Other) to a GET endpoint rather than the new content directly. The client follows the redirect and renders a fresh GET response. Solving the double-submission problem that arises when a user refreshes a POST response.

**Proficiency Bonus**
In D&D, a bonus added to rolls involving skills, attacks, and saving throws a character is proficient in. Scales with character level: +2 at levels 1–4, up to +6 at levels 17–20. The formula `floor((level − 1) / 4) + 2` produces the correct result for all twenty levels, which is the kind of elegant compact formula that makes you feel obscurely grateful to whoever designed it. See also: *ability modifier*, *skill modifier*, *d20 check*.

**Progressive Enhancement**
A web development approach in which a baseline experience works without JavaScript, and enhanced behaviour is layered on top when JavaScript is available. In the gamebook, choice forms work as plain HTML form submissions; htmx enhances them with fragment-swapping when present. If JavaScript fails to load, the game still works. See also: *htmx*, *fragment*.

**Provenance**
The record of where something came from. For rules data, provenance answers: which source provided this entity, under what licence, and through what path did it enter the application. Without provenance, you have data. With provenance, you have data you can publish, attribute, and defend.

**Pseudo-random**
Describing numbers produced by a deterministic algorithm that are statistically random enough for practical use but are not truly random: given the same starting seed, the sequence repeats exactly. `Math.random()` is pseudo-random. For a game this is entirely sufficient and has a useful side effect: a seeded generator can reproduce a run for testing, which a truly random source could not. See also: *random variable*, *RandomSource*.

**Pure Function**
A function that, given the same inputs, always returns the same outputs and has no side effects. The ability modifier calculation is a pure function: `abilityModifier(14)` is always 2. Pure functions are trivially testable, free of hidden dependencies, and composable. The gamebook's rules layer is almost entirely pure functions.

---

## R

**Random Variable**
A quantity whose value is determined by chance, with a known set of possible outcomes and known probabilities for each. A fair d20 is a random variable with 20 equally probable outcomes. In code, simulated using a pseudo-random number generator. See also: *pseudo-random*, *expected value*, *variance*.

**RandomSource**
In the gamebook, the injectable source of randomness for dice: a function returning a number, defaulting to `Math.random`. Because it is a parameter rather than a hard-coded call, tests can pass a controlled function that returns known values, making dice-dependent logic deterministic and verifiable. An example of depending on a contract rather than a concrete implementation. See also: *pseudo-random*, *pure function*, *dependency inversion principle*.

**Reachability**
In graph theory, the question of whether a path exists from one node to another by following edges. In a gamebook, the critical reachability question is: can the player get from the start passage to this passage? An unreachable passage exists in the data but can never be encountered in play. The gamebook validator checks reachability as its primary structural concern. See also: *graph*, *node*, *breadth-first search*.

**Record** (data structure)
A named collection of related fields, each with a name, a type, and a set of allowed values. A character sheet is a record. TypeScript's `interface` keyword defines records. The Scribe's instinct — that a Hero who "contains multitudes" still needs a number next to their name — is the correct instinct. Records are how software makes the multitudes legible. See also: *data model*, *interface*.

**Record\<K, V\>** (TypeScript utility type)
A TypeScript built-in that describes an object with exactly the keys of type `K`, each holding a value of type `V`. `Record<Ability, number>` is equivalent to writing out all six ability names as fields by hand, but safer: if you add a new ability, TypeScript will require a corresponding entry. See also: *closed vocabulary*, *interface*.

**Reducer**
A function that takes a previous state and an event (or result) and returns the next state. Used in the gamebook to separate the calculation of a combat round result from the application of that result to the game state. Makes both parts independently testable. See also: *event loop*, *state machine*.

**Refactoring**
Changing the internal structure of a system without changing what it does from the outside. Safe to do when tests cover the external behaviour being preserved. The reason to have tests; the reason the tests must cover the right boundaries. Chapter 13 contains a real example: renaming `AdventureNode` to `Passage` changed nothing the code did, and everything the code said.

**Repository** (Domain-Driven Design)
An abstraction over data access that presents a collection-like interface to domain code, hiding the storage details. Domain logic calls `getCharacter(id)`; the repository decides whether to query SQLite, a cache, or an in-memory store. Callers depend on the interface, not the implementation. Also makes testing significantly easier: swap the real repository for a test double and no database is required. See also: *dependency inversion principle*, *module*.

**Resource**
A counted thing a character holds, modelled as a record with a current value and an optional maximum: rations, torches, spell slots, gold. The defining question for a resource is "how many?", which distinguishes it from an item (a membership question, "do I have it?") and a flag (a historical fact, "did it happen?"). Spending a resource decrements its current value; it cannot drop below zero. See also: *item*, *flags*, *spell slot*.

**Role**
A named set of responsibilities in an access control system: player, game master, admin, author. Roles do not map to permissions globally; they map to permissions in context. Being an admin for a system does not make you the game master of every campaign in that system. See also: *capability*, *ownership*, *authorisation*.

**RollMode**
A union type in the gamebook representing the three possible d20 roll configurations: `"normal"` (roll once), `"advantage"` (roll twice, keep highest), and `"disadvantage"` (roll twice, keep lowest). See also: *advantage*, *disadvantage*, *d20 check*.

**RollResult**
The structured record of a completed d20 check in the gamebook: all dice rolled, the die that counted, the modifier applied, the total, the DC if there was one, the success or failure flag, the mode, and a human-readable reason. The player can read the full story of why they failed, rather than receiving a bare verdict. See also: *d20 check*, *DamageRollResult*.

**RPG** (Roleplaying Game)
A collaborative game in which players create characters and navigate a shared fictional world, with a game master who narrates the world and adjudicates rules. Dungeons & Dragons is the most widely known example. Relevant to this book because RPG systems are explicit models of domains: they have entities, rules, state, events, and bounded vocabularies. They are, in a very specific sense, software you play with dice.

---

## S

**Saving Throw**
In D&D, a d20 roll made to resist a harmful effect: a dragon's breath, a wizard's spell, a trap's poison. The type of saving throw (Strength, Dexterity, Constitution, Intelligence, Wisdom, or Charisma) depends on what is being resisted. Structurally identical to a skill check: roll, add modifier, compare to DC.

**Schema**
A declaration of the expected structure and type of a piece of data. The gamebook's save document has a `schema` field (the string `"dads-gamebook-save"`) that identifies the document type, separate from its `version`. Without a schema check, a loader cannot distinguish a gamebook save from any other JSON object that happens to be in storage.

**Serialisation**
The act of converting an in-memory data structure to a string or byte stream for storage or transmission. The inverse is deserialisation. JSON.stringify is serialisation; JSON.parse is deserialisation. The storage boundary is where serialisation happens, and where validation must happen on the return trip. See also: *deserialisation*, *storage boundary*.

**Set** (data structure)
A collection that stores each value at most once and answers membership in constant time: `set.has(id)` is fast regardless of how many items the set holds. The gamebook uses a `Set` when checking inventory membership, converting the stored array to a set for the check and back to an array for storage, because arrays serialise cleanly to JSON and sets do not. The right structure for "is this present?"; the wrong one for "how many?". See also: *item*, *serialisation*.

**Skill**
In D&D, a specific area of competence derived from an ability score: Athletics (Strength), Stealth (Dexterity), Arcana (Intelligence), Perception (Wisdom), and others. A character proficient in a skill adds their proficiency bonus to checks using that skill. See also: *skill modifier*, *proficiency bonus*, *d20 check*.

**Skill Modifier**
The total modifier added to a skill check: the ability modifier for the relevant ability, plus the proficiency bonus if the character is proficient. A Rogue with Dexterity 16 (+3) and proficiency in Stealth at level 1 (+2) adds +5 to Stealth checks. See also: *ability modifier*, *proficiency bonus*.

**Spell Slot**
In D&D, a limited resource that powers spellcasting. A Wizard has a number of spell slots per level; casting a spell of that level expends one. Slots reset on a long rest. In Campaign Ledger, tracked as a resource with a current value and maximum, decremented when a spell is cast.

**SQLite**
A file-based relational database: structured, queryable, transactional, and persistent across processes. Used in Campaign Ledger as the server-side source of truth for all campaign data. Unlike browser local storage, it is accessible from the server, queryable with SQL, and available on any device that can reach the server. See also: *`localStorage`*, *storage boundary*.

**State Machine**
A system with a finite set of named configurations (states) and defined rules for transitioning between them. A combat encounter is a state machine: ready, resolving, continue, victory, defeat, retreat. State machines make implicit logic explicit and invalid states unrepresentable, if designed carefully. See also: *event loop*, *reducer*.

**Stored Fact**
A value that must be recorded because it cannot be derived from anything else. Ability scores are stored facts: there is no formula that produces them from other character data. Contrast with derived facts, which can be calculated on demand and should not be stored separately. See also: *derived fact*, *pure function*.

**Storage Boundary**
The point at which data crosses from in-memory application state to durable storage, or back again. The boundary is where serialisation, deserialisation, and validation all live. Data arriving across the storage boundary is untrusted: it may be from an older version, hand-edited, corrupted, or from a different application entirely. See also: *serialisation*, *validation*, *durable state*.

**Structural Typing**
TypeScript's type system checks whether a value has the right shape, regardless of how it was declared. A plain object with the right fields satisfies an interface without needing to explicitly `implement` it. This enables polymorphism without inheritance: any value that looks like a `Character` is a `Character`, as far as the compiler is concerned. See also: *interface*, *polymorphism*.

**System Reference Document (SRD)**
The publicly available subset of D&D 5th Edition rules released by Wizards of the Coast under a Creative Commons Attribution licence. The SRD 5.1 covers the core mechanics used in this book: ability scores, character classes, skills, conditions, equipment, and dice rules. Using it requires attribution; this book provides it.

---

## T

**Tree**
A graph in which every node except the root has exactly one parent, and no paths converge. File systems are trees. Family trees are trees. Most gamebooks are close to trees but not quite, because paths often reconverge at a common antechamber before the finale. When paths reconverge, you have a DAG rather than a tree. See also: *DAG*, *graph*.

**TypeScript**
A statically typed superset of JavaScript that adds a compile-time type system and other features. Used throughout this book as the primary implementation language. The type system cannot protect against runtime errors at the storage boundary, which is why validation is still required. Available at typescriptlang.org.

---

## U

**Ubiquitous Language** (Domain-Driven Design)
The shared vocabulary that should appear identically in conversations, documents, and code throughout a project. When the domain expert says "saving throw" and the code says `defensiveRollOutcome`, they have started to diverge, and the divergence will widen. The gamebook's `Passage`, `Choice`, `Encounter`, and `GameState` are the ubiquitous language of the gamebook domain. See also: *domain-driven design*, *bounded context*.

**Union Type** (TypeScript)
A TypeScript type that allows a value to be one of a fixed set of options: `"fighter" | "rogue" | "wizard" | "cleric"`. The compiler enforces membership at compile time; runtime validation enforces it when data arrives from outside the type system. The code's expression of a closed vocabulary. See also: *closed vocabulary*, *interface*.

---

## V

**Validation**
The explicit checking of data arriving from an untrusted source to ensure it conforms to expected types, shapes, and values before the application trusts it. The type system checks code at compile time. Validation checks data at runtime, at the storage boundary, where the type system cannot see. Readable error messages are not a luxury; they are the difference between "Load failed" and "This save is for a different adventure." See also: *storage boundary*, *deserialisation*, *schema*.

**Value Object** (Domain-Driven Design)
A domain object defined entirely by its attributes, with no meaningful independent identity. A `RollResult` is a value object: two results with the same values are interchangeable. Value objects can be copied, compared by value, and replaced without ceremony. Contrast with entities, which have persistent identity. See also: *entity*, *aggregate*.

**Variance**
A measure of how spread out the possible outcomes of a random experiment are. A fair d20 has high variance: outcomes range from 1 to 20, each equally likely. Dice pools (several dice summed) have lower variance because extreme totals require all dice to agree. High variance means big swings; low variance means skill differences express themselves more reliably. The preferred amount of variance is a game design question, not a mathematics question. See also: *expected value*, *random variable*.

**Version**
A number attached to a save document (or any serialised format) that declares which version of the format it was written with. When the format changes, the version increments and migration code handles old saves. Without a version field, old and new formats are indistinguishable and loading an old save into new code produces undefined behaviour, which is a polite way of saying "something horrible happens."

**Vertex** (see: *node*)

---

## W

**WCAG** (Web Content Accessibility Guidelines)
A set of technical standards published by the W3C for making web content accessible to people with disabilities. Level AA is the standard required by most accessibility legislation and procurement policies. Automated tools like Pa11y can check for deterministic violations; human review is required for the rest.

---

*Terms introduced by borrowed names from the D&D System Reference Document 5.1 (ability score, armour class, conditions, hit points, proficiency bonus, saving throw, skill, spell slot) are used under Creative Commons Attribution 4.0 International. See Appendix B for full attribution.*