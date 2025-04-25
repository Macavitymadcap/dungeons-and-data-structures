export interface Encounter {
  party: number[];
  opponents: number[];
};

const DIFFICULTY = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
  DEADLY: "Deadly",
} as const;

export type Difficulty = typeof DIFFICULTY[keyof typeof DIFFICULTY];

export type Level =
  | 1
  | 2
  | 3
  | 4
  | 5
  | 6
  | 7
  | 8
  | 9
  | 10
  | 11
  | 12
  | 13
  | 14
  | 15
  | 16
  | 17
  | 18
  | 19
  | 20;

export type XpThresholds = {
  [key in Difficulty]: number;
};

export type XPThresholdsByLevel = {
  [key in Level]: XpThresholds;
};

export const XP_THRESHOLDS_BY_LEVEL: XPThresholdsByLevel = {
  1: { Easy: 25, Medium: 50, Hard: 75, Deadly: 100 },
  2: { Easy: 50, Medium: 100, Hard: 150, Deadly: 200 },
  3: { Easy: 75, Medium: 150, Hard: 225, Deadly: 400 },
  4: { Easy: 125, Medium: 250, Hard: 375, Deadly: 500 },
  5: { Easy: 250, Medium: 500, Hard: 750, Deadly: 1_100 },
  6: { Easy: 300, Medium: 600, Hard: 900, Deadly: 1_400 },
  7: { Easy: 350, Medium: 750, Hard: 1_100, Deadly: 1_700 },
  8: { Easy: 450, Medium: 900, Hard: 1_400, Deadly: 2_100 },
  9: { Easy: 550, Medium: 1_100, Hard: 1_600, Deadly: 2_400 },
  10: { Easy: 600, Medium: 1_200, Hard: 1_900, Deadly: 2_800 },
  11: { Easy: 800, Medium: 1_600, Hard: 2_400, Deadly: 3_600 },
  12: { Easy: 1_000, Medium: 2_000, Hard: 3_000, Deadly: 4_500 },
  13: { Easy: 1_100, Medium: 2_200, Hard: 3_400, Deadly: 5_100 },
  14: { Easy: 1_250, Medium: 2_500, Hard: 3_800, Deadly: 5_700 },
  15: { Easy: 1_400, Medium: 2_800, Hard: 4_300, Deadly: 6_400 },
  16: { Easy: 1_600, Medium: 3_200, Hard: 4_800, Deadly: 7_200 },
  17: { Easy: 2_000, Medium: 3_900, Hard: 5_900, Deadly: 8_800 },
  18: { Easy: 2_100, Medium: 4_200, Hard: 6_300, Deadly: 9_500 },
  19: { Easy: 2_400, Medium: 4_900, Hard: 7_300, Deadly: 10_900 },
  20: { Easy: 2_800, Medium: 5_700, Hard: 8_500, Deadly: 12_700 },
} as const;

export interface EncounterMultiplier {
  numberOfMonsters: number;
  fewerThanThree: number;
  threeToFive: number;
  sixOrMore: number;
};

export const ENCOUNTER_MULTIPLIERS: EncounterMultiplier[] = [
  { numberOfMonsters: 1, fewerThanThree: 1.5, threeToFive: 1, sixOrMore: .5 },
  { numberOfMonsters: 2, fewerThanThree: 2, threeToFive: 1.5, sixOrMore: 1 },
  { numberOfMonsters: 3, fewerThanThree: 2.5, threeToFive: 2, sixOrMore: 1.5 },
  { numberOfMonsters: 7, fewerThanThree: 3.5, threeToFive: 2.5, sixOrMore: 2 },
  { numberOfMonsters: 11, fewerThanThree: 4.5, threeToFive: 3, sixOrMore: 2.5 },
  { numberOfMonsters: 15, fewerThanThree: 5.5, threeToFive: 3.5, sixOrMore: 3 },
] as const;

export interface Evaluation {
  party: number[];
  opponents: number[];
  actualXp: number;
  adjustedXp: number;
  partyXpThresholds: XpThresholds;
  multiplier: EncounterMultiplier;
  difficulty: Difficulty;
}
