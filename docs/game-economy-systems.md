# Game Economy Systems: Resource Allocation and Market Dynamics

## Introduction

In-game economies in RPGs provide fascinating examples of economic theory, market dynamics, and resource allocation algorithms. From the simple gold-based markets of classic RPGs to the complex player-driven economies of MMORPGs, these systems demonstrate economic principles that translate directly to real-world software applications for finance, logistics, and resource management.

## Virtual Currency and Value Systems

At the foundation of most RPG economies is a virtual currency system with exchange rates:

```typescript
// Basic currency types
enum CurrencyType {
  GOLD = "gold",
  SILVER = "silver",
  COPPER = "copper",
  PLATINUM = "platinum",
  FACTION_TOKEN = "faction_token",
  PREMIUM_CURRENCY = "premium_currency"
}

// Currency conversion rates
const CURRENCY_CONVERSION: Record<CurrencyType, Record<CurrencyType, number | null>> = {
  [CurrencyType.COPPER]: {
    [CurrencyType.COPPER]: 1,
    [CurrencyType.SILVER]: 0.1,
    [CurrencyType.GOLD]: 0.01,
    [CurrencyType.PLATINUM]: 0.001,
    [CurrencyType.FACTION_TOKEN]: null, // Cannot convert
    [CurrencyType.PREMIUM_CURRENCY]: null // Cannot convert
  },
  [CurrencyType.SILVER]: {
    [CurrencyType.COPPER]: 10,
    [CurrencyType.SILVER]: 1,
    [CurrencyType.GOLD]: 0.1,
    [CurrencyType.PLATINUM]: 0.01,
    [CurrencyType.FACTION_TOKEN]: null,
    [CurrencyType.PREMIUM_CURRENCY]: null
  },
  [CurrencyType.GOLD]: {
    [CurrencyType.COPPER]: 100,
    [CurrencyType.SILVER]: 10,
    [CurrencyType.GOLD]: 1,
    [CurrencyType.PLATINUM]: 0.1,
    [CurrencyType.FACTION_TOKEN]: null,
    [CurrencyType.PREMIUM_CURRENCY]: null
  },
  [CurrencyType.PLATINUM]: {
    [CurrencyType.COPPER]: 1000,
    [CurrencyType.SILVER]: 100,
    [CurrencyType.GOLD]: 10,
    [CurrencyType.PLATINUM]: 1,
    [CurrencyType.FACTION_TOKEN]: null,
    [CurrencyType.PREMIUM_CURRENCY]: null
  },
  [CurrencyType.FACTION_TOKEN]: {
    [CurrencyType.COPPER]: null,
    [CurrencyType.SILVER]: null,
    [CurrencyType.GOLD]: null,
    [CurrencyType.PLATINUM]: null,
    [CurrencyType.FACTION_TOKEN]: 1,
    [CurrencyType.PREMIUM_CURRENCY]: null
  },
  [CurrencyType.PREMIUM_CURRENCY]: {
    [CurrencyType.COPPER]: null,
    [CurrencyType.SILVER]: null,
    [CurrencyType.GOLD]: null,
    [CurrencyType.PLATINUM]: null,
    [CurrencyType.FACTION_TOKEN]: null,
    [CurrencyType.PREMIUM_CURRENCY]: 1
  }
};

// Wallet interface to manage different currencies
class CurrencyWallet {
  private balances: Map<CurrencyType, number> = new Map();
  
  constructor(initialBalances?: Partial<Record<CurrencyType, number>>) {
    // Initialize all currencies to 0
    Object.values(CurrencyType).forEach(currency => {
      this.balances.set(currency as CurrencyType, 0);
    });
    
    // Apply initial balances if provided
    if (initialBalances) {
      Object.entries(initialBalances).forEach(([currency, amount]) => {
        this.balances.set(currency as CurrencyType, amount);
      });
    }
  }
  
  getBalance(currency: CurrencyType): number {
    return this.balances.get(currency) || 0;
  }
  
  deposit(currency: CurrencyType, amount: number): boolean {
    if (amount < 0) {
      return false;
    }
    
    const currentBalance = this.balances.get(currency) || 0;
    this.balances.set(currency, currentBalance + amount);
    return true;
  }
  
  withdraw(currency: CurrencyType, amount: number): boolean {
    if (amount < 0) {
      return false;
    }
    
    const currentBalance = this.balances.get(currency) || 0;
    
    if (currentBalance < amount) {
      return false; // Insufficient funds
    }
    
    this.balances.set(currency, currentBalance - amount);
    return true;
  }
  
  // Convert between currency types
  convert(fromCurrency: CurrencyType, toCurrency: CurrencyType, amount: number): boolean {
    // Check if conversion is possible
    const conversionRate = CURRENCY_CONVERSION[fromCurrency][toCurrency];
    
    if (conversionRate === null) {
      return false; // Conversion not possible
    }
    
    // Check if we have enough to convert
    if (!this.withdraw(fromCurrency, amount)) {
      return false; // Insufficient funds
    }
    
    // Calculate converted amount and deposit
    const convertedAmount = amount * conversionRate;
    this.deposit(toCurrency, convertedAmount);
    
    return true;
  }
  
  // Get formatted string representation
  toString(): string {
    let result = "";
    
    for (const [currency, amount] of this.balances.entries()) {
      if (amount > 0) {
        result += `${amount} ${currency}, `;
      }
    }
    
    return result ? result.slice(0, -2) : "Empty wallet";
  }
}
```

