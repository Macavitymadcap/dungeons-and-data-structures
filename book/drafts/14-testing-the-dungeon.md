# Chapter 14: Testing The Dungeon

---

> **The Dungeon Master and the Test Party**
>
> The dungeon was finished. The Dungeon Master had checked the map personally. It all seemed
> fine.
>
> "We should send in the test party first," said the Chronicler.
>
> "It's fine," said the Dungeon Master.
>
> "You've said that about every dungeon."
>
> "And they have all been fine."
>
> "The third one had a secret door that opened into a wall. The fifth one had a puzzle whose
> answer was impossible to derive from the available clues. The seventh one..."
>
> "The test party," said the Dungeon Master, "can go in."
>
> The test party was not glamorous. It consisted of a scout who checked whether each door
> opened, a ledger-keeper who verified that no treasure promised in one chamber was missing
> from the next, a retreating fighter who confirmed that defeat led somewhere coherent, a
> herald who checked whether the entrance proclamation was legible by torchlight, and a
> suspicious archivist who read every scroll looking for mechanisms the dungeon had not
> declared to its visitors.
>
> They went in. They came out. The Chronicler read the report.
>
> "The secret door on level two opens into a wall."
>
> A silence.
>
> "Send them in again," said the Dungeon Master.

---

In Chapter 13, we named the approach the book has been taking: domain-driven design. The
domain has its own vocabulary; the code uses that vocabulary. The adventure is an aggregate
root; its consistency rules span the whole adventure. The validator is the domain service
that checks those rules. That is one member of the test party. The scout who checks whether
doors open.

This chapter sends in the rest. Route tests check what the player sees when they navigate the
application. Static build checks verify that the published files contain what they should and
omit what they should not. Browser smoke tests drive a real browser through the player's most
important journey. Accessibility checks ask whether more than one kind of player can use the
interface. Screenshots give reviewers visual evidence without requiring them to run the
application themselves. Acceptance notes record what was delivered, what was verified, and
what was deferred.

Testing is not a single activity. It is a collection of targeted questions, each addressed
at the level where the risk actually lives. The scout and the archivist are asking different
questions. Both are necessary.

---

## Every Test Answers A Question

The most important discipline in a test suite is knowing what each test is for.

A test that checks everything simultaneously checks nothing with confidence. When it fails,
the failure message is somewhere in a wall of output and the debugging starts from scratch.
A test that checks one specific claim fails with a specific message that names the claim and
the deviation.

The gamebook expresses this directly in its verification manifest:

```typescript
// src/gamebook/testing.ts
export interface VerificationGate {
  id: string;
  name: string;
  command: string;
  evidence: string;
}

export const VERIFICATION_GATES: VerificationGate[] = [
  {
    id: "typecheck",
    name: "Type check",
    command: "bun run typecheck",
    evidence:
      "TypeScript compiler verifies type contracts across all modules.",
  },
  {
    id: "unit-tests",
    name: "Unit tests",
    command: "bun test",
    evidence:
      "Bun tests exercise graph validation, state migration, choice resolution, " +
      "dice, combat, rules, and route rendering.",
  },
  {
    id: "static-build",
    name: "Static build",
    command: "bun run build:static",
    evidence: "Static build produces dist/ with player-only assets.",
  },
  {
    id: "static-check",
    name: "Static artifact check",
    command: "bun run check:static",
    evidence:
      "Artifact check verifies published HTML and JS omit author/debug tooling.",
  },
  {
    id: "static-browser",
    name: "Static browser smoke",
    command: "bun run test:static",
    evidence:
      "Playwright drives the published static build through a full player session " +
      "including local storage, choice progression, combat, export, and import.",
  },
];
```

Five gates. Each names a command and states what it proves. Run them in order: the type
check catches contracts, the unit tests catch domain logic, the static build catches the
publishing pipeline, the artifact check catches access-control guarantees, and the browser
smoke catches real player interactions. A failure at any gate stops the chain; there is no
point verifying the browser build if the static build has already failed.[^1]

---

## Unit Tests For Domain Rules

Domain logic is the easiest part of the system to test well, because it is also the most
framework-light. The graph validator, the save migrator, the dice roller, and the combat
resolver are plain TypeScript functions that take data in and return data out. No HTTP server,
no browser, no database connection.

