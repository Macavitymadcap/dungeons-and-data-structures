import path from "node:path";
import { chromium } from "@playwright/test";
import { startBunServer } from "@macavitymadcap/hyper-dank-automation";

const root = path.resolve("dist");
const server = startBunServer({
  fetch: async (request) => {
    const url = new URL(request.url);
    const filePath = safeStaticPath(url.pathname);
    const file = Bun.file(filePath);
    if (!(await file.exists())) {
      return new Response("Not found", { status: 404 });
    }

    return new Response(file, {
      headers: {
        "Content-Type": contentType(filePath),
      },
    });
  },
});

const browser = await chromium.launch();
try {
  const page = await browser.newPage();
  await page.goto(`${server.url}/gamebook/`);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  await expectText(page.locator("h1"), "Mt. Graphnor");
  await expectText(page.locator("[data-passage-id] > h2"), "Entrance And Guardian");
  await expectText(page.locator("#gamebook-save-status"), "Started a new game.");

  await page.selectOption("#gamebook-class", "rogue");
  await page.selectOption("#gamebook-race", "elf");
  await page.getByRole("button", { name: "New game" }).click();
  await expectText(page.locator(".metadata-list dd").first(), "rogue");
  await expectText(page.locator(".metadata-list dd").nth(1), "elf");
  await expectStorage(page, "character.class", "rogue");
  await expectStorage(page, "character.race", "elf");

  await page.getByRole("button", { name: "Force a way through" }).click();
  await expectText(page.locator("[data-passage-id] > h2"), "Guardian Clash");
  await expectStorage(page, "currentPassageId", "guardian-clash");

  const fixedRolls = [0.95, 0.5];
  await page.evaluate((rolls) => {
    let index = 0;
    Math.random = () => rolls[index++] ?? 0;
  }, fixedRolls);
  await page.getByRole("button", { name: "Trade blows with the guardian" }).click();
  await expectText(page.locator("[data-passage-id] > h2"), "Keyboard Room");
  await expectText(page.locator(".notice h2"), "Combat round");
  await expectStorage(page, "currentPassageId", "keyboard-room");
  await expectEncounterDefeated(page, "door-guardian");

  await page.getByRole("button", { name: "Export save" }).click();
  const exportedSave = await page.locator("#gamebook-save-json").inputValue();
  if (!exportedSave.includes('"currentPassageId": "keyboard-room"')) {
    throw new Error("Expected exported save JSON to include the current passage.");
  }
  await expectText(page.locator("#gamebook-save-status"), "Exported current save JSON.");

  await page.getByRole("button", { name: "Reset" }).click();
  await expectText(page.locator("[data-passage-id] > h2"), "Entrance And Guardian");
  const saved = await page.evaluate(() => localStorage.getItem("dads-gamebook-save"));
  if (saved !== null) {
    throw new Error("Expected reset to clear localStorage save.");
  }

  await page.getByRole("button", { name: "Import save" }).click();
  await expectText(page.locator("[data-passage-id] > h2"), "Keyboard Room");
  await expectText(page.locator("#gamebook-save-status"), "Imported saved game.");
  await expectStorage(page, "currentPassageId", "keyboard-room");
  await expectEncounterDefeated(page, "door-guardian");
} finally {
  await browser.close();
  server.server.stop(true);
}

console.log("Static gamebook browser smoke passed.");

function safeStaticPath(pathname: string): string {
  const relativePath = pathname === "/" || pathname.endsWith("/")
    ? `${pathname.replace(/^\/+/, "")}index.html`
    : pathname.replace(/^\/+/, "");
  const resolved = path.resolve(root, relativePath);
  const relative = path.relative(root, resolved);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Static path escapes root: ${pathname}`);
  }
  return resolved;
}

function contentType(filePath: string): string {
  if (filePath.endsWith(".css")) return "text/css; charset=utf-8";
  if (filePath.endsWith(".js")) return "text/javascript; charset=utf-8";
  if (filePath.endsWith(".html")) return "text/html; charset=utf-8";
  return "application/octet-stream";
}

async function expectText(locator: import("@playwright/test").Locator, text: string) {
  const content = (await locator.textContent())?.trim();
  if (content !== text) {
    throw new Error(`Expected text ${JSON.stringify(text)}, got ${JSON.stringify(content)}.`);
  }
}

async function expectStorage(
  page: import("@playwright/test").Page,
  keyPath: "character.class" | "character.race" | "currentPassageId",
  expected: string,
) {
  const actual = await page.evaluate((path) => {
    const raw = localStorage.getItem("dads-gamebook-save");
    if (!raw) return null;
    const save = JSON.parse(raw);
    if (path === "character.class") return save.character.class;
    if (path === "character.race") return save.character.race;
    return save.currentPassageId;
  }, keyPath);

  if (actual !== expected) {
    throw new Error(`Expected ${keyPath} ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}.`);
  }
}

async function expectEncounterDefeated(
  page: import("@playwright/test").Page,
  encounterId: string,
) {
  const defeated = await page.evaluate((id) => {
    const raw = localStorage.getItem("dads-gamebook-save");
    if (!raw) return null;
    const save = JSON.parse(raw);
    return save.encounters[id]?.defeated;
  }, encounterId);

  if (defeated !== true) {
    throw new Error(`Expected encounter ${encounterId} to be defeated.`);
  }
}
