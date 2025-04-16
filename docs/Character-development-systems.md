# Character Development Systems: Optimization and Decision Theory

## Introduction

Character progression systems in RPGs provide an elegant demonstration of optimization algorithms, decision trees, and multi-objective optimization problems. From the level-based advancement of D&D to the skill trees of digital RPGs, these systems illustrate how computational decision theory can model complex choices with interrelated variables and constraints.

## Decision Trees in Character Advancement

Character advancement in RPGs can be modeled as traversing a decision tree, where each node represents a character state and each edge represents a choice:

```typescript
// Basic types for character advancement
type Attribute = "strength" | "dexterity" | "constitution" | "intelligence" | "wisdom" | "charisma";
type CharacterClass = "fighter" | "wizard" | "rogue" | "cleric" | "ranger" | "bard";
type Feat = string;

// Node in the character build decision tree
interface CharacterBuildNode {
  level: number;
  attributes: Record<Attribute, number>;
  characterClass: CharacterClass;
  secondaryClass?: CharacterClass;
  feats: Set<Feat>;
  
  // Evaluation metrics
  combatPower: number;
  spellcastingPower: number;
  skillUtility: number;
  survivalRating: number;
}

// Character build option (edge in the decision tree)
interface BuildOption {
  type: "attribute" | "feat" | "class" | "multiclass";
  name: string;
  applyToBuild: (build: CharacterBuildNode) => CharacterBuildNode;
  requirementsMet: (build: CharacterBuildNode) => boolean;
  description: string;
}

// Character build optimizer
class CharacterBuildOptimizer {
  // Creates initial build state
  createInitialBuild(): CharacterBuildNode {
    return {
      level: 1,
      attributes: {
        strength: 10,
        dexterity: 10,
        constitution: 10,
        intelligence: 10,
        wisdom: 10,
        charisma: 10
      },
      characterClass: "fighter",
      feats: new Set(),
      
      combatPower: 0,
      spellcastingPower: 0,
      skillUtility: 0,
      survivalRating: 0
    };
  }
  
  // Gets available options for current build state
  getAvailableOptions(build: CharacterBuildNode): BuildOption[] {
    const options: BuildOption[] = [];
    
    // Class selection (only at level 1)
    if (build.level === 1 && build.feats.size === 0) {
      const classes: CharacterClass[] = ["fighter", "wizard", "rogue", "cleric", "ranger", "bard"];
      
      for (const characterClass of classes) {
        options.push({
          type: "class",
          name: `Select Class: ${characterClass}`,
          applyToBuild: (currentBuild) => {
            const newBuild = { ...currentBuild, characterClass };
            this.evaluateBuild(newBuild);
            return newBuild;
          },
          requirementsMet: () => true,
          description: `Become a ${characterClass}.`
        });
      }
    }
    
    // Attribute improvements (every 4 levels)
    if (build.level % 4 === 0) {
      for (const attribute of Object.keys(build.attributes) as Attribute[]) {
        options.push({
          type: "attribute",
          name: `Improve ${attribute}`,
          applyToBuild: (currentBuild) => {
            const newBuild = { 
              ...currentBuild,
              attributes: { 
                ...currentBuild.attributes,
                [attribute]: currentBuild.attributes[attribute] + 1 
              }
            };
            this.evaluateBuild(newBuild);
            return newBuild;
          },
          requirementsMet: () => true,
          description: `Increase ${attribute} by 1.`
        });
      }
    }
    
    // Feat selection (every 3 levels)
    if (build.level % 3 === 0) {
      const availableFeats = [
        "Power Attack", "Weapon Focus", "Spell Focus", 
        "Toughness", "Dodge", "Lightning Reflexes"
      ];
      
      for (const feat of availableFeats) {
        if (!build.feats.has(feat)) {
          options.push({
            type: "feat",
            name: `Select Feat: ${feat}`,
            applyToBuild: (currentBuild) => {
              const newBuild = { 
                ...currentBuild,
                feats: new Set(currentBuild.feats).add(feat)
              };
              this.evaluateBuild(newBuild);
              return newBuild;
            },
            requirementsMet: (currentBuild) => this.featRequirementsMet(feat, currentBuild),
            description: `Gain the ${feat} feat.`
          });
        }
      }
    }
    
    return options.filter(option => option.requirementsMet(build));
  }
  
  // Check if feat requirements are met
  featRequirementsMet(feat: string, build: CharacterBuildNode): boolean {
    switch (feat) {
      case "Power Attack":
        return build.attributes.strength >= 13;
      case "Spell Focus":
        return ["wizard", "cleric"].includes(build.characterClass);
      default:
        return true;
    }
  }
  
  // Evaluate build effectiveness
  evaluateBuild(build: CharacterBuildNode): void {
    // Combat power calculation
    let combatPower = 0;
    
    // Base attack bonus (simplified)
    if (["fighter", "ranger"].includes(build.characterClass)) {
      combatPower += build.level;
    } else if (["rogue", "bard", "cleric"].includes(build.characterClass)) {
      combatPower += Math.floor(build.level * 0.75);
    } else {
      combatPower += Math.floor(build.level * 0.5);
    }
    
    // Add strength or dexterity modifier
    const strMod = Math.floor((build.attributes.strength - 10) / 2);
    const dexMod = Math.floor((build.attributes.dexterity - 10) / 2);
    combatPower += Math.max(strMod, dexMod);
    
    // Add combat-related feats
    if (build.feats.has("Power Attack")) combatPower += 2;
    if (build.feats.has("Weapon Focus")) combatPower += 2;
    
    // Spellcasting power calculation
    let spellcastingPower = 0;
    
    // Base spellcasting (simplified)
    if (["wizard", "cleric"].includes(build.characterClass)) {
      spellcastingPower += build.level;
      
      // Add relevant ability modifier
      if (build.characterClass === "wizard") {
        spellcastingPower += Math.floor((build.attributes.intelligence - 10) / 2);
      } else {
        spellcastingPower += Math.floor((build.attributes.wisdom - 10) / 2);
      }
    } else if (["bard", "ranger"].includes(build.characterClass)) {
      // Partial spellcasters
      if (build.level >= 4) {
        spellcastingPower += Math.floor((build.level - 3) * 0.5);
      }
    }
    
    // Add spellcasting-related feats
    if (build.feats.has("Spell Focus")) spellcastingPower += 2;
    
    // Skill utility calculation (simplified)
    let skillUtility = 0;
    
    if (build.characterClass === "rogue") {
      skillUtility += build.level * 8;
    } else if (build.characterClass === "bard") {
      skillUtility += build.level * 6;
    } else if (build.characterClass === "ranger") {
      skillUtility += build.level * 4;
    } else {
      skillUtility += build.level * 2;
    }
    
    // Survival rating calculation (simplified)
    let survivalRating = 0;
    
    // Base HP
    if (["fighter"].includes(build.characterClass)) {
      survivalRating += build.level * 10;
    } else if (["cleric", "ranger"].includes(build.characterClass)) {
      survivalRating += build.level * 8;
    } else if (["rogue", "bard"].includes(build.characterClass)) {
      survivalRating += build.level * 6;
    } else {
      survivalRating += build.level * 4;
    }
    
    // Add constitution modifier
    survivalRating += build.level * Math.floor((build.attributes.constitution - 10) / 2);
    
    // Add survival-related feats
    if (build.feats.has("Toughness")) survivalRating += 3 * build.level;
    if (build.feats.has("Dodge")) survivalRating += 5;
    
    // Update build with calculated metrics
    build.combatPower = combatPower;
    build.spellcastingPower = spellcastingPower;
    build.skillUtility = skillUtility;
    build.survivalRating = survivalRating;
  }
  
  // Level up a character build
  levelUp(build: CharacterBuildNode): CharacterBuildNode {
    return {
      ...build,
      level: build.level + 1
    };
  }
  
  // Find optimal build using breadth-first search
  optimizeBuild(
    targetLevel: number,
    optimizationGoals: {
      combat: number;
      spellcasting: number;
      skills: number;
      survival: number;
    }
  ): {
    build: CharacterBuildNode;
    path: BuildOption[];
  } {
    // Normalize optimization goals
    const total = optimizationGoals.combat + optimizationGoals.spellcasting + 
                  optimizationGoals.skills + optimizationGoals.survival;
    
    const normalizedGoals = {
      combat: optimizationGoals.combat / total,
      spellcasting: optimizationGoals.spellcasting / total,
      skills: optimizationGoals.skills / total,
      survival: optimizationGoals.survival / total
    };
    
    // Initialize with starting build
    const initialBuild = this.createInitialBuild();
    this.evaluateBuild(initialBuild);
    
    let currentBuild = initialBuild;
    const buildPath: BuildOption[] = [];
    
    // Greedy optimization for demonstration purposes
    // In a full implementation, this would use a more sophisticated algorithm
    for (let currentLevel = 1; currentLevel <= targetLevel; currentLevel++) {
      // Get available options
      const options = this.getAvailableOptions(currentBuild);
      
      if (options.length === 0) {
        // Level up if no options available
        currentBuild = this.levelUp(currentBuild);
        this.evaluateBuild(currentBuild);
        continue;
      }
      
      // Find best option according to goals
      let bestOption = options[0];
      let bestScore = -Infinity;
      
      for (const option of options) {
        const newBuild = option.applyToBuild(currentBuild);
        const score = this.scoreBuild(newBuild, normalizedGoals);
        
        if (score > bestScore) {
          bestOption = option;
          bestScore = score;
        }
      }
      
      // Apply best option
      currentBuild = bestOption.applyToBuild(currentBuild);
      buildPath.push(bestOption);
      
      // Level up if needed
      if (currentBuild.level < currentLevel) {
        currentBuild = this.levelUp(currentBuild);
        this.evaluateBuild(currentBuild);
      }
    }
    
    return {
      build: currentBuild,
      path: buildPath
    };
  }
  
  // Score a build based on optimization goals
  scoreBuild(
    build: CharacterBuildNode,
    goals: {
      combat: number;
      spellcasting: number;
      skills: number;
      survival: number;
    }
  ): number {
    // Normalize metrics to 0-1 scale
    const normalizedCombat = build.combatPower / 100;
    const normalizedSpellcasting = build.spellcastingPower / 100;
    const normalizedSkills = build.skillUtility / 100;
    const normalizedSurvival = build.survivalRating / 100;
    
    // Weighted sum based on goals
    return (
      normalizedCombat * goals.combat +
      normalizedSpellcasting * goals.spellcasting +
      normalizedSkills * goals.skills +
      normalizedSurvival * goals.survival
    );
  }
  
  // Generate a character build description
  describeBuild(build: CharacterBuildNode): string {
    let description = `Level ${build.level} ${build.characterClass}`;
    
    if (build.secondaryClass) {
      description += `/${build.secondaryClass}`;
    }
    
    description += "\n\nAttributes:";
    for (const [attr, value] of Object.entries(build.attributes)) {
      const modifier = Math.floor((value - 10) / 2);
      description += `\n- ${attr}: ${value} (${modifier >= 0 ? '+' : ''}${modifier})`;
    }
    
    description += "\n\nFeats:";
    if (build.feats.size === 0) {
      description += "\n- None";
    } else {
      for (const feat of build.feats) {
        description += `\n- ${feat}`;
      }
    }
    
    description += "\n\nPerformance Metrics:";
    description += `\n- Combat Power: ${build.combatPower.toFixed(1)}`;
    description += `\n- Spellcasting Power: ${build.spellcastingPower.toFixed(1)}`;
    description += `\n- Skill Utility: ${build.skillUtility.toFixed(1)}`;
    description += `\n- Survival Rating: ${build.survivalRating.toFixed(1)}`;
    
    return description;
  }
}
```