This currency system demonstrates several important economic concepts:
- Exchange rates between different currencies
- Non-convertible currencies (like faction tokens)
- Transaction validation for withdrawals
- Atomicity in currency operations

## Supply and Demand Pricing Model

One of the most interesting aspects of RPG economies is dynamic pricing based on supply and demand:

```typescript
// Item rarity for base price calculation
enum ItemRarity {
  COMMON = "common",
  UNCOMMON = "uncommon",
  RARE = "rare",
  VERY_RARE = "very_rare",
  LEGENDARY = "legendary"
}

// Base prices by rarity
const BASE_PRICES: Record<ItemRarity, number> = {
  [ItemRarity.COMMON]: 10,
  [ItemRarity.UNCOMMON]: 50,
  [ItemRarity.RARE]: 500,
  [ItemRarity.VERY_RARE]: 5000,
  [ItemRarity.LEGENDARY]: 50000
};

// Supply and demand model for dynamic pricing
class MarketItem {
  id: string;
  name: string;
  basePrice: number;
  rarity: ItemRarity;
  currentPrice: number;
  // Economic factors
  elasticity: number; // How sensitive price is to supply/demand (0-1)
  baseSupply: number; // "Normal" level of supply
  baseDemand: number; // "Normal" level of demand
  currentSupply: number;
  currentDemand: number;
  
  constructor(
    id: string,
    name: string,
    rarity: ItemRarity,
    elasticity: number = 0.5,
    baseSupply: number = 100,
    baseDemand: number = 100
  ) {
    this.id = id;
    this.name = name;
    this.rarity = rarity;
    this.basePrice = BASE_PRICES[rarity];
    this.currentPrice = this.basePrice;
    
    this.elasticity = Math.max(0, Math.min(1, elasticity));
    this.baseSupply = baseSupply;
    this.baseDemand = baseDemand;
    this.currentSupply = baseSupply;
    this.currentDemand = baseDemand;
  }
  
  // Calculate price based on current supply and demand
  updatePrice(): number {
    // Supply/demand ratio model
    // When supply = demand, price = basePrice
    // When supply > demand, price decreases
    // When demand > supply, price increases
    const ratio = this.currentDemand / this.currentSupply;
    
    // Apply elasticity as an exponent to dampen or amplify the effect
    this.currentPrice = this.basePrice * Math.pow(ratio, this.elasticity);
    
    return this.currentPrice;
  }
  
  // Simulate a purchase (decreases supply, increases demand)
  purchase(quantity: number = 1): void {
    this.currentSupply = Math.max(1, this.currentSupply - quantity);
    this.currentDemand = Math.min(this.baseDemand * 2, this.currentDemand + quantity * 0.1);
    this.updatePrice();
  }
  
  // Simulate a sale to the market (increases supply, decreases demand)
  sell(quantity: number = 1): void {
    this.currentSupply = Math.min(this.baseSupply * 2, this.currentSupply + quantity);
    this.currentDemand = Math.max(1, this.currentDemand - quantity * 0.1);
    this.updatePrice();
  }
  
  // Simulate market recovery over time (regression to the mean)
  simulateRecovery(timeSteps: number = 1): void {
    // Supply and demand gradually return to base levels
    const recoveryRate = 0.1 * timeSteps;
    
    this.currentSupply = this.currentSupply + (this.baseSupply - this.currentSupply) * recoveryRate;
    this.currentDemand = this.currentDemand + (this.baseDemand - this.currentDemand) * recoveryRate;
    
    this.updatePrice();
  }
}

// Market simulation system
class MarketSimulator {
  private items: Map<string, MarketItem> = new Map();
  private lastUpdateTime: number = Date.now();
  private updateInterval: number = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
  
  constructor(items: MarketItem[]) {
    for (const item of items) {
      this.items.set(item.id, item);
    }
  }
  
  addItem(item: MarketItem): void {
    this.items.set(item.id, item);
  }
  
  getItem(itemId: string): MarketItem | undefined {
    return this.items.get(itemId);
  }
  
  // Update prices based on elapsed time
  updateMarket(): void {
    const now = Date.now();
    const elapsedTime = now - this.lastUpdateTime;
    const timeSteps = Math.floor(elapsedTime / this.updateInterval);
    
    if (timeSteps > 0) {
      for (const item of this.items.values()) {
        item.simulateRecovery(timeSteps);
      }
      
      this.lastUpdateTime = now - (elapsedTime % this.updateInterval);
    }
  }
  
  // Run market simulation for a specified number of steps
  simulateMarket(steps: number, actions: Array<{
    itemId: string;
    action: "buy" | "sell";
    quantity: number;
    chance: number; // Probability of this action occurring (0-1)
  }> = []): void {
    for (let i = 0; i < steps; i++) {
      // Apply random market actions based on defined probabilities
      for (const { itemId, action, quantity, chance } of actions) {
        if (Math.random() < chance) {
          const item = this.items.get(itemId);
          
          if (item) {
            if (action === "buy") {
              item.purchase(quantity);
            } else {
              item.sell(quantity);
            }
          }
        }
      }
      
      // Apply recovery for all items
      for (const item of this.items.values()) {
        item.simulateRecovery(0.5); // Half-step recovery per simulation step
      }
    }
  }
}
```

