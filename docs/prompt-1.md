# Data Structures in RPGs and Adventure Game Books

RPGs and adventure game books offer fascinating examples of data structures that have direct parallels in software development. Their design choices provide valuable insights for programmers.

## Choose Your Own Adventure Books: Graph Data Structures

Choose Your Own Adventure (CYOA) books like the Fighting Fantasy series implement a directed graph structure where:
- Pages/sections act as nodes
- Decision points create edges between nodes
- The narrative progresses through traversal of this graph

This structure maps perfectly to graph implementations in programming:

```typescript
interface StoryNode {
  id: number;
  text: string;
  choices: Choice[];
}

interface Choice {
  text: string;
  nextNodeId: number;
}

// Example implementation
const adventureBook: StoryNode[] = [
  {
    id: 1,
    text: "You stand at the entrance to a dark cave. A cool breeze flows outward.",
    choices: [
      { text: "Enter the cave", nextNodeId: 2 },
      { text: "Search around outside first", nextNodeId: 3 }
    ]
  },
  {
    id: 2,
    text: "Inside the cave, you can barely see. There's a torch on the wall and a passage ahead.",
    choices: [
      { text: "Take the torch and continue", nextNodeId: 4 },
      { text: "Proceed carefully without the torch", nextNodeId: 5 }
    ]
  },
  // Additional nodes...
];

// Simple engine to run the adventure
function playAdventure(nodes: StoryNode[], startNodeId: number): void {
  let currentNodeId = startNodeId;
  
  while (true) {
    const currentNode = nodes.find(node => node.id === currentNodeId);
    if (!currentNode) {
      console.log("Error: Node not found");
      break;
    }
    
    console.log(currentNode.text);
    
    if (currentNode.choices.length === 0) {
      console.log("THE END");
      break;
    }
    
    // In a real implementation, this would get player input
    const choiceIndex = 0; // Simulating player choice
    currentNodeId = currentNode.choices[choiceIndex].nextNodeId;
  }
}
```

## D&D Character Sheets: Composite Objects & Inheritance

Character sheets in RPGs like D&D are excellent examples of composite objects with inheritance-like relationships:

```typescript
// Base character attributes
interface Character {
  name: string;
  level: number;
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  hitPoints: number;
  armorClass: number;
  inventory: Item[];
  skills: Skill[];
  calculateModifier(attributeValue: number): number;
}

// Classes implement the Character interface and add specialized behaviors
class Wizard implements Character {
  name: string;
  level: number;
  attributes: { strength: number; dexterity: number; constitution: number; 
                intelligence: number; wisdom: number; charisma: number; };
  hitPoints: number;
  armorClass: number;
  inventory: Item[];
  skills: Skill[];
  
  // Wizard-specific properties
  spellbook: Spell[];
  magicSchool: MagicSchool;
  
  constructor(name: string, level: number, attributes: any) {
    this.name = name;
    this.level = level;
    this.attributes = attributes;
    this.hitPoints = 6 + this.calculateModifier(attributes.constitution);
    // Initialize other properties
  }
  
  calculateModifier(attributeValue: number): number {
    return Math.floor((attributeValue - 10) / 2);
  }
  
  castSpell(spell: Spell, target: Character): void {
    // Implementation
  }
}
```

## Monster Stat Blocks: Structured Data Templates

Monster stat blocks in RPGs provide excellent examples of standardized data templates:

```typescript
interface MonsterStatBlock {
  name: string;
  size: Size;
  type: CreatureType;
  alignment: Alignment;
  armorClass: number;
  hitPoints: number;
  speed: {
    walk?: number;
    fly?: number;
    swim?: number;
    climb?: number;
    burrow?: number;
  };
  attributes: {
    strength: number;
    dexterity: number;
    constitution: number;
    intelligence: number;
    wisdom: number;
    charisma: number;
  };
  savingThrows?: {
    strength?: number;
    dexterity?: number;
    constitution?: number;
    intelligence?: number;
    wisdom?: number;
    charisma?: number;
  };
  skills?: Record<string, number>;
  damageResistances?: DamageType[];
  damageImmunities?: DamageType[];
  conditionImmunities?: Condition[];
  senses: {
    darkvision?: number;
    blindsight?: number;
    truesight?: number;
    tremorsense?: number;
    passivePerception: number;
  };
  languages: string[];
  challengeRating: number;
  specialAbilities?: Ability[];
  actions: Action[];
  legendaryActions?: Action[];
}

// Example implementation
const goblin: MonsterStatBlock = {
  name: "Goblin",
  size: "Small",
  type: "Humanoid",
  alignment: "Neutral Evil",
  armorClass: 15,
  hitPoints: 7,
  speed: { walk: 30 },
  attributes: {
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8
  },
  skills: { "Stealth": 6 },
  senses: { passivePerception: 9, darkvision: 60 },
  languages: ["Common", "Goblin"],
  challengeRating: 0.25,
  actions: [
    {
      name: "Scimitar",
      type: "Melee Weapon Attack",
      toHit: 4,
      reach: 5,
      targets: 1,
      damage: { diceCount: 1, diceType: 6, modifier: 2, type: "Slashing" }
    },
    {
      name: "Shortbow",
      type: "Ranged Weapon Attack",
      toHit: 4,
      range: [80, 320],
      targets: 1,
      damage: { diceCount: 1, diceType: 6, modifier: 2, type: "Piercing" }
    }
  ]
};
```