This implementation demonstrates how character advancement can be modeled as navigating a decision tree with different options at each level. The optimizer evaluates each possible choice to find the best path based on specified optimization goals.

## Utility Theory in Character Decision-Making

Different players value different aspects of gameplay. We can model these preferences using utility theory:

```typescript
// Define player preference profiles
interface PlayerPreferenceProfile {
  name: string;
  combatUtility: (value: number) => number;
  spellcastingUtility: (value: number) => number;
  skillUtility: (value: number) => number;
  survivalUtility: (value: number) => number;
  riskAversion: number; // 0-1, higher means more risk-averse
}

// Character recommendation system
class CharacterRecommender {
  private optimizer: CharacterBuildOptimizer;
  private profiles: Map<string, PlayerPreferenceProfile> = new Map();
  
  constructor(optimizer: CharacterBuildOptimizer) {
    this.optimizer = optimizer;
    
    // Initialize with some default profiles
    this.addProfile({
      name: "Power Gamer",
      combatUtility: (v) => Math.pow(v, 1.5), // Favors high combat power
      spellcastingUtility: (v) => v,
      skillUtility: (v) => Math.sqrt(v), // Diminishing returns on skills
      survivalUtility: (v) => v,
      riskAversion: 0.2 // Low risk aversion
    });
    
    this.addProfile({
      name: "Balanced Player",
      combatUtility: (v) => v,
      spellcastingUtility: (v) => v,
      skillUtility: (v) => v,
      survivalUtility: (v) => v,
      riskAversion: 0.5 // Moderate risk aversion
    });
    
    this.addProfile({
      name: "Skill Monkey",
      combatUtility: (v) => Math.sqrt(v), // Diminishing returns on combat
      spellcastingUtility: (v) => Math.sqrt(v), // Diminishing returns on spellcasting
      skillUtility: (v) => Math.pow(v, 2), // Strongly favors skills
      survivalUtility: (v) => v,
      riskAversion: 0.4 // Moderate risk aversion
    });
  }
  
  addProfile(profile: PlayerPreferenceProfile): void {
    this.profiles.set(profile.name, profile);
  }
  
  // Recommend a build based on player profile
  recommendBuild(
    profileName: string,
    targetLevel: number
  ): {
    build: CharacterBuildNode;
    path: BuildOption[];
    utilityScore: number;
  } {
    const profile = this.profiles.get(profileName);
    
    if (!profile) {
      throw new Error(`Profile "${profileName}" not found`);
    }
    
    // Convert utility functions to weights
    const sampleValue = 50; // Sample value to compare utilities
    
    const combatUtility = profile.combatUtility(sampleValue);
    const spellcastingUtility = profile.spellcastingUtility(sampleValue);
    const skillsUtility = profile.skillUtility(sampleValue);
    const survivalUtility = profile.survivalUtility(sampleValue);
    
    const total = combatUtility + spellcastingUtility + skillsUtility + survivalUtility;
    
    // Optimize with profile-specific weights
    const result = this.optimizer.optimizeBuild(targetLevel, {
      combat: combatUtility / total,
      spellcasting: spellcastingUtility / total,
      skills: skillsUtility / total,
      survival: survivalUtility / total
    });
    
    // Calculate utility score
    const utilityScore = this.calculateUtility(result.build, profile);
    
    return {
      build: result.build,
      path: result.path,
      utilityScore
    };
  }
  
  // Calculate utility for a specific build and profile
  private calculateUtility(build: CharacterBuildNode, profile: PlayerPreferenceProfile): number {
    // Normalize metrics (simplified)
    const normalizedCombat = build.combatPower / 100;
    const normalizedSpellcasting = build.spellcastingPower / 100;
    const normalizedSkills = build.skillUtility / 100;
    const normalizedSurvival = build.survivalRating / 100;
    
    // Apply utility functions
    const combatUtility = profile.combatUtility(normalizedCombat * 100);
    const spellcastingUtility = profile.spellcastingUtility(normalizedSpellcasting * 100);
    const skillsUtility = profile.skillUtility(normalizedSkills * 100);
    const survivalUtility = profile.survivalUtility(normalizedSurvival * 100);
    
    // Risk adjustment
    const riskFactor = (normalizedCombat - normalizedSurvival + 0.5) * 2;
    const riskAdjustment = 1 - (profile.riskAversion * riskFactor * 0.1);
    
    // Total utility
    return (combatUtility + spellcastingUtility + skillsUtility + survivalUtility) * riskAdjustment;
  }
}
```