This market simulation demonstrates key economic principles:
- Price elasticity in response to supply and demand changes
- Dynamic price adjustments with different sensitivities for different items
- Market equilibrium forces that restore balance over time
- Scarcity value for rarer items

## Auction Systems

Many RPGs implement auction houses for player-to-player trade:

```typescript
// Auction types
enum AuctionType {
  ENGLISH = "english", // Ascending price, highest bidder wins
  DUTCH = "dutch",     // Descending price, first bidder wins
  SEALED = "sealed",   // Sealed bids, highest bidder wins
  BUYOUT = "buyout"    // Fixed price, first buyer wins
}

// Auction status
enum AuctionStatus {
  PENDING = "pending",
  ACTIVE = "active",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
  EXPIRED = "expired"
}

interface Bid {
  bidderId: string;
  bidAmount: number;
  timestamp: number;
}

class Auction {
  id: string;
  sellerId: string;
  itemId: string;
  itemName: string;
  quantity: number;
  startingPrice: number;
  currentPrice: number;
  buyoutPrice?: number;
  minimumIncrement: number;
  auctionType: AuctionType;
  status: AuctionStatus;
  startTime: number;
  endTime: number;
  bids: Bid[] = [];
  winnerId?: string;
  
  constructor(
    id: string,
    sellerId: string,
    itemId: string,
    itemName: string,
    quantity: number,
    startingPrice: number,
    duration: number, // Duration in milliseconds
    auctionType: AuctionType,
    buyoutPrice?: number,
    minimumIncrement: number = startingPrice * 0.05
  ) {
    this.id = id;
    this.sellerId = sellerId;
    this.itemId = itemId;
    this.itemName = itemName;
    this.quantity = quantity;
    this.startingPrice = startingPrice;
    this.currentPrice = startingPrice;
    this.buyoutPrice = buyoutPrice;
    this.minimumIncrement = minimumIncrement;
    this.auctionType = auctionType;
    this.status = AuctionStatus.PENDING;
    
    const now = Date.now();
    this.startTime = now;
    this.endTime = now + duration;
  }
  
  // Start the auction
  start(): boolean {
    if (this.status !== AuctionStatus.PENDING) {
      return false;
    }
    
    this.status = AuctionStatus.ACTIVE;
    return true;
  }
  
  // Place a bid
  placeBid(bidderId: string, bidAmount: number): boolean {
    const now = Date.now();
    
    // Check if auction is active
    if (this.status !== AuctionStatus.ACTIVE) {
      return false;
    }
    
    // Check if auction has ended
    if (now > this.endTime) {
      this.status = AuctionStatus.EXPIRED;
      return false;
    }
    
    // Check if seller is trying to bid on their own auction
    if (bidderId === this.sellerId) {
      return false;
    }
    
    // Handle different auction types
    switch (this.auctionType) {
      case AuctionType.ENGLISH:
        // Check if bid is high enough
        if (bidAmount < this.currentPrice + this.minimumIncrement) {
          return false;
        }
        
        // Check if this is a buyout
        if (this.buyoutPrice && bidAmount >= this.buyoutPrice) {
          bidAmount = this.buyoutPrice;
          this.currentPrice = bidAmount;
          this.bids.push({ bidderId, bidAmount, timestamp: now });
          this.winnerId = bidderId;
          this.status = AuctionStatus.COMPLETED;
          return true;
        }
        
        // Normal bid
        this.currentPrice = bidAmount;
        this.bids.push({ bidderId, bidAmount, timestamp: now });
        return true;
        
      case AuctionType.DUTCH:
        // In Dutch auction, any bid at or above current price wins
        if (bidAmount < this.currentPrice) {
          return false;
        }
        
        this.currentPrice = bidAmount;
        this.bids.push({ bidderId, bidAmount, timestamp: now });
        this.winnerId = bidderId;
        this.status = AuctionStatus.COMPLETED;
        return true;
        
      case AuctionType.SEALED:
        // In sealed bid auction, just record the bid
        if (bidAmount < this.startingPrice) {
          return false;
        }
        
        this.bids.push({ bidderId, bidAmount, timestamp: now });
        return true;
        
      case AuctionType.BUYOUT:
        // In buyout auction, must meet exact price
        if (bidAmount !== this.buyoutPrice) {
          return false;
        }
        
        this.currentPrice = bidAmount;
        this.bids.push({ bidderId, bidAmount, timestamp: now });
        this.winnerId = bidderId;
        this.status = AuctionStatus.COMPLETED;
        return true;
        
      default:
        return false;
    }
  }
  
  // Complete the auction (called when time expires)
  complete(): boolean {
    if (this.status !== AuctionStatus.ACTIVE) {
      return false;
    }
    
    if (this.bids.length === 0) {
      this.status = AuctionStatus.EXPIRED;
      return true;
    }
    
    if (this.auctionType === AuctionType.SEALED) {
      // For sealed bid, find highest bidder
      const highestBid = this.bids.reduce((highest, current) => 
        current.bidAmount > highest.bidAmount ? current : highest
      );
      
      this.winnerId = highestBid.bidderId;
      this.currentPrice = highestBid.bidAmount;
    } else if (this.auctionType === AuctionType.ENGLISH) {
      // For English auction, highest bidder wins
      const highestBid = this.bids.reduce((highest, current) => 
        current.bidAmount > highest.bidAmount ? current : highest
      );
      
      this.winnerId = highestBid.bidderId;
      // currentPrice is already the highest bid
    }
    
    this.status = AuctionStatus.COMPLETED;
    return true;
  }
}

// Auction house system
class AuctionHouse {
  private auctions: Map<string, Auction> = new Map();
  private fee: number = 0.05; // 5% listing fee
  private cutPercentage: number = 0.10; // 10% cut of final sale
  
  constructor(fee: number = 0.05, cutPercentage: number = 0.10) {
    this.fee = fee;
    this.cutPercentage = cutPercentage;
  }
  
  // Create a new auction
  createAuction(
    sellerId: string,
    sellerWallet: CurrencyWallet,
    itemId: string,
    itemName: string,
    quantity: number,
    startingPrice: number,
    duration: number,
    auctionType: AuctionType,
    buyoutPrice?: number
  ): string | null {
    // Calculate listing fee
    const listingFee = Math.max(1, startingPrice * this.fee);
    
    // Check if seller can pay the fee
    if (!sellerWallet.withdraw(CurrencyType.GOLD, listingFee)) {
      return null; // Can't afford fee
    }
    
    // Generate auction ID
    const auctionId = `auction_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    
    // Create auction
    const auction = new Auction(
      auctionId,
      sellerId,
      itemId,
      itemName,
      quantity,
      startingPrice,
      duration,
      auctionType,
      buyoutPrice
    );
    
    // Start the auction
    auction.start();
    
    // Add to auction house
    this.auctions.set(auctionId, auction);
    
    return auctionId;
  }
  
  // Complete a transaction when auction ends
  completeTransaction(
    auctionId: string, 
    sellerWallet: CurrencyWallet,
    buyerWallet: CurrencyWallet
  ): boolean {
    const auction = this.auctions.get(auctionId);
    
    if (!auction || auction.status !== AuctionStatus.COMPLETED || !auction.winnerId) {
      return false;
    }
    
    // Calculate final price after house cut
    const finalPrice = auction.currentPrice;
    const houseCut = finalPrice * this.cutPercentage;
    const sellerProceeds = finalPrice - houseCut;
    
    // Transfer funds
    if (!buyerWallet.withdraw(CurrencyType.GOLD, finalPrice)) {
      // Buyer can't afford it anymore
      auction.status = AuctionStatus.CANCELLED;
      return false;
    }
    
    // Transfer proceeds to seller
    sellerWallet.deposit(CurrencyType.GOLD, sellerProceeds);
    
    return true;
  }
}
```

This auction house implementation demonstrates:
- Different auction mechanisms (English, Dutch, Sealed, Buyout)
- Market price discovery through bidding
- Revenue generation through fees and commission
- Transaction completion with multi-party settlement

## Regional Trade Networks

Many RPGs implement trade networks with geographic price differences:

```typescript
// Region system for varying prices
class Region {
  id: string;
  name: string;
  specialties: string[]; // Items produced at discount
  shortages: string[];   // Items in demand at premium
  basePriceModifiers: Map<string, number> = new Map();
  connectedRegions: Map<string, number> = new Map(); // regionId -> distance
  
