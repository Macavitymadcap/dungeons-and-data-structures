# Chapter 13: Authoring A Branching Adventure

---

> **The Cartographer and the Playtester**
>
> The Playtester had been through the dungeon three times. Each run had felt good: the choices
> landed, the pacing was right, the final room carried weight. There was nothing to complain
> about.
>
> The Cartographer spread the map on the table.
>
> "There," said the Cartographer, pointing at a passage in the northeast corner. "The Silver
> Gallery. Twelve rooms of original work, I might add. Best prose in the whole dungeon."
>
> The Playtester looked at the map. Then at the Cartographer. "I've never been there."
>
> "No one has. There are no choices leading to it. I drew it after the main passages were
> connected and forgot to wire it in."
>
> A silence.
>
> "The prose is very good," said the Cartographer.
>
> "I believe you."
>
> "The point is," said the Cartographer, with some dignity, "that the local experience and the
> global structure are two different things. You felt the choices. I can see where the choices
> point. Neither of us knew about the Silver Gallery until I looked at the whole map at once."
>
> The Playtester considered this. "So the validator is not telling you your prose is bad."
>
> "The validator cannot read prose. It can only ask: is this passage reachable? Does every
> choice point somewhere? Are the endings actually endings? It is not a critic. It is a
> surveyor."

---

In Chapter 12, we looked at the player's side of persistence: saving progress, loading it
back, migrating old formats, and validating the save file at the storage boundary. That chapter
was about the state the player accumulates while running the adventure.

This chapter is about the other side of the same coin: the adventure itself. How it is
structured, how it is validated, how an author can inspect it before a player ever touches
it, and how to keep the writing process honest about the difference between prose that feels
good locally and structure that holds up globally.

Authoring a branching adventure is not the same skill as writing linear prose. Linear prose
has one path. A branching adventure has a graph, and writing the prose is only half the job.
The other half is maintaining the graph: making sure every passage can be reached, every
choice points somewhere, every requirement can be satisfied, and every ending is actually
achievable. Without those guarantees, a beautiful corridor can sit in the data forever,
visited by no one.

---

## A Passage Is A Record

The Playtester experiences a passage as prose and choices. The software experiences it as
a data structure.

```typescript
interface Passage {
  id: string;
  title: string;
  body: string;
  choices: Choice[];
  ending?: EndingKind;
  tags?: PassageTag[];
  encounterId?: string;
}
```

`id` is the stable identifier. It is not a number, because numbers do not carry meaning and
are easy to confuse. It is a short, descriptive string: `"entrance"`, `"keyboard-room"`,
`"trap-hall"`, `"ending-victory"`. The id names the passage's role in the adventure.[^1]

`title` is what the player sees as a heading. `body` is the prose. These are the parts the
author cares about most. They are also the parts the validator cares about least: it does not
read prose, and it does not evaluate whether the title is appropriate.

`choices` is the list of actions available from this passage. It is where the graph edges
live. `ending` marks a terminal node: a passage with an ending kind and no choices is a
valid leaf. A passage with neither choices nor an ending kind is a dead end, and the
validator will say so.

`tags` carry metadata for tooling: room roles, content categories, facets the author tools
use to filter and count coverage. They do not affect gameplay. `encounterId` links to a
combat encounter defined in the adventure catalogue.

The discipline of naming passages with stable ids and keeping their role clear in those ids
is not about aesthetics. It is what makes the graph validator's output readable. When the
validator reports `"missing target: silver-gallery"`, the author knows immediately which
passage is broken and why.

---

## Choices As Contracts

A choice is a promise: if the player selects this option, they will arrive at this passage.
The promise must be kept.

```typescript
interface Choice {
  id: string;
  text: string;
  targetId?: string;
  check?: {
    ability: Ability;
    skill?: Skill;
    dc: number;
    onSuccess: string;
    onFailure: string;
  };
  combat?: {
    encounterId: string;
    onVictory: string;
    onDefeat: string;
    onContinue: string;
  };
  requires?: ChoiceRequirement;
  effects?: ChoiceEffect;
}
```

A direct choice has a `targetId`. A check choice has success and failure targets. A combat
choice has victory, defeat, and continue targets. Every branch names a passage. Every named
passage must exist.