```typescript
// src/gamebook/graph.test.ts
test("reports an unreachable passage", () => {
  // Arrange
  const adventure = makeAdventure({
    startPassageId: "entrance",
    passages: [
      { id: "entrance", choices: [{ id: "go", targetId: "room-two" }] },
      { id: "room-two", ending: "victory", choices: [] },
      { id: "orphan", choices: [] }, // Not connected
    ],
  });

  // Act
  const issues = validateAdventure(adventure);

  // Assert
  expect(issues).toContainEqual(
    expect.objectContaining({ code: "empty-passage", passageId: "orphan" })
  );
  expect(issues).toContainEqual(
    expect.objectContaining({ code: "unreachable-passage", passageId: "orphan" })
  );
});
```

The test does not start a server. It does not load a browser. It calls `validateAdventure`
with a known broken input and asserts the output contains the expected issues. The test runs
in milliseconds and the failure message names the passage.

The rule for domain tests is: test the function, not the infrastructure. If `validateAdventure`
can be called without a server, it should be tested without a server. If `migrateV1ToV2` can
be called with a fixture object, it should be tested with a fixture object. The test is as
close as possible to the unit it describes.

For the full Mt. Graphnor adventure, the tests assert structural facts that the adventure
must maintain:

```typescript
test("Mt. Graphnor passes full validation", () => {
  // Act
  const issues = validateAdventure(mtGraphnorAdventure);

  // Assert
  expect(issues).toHaveLength(0);
});

test("Mt. Graphnor has all required Five Room endings", () => {
  // Act
  const result = validateFiveRoomTemplate(mtGraphnorAdventure);

  // Assert
  expect(result).toHaveLength(0);
});

test("Mt. Graphnor no longer contains placeholder prose", () => {
  // Arrange
  const placeholders = ["TODO", "PLACEHOLDER", "lorem ipsum"];

  // Act & Assert
  for (const passage of mtGraphnorAdventure.passages) {
    for (const placeholder of placeholders) {
      expect(passage.body).not.toContain(placeholder);
    }
  }
});
```

The last test is structural gatekeeping on content. It cannot check whether the prose is good.
It can check whether it is still placeholder text. A test that fails until the author has
written real content is a useful forcing function in the run-up to a release.[^2]

---

## Route Tests: Does The Door Actually Open

Domain tests prove the logic. They are the ledger-keeper, checking that items promised in
one room arrive in the next, that the arithmetic of the combat round adds up. Route tests
are the scout: they check whether the doors open. Not whether the room behind the door is
interesting; whether the door opens at all, whether it goes somewhere, whether it refuses
entry correctly when it should.

In practice, route tests exercise the interface the player actually receives: the HTML
rendered for a given URL, the fragment returned when a choice is submitted, the redirect
that follows a state-changing action, the 404 that comes back when an unauthorised path
is attempted.

```typescript
// src/app.test.tsx
test("renders the gamebook passage page", async () => {
  // Arrange
  const app = createApp({ authorToolsEnabled: false });

  // Act
  const response = await app.request("/gamebook");

  // Assert
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain("Mt. Graphnor");
  expect(html).not.toContain("Debug state");
});

test("applies a choice and returns the next passage", async () => {
  // Arrange
  const app = createApp();
  const state = createInitialState(mtGraphnorAdventure, createCharacter("hero", "Adventurer", "fighter"));
  const body = new URLSearchParams({ state: JSON.stringify(state) });

  // Act
  const response = await app.request("/gamebook/choices/sneak-guard", {
    method: "POST",
    body,
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });

  // Assert
  expect(response.status).toBe(200);
  const html = await response.text();
  expect(html).toContain("keyboard-room");
});

test("returns 404 for author routes when author tools are disabled", async () => {
  // Arrange
  const app = createApp({ authorToolsEnabled: false });

  // Act
  const response = await app.request("/gamebook/author");

  // Assert
  expect(response.status).toBe(404);
});
```

Route tests are more expensive than domain tests: they instantiate an application, make
HTTP requests, and parse HTML responses. They catch a different class of bug: not "is the
combat logic correct" but "does the route wire the correct logic to the correct URL" and
"does the rendered HTML contain what the player needs to see."

Note that state is submitted to the server in the form body as serialised JSON, not in a
session or cookie. The gamebook is stateless at the server level: each request carries the
current game state with it, and the server applies the choice and returns the next passage.
This architecture is what makes the static publishing in Chapter 9 possible.

