# Chapter 9: The Dungeon Master And The Admin

---

> **Ad Min and The Doorkeeper**
>
> Ad Min arrived at the gate with a ring of keys.
>
> They were impressive keys. Ornate, heavy, each one stamped with a different sigil. The Admin
> held them up so the Doorkeeper could appreciate the craftsmanship.
>
> "I have the master ring," said the Admin.
>
> "Good for you." said the Doorkeeper.
>
> "I have access to everything."
>
> "You've got keys," said the Doorkeeper. "That's different. Which door are you trying to open, in
> whose name, and has the room it belongs to granted you the right to open it?"
>
> Ad Min looked at the keys, then at the Doorkeeper. "I am Ad Min, keeper of the sacred dungeon."
>
> "You are one of the keepers" said the Doorkeeper, with the particular patience of someone who has
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

In Chapter 8, we looked at constraints on what a character can carry: which items they hold,
the choices those items unlock, and what happens when a consumable is spent. Those constraints
operate on game state. The character meets a requirement or they don't.

This chapter is about a different kind of constraint: not what the character can do inside the
game, but what different kinds of user are allowed to see, do, and access in the system itself.
A player navigating the published gamebook should not be able to reach the debug panel. An
author inspecting the passage graph should not need a separate application. A campaign's Game
Master should be able to see private NPC notes that their players cannot. These are questions of
**access control**: who can do what, to which resource, under which conditions.

Access control is one of those topics that sounds like it belongs to the security chapter at
the back of a more serious textbook, filed somewhere between cryptography and compliance.
In practice it appears everywhere, early, and with practical consequences. A debug form that
can be submitted by any browser request is not just an authoring convenience; it is a
capability that needs a boundary. The gamebook's author/player split is a small, concrete
version of the same problem that Campaign Ledger solves with sessions, roles, campaign
membership, and route guards.

---

## Roles, Capabilities, And The Difference Between Them

The first step is separating the concepts that the word "access" tends to blur together.

**Authentication** is knowing who is making a request. In Campaign Ledger, a signed-in user
has an authenticated session that identifies them by id. In the gamebook, there are no user
accounts, but there is an application-level flag: the server knows whether it was started with
author tooling enabled.

**Authorisation** is deciding whether the identified actor may perform the requested action.
Being authenticated is not enough on its own. A signed-in user in Campaign Ledger might be
a player in no campaigns, a Game Master in one, and an admin for the whole installation. Each
of those facts carries different permissions, and they do not automatically imply each other.

A **role** is a named set of responsibilities: player, game master, admin, author. The temptation
is to treat a role as a permission list: if you are an admin, you can do everything. This is
the mistake the Admin made at the gate. Roles do not map to permissions globally; they map to
permissions *in context*. Being an admin does not mean you can edit every campaign, any more
than being a dungeon master at one table means you can narrate the story at a different table
whose players didn't invite you.[^1]

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

The gamebook runs in two modes. In development, it runs with `authorToolsEnabled: true`: the
author pages are accessible, the debug panel appears in passage renders, forced navigation
is possible, and the browser client includes the full author-capable bundle. In the published
static build, it runs with `authorToolsEnabled: false`: the author routes return 404, the debug
panel is omitted from all renders, forced navigation is rejected even if the form is submitted,
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

In Campaign Ledger, this is expressed through route guards that run before any rendering
or mutation:

```typescript
async function requireCampaignAccess(
  c: Context,
  campaignId: string,
  level: "read" | "manage"
): Promise<GuardResult> {
  const session = await getSession(c);
  if (!session) {
    return { ok: false, reason: "unauthenticated" };
  }

  const membership = await getCampaignMembership(session.userId, campaignId);
  if (!membership) {
    return { ok: false, reason: "not_found" };
  }

  if (level === "manage" && membership.role !== "game_master") {
    return { ok: false, reason: "forbidden" };
  }

  return { ok: true };
}
```

The guard runs at the top of the route handler, before anything else. If it fails, the
handler returns the appropriate response and stops. Nothing downstream runs. The rendering
code, the database query, the mutation: none of it executes when the guard does not pass.

The three failure modes map to distinct HTTP status codes.[^2] **401 Unauthorized** is the correct
response when the actor is not authenticated at all: they haven't logged in, or their session
has expired. **403 Forbidden** is for an authenticated actor who is not allowed to access this
resource: they are known to the system but not permitted here. **404 Not Found** is sometimes
appropriate when the resource exists but the actor should not know that: telling an
unauthorised player that a private NPC dossier exists and they are forbidden from reading it
leaks information the access control was meant to protect.[^3]

---

## Ownership And Context

The Doorkeeper's point about Mira's campaign is the ownership problem. Global roles are a
blunt instrument. "Admin" grants certain capabilities across the system, but it does not grant
access to every piece of data in every campaign. "Game Master" describes a role within a
specific campaign, not within all campaigns the user has ever encountered.

Campaign Ledger models this with a separation between the user's global role and their
campaign-level membership:

```typescript
type UserRole = "admin" | "game_master" | "player";

type CampaignMemberRole = "game_master" | "player";

interface CampaignMembership {
  userId: string;
  campaignId: string;
  role: CampaignMemberRole;
}
```