  constructor(
    id: string,
    name: string,
    specialties: string[] = [],
    shortages: string[] = []
  ) {
    this.id = id;
    this.name = name;
    this.specialties = specialties;
    this.shortages = shortages;
    
    // Set up base price modifiers
    for (const specialty of specialties) {
      this.basePriceModifiers.set(specialty, 0.7); // 30% discount on specialties
    }
    
    for (const shortage of shortages) {
      this.basePriceModifiers.set(shortage, 1.5); // 50% premium on shortages
    }
  }
  
  addConnection(regionId: string, distance: number): void {
    this.connectedRegions.set(regionId, distance);
  }
  
  getModifier(itemType: string): number {
    return this.basePriceModifiers.get(itemType) || 1.0;
  }
}

// Trade network system
class TradeNetwork {
  private regions: Map<string, Region> = new Map();
  private items: Map<string, MarketItem> = new Map();
  private regionInventories: Map<string, Map<string, number>> = new Map();
  
  constructor(regions: Region[] = []) {
    // Add initial regions
    for (const region of regions) {
      this.addRegion(region);
    }
  }
  
  addRegion(region: Region): void {
    this.regions.set(region.id, region);
    this.regionInventories.set(region.id, new Map());
  }
  
  addItem(item: MarketItem): void {
    this.items.set(item.id, item);
    
    // Initialize item count in all regions
    for (const [regionId, inventory] of this.regionInventories.entries()) {
      inventory.set(item.id, 100); // Default stock
    }
  }
  