The access control tests deserve special attention. A route that should return 404 in player
mode must be tested to verify that it returns 404. The test in the third example above is not
checking a positive case; it is checking that a negative capability is absent. These tests are
the most likely to go missing in an incomplete suite, because they are testing for the
non-existence of something rather than its existence.[^3]

---

## The Static Build: What Actually Ships

The archivist in the test party reads every scroll for the Dungeon Master's private notes.
Not because the Dungeon Master is untrustworthy, but because the scroll and the Dungeon
Master's intentions are two different things, and what reaches the players is the scroll.

The static build is the same distinction. The development server and the published gamebook
are not the same thing. The development server knows everything: author routes, debug panels,
forced navigation, the full client bundle. The published gamebook is a set of generated files,
served by a different runtime, with none of that. The gap between the two is where a class of
bugs lives that no amount of running the development server will catch.

The static build gate runs the build script and checks the exit code. If it fails, the
subsequent checks are meaningless: there is nothing to inspect.

The artifact check is a separate step that reads the generated files and asserts their
contents:

```typescript
// scripts/check-static.ts
const html = await readFile("dist/gamebook/index.html", "utf-8");
const js = await readFile("dist/assets/player-client.js", "utf-8");

// Player content is present
expect(html).toContain("Mt. Graphnor");
expect(html).toContain("Start your adventure");

// Author content is absent
const forbidden = ["Debug state", "gamebook-force-passage", "authorMode", "mermaid"];
for (const string of forbidden) {
  expect(html).not.toContain(string);
  expect(js).not.toContain(string);
}
```

The positive assertions verify that the build produced usable output. The negative assertions
verify the access control guarantee: the published files do not contain author tooling. Both
are necessary. A build that passes the negative checks because it produced no output at all
would be wrong in a different way.

The artifact check is the automated version of the security review from Chapter 9. Where
Chapter 9 argued that hiding buttons is not enough, the artifact check proves the stronger
claim: the strings are not present in the output at all, regardless of any runtime condition.

---

## Browser Smoke Tests

The artifact check verifies that the files look correct. Browser smoke tests verify that they
behave correctly when a real browser loads and interacts with them.

The gamebook's browser smoke runs against the generated `dist/` directory, served locally
by a simple static file server. Playwright drives a real browser through the player's most
important session:

```typescript
// scripts/test-static-gamebook.ts
test("full player session", async ({ page }) => {
  // Arrange: clear any saved state
  await page.goto(baseUrl);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  // Act: start a new game and select class
  await page.click('[data-action="new-game"]');
  await page.click('[data-class="fighter"]');
  await page.click('[data-race="human"]');
  await page.click('[data-action="confirm-character"]');

  // Act: make a choice
  await page.click('button:has-text("Creep past the guardian")');

  // Assert: the next passage rendered
  await expect(page.locator(".passage-title")).toContainText("The Keyboard Room");

  // Assert: local storage was written
  const saved = await page.evaluate(() =>
    localStorage.getItem("dads-gamebook-save")
  );
  expect(saved).not.toBeNull();
  const state = JSON.parse(saved!);
  expect(state.currentPassageId).toBe("keyboard-room");

  // Act: export the save
  await page.click('[data-action="export-save"]');
  const exportedJson = await page.inputValue('[data-role="save-export"]');

  // Assert: the export carries the expected schema
  expect(JSON.parse(exportedJson).schema).toBe("dads-gamebook-save");

  // Act: reset progress
  await page.click('[data-action="reset-game"]');

  // Assert: the player is back at the start
  await expect(page.locator(".passage-title")).toContainText("Mt. Graphnor");

  // Act: import the saved game back
  await page.fill('[data-role="save-import"]', exportedJson);
  await page.click('[data-action="import-save"]');

  // Assert: the imported state is restored
  await expect(page.locator(".passage-title")).toContainText("The Keyboard Room");
});
```

The browser smoke covers things that no other test can cover: the interaction between the
HTML, the browser client JavaScript, and `localStorage`. The save-on-choice, the export
format, the import round-trip, and the reset behaviour all require a real browser with a real
storage implementation.[^4]

The smoke test does not walk every path through the adventure. It walks the golden path: the
most important sequence the player will execute. Attempting to exercise every branch in a
browser smoke would be slow, brittle, and redundant: the unit tests cover the branching logic.
The smoke test covers the integration of that logic with the browser.

