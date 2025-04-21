import { Ability, ActionsArray, Roll, Size, Speed } from "./model.ts";
import { StatBlock } from "./stat-block.ts";

export class Monster extends StatBlock {
    type: string;
    challengeRating: number;
    legendaryActions?: ActionsArray;
    
    constructor(
      name: string,
      size: Size,
      type: string,
      abilities: Record<Ability, number>,
      armorClass: number,
      hitPoints: number,
      hitDice: Roll,
      speed: Speed,
      challengeRating: number,
      actions: ActionsArray
    ) {
      super(name, size, abilities, armorClass, hitPoints, hitDice, speed, actions);
      
      this.type = type;
      this.challengeRating = challengeRating;
      this.actions = actions;
    }
    
    performAction(actionName: string, target: StatBlock): boolean {
      const action = this.actions.find(a => a.name === actionName);
      if (!action) return false;
      
      console.log(`${this.name} performs ${actionName} against ${target.name}`);
      return true;
    }
  }