  // Calculate item price in a specific region
  getItemPrice(itemId: string, regionId: string): number {
    const item = this.items.get(itemId);
    const region = this.regions.get(regionId);
    
    if (!item || !region) {
      return 0;
    }
    
    // Base price
    let price = item.currentPrice;
    
    // Apply regional modifier
    const regionModifier = region.getModifier(item.id);
    price *= regionModifier;
    
    // Apply supply/demand based on inventory
    const inventory = this.regionInventories.get(regionId);
    const stock = inventory?.get(itemId) || 0;
    
    // Adjust price based on stock levels
    const stockModifier = Math.max(0.5, Math.min(2.0, 100 / (stock + 1)));
    price *= stockModifier;
    
    return price;
  }
  
  // Find arbitrage opportunities
  findArbitrageOpportunities(itemId: string): Array<{
    buyRegion: string;
    sellRegion: string;
    buyPrice: number;
    sellPrice: number;
    profit: number;
    distance: number;
    profitPerDistance: number;
  }> {
    const opportunities = [];
    const item = this.items.get(itemId);
    
    if (!item) {
      return [];
    }
    
    // Check all region pairs
    for (const [buyRegionId] of this.regions.entries()) {
      for (const [sellRegionId] of this.regions.entries()) {
        if (buyRegionId === sellRegionId) continue;
        
        const buyPrice = this.getItemPrice(itemId, buyRegionId);
        // Selling price is 70% of market price (merchant cut)
        const sellPrice = this.getItemPrice(itemId, sellRegionId) * 0.7;
        
        // Calculate profit
        const profit = sellPrice - buyPrice;
        
        if (profit > 0) {
          // Calculate distance between regions
          const distance = this.getDistance(buyRegionId, sellRegionId);
          
          opportunities.push({
            buyRegion: buyRegionId,
            sellRegion: sellRegionId,
            buyPrice,
            sellPrice,
            profit,
            distance,
            profitPerDistance: profit / distance
          });
        }
      }
    }
    
    // Sort by profit per distance (most efficient first)
    return opportunities.sort((a, b) => b.profitPerDistance - a.profitPerDistance);
  }
  