This implementation demonstrates how utility functions can model different player preferences, leading to personalized character recommendations.

## Pareto Frontiers in Character Optimization

Character builds often involve tradeoffs between competing objectives. Pareto frontier analysis helps identify non-dominated solutions:

```typescript
// Pareto frontier calculator for character builds
class ParetoFrontierCalculator {
  // Check if a build is dominated by another
  private isDominated(
    build: CharacterBuildNode,
    otherBuild: CharacterBuildNode
  ): boolean {
    // A build is dominated if another build is better in all metrics
    return (
      otherBuild.combatPower >= build.combatPower &&
      otherBuild.spellcastingPower >= build.spellcastingPower &&
      otherBuild.skillUtility >= build.skillUtility &&
      otherBuild.survivalRating >= build.survivalRating &&
      // And strictly better in at least one
      (otherBuild.combatPower > build.combatPower ||
       otherBuild.spellcastingPower > build.spellcastingPower ||
       otherBuild.skillUtility > build.skillUtility ||
       otherBuild.survivalRating > build.survivalRating)
    );
  }
  
  // Calculate Pareto frontier from a set of builds
  calculateParetoFrontier(builds: CharacterBuildNode[]): CharacterBuildNode[] {
    const frontier: CharacterBuildNode[] = [];
    
    for (const build of builds) {
      let isDominated = false;
      
      // Check if this build is dominated by any build already in frontier
      for (const frontierBuild of frontier) {
        if (this.isDominated(build, frontierBuild)) {
          isDominated = true;
          break;
        }
      }
      
      if (!isDominated) {
        // Remove any frontier builds dominated by this build
        for (let i = frontier.length - 1; i >= 0; i--) {
          if (this.isDominated(frontier[i], build)) {
            frontier.splice(i, 1);
          }
        }
        
        // Add this build to frontier
        frontier.push(build);
      }
    }
    
    return frontier;
  }
}
```

