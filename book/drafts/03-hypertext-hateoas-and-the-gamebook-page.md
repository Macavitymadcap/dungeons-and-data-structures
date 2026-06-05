# Chapter 3: Hypertext, HATEOAS, And The Gamebook Page

---

> **The Adventurer and the Door**
>
> The door didn't look particularly significant. It was stone, old, fitted with iron bands gone rough
> with rust, and it had the settled air of something that had been refusing entry for longer than the
> surrounding dungeon had been interesting.
>
> The Adventurer raised a torch. There was no handle, but there was a slot, and beside it a panel
> of small brass plates, each engraved with a single option.
>
> *LISTEN AT THE DOOR.*
>
> *KNOCK.*
>
> *FORCE THE LOCK.*
>
> *RETREAT TO THE PREVIOUS CHAMBER.*
>
> "That's it?" said the Adventurer.
>
> "That's it," said the door, or rather the panel, since doors are not generally known as great
> conversationalists. The available options are the available options. The rest of the dungeon
> is not this door's business.
>
> The Adventurer looked into the darkness, trying to determine what lay further in. The panel
> offered nothing on the subject. It did not need to. The dungeon would reveal itself at the
> appropriate pace, one valid action at a time, as the Adventurer moved through it. Exactly how
> dungeons ought to work.
>
> The Adventurer considered the brass plates. Then slid a coin into the slot below *LISTEN AT
> THE DOOR* and waited to see what the dungeon would say next.

---

In the previous chapter, we looked at a gamebook as a graph: passages as nodes, choices as
directed edges, the whole structure amenable to validation, traversal, and export as a diagram.
That model is honest and useful, but it describes the gamebook as *data*. What it doesn't yet
describe is the gamebook as something a person can actually play.

To become playable, the graph needs a surface. The passages need to be visible, the choices need
to be pressable, and when a player makes a choice something needs to happen: state changes,
the next passage loads, the story continues. On the web, this surface is made of HTML. The
mechanism is hypertext.

Hypertext is older than the web.[^1] The word was coined by Ted Nelson in 1965 to describe text
that links to other text: a reading experience that branches, connects, and navigates rather than
merely proceeding. When Tim Berners-Lee built the World Wide Web, he built it on the hypertext
idea: documents connected by links, addressed by URLs, transmitted over HTTP. The gamebook, as
we've already established, is a directed graph. The web is a hypertext system built on a directed
graph of documents. The two fit together with a neatness that should not, at this point, be
surprising.

---

## A Page Is A Room With Exits

The simplest possible gamebook passage on the web looks like this:

```html
<div id="passage">
  <p>
    You awake to find yourself in a dark room. Your eyes adjust to the gloom.
    Two doors stand before you.
  </p>
  <menu>
    <li><a href="/left-door">Try the door on the left</a></li>
    <li><a href="/right-door">Try the door on the right</a></li>
  </menu>
</div>
```

This is already a hypermedia document. The `<a>` elements are links: directed edges from this
passage to two others, addressed by URL. Following a link is traversing an edge in the graph.
The browser handles navigation, history, the back button, and the ability to bookmark or share
the current state. You get all of that for free, because you've expressed the structure using the
web's own primitives.

A **link** says "go to this resource". That's its entire job, and it does it excellently. The
text between the tags describes where it goes and why you might want to follow it. The href is the
address. Click it and the browser makes a GET request for whatever is at the other end, renders
the response, and updates the address bar.

The passage above works. It is also, if we're being honest about it, slightly 1996. Every choice
triggers a full page reload, the scroll position resets, and if the gamebook has a character
status panel at the top of the page it will flicker out and back on every move. For a reading
experience built around momentum and immersion, these are not trivial inconveniences.

There is a better tool for the job.

---

## Links, Forms, And Intent

Before reaching for that tool, it's worth establishing a distinction that the web has always
made but which is easy to blur in practice.

Links are for *navigation*. They fetch a resource and display it. They are GET requests: safe,
idempotent,[^2] bookmarkable. The browser knows that following a link doesn't change anything on
the server, so it will happily prefetch links, let you open them in new tabs, and restore them
from history.

**Forms** are for *intent*. They submit information to a resource and wait for a response. They
are the web's mechanism for saying "I want to do something, not just see something." A form has
an `action` (where the submission goes), a `method` (how it goes: `GET` for a query, `POST` for
an action that changes state), and one or more inputs carrying the submitted data.

