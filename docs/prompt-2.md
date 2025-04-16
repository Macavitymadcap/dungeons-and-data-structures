# Data Structures in RPGs and Adventure Game Books: Computer Science Theory

Let me explore the computer science theory behind each RPG data structure example in greater depth.

## Choose Your Own Adventure Books: Graph Theory

CYOA books implement a directed graph, which has rich theoretical underpinnings:

### Theoretical Foundations
- **Formal Definition**: A directed graph G = (V, E) where V is a set of vertices (story sections) and E is a set of ordered pairs of vertices (decisions)
- **Graph Properties**: 
  - Most CYOA books form a directed acyclic graph (DAG) to prevent infinite loops
  - Some include cycles for repeatable scenarios, implementing state machines
  - Paths represent possible story progressions (walks through the graph)

### Algorithmic Considerations
- **Graph Traversal**: The reader performs depth-first traversal through decision-making
- **Reachability**: Some endings may require specific path combinations
- **Path Analysis**: Finding all possible story outcomes requires finding all leaf nodes

```typescript
interface StoryNode {
  id: number;
  text: string;
  choices: Choice[];
  visited: boolean; // State tracking
}

// Find all possible endings using DFS traversal
function findAllEndings(nodes: StoryNode[], startNodeId: number): number[] {
  const endings: number[] = [];
  
  function dfs(nodeId: number) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;
    
    // Mark as visited to prevent cycles
    node.visited = true;
    
    // If it's an ending (no choices), add to endings
    if (node.choices.length === 0) {
      endings.push(node.id);
    } else {
      // Traverse all choices
      for (const choice of node.choices) {
        if (!nodes.find(n => n.id === choice.nextNodeId)?.visited) {
          dfs(choice.nextNodeId);
        }
      }
    }
    
    // Reset visited status for future traversals
    node.visited = false;
  }
  
  dfs(startNodeId);
  return endings;
}
```

### Theoretical Applications
- **Partial Ordering**: Story progression follows topological sorting principles
- **Minimum Spanning Trees**: Finding the shortest path to a particular ending
- **Flow Networks**: Analyzing the distribution of players across different story branches

## D&D Character Sheets: Object-Oriented Composition and Inheritance

Character sheets demonstrate fundamental OOP principles with nuanced implementation:

### Theoretical Foundations
- **Inheritance Hierarchies**: Classes like Wizard and Fighter inherit from base Character type
- **Interface vs. Implementation**: Clear separation between character capabilities and their implementations
- **Liskov Substitution Principle**: Any subclass should be usable where the base class is expected

### Design Pattern Theory
- **Composite Pattern**: Characters composed of multiple subsystems (combat, skills, spellcasting)
- **Strategy Pattern**: Different character classes implement shared behaviors differently
- **Decorator Pattern**: Equipment and buffs modify character capabilities without changing core classes

```typescript
// Base abstract class defining character interface
abstract class Character {
  name: string;
  level: number;
  attributes: CharacterAttributes;
  
  constructor(name: string, level: number, attributes: CharacterAttributes) {
    this.name = name;
    this.level = level;
    this.attributes = attributes;
  }
  
  // Template method pattern
  calculateHitPoints(): number {
    const baseHP = this.getClassHitDie();
    const constitutionModifier = Math.floor((this.attributes.constitution - 10) / 2);
    return baseHP + (this.level * constitutionModifier);
  }
  
  // Abstract methods to be implemented by subclasses
  abstract getClassHitDie(): number;
  abstract getProficiencies(): string[];
  abstract levelUp(): void;
}

// Concrete implementation
class Fighter extends Character {
  fightingStyle: string;
  secondWind: boolean = true;
  
  constructor(name: string, level: number, attributes: CharacterAttributes, style: string) {
    super(name, level, attributes);
    this.fightingStyle = style;
  }
  
  getClassHitDie(): number {
    return 10; // d10 average
  }
  
  getProficiencies(): string[] {
    return ["All Armor", "All Weapons", "Strength Saves", "Constitution Saves"];
  }
  
  levelUp(): void {
    // Fighter-specific level up logic
    if (this.level % 2 === 0) {
      // Action surge at certain levels
    }
  }
  
  // Fighter-specific methods
  useSecondWind(): number {
    if (this.secondWind) {
      this.secondWind = false;
      return this.level + Math.floor(Math.random() * 10) + 1; // 1d10 + level
    }
    return 0;
  }
}
```

