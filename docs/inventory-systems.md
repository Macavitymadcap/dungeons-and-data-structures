# Inventory Systems: Collection Management Theory

## Introduction

Inventory systems in role-playing games provide a fascinating window into collection management algorithms and data structures. From the backpacks of D&D adventurers to the complex storage systems of digital RPGs, these systems implement sophisticated solutions to classic computer science problems like resource allocation, categorization, and efficient retrieval.

## Container Hierarchies and the Composite Pattern

One of the most powerful design patterns evident in RPG inventory systems is the Composite pattern. This allows containers to hold other containers, creating a hierarchical structure:

```typescript
// Base Item interface
interface Item {
  id: string;
  name: string;
  description: string;
  weight: number;
  value: number;
  isStackable: boolean;
  maxStackSize?: number;
  quantity: number;
}

// Container interface using the Composite pattern
interface Container extends Item {
  capacity: number;     // Maximum weight capacity
  contents: Item[];     // Items stored in this container
  
  addItem(item: Item): boolean;
  removeItem(itemId: string): Item | null;
  findItem(itemId: string): Item | null;
  getCurrentWeight(): number;
  getRemainingCapacity(): number;
}

// Concrete implementation of a container
class Backpack implements Container {
  id: string;
  name: string;
  description: string;
  weight: number;
  value: number;
  isStackable: boolean = false;
  quantity: number = 1;
  capacity: number;
  contents: Item[] = [];
  
  constructor(id: string, name: string, capacity: number, weight: number, value: number) {
    this.id = id;
    this.name = name;
    this.description = `A ${name} that can hold up to ${capacity} pounds of equipment.`;
    this.weight = weight;
    this.value = value;
    this.capacity = capacity;
  }
  
  addItem(item: Item): boolean {
    // Check if adding this item would exceed capacity
    if (this.getCurrentWeight() + item.weight * item.quantity > this.capacity) {
      return false;
    }
    
    // If item is stackable, try to stack with existing items
    if (item.isStackable) {
      const existingItem = this.contents.find(
        i => i.name === item.name && i.isStackable && i.quantity < (i.maxStackSize || Infinity)
      );
      
      if (existingItem) {
        const availableSpace = (existingItem.maxStackSize || Infinity) - existingItem.quantity;
        
        if (availableSpace >= item.quantity) {
          // Item fits completely in the existing stack
          existingItem.quantity += item.quantity;
          return true;
        } else {
          // Item partially fits in the existing stack
          existingItem.quantity += availableSpace;
          item.quantity -= availableSpace;
          // Continue and add remaining as a new item
        }
      }
    }
    
    // Add as a new item
    this.contents.push(item);
    return true;
  }
  
  removeItem(itemId: string): Item | null {
    const index = this.contents.findIndex(item => item.id === itemId);
    
    if (index === -1) {
      return null;
    }
    
    const [removedItem] = this.contents.splice(index, 1);
    return removedItem;
  }
  
  findItem(itemId: string): Item | null {
    // First, check direct contents
    const item = this.contents.find(item => item.id === itemId);
    if (item) {
      return item;
    }
    
    // Then recursively check any containers within this container
    for (const content of this.contents) {
      if ('findItem' in content) {
        const container = content as Container;
        const nestedItem = container.findItem(itemId);
        if (nestedItem) {
          return nestedItem;
        }
      }
    }
    
    return null;
  }
  
  getCurrentWeight(): number {
    return this.contents.reduce((total, item) => {
      // For containers, include their own weight plus contents
      if ('getCurrentWeight' in item) {
        const container = item as Container;
        return total + container.weight + container.getCurrentWeight();
      }
      // For regular items, multiply by quantity
      return total + (item.weight * item.quantity);
    }, 0);
  }
  
  getRemainingCapacity(): number {
    return this.capacity - this.getCurrentWeight();
  }
}
```

This implementation demonstrates several important aspects of collection management:

1. **Recursive Operations**: Methods like `findItem` and `getCurrentWeight` operate recursively through the container hierarchy
2. **Capacity Constraints**: The system enforces weight limits, modeling real-world constraints
3. **Item Stacking**: Similar items can be combined to save space, a common optimization in games

### Handling Nested Containers

A particularly interesting challenge in inventory systems is managing nested containers efficiently. When a player wants to find an item, the system needs to traverse potentially complex container hierarchies:

```typescript
// Enhanced container with path tracking
class EnhancedContainer extends Backpack {
  // Find an item and return its path in the container hierarchy
  findItemPath(itemId: string, currentPath: string[] = []): { item: Item, path: string[] } | null {
    // Check direct contents
    const index = this.contents.findIndex(item => item.id === itemId);
    
    if (index !== -1) {
      return { 
        item: this.contents[index],
        path: [...currentPath, `contents[${index}]`]
      };
    }
    
    // Check nested containers
    for (let i = 0; i < this.contents.length; i++) {
      const content = this.contents[i];
      
      if ('findItemPath' in content) {
        const container = content as EnhancedContainer;
        const result = container.findItemPath(
          itemId, 
          [...currentPath, `contents[${i}]`]
        );
        
        if (result) {
          return result;
        }
      }
    }
    
    return null;
  }
  
  // Extract an item from anywhere in the container hierarchy
  extractItem(itemId: string): Item | null {
    const result = this.findItemPath(itemId);
    
    if (!result) {
      return null;
    }
    
    // If the item is directly in this container
    if (result.path.length === 1) {
      return this.removeItem(itemId);
    }
    
    // Navigate to the container that holds the item
    let currentContainer: EnhancedContainer = this;
    for (let i = 0; i < result.path.length - 1; i++) {
      const pathSegment = result.path[i];
      const match = pathSegment.match(/contents\[(\d+)\]/);
      
      if (match) {
        const index = parseInt(match[1], 10);
        currentContainer = currentContainer.contents[index] as EnhancedContainer;
      }
    }
    
    // Remove the item from its direct container
    return currentContainer.removeItem(itemId);
  }
}
```

## Categorization and Indexing

RPG inventory systems often implement sophisticated categorization schemes to help players manage large collections of items:

```typescript
// Item categorization system
enum ItemCategory {
  WEAPON = "Weapon",
  ARMOR = "Armor",
  POTION = "Potion",
  SCROLL = "Scroll",
  TOOL = "Tool",
  TRINKET = "Trinket",
  MATERIAL = "Material",
  CONTAINER = "Container",
  MISCELLANEOUS = "Miscellaneous"
}

enum ItemRarity {
  COMMON = "Common",
  UNCOMMON = "Uncommon",
  RARE = "Rare",
  VERY_RARE = "Very Rare",
  LEGENDARY = "Legendary",
  ARTIFACT = "Artifact"
}

// Enhanced item with categorization
interface EnhancedItem extends Item {
  category: ItemCategory;
  rarity: ItemRarity;
  tags: string[];
}

// Inventory with indexing capabilities
class IndexedInventory {
  private items: Map<string, EnhancedItem> = new Map();
  private categoryIndices: Map<ItemCategory, Set<string>> = new Map();
  private rarityIndices: Map<ItemRarity, Set<string>> = new Map();
  private tagIndices: Map<string, Set<string>> = new Map();
  
  constructor() {
    // Initialize indices
    Object.values(ItemCategory).forEach(category => {
      this.categoryIndices.set(category as ItemCategory, new Set<string>());
    });
    
    Object.values(ItemRarity).forEach(rarity => {
      this.rarityIndices.set(rarity as ItemRarity, new Set<string>());
    });
  }
  
  addItem(item: EnhancedItem): void {
    // Add to main collection
    this.items.set(item.id, item);
    
    // Update indices
    this.categoryIndices.get(item.category)?.add(item.id);
    this.rarityIndices.get(item.rarity)?.add(item.id);
    
    // Update tag indices
    for (const tag of item.tags) {
      if (!this.tagIndices.has(tag)) {
        this.tagIndices.set(tag, new Set<string>());
      }
      this.tagIndices.get(tag)?.add(item.id);
    }
  }
  
  removeItem(itemId: string): EnhancedItem | undefined {
    const item = this.items.get(itemId);
    
    if (!item) {
      return undefined;
    }
    
    // Remove from main collection
    this.items.delete(itemId);
    
    // Update indices
    this.categoryIndices.get(item.category)?.delete(itemId);
    this.rarityIndices.get(item.rarity)?.delete(itemId);
    
    // Update tag indices
    for (const tag of item.tags) {
      this.tagIndices.get(tag)?.delete(itemId);
      // Clean up empty tag sets
      if (this.tagIndices.get(tag)?.size === 0) {
        this.tagIndices.delete(tag);
      }
    }
    
    return item;
  }
  
  // Efficient lookups using indices
  findByCategory(category: ItemCategory): EnhancedItem[] {
    const itemIds = this.categoryIndices.get(category) || new Set<string>();
    return Array.from(itemIds).map(id => this.items.get(id)!);
  }
  
  findByRarity(rarity: ItemRarity): EnhancedItem[] {
    const itemIds = this.rarityIndices.get(rarity) || new Set<string>();
    return Array.from(itemIds).map(id => this.items.get(id)!);
  }
  
  findByTag(tag: string): EnhancedItem[] {
    const itemIds = this.tagIndices.get(tag) || new Set<string>();
    return Array.from(itemIds).map(id => this.items.get(id)!);
  }
  
  // Complex queries using index intersection
  findByCriteria(
    categories?: ItemCategory[],
    rarities?: ItemRarity[],
    tags?: string[],
    minValue?: number,
    maxWeight?: number
  ): EnhancedItem[] {
    // Start with all items
    let candidateIds = new Set<string>(this.items.keys());
    
    // Filter by category if specified
    if (categories && categories.length > 0) {
      const categoryIds = new Set<string>();
      for (const category of categories) {
        const ids = this.categoryIndices.get(category) || new Set<string>();
        ids.forEach(id => categoryIds.add(id));
      }
      candidateIds = new Set<string>(
        [...candidateIds].filter(id => categoryIds.has(id))
      );
    }
    
    // Filter by rarity if specified
    if (rarities && rarities.length > 0) {
      const rarityIds = new Set<string>();
      for (const rarity of rarities) {
        const ids = this.rarityIndices.get(rarity) || new Set<string>();
        ids.forEach(id => rarityIds.add(id));
      }
      candidateIds = new Set<string>(
        [...candidateIds].filter(id => rarityIds.has(id))
      );
    }
    
    // Filter by tags if specified
    if (tags && tags.length > 0) {
      // Items must have ALL specified tags
      for (const tag of tags) {
        const tagIds = this.tagIndices.get(tag) || new Set<string>();
        candidateIds = new Set<string>(
          [...candidateIds].filter(id => tagIds.has(id))
        );
      }
    }
    
    // Convert IDs to items
    let result = [...candidateIds].map(id => this.items.get(id)!);
    
    // Apply non-indexed filters
    if (minValue !== undefined) {
      result = result.filter(item => item.value >= minValue);
    }
    
    if (maxWeight !== undefined) {
      result = result.filter(item => item.weight <= maxWeight);
    }
    
    return result;
  }
  
  // Statistics about the inventory
  getStatistics(): {
    totalItems: number;
    totalValue: number;
    totalWeight: number;
    categoryCounts: Record<ItemCategory, number>;
    rarityCounts: Record<ItemRarity, number>;
    mostCommonTags: {tag: string, count: number}[];
  } {
    const categoryCounts: Record<ItemCategory, number> = {} as Record<ItemCategory, number>;
    const rarityCounts: Record<ItemRarity, number> = {} as Record<ItemRarity, number>;
    const tagCounts: Record<string, number> = {};
    
    let totalValue = 0;
    let totalWeight = 0;
    
    // Initialize counters
    Object.values(ItemCategory).forEach(category => {
      categoryCounts[category as ItemCategory] = 0;
    });
    
    Object.values(ItemRarity).forEach(rarity => {
      rarityCounts[rarity as ItemRarity] = 0;
    });
    
    // Count items
    for (const item of this.items.values()) {
      totalValue += item.value * item.quantity;
      totalWeight += item.weight * item.quantity;
      
      categoryCounts[item.category] += item.quantity;
      rarityCounts[item.rarity] += item.quantity;
      
      for (const tag of item.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + item.quantity;
      }
    }
    
    // Calculate most common tags
    const mostCommonTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return {
      totalItems: Array.from(this.items.values()).reduce((sum, item) => sum + item.quantity, 0),
      totalValue,
      totalWeight,
      categoryCounts,
      rarityCounts,
      mostCommonTags
    };
  }
}
```