  // Calculate distance between regions (simplified)
  private getDistance(fromRegionId: string, toRegionId: string): number {
    const fromRegion = this.regions.get(fromRegionId);
    
    if (!fromRegion) {
      return Number.MAX_SAFE_INTEGER;
    }
    
    // Direct connection
    const directDistance = fromRegion.connectedRegions.get(toRegionId);
    if (directDistance !== undefined) {
      return directDistance;
    }
    
    // For simplicity, if no direct connection, use a large distance
    return 10; // Default distance for non-directly connected regions
  }
}
```

The trade network system demonstrates:
- Regional price differences based on specialization 
- Supply and demand effects on local prices
- Arbitrage opportunities for profit through geographic price differences

## Economy Management and Inflation Control

A critical aspect of game economies is managing inflation through resource flows:

```typescript
// Economy management system 
class EconomyManager {
  private goldInCirculation: number = 0;
  private inflationTarget: number = 0.05; // 5% annual inflation target
  private economyStats: {
    timestamp: number;
    goldInCirculation: number;
    playerCount: number;
    averageGoldPerPlayer: number;
    inflationRate: number;
  }[] = [];
  
  // Resource sources (ways gold enters the economy)
  private sources: {
    questRewards: number;
    monsterLoot: number;
    vendorSales: number;
    crafting: number;
    otherSources: number;
  } = {
    questRewards: 0,
    monsterLoot: 0,
    vendorSales: 0,
    crafting: 0,
    otherSources: 0
  };
  
  // Resource sinks (ways gold leaves the economy)
  private sinks: {
    vendorPurchases: number;
    repairCosts: number;
    auctionFees: number;
    craftingCosts: number;
    trainingCosts: number;
    otherSinks: number;
  } = {
    vendorPurchases: 0,
    repairCosts: 0,
    auctionFees: 0,
    craftingCosts: 0,
    trainingCosts: 0,
    otherSinks: 0
  };
  
  constructor(initialGold: number = 0) {
    this.goldInCirculation = initialGold;
    this.recordStats(this.goldInCirculation, 0);
  }
  
  // Record economic statistics
  private recordStats(goldAmount: number, playerCount: number): void {
    const timestamp = Date.now();
    const averageGoldPerPlayer = playerCount > 0 ? goldAmount / playerCount : 0;
    
    // Calculate inflation rate based on previous record
    let inflationRate = 0;
    
    if (this.economyStats.length > 0) {
      const lastRecord = this.economyStats[this.economyStats.length - 1];
      const timeDifference = timestamp - lastRecord.timestamp;
      const yearInMillis = 365 * 24 * 60 * 60 * 1000;
      
      // Annualized inflation rate
      inflationRate = Math.pow(goldAmount / lastRecord.goldInCirculation, yearInMillis / timeDifference) - 1;
    }
    
    this.economyStats.push({
      timestamp,
      goldInCirculation: goldAmount,
      playerCount,
      averageGoldPerPlayer,
      inflationRate
    });
  }
  
  // Add gold from a source
  addGold(amount: number, source: keyof typeof this.sources): void {
    if (amount <= 0) return;
    
    this.goldInCirculation += amount;
    this.sources[source] += amount;
  }
  
  // Remove gold via a sink
  removeGold(amount: number, sink: keyof typeof this.sinks): void {
    if (amount <= 0) return;
    
    this.goldInCirculation = Math.max(0, this.goldInCirculation - amount);
    this.sinks[sink] += amount;
  }
  
  // Update economy stats
  updateStats(playerCount: number): void {
    this.recordStats(this.goldInCirculation, playerCount);
  }
  
  // Adjust quest rewards based on inflation
  adjustQuestRewards(baseReward: number): number {
    if (this.economyStats.length < 2) {
      return baseReward;
    }
    
    const latestStats = this.economyStats[this.economyStats.length - 1];
    
    // If inflation is too high, reduce rewards
    if (latestStats.inflationRate > this.inflationTarget + 0.05) {
      return baseReward * 0.9;
    }
    
    // If inflation is too low, increase rewards
    if (latestStats.inflationRate < this.inflationTarget - 0.05) {
      return baseReward * 1.1;
    }
    
    return baseReward;
  }
  
  // Dynamically adjust vendor prices
  adjustVendorPrices(basePrice: number): number {
    if (this.economyStats.length < 2) {
      return basePrice;
    }
    
    const latestStats = this.economyStats[this.economyStats.length - 1];
    
    // If inflation is too high, increase prices
    if (latestStats.inflationRate > this.inflationTarget + 0.05) {
      return basePrice * 1.15;
    }
    
    // If inflation is too low, decrease prices
    if (latestStats.inflationRate < this.inflationTarget - 0.05) {
      return basePrice * 0.85;
    }
    
    return basePrice;
  }
  