### Memory and Performance Considerations
- **Flyweight Pattern**: Shared character attributes minimize memory usage
- **Memoization**: Caching derived statistics to avoid recalculation
- **Dynamic Dispatch**: Runtime method selection based on character class

## Monster Stat Blocks: Structured Data and Type Theory

Monster stat blocks demonstrate sophisticated data structuring concepts:

### Theoretical Foundations
- **Type Theory**: Strongly typed hierarchies with sum and product types
- **Schema Design**: Standardized format for diverse creature representation
- **Nominal vs. Structural Typing**: Differentiation between monster categories

### Data Normalization
- **First Normal Form (1NF)**: Breaking down complex attributes (like actions) into atomic values
- **Third Normal Form (3NF)**: Separating dependent attributes into related structures
- **Denormalization**: Strategic redundancy for performance

```typescript
// Type algebras for monster categories
type Size = "Tiny" | "Small" | "Medium" | "Large" | "Huge" | "Gargantuan";
type CreatureType = 
  "Aberration" | "Beast" | "Celestial" | "Construct" | 
  "Dragon" | "Elemental" | "Fey" | "Fiend" | 
  "Giant" | "Humanoid" | "Monstrosity" | "Ooze" | 
  "Plant" | "Undead";

// Monster Factory using the Builder pattern
class MonsterBuilder {
  private monster: Partial<MonsterStatBlock> = {};
  
  constructor(name: string) {
    this.monster.name = name;
    // Set defaults
    this.monster.senses = { passivePerception: 10 };
    this.monster.languages = [];
    this.monster.actions = [];
  }
  
  setSize(size: Size): MonsterBuilder {
    this.monster.size = size;
    return this;
  }
  
  setType(type: CreatureType): MonsterBuilder {
    this.monster.type = type;
    return this;
  }
  
  setAttributes(attributes: MonsterAttributes): MonsterBuilder {
    this.monster.attributes = attributes;
    
    // Automatically calculate passive perception from Wisdom
    const wisdomMod = Math.floor((attributes.wisdom - 10) / 2);
    this.monster.senses!.passivePerception = 10 + wisdomMod;
    
    return this;
  }
  
  addAction(action: Action): MonsterBuilder {
    this.monster.actions!.push(action);
    return this;
  }
  
  // Additional builder methods...
  
  build(): MonsterStatBlock {
    // Validate required fields
    if (!this.monster.name || !this.monster.size || !this.monster.type || 
        !this.monster.attributes || !this.monster.armorClass || !this.monster.hitPoints) {
      throw new Error("Monster missing required attributes");
    }
    
    return this.monster as MonsterStatBlock;
  }
}

// Usage
const goblinBuilder = new MonsterBuilder("Goblin")
  .setSize("Small")
  .setType("Humanoid")
  .setAttributes({
    strength: 8,
    dexterity: 14,
    constitution: 10,
    intelligence: 10,
    wisdom: 8,
    charisma: 8
  })
  .setArmorClass(15)
  .setHitPoints(7)
  .addAction({
    name: "Scimitar",
    type: "Melee Weapon Attack",
    toHit: 4,
    reach: 5,
    targets: 1,
    damage: { diceCount: 1, diceType: 6, modifier: 2, type: "Slashing" }
  });

const goblin = goblinBuilder.build();
```

### Algorithmic Applications
- **Constraint Satisfaction**: Monster creation following game balance rules
- **Challenge Rating Calculation**: Mathematical formula based on offensive/defensive capabilities
- **Encounter Balancing**: Algorithmic approaches to match monsters to player capabilities

