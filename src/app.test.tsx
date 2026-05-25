import { describe, expect, test } from "bun:test";
import { createApp } from "./app.tsx";
import { mtGraphnorAdventure } from "./gamebook/content/mt-graphnor.ts";
import { createCharacter } from "./gamebook/rules/character.ts";
import { createInitialState } from "./gamebook/state.ts";

describe("createApp", () => {
  test("health check returns JSON", async () => {
    const app = createApp();
    const response = await app.request("/healthz");

    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ ok: true });
  });

  test("gamebook page renders the starting passage", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const response = await app.request("/gamebook?class=rogue&race=elf");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("gamebook-site-header");
    expect(html).toContain("Gamebook lab");
    expect(html).toContain('id="gamebook-theme-toggle"');
    expect(html).toContain('data-theme-toggle=""');
    expect(html).toContain("dads-gamebook-theme");
    expect(html).toContain('href="/gamebook/author"');
    expect(html).toContain("Mt. Graphnor");
    expect(html).toContain("Entrance And Guardian");
    expect(html).toContain("Options");
    expect(html).toContain("Slip past the guard");
    expect(html).toContain('<output class="labelled-output-value">rogue</output>');
    expect(html).toContain('<output class="labelled-output-value">elf</output>');
    expect(html).toContain("Shortsword");
    expect(html).toContain("Thieves&#39; tools");
    expect(html).toContain("Dungeons &amp; Dragons System Reference Document 5.1");
    expect(html).toContain("<dt>Discoveries</dt>");
    expect(html).toContain("gamebook-popover-header");
    expect(html).toContain("New games, local saves, and JSON import tools.");
    expect(html).toContain("Save summary");
    expect(html).toContain('data-save-current-passage=""');
    expect(html).toContain('data-save-version=""');
    expect(html).toContain('data-save-updated=""');
    expect(html).toContain("gamebook-save-import");
    expect(html).toContain("gamebook-save-json");
    expect(html).toContain("gamebook-download-save");
  });

  test("serves author-capable browser client when author tools are enabled", async () => {
    const app = createApp();
    const response = await app.request("/assets/client.js");
    const script = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
    expect(script).toContain("gamebook-force-passage");
    expect(script).toContain("Debug state");
  });

  test("debug gamebook page renders live state details", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const response = await app.request("/gamebook?debug=1");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Debug state");
    expect(html).toContain("<dt>Passage ID</dt>");
    expect(html).toContain("<dd>entrance</dd>");
    expect(html).toContain("door-guardian: 6 HP");
    expect(html).toContain("Recent log");
    expect(html).toContain("Game started.");
    expect(html).toContain('name="authorMode" value="1"');
    expect(html).toContain("gamebook-force-passage");
    expect(html).toContain("debug-force-passage");
  });

  test("disabled author tools hide debug mode and author routes", async () => {
    const app = createApp({
      authorToolsEnabled: false,
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const pageResponse = await app.request("/gamebook?debug=1");
    const pageHtml = await pageResponse.text();

    expect(pageResponse.status).toBe(200);
    expect(pageHtml).not.toContain("Debug state");
    expect(pageHtml).not.toContain("gamebook-force-passage");
    expect(pageHtml).not.toContain('name="authorMode" value="1"');
    expect(pageHtml).not.toContain('href="/gamebook/author"');

    const authorResponse = await app.request("/gamebook/author");
    expect(authorResponse.status).toBe(404);
  });

  test("serves player-only browser client when author tools are disabled", async () => {
    const app = createApp({ authorToolsEnabled: false });
    const response = await app.request("/assets/client.js");
    const script = await response.text();

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/javascript");
    expect(script).not.toContain("gamebook-force-passage");
    expect(script).not.toContain("Debug state");
    expect(script).not.toContain("authorMode");
  });

  test("author page renders validation summary and Mermaid graph", async () => {
    const app = createApp();
    const response = await app.request("/gamebook/author");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("gamebook-site-header");
    expect(html).toContain('aria-current="page" href="/gamebook/author"');
    expect(html).toContain('id="gamebook-theme-toggle"');
    expect(html).toContain("Author Tools");
    expect(html).toContain("role=\"tablist\"");
    expect(html).toContain("data-author-tab=\"audit\"");
    expect(html).toContain("data-author-tab=\"graph\"");
    expect(html).toContain("data-author-tab=\"testing\"");
    expect(html).toContain("data-author-tab-panel=\"previews\"");
    expect(html).toContain("Graph validation");
    expect(html).toContain("Validation passed");
    expect(html).toContain("Five-room template");
    expect(html).toContain("Template coverage passed");
    expect(html).toContain("Content audit");
    expect(html).toContain("Combat choices");
    expect(html).toContain("Gated choices");
    expect(html).toContain("State effects");
    expect(html).toContain("Testing coverage");
    expect(html).toContain("Verification gates");
    expect(html).toContain("Published static gamebook");
    expect(html).toContain("scripts/test-static-gamebook.ts");
    expect(html).toContain("victory, failure, retreat, cliffhanger");
    expect(html).toContain("room-1");
    expect(html).toContain("gamebook-mermaid-diagram mermaid");
    expect(html).toContain("Mermaid source");
    expect(html).toContain("flowchart TD");
    expect(html).toContain("p_guardian_clash");
    expect(html).toContain("Passage previews");
    expect(html).toContain("Filter passage previews");
    expect(html).toContain("data-passage-filter=\"all\"");
    expect(html).toContain("data-passage-filter=\"roleplay\"");
    expect(html).toContain("data-passage-filter=\"combat\"");
    expect(html).toContain("data-passage-filter=\"failure\"");
    expect(html).toContain("data-passage-filters=\"start room-1 roleplay\"");
    expect(html).toContain("Entrance And Guardian");
    expect(html).toContain("Force a way through -&gt; guardian-clash");
  });

  test("author page renders content validation issues", async () => {
    const app = createApp({
      adventure: {
        id: "broken-content",
        title: "Broken Content",
        startPassageId: "start",
        attribution: [],
        items: [],
        discoveries: [],
        passages: [
          {
            id: "start",
            title: "Start",
            body: "Broken.",
            choices: [
              {
                id: "broken-choice",
                text: "Broken choice",
                targetId: "ending",
                requires: { itemsAll: ["missing-key"] },
                effects: { setFlags: ["missing-flag"] },
              },
            ],
          },
          {
            id: "ending",
            title: "Ending",
            body: "Done.",
            ending: "victory",
            choices: [],
          },
        ],
      },
    });
    const response = await app.request("/gamebook/author");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Validation failed");
    expect(html).toContain("Template coverage failed");
    expect(html).toContain("missing-item");
    expect(html).toContain("missing-discovery");
    expect(html).toContain("missing-room");
    expect(html).toContain("missing-ending");
  });

  test("choice post returns the next passage fragment", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const state = createInitialState(
      mtGraphnorAdventure,
      createCharacter("hero-1", "Adventurer", "fighter"),
      new Date("2026-05-23T12:00:00.000Z"),
    );
    const body = new URLSearchParams({
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/fight-guard", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Guardian Clash");
    expect(html).toContain("Trade blows with the guardian");
  });

  test("choice post preserves author debug mode", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const state = createInitialState(
      mtGraphnorAdventure,
      createCharacter("hero-1", "Adventurer", "fighter"),
      new Date("2026-05-23T12:00:00.000Z"),
    );
    const body = new URLSearchParams({
      authorMode: "1",
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/fight-guard", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Guardian Clash");
    expect(html).toContain("Debug state");
    expect(html).toContain("<dd>guardian-clash</dd>");
  });

  test("author mode can force navigation to a passage", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const state = createInitialState(
      mtGraphnorAdventure,
      createCharacter("hero-1", "Adventurer", "fighter"),
      new Date("2026-05-23T12:00:00.000Z"),
    );
    const body = new URLSearchParams({
      authorMode: "1",
      passageId: "keyboard-room",
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/passages", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Keyboard Room");
    expect(html).toContain("Debug state");
    expect(html).toContain("<dd>keyboard-room</dd>");
    expect(html).toContain("Forced passage to keyboard-room.");
  });

  test("author mode can force navigation from a stale passage id", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const state = {
      ...createInitialState(
        mtGraphnorAdventure,
        createCharacter("hero-1", "Adventurer", "fighter"),
        new Date("2026-05-23T12:00:00.000Z"),
      ),
      currentPassageId: "renamed-during-drafting",
    };
    const body = new URLSearchParams({
      authorMode: "1",
      passageId: "keyboard-room",
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/passages", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Keyboard Room");
    expect(html).toContain("<dd>keyboard-room</dd>");
    expect(html).toContain("Forced passage to keyboard-room.");
  });

  test("force navigation is rejected outside author mode", async () => {
    const app = createApp();
    const state = createInitialState(
      mtGraphnorAdventure,
      createCharacter("hero-1", "Adventurer", "fighter"),
    );
    const body = new URLSearchParams({
      passageId: "keyboard-room",
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/passages", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.status).toBe(403);
    expect(await response.text()).toContain(
      "Force navigation is only available in author mode.",
    );
  });

  test("force navigation is not mounted when author tools are disabled", async () => {
    const app = createApp({ authorToolsEnabled: false });
    const state = createInitialState(
      mtGraphnorAdventure,
      createCharacter("hero-1", "Adventurer", "fighter"),
    );
    const body = new URLSearchParams({
      authorMode: "1",
      passageId: "keyboard-room",
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/passages", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.status).toBe(404);
  });

  test("combat choice returns combat summary and updates encounter state", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
      random: sequence([0.95, 0.5]),
    });
    const character = createCharacter("hero-1", "Adventurer", "fighter");
    const state = {
      ...createInitialState(
        mtGraphnorAdventure,
        character,
        new Date("2026-05-23T12:00:00.000Z"),
      ),
      currentPassageId: "guardian-clash",
    };
    const body = new URLSearchParams({
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/win-guardian", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Keyboard Room");
    expect(html).toContain("Combat round 1");
    expect(html).toContain("Your attack");
    expect(html).toContain("Foe HP");
    expect(html).toContain("Door Guardian is defeated.");
    expect(html).toContain("&quot;defeated&quot;:true");
  });

  test("combat can continue across visible rounds", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
      random: sequence([0, 0]),
    });
    const character = createCharacter("hero-1", "Adventurer", "fighter");
    const state = {
      ...createInitialState(
        mtGraphnorAdventure,
        character,
        new Date("2026-05-23T12:00:00.000Z"),
      ),
      currentPassageId: "guardian-clash",
    };
    const body = new URLSearchParams({
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/win-guardian", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Guardian Clash");
    expect(html).toContain("gamebook-encounter-status");
    expect(html).toContain("Encounter status");
    expect(html).toContain('<output class="labelled-output-value">Door Guardian</output>');
    expect(html).toContain('<output class="labelled-output-value">6/6</output>');
    expect(html).toContain('<output class="labelled-output-value">1</output>');
    expect(html).toContain("Combat round 1");
    expect(html).toContain("Foe attack");
    expect(html).not.toContain("Use a ration and catch your breath");
  });

  test("combat recovery consumes a ration and heals", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const character = createCharacter("hero-1", "Adventurer", "fighter");
    const state = {
      ...createInitialState(mtGraphnorAdventure, character),
      currentPassageId: "guardian-clash",
      hitPoints: character.maxHitPoints - 3,
    };
    const body = new URLSearchParams({
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/catch-breath-guardian", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain(`>${character.maxHitPoints - 1}/${character.maxHitPoints}<`);
    expect(html).not.toContain("Ration");
  });

  test("gated choices are rejected when requirements are missing", async () => {
    const app = createApp();
    const state = createInitialState(
      mtGraphnorAdventure,
      createCharacter("hero-1", "Adventurer", "fighter"),
    );
    const trapState = {
      ...state,
      currentPassageId: "trap-hall",
    };
    const body = new URLSearchParams({
      state: JSON.stringify(trapState),
    });

    const response = await app.request("/gamebook/choices/use-key", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.status).toBe(403);
    expect(await response.text()).toContain(
      "That choice is not currently available.",
    );
  });

  test("choice post rejects invalid submitted state", async () => {
    const app = createApp();
    const body = new URLSearchParams({
      state: "{nope",
    });

    const response = await app.request("/gamebook/choices/fight-guard", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain("Saved game is not valid JSON.");
  });

  test("choice post rejects submitted state for a missing passage", async () => {
    const app = createApp();
    const state = {
      ...createInitialState(
        mtGraphnorAdventure,
        createCharacter("hero-1", "Adventurer", "fighter"),
      ),
      currentPassageId: "missing-room",
    };
    const body = new URLSearchParams({
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/fight-guard", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    expect(response.status).toBe(400);
    expect(await response.text()).toContain(
      "Saved game passage is not valid for this adventure.",
    );
  });

  test("class inventory can unlock a puzzle route", async () => {
    const app = createApp({
      now: () => new Date("2026-05-23T12:00:00.000Z"),
    });
    const state = {
      ...createInitialState(
        mtGraphnorAdventure,
        createCharacter("hero-1", "Adventurer", "rogue"),
      ),
      currentPassageId: "keyboard-room",
    };
    const body = new URLSearchParams({
      state: JSON.stringify(state),
    });

    const response = await app.request("/gamebook/choices/use-tools-on-puzzle", {
      method: "POST",
      body,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Keyboard Room Clue");
    expect(html).toContain("Solved the keyboard room");
  });
});

function sequence(values: number[]) {
  return () => values.shift() ?? 0;
}