The Pareto frontier consists of all character builds that are not strictly worse than any other build in all metrics. These represent the optimal tradeoffs between different character aspects.

## Bounded Rationality in Character Optimization

In practice, players don't evaluate every possible character build. They use heuristics and satisficing approaches:

```typescript
// Character optimizer with bounded rationality
class BoundedRationalityOptimizer {
  private optimizer: CharacterBuildOptimizer;
  private timeLimitMs: number;
  private evaluationLimit: number;
  
  constructor(
    optimizer: CharacterBuildOptimizer,
    timeLimitMs: number = 1000,
    evaluationLimit: number = 100
  ) {
    this.optimizer = optimizer;
    this.timeLimitMs = timeLimitMs;
    this.evaluationLimit = evaluationLimit;
  }
  
  // Optimize with limited computational resources
  optimizeBuildWithBounds(
    targetLevel: number,
    optimizationGoals: {
      combat: number;
      spellcasting: number;
      skills: number;
      survival: number;
    }
  ): {
    build: CharacterBuildNode;
    evaluationsPerformed: number;
    isOptimal: boolean;
  } {
    const startTime = Date.now();
    let evaluationsPerformed = 0;
    
    // Track best build seen so far
    let bestBuild = this.optimizer.createInitialBuild();
    let bestScore = -Infinity;
    
    // Generate some candidate builds (simplified)
    const candidates = this.generateCandidates(targetLevel, 1000);
    
    for (const build of candidates) {
      // Check time and evaluation limits
      if (Date.now() - startTime > this.timeLimitMs || 
          evaluationsPerformed >= this.evaluationLimit) {
        break;
      }
      
      evaluationsPerformed++;
      
      // Score the build
      const score = this.optimizer.scoreBuild(build, optimizationGoals);
      
      if (score > bestScore) {
        bestBuild = build;
        bestScore = score;
      }
    }
    
    // If we evaluated all candidates without hitting limits, solution is optimal
    const isOptimal = evaluationsPerformed >= candidates.length;
    
    return {
      build: bestBuild,
      evaluationsPerformed,
      isOptimal
    };
  }
  
  // Generate candidate builds (simplified)
  private generateCandidates(targetLevel: number, count: number): CharacterBuildNode[] {
    // In a real implementation, this would use heuristics
    // For demonstration, we'll return a simple array
    const candidates: CharacterBuildNode[] = [];
    
    for (let i = 0; i < count; i++) {
      candidates.push(this.optimizer.createInitialBuild());
    }
    
    return candidates;
  }
}
```

