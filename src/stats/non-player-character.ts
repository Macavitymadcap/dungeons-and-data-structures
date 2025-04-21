import { Ability, ActionsArray, DialogueOption, Item, Roll } from "./model.ts";
import { StatBlock } from "./stat-block.ts";

export class NonPlayerCharacter extends StatBlock {
  occupation: string;
  attitude: string;
  dialogueOptions: DialogueOption[];
  inventory: Item[];
  
  constructor(
    name: string,
    abilities: Record<Ability, number>,
    armorClass: number,
    hitPoints: number,
    hitDice: Roll,
    occupation: string,
    attitude: string,
    dialogueOptions: DialogueOption[] = [],
    inventory: Item[] = [],
    actions: ActionsArray
  ) {
    super(
      name, 
      'Medium',
      abilities,
      armorClass,
      hitPoints,
      hitDice,
      { walk: 30 },
      actions
    );
    
    this.occupation = occupation;
    this.attitude = attitude;
    this.dialogueOptions = dialogueOptions;
    this.inventory = inventory;
  }
  
  interact(dialogueKey: string): string {
    const dialogue = this.dialogueOptions.find(d => d.key === dialogueKey);
    return dialogue ? dialogue.text : `The NPC doesn't respond to that.`;
  }
}