## Abstract Stats: The Foundation of RPG Entities

In RPGs like Dungeons & Dragons, diverse entities such as players, monsters, and NPCs share fundamental attributes and capabilities. This common structure makes the stat block a strong candidate for an abstract base class in object-oriented design.

### The Unified Stat Block

At their core, all entities in most RPG systems possess:

- **Attributes**: Basic characteristics like strength and intelligence
- **Derived Stats**: Values calculated from attributes (like skill bonuses)
- **Combat Statistics**: Hit points, armour class, and similar values
- **Abilities**: Special capabilities and actions

By creating an abstract base class, we establish a common interface that all game entities can implement while allowing for specialised subclasses.

**Click to view the code**

```typescript
// Basic types for our RPG system
type Size = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
type Ability = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";
type DamageType = "bludgeoning" | "piercing" | "slashing" | "fire" | "cold" | "lightning" | "acid" | "poison" | "necrotic" | "radiant" | "force" | "psychic";
type Condition = "blinded" | "charmed" | "deafened" | "frightened" | "grappled" | "incapacitated" | "paralyzed" | "petrified" | "poisoned" | "prone" | "restrained" | "stunned" | "unconscious";

// Base abstract class for all entities with stats
abstract class StatBlock {
  name: string;
  size: Size;
  armorClass: number;
  hitPoints: number;
  maxHitPoints: number;
  temporaryHitPoints: number = 0;
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  abilities: Record<Ability, number>;
  savingThrowBonuses: Partial<Record<Ability, number>> = {};
  skillBonuses: Record<string, number> = {};
  damageResistances: DamageType[] = [];
  damageImmunities: DamageType[] = [];
  conditionImmunities: Condition[] = [];
  damageVulnerabilities: DamageType[] = [];
  languages: string[] = [];

constructor(
    name: string,
    size: Size,
    abilities: Record<Ability, number>,
    armorClass: number,
    hitPoints: number,
    speed: { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number; }
  ) {
    this.name = name;
    this.size = size;
    this.abilities = abilities;
    this.armorClass = armorClass;
    this.hitPoints = hitPoints;
    this.maxHitPoints = hitPoints;
    this.speed = speed;
  }

// Core methods available to all entities

getAbilityModifier(ability: Ability): number {
    return Math.floor((this.abilities[ability] - 10) / 2);
  }

rollAbilityCheck(ability: Ability): number {
    const modifier = this.getAbilityModifier(ability);
    const roll = Math.floor(Math.random() * 20) + 1; // d20 roll
    return roll + modifier;
  }

rollSavingThrow(ability: Ability): { total: number; success: boolean; } {
    let modifier = this.getAbilityModifier(ability);

// Add proficiency if this entity has saving throw proficiency
    if (ability in this.savingThrowBonuses) {
      modifier += this.savingThrowBonuses[ability] || 0;
    }

const roll = Math.floor(Math.random() * 20) + 1; // d20 roll
    const total = roll + modifier;

// Determine success (DC would be passed from calling context)
    const dc = 15; // Example DC, would typically be passed in
    const success = total >= dc;

return { total, success };
  }

rollSkillCheck(skill: string, ability: Ability): number {
    let modifier = this.getAbilityModifier(ability);

// Add skill bonus if applicable
    if (skill in this.skillBonuses) {
      modifier += this.skillBonuses[skill];
    }

const roll = Math.floor(Math.random() * 20) + 1; // d20 roll
    return roll + modifier;
  }

takeDamage(amount: number, type: DamageType): number {
    // Apply damage resistances/immunities/vulnerabilities
    if (this.damageImmunities.includes(type)) {
      return 0; // No damage taken
    } else if (this.damageResistances.includes(type)) {
      amount = Math.floor(amount / 2); // Half damage
    } else if (this.damageVulnerabilities.includes(type)) {
      amount = amount * 2; // Double damage
    }

// Apply damage to temporary HP first
    if (this.temporaryHitPoints > 0) {
      if (amount <= this.temporaryHitPoints) {
        this.temporaryHitPoints -= amount;
        return amount; // All damage absorbed by temporary HP
      } else {
        amount -= this.temporaryHitPoints;
        const damageTaken = this.temporaryHitPoints;
        this.temporaryHitPoints = 0;

// Remaining damage affects actual HP
        this.hitPoints = Math.max(0, this.hitPoints - amount);
        return damageTaken + amount;
      }
    } else {
      // Direct damage to HP
      const prevHP = this.hitPoints;
      this.hitPoints = Math.max(0, this.hitPoints - amount);
      return prevHP - this.hitPoints; // Return actual damage dealt
    }
  }

heal(amount: number): number {
    if (this.hitPoints === 0) return 0; // Can't heal if dead/unconscious

const prevHP = this.hitPoints;
    this.hitPoints = Math.min(this.maxHitPoints, this.hitPoints + amount);
    return this.hitPoints - prevHP; // Return actual healing done
  }

addTemporaryHitPoints(amount: number): void {
    // Temporary HP doesn't stack - take the higher value
    this.temporaryHitPoints = Math.max(this.temporaryHitPoints, amount);
  }

isAlive(): boolean {
    return this.hitPoints > 0;
  }
}

```