This bounded rationality approach mirrors how real players make decisions: they explore a limited subset of possibilities and choose the best option they find within their time constraints.

## Theoretical Insights

RPG character development systems illustrate several key concepts from decision theory and optimization:

1. **Multi-objective Optimization**: Balancing competing character attributes (combat, spellcasting, skills, survival)

2. **Decision Trees**: Modeling sequential choices in character development where each level presents new options

3. **Utility Theory**: Quantifying subjective player preferences for different gameplay styles

4. **Pareto Efficiency**: Identifying character builds that represent optimal tradeoffs

5. **Bounded Rationality**: Making "good enough" decisions under computational and cognitive constraints

## Practical Applications

The algorithms and approaches used in RPG character optimization have broad applications:

1. **Resource Allocation**: Similar techniques apply to allocating limited resources across competing needs

2. **Portfolio Optimization**: Investment strategies use multi-objective optimization with risk/reward tradeoffs

3. **Product Configuration**: Customizing products to meet customer needs uses similar decision frameworks

4. **Career Planning**: Sequential decision-making under constraints mirrors character advancement

5. **Team Composition**: Building balanced teams with complementary skills uses similar principles

## Conclusion

Character development systems in RPGs demonstrate practical applications of optimization algorithms, decision theory, and utility models. They provide elegant solutions to complex multi-objective optimization problems within constrained environments. The techniques used in these systems—from decision trees to Pareto frontier analysis—extend far beyond gaming.

By studying these systems, software developers gain valuable insight into designing robust decision-making algorithms that balance competing objectives, handle sequential decisions, and account for subjective user preferences. The next time you're designing a system that requires making optimal choices with limited resources, consider how the humble character sheet might provide inspiration for your approach.