This is where authoring becomes structural work. Writing the choice text is easy. Getting
every target right, in every branch, across a graph that might have dozens of passages, is
the part that benefits from tooling. The human author can hold the local passage in mind.
The validator holds the whole graph.

---

## The Validator As Surveyor

The graph validator in `src/gamebook/graph.ts` does not know whether the adventure is good.
It knows whether it is structurally sound. The Cartographer was right: it is a surveyor,
not a critic.

What the validator checks, for every adventure passed to it:

```typescript
function validateAdventure(adventure: Adventure): ValidationResult[] {
  const issues: ValidationResult[] = [];
  const passageMap = createPassageMap(adventure.passages);

  // Start passage exists
  if (!passageMap.has(adventure.startPassageId)) {
    issues.push({
      code: "missing-start",
      message: `Start passage "${adventure.startPassageId}" does not exist.`,
    });
  }

  // All choice targets exist
  for (const passage of adventure.passages) {
    for (const choice of passage.choices) {
      for (const targetId of extractTargetIds(choice)) {
        if (!passageMap.has(targetId)) {
          issues.push({
            code: "missing-target",
            passageId: passage.id,
            choiceId: choice.id,
            targetId,
          });
        }
      }
    }
  }

  // No dead ends among non-endings
  for (const passage of adventure.passages) {
    if (!passage.ending && passage.choices.length === 0) {
      issues.push({
        code: "dead-end",
        passageId: passage.id,
      });
    }
  }

  // All passages reachable from start
  const reachable = computeReachable(adventure.startPassageId, passageMap);
  for (const passage of adventure.passages) {
    if (!reachable.has(passage.id)) {
      issues.push({
        code: "unreachable",
        passageId: passage.id,
      });
    }
  }

  // All endings reachable
  const endings = adventure.passages.filter(p => p.ending);
  for (const ending of endings) {
    if (!reachable.has(ending.id)) {
      issues.push({ code: "unreachable-ending", passageId: ending.id });
    }
  }

  // Catalogue reference checks
  checkItemReferences(adventure, issues);
  checkEncounterReferences(adventure, issues);

  return issues;
}
```

Each issue has a code and enough context to act on it. `"missing-target"` reports the passage
id, the choice id, and the target id that does not exist. `"unreachable"` reports the passage
id. With these, the author can open the right file and fix the right line without searching
through the whole adventure.[^2]

The reachability check is the one that would have caught the Silver Gallery. It computes the
set of passages reachable from the start passage by following all choice targets, then
checks every passage in the adventure against that set. Passages not in the reachable set are
reported. The validator does not ask whether the prose is good; it asks whether a player can
ever reach it.

---

## Room Roles As A Planning Scaffold

The Five Room Dungeon template from Chapter 2 is not just a design concept in the book. In
the gamebook's implementation it is an active constraint: a set of expectations the adventure
data must satisfy, checked by a separate validator.

```typescript
// src/gamebook/content/five-room-template.ts
export const FIVE_ROOM_ROLES: PassageTag[] = [
  "room-1",
  "room-2",
  "room-3",
  "room-4",
  "room-5",
];

export const REQUIRED_ENDINGS: EndingKind[] = [
  "victory",
  "failure",
  "retreat",
  "cliffhanger",
];

export function validateFiveRoomTemplate(
  adventure: Adventure
): TemplateResult[] {
  const issues: TemplateResult[] = [];
  const tags = new Set(adventure.passages.flatMap(p => p.tags ?? []));
  const endingKinds = new Set(
    adventure.passages
      .filter(p => p.ending)
      .map(p => p.ending as EndingKind)
  );

  for (const role of FIVE_ROOM_ROLES) {
    if (!tags.has(role)) {
      issues.push({ code: "missing-room-role", role });
    }
  }

  for (const ending of REQUIRED_ENDINGS) {
    if (!endingKinds.has(ending)) {
      issues.push({ code: "missing-ending-kind", ending });
    }
  }

  return issues;
}
```

Room tags are not for display. The player never sees `room-1` or `room-4`. They are labels
for the author and the tooling: this passage is the entrance challenge, this one is the
climax. The template validator checks that each role is covered. The content audit in the
author tools shows which passages carry which tags, so the author can see at a glance whether
the structure is complete.[^3]