This implementation showcases several advanced indexing techniques:

1. **Multiple Indices**: Maintains separate indices for different item properties
2. **Set Operations**: Uses set operations for efficient filtering
3. **Composite Queries**: Combines multiple criteria for complex searches
4. **Statistical Analysis**: Provides aggregate data about the inventory

## The Knapsack Problem and Optimization

RPG inventory systems often involve optimization challenges that correspond to the famous Knapsack Problem in computer science. Players must decide which items to carry given weight limitations:

```typescript
// Item recommendation system based on the Knapsack algorithm
class InventoryOptimizer {
  /**
   * 0-1 Knapsack algorithm implementation
   * Determines the most valuable combination of items within a weight limit
   */
  static optimizeForValue(
    items: EnhancedItem[],
    weightLimit: number
  ): {
    selectedItems: EnhancedItem[];
    totalValue: number;
    totalWeight: number;
  } {
    // Create arrays of weights and values
    const weights: number[] = items.map(item => item.weight);
    const values: number[] = items.map(item => item.value);
    
    // Create DP table
    const n = items.length;
    const dp: number[][] = Array(n + 1)
      .fill(null)
      .map(() => Array(weightLimit + 1).fill(0));
    
    // Fill the dp table
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= weightLimit; w++) {
        // If current item is too heavy, skip it
        if (weights[i - 1] > w) {
          dp[i][w] = dp[i - 1][w];
        } else {
          // Max of including or excluding current item
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - weights[i - 1]] + values[i - 1]
          );
        }
      }
    }
    
    // Backtrack to find selected items
    const selectedItems: EnhancedItem[] = [];
    let w = weightLimit;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selectedItems.push(items[i - 1]);
        w -= weights[i - 1];
      }
    }
    
    // Calculate totals
    const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight, 0);
    const totalValue = selectedItems.reduce((sum, item) => sum + item.value, 0);
    
    return {
      selectedItems,
      totalValue,
      totalWeight
    };
  }
  
  /**
   * Multi-objective optimization
   * Balances value, weight, and utility
   */
  static optimizeForMission(
    items: EnhancedItem[],
    weightLimit: number,
    missionType: string,
    utilityScores: Map<string, number> // Tag-based utility scores
  ): {
    selectedItems: EnhancedItem[];
    totalValue: number;
    totalWeight: number;
    utilityScore: number;
  } {
    // Calculate utility score for each item based on tags
    const itemUtility: number[] = items.map(item => {
      let utility = 0;
      
      // Add utility from tags
      for (const tag of item.tags) {
        utility += utilityScores.get(tag) || 0;
      }
      
      // Bonus for mission-specific items
      if (item.tags.includes(missionType)) {
        utility *= 1.5;
      }
      
      return utility;
    });
    
    // Create a composite score (normalized utility + value)
    const maxUtility = Math.max(...itemUtility);
    const maxValue = Math.max(...items.map(item => item.value));
    
    const compositeScores: number[] = items.map((item, index) => {
      const normalizedUtility = itemUtility[index] / maxUtility;
      const normalizedValue = item.value / maxValue;
      
      // Weighted sum of utility and value
      return (normalizedUtility * 0.7) + (normalizedValue * 0.3);
    });
    
    // Now use the knapsack algorithm with composite scores
    const n = items.length;
    const weights: number[] = items.map(item => item.weight);
    
    const dp: number[][] = Array(n + 1)
      .fill(null)
      .map(() => Array(weightLimit + 1).fill(0));
    
    // Fill the dp table
    for (let i = 1; i <= n; i++) {
      for (let w = 0; w <= weightLimit; w++) {
        if (weights[i - 1] > w) {
          dp[i][w] = dp[i - 1][w];
        } else {
          dp[i][w] = Math.max(
            dp[i - 1][w],
            dp[i - 1][w - weights[i - 1]] + compositeScores[i - 1]
          );
        }
      }
    }
    
    // Backtrack to find selected items
    const selectedItems: EnhancedItem[] = [];
    let w = weightLimit;
    for (let i = n; i > 0; i--) {
      if (dp[i][w] !== dp[i - 1][w]) {
        selectedItems.push(items[i - 1]);
        w -= weights[i - 1];
      }
    }
    
    // Calculate totals
    const totalWeight = selectedItems.reduce((sum, item) => sum + item.weight, 0);
    const totalValue = selectedItems.reduce((sum, item) => sum + item.value, 0);
    const utilityScore = selectedItems.reduce((sum, item, index) => {
      const itemIndex = items.indexOf(item);
      return sum + itemUtility[itemIndex];
    }, 0);
    
    return {
      selectedItems,
      totalValue,
      totalWeight,
      utilityScore
    };
  }
}
```

