## Character Composition & Inheritance

While the abstract StatBlock provides a solid foundation, player characters in RPGs are more complex because they combine races, classes, backgrounds, and equipment. This complexity is best handled through a combination of inheritance and composition.

### Character Class Hierarchy

In our system, the PlayerCharacter class extends StatBlock and adds character-specific components:

**Click to view the full code**

```typescript
interface Race {
  name: string;
  size: Size;
  speed: number;
  abilityScoreIncreases: Partial<Record<Ability, number>>;
  traits: Trait[];
  languages: string[];
}

interface CharacterClass {
  name: string;
  hitDieSize: number;
  primaryAbility: Ability;
  savingThrowProficiencies: Ability[];
  armorProficiencies: string[];
  weaponProficiencies: string[];
  skillProficiencyChoices: string[];
  startingEquipment: Item[];
  features: Record<number, Feature[]>; // Keyed by level
}

interface Background {
  name: string;
  skillProficiencies: string[];
  toolProficiencies: string[];
  languages: number; // Number of languages to choose
  equipment: Item[];
  feature: Feature;
  personalityTraits: string[];
  ideals: string[];
  bonds: string[];
  flaws: string[];
}

// Player Character class
class PlayerCharacter extends StatBlock {
  race: Race;
  characterClass: CharacterClass;
  level: number;
  background: Background;
  proficiencyBonus: number;
  experience: number;
  alignment: string;
  features: Feature[] = [];
  inventory: Item[] = [];
  equippedItems: Record<string, Item> = {};
  spellbook?: Spellbook;

constructor(
    name: string,
    race: Race,
    characterClass: CharacterClass,
    level: number,
    background: Background,
    baseAbilities: Record<Ability, number>,
    alignment: string
  ) {
    // Calculate base stats
    const raceAbilityBonuses = race.abilityScoreIncreases;
    const abilities: Record<Ability, number> = { ...baseAbilities };

// Apply racial ability score increases
    for (const ability in raceAbilityBonuses) {
      const typedAbility = ability as Ability;
      abilities[typedAbility] += raceAbilityBonuses[typedAbility] || 0;
    }

// Calculate hit points
    const conModifier = Math.floor((abilities.constitution - 10) / 2);
    const firstLevelHP = characterClass.hitDieSize + conModifier;
    const additionalLevelsHP = level > 1
      ? (level - 1) * (Math.floor(characterClass.hitDieSize / 2) + 1 + conModifier)
      : 0;
    const totalHP = firstLevelHP + additionalLevelsHP;

// Calculate armor class (simplified)
    const dexModifier = Math.floor((abilities.dexterity - 10) / 2);
    const baseAC = 10 + dexModifier;

// Call the StatBlock constructor
    super(
      name,
      race.size,
      abilities,
      baseAC,
      totalHP,
      { walk: race.speed }
    );

this.race = race;
    this.characterClass = characterClass;
    this.level = level;
    this.background = background;
    this.alignment = alignment;
    this.experience = 0;

// Calculate proficiency bonus
    this.proficiencyBonus = Math.floor((level - 1) / 4) + 2;

// Apply features, proficiencies, etc.
    this.initializeCharacter();
  }

private initializeCharacter(): void {
    // Apply saving throw proficiencies
    for (const ability of this.characterClass.savingThrowProficiencies) {
      this.savingThrowBonuses[ability] = this.proficiencyBonus;
    }

// Apply skill proficiencies (simplified - would normally involve choices)
    for (const skill of this.background.skillProficiencies) {
      this.skillBonuses[skill] = this.proficiencyBonus;
    }

// Apply racial traits
    for (const trait of this.race.traits) {
      this.features.push(trait);
      // Apply trait effects (resistance, skills, etc.)
      this.applyTraitEffects(trait);
    }

// Apply class features for current level
    for (let i = 1; i <= this.level; i++) {
      const levelFeatures = this.characterClass.features[i] || [];
      for (const feature of levelFeatures) {
        this.features.push(feature);
        // Apply feature effects
        this.applyFeatureEffects(feature);
      }
    }

// Apply starting equipment (simplified)
    for (const item of this.characterClass.startingEquipment) {
      this.inventory.push(item);
    }

for (const item of this.background.equipment) {
      this.inventory.push(item);
    }

// Initialize spellbook for spellcasting classes
    if (this.hasSpellcasting()) {
      this.spellbook = new Spellbook(this);
    }
  }

private applyTraitEffects(trait: Trait): void {
    // Implementation depends on trait type
    switch (trait.type) {
      case "resistance":
        if (trait.damageType) {
          this.damageResistances.push(trait.damageType);
        }
        break;
      case "skill":
        if (trait.skill) {
          this.skillBonuses[trait.skill] = this.proficiencyBonus;
        }
        break;
      // Additional trait types...
    }
  }

private applyFeatureEffects(feature: Feature): void {
    // Implementation depends on feature type
    switch (feature.type) {
      case "armor_proficiency":
        // Add armor proficiency
        break;
      case "extra_attack":
        // Add extra attack capability
        break;
      // Additional feature types...
    }
  }

hasSpellcasting(): boolean {
    // Check if class has spellcasting or if any feature grants spellcasting
    return this.characterClass.name === "Wizard" ||
            this.characterClass.name === "Cleric" ||
            this.characterClass.name === "Bard" ||
            this.features.some(f => f.grantsSpellcasting);
  }

gainExperience(amount: number): boolean {
    this.experience += amount;

// Check if level up is available
    const experienceThresholds = [
      0, 300, 900, 2700, 6500, 14000, 23000, 34000, 48000,
      64000, 85000, 100000, 120000, 140000, 165000, 195000,
      225000, 265000, 305000, 355000
    ];

if (this.level < 20 && this.experience >= experienceThresholds[this.level]) {
      return true; // Level up available
    }

return false;
  }

levelUp(): void {
    if (this.level >= 20) return; // Already max level

this.level++;

// Update proficiency bonus
    this.proficiencyBonus = Math.floor((this.level - 1) / 4) + 2;

// Add hit points
    const conModifier = this.getAbilityModifier("constitution");
    const hitDieAverage = Math.floor(this.characterClass.hitDieSize / 2) + 1;
    this.maxHitPoints += hitDieAverage + conModifier;
    this.hitPoints += hitDieAverage + conModifier;

// Add new class features
    const newFeatures = this.characterClass.features[this.level] || [];
    for (const feature of newFeatures) {
      this.features.push(feature);
      this.applyFeatureEffects(feature);
    }

// Update saving throws and skill proficiencies
    this.updateProficiencies();

// Update spellbook if applicable
    if (this.spellbook) {
      this.spellbook.updateForLevel(this.level);
    }
  }

private updateProficiencies(): void {
    // Update saving throw bonuses
    for (const ability of this.characterClass.savingThrowProficiencies) {
      this.savingThrowBonuses[ability] = this.proficiencyBonus;
    }

// Update skill bonuses
    for (const skill in this.skillBonuses) {
      if (this.skillBonuses[skill] > 0) { // If proficient
        this.skillBonuses[skill] = this.proficiencyBonus;
      }
    }
  }

equipItem(item: Item): boolean {
    if (!this.inventory.includes(item)) {
      return false; // Can't equip what you don't have
    }

// Check if you can equip this item (proficiency, etc.)
    // ...

// Equip the item
    const slot = item.equipSlot;
    if (slot) {
      // Unequip any item already in that slot
      if (this.equippedItems[slot]) {
        this.unequipItem(slot);
      }

this.equippedItems[slot] = item;

// Apply item effects (AC changes, etc.)
      // ...

return true;
    }

return false;
  }

unequipItem(slot: string): Item | null {
    const item = this.equippedItems[slot];
    if (item) {
      delete this.equippedItems[slot];

// Remove item effects
      // ...

return item;
    }

return null;
  }
}

```