In a gamebook, choices are intent. When a player chooses "Force the lock", they are not
navigating to a different page that happens to be called "forced-lock". They are asking the
application to resolve a specific action in a specific state and tell them what happened next. The
answer might be different depending on their current hit points, what items they're carrying, and
whether they've already broken one sword on the dungeon's stone floors. A link cannot carry that
context. A form can.

```html
<form action="/gamebook/choices/force-lock" method="post">
  <button type="submit">Force the lock</button>
</form>
```

This is the version in Mt. Graphnor. The `action` is the URL of the choice endpoint on the
server. The `method` is `post` because resolving a choice changes application state: the player's
position in the adventure, possibly their hit points, flags, inventory. `POST` is honest about
that. `GET` would not be.[^3]

The form also has a meaningful property the link does not: it can carry hidden fields. When a
choice depends on state the player doesn't need to see, that state can travel with the submission
invisibly. The server receives the choice *and* the context it needs to resolve it correctly.

---

## Fragments Without Forgetting The Page

The full-page reload problem hasn't gone away yet. When the player submits the form, the browser
will do exactly what it did with the link: make a request, receive a full HTML response, replace
the entire page. The status panel flickers. The scroll resets. The momentum breaks.

This is where htmx[^4] comes in.

htmx is a small JavaScript library built on a single observation: most of what JavaScript
frameworks do to make web interfaces feel responsive could be expressed directly as HTML
attributes, if HTML were willing to let any element make HTTP requests and swap responses into
the page[^5]. htmx makes HTML willing.

The key attributes for gamebook choices are `hx-post`, `hx-target`, and `hx-swap`:

```html
<form
  action="/gamebook/choices/force-lock"
  method="post"
  hx-post="/gamebook/choices/force-lock"
  hx-target="#passage"
  hx-swap="innerHTML"
>
  <button type="submit">Force the lock</button>
</form>
```

When htmx is present, this form submits via an AJAX request rather than a full page navigation.
The response is not a full HTML document but a **fragment**: just the new `PassagePanel` HTML.
htmx takes that fragment and swaps it into the element identified by `hx-target`, in this case
the element with `id="passage"`. The rest of the page, the status panel, the navigation, the
styling, stays exactly where it is. The scroll position is preserved. Nothing flickers.

Notice that the plain `action` and `method` attributes are still there. This is intentional.
If JavaScript is disabled or hasn't loaded yet, the form still works: it submits normally and
receives a full-page response. htmx is a **progressive enhancement**: it improves the experience
when it's available without breaking anything when it isn't. That's the correct way to layer
additional behaviour onto HTML.

A **fragment** is a partial HTML response rather than a full document. The server knows whether
the request came from htmx (it sends an `HX-Request` header) and can return just the passage
panel rather than the whole page. This is a meaningful architectural decision: the server is now
responsible for understanding the context of the request and returning the right level of
response. It is not the client's job to disassemble a full page and extract the relevant part.

---

## Redirects And Refreshable Paths

Fragment swaps are fast and satisfying, but they introduce a subtle problem. When a player
navigates through the gamebook using fragment swaps, the URL in their browser's address bar
doesn't change. Every passage looks like the same URL. If they refresh the page, they're back at
the start. If they share the link, their friend arrives at the start. The browser's back button
may not behave as expected.

For a gamebook, this is partly acceptable: the player's progress is stored in local storage and
can be resumed from wherever they left off. But it's worth understanding the trade-off
explicitly.

The htmx attribute `hx-push-url` can update the address bar as fragments are swapped in, creating
a navigable history without full page reloads. Used thoughtfully, it keeps the fragment's
performance benefits while restoring the page's shareability and refreshability.

The companion problem is what happens after an action that changes significant server-side state:
a rest, a save, a purchase, something that should not be re-submitted if the player hits refresh.
For these cases, the correct pattern is a **redirect after action**: the POST is processed, the
state changes, and rather than returning the new content directly, the server sends a `303 See
Other`[^6] response instructing the client to fetch that content via GET from a canonical URL. This
is sometimes called the **Post/Redirect/Get** pattern,[^7] and it solves the double-submission problem
that has plagued form-heavy web applications since roughly the moment they existed.

In Campaign Ledger, this pattern appears throughout the sheet and campaign routes. After a player
updates a resource, adjusts their armour class, or adds a condition, the server applies the change
and returns an `HX-Redirect` header pointing to the updated representation. htmx follows the
redirect and renders the fresh state. The URL is correct, the page is refreshable, and submitting
the form twice doesn't corrupt the data.

