import { assertEquals } from "jsr:@std/assert";
import {
  ENCOUNTER_MULTIPLIERS,
  Level,
  XP_THRESHOLDS_BY_LEVEL,
} from "./encounter-evaluator.model.ts";
import { EncounterEvaluator } from "./encounter-evaluator.ts";

[
  { opponents: [25], expectedIndex: 0 },
  { opponents: [25, 25], expectedIndex: 1 },
  { opponents: [25, 25, 25], expectedIndex: 2 },
  { opponents: [25, 25, 25, 25, 25, 25, 25], expectedIndex: 3 },
  { opponents: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25], expectedIndex: 4 },
  {
    opponents: [25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25],
    expectedIndex: 5,
  },
].forEach((test) => {
  Deno.test(`getMultiplier given ${test.opponents.length} opponents returns the multiplier at index ${test.expectedIndex}`, () => {
    // Arrange
    const encounter = { opponents: test.opponents, party: [1] };
    const expectedMultiplier = ENCOUNTER_MULTIPLIERS[test.expectedIndex];

    // Act
    const result = new EncounterEvaluator(encounter).multiplier;

    // Assert
    assertEquals(result, expectedMultiplier);
  });
});

[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].forEach(
  (level) => {
    Deno.test(`getCharacterXPThresholds given level ${level} returns the corresponding XP thresholds`, () => {
      // Arrange
      const encounter = { opponents: [1], party: [level] };
      const expectedThreshold = XP_THRESHOLDS_BY_LEVEL[level as Level];

      // Act
      const result = new EncounterEvaluator(encounter).partyXpThresholds;

      // Assert
      assertEquals(result, expectedThreshold);
    });
  },
);

[
  {
    party: [1, 1, 1, 1],
    opponents: [25, 25, 25, 25],
    expectedThresholds: { Easy: 100, Medium: 200, Hard: 300, Deadly: 400 },
    description: "4 level 1 characters",
  },
  {
    party: [2, 2, 2, 2],
    opponents: [25, 25, 25, 25],
    expectedThresholds: { Easy: 200, Medium: 400, Hard: 600, Deadly: 800 },
    description: "4 level 2 characters",
  },
  {
    party: [3, 3, 3, 2],
    opponents: [25, 25, 25, 25],
    expectedThresholds: { Easy: 275, Medium: 550, Hard: 825, Deadly: 1400 },
    description: "3 level 3 characters and 1 level 2 character",
  },
  {
    party: [8, 7, 6, 5],
    opponents: [25, 25, 25, 25],
    expectedThresholds: {
      Easy: 1_350,
      Medium: 2_750,
      Hard: 4_150,
      Deadly: 6_300,
    },
    description: "4 characters levels 8, 7, 6 & 5",
  },
  {
    party: [20, 20, 20, 20],
    opponents: [25, 25, 25, 25],
    expectedThresholds: {
      Easy: 11_200,
      Medium: 22_800,
      Hard: 34_000,
      Deadly: 50_800,
    },
    description: "4 level 20 characters",
  },
].forEach((test) => {
  Deno.test(`getPartyXPThresholds totals the XP thresholds for a party of ${test.description}`, () => {
    // Arrange
    const encounter = { party: test.party, opponents: test.opponents };

    // Act
    const result = new EncounterEvaluator(encounter).partyXpThresholds;

    // Assert
    assertEquals(result, test.expectedThresholds);
  });
});

