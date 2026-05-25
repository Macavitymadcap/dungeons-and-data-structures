import { expect, test } from "bun:test";
import {
  gateNamesForArea,
  TEST_COVERAGE_AREAS,
  VERIFICATION_GATES,
} from "./testing.ts";

test("testing manifest maps every coverage area to a verification gate", () => {
  const gateIds = new Set(VERIFICATION_GATES.map((gate) => gate.id));

  for (const area of TEST_COVERAGE_AREAS) {
    expect(area.coveredBy.length).toBeGreaterThan(0);
    expect(area.gates.length).toBeGreaterThan(0);
    for (const gateId of area.gates) {
      expect(gateIds.has(gateId)).toBe(true);
    }
  }
});

test("testing manifest covers graph, state, rules, UI, and static browser surfaces", () => {
  expect(TEST_COVERAGE_AREAS.map((area) => area.id)).toEqual([
    "graph-content",
    "state-persistence",
    "rules-resolution",
    "routes-ui",
    "published-static",
  ]);
  expect(VERIFICATION_GATES.map((gate) => gate.command)).toContain(
    "bun run test:static-gamebook",
  );
  expect(gateNamesForArea(TEST_COVERAGE_AREAS[0])).toBe("Unit tests");
});
