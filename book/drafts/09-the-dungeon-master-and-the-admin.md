di# Chapter 9: Ad Min and the Dungeons Master

---

> **Ad Min and The Doorkeeper**
>
> Ad Min arrived at the gate with a ring of keys.
>
> They were impressive keys. Ornate, heavy, each one stamped with a different sigil. He held them up  
> so the Doorkeeper could appreciate the craftsmanship.
>
> "I have the master ring," said Ad Min.
>
> "Good for you," said the Doorkeeper.
>
> "I have access to everything."
>
> "You've got keys," said the Doorkeeper. "That's different. Which door are you trying to open, in
> whose name, and has the room it belongs to granted you the right to open it?"
>
> Ad Min looked at the keys, then at the Doorkeeper. "I am Ad Min, keeper of the sacred dungeon."
>
> "You are one of the keepers," said the Doorkeeper, with the particular patience of someone who has
> had this conversation before. "There are several of you. Being one does not mean being all. This
> room belongs to Mira. Are you Mira?"
>
> "No."
>
> "Are you Mira's Master?"
>
> "No."
>
> "Does Mira know you are here?"
>
> A pause.
>
> "Then I suggest," said the Doorkeeper, returning to the ledger, "that you find a door you're
> actually allowed to open."

---

When I'm writing a passage in Mt. Graphnor, I don't want to replay the kobold encounter in node
113 every time I need to check the wording in node 86. I want to jump directly to any passage,
inspect the state, tweak the text, and move on. That is a completely reasonable thing to want.
It is also, from the player's perspective, a cheat code.

A player who can navigate directly to node 400 and read the ending without going through the
dungeon has not played the game; they have browsed a document. The puzzle locks, the encounter
consequences, the inventory gates: none of those mean anything if the reader can step over them.
The gamebook only works as a gamebook if the player's path through it is constrained in ways the
author's is not.

That asymmetry is the subject of this chapter. Not what a character can do inside the fiction,
but what different kinds of user are permitted to see, do, and reach in the system itself. The
same problem appears at a larger scale in Campaign Ledger: when I'm running a campaign as DM, I
need a place to keep notes the players cannot see. Plans for future sessions. The demonic
backstory of the NPC the party have mistaken for a sweet old dear, and other such things that
would lose their value immediately if visible to the people sitting across the table.

Access control sounds like a concept that belongs in a security textbook gathering dust on a
high shelf.[^1] In practice it is everywhere, governing who can see what and why. The gamebook's
author/player split is a small, concrete version of the same boundary that Campaign Ledger
enforces with sessions, roles, campaign membership, and route guards.

---

## Roles, Capabilities, And The Difference Between Them

The first step is separating the concepts that the word "access" tends to blur together.

**Authentication** is knowing who is making a request. The Doorkeeper can clearly see that
Ad Min is not Mira, so despite his many impressive keys he will not be allowed into Mira's
room.

**Authorisation** is deciding whether the identified actor may perform the requested action.
Mira might be able to get into her room, whereas Ad Min is locked out, but that doesn't give her 
a free pass to do whatever she likes. She's a Cleric, so while she has access to the temple's
library, the one in he Tower of Magi is off limits to her.

A **role** is a named set of responsibilities: player, game master, admin, author. The temptation
is to treat a role as a permission list: if you are an admin, you can do everything. This is
the mistake that Ad Min made at the gate. Roles do not map to permissions globally; they map to
permissions *in context*. Being an admin does not mean you can edit every campaign, any more
than being a dungeon master at one table means you can narrate the story at a different table
whose players didn't invite you.[^2]

A **capability** is a specific thing an actor can do: read a campaign, write a character sheet,
force passage navigation, access the debug panel, view private NPC notes. Capabilities are more
granular than roles. They can be combined, constrained by ownership, and checked against the
specific resource being accessed rather than the actor's global title.

**Ownership** is the relationship between a user and a specific resource. A player owns their
character sheet. The Game Master owns the campaign prep. Nobody else does, regardless of their
role at the system level.

---

## The Gamebook's Author/Player Split

Mt. Graphnor does not have user accounts. There is nothing to log in to. But it has a
meaningful access boundary all the same.