---

## HATEOAS Without The Fog Machine

There is a grander idea lurking behind all of this, and it has an acronym that sounds like a minor
deity of bureaucratic rage: **HATEOAS**.

It stands for Hypermedia As The Engine Of Application State, and it is one of the constraints Roy
Fielding described in his 2000 doctoral dissertation defining REST.[^8] The core idea, stripped of
the architectural scaffolding around it, is this: a response should tell the client what it can do
next.

The brass panel on the dungeon door is HATEOAS. The door does not hand the adventurer a map of
the entire dungeon. It does not require the adventurer to have memorised the dungeon layout in
advance. It presents exactly the actions available from this point in the current state: listen,
knock, force, retreat. The adventurer's knowledge of what's possible comes from the response
itself, not from out-of-band information.

This idea is not new. The text adventure games of the 1970s and 1980s worked exactly this way:
the program described the current location, and the player was expected to ask what they could do
there rather than having a persistent menu of all possible commands. `>GO NORTH` either worked or
it didn't, and finding out was half the fun. The brass plate is just a prettier interface for the
same principle: the representation itself carries the valid next moves.

A gamebook passage embodies this naturally. The passage presents:
- The current state: where you are, what just happened, what you're carrying.
- The available actions: the choices you can currently take.
- Hidden constraints: choices that require an item you don't have simply don't appear.
- A target for each action: another passage, an outcome, a changed state.

The choices are not links to *pages*. They are invitations to *transitions*. The page you see
after making a choice was never a pre-existing document waiting to be fetched; the server renders
it fresh from the state that results from that action.

This is a meaningful distinction and an easy one to lose. A gamebook that renders choices as
simple links to static pages is navigating a graph. A gamebook that renders choices as form
submissions to a stateful server is using hypermedia as the engine of application state. The
player experience might look similar from the outside. The architectural implications are not.

---

## The Build Move

By the end of this chapter, the gamebook has a working web surface:

- `GET /gamebook` renders the full playable page: the current passage panel, status summary, and
  choice controls, all inside a complete HTML shell with the client bundle attached.
- `POST /gamebook/choices/:choiceId` resolves a choice, updates game state, and returns the next
  `PassagePanel` as a fragment.
- Each choice renders as a `<form>` with both plain `action`/`method` attributes and
  `hx-post`/`hx-target`/`hx-swap` attributes, so the gamebook works with or without JavaScript.
- The server returns a full page when the request doesn't come from htmx, and a fragment when it
  does. The distinction lives in a single header check.

These live primarily in `src/app.tsx`, which is the Hono[^9] application shell: routes, request
handling, and the composition of the domain modules from the previous chapter into HTTP responses.
The rendering itself is split between `src/gamebook/render.ts` for the author-capable development
build and `src/gamebook/player-render.ts` for the published player-only build. We'll look at why
that split exists in Chapter 9, when we talk about what different users are allowed to see.

The domain modules from Chapter 2, `model.ts` and `graph.ts`, don't know anything about HTTP.
They don't know about Hono or htmx or HTML. They know about passages, choices, validation, and
graphs. The application shell knows about HTTP. The rendering layer bridges the two. This
separation is not accidental; it is, in every meaningful sense, the point.

---

The web was built on a simple idea: documents with links. Every elaboration since then — forms,
AJAX, fragments, redirects and hypermedia constraints — has been an attempt to make that idea more
expressive without abandoning what made it work in the first place. The gamebook is a useful
lens for this history because it has always been, at heart, the same thing: a document with links,
asking you what you want to do next.

The door on the dungeon panel did not lie. It offered exactly the choices available from that
position, in that state, at that moment: precisely how a good web response ought to work.

In the next chapter, we'll step back from the passage and look at who's standing in front of it.
Before a player can make a choice, they need a character: a structured record of facts that the
game's rules can operate on. That record is a data model, and building one is the subject of
Chapter 4.

---

## At Scale: Campaign Ledger

The same pattern that structures a gamebook passage also structures a character sheet in a
multi-user application. In Campaign Ledger, a sheet route returns a full page for direct
navigation: addressable, bookmarkable, renderable without JavaScript. Individual panels within
the sheet each have their own fragment endpoints. Editing a skill returns just the updated skills
panel. Spending a spell slot returns just the updated resource row.

The route shapes at the two scales look like this:

```
GET  /gamebook                       → full page with current passage
POST /gamebook/choices/:choiceId     → passage fragment

GET  /sheet/:ref                     → full character sheet
POST /sheet/:ref/resources/:id       → resource row fragment
GET  /sheet/:ref/abilities           → abilities tab (full or fragment)
```

The concepts are identical. The scope is different. The gamebook proves the pattern with a small,
inspectable example; Campaign Ledger proves it holds when more users, more panels, and more
concurrent sessions apply pressure to the same ideas.

---

[^1]: The word hypertext was coined by Ted Nelson in a 1965 paper, "A File Structure for the
Complex, the Changing and the Indeterminate", and developed at length in his vision for a global
hypertext system called Xanadu, which he began designing in 1960 and which has been "almost
finished" for most of the subsequent six decades. The web, built by Berners-Lee in 1989, is in
some ways a much simpler system than Nelson had in mind. It works, which Xanadu largely has not,
and Nelson has had strong feelings about this for some time.

[^2]: **Idempotent** means that making the same request multiple times has the same effect as
making it once. GET requests are idempotent: loading a page five times doesn't change anything.
POST requests are typically not: submitting a form five times might place five orders, spend five
spell slots, or kill the same goblin five times to varying degrees of metaphysical confusion.

[^3]: Using GET for state-changing operations is a category of bug that has caused real production
incidents. The most famous example is the Google Web Accelerator incident of 2005, where a tool
that prefetched GET links to speed up browsing accidentally triggered deletion actions on
web applications that had used GET for destructive operations. The lesson, that GET should be safe
and idempotent, was well-established before that incident and has been worth repeating ever since.

[^4]: htmx: [htmx.org](https://htmx.org/). Created by Carson Gross, whose companion essay
*Hypermedia Systems* (available at [hypermedia.systems](https://hypermedia.systems/)) is a
thorough and occasionally combative examination of how the web drifted away from its hypermedia
roots and how to drift back. Required reading if any part of this chapter makes you want to argue
about JavaScript frameworks.

[^5]: htmx does let you make any HTML element send requests, but just because you can, doesn't
mean you should. `<button>`, `<a>`, `<form>` and similar elements are designed to trigger requests,
and semantically they indicate this. `<div>`, `<span>`, `<tr>` and other elements are semantically
inert. They are not intended to call an API and do not signify this accordingly. Applying htmx
only to elements that are intended to make requests is what the maintainers of the library
recommend, and it is the right practice: semantic HTML already tells the browser, the
accessibility tree, and the next developer what an element is for. htmx should respect that
signal rather than override it.

[^6]: HTTP status codes are organised into five families, each covering a different kind of
server response. 1xx codes are informational (the server is thinking; rarely encountered in
practice). 2xx codes signal success: `200 OK` is the standard response for a page that exists
and could be served. 3xx codes are redirections: the thing you asked for is over there. 4xx
codes mean the client made a mistake: `404 Not Found` is the classic case; `403 Forbidden` means
the resource exists but you're not allowed to see it. 5xx codes mean the server made a mistake.
The full list, maintained by IANA, contains many entries, including the eternally beloved
[418 I'm a Teapot](https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/418), which was
introduced in a 1998 April Fools' RFC and has survived every subsequent cleanup effort through
sheer force of collective affection.

[^7]: The Post/Redirect/Get pattern is described in the Web Application Architecture literature
and in Fowler's *Patterns of Enterprise Application Architecture*. The problem it solves is
sometimes called the double-submit problem: if the browser is sitting on a POST response and the
user refreshes, the browser will ask whether to resubmit the form. PRG (you read that right, we're
not talking about Role Playing Games) replaces the POST response with a redirect to a GET endpoint,
so the page the user ends up on is safe to refresh.

[^8]: Roy Fielding, *Architectural Styles and the Design of Network-based Software
Architectures*, Chapter 5, University of California Irvine, 2000. Available at
[roy.gbiv.com/pubs/dissertation/rest_arch_style.htm](https://roy.gbiv.com/pubs/dissertation/rest_arch_style.htm).
The dissertation is genuinely readable, which is unusual for academic work that spawned two decades
of heated conference-talk disagreement.

[^9]: Hono: [hono.dev](https://hono.dev/). A fast, lightweight web framework that runs on Bun,
Node, Cloudflare Workers, and several other runtimes. Mt. Graphnor uses it as the application
shell: routing, middleware, and request/response handling. The domain modules don't depend on it.