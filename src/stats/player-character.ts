import type { Item, Ability, Roll, ActionsArray, CharacterClass, Race, Size } from "./model.ts";
import { StatBlock } from "./stat-block.ts";

export class PlayerCharacter extends StatBlock {
  race: string;
  characterClass: string;
  inventory: Item[];

  constructor(
    name: string,
    size: Size,
    race: Race,
    characterClass: CharacterClass,
    abilities: Record<Ability, number>,
    armorClass: number,
    hitPoints: number,
    hitDice: Roll,
    inventory: Item[] = [],
    actions: ActionsArray,
  ) {
    super(
      name, 
      size,
      abilities,
      armorClass,
      hitPoints,
      hitDice,
      { walk: 30 },
      actions
    );

    this.inventory = inventory;
    this.race = race;
    this.characterClass = characterClass;
  }
}