---

## Accessibility Checks

A dungeon that cannot be navigated by a player who uses a keyboard instead of a mouse, or a
screen reader instead of a monitor, is a dungeon with locked doors that were never designed
to be opened.

Accessibility testing has two layers: automated and manual. Automated tools like Pa11y check
for structural accessibility problems that have deterministic rules: missing alt text, buttons
without labels, colour contrast failures, focus order violations, missing landmark regions.
These are the checks a script can run and a human would find tedious to repeat manually.

Campaign Ledger runs Pa11y against its routes in the accessibility gate:

```typescript
// scripts/test-a11y.ts
const routes = [
  { path: "/", label: "Home (public)" },
  { path: "/local-play", label: "Local play" },
  { path: "/rules", label: "Rules reference" },
  { path: "/login", label: "Login" },
];

for (const route of routes) {
  const results = await pa11y(`${baseUrl}${route.path}`, {
    standard: "WCAG2AA",
    runners: ["axe", "htmlcs"],
  });

  if (results.issues.length > 0) {
    console.error(`${route.label}: ${results.issues.length} issues`);
    for (const issue of results.issues) {
      console.error(`  [${issue.type}] ${issue.message}`);
      console.error(`  ${issue.selector}`);
    }
  }
}
```

WCAG 2.2 Level AA is the standard. Each route is checked against two runners for broader
coverage. Failures are reported with the selector, so the developer knows exactly which
element failed and why.[^5]

Automated checks are necessary but not sufficient. They can verify that a button has an
accessible label; they cannot verify that the label is the right label for the action. They
can detect colour contrast failures above a certain ratio; they cannot verify that the overall
colour scheme is comfortable for a player with photosensitive epilepsy. The automated gate
is the starting line, not the finish.

The gamebook's Pa11y gate is the next step in the verify pipeline rather than the current
one: the architecture that would support it is already in place, and the WCAG 2.2 AA targets
for the player-facing routes are the stated goal. The chapter describes the full posture so
the reader can see what it looks like implemented; the gamebook will match it when the book
goes to press.

---

## Screenshots As Review Evidence

Tests prove behaviour. Screenshots show appearance. Both matter to a reviewer, and they are
not substitutes for each other.

Campaign Ledger captures screenshots as part of the verification pipeline, organised by role,
route, and theme:

```typescript
// scripts/capture-screenshots.ts
const targets = [
  { path: "/", role: "public", theme: "light", label: "home-light" },
  { path: "/", role: "public", theme: "dark", label: "home-dark" },
  { path: "/sheet/fighter-1", role: "player", theme: "light", label: "sheet-light" },
  { path: "/sheet/fighter-1", role: "player", theme: "dark", label: "sheet-dark" },
  { path: "/campaign/1/prep", role: "game_master", theme: "light", label: "prep-light" },
];

for (const target of targets) {
  await loginAs(page, target.role);
  await setTheme(page, target.theme);
  await page.goto(`${baseUrl}${target.path}`);
  await page.screenshot({
    path: `${outputDir}/${target.label}.png`,
    fullPage: true,
  });
}
```

Screenshots are not committed to the repository as part of routine work. Committing a
screenshot on every run would churn the repository history with binary diffs and inflate
the repository size. Instead, screenshots are generated on demand during development or
captured deliberately as PR evidence when a UI change is being reviewed.

The PR template makes this expectation explicit: user-facing UI changes require screenshot
evidence or a note explaining why screenshots are not needed. This is not bureaucracy; it is
the acknowledgement that code review cannot evaluate visual design from a text diff alone.[^6]

---

## The Acceptance Note: Evidence, Not Assertion

A test suite that passes is necessary but not sufficient for a release. What passes must
also be documented: which tests ran, which gates passed, what was checked, and what was
deferred.

Campaign Ledger's acceptance notes for major features are short documents that record the
delivered scope, the automated evidence, the screenshot evidence, the known limits, and the
follow-up tickets. Here is one in full:

```markdown
## Game Master Prep: Acceptance Note

### Delivered scope
Private NPC dossiers, selected-player visibility, staged Markdown import,
Google Docs manual import, player preview, import preview with warnings.

### Automated evidence
- PASS: bun run verify (typecheck, tests, a11y, smoke, screenshots)
- PASS: 147 tests, 0 failures
- PASS: Hyper-Dank compatibility check
- Screenshots: docs/pr-screenshots/sheet-0068/

### Known limits
Google Docs import is manual export only; no live sync or webhook support.
Image upload is not yet part of the import pipeline.

### Follow-up
sheet-0071: Image upload in import pipeline
sheet-0073: Bulk import from Google Drive folder
```

Most changes do not need a document of this length. They need a compact verification
summary: three lines at the end of the PR description.

```markdown
## Verification

- PASS: `bun run verify`: 5 gates, 82 tests, 0 failures
- Screenshots: not required (logic change, no rendering affected)
- Hyper-Dank compat: not required (no shared package changes)
```

Command, result, totals. A note for anything that was not needed and why. It takes thirty
seconds to write and it means a reviewer looking at the PR two weeks later can verify what
was actually checked, rather than taking the author's word for it. A summary that says "tests
pass" with no command or count is an assertion. An assertion with receipts is evidence.[^7]

I used to write "all tests passing ✓" in PR descriptions and feel quite good about it.
I have since learned that this is the equivalent of the Dungeon Master saying "it's fine"
before the test party goes in. Technically true, no verifiable content.

---

## The Verification Manifest As Living Documentation

The gamebook surfaces its verification manifest in the author tools page. This is unusual:
most test suites are invisible to the people who run the software, living only in CI
configuration files that developers read reluctantly.

Making the manifest visible does two things. It forces the manifest to be accurate: if the
author tools page shows a gate that no longer exists, someone will notice. And it connects
the verification system to the authoring system: when an author visits the author page to
check graph validation and template coverage, they also see the verification gates and what
each one proves. Testing is not a separate activity that happens somewhere else; it is part
of the authoring posture.

```typescript
// src/gamebook/testing.ts
export interface CoverageArea {
  id: string;
  title: string;
  purpose: string;
  coveredBy: string[];
  gates: string[];
}

export const TEST_COVERAGE_AREAS: CoverageArea[] = [
  {
    id: "passage-graph",
    title: "Passage graph and content",
    purpose:
      "Protects adventure structure, reachability, content completeness, and template coverage.",
    coveredBy: [
      "src/gamebook/graph.test.ts",
      "src/gamebook/content/mt-graphnor.ts",
    ],
    gates: ["unit-tests"],
  },
  {
    id: "published-static",
    title: "Published static gamebook",
    purpose:
      "Protects generated static HTML, player-only client bundling, and browser-local play.",
    coveredBy: [
      "scripts/check-static.ts",
      "scripts/test-static-gamebook.ts",
    ],
    gates: ["static-build", "static-check", "static-browser"],
  },
  // ...
];
```

Each coverage area names the files that exercise it and the gates that protect it. This is
the map of the test party's routes: which scout covers which room, and which door they are
checking.

---

## The Build Move

By the end of this chapter, the gamebook has an explicit, layered verification posture:

- `VERIFICATION_GATES` in `src/gamebook/testing.ts` defines the five gates shown in this
  chapter: typecheck, unit tests, static build, static artifact check, and static browser
  smoke. Each carries the command and a prose statement of what it proves.
- `TEST_COVERAGE_AREAS` in `src/gamebook/testing.ts` maps the gamebook's test suite to the risks
  it addresses, naming the evidence files and the gates that cover each area.
- `bun run verify` in `scripts/verify.ts` runs all five gates in order, reports the result
  of each, and exits non-zero on the first failure. A single command produces the full
  verification report.
- `scripts/check-static.ts` checks positive and negative artifact assertions: player content
  is present, author/debug content is absent.
- `scripts/test-static-gamebook.ts` drives the published static build through a full session
  with Playwright: new game, class selection, choice navigation, local storage verification,
  export, reset, and import.
- `src/app.test.tsx` covers route rendering, choice fragments, access control boundaries,
  author tool output, and invalid state handling.
- The author tools page at `/gamebook/author` renders the verification manifest alongside
  graph validation and template coverage, making testing visible as part of the authoring
  workflow.

The full `TEST_COVERAGE_AREAS` structure, the complete `scripts/check-static.ts` assertions,
and the Playwright session walkthrough in `scripts/test-static-gamebook.ts` are in the
repository rather than reproduced here; the extracts in this chapter show the shape of each
approach rather than the complete listings.