## Inventory Systems: Collection Management Theory

Inventory systems illuminate several complex collection management principles:

### Theoretical Foundations
- **Bin Packing Problem**: Optimally fitting items into constrained space
- **Knapsack Problem**: Selecting the most valuable items within weight limits
- **Multi-dimensional Sorting**: Organizing by weight, value, type, etc.

### Data Structure Selection
- **Tree Structures**: Hierarchical container organization (bags within bags)
- **Priority Queues**: Maintaining most-used items for quick access
- **Hash Tables**: Fast item lookup by ID

```typescript
// Generic container implementation using TypeScript generics
class Container<T extends Item> {
  private _capacity: number;
  private _contents: Map<string, T> = new Map();
  
  constructor(capacity: number) {
    this._capacity = capacity;
  }
  
  get currentWeight(): number {
    let total = 0;
    for (const item of this._contents.values()) {
      total += item.weight;
    }
    return total;
  }
  
  get remainingCapacity(): number {
    return this._capacity - this.currentWeight;
  }
  
  // O(1) lookup by ID
  getItem(id: string): T | undefined {
    return this._contents.get(id);
  }
  
  // O(n) filtering by predicate
  findItems(predicate: (item: T) => boolean): T[] {
    return Array.from(this._contents.values()).filter(predicate);
  }
  
  addItem(item: T): boolean {
    if (item.weight <= this.remainingCapacity) {
      this._contents.set(item.id, item);
      return true;
    }
    return false;
  }
  
  removeItem(id: string): T | undefined {
    const item = this._contents.get(id);
    if (item) {
      this._contents.delete(id);
      return item;
    }
    return undefined;
  }
  
  // Composite pattern - handles nested containers recursively
  findItemDeep(id: string): { item: T, path: string[] } | undefined {
    // Direct child check
    const item = this._contents.get(id);
    if (item) return { item, path: [id] };
    
    // Check nested containers
    for (const [containerId, possibleContainer] of this._contents.entries()) {
      if ('findItemDeep' in possibleContainer) {
        const nestedResult = (possibleContainer as unknown as Container<T>).findItemDeep(id);
        if (nestedResult) {
          return {
            item: nestedResult.item,
            path: [containerId, ...nestedResult.path]
          };
        }
      }
    }
    
    return undefined;
  }
}
```

### Algorithmic Challenges
- **Efficient Iteration**: Traversing nested container hierarchies
- **Path Finding**: Locating items in complex container structures
- **Space-Time Tradeoffs**: Balancing quick access against memory usage

## Spell Systems: Function Programming and Event-Driven Architecture

Spell systems demonstrate functional programming and event systems:

### Theoretical Foundations
- **Higher-Order Functions**: Spells that take other spells as parameters
- **Currying**: Partially applied spell effects
- **Pure vs. Impure Functions**: Side-effect management in spell casting

### Event-Driven Architecture
- **Publish-Subscribe Pattern**: Broadcasting spell effects to affected entities
- **Event Propagation**: Spell effects cascading through interconnected systems
- **Event Sourcing**: Logging all spell actions for game state reconstruction