This abstract `StatBlock` class serves as the foundation for all entities in our RPG system. It implements the core mechanics shared across different entity types, providing a consistent interface for game systems like combat and skill challenges.

### Specialized Entity Types

From this abstract base, we can derive specialised classes for different entity types:

**Click to view the code**

```typescript
// Monster entity type
class Monster extends StatBlock {
  type: string; // "humanoid", "beast", "fiend", etc.
  challengeRating: number;
  actions: Action[];
  legendaryActions?: Action[];

constructor(
    name: string,
    size: Size,
    type: string,
    abilities: Record<Ability, number>,
    armorClass: number,
    hitPoints: number,
    speed: { walk?: number; fly?: number; swim?: number; climb?: number; burrow?: number; },
    challengeRating: number,
    actions: Action[]
  ) {
    super(name, size, abilities, armorClass, hitPoints, speed);

this.type = type;
    this.challengeRating = challengeRating;
    this.actions = actions;
  }

// Monster-specific method for taking an action
  performAction(actionName: string, target: StatBlock): boolean {
    const action = this.actions.find(a => a.name === actionName);
    if (!action) return false;

// Implementation would depend on action type
    console.log(`${this.name} performs ${actionName} against ${target.name}`);
    return true;
  }
}

// NPC entity type
class NonPlayerCharacter extends StatBlock {
  occupation: string;
  attitude: string; // "friendly", "neutral", "hostile", etc.
  dialogueOptions: DialogueOption[];
  inventory: Item[];

constructor(
    name: string,
    abilities: Record<Ability, number>,
    armorClass: number,
    hitPoints: number,
    occupation: string,
    attitude: string,
    dialogueOptions: DialogueOption[] = [],
    inventory: Item[] = []
  ) {
    super(
      name,
      "Medium", // Most NPCs are medium-sized humanoids
      abilities,
      armorClass,
      hitPoints,
      { walk: 30 } // Standard walking speed
    );

this.occupation = occupation;
    this.attitude = attitude;
    this.dialogueOptions = dialogueOptions;
    this.inventory = inventory;
  }

// NPC-specific method for dialogue interaction
  interact(dialogueKey: string): string {
    const dialogue = this.dialogueOptions.find(d => d.key === dialogueKey);
    return dialogue ? dialogue.text : "The NPC doesn't respond to that.";
  }
}

```

### Benefits of Abstract Stat Blocks

This approach offers several advantages:

1. **Unified Game Systems**: Combat, skill checks, and other mechanics can operate on any entity through the common interface
2. **Code Reuse**: Core functionality is implemented once in the base class
3. **Polymorphism**: Systems can accept any StatBlock without knowing its specific type
4. **Consistency**: All entities behave predictably for basic operations
5. **Extensibility**: New entity types can be added without modifying existing code

These principles align with object-oriented design best practices, particularly the Liskov Substitution Principle, which states that objects of a superclass should be replaceable with objects of a subclass without affecting the functionality of the program.
