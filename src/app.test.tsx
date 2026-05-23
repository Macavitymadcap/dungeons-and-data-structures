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
    expect(html).toContain("gamebook-save-import");
    expect(html).toContain("gamebook-save-json");
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
    expect(html).toContain("Door Guardian is defeated.");
    expect(html).toContain("&quot;defeated&quot;:true");
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
});

function sequence(values: number[]) {
  return () => values.shift() ?? 0;
}