The point of the template is not to constrain what the adventure can do. Mt. Graphnor is free
to have more than five passages; it has many more. The template says: among all your passages,
at least one should play the role of the entrance challenge, at least one the climax, at least
one the resolution. If none does, the adventure may be missing something structurally
important, and the validator will say so before a player discovers it by wandering.

---

## Passage Previews And The Author View

The gamebook's author tools in development mode include a passage preview page: a filtered
view of every passage in the adventure, showing its id, title, tags, choices, requirements,
and effects. The preview renders the content as the player would see it, alongside the
structural metadata the player never sees.

This is the author's double vision: the prose and the plumbing simultaneously. A choice that
looks compelling in prose but requires an item the player cannot yet acquire is visible in
the preview as both the choice text and the `requires: { itemsAll: ["brass-key"] }` gate
that controls it. The author sees the experience and the mechanism together.

The preview page also supports filtering by tag and by ending kind. An author who wants to
check only the room-4 passages, or only the failure endings, can filter to those and review
them without navigating the whole adventure. This is the authoring equivalent of the
access-control principle from Chapter 9: show only what is relevant to the current task.

The author tools are development-only. The published player build does not include them,
for the same reasons as the debug panel and forced navigation: capabilities that belong to
the author are not capabilities that belong to the player.

---

## Tags Are For Tools, Not Players

Tags are a recurring pattern in the gamebook that is worth making explicit.

A passage tag is a string carried in the `tags` array. It does not change the prose. It does
not affect gameplay. It does not appear in the player-facing render. It exists exclusively
for tooling: the template validator reads it, the content audit counts it, the preview
filter uses it, the test assertions check for it.

This is a useful design pattern wherever software must maintain two audiences simultaneously:
the end user, who cares about the experience, and the author or operator, who cares about the
structure. Tags carry structural meaning without cluttering the experience. They are a layer
of metadata that lives alongside the content without interfering with it.

The discipline required is in keeping tags accurate. A passage tagged `room-4` that is
actually part of the entrance sequence is a misleading label. The tools trust the tags;
if the tags are wrong, the tools give wrong answers. Tags should be added with the same care
as ids: they are structural commitments, not decorative notes.[^4]

---

## The Import Pipeline And Campaign Ledger

The gamebook's authoring tools are modest: a validator, a template checker, a preview page.
The adventure content is TypeScript data, authored directly and committed to the repository.
This is appropriate for a prototype where the author is also the developer.

Campaign Ledger shows what the same ideas look like when the author is a game master writing
in Google Docs, a notes application, or a word processor, and the application must bring that
content into a structured system without breaking it or leaking private material.

The import pipeline works in stages. First, the content is received: pasted Markdown, pasted
HTML, or a manually exported Google Docs file. Second, it is converted: HTML is filtered to
a safe subset, Google Docs-specific markup is normalised, private URLs are removed with
warnings. Third, a preview is generated: the converted Markdown, the detected title, the
target type, and any warnings are shown to the author before anything is saved. Fourth, the
author confirms: only after review does the content enter the database.

```typescript
// src/campaigns/imports.ts (simplified)
interface ImportResult {
  title: string | null;
  markdown: string;
  warnings: string[];
  provider: "markdown" | "html" | "google-docs";
}

function prepareImport(raw: string, format: ImportFormat): ImportResult {
  const warnings: string[] = [];

  // Remove private Google Drive and Docs URLs before storage
  const cleaned = stripPrivateUrls(raw, warnings);

  // Convert HTML to a safe Markdown subset
  const markdown =
    format === "html" ? convertHtmlToMarkdown(cleaned, warnings) : cleaned;

  const title = detectTitle(markdown);

  return { title, markdown, warnings, provider: format };
}
```

The warnings are part of the output. If a private URL was found and removed, the author
sees that warning in the preview and can decide whether the removal was correct. The import
does not silently discard information; it flags the decision and hands control back to the
author.[^5]

The staged design also prevents a specific class of error: publishing a draft that was not
intended to be player-visible. Content imported to the database is given a visibility level:
public, game-master-only, or draft. The player preview route, which shows the game master
what the players currently see, uses the same visibility filter as the player routes. An
import that is saved as game-master-only will not appear in the player preview, because the
same filter that hides it from players hides it from the preview too. The preview is only
trustworthy if it uses the same rules as production.