This PlayerCharacter class demonstrates how composition and inheritance can work together:

- **Inheritance** is used for the base StatBlock functionality
- **Composition** incorporates race, class, background, and equipment

### Component-Based Design

For a more flexible system, we could refactor the design to use a component-based approach, where each capability is a separate component that can be attached to any entity:

**Click to view the full code**

```typescript
// Component interface
interface Component {
  owner: StatBlock;
  initialize(): void;
  update(deltaTime: number): void;
}

// Enhanced StatBlock with component support
class EntityWithComponents extends StatBlock {
  private components: Map<string, Component> = new Map();

addComponent(id: string, component: Component): void {
    component.owner = this;
    component.initialize();
    this.components.set(id, component);
  }

getComponent(id: string): Component | undefined {
    return this.components.get(id);
  }

hasComponent(id: string): boolean {
    return this.components.has(id);
  }

removeComponent(id: string): boolean {
    return this.components.delete(id);
  }

update(deltaTime: number): void {
    for (const component of this.components.values()) {
      component.update(deltaTime);
    }
  }
}

// Example component: Spellcasting
class SpellcastingComponent implements Component {
  owner!: StatBlock;
  spellcastingAbility: Ability;
  maxSpellLevel: number;
  knownSpells: Spell[] = [];
  spellSlots: Record<number, number> = {}; // Level -> count

constructor(spellcastingAbility: Ability, maxSpellLevel: number) {
    this.spellcastingAbility = spellcastingAbility;
    this.maxSpellLevel = maxSpellLevel;
  }

initialize(): void {
    // Set up spell slots based on class/level
    // ...
  }

update(deltaTime: number): void {
    // Handle regeneration of spell slots, etc.
    // ...
  }

getSpellSaveDC(): number {
    const abilityModifier = this.owner.getAbilityModifier(this.spellcastingAbility);

// Assuming owner is a player character with proficiency bonus
    let profBonus = 0;
    if ('proficiencyBonus' in this.owner) {
      profBonus = (this.owner as unknown as PlayerCharacter).proficiencyBonus;
    }

return 8 + abilityModifier + profBonus;
  }

getSpellAttackBonus(): number {
    const abilityModifier = this.owner.getAbilityModifier(this.spellcastingAbility);

// Assuming owner is a player character with proficiency bonus
    let profBonus = 0;
    if ('proficiencyBonus' in this.owner) {
      profBonus = (this.owner as unknown as PlayerCharacter).proficiencyBonus;
    }

return abilityModifier + profBonus;
  }

castSpell(spell: Spell, level: number, target: StatBlock): boolean {
    // Check if we have an appropriate spell slot
    if (this.spellSlots[level] <= 0) {
      return false;
    }

// Consume spell slot
    this.spellSlots[level]--;

// Execute spell effect
    spell.cast(this.owner, target, level, this.getSpellSaveDC(), this.getSpellAttackBonus());

return true;
  }
}

// Example component: Weapon Proficiency
class WeaponProficiencyComponent implements Component {
  owner!: StatBlock;
  proficientWeaponTypes: string[];

constructor(weaponTypes: string[]) {
    this.proficientWeaponTypes = weaponTypes;
  }

initialize(): void {
    // No initialization needed
  }

update(deltaTime: number): void {
    // No update needed, this is a passive component
  }

isProficientWith(weapon: Weapon): boolean {
    return this.proficientWeaponTypes.includes(weapon.type);
  }

getAttackBonus(weapon: Weapon): number {
    // Determine which ability to use
    let abilityModifier: number;
    if (weapon.hasProperty("finesse")) {
      // Use the better of STR or DEX
      const strMod = this.owner.getAbilityModifier("strength");
      const dexMod = this.owner.getAbilityModifier("dexterity");
      abilityModifier = Math.max(strMod, dexMod);
    } else if (weapon.hasProperty("ranged")) {
      abilityModifier = this.owner.getAbilityModifier("dexterity");
    } else {
      abilityModifier = this.owner.getAbilityModifier("strength");
    }

// Add proficiency if proficient
    let profBonus = 0;
    if (this.isProficientWith(weapon) && 'proficiencyBonus' in this.owner) {
      profBonus = (this.owner as unknown as PlayerCharacter).proficiencyBonus;
    }

return abilityModifier + profBonus;
  }

getDamageBonus(weapon: Weapon): number {
    // Similar to attack bonus, but without proficiency
    if (weapon.hasProperty("finesse")) {
      const strMod = this.owner.getAbilityModifier("strength");
      const dexMod = this.owner.getAbilityModifier("dexterity");
      return Math.max(strMod, dexMod);
    } else if (weapon.hasProperty("ranged")) {
      return this.owner.getAbilityModifier("dexterity");
    } else {
      return this.owner.getAbilityModifier("strength");
    }
  }
}

```

