# Chapter 02: Choose Your Node Adventure

## Research Question

How can a beginner understand graphs, directed edges, cycles, DAGs, trees, adjacency lists, and adjacency matrices through the familiar shape of gamebook passages, websites, and small adventure maps?

## Core Concept

Graphs model relationships between things. For this chapter, the practical graph is a gamebook:

- Passages are nodes.
- Choices are directed edges.
- Endings are terminal nodes.
- Puzzle locks and item gates are conditional edges.
- Reachability checks ask whether every authored passage can actually be visited.
- Cycles allow revisiting a place, but a DAG keeps the reading path moving forward.

The technical ladder should stay introductory: graph vocabulary first, then representations, then validation.

## RPG Or Gamebook Analogy

A gamebook is a directed graph printed out of order. The reader starts at one passage, follows a labelled choice, and lands at another passage. A table adventure can be a looser graph because players can ask to backtrack, improvise, or move through geography in ways a solo book cannot.

The chapter can contrast three related maps:

- **Website map**: pages and links, often cyclic.
- **Gamebook map**: passages and numbered choices, often mostly directed toward endings.
- **Five Room Dungeon map**: a small adventure graph whose rooms are mechanical roles rather than only literal locations.

## Dialogue Or Interlude Idea

**The Cartographer and the Adventurer** argue about whether an unreachable room exists.

The Cartographer says a room drawn on the map is real. The Adventurer says a room no door can reach is only decoration. The compromise introduces graph validation: authored content can exist in the data while still failing the player's traversal.

## Sources