---

## Originality And Influence

A branching adventure can be inspired by Fighting Fantasy without being a copy of it. This
is worth saying plainly, because the line between inspiration and reproduction is not always
obvious.

What the gamebook borrows from Fighting Fantasy is structural: numbered passages (though the
gamebook uses named ids rather than numbers), choices at the end of each passage, dice-based
checks, inventory as a gate, endings that can be reached by different paths. These are the
forms of the genre. They are not protected expression; they are the shape that makes the
genre what it is.

What the gamebook does not borrow is specific: no passage text, no maps, no named characters,
no puzzle solutions, no distinctive encounters, no trade dress. The adventure is original
work that uses the genre's structural conventions, in the same way that a thriller novel uses
the structural conventions of the thriller genre without copying any particular thriller.

The validator, the template, and the authoring tools are neutral with respect to originality.
They check structure, not expression. An adventure that passes all validation checks might
still reproduce protected content; the tools cannot know. Originality is an authorial
responsibility, not a technical one.[^6]

---

## The Authoring Loop

The practical workflow for building an adventure is a loop, not a linear process.

Write a passage. Run the validator. Fix the missing target the validator found. Write another
passage. Check the template coverage. Add the room tag you forgot. Preview the passage to see
how the choice requirements look alongside the prose. Notice that a gate requires an item
that has not been placed in any previous passage. Add a choice that grants the item in an
earlier room. Run the validator again.

The loop is tight because the validator runs in seconds and produces specific, actionable
output. An authoring process that requires a full playtesting session to discover structural
problems is slower and more expensive than one that finds them automatically. The validator
is not a substitute for playtesting, but it handles the structural errors that do not require
human judgement, which frees playtesting time for the errors that do.

Mermaid graph export is a complementary tool. At any point in the authoring process, the
author can generate a directed graph diagram of the adventure, showing every passage as a
node and every choice as a directed edge. This makes the global structure visible in a way
that reading the passage data does not. The Silver Gallery would appear in the Mermaid output
as a disconnected node: a box with no arrows pointing to it. Its isolation is immediately
visible.

```typescript
export function exportMermaid(adventure: Adventure): string {
  const lines = ["flowchart TD"];

  for (const passage of adventure.passages) {
    const label = passage.ending
      ? `${passage.id}["${passage.title} [${passage.ending}]"]`
      : `${passage.id}["${passage.title}"]`;
    lines.push(`  ${label}`);
  }

  for (const passage of adventure.passages) {
    for (const choice of passage.choices) {
      for (const targetId of extractTargetIds(choice)) {
        lines.push(`  ${passage.id} --> ${targetId}`);
      }
    }
  }

  return lines.join("\n");
}
```

The diagram is generated from the same data the validator reads. It cannot lie about the
structure, because it is derived from it. When the diagram shows a disconnected node, the
passage is genuinely unreachable. The visual and the structural check say the same thing from
different angles.[^7]

---

## The Build Move

By the end of this chapter, the gamebook has a complete authoring surface:

- `validateAdventure(adventure)` in `src/gamebook/graph.ts` returns a list of structural
  issues: missing start, missing targets, dead ends, unreachable passages, unreachable
  endings, and catalogue reference errors. Each issue carries enough context to identify the
  problem precisely.
- `validateFiveRoomTemplate(adventure)` in `src/gamebook/content/five-room-template.ts`
  checks that the required room roles and ending kinds are all present in the adventure data.
- `exportMermaid(adventure)` in `src/gamebook/graph.ts` generates a Mermaid flowchart of
  the passage graph, with ending kinds labelled on terminal nodes.
- The author page at `/gamebook/author` (development only) surfaces validation results,
  template coverage, the Mermaid diagram, a content audit by tag and ending kind, and passage
  previews filterable by tag.
- Passage tags (`room-1` through `room-5`, and content facet tags) carry structural metadata
  without affecting player-facing renders.
- `PassageTag` and `EndingKind` in `src/gamebook/model.ts` are the closed vocabularies for
  tags and endings shown in the template validator.