The gamebook runs in two modes. In development, it runs with `authorToolsEnabled: true`: allowing
me to jump around from passage to passage as I need to work on whichever node I need to. In the 
published static build, it runs with `authorToolsEnabled: false`: the author routes return 404, the
debug panel is omitted from all renders, forced navigation is rejected even if the form is submitted,
and the browser bundle is the player-only version that contains no author code at all.

This is a capability boundary enforced at every relevant layer:

```typescript
// Route level: author page returns 404 in player mode
if (!authorToolsEnabled) {
  return c.notFound();
}

// Fragment level: debug panel only renders in author mode
function renderPassagePanel(passage, state, authorMode) {
  return html`
    <div class="passage">
      ${passageBody(passage, state)}
      ${authorMode ? debugPanel(state) : ""}
    </div>
  `;
}

// Published build: player-only bundle omits all author code
const clientBundle = authorToolsEnabled
  ? buildAuthorClient()
  : buildPlayerClient();
```

And then, crucially, the static artifact check verifies that the published output actually
omits the privileged content:

```typescript
// scripts/check-static.ts
const forbiddenStrings = [
  "Debug state",
  "gamebook-force-passage",
  "authorMode",
  "mermaid",
];

for (const forbidden of forbiddenStrings) {
  if (publishedHtml.includes(forbidden)) {
    throw new Error(`Published build contains forbidden string: ${forbidden}`);
  }
}
```

The layered approach matters. It is not sufficient to hide a button. The route must refuse
the request. The render must omit the panel. The build must exclude the code. The artifact
check must prove that the exclusion happened. Hiding a button while leaving the endpoint
accessible is not access control; it is decoration.

---

## Hiding Buttons Is Not Enough

A common first instinct when implementing access control is to check the user's role in the
component that renders the action, and not render the button if they shouldn't have it.
This works as far as the visual experience goes. It breaks the moment someone realises they
can submit a request directly.

HTTP forms can be submitted without clicking their buttons. `curl` can hit any URL. A browser's
developer tools can replay any request. A player who knows the URL of the forced navigation
endpoint can submit to it without the form ever appearing on their screen. The application
must validate the permission at the point where the action is processed, not only at the
point where the interface is rendered.

In the gamebook, the route itself performs this check:

```typescript
app.post("/gamebook/passages", async c => {
  if (!authorToolsEnabled) {
    return c.notFound();
  }
  // ... handle forced navigation
});
```

The guard runs before anything else. If `authorToolsEnabled` is false, the route returns 404
and stops. The rendering code, the navigation logic, the state mutation: none of it executes.
A player submitting the forced navigation form against the published build gets the same
response they would from any non-existent URL. The button's absence was a courtesy; the
route's refusal is the actual boundary.

The three failure modes map to distinct HTTP status codes.[^3] **401 Unauthorized** is for 
when the actor is not authenticated at all. **403 Forbidden** is for an authenticated actor who 
is not allowed to access this resource. **404 Not Found** is sometimes appropriate when the 
resource exists but the actor should not know that: telling an unauthorised player that a private
NPC dossier exists and they are forbidden from reading it leaks information the access control 
was meant to protect.[^4]

---

## Player-Safe Publishing

The gamebook takes access control one step further in a direction that logged-in web applications 
rarely need: static publishing.

The published gamebook is a set of static files: `dist/index.html`, `dist/gamebook/index.html`,
and `dist/assets/player-client.js`. There is no server. There is no session. There is no route
guard to intercept requests. The access control must happen at build time, not at request time.

This means two things. First, the build script must create the app in player mode, with author
tooling disabled, so that no author routes are registered and no debug renders occur. Second,
the browser bundle must be the player-only client, built from `src/gamebook/player-client.ts`
rather than `src/gamebook/client.ts`. The player-only client does not contain any author
navigation code, any debug panel logic, or any forced passage handling.

```typescript
// scripts/build-static.ts
const app = createApp({ authorToolsEnabled: false });
const playerBundle = await buildPlayerClient();

await writeFile("dist/gamebook/index.html", await renderStaticPage(app));
await writeFile("dist/assets/player-client.js", playerBundle);
```

The player-only client is not the author client with author features disabled at runtime. Rather, 
it's a separate entry point that does not import the author code at all. This means the author code
cannot be reached by inspecting the bundle, can't be enabled by a console command, and does'nt add
weight to the published assets that players download. The boundary is not conditional, but structural.

The artifact check then verifies this structurally:

```
PASS: dist/gamebook/index.html does not contain "Debug state"
PASS: dist/gamebook/index.html does not contain "gamebook-force-passage"
PASS: dist/assets/player-client.js does not contain "authorMode"
```

This kind of check feels like paranoia until the day the build configuration changes and the
wrong bundle is generated. Then it feels like foresight.

---

## Forged Mode Flags

There is a subtle problem with the gamebook's author mode that is worth addressing explicitly.

The choice forms in the gamebook can carry a hidden `authorMode` field that tells the server
the author navigation controls should be active. This is convenient in development: clicking
a choice submits the mode along with the choice id, and the server knows to keep the debug
panel visible in the response.

The problem is that any browser can submit any form. A player who notices the `authorMode`
field in the development version of the app, and who thinks to try submitting it against the
production server, is not actually getting access to author features. The server checks
`authorToolsEnabled` at the application level, not the submitted form data. The route rejects
forced navigation when author tools are disabled regardless of what the form says:

```typescript
app.post("/gamebook/passages", async c => {
  if (!authorToolsEnabled) {
    return c.notFound();
  }

  const form = await c.req.formData();
  const passageId = form.get("passageId");
  const submittedAuthorMode = form.get("authorMode") === "1";

  // Both conditions must pass
  if (!submittedAuthorMode) {
    return c.text("Author mode not active", 400);
  }

  // ... handle forced navigation
});
```

This is the "hiding buttons" principle applied to the gamebook's own internals: client-provided
data can inform a request, but it cannot grant permissions. Permissions come from the server's
own state, validated against authenticated identity and context.[^7]

---

## The Build Move

By the end of this chapter, the gamebook has an explicit author/player boundary:

- `createApp(options)` in `src/app.tsx` accepts `authorToolsEnabled` as a configuration
  option. The development server passes `true`; the static build passes `false`.
- The `/gamebook/author` route returns 404 when author tools are disabled.
- The forced navigation endpoint at `/gamebook/passages` rejects requests when author tools
  are disabled, regardless of what the submitted form contains.
- `renderPassagePanel` in `src/gamebook/render.ts` accepts an `authorMode` flag and omits
  the `DebugPanel` when it is false.
- `src/gamebook/player-client.ts` is a separate entry point that imports no author code.
  `scripts/build-static.ts` uses it instead of the author-capable client.
- `scripts/check-static.ts` asserts that the published HTML and JS bundles do not contain
  any of the forbidden author-mode strings.

---

Ad Min's keys were real. They unlocked real doors. The Doorkeeper's objection was not that
the keys were fake but that Ad Min was standing in front of a door that wasn't theirs to
open: the right actor, the wrong resource, the wrong campaign. Access control is not a
judgement about whether someone is trustworthy. It is a set of rules about which actors are
permitted to affect which resources, in which contexts, verified at every layer where the
boundary might be crossed.

The gamebook's version is small: a configuration flag, two bundles, a handful of route
guards, and an artifact check. The principle is the same at any scale: don't offer, render,
or execute what the current actor is not permitted to reach.

In Chapter 10, we'll zoom out from who can access a feature and look at how the code that
implements those features is organised. The gamebook has accumulated a set of distinct
responsibilities: passage content, graph validation, state management, rules, rendering, and
an application shell. How those responsibilities should be divided, named, and kept from
entangling with each other is the subject of modules.

---

## At Scale: Campaign Ledger

The gamebook's access boundary is structural: two entry points, two bundles, a flag checked at
the application level. A multi-user application needs the same boundary enforced at runtime,
against authenticated sessions, across context-specific resources.

Campaign Ledger separates the user's global role from their campaign-level membership. An admin
is an admin for the installation; a game master is a game master for a specific campaign. The
two are independent. Being an admin does not grant access to every campaign's content, for the
same reason being a dungeon master at one table does not give you the right to narrate a
different table's story.[^5]

The guard function that enforces this runs at the top of every sheet route before any rendering
or mutation. The order matters: session check first, then resource existence, then permission.
If the session is absent, the route returns 401. If the character does not exist for this user's
visibility, it returns 404 rather than 403, because the fact that the character exists is itself
information the access model is meant to protect. If the user is neither the owner nor the
campaign's game master, it returns 403. Admins are not exempted.[^6] The correct path for an
admin who needs to look at a character sheet is to join the campaign with an appropriate role,
not to short-circuit a permission model that exists for a reason.