This component-based approach provides greater flexibility than inheritance alone:

- Components can be added or removed dynamically
- Entities can have a customised set of capabilities
- Composition avoids the "diamond problem" of multiple inheritance
- New functionality can be added without modifying existing classes

The entity-component pattern is widely used in modern game development for these reasons. It creates a more modular system where capabilities can be mixed and matched to create diverse entity types without multiplying class hierarchies.

### Factory Method Pattern for Character Creation

To streamline character creation, we can implement a factory pattern:

**Click to view the full code**

```typescript
class CharacterFactory {
  static createFighter(
    name: string,
    race: Race,
    level: number = 1,
    background: Background,
    abilities: Record<Ability, number>,
    fightingStyle: string
  ): PlayerCharacter {
    // Create base character
    const fighter = new PlayerCharacter(
      name,
      race,
      this.getFighterClass(fightingStyle),
      level,
      background,
      abilities,
      "Lawful Neutral" // Default alignment
    );

// Add fighter-specific components
    fighter.addComponent("weaponProficiency", new WeaponProficiencyComponent([
      "simple", "martial"
    ]));

// Add specific equipment based on fighting style
    switch (fightingStyle) {
      case "two-handed":
        const greatsword = ItemFactory.createWeapon("greatsword");
        fighter.inventory.push(greatsword);
        fighter.equipItem(greatsword);
        break;
      case "dueling":
        const longsword = ItemFactory.createWeapon("longsword");
        const shield = ItemFactory.createArmor("shield");
        fighter.inventory.push(longsword, shield);
        fighter.equipItem(longsword);
        fighter.equipItem(shield);
        break;
      // Additional fighting styles...
    }

return fighter;
  }

static createWizard(
    name: string,
    race: Race,
    level: number = 1,
    background: Background,
    abilities: Record<Ability, number>,
    specialization: string
  ): PlayerCharacter {
    // Create base character
    const wizard = new PlayerCharacter(
      name,
      race,
      this.getWizardClass(specialization),
      level,
      background,
      abilities,
      "Neutral" // Default alignment
    );

// Add wizard-specific components
    wizard.addComponent("spellcasting", new SpellcastingComponent(
      "intelligence",
      Math.ceil(level / 2)
    ));

// Add starting spells based on level and specialization
    const spellcastingComponent = wizard.getComponent("spellcasting") as SpellcastingComponent;

// Add cantrips
    spellcastingComponent.knownSpells.push(SpellFactory.createSpell("mage_hand"));
    spellcastingComponent.knownSpells.push(SpellFactory.createSpell("fire_bolt"));

// Add first level spells
    spellcastingComponent.knownSpells.push(SpellFactory.createSpell("magic_missile"));
    spellcastingComponent.knownSpells.push(SpellFactory.createSpell("shield"));

// Add specialization spells
    switch (specialization) {
      case "evocation":
        spellcastingComponent.knownSpells.push(SpellFactory.createSpell("burning_hands"));
        break;
      case "divination":
        spellcastingComponent.knownSpells.push(SpellFactory.createSpell("identify"));
        break;
      // Additional specializations...
    }

// Add starting equipment
    const quarterstaff = ItemFactory.createWeapon("quarterstaff");
    wizard.inventory.push(quarterstaff);
    wizard.equipItem(quarterstaff);

return wizard;
  }

// Helper methods to create class objects
  private static getFighterClass(fightingStyle: string): CharacterClass {
    return {
      name: "Fighter",
      hitDieSize: 10,
      primaryAbility: "strength",
      savingThrowProficiencies: ["strength", "constitution"],
      armorProficiencies: ["light", "medium", "heavy", "shields"],
      weaponProficiencies: ["simple", "martial"],
      skillProficiencyChoices: ["Acrobatics", "Animal Handling", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"],
      startingEquipment: [],
      features: {
        1: [
          {
            name: "Fighting Style",
            description: `You adopt a particular style of fighting as your specialty. You gain the following benefit based on the style you choose: ${fightingStyle}`,
            type: "class_feature"
          },
          {
            name: "Second Wind",
            description: "You have a limited well of stamina that you can draw on to protect yourself from harm.",
            type: "class_feature"
          }
        ],
        2: [
          {
            name: "Action Surge",
            description: "You can push yourself beyond your normal limits for a moment.",
            type: "class_feature"
          }
        ],
        // Additional levels...
      }
    };
  }

private static getWizardClass(specialization: string): CharacterClass {
    return {
      name: "Wizard",
      hitDieSize: 6,
      primaryAbility: "intelligence",
      savingThrowProficiencies: ["intelligence", "wisdom"],
      armorProficiencies: [],
      weaponProficiencies: ["dagger", "dart", "sling", "quarterstaff", "light crossbow"],
      skillProficiencyChoices: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"],
      startingEquipment: [],
      features: {
        1: [
          {
            name: "Spellcasting",
            description: "As a student of arcane magic, you have a spellbook containing spells that show the first glimmerings of your true power.",
            type: "class_feature",
            grantsSpellcasting: true
          },
          {
            name: "Arcane Recovery",
            description: "You have learned to regain some of your magical energy by studying your spellbook.",
            type: "class_feature"
          }
        ],
        2: [
          {
            name: `Arcane Tradition: ${specialization}`,
            description: `You have focused your studies on one of the eight schools of magic: ${specialization}.`,
            type: "class_feature"
          }
        ],
        // Additional levels...
      }
    };
  }
}

```

This factory approach encapsulates the complex logic of character creation, making it easier to create consistent characters with appropriate components, abilities, and equipment.