## Sorting and Filtering Algorithms

Inventory management in RPGs often requires sophisticated sorting and filtering capabilities:

```typescript
// Sorting and filtering utilities for inventory management
class InventorySorter {
  static readonly SORT_CRITERIA = {
    NAME: "name",
    VALUE: "value",
    WEIGHT: "weight",
    VALUE_PER_WEIGHT: "valuePerWeight",
    RARITY: "rarity",
    CATEGORY: "category"
  } as const;
  
  static readonly SORT_DIRECTION = {
    ASCENDING: "ascending",
    DESCENDING: "descending"
  } as const;
  
  /**
   * Sort items by multiple criteria
   */
  static sortItems(
    items: EnhancedItem[],
    criteria: (typeof InventorySorter.SORT_CRITERIA)[keyof typeof InventorySorter.SORT_CRITERIA][],
    directions: (typeof InventorySorter.SORT_DIRECTION)[keyof typeof InventorySorter.SORT_DIRECTION][]
  ): EnhancedItem[] {
    return [...items].sort((a, b) => {
      // Multi-level sort
      for (let i = 0; i < criteria.length; i++) {
        const criterion = criteria[i];
        const direction = directions[i];
        const multiplier = direction === "ascending" ? 1 : -1;
        
        let comparison = 0;
        
        switch (criterion) {
          case "name":
            comparison = a.name.localeCompare(b.name);
            break;
          case "value":
            comparison = a.value - b.value;
            break;
          case "weight":
            comparison = a.weight - b.weight;
            break;
          case "valuePerWeight":
            comparison = (a.value / a.weight) - (b.value / b.weight);
            break;
          case "rarity":
            const rarityOrder = Object.values(ItemRarity);
            comparison = rarityOrder.indexOf(a.rarity) - rarityOrder.indexOf(b.rarity);
            break;
          case "category":
            comparison = a.category.localeCompare(b.category);
            break;
        }
        
        // If this criterion produces a non-zero comparison, return it
        if (comparison !== 0) {
          return comparison * multiplier;
        }
      }
      
      // If all criteria are equal
      return 0;
    });
  }
  
  /**
   * Filter items based on predicates
   */
  static filterItems(
    items: EnhancedItem[],
    predicates: ((item: EnhancedItem) => boolean)[]
  ): EnhancedItem[] {
    return items.filter(item => predicates.every(predicate => predicate(item)));
  }
  
  /**
   * Common filter predicates 
   */
  static readonly FILTERS = {
    isEquippable: (item: EnhancedItem) => (
      item.category === ItemCategory.WEAPON || item.category === ItemCategory.ARMOR
    ),
    isConsumable: (item: EnhancedItem) => (
      item.category === ItemCategory.POTION || item.category === ItemCategory.SCROLL
    ),
    isMaterial: (item: EnhancedItem) => item.category === ItemCategory.MATERIAL,
    isValuable: (item: EnhancedItem) => item.value / item.weight > 100,
    isLightweight: (item: EnhancedItem) => item.weight < 1,
    hasTag: (tag: string) => (item: EnhancedItem) => item.tags.includes(tag),
    minRarity: (rarity: ItemRarity) => (item: EnhancedItem) => {
      const rarityOrder = Object.values(ItemRarity);
      return rarityOrder.indexOf(item.rarity) >= rarityOrder.indexOf(rarity);
    }
  };
  
  /**
   * Group items by a property
   */
  static groupBy<K extends keyof EnhancedItem>(
    items: EnhancedItem[],
    property: K
  ): Map<EnhancedItem[K], EnhancedItem[]> {
    const groups = new Map<EnhancedItem[K], EnhancedItem[]>();
    
    for (const item of items) {
      const key = item[property];
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(item);
    }
    
    return groups;
  }
}
```