Guarding routes is necessary but not sufficient. A guarded route can still leak private data
through a component that renders more than it should. The NPC visibility filter addresses this
at the data layer, before anything reaches the template.[^8] When a player requests the NPC
list for a session, the query itself excludes NPCs flagged game-master-only. The component is
never handed that data. It cannot render what it was never given, which means a future refactor
of the rendering code cannot accidentally expose it either.

Campaign Ledger's permission tests are written as a matrix: each test names an actor, a
resource, an action, and the expected outcome. The game master of campaign A can read any
character in campaign A. A player in campaign A cannot read another player's private notes. An
admin cannot read campaign B's content without joining campaign B. Read together, they document
the intended access model as explicitly as the code implements it, and they will fail loudly if
a future change breaks the boundary.[^9]

---

[^1]: There is a security textbook worth reading, if you want to go further: the OWASP (Open
Web Application Security Project) guidelines cover access control in detail, including the
principle of least privilege, insecure direct object references, and broken access control,
which has appeared in the OWASP Top 10 most critical web application security risks for
essentially every year the list has been published. [owasp.org/Top10](https://owasp.org/Top10/)

[^2]: The analogy holds surprisingly well. A dungeon master has genuine authority at their own
table: they can adjudicate rules, narrate consequences, and make decisions about the world.
The same dungeon master, sitting as a player at a different table, no longer has that authority.
The software equivalent is an admin who can manage user accounts and system configuration but
has no more claim on the content of a specific campaign than anyone else. Role-based access
control in multi-tenant applications almost always makes this distinction; it is surprising how
often first implementations accidentally collapse it.

[^3]: HTTP status codes are divided into five families explained in a footnote in Chapter 3:
1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error. The
full tour, including the celebrated 418 I'm a Teapot, is there. The three codes that matter
most for access control are 401, 403, and 404, addressed here.

[^4]: The choice between 403 and 404 for private resources is a genuine design decision with
security implications. Returning 403 when a player asks for a private NPC page tells them that
the resource exists and they are not allowed to see it. Returning 404 tells them nothing. The
correct choice depends on whether the existence of the resource is itself sensitive. Private
NPC dossiers in Campaign Ledger return 404 for unauthorised viewers: knowing that the game
master has a secret dossier for "Mira's contact in the Thieves' Guild" might constitute
meaningful information. The campaign page itself returns 403 for non-members, because the
existence of a campaign is not a secret.

[^5]: Campaign Ledger also supports a `UserCapability` model that allows specific users to hold
individual capabilities without having a global role that implies all of them. This matters
for situations like delegated campaign management or temporary elevated access. The principle
is the same: capabilities are more granular than roles, and granting a capability does not
imply granting its neighbours.

[^6]: This is called the principle of least privilege: actors should have access to exactly
what they need to do their job, and no more. The question "does this actor need this capability
to do their job?" is a useful filter for every permission grant. An admin who needs to review a
campaign character sheet can join the campaign as a player and read their own sheet, or ask the
game master to share the relevant information. Neither path requires a short-circuit through the
permission system.

[^7]: This is why "security through obscurity" fails: hiding the form field, or the endpoint
URL, or the API key in client-side code, relies on attackers not noticing. They notice.
The correct model is that the server verifies permission using state it controls, not state
the client provided. The client can say "I am an author" until it runs out of breath. The
server checks the `authorToolsEnabled` flag and ignores the claim.

[^8]: The pattern of filtering at the data layer rather than the rendering layer is sometimes
called "defence in depth" in the access-control literature, and sometimes "keep secrets out of
the template context." The practical effect is the same: if a component is never handed the
private data, it cannot accidentally render it, no matter what bugs are introduced in the
rendering code later. Filtering in the repository, before the data reaches any component, is
more reliable than filtering in a component that might be refactored by someone who doesn't
know the data carries a sensitivity marker.

[^9]: The test suite as a permission matrix is a pattern worth internalising. If you can write
out the access rules in plain English (admins cannot access sheets they do not own; game
masters can read any sheet in their campaign; players can write only their own sheets), you
can write them as tests. If the test suite does not cover a case you care about, that case
is unverified. This is not paranoia; it is the difference between access control you believe
is working and access control you can demonstrate is working.