import {
  Difficulty,
  Encounter,
  ENCOUNTER_MULTIPLIERS,
  EncounterMultiplier,
  Evaluation,
  Level,
  XP_THRESHOLDS_BY_LEVEL,
  XpThresholds,
} from "./encounter-evaluator.model.ts";

export class EncounterEvaluator implements Encounter, Evaluation {
  party: number[];
  opponents: number[];
  actualXp: number;
  adjustedXp: number;
  partyXpThresholds: XpThresholds;
  multiplier: EncounterMultiplier;
  difficulty: Difficulty;

  constructor(encounter: Encounter) {
    this.party = encounter.party;
    this.opponents = encounter.opponents;
    this.actualXp = this.getActualXP();
    this.partyXpThresholds = this.getPartyXPThresholds();
    this.multiplier = this.getMultiplier();
    this.adjustedXp = this.getAdjustedXP();
    this.difficulty = this.getDifficulty();
  }

  private getActualXP(): number {
    return this.opponents.reduce((acc, level) => acc + level, 0);
  }

  private getCharacterXPThresholds(level: Level): XpThresholds {
    return XP_THRESHOLDS_BY_LEVEL[level];
  }

  private getPartyXPThresholds(): XpThresholds {
    const initialThresholds: XpThresholds = {
      Easy: 0,
      Medium: 0,
      Hard: 0,
      Deadly: 0,
    };

    const party = this.party.map((level) =>
      this.getCharacterXPThresholds(level as Level)
    );

    return party.reduce((acc, level) => {
      Object.keys(level).forEach((key) => {
        acc[key as Difficulty] += level[key as Difficulty];
      });

      return acc;
    }, initialThresholds);
  }

  private getMultiplier(): EncounterMultiplier {
    const numberOfOpponents = this.opponents.length;

    if (numberOfOpponents >= 15) {
      return ENCOUNTER_MULTIPLIERS[5];
    }

    return ENCOUNTER_MULTIPLIERS.find((multiplier, index) => {
      return numberOfOpponents >= multiplier.numberOfMonsters &&
        numberOfOpponents < ENCOUNTER_MULTIPLIERS[index + 1].numberOfMonsters;
    })!;
  }

  private getAdjustedXP(): number {
    const partySize = this.party.length;

    if (partySize < 3) {
      return this.actualXp * this.multiplier.fewerThanThree;
    }

    if (partySize >= 3 && partySize <= 5) {
      return this.actualXp * this.multiplier.threeToFive;
    }

    return this.actualXp * this.multiplier.sixOrMore;
  }

  private getDifficulty(): Difficulty {
    if (this.adjustedXp >= this.partyXpThresholds.Deadly) {
      return "Deadly";
    } else if (this.adjustedXp >= this.partyXpThresholds.Hard) {
      return "Hard";
    } else if (this.adjustedXp >= this.partyXpThresholds.Medium) {
      return "Medium";
    } else {
      return "Easy";
    }
  }

  static evaluate(encounter: Encounter): Evaluation {
    return new EncounterEvaluator(encounter);
  }
}