[
  {
    party: [1],
    opponents: [25],
    expectedAdjustedXP: 37.5,
    description: "1 level 1 character Vs. 1 1/8 CR opponent",
  },
  {
    party: [1],
    opponents: [25, 25],
    expectedAdjustedXP: 100,
    description: "1 level 1 character Vs. 2 1/8 CR opponents",
  },
  {
    party: [1],
    opponents: [25, 25, 25],
    expectedAdjustedXP: 187.5,
    description: "1 level 1 character Vs. 3 1/8 CR opponents",
  },
  {
    party: [1, 1],
    opponents: [25],
    expectedAdjustedXP: 37.5,
    description: "2 level 1 characters Vs. 1 1/8 CR opponent",
  },
  {
    party: [1, 1],
    opponents: [25, 25],
    expectedAdjustedXP: 100,
    description: "2 level 1 characters Vs. 2 1/8 CR opponents",
  },
  {
    party: [1, 1],
    opponents: [25, 25, 25],
    expectedAdjustedXP: 187.5,
    description: "2 level 1 characters Vs. 3 1/8 CR opponents",
  },
  {
    party: [1, 1],
    opponents: [25, 25, 25, 25],
    expectedAdjustedXP: 250,
    description: "2 level 1 characters Vs. 4 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [25, 25, 25, 25],
    expectedAdjustedXP: 200,
    description: "4 level 1 characters Vs. 4 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [50, 50, 50, 50],
    expectedAdjustedXP: 400,
    description: "4 level 1 characters Vs. 4 1/4 CR opponents",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [100, 100, 100, 100],
    expectedAdjustedXP: 800,
    description: "4 level 1 characters Vs. 4 1/2 CR opponents",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [200, 200, 200, 200],
    expectedAdjustedXP: 1600,
    description: "4 level 1 characters Vs. 4 1 CR opponents",
  },
  {
    party: [1, 1, 1, 1, 1, 1],
    opponents: [25, 25, 25, 25, 25, 25],
    expectedAdjustedXP: 225,
    description: "6 level 1 characters Vs. 6 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1, 1, 1],
    opponents: [50, 50, 50, 50, 50, 50],
    expectedAdjustedXP: 450,
    description: "6 level 1 characters Vs. 6 1/4 CR opponents",
  },
].forEach((test) => {
  Deno.test(`getAdjustedXp returns the correct adjusted XP for a party of ${test.description}`, () => {
    // Arrange
    const encounter = { party: test.party, opponents: test.opponents };

    // Act
    const result = new EncounterEvaluator(encounter).adjustedXp;

    // Assert
    assertEquals(result, test.expectedAdjustedXP);
  });
});

[
  {
    party: [1],
    opponents: [25],
    expectedDifficulty: "Easy",
    description: "1 level 1 character Vs. 1 1/8 CR opponent",
  },
  {
    party: [1, 1],
    opponents: [25],
    expectedDifficulty: "Easy",
    description: "2 level 1 characters Vs. 1 1/8 CR opponent",
  },
  {
    party: [1, 1],
    opponents: [25, 25],
    expectedDifficulty: "Medium",
    description: "2 level 1 characters Vs. 2 1/8 CR opponents",
  },
  {
    party: [1, 1],
    opponents: [100],
    expectedDifficulty: "Hard",
    description: "2 level 1 characters Vs. 1 1/2 CR opponents",
  },
  {
    party: [1, 1],
    opponents: [200],
    expectedDifficulty: "Deadly",
    description: "2 level 1 characters Vs. 1 1 CR opponent",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [100],
    expectedDifficulty: "Easy",
    description: "4 level 1 characters Vs. 1 1/2 CR opponent",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [25, 25, 25, 25],
    expectedDifficulty: "Medium",
    description: "4 level 1 characters Vs. 4 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [25, 25, 25, 25, 25, 25],
    expectedDifficulty: "Hard",
    description: "4 level 1 characters Vs. 6 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1],
    opponents: [50, 50, 50, 50],
    expectedDifficulty: "Deadly",
    description: "4 level 1 characters Vs. 4 1/4 CR opponents",
  },
  {
    party: [1, 1, 1, 1, 1, 1],
    opponents: [25, 25, 25, 25, 25, 25],
    expectedDifficulty: "Easy",
    description: "6 level 1 characters Vs. 6 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1, 1, 1],
    opponents: [100, 50, 25, 25],
    expectedDifficulty: "Medium",
    description: "6 level 1 characters Vs. a 1/2, 1/4 & 2 1/8 CR opponents",
  },
  {
    party: [1, 1, 1, 1, 1, 1],
    opponents: [50, 50, 50, 50, 50, 50],
    expectedDifficulty: "Hard",
    description: "6 level 1 characters Vs. 6 1/4 CR opponents",
  },
  {
    party: [1, 1, 1, 1, 1, 1],
    opponents: [450, 200, 50, 50],
    expectedDifficulty: "Deadly",
    description: "6 level 1 characters Vs. a 3, 2, and 2 1/4 CR opponents",
  },
].forEach((test) => {
  Deno.test(`evaluateEncounterDifficulty correctly evaluates ${test.description}`, () => {
    // Arrange
    const encounter = { party: test.party, opponents: test.opponents };

    // Act
    const result = new EncounterEvaluator(encounter).difficulty;

    // Assert
    assertEquals(result, test.expectedDifficulty);
  });
});