```typescript
// Functional approach to spell effects
type SpellTarget = Character | Point | Area;
type DamageType = "Fire" | "Cold" | "Lightning" | "Acid" | "Poison" | "Necrotic" | "Radiant" | "Force" | "Physical";

// Higher-order function for creating damage spells
function createDamageSpell(
  name: string,
  level: number,
  damageType: DamageType,
  baseDamage: number,
  scalingDamage: number
): Spell {
  // Return a spell object with a curried damage function
  return {
    name,
    level,
    // Curried function: first takes spell parameters, returns function taking targets
    effect: (caster: Character, castLevel: number) => {
      // Calculate damage based on cast level
      const damageAmount = baseDamage + (castLevel > level ? (castLevel - level) * scalingDamage : 0);
      const intelligenceMod = Math.floor((caster.attributes.intelligence - 10) / 2);
      
      // Return the actual damage function
      return (target: SpellTarget): void => {
        // Different logic based on target type (single character, point, or area)
        if (target instanceof Character) {
          // Direct damage to character
          applyDamage(target, damageAmount + intelligenceMod, damageType);
        } else if (target instanceof Area) {
          // Area effect damage with saving throws
          for (const entity of target.getEntitiesInArea()) {
            if (entity instanceof Character) {
              const saveResult = entity.savingThrow("Dexterity");
              const damageTaken = saveResult.success ? damageAmount / 2 : damageAmount;
              applyDamage(entity, damageTaken, damageType);
            }
          }
        }
        
        // Publish event to game system
        EventBus.publish('spell.damage', {
          caster,
          spell: name,
          target,
          damageType,
          damageAmount
        });
      };
    }
  };
}

// Event bus implementation
class EventBus {
  private static listeners: Map<string, Function[]> = new Map();
  
  static subscribe(event: string, callback: Function): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);
  }
  
  static publish(event: string, data: any): void {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event)!) {
        callback(data);
      }
    }
  }
}

// Usage
const fireball = createDamageSpell("Fireball", 3, "Fire", 8, 1);

// Subscribe to spell events
EventBus.subscribe('spell.damage', (data) => {
  console.log(`${data.caster.name} cast ${data.spell} dealing ${data.damageAmount} ${data.damageType} damage`);
});

// Cast the spell
const wizard = new Wizard("Gandalf", 5, { intelligence: 18, /* other stats */ });
const targetArea = new Area(new Point(10, 10), 20); // 20ft radius at point (10,10)

// Curried application
const fireballCast = fireball.effect(wizard, 5); // Cast at 5th level
fireballCast(targetArea); // Apply to target area
```

### Theoretical Optimizations
- **Memoization**: Caching spell calculation results for repeated uses
- **Lazy Evaluation**: Delaying spell effect calculations until required
- **Referential Transparency**: Ensuring consistent spell behavior regardless of game state

## Quest and Campaign Systems: State Machines and Temporal Logic

RPG quest systems demonstrate advanced state management concepts:

### Theoretical Foundations
- **Finite State Machines**: Quests with discrete states (available, active, completed, failed)
- **Petri Nets**: Modeling complex precondition relationships between quests
- **Temporal Logic**: Reasoning about quest sequences and timing constraints

```typescript
// States and transitions for quest FSM
enum QuestState {
  UNAVAILABLE = "unavailable",
  AVAILABLE = "available",
  ACTIVE = "active",
  COMPLETED = "completed",
  FAILED = "failed"
}

type QuestTransition = 
  "unlock" | "accept" | "advance" | "complete" | "fail" | "reset" | "expire";

interface QuestStep {
  id: string;
  description: string;
  isCompleted: boolean;
  isOptional: boolean;
  completionCondition: (gameState: GameState) => boolean;
}

class QuestStateMachine {
  private currentState: QuestState;
  private steps: QuestStep[];
  private currentStepIndex: number = 0;
  
  constructor(initialState: QuestState, steps: QuestStep[]) {
    this.currentState = initialState;
    this.steps = steps;
  }
  
  // Process a transition
  transition(action: QuestTransition, gameState: GameState): boolean {
    switch (this.currentState) {
      case QuestState.UNAVAILABLE:
        if (action === "unlock" && this.checkPrerequisites(gameState)) {
          this.currentState = QuestState.AVAILABLE;
          return true;
        }
        break;
        
      case QuestState.AVAILABLE:
        if (action === "accept") {
          this.currentState = QuestState.ACTIVE;
          return true;
        } else if (action === "expire" && this.hasExpired(gameState)) {
          this.currentState = QuestState.FAILED;
          return true;
        }
        break;
        
      case QuestState.ACTIVE:
        if (action === "advance") {
          return this.advanceStep(gameState);
        } else if (action === "complete" && this.canComplete(gameState)) {
          this.currentState = QuestState.COMPLETED;
          return true;
        } else if (action === "fail") {
          this.currentState = QuestState.FAILED;
          return true;
        }
        break;
        
      // Additional states and transitions...
    }
    
    return false; // Invalid transition
  }
  
  private advanceStep(gameState: GameState): boolean {
    const currentStep = this.steps[this.currentStepIndex];
    
    if (currentStep.completionCondition(gameState)) {
      currentStep.isCompleted = true;
      
      // Move to next uncompleted step
      let nextStepIndex = this.currentStepIndex + 1;
      while (
        nextStepIndex < this.steps.length && 
        (this.steps[nextStepIndex].isCompleted || this.steps[nextStepIndex].isOptional)
      ) {
        nextStepIndex++;
      }
      
      this.currentStepIndex = nextStepIndex;
      return true;
    }
    
    return false;
  }
  
  private canComplete(gameState: GameState): boolean {
    // All required steps must be completed
    return this.steps
      .filter(step => !step.isOptional)
      .every(step => step.isCompleted);
  }
  
  // Additional helper methods...
}
```

