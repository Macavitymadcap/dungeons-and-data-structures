export interface VerificationGate {
  id: string;
  name: string;
  command: string;
  evidence: string;
}

export interface TestCoverageArea {
  id: string;
  title: string;
  purpose: string;
  coveredBy: string[];
  gates: string[];
}

export const VERIFICATION_GATES: VerificationGate[] = [
  {
    id: "typecheck",
    name: "Type check",
    command: "bun run typecheck",
    evidence: "TypeScript catches broken contracts between content, state, rules, and UI.",
  },
  {
    id: "unit-tests",
    name: "Unit tests",
    command: "bun test",
    evidence: "Bun tests exercise graph validation, state migration, choice resolution, dice, combat, and route rendering.",
  },
  {
    id: "static-build",
    name: "Static build",
    command: "bun run build",
    evidence: "The static artefacts are regenerated from the same gamebook modules used by the dev server.",
  },
  {
    id: "static-check",
    name: "Static artifact check",
    command: "bun run static:check",
    evidence: "The published files contain player-facing assets and omit development-only author/debug tooling.",
  },
  {
    id: "static-browser",
    name: "Static browser smoke",
    command: "bun run test:static-gamebook",
    evidence: "Playwright walks a served static game through new-game, combat, puzzle, export, reset, and import flows.",
  },
];

export const TEST_COVERAGE_AREAS: TestCoverageArea[] = [
  {
    id: "graph-content",
    title: "Passage graph and content",
    purpose: "Protects reachability, missing targets, room coverage, endings, Mermaid export, and content references.",
    coveredBy: ["src/gamebook/graph.test.ts"],
    gates: ["unit-tests"],
  },
  {
    id: "state-persistence",
    title: "Save state and persistence",
    purpose: "Protects save creation, migration, import validation, local storage round-trips, conditions, items, and hit point effects.",
    coveredBy: ["src/gamebook/state.test.ts", "scripts/test-static-gamebook.ts"],
    gates: ["unit-tests", "static-browser"],
  },
  {
    id: "rules-resolution",
    title: "Rules, dice, and combat",
    purpose: "Protects character creation, SRD provenance tables, d20 checks, damage rolls, combat rounds, and choice effects.",
    coveredBy: [
      "src/gamebook/rules/character.test.ts",
      "src/gamebook/rules/dice.test.ts",
      "src/gamebook/rules/combat.test.ts",
      "src/gamebook/rules/srd.test.ts",
      "src/gamebook/play.test.ts",
    ],
    gates: ["unit-tests"],
  },
  {
    id: "routes-ui",
    title: "Routes and rendered UI",
    purpose: "Protects Hono routes, author/player boundaries, debug controls, save management controls, and visible attribution.",
    coveredBy: ["src/app.test.tsx"],
    gates: ["unit-tests", "typecheck"],
  },
  {
    id: "published-static",
    title: "Published static gamebook",
    purpose: "Protects generated static HTML, assets, player-only client bundling, and browser-local play behaviour.",
    coveredBy: ["scripts/check-static.ts", "scripts/test-static-gamebook.ts"],
    gates: ["static-build", "static-check", "static-browser"],
  },
];

export function gateNamesForArea(area: TestCoverageArea): string {
  const gateNames = new Map(VERIFICATION_GATES.map((gate) => [gate.id, gate.name]));
  return area.gates.map((gateId) => gateNames.get(gateId) ?? gateId).join(", ");
}