An admin is an admin for the installation. A game master is a game master for a specific
campaign. The two are independent: an admin is not automatically the game master of any
campaign, and a game master of one campaign is not the game master of another.[^4]

Sheet access follows the same principle. A player can read and write their own character
sheet. A game master can read and write any sheet in their campaign. An admin cannot write
any sheet by virtue of being an admin: they would need to be in the campaign, with the
appropriate role, to have that permission.

```typescript
async function requireSheetAccess(
  c: Context,
  characterId: string,
  level: "read" | "write"
): Promise<GuardResult> {
  const session = await getSession(c);
  if (!session) return { ok: false, reason: "unauthenticated" };

  const character = await getCharacter(characterId);
  if (!character) return { ok: false, reason: "not_found" };

  // Owner can always access their own sheet
  if (character.ownerId === session.userId) return { ok: true };

  // Game Masters can access sheets in their campaign
  const membership = await getCampaignMembership(
    session.userId,
    character.campaignId
  );
  if (membership?.role === "game_master") return { ok: true };

  return { ok: false, reason: "forbidden" };
}
```

The explicit test for admin bypass is absent, and that absence is deliberate. Admins tested
against this guard fail. If an admin needs to edit a character sheet, the correct path is to
join the campaign as a game master, not to short-circuit the permission system.[^5]

---

## Representation-Level Control

Guarding routes is necessary but not sufficient. A well-guarded route can still leak private
data through a component that ignores viewer context.

Campaign Ledger's NPC dossiers illustrate this clearly. A dossier might contain a public
summary, a player-visible description, and private Game Master notes. The route that serves
the NPC page is accessible to players with campaign read access. The guard passes. But the
repository query must filter the response based on the viewer's role:

```typescript
function listNpcSummariesForCampaign(
  campaignId: string,
  viewerRole: CampaignMemberRole
): NpcSummary[] {
  return npcs.filter(npc => {
    if (npc.visibility === "public") return true;
    if (npc.visibility === "selected_player") {
      return viewerRole === "game_master"
        || npc.selectedPlayerIds.includes(viewerId);
    }
    // "game_master" visibility: only GMs see this entry at all
    return viewerRole === "game_master";
  });
}
```

A player never sees an NPC whose visibility is set to game master only. Not "the player sees
the NPC but can't read the private notes": the player does not know the NPC exists. The
visibility filter runs at the data layer, before anything is passed to the rendering code.
The component is never handed data it shouldn't render, so there is no risk of the rendering
code accidentally exposing it.[^6]

This is the same principle as the gamebook's hidden choices. In Chapter 8, a choice that fails
`isChoiceAvailable` is not rendered at all: the player doesn't see a greyed-out button with
a tooltip explaining what they're missing. The option is simply absent. Representation-level
control means not offering, and not rendering, what the current viewer is not permitted to see.

---

## Player-Safe Publishing

The gamebook takes access control one step further in a direction that logged-in web
applications rarely need: static publishing.

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

The player-only client is not the author client with author features disabled at runtime. It
is a separate entry point that does not import the author code at all. This means the author
code cannot be reached by inspecting the bundle, cannot be enabled by a console command, and
does not add weight to the published assets that players download. The boundary is not
conditional; it is structural.

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

## Testing Access Control

A permission system that is not tested is a permission system that will eventually be wrong in
production. The tests should express the access rules as explicitly as the code does.

Campaign Ledger's guard tests read as a set of declarative claims about who can do what:

```typescript
it("does not grant admin access to a sheet they do not own", async () => {
  const admin = await createUser({ role: "admin" });
  const player = await createUser({ role: "player" });
  const character = await createCharacter({ ownerId: player.id });

  const result = await requireSheetAccess(
    contextFor(admin),
    character.id,
    "write"
  );

  expect(result).toEqual({ ok: false, reason: "forbidden" });
});

it("allows a game master to read a sheet in their campaign", async () => {
  const gm = await createUser({ role: "game_master" });
  const character = await createCharacterInCampaign(gm.campaignId);

  const result = await requireSheetAccess(
    contextFor(gm),
    character.id,
    "read"
  );

  expect(result).toEqual({ ok: true });
});
```

Each test names an actor, a resource, an action, and the expected outcome. Read together,
they form a permission matrix: here is every important combination we have thought about,
and here is what the system should do in each case. The tests are documentation as much as
verification.[^8]

The gamebook's equivalent is the artifact check in `scripts/check-static.ts`. It does not
test authentication flows or role assignments, because the gamebook has none. What it tests
is the structural guarantee: the published files do not contain author tooling. The check is
expressed as a concrete assertion against the actual output, not as a trust that the build
script did the right thing.

---

## The Build Move

By the end of this chapter, the gamebook has an explicit author/player boundary:

- `createApp(options)` in `src/app.tsx` accepts `authorToolsEnabled` as a configuration
  option. The development server passes `true`; the static build passes `false`.
- The `/gamebook/author` route returns 404 when author tools are disabled, shown in this
  chapter's route-guard examples.