### Algorithmic Applications
- **Topological Sorting**: Determining optimal quest completion order
- **Critical Path Analysis**: Finding the fastest route through campaign content
- **Dependency Resolution**: Managing interrelated quest prerequisites

## Character Development Systems: Optimization and Decision Theory

Character advancement systems demonstrate optimization algorithms:

### Theoretical Foundations
- **Decision Trees**: Modeling character advancement choices
- **Utility Theory**: Evaluating the effectiveness of different builds
- **Constrained Optimization**: Maximizing character effectiveness within rules

```typescript
// Decision tree for character advancement
class CharacterBuildNode {
  level: number;
  choiceType: "Class" | "Ability" | "Feat" | "Skill";
  possibleChoices: string[];
  selectedChoice: string | null = null;
  children: CharacterBuildNode[] = [];
  
  constructor(level: number, choiceType: "Class" | "Ability" | "Feat" | "Skill", choices: string[]) {
    this.level = level;
    this.choiceType = choiceType;
    this.possibleChoices = choices;
  }
  
  makeChoice(choice: string): CharacterBuildNode[] | null {
    if (!this.possibleChoices.includes(choice)) {
      return null; // Invalid choice
    }
    
    this.selectedChoice = choice;
    
    // Generate next level choices based on this choice
    return this.generateNextChoices();
  }
  
  generateNextChoices(): CharacterBuildNode[] {
    // Logic to determine what choices are available next based on selected choice
    // This would implement game rules for character advancement
    
    // For example, if we chose Fighter at level 1, at level 2 we get a Fighting Style
    if (this.level === 1 && this.choiceType === "Class" && this.selectedChoice === "Fighter") {
      const fightingStyleNode = new CharacterBuildNode(
        2, 
        "Feat", 
        ["Archery", "Defense", "Dueling", "Great Weapon Fighting", "Protection", "Two-Weapon Fighting"]
      );
      this.children.push(fightingStyleNode);
    }
    
    return this.children;
  }
}

// Optimization algorithm for character builds
function optimizeCharacterBuild(
  startingStats: CharacterAttributes,
  optimizationGoal: "Damage" | "Survivability" | "Spellcasting" | "Skills",
  maxLevel: number
): CharacterBuild {
  // Use A* search algorithm to find optimal path through decision tree
  // This is a simplified placeholder - real implementation would be more complex
  const openList: {node: CharacterBuildNode, build: CharacterBuild, score: number}[] = [];
  const closedList: Set<string> = new Set();
  
  // Start with initial choice (class selection)
  const rootNode = new CharacterBuildNode(1, "Class", ["Fighter", "Wizard", "Rogue", "Cleric"]);
  
  // Initialize open list with all possible starting choices
  for (const className of rootNode.possibleChoices) {
    const initialBuild = new CharacterBuild(startingStats);
    const children = rootNode.makeChoice(className);
    if (children) {
      const score = evaluateBuild(initialBuild, optimizationGoal);
      openList.push({
        node: rootNode,
        build: initialBuild,
        score
      });
    }
  }
  
  // A* search implementation would continue here...
  
  // Return the optimal build found
  return new CharacterBuild(startingStats);
}
```