The accessibility posture is described here and is a clear next step: Pa11y targeting WCAG
2.2 AA for the player-facing routes, added to the verify pipeline alongside the existing
gates.

---

The Dungeon Master's dungeon had a secret door that opened into a wall. The test party found
it. Not because they were looking for that specific problem, but because checking every door
is what the test party does.

The scout checks whether doors open. The ledger-keeper checks that items promised in one room
arrive in the next. The retreating fighter verifies that defeat leads somewhere coherent. The
reader in poor light asks whether the public handout is legible. The archivist reads every
scroll for private notes that should not be there.

None of them improve the dungeon's design. That is the Dungeon Master's job. What they do is
ensure that what was designed is what was built, that what was built is what was published,
and that what was published is what the player receives. The gap between those three things
is where bugs live, and the test party is the systematic effort to close it.

In Chapter 15, we close the spellbook. Not because the labyrinth is finished, but because the
map is good enough to navigate by, and the reader now has the tools to keep drawing it.

---

[^1]: Running gates in order and stopping on failure is not just a time-saving convention. It
is an epistemic principle: a gate that depends on a previous gate's output cannot produce
meaningful results when the previous gate has failed. Checking the browser smoke against a
static build that failed would be checking a missing or incorrect build. The result would
be noise. Stopping the chain on failure preserves the signal: the first failure tells you
exactly where the problem is, and the subsequent gates tell you nothing useful until it is
fixed.

[^2]: The content readiness test is one of the more unusual uses of automated testing:
asserting that the content is not in a specific bad state. It is not testing that the
content is good; it is testing that it has passed a minimum bar. The precedent in software
is the linting rule that forbids `console.log` statements in committed code, or the CI check
that forbids TODO comments in certain directories. These tests do not measure quality; they
enforce a threshold that prevents known categories of carelessness from reaching production.

[^3]: The testing of negative capabilities, things that should not be possible, is
systematically underrepresented in most test suites. Positive assertions are natural: we
built a feature, we test that it works. Negative assertions require deliberately thinking
about what should be absent. In the context of access control, this matters enormously: a
test suite that verifies every positive access permission but never checks that forbidden
access is actually forbidden is not a security test suite. It is a feature demo.

[^4]: Playwright is the most capable cross-browser automation library currently available for
web testing. It supports Chromium, Firefox, and WebKit, exposes a clean API for navigation,
interaction, and assertion, and has first-class support for capturing screenshots, network
requests, and browser storage. The choice of Playwright over the alternatives reflects its
ability to test the static gamebook exactly as a player experiences it: real browser, real
storage, real JavaScript execution. Alternatives that simulate the browser rather than running
it cannot verify that `localStorage` behaves as expected.

[^5]: WCAG 2.2 is the current version of the Web Content Accessibility Guidelines, published
by the W3C. Level AA is the standard required by most accessibility legislation and
procurement policies in the UK and elsewhere. The three levels, A, AA, and AAA, represent
increasing levels of accessibility provision; AA is the practical target for most web
applications. The full specification is at [w3.org/TR/WCAG22](https://www.w3.org/TR/WCAG22/).
Pa11y is available at [pa11y.org](https://pa11y.org/).

[^6]: The PR template as a forcing function for evidence is a specific application of a
general principle: good process is built into the workflow rather than appended to it.
A reviewer who has to remember to ask for screenshots will sometimes forget. A PR template
that includes a screenshots section, with a required checkbox or a note explaining why
screenshots are not needed, makes the evidence expectation part of submitting the PR.
The effort required to write "not applicable, logic change only" is much lower than the
effort required to explain a visual regression after the fact.

[^7]: The acceptance note pattern is borrowed from delivery practice: the assumption that a
feature is not done when the code is merged, but when the evidence of its correctness is
recorded. In regulatory environments this is a compliance requirement. In most software
teams it is a useful discipline even without the regulatory pressure, because it forces the
question "what did we actually ship?" to be answered explicitly at the moment when the
answer is most accessible. The "assertions with receipts" shorthand applies the same logic:
"the tests passed" is a claim; "bun run verify: 5 gates, 82 tests, 0 failures" is the same
claim with enough detail for a reviewer to verify it against the CI log. The extra fifteen
words are not bureaucracy; they are the difference between a claim and evidence.