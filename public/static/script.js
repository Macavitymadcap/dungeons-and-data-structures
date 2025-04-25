(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => {
    __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
    return value;
  };

  // src/algorithms/encounter-evaluator.model.ts
  var XP_THRESHOLDS_BY_LEVEL = {
    1: { Easy: 25, Medium: 50, Hard: 75, Deadly: 100 },
    2: { Easy: 50, Medium: 100, Hard: 150, Deadly: 200 },
    3: { Easy: 75, Medium: 150, Hard: 225, Deadly: 400 },
    4: { Easy: 125, Medium: 250, Hard: 375, Deadly: 500 },
    5: { Easy: 250, Medium: 500, Hard: 750, Deadly: 1100 },
    6: { Easy: 300, Medium: 600, Hard: 900, Deadly: 1400 },
    7: { Easy: 350, Medium: 750, Hard: 1100, Deadly: 1700 },
    8: { Easy: 450, Medium: 900, Hard: 1400, Deadly: 2100 },
    9: { Easy: 550, Medium: 1100, Hard: 1600, Deadly: 2400 },
    10: { Easy: 600, Medium: 1200, Hard: 1900, Deadly: 2800 },
    11: { Easy: 800, Medium: 1600, Hard: 2400, Deadly: 3600 },
    12: { Easy: 1e3, Medium: 2e3, Hard: 3e3, Deadly: 4500 },
    13: { Easy: 1100, Medium: 2200, Hard: 3400, Deadly: 5100 },
    14: { Easy: 1250, Medium: 2500, Hard: 3800, Deadly: 5700 },
    15: { Easy: 1400, Medium: 2800, Hard: 4300, Deadly: 6400 },
    16: { Easy: 1600, Medium: 3200, Hard: 4800, Deadly: 7200 },
    17: { Easy: 2e3, Medium: 3900, Hard: 5900, Deadly: 8800 },
    18: { Easy: 2100, Medium: 4200, Hard: 6300, Deadly: 9500 },
    19: { Easy: 2400, Medium: 4900, Hard: 7300, Deadly: 10900 },
    20: { Easy: 2800, Medium: 5700, Hard: 8500, Deadly: 12700 }
  };
  var ENCOUNTER_MULTIPLIERS = [
    { numberOfMonsters: 1, fewerThanThree: 1.5, threeToFive: 1, sixOrMore: 0.5 },
    { numberOfMonsters: 2, fewerThanThree: 2, threeToFive: 1.5, sixOrMore: 1 },
    { numberOfMonsters: 3, fewerThanThree: 2.5, threeToFive: 2, sixOrMore: 1.5 },
    { numberOfMonsters: 7, fewerThanThree: 3.5, threeToFive: 2.5, sixOrMore: 2 },
    { numberOfMonsters: 11, fewerThanThree: 4.5, threeToFive: 3, sixOrMore: 2.5 },
    { numberOfMonsters: 15, fewerThanThree: 5.5, threeToFive: 3.5, sixOrMore: 3 }
  ];

  // src/algorithms/encounter-evaluator.ts
  var EncounterEvaluator = class _EncounterEvaluator {
    constructor(encounter) {
      __publicField(this, "party");
      __publicField(this, "opponents");
      __publicField(this, "actualXp");
      __publicField(this, "adjustedXp");
      __publicField(this, "partyXpThresholds");
      __publicField(this, "multiplier");
      __publicField(this, "difficulty");
      this.party = encounter.party;
      this.opponents = encounter.opponents;
      this.actualXp = this.getActualXP();
      this.partyXpThresholds = this.getPartyXPThresholds();
      this.multiplier = this.getMultiplier();
      this.adjustedXp = this.getAdjustedXP();
      this.difficulty = this.getDifficulty();
    }
    getActualXP() {
      return this.opponents.reduce((acc, level) => acc + level, 0);
    }
    getCharacterXPThresholds(level) {
      return XP_THRESHOLDS_BY_LEVEL[level];
    }
    getPartyXPThresholds() {
      const initialThresholds = {
        Easy: 0,
        Medium: 0,
        Hard: 0,
        Deadly: 0
      };
      const party = this.party.map(
        (level) => this.getCharacterXPThresholds(level)
      );
      return party.reduce((acc, level) => {
        Object.keys(level).forEach((key) => {
          acc[key] += level[key];
        });
        return acc;
      }, initialThresholds);
    }
    getMultiplier() {
      const numberOfOpponents = this.opponents.length;
      if (numberOfOpponents >= 15) {
        return ENCOUNTER_MULTIPLIERS[5];
      }
      return ENCOUNTER_MULTIPLIERS.find((multiplier, index) => {
        return numberOfOpponents >= multiplier.numberOfMonsters && numberOfOpponents < ENCOUNTER_MULTIPLIERS[index + 1].numberOfMonsters;
      });
    }
    getAdjustedXP() {
      const partySize = this.party.length;
      if (partySize < 3) {
        return this.actualXp * this.multiplier.fewerThanThree;
      }
      if (partySize >= 3 && partySize <= 5) {
        return this.actualXp * this.multiplier.threeToFive;
      }
      return this.actualXp * this.multiplier.sixOrMore;
    }
    getDifficulty() {
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
    static evaluate(encounter) {
      return new _EncounterEvaluator(encounter);
    }
  };
})();
//# sourceMappingURL=script.js.map