The graph tests in `src/gamebook/graph.test.ts` assert that Mt. Graphnor passes full
validation, that all required endings are present, that the Five Room template coverage is
complete, and that the adventure content no longer contains placeholder prose. The last
assertion is structural gatekeeping applied to content quality: the test fails until the
prototype passages contain original working copy rather than development placeholders.

---

The Cartographer's Silver Gallery was not a failure of prose. It was a failure of connection.
The writing existed; the path to it did not. The Playtester had a good experience precisely
because they never encountered an unreachable passage, a broken choice, or an ending they
could not reach. The validator is the reason those problems were fixed before the Playtester
sat down.

Good authoring tools do not improve the prose. They find the structural problems that prose
quality cannot compensate for, and they find them cheaply enough that fixing them is the
work of minutes rather than sessions. The critic and the surveyor are both necessary. The
validator is the surveyor, and it should be run early, run often, and trusted completely in
the things it can actually check.

In Chapter 14, we'll widen the lens from validating the adventure content to verifying the
whole system: routes, renders, static builds, browser behaviour, accessibility, and the
evidence trail that tells a reviewer what was actually tested. The scouting party goes
further than the surveyor, and it leaves better notes.

---

[^1]: Numbered passage ids, the format used by printed Fighting Fantasy books, work because
the author can see the number in print and navigate directly to it. In software, a number
carries no meaning: passage 47 gives no indication of what it contains or where it sits in
the adventure structure. A descriptive string id like `"trap-hall-dexterity-save"` tells the
author, the validator output, and the test failure message exactly which passage is being
discussed. The cost is that ids must be unique and stable, which requires the same discipline
as database primary keys.

[^2]: The error report format is deliberately more like a structured object than a prose
message. Each issue has a `code` that can be matched programmatically, and the supporting
fields carry exactly the context needed to find and fix the problem. This means the author
tools page can group issues by type, filter them, and present them alongside the relevant
passage preview. A prose error message like "there is a problem with a choice in one of your
passages" is almost useless. A structured issue with `passageId`, `choiceId`, and `targetId`
is actionable immediately.

[^3]: The pattern of using tags as coverage metadata is common in test suites (test categories,
test groups, labels) and in content management systems (taxonomy terms, content types). In
both contexts the tag is a way of saying: this thing plays a particular role in a larger
structure, and tools can use that role to check coverage, generate reports, or filter views.
The key discipline is treating tags as structural commitments rather than loose annotations.
A tag that is added without thought and never validated is noise. A tag that is defined in a
closed vocabulary and checked by a validator is information.

[^4]: The relationship between tags and truth is an instance of a broader data integrity
question: who is responsible for keeping metadata accurate when the underlying content
changes? In the gamebook, the author is responsible: there is no automatic mechanism that
updates a tag when a passage is moved to a different role. The validator can check that a
tag exists but cannot check whether it is still appropriate. This is a known limitation, and
the correct response is to treat tag-bearing passages with the same care as id-bearing ones:
changes to role or position should prompt a review of the tags.

[^5]: The warning-preserving design of the import pipeline is a specific instance of a
general principle: do not silently discard information when you can instead record a decision
and present it for review. A private URL that is stripped without warning may have been
intentional; a private URL that is stripped with a warning gives the author the chance to
notice and correct the import source. Warnings that are shown and then ignored are the
author's responsibility. Warnings that are silently swallowed are the system's failure.

[^6]: The Creative Commons licence on the SRD specifically covers the mechanics: the rules,
the stats, the vocabulary. It does not and cannot cover originality of expression. A
gamebook that uses SRD-compatible ability scores but writes original passage prose is using
the licence correctly. A gamebook that copies passage text from a commercial Fighting Fantasy
title and adds SRD ability scores to the encounter is not protected by the SRD licence. The
distinction is between mechanics (licenseable) and expression (protectable by copyright
regardless of licence). When in doubt, write the prose yourself.

[^7]: Mermaid is a text-based diagram language that renders in most Markdown viewers, GitHub,
and many documentation tools. The choice to export in Mermaid format rather than a custom
visual is deliberate: the output is human-readable text that can be committed to version
control alongside the adventure data, diffed when the passage graph changes, and rendered
in the same environment where the author is already working. A binary image cannot be
diffed. A Mermaid diagram can.