- The forced navigation endpoint at `/gamebook/passages` rejects requests when author tools
  are disabled, regardless of what the submitted form contains.
- `renderPassagePanel` in `src/gamebook/render.ts` accepts an `authorMode` flag and omits
  the `DebugPanel` when it is false.
- `src/gamebook/player-client.ts` is a separate entry point that imports no author code.
  `scripts/build-static.ts` uses it instead of the author-capable client.
- `scripts/check-static.ts` asserts that the published HTML and JS bundles do not contain
  any of the forbidden author-mode strings.

Campaign Ledger contributes the mature parallel: `requireCampaignAccess`,
`requireSheetAccess`, and the NPC visibility filter in `src/campaign/npc.ts` are the
production-scale versions of the same ideas, handling authenticated sessions, campaign
membership, ownership, and representation-level data filtering.

---

Ad Min's keys were real. They unlocked real doors. The Doorkeeper's objection was not that
the keys were fake but that Ad Min was standing in front of a door that wasn't theirs to
open: the right actor, the wrong resource, the wrong campaign. Access control is not a
judgement about whether someone is trustworthy. It is a set of rules about which actors are
permitted to affect which resources, in which contexts, verified at every layer where the
boundary might be crossed.

The gamebook's version of this is small: a configuration flag, two bundles, a handful of
route guards, and an artifact check. Campaign Ledger's version is larger: sessions, roles,
campaign membership, ownership, visibility categories, guard functions, and a test suite that
documents the intended permission matrix explicitly.

The scale is different. The principle is the same: don't offer, render, or execute what the
current actor is not permitted to reach.

In Chapter 10, we'll zoom out from who can access a feature and look at how the code that
implements those features is organised. The gamebook has accumulated a set of distinct
responsibilities: passage content, graph validation, state management, rules, rendering, and
an application shell. How those responsibilities should be divided, named, and kept from
entangling with each other is the subject of modules.

---

[^1]: The analogy holds surprisingly well. A dungeon master has genuine authority at their own
table: they can adjudicate rules, narrate consequences, and make decisions about the world.
That authority does not extend to the table next door. The software equivalent is an admin who
can manage user accounts and system configuration but has no more claim on the content of a
specific campaign than a stranger who wanders in off the street. Role-based access control in
multi-tenant applications almost always makes this distinction; it is surprising how often
first implementations accidentally collapse it.

[^2]: HTTP status codes are divided into five families explained in a footnote in Chapter 3:
1xx informational, 2xx success, 3xx redirection, 4xx client error, 5xx server error. The
full tour, including the celebrated 418 I'm a Teapot, is there. The three codes that matter
most for access control are 401, 403, and 404, addressed here.

[^3]: The choice between 403 and 404 for private resources is a genuine design decision with
security implications. Returning 403 when a player asks for a private NPC page tells them that
the resource exists and they are not allowed to see it. Returning 404 tells them nothing. The
correct choice depends on whether the existence of the resource is itself sensitive. Private
NPC dossiers in Campaign Ledger return 404 for unauthorised viewers: knowing that the game
master has a secret dossier for "Mira's contact in the Thieves' Guild" might constitute
meaningful information. The campaign page itself returns 403 for non-members, because the
existence of a campaign is not a secret.

[^4]: Campaign Ledger also supports a `UserCapability` model that allows specific users to hold
individual capabilities without having a global role that implies all of them. This matters
for situations like delegated campaign management or temporary elevated access. The principle
is the same: capabilities are more granular than roles, and granting a capability does not
imply granting its neighbours.

[^5]: This is called the principle of least privilege: actors should have access to exactly
what they need to do their job, and no more. It is one of the OWASP Proactive Controls and
is mentioned in nearly every access-control reference for good reason. The question "does
this actor need this capability to do their job?" is a useful filter for every permission
grant. An admin who needs to review a campaign character sheet can join the campaign as a
player and read their own sheet, or ask the game master to share the relevant information.
Neither path requires a short-circuit through the permission system.

[^6]: The pattern of filtering at the data layer rather than the rendering layer is sometimes
called "defence in depth" in the access-control literature, and sometimes called "keep secrets
out of the template context." The practical effect is the same: if a component is never
handed the private data, it cannot accidentally render it, no matter what bugs are introduced
in the rendering code later. Filtering in the repository, before the data reaches any
component, is more reliable than filtering in a component that might be refactored by someone
who doesn't know the data carries a sensitivity marker.

[^7]: This is why "security through obscurity" fails: hiding the form field, or the endpoint
URL, or the API key in client-side code, relies on attackers not noticing. They notice.
The correct model is that the server verifies permission using state it controls, not state
the client provided. The client can say "I am an author" until it runs out of breath. The
server checks the `authorToolsEnabled` flag and ignores the claim.

[^8]: The test suite as a permission matrix is a pattern worth internalising. If you can write
out the access rules in plain English (admins cannot access sheets they do not own; game
masters can read any sheet in their campaign; players can write only their own sheets), you
can write them as tests. If the test suite does not cover a case you care about, that case
is unverified. This is not paranoia; it is the difference between access control you believe
is working and access control you can demonstrate is working.
