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
    expect(html).toContain("Mt. Graphnor");
    expect(html).toContain("Entrance And Guardian");
    expect(html).toContain("Slip past the guard");
    expect(html).toContain("<dd>rogue</dd>");
    expect(html).toContain("<dd>elf</dd>");
    expect(html).toContain("Shortsword");
    expect(html).toContain("Thieves&#39; tools");
    expect(html).toContain("<dt>Discoveries</dt>");
    expect(html).toContain("gamebook-save-import");
    expect(html).toContain("gamebook-save-json");
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

  test("author page renders validation summary and Mermaid graph", async () => {
    const app = createApp();
    const response = await app.request("/gamebook/author");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Author Tools");
    expect(html).toContain("Graph validation");
    expect(html).toContain("Validation passed");
    expect(html).toContain("flowchart TD");
    expect(html).toContain("p_guardian_clash");
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
    expect(html).toContain("missing-item");
    expect(html).toContain("missing-discovery");
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
    expect(html).toContain("Combat round");
    expect(html).toContain("Round 1:");
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
    expect(html).toContain("Encounter status");
    expect(html).toContain("Door Guardian: 6/6 HP, round 1.");
    expect(html).toContain("Round 1:");
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