### Algorithmic Applications
- **Multi-objective Optimization**: Balancing offensive and defensive capabilities
- **Minimax Algorithms**: Evaluating builds against potential encounters
- **Heuristic Search**: Finding near-optimal builds in large decision spaces

## Dice Systems: Probability Theory and Random Number Generation

RPG dice mechanics demonstrate probability distribution concepts:

### Theoretical Foundations
- **Probability Distributions**: Different dice produce different distributions
- **Central Limit Theorem**: Multiple dice rolls tend toward normal distribution
- **Expected Value Calculation**: Predicting average outcomes of complex dice formulas

```typescript
// Probability distribution analysis for dice systems
class DiceDistribution {
  private readonly sides: number;
  private readonly count: number;
  private readonly modifier: number;
  private distribution: Map<number, number> = new Map();
  
  constructor(count: number, sides: number, modifier: number = 0) {
    this.sides = sides;
    this.count = count;
    this.modifier = modifier;
    this.calculateDistribution();
  }
  
  // Calculate full probability distribution
  private calculateDistribution(): void {
    // For single die
    if (this.count === 1) {
      for (let i = 1; i <= this.sides; i++) {
        this.distribution.set(i + this.modifier, 1 / this.sides);
      }
      return;
    }
    
    // For multiple dice, use dynamic programming approach
    let currentDist = new Map<number, number>();
    
    // Initialize with first die
    for (let i = 1; i <= this.sides; i++) {
      currentDist.set(i, 1 / this.sides);
    }
    
    // Add each additional die
    for (let d = 1; d < this.count; d++) {
      const newDist = new Map<number, number>();
      
      // For each outcome in current distribution
      for (const [sum, prob] of currentDist.entries()) {
        // Add each possible roll of the next die
        for (let i = 1; i <= this.sides; i++) {
          const newSum = sum + i;
          const newProb = (newDist.get(newSum) || 0) + (prob * (1 / this.sides));
          newDist.set(newSum, newProb);
        }
      }
      
      currentDist = newDist;
    }
    
    // Apply modifier to final distribution
    if (this.modifier !== 0) {
      const modifiedDist = new Map<number, number>();
      for (const [sum, prob] of currentDist.entries()) {
        modifiedDist.set(sum + this.modifier, prob);
      }
      currentDist = modifiedDist;
    }
    
    this.distribution = currentDist;
  }
  
  getProbabilityOf(value: number): number {
    return this.distribution.get(value) || 0;
  }
  
  getProbabilityOfAtLeast(value: number): number {
    let probability = 0;
    for (const [outcome, prob] of this.distribution.entries()) {
      if (outcome >= value) {
        probability += prob;
      }
    }
    return probability;
  }
  
  getExpectedValue(): number {
    let expected = 0;
    for (const [outcome, prob] of this.distribution.entries()) {
      expected += outcome * prob;
    }
    return expected;
  }
  
  getVariance(): number {
    const expectedValue = this.getExpectedValue();
    let variance = 0;
    
    for (const [outcome, prob] of this.distribution.entries()) {
      variance += Math.pow(outcome - expectedValue, 2) * prob;
    }
    
    return variance;
  }
}

// Usage example
const attackRoll = new DiceDistribution(1, 20, 5); // 1d20+5
console.log(`Probability of hitting AC 15: ${attackRoll.getProbabilityOfAtLeast(15) * 100}%`);

const damageRoll = new DiceDistribution(2, 6, 3); // 2d6+3
console.log(`Expected damage: ${damageRoll.getExpectedValue()}`);
console.log(`Damage variance: ${damageRoll.getVariance()}`);
```