## Inventory Systems: Collections & Composite Pattern

RPG inventory systems demonstrate practical collection management and the composite pattern:

```typescript
interface Item {
  id: string;
  name: string;
  weight: number;
  value: number;
  description: string;
}

interface Container extends Item {
  capacity: number;
  contents: Item[];
  addItem(item: Item): boolean;
  removeItem(itemId: string): Item | null;
}

class Backpack implements Container {
  id: string;
  name: string;
  weight: number; 
  value: number;
  description: string;
  capacity: number;
  contents: Item[] = [];
  
  constructor(id: string, name: string, capacity: number, value: number) {
    this.id = id;
    this.name = name;
    this.weight = 2; // Base weight when empty
    this.value = value;
    this.capacity = capacity;
    this.description = `A ${name} that can hold up to ${capacity} pounds of equipment.`;
  }
  
  get totalWeight(): number {
    return this.weight + this.contents.reduce((sum, item) => sum + item.weight, 0);
  }
  
  addItem(item: Item): boolean {
    const currentContentWeight = this.contents.reduce((sum, item) => sum + item.weight, 0);
    if (currentContentWeight + item.weight <= this.capacity) {
      this.contents.push(item);
      return true;
    }
    return false;
  }
  
  removeItem(itemId: string): Item | null {
    const index = this.contents.findIndex(item => item.id === itemId);
    if (index !== -1) {
      const [removedItem] = this.contents.splice(index, 1);
      return removedItem;
    }
    return null;
  }
}
```

## Spell Systems: Function References & Factory Pattern

Spell systems in RPGs showcase interesting ways to implement functions and factories:

```typescript
type SpellEffect = (caster: Character, target: Character | Character[], level: number) => void;

interface Spell {
  id: string;
  name: string;
  level: number;
  school: MagicSchool;
  castingTime: string;
  range: number | string;
  components: {
    verbal: boolean;
    somatic: boolean;
    material: boolean;
    materials?: string;
  };
  duration: string;
  description: string;
  effect: SpellEffect;
}

// Spell factory for creating standardized spells
class SpellFactory {
  static createFireball(): Spell {
    return {
      id: "fireball",
      name: "Fireball",
      level: 3,
      school: "Evocation",
      castingTime: "1 action",
      range: 150,
      components: {
        verbal: true,
        somatic: true,
        material: true,
        materials: "A tiny ball of bat guano and sulfur"
      },
      duration: "Instantaneous",
      description: "A bright streak flashes from your pointing finger to a point you choose...",
      effect: (caster: Character, targets: Character[], level: number) => {
        const damage = this.rollDice(8, level - 2) + this.calculateModifier(caster.attributes.intelligence);
        for (const target of targets) {
          // Apply saving throw logic
          target.hitPoints -= damage;
        }
      }
    };
  }
  
  private static rollDice(diceSize: number, count: number): number {
    let total = 0;
    for (let i = 0; i < count; i++) {
      total += Math.floor(Math.random() * diceSize) + 1;
    }
    return total;
  }
  
  private static calculateModifier(attributeValue: number): number {
    return Math.floor((attributeValue - 10) / 2);
  }
}
```

## Lessons for Programming

These tabletop game mechanics offer several valuable design principles for software developers:

1. **Separation of data and logic**: Character sheets separate attributes from the rules that interpret them
2. **Standardized templates**: Monster stat blocks ensure consistent structure despite diverse content
3. **Progressive disclosure**: Choose-your-own-adventure books reveal information incrementally
4. **State management**: Saving character progress through complex, branching stories
5. **Composability**: Building complex game entities from simple components
6. **Domain-specific language**: Game rules provide a clear vocabulary for domain objects

These principles can directly inform the design of robust, maintainable software systems across various domains.