## Auto-Organization Algorithms

Advanced inventory systems often include auto-organization features to help players efficiently manage their collections:

```typescript
// Auto-organization strategies for inventories
class InventoryOrganizer {
  /**
   * Pack items optimally into containers based on weight
   * Uses a best-fit decreasing algorithm
   */
  static packContainers(
    items: EnhancedItem[],
    containers: Container[]
  ): Map<Container, EnhancedItem[]> {
    // Sort containers by capacity (ascending)
    const sortedContainers = [...containers].sort(
      (a, b) => a.capacity - b.capacity
    );
    
    // Sort items by weight (descending)
    const sortedItems = [...items].sort(
      (a, b) => b.weight - a.weight
    );
    
    // Track remaining capacity of each container
    const containerCapacities = new Map<Container, number>();
    sortedContainers.forEach(container => {
      containerCapacities.set(container, container.capacity);
    });
    
    // Map of container to assigned items
    const assignments = new Map<Container, EnhancedItem[]>();
    sortedContainers.forEach(container => {
      assignments.set(container, []);
    });
    
    // Assign each item using best-fit strategy
    for (const item of sortedItems) {
      // Find the smallest container that can hold this item
      let bestContainer: Container | null = null;
      let bestRemainingCapacity = Infinity;
      
      for (const [container, remainingCapacity] of containerCapacities.entries()) {
        if (remainingCapacity >= item.weight && remainingCapacity < bestRemainingCapacity) {
          bestContainer = container;
          bestRemainingCapacity = remainingCapacity;
        }
      }
      
      // If found a suitable container
      if (bestContainer) {
        // Update container capacity
        containerCapacities.set(
          bestContainer, 
          containerCapacities.get(bestContainer)! - item.weight
        );
        
        // Assign item to container
        assignments.get(bestContainer)!.push(item);
      }
      // If no container can hold this item, it remains unassigned
    }
    
    return assignments;
  }
  
  /**
   * Organize inventory by category into specialized containers
   */
  static organizeByCategory(
    items: EnhancedItem[],
    categoryContainers: Map<ItemCategory, Container>
  ): Map<Container, EnhancedItem[]> {
    const assignments = new Map<Container, EnhancedItem[]>();
    
    // Initialize assignment maps
    for (const container of categoryContainers.values()) {
      assignments.set(container, []);
    }
    
    // Default container for categories without a specific container
    const overflow: EnhancedItem[] = [];
    
    // Assign items to appropriate containers
    for (const item of items) {
      const container = categoryContainers.get(item.category);
      
      if (container) {
        const currentWeight = assignments.get(container)!.reduce(
          (sum, item) => sum + item.weight, 0
        );
        
        // If there's room in the category container
        if (currentWeight + item.weight <= container.capacity) {
          assignments.get(container)!.push(item);
        } else {
          // Container full, add to overflow
          overflow.push(item);
        }
      } else {
        // No container for this category
        overflow.push(item);
      }
    }
    
    return assignments;
  }
  
  /**
   * Grid-based inventory organization
   * Common in games like Diablo or Path of Exile
   */
  static organizeGrid(
    items: {
      item: EnhancedItem;
      width: number;
      height: number;
    }[],
    gridWidth: number,
    gridHeight: number
  ): {
    grid: (EnhancedItem | null)[][];
    unplacedItems: EnhancedItem[];
  } {
    // Initialize empty grid
    const grid: (EnhancedItem | null)[][] = Array(gridHeight)
      .fill(null)
      .map(() => Array(gridWidth).fill(null));
    
    // Sort items by area (descending)
    const sortedItems = [...items].sort(
      (a, b) => (b.width * b.height) - (a.width * a.height)
    );
    
    const unplacedItems: EnhancedItem[] = [];
    
    // Try to place each item
    for (const {item, width, height} of sortedItems) {
      let placed = false;
      
      // Try each possible position in the grid
      for (let y = 0; y <= gridHeight - height && !placed; y++) {
        for (let x = 0; x <= gridWidth - width && !placed; x++) {
          // Check if this region is empty
          let canPlace = true;
          
          for (let dy = 0; dy < height && canPlace; dy++) {
            for (let dx = 0; dx < width && canPlace; dx++) {
              if (grid[y + dy][x + dx] !== null) {
                canPlace = false;
              }
            }
          }
          
          // If we can place the item here
          if (canPlace) {
            // Place the item reference in all cells it occupies
            for (let dy = 0; dy < height; dy++) {
              for (let dx = 0; dx < width; dx++) {
                grid[y + dy][x + dx] = item;
              }
            }
            
            placed = true;
          }
        }
      }
      
      // If we couldn't place this item
      if (!placed) {
        unplacedItems.push(item);
      }
    }
    
    return { grid, unplacedItems };
  }
}
```

## Theoretical Insights

RPG inventory systems illuminate several key theoretical concepts:

1. **Hierarchical Data Structures**: The composite pattern provides a flexible way to model container relationships.

2. **Indexing and Search Optimization**: Maintaining separate indices enables efficient retrieval of items by different properties.

3. **NP-Hard Optimization Problems**: The knapsack problem and bin packing problem demonstrate how computational complexity theory manifests in games.

4. **Space-Time Tradeoffs**: Indexing trades memory for faster search times, an essential concept in database design.

5. **Multi-criteria Optimization**: Balancing competing factors (value, weight, utility) mirrors real-world resource allocation problems.

## Conclusion

The inventory systems of RPGs provide rich examples of collection management algorithms and data structures in action. From the elegant simplicity of the composite pattern to the computational complexity of knapsack optimization, these systems demonstrate solutions to problems that extend far beyond game development.

When designing any collection management system—whether for digital assets, physical inventory, or information architecture—the patterns established in RPG inventory systems offer battle-tested approaches for organizing, searching, and optimizing resources under constraints. The next time you implement a storage system or collection manager, consider how the adventurers of D&D have been efficiently managing their magical items and potions for decades.weight);
    const values: number[] = items.map(item => item.