### Algorithmic Applications
- **Monte Carlo Simulation**: Estimating complex probabilities through repeated sampling
- **Risk Analysis**: Evaluating success probabilities for character actions
- **Fair Random Number Generation**: Ensuring unbiased digital dice

## Game Economy Systems: Resource Allocation and Market Dynamics

RPG economies demonstrate economic theory concepts:

### Theoretical Foundations
- **Scarcity and Utility**: Balancing resource availability against player needs
- **Market Equilibrium**: Dynamic pricing based on supply and demand
- **Game Theory**: Strategic decision-making in resource allocation

```typescript
// Economic simulation for game markets
class GameMarket {
  private items: Map<string, MarketItem> = new Map();
  private supplyDemandModels: Map<string, SupplyDemandModel> = new Map();
  private transactionHistory: Transaction[] = [];
  
  constructor(initialItems: MarketItem[]) {
    for (const item of initialItems) {
      this.items.set(item.id, item);
      this.supplyDemandModels.set(item.id, new SupplyDemandModel(
        item.basePrice,
        item.elasticity,
        item.baseSupply,
        item.baseDemand
      ));
    }
  }
  
  // Update market prices based on transaction history
  updatePrices(): void {
    // Group transactions by item
    const itemTransactions = new Map<string, number>();
    
    // Count net transactions (positive for buys, negative for sells)
    for (const transaction of this.transactionHistory) {
      const current = itemTransactions.get(transaction.itemId) || 0;
      itemTransactions.set(
        transaction.itemId, 
        current + (transaction.isBuy ? transaction.quantity : -transaction.quantity)
      );
    }
    
    // Update prices based on supply and demand
    for (const [itemId, netQuantity] of itemTransactions.entries()) {
      const model = this.supplyDemandModels.get(itemId);
      const item = this.items.get(itemId);
      
      if (model && item) {
        // Update supply/demand levels
        model.updateSupplyDemand(netQuantity);
        
        // Calculate new price
        const newPrice = model.calculatePrice();
        item.currentPrice = newPrice;
      }
    }
    
    // Clear transaction history for next cycle
    this.transactionHistory = [];
  }
  
  // Execute a market transaction
  executeTransaction(itemId: string, quantity: number, isBuy: boolean): number {
    const item = this.items.get(itemId);
    if (!item) throw new Error(`Item ${itemId} not found in market`);
    
    // Record transaction
    this.transactionHistory.push({
      itemId,
      quantity,
      isBuy,
      price: item.currentPrice,
      timestamp: Date.now()
    });
    
    // Return total cost
    return item.currentPrice * quantity;
  }
}

class SupplyDemandModel {
  private basePrice: number;
  private elasticity: number;
  private currentSupply: number;
  private currentDemand: number;
  
  constructor(basePrice: number, elasticity: number, initialSupply: number, initialDemand: number) {
    this.basePrice = basePrice;
    this.elasticity = elasticity;
    this.currentSupply = initialSupply;
    this.currentDemand = initialDemand;
  }
  
  updateSupplyDemand(netQuantity: number): void {
    // Positive netQuantity = more demand than supply
    // Negative netQuantity = more supply than demand
    this.currentDemand += netQuantity > 0 ? netQuantity : 0;
    this.currentSupply += netQuantity < 0 ? -netQuantity : 0;
  }
  
  calculatePrice(): number {
    // Simple supply/demand ratio model
    const ratio = this.currentDemand / this.currentSupply;
    return this.basePrice * Math.pow(ratio, this.elasticity);
  }
}
```

### Algorithmic Applications
- **Nash Equilibrium**: Stable states in multi-player economic interactions
- **Auction Theory**: Implementing different auction mechanisms for item distribution
- **Currency Flow Analysis**: Monitoring inflation/deflation in game economies

These theoretical foundations from RPGs provide excellent models for computer science applications, demonstrating how game mechanics can inform software architecture at a fundamental level.