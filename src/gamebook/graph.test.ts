import { expect, test } from "bun:test";
import { mtGraphnorAdventure } from "./content/mt-graphnor.ts";
import {
  exportMermaid,
  getReachablePassageIds,
  validateAdventure,
} from "./graph.ts";
import { Adventure } from "./model.ts";

test("Mt. Graphnor validates as a reachable passage graph", () => {
  const result = validateAdventure(mtGraphnorAdventure);

  expect(result.issues.map((issue) => issue.message)).toEqual([]);
  expect(result.valid).toBe(true);
  expect(result.reachablePassageIds.size).toBe(
    mtGraphnorAdventure.passages.length,
  );
});

test("Mt. Graphnor includes victory, failure, retreat, and cliffhanger endings", () => {
  const endings = new Set(
    mtGraphnorAdventure.passages.flatMap((passage) =>
      passage.ending ? [passage.ending] : []
    ),
  );

  expect(endings.has("victory")).toBe(true);
  expect(endings.has("failure")).toBe(true);
  expect(endings.has("retreat")).toBe(true);
  expect(endings.has("cliffhanger")).toBe(true);
});

test("validation reports missing choice targets", () => {
  const adventure: Adventure = {
    id: "broken",
    title: "Broken",
    startPassageId: "start",
    attribution: [],
    passages: [
      {
        id: "start",
        title: "Start",
        body: "Broken graph.",
        choices: [{ id: "missing", text: "Go missing", targetId: "nowhere" }],
      },
    ],
  };

  const result = validateAdventure(adventure);

  expect(result.valid).toBe(false);
  expect(result.issues.some((issue) => issue.code === "missing-target")).toBe(
    true,
  );
});

test("validation reports targetless choices", () => {
  const adventure: Adventure = {
    id: "broken",
    title: "Broken",
    startPassageId: "start",
    attribution: [],
    passages: [
      {
        id: "start",
        title: "Start",
        body: "Broken graph.",
        choices: [{ id: "empty", text: "Go nowhere" }],
      },
    ],
  };

  const result = validateAdventure(adventure);

  expect(result.valid).toBe(false);
  expect(result.issues.some((issue) => issue.code === "targetless-choice")).toBe(
    true,
  );
});

test("validation reports missing combat encounters", () => {
  const adventure: Adventure = {
    id: "broken-combat",
    title: "Broken Combat",
    startPassageId: "start",
    attribution: [],
    passages: [
      {
        id: "start",
        title: "Start",
        body: "Broken combat.",
        choices: [
          {
            id: "fight",
            text: "Fight",
            combat: {
              encounterId: "missing-encounter",
              onVictory: "victory",
              onDefeat: "failure",
              onContinue: "start",
            },
          },
        ],
      },
      {
        id: "victory",
        title: "Victory",
        body: "Done.",
        ending: "victory",
        choices: [],
      },
      {
        id: "failure",
        title: "Failure",
        body: "Done.",
        ending: "failure",
        choices: [],
      },
    ],
  };

  const result = validateAdventure(adventure);

  expect(result.valid).toBe(false);
  expect(
    result.issues.some((issue) => issue.code === "missing-encounter"),
  ).toBe(true);
});

test("validation reports missing content references", () => {
  const adventure: Adventure = {
    id: "broken-content",
    title: "Broken Content",
    startPassageId: "start",
    attribution: [],
    items: [{ id: "known-item", name: "Known Item", kind: "key" }],
    discoveries: [{ id: "known-flag", name: "Known Flag" }],
    passages: [
      {
        id: "start",
        title: "Start",
        body: "Broken content.",
        choices: [
          {
            id: "use-missing",
            text: "Use missing content",
            targetId: "ending",
            requires: {
              flagsAll: ["missing-flag"],
              itemsAll: ["missing-key"],
            },
            effects: {
              addItems: ["missing-reward"],
              removeItems: ["known-item"],
              setFlags: ["known-flag", "missing-discovery"],
            },
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
  };

  const result = validateAdventure(adventure);

  expect(result.valid).toBe(false);
  expect(result.issues.filter((issue) => issue.code === "missing-item").map((
    issue,
  ) => issue.itemId)).toEqual(["missing-key", "missing-reward"]);
  expect(result.issues.filter((issue) => issue.code === "missing-discovery").map((
    issue,
  ) => issue.discoveryId)).toEqual(["missing-flag", "missing-discovery"]);
});

test("validation reports duplicate content definitions", () => {
  const adventure: Adventure = {
    id: "duplicate-content",
    title: "Duplicate Content",
    startPassageId: "start",
    attribution: [],
    items: [
      { id: "key", name: "Key", kind: "key" },
      { id: "key", name: "Other Key", kind: "key" },
    ],
    discoveries: [
      { id: "flag", name: "Flag" },
      { id: "flag", name: "Other Flag" },
    ],
    encounters: [
      {
        id: "guard",
        name: "Guard",
        armourClass: 10,
        hitPoints: 1,
        attack: {
          name: "Tap",
          attackBonus: 1,
          damage: { dice: 1, sides: 1, modifier: 0, type: "bludgeoning" },
        },
      },
      {
        id: "guard",
        name: "Other Guard",
        armourClass: 10,
        hitPoints: 1,
        attack: {
          name: "Tap",
          attackBonus: 1,
          damage: { dice: 1, sides: 1, modifier: 0, type: "bludgeoning" },
        },
      },
    ],
    passages: [
      {
        id: "start",
        title: "Start",
        body: "Start.",
        ending: "victory",
        choices: [],
      },
    ],
  };

  const result = validateAdventure(adventure);

  expect(result.valid).toBe(false);
  expect(result.issues.some((issue) => issue.code === "duplicate-item")).toBe(
    true,
  );
  expect(
    result.issues.some((issue) => issue.code === "duplicate-discovery"),
  ).toBe(true);
  expect(
    result.issues.some((issue) => issue.code === "duplicate-encounter"),
  ).toBe(true);
});

test("validation reports unreachable passages", () => {
  const adventure: Adventure = {
    id: "unreachable",
    title: "Unreachable",
    startPassageId: "start",
    attribution: [],
    passages: [
      {
        id: "start",
        title: "Start",
        body: "Start.",
        ending: "victory",
        choices: [],
      },
      {
        id: "lost",
        title: "Lost",
        body: "Lost.",
        ending: "failure",
        choices: [],
      },
    ],
  };

  const result = validateAdventure(adventure);

  expect(getReachablePassageIds(adventure).has("lost")).toBe(false);
  expect(
    result.issues.some((issue) => issue.code === "unreachable-passage"),
  ).toBe(true);
  expect(
    result.issues.some((issue) => issue.code === "unreachable-ending"),
  ).toBe(true);
});

test("Mermaid export includes passage nodes and choice edges", () => {
  const mermaid = exportMermaid(mtGraphnorAdventure);

  expect(mermaid.startsWith("flowchart TD")).toBe(true);
  expect(mermaid).toContain('p_entrance["Entrance And Guardian"]');
  expect(mermaid).toContain(
    'p_entrance -->|"Force a way through"| p_guardian_clash',
  );
  expect(mermaid).toContain(
    'p_guardian_clash -->|"Trade blows with the guardian"| p_keyboard_room',
  );
});
