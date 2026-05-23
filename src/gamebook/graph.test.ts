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