  // Get economic report
  getEconomicReport(): string {
    if (this.economyStats.length < 2) {
      return "Insufficient data for economic report.";
    }
    
    const currentStats = this.economyStats[this.economyStats.length - 1];
    
    // Calculate total sources and sinks
    const totalSources = Object.values(this.sources).reduce((sum, val) => sum + val, 0);
    const totalSinks = Object.values(this.sinks).reduce((sum, val) => sum + val, 0);
    
    // Calculate net flow
    const netFlow = totalSources - totalSinks;
    
    let report = "=== Economy Report ===\n";
    report += `Gold in circulation: ${currentStats.goldInCirculation.toFixed(0)}\n`;
    report += `Average gold per player: ${currentStats.averageGoldPerPlayer.toFixed(0)}\n`;
    report += `Inflation rate: ${(currentStats.inflationRate * 100).toFixed(2)}%\n`;
    report += `Target inflation: ${(this.inflationTarget * 100).toFixed(2)}%\n\n`;
    
    report += "Gold Sources:\n";
    for (const [source, amount] of Object.entries(this.sources)) {
      const percentage = totalSources > 0 ? (amount / totalSources * 100).toFixed(1) : "0.0";
      report += `- ${source}: ${amount.toFixed(0)} (${percentage}%)\n`;
    }
    report += `Total sources: ${totalSources.toFixed(0)}\n\n`;
    
    report += "Gold Sinks:\n";
    for (const [sink, amount] of Object.entries(this.sinks)) {
      const percentage = totalSinks > 0 ? (amount / totalSinks * 100).toFixed(1) : "0.0";
      report += `- ${sink}: ${amount.toFixed(0)} (${percentage}%)\n`;
    }
    report += `Total sinks: ${totalSinks.toFixed(0)}\n\n`;
    
    report += `Net flow: ${netFlow > 0 ? "+" : ""}${netFlow.toFixed(0)}\n`;
    
    // Economic health assessment
    report += "Economic Status: ";
    if (Math.abs(currentStats.inflationRate - this.inflationTarget) < 0.02) {
      report += "Healthy (on target)\n";
    } else if (currentStats.inflationRate > this.inflationTarget + 0.05) {
      report += "Inflationary (consider adding gold sinks)\n";
    } else if (currentStats.inflationRate < this.inflationTarget - 0.05) {
      report += "Deflationary (consider adding gold sources)\n";
    } else {
      report += "Stable (within acceptable range)\n";
    }
    
    // Recommendations
    report += "\nRecommendations:\n";
    
    if (currentStats.inflationRate > this.inflationTarget + 0.05) {
      report += "- Increase vendor prices\n";
      report += "- Add luxury items/services\n";
      report += "- Increase repair/training costs\n";
      report += "- Add gold sinks through cosmetic items\n";
    } else if (currentStats.inflationRate < this.inflationTarget - 0.05) {
      report += "- Increase quest rewards\n";
      report += "- Increase monster gold drops\n";
      report += "- Add daily login bonuses\n";
      report += "- Reduce vendor prices temporarily\n";
    } else {
      report += "- Maintain current balance\n";
      report += "- Monitor economy regularly\n";
    }
    
    return report;
  }
}
```

This economy management system demonstrates:
- Inflation tracking and targeting
- Dynamic adjustment of prices and rewards
- Resource flow analysis (sources vs. sinks)
- Economic reporting and recommendations

## Theoretical Insights

RPG economy systems illuminate several key economic theories and computational concepts:

### 1. Supply and Demand Curves

In-game markets operate according to the fundamental economic principle that prices rise as demand exceeds supply and fall when supply exceeds demand. We saw this in the `MarketItem` class where:

```typescript
// Price calculation based on supply/demand ratio
const ratio = this.currentDemand / this.currentSupply;
this.currentPrice = this.basePrice * Math.pow(ratio, this.elasticity);
```

This simple formula creates realistic market behavior where scarce items command premium prices.

### 2. Price Elasticity

Different items respond differently to supply/demand changes. In our implementation, the elasticity parameter controls this:

```typescript
// Higher elasticity (closer to 1) = more dramatic price changes
// Lower elasticity (closer to 0) = more stable prices
this.elasticity = Math.max(0, Math.min(1, elasticity));
```

Items like basic supplies might have low elasticity, while luxury items have high elasticity.

### 3. Market Equilibrium

Over time, prices tend toward a natural equilibrium. Our market simulation implements this through the recovery function:

```typescript
// Regression to the mean for supply and demand
this.currentSupply = this.currentSupply + (this.baseSupply - this.currentSupply) * recoveryRate;
this.currentDemand = this.currentDemand + (this.baseDemand - this.currentDemand) * recoveryRate;
```

This creates realistic price cycles as markets respond to changes then gradually return to equilibrium.

### 4. Auction Theory

Our auction system demonstrates different price discovery mechanisms:

- **English Auctions**: Prices increase through competitive bidding
- **Dutch Auctions**: Prices start high and decrease until someone bids
- **Sealed Bid Auctions**: Bidders submit private bids
- **Fixed Price (Buyout)**: Simple first-come, first-served model

Each mechanism has different efficiency properties and seller/buyer advantages.

### 5. Comparative Advantage

The regional trade system demonstrates Ricardo's theory of comparative advantage, where regions specialize in producing what they're best at:

```typescript
// Each region has specialties with 30% discount
for (const specialty of specialties) {
  this.basePriceModifiers.set(specialty, 0.7);
}
```

This creates a natural trading system where items flow from regions with advantages to those without.

### 6. Arbitrage and Price Convergence

Trade between regions demonstrates arbitrage - the practice of exploiting price differences between markets. Our `findArbitrageOpportunities` method calculates these opportunities:

```typescript
// Arbitrage exists when you can buy low in one region and sell high in another
const profit = sellPrice - buyPrice;
```

In efficient markets, arbitrage opportunities eventually disappear as prices converge.

### 7. Inflation Control through Monetary Policy

The economy manager implements a simplified form of monetary policy:

```typescript
// Dynamic adjustment of rewards based on inflation
if (latestStats.inflationRate > this.inflationTarget + 0.05) {
  return baseReward * 0.9;  // Reduce rewards when inflation is high
}
```

This mimics how central banks adjust interest rates to control inflation.

## Practical Applications Beyond Gaming

The economic systems in RPGs have direct applications in real-world software:

### 1. E-commerce Pricing Algorithms

Dynamic pricing models in e-commerce use similar supply/demand principles to maximize revenue:

```typescript
// Similar to our MarketItem.updatePrice() method
function calculateDynamicPrice(basePrice, demand, supply, elasticity) {
  return basePrice * Math.pow(demand / supply, elasticity);
}
```

### 2. Resource Allocation Systems

The principles behind in-game economy management apply to business resource allocation:

```typescript
// Similar to our adjustQuestRewards() method
function adjustBudgetAllocation(baseBudget, currentUtilization, targetUtilization) {
  if (currentUtilization > targetUtilization * 1.1) {
    return baseBudget * 1.15; // Increase budget when utilization is high
  } else if (currentUtilization < targetUtilization * 0.9) {
    return baseBudget * 0.9; // Decrease budget when utilization is low
  }
  return baseBudget;
}
```

### 3. Financial Market Simulations

Auction systems and market dynamics models are used in financial simulations:

```typescript
// Similar to our Auction.placeBid() method
function simulateMarketOrder(orderBook, order) {
  if (order.type === 'buy') {
    // Match with lowest sell orders first
    // ...
  } else {
    // Match with highest buy orders first
    // ...
  }
}
```

### 4. Supply Chain Optimization

Regional trade networks model supply chain dynamics:

```typescript
// Similar to our findArbitrageOpportunities() method
function optimizeDistributionRoutes(productionCosts, transportCosts, sellingPrices) {
  const routes = [];
  for (const source in productionCosts) {
    for (const destination in sellingPrices) {
      const profit = sellingPrices[destination] - productionCosts[source] - transportCosts[source][destination];
      if (profit > 0) {
        routes.push({ source, destination, profit });
      }
    }
  }
  return routes.sort((a, b) => b.profit - a.profit);
}
```

### 5. Real Estate Valuation Models

Regional price differences in games mirror real estate market dynamics:

```typescript
// Similar to our getItemPrice() method with regional modifiers
function estimatePropertyValue(basePrice, locationFactor, supplyDemandRatio) {
  return basePrice * locationFactor * supplyDemandRatio;
}
```

## Conclusion

Game economy systems provide fascinating working models of economic theory that extend well beyond game design. From the simple supply and demand mechanics of merchant shops to the complex arbitrage opportunities of trade networks, these systems demonstrate how mathematical models can simulate real-world economic behavior.

The computational approaches used in these systems—from currency conversion algorithms to dynamic pricing models—offer elegant solutions to complex economic problems. By studying these systems, software developers gain practical insights into market dynamics, resource allocation, and economic balancing.

When designing systems that involve resource flows, market interactions, or dynamic pricing, the principles established in RPG economy systems offer powerful templates for creating robust, balanced, and engaging economic models. Whether you're building an e-commerce platform, a resource allocation system, or a financial simulation, the humble gold piece of the fantasy RPG has much to teach about the economics of virtual and real worlds alike.