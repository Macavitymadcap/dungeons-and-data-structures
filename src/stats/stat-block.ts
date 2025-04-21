import { Ability, ActionsArray, Condition, DamageType, Roll, Size, Speed, Trait } from "./model.ts";

export abstract class StatBlock {
  name: string;
  size: Size;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  hitDice: Roll;
  temporaryHitPoints: number = 0;
  speed: Speed;
  abilities: Record<Ability, number>;
  savingThrowBonuses: Partial<Record<Ability, number>> = {};
  skillBonuses: Record<string, number> = {};
  damageResistances: DamageType[] = [];
  damageImmunities: DamageType[] = [];
  conditionImmunities: Condition[] = [];
  damageVulnerabilities: DamageType[] = [];
  languages: string[] = [];
  traits: Trait[] = [];
  actions: ActionsArray;
  
  constructor(
    name: string, 
    size: Size, 
    abilities: Record<Ability, number>,
    armorClass: number,
    hitPoints: number,
    hitDice: Roll,
    speed: Speed,
    actions: ActionsArray
  ) {
    this.name = name;
    this.size = size;
    this.abilities = abilities;
    this.armorClass = armorClass;
    this.hitPoints = hitPoints;
    this.maxHitPoints = hitPoints;
    this.hitDice = hitDice;
    this.speed = speed;
    this.actions = actions
  }
  
  getAbilityModifier(ability: Ability): number {
    return Math.floor((this.abilities[ability] - 10) / 2);
  }
  
  rollAbilityCheck(ability: Ability): number {
    const modifier = this.getAbilityModifier(ability);
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + modifier;
  }
  
  rollSavingThrow(ability: Ability, ): number {
    let modifier = this.getAbilityModifier(ability);
    
    if (ability in this.savingThrowBonuses) {
      modifier += this.savingThrowBonuses[ability] || 0;
    }
    
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + modifier;
  }
  
  rollSkillCheck(skill: string, ability: Ability): number {
    let modifier = this.getAbilityModifier(ability);
    
    if (skill in this.skillBonuses) {
      modifier += this.skillBonuses[skill];
    }
    
    const roll = Math.floor(Math.random() * 20) + 1;
    return roll + modifier;
  }

  damageTemporaryHitPoints(amount: number): number {
      if (amount <= this.temporaryHitPoints) {
        this.temporaryHitPoints -= amount;
        return amount; 
      } else {
        amount -= this.temporaryHitPoints;
        const damageTaken = this.temporaryHitPoints;
        this.temporaryHitPoints = 0;
        
        this.hitPoints = Math.max(0, this.hitPoints - amount);
        return damageTaken + amount;
      }
  }
  
  takeDamage(amount: number, type: DamageType): number {
    if (this.damageImmunities.includes(type)) {
      return 0;
    } else if (this.damageResistances.includes(type)) {
      amount = Math.floor(amount / 2);
    } else if (this.damageVulnerabilities.includes(type)) {
      amount = amount * 2;
    }
    
    if (this.temporaryHitPoints > 0) {
      return this.damageTemporaryHitPoints(amount)
    } else {
      const prevHP = this.hitPoints;
      this.hitPoints = Math.max(0, this.hitPoints - amount);
      return prevHP - this.hitPoints;
    }
  }
  
  heal(amount: number): number {
    if (this.hitPoints === 0) return 0;
    
    const prevHP = this.hitPoints;
    this.hitPoints = Math.min(this.maxHitPoints, this.hitPoints + amount);
    return this.hitPoints - prevHP; 
  }
  
  addTemporaryHitPoints(amount: number): void {
    this.temporaryHitPoints = Math.max(this.temporaryHitPoints, amount);
  }
  
  isAlive(): boolean {
    return this.hitPoints > 0;
  }
}