- Authoritative CS/software source: [NIST Dictionary of Algorithms and Data Structures: graph](https://xlinux.nist.gov/dads/HTML/graph.html), [NIST DADS: directed graph](https://xlinux.nist.gov/dads/HTML/digraph.html), [NIST DADS: directed acyclic graph](https://xlinux.nist.gov/dads/HTML/directAcycGraph.html), and [Open Data Structures: Graphs](https://opendatastructures.org/ods-python/12_Graphs.html).
- D&D 5e SRD source, if relevant: not central for this chapter. Mention table adventures only as a graph analogy and keep rules detail for later chapters.
- Gamebook/hypertext source, if relevant: [Fighting Fantasy official site](https://www.fightingfantasy.com/), [Choose Your Own Adventure official site](https://www.cyoa.com/), [Roleplaying Tips: 5 Room Dungeons](https://www.roleplayingtips.com/5-room-dungeons/), and [Steve Lawford, Five-Room Dungeons](https://enac.hal.science/hal-03097484/document).
- Campaign Ledger evidence, if relevant: use only as a light comparison for website navigation and route graphs unless a later Hypertext chapter does the deeper case study.

## Campaign Ledger Evidence

Use this chapter mostly to set up graph thinking rather than to lean on Campaign Ledger. Useful later evidence to inspect when drafting:

- Route structure as a directed graph of full-page and fragment responses.
- Navigation paths for campaign, character, and rule surfaces.
- Tests that assert a route or fragment is reachable by a request.

Inference from project context: Campaign Ledger is better suited to chapter 3's hypermedia discussion and chapter 14's verification story than to the first graph vocabulary chapter.

## Gamebook Build Payoff

This chapter explains the earliest `src/gamebook` model:

- `src/gamebook/model.ts`: `Adventure`, `Passage`, `Choice`, `PassageId`, and ending kinds.
- `src/gamebook/graph.ts`: passage maps, reachability, missing target validation, targetless choice validation, unreachable passage detection, and Mermaid export.
- `src/gamebook/content/mt-graphnor.ts`: Mt. Graphnor as the first complete graph-shaped adventure.
- `src/gamebook/content/five-room-template.ts`: a reusable five-room contract for room tags and endings.

The build move should define a small adventure as data and then ask the validator whether the authored graph can actually be played.

## Notes For The Draft

### Opening Move

Start with the experience of reading a gamebook out of order. The pages look chaotic in print order but become meaningful when the reader follows choices.

Avoid starting with mathematical notation. Let the reader experience the idea before naming it:

1. A room or page is a node.
2. A choice is an edge.
3. A one-way instruction is a directed edge.
4. A loop is a cycle.
5. A forward-only adventure is close to a DAG.
6. A tree is a graph where each branch has one parent path, but many gamebooks are not pure trees because paths can reconverge.

### Sections

1. **Books That Are Maps**
   - Gamebook passages as nodes.
   - Choices as directed edges.
   - Endings as terminal nodes.

2. **Websites Are Gamebooks Without Dice**
   - Pages and links.
   - Cycles in normal web navigation.
   - Why hypertext makes graph structure visible.

3. **Graph Vocabulary Without Panic**
   - Node/vertex, edge, directed edge, cycle, DAG, tree, reachability.
   - Keep definitions precise but short.

4. **How Computers Store The Map**
   - Adjacency list as passage ID -> outgoing choices.
   - Adjacency matrix as a table of possible links.
   - Why the gamebook uses structured passage data first and derives graph checks from it.

5. **Five Rooms, Many Shapes**
   - Five Room Dungeon as a compact design frame.
   - Room labels are mechanical roles, not necessarily physical rooms.
   - Lawford's five-node graph angle shows that tiny graphs still have meaningful design variety.

6. **Validating The Dungeon**
   - Missing target IDs.
   - Unreachable passages.
   - Non-ending passages with no choices.
   - Missing ending coverage.
   - Mermaid graph output as a visual debugging aid.

### Diagrams

Use three diagrams:

- A tiny website cycle.
- A simple branching gamebook path with reconvergence.
- Mt. Graphnor's five-room shape, ideally generated from `exportMermaid`.

### Code Examples

Keep the first examples deliberately small:

```ts
interface Passage {
  id: string;
  title: string;
  choices: Choice[];
}

interface Choice {
  text: string;
  targetId: string;
}
```

Then show the project version after the reader understands why more fields exist.

Useful snippets:

- `createPassageMap(adventure.passages)`
- `validateAdventure(mtGraphnorAdventure)`
- `exportMermaid(mtGraphnorAdventure)`

### Sidebars

- **DAG Does Not Mean Boring**: forward motion can still branch, reconverge, and produce varied endings.
- **Trees Are A Special Case**: every tree is a graph, but not every branching story is a tree.
- **Cheating As Graph Editing**: turning to an arbitrary passage is like adding a temporary edge the author did not provide.

## Risks

- **Over-formalising too early**: keep mathematical notation out of the first pass unless it directly clarifies an example.
- **False claim that all gamebooks are DAGs**: some use loops, hubs, shopping locations, repeated combats, or revisitable areas.
- **Confusing geography with narrative state**: a room, a scene, and a stateful passage can all be nodes, but they are not the same modelling decision.
- **Rights and originality**: discuss Fighting Fantasy and Choose Your Own Adventure as forms and history. Do not reuse protected passage text, maps, encounter structure, trade dress, or distinctive names.
- **Five Room Dungeon literalism**: explain that the five rooms are design roles; Mt. Graphnor uses them as a template, not a rule that all adventures must be exactly five pages long.

## Bibliography-Ready Entries

- Black, Paul E., ed. "graph." *Dictionary of Algorithms and Data Structures*. National Institute of Standards and Technology. https://xlinux.nist.gov/dads/HTML/graph.html
- Black, Paul E., ed. "directed graph." *Dictionary of Algorithms and Data Structures*. National Institute of Standards and Technology. https://xlinux.nist.gov/dads/HTML/digraph.html
- Black, Paul E., ed. "directed acyclic graph." *Dictionary of Algorithms and Data Structures*. National Institute of Standards and Technology. https://xlinux.nist.gov/dads/HTML/directAcycGraph.html
- Morin, Pat. *Open Data Structures*. Chapter 12, "Graphs." https://opendatastructures.org/ods-python/12_Graphs.html
- Fighting Fantasy. Official website. https://www.fightingfantasy.com/
- Chooseco LLC. *Choose Your Own Adventure*. Official website. https://www.cyoa.com/
- Four, Johnn. "5 Room Dungeons." *Roleplaying Tips*. https://www.roleplayingtips.com/5-room-dungeons/
- Lawford, Steve. "Five-Room Dungeons." HAL open science record. https://enac.hal.science/hal-03097484/document
