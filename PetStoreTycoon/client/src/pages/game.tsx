import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import type { Pet, EggType, StoreType } from "@shared/schema";

// Game configuration
const EGG_TYPES: EggType[] = [
  {
    id: "basic-animal",
    name: "Basic Animal Egg",
    cost: 500,
    rarity: "basic",
    pets: [
      { name: "Dog", chance: 33.33, income: 25, incomeType: "perSecond" },
      { name: "Bunny", chance: 33.33, income: 20, incomeType: "perSecond" },
      { name: "Cat", chance: 33.33, income: 30, incomeType: "perSecond" },
    ],
  },
  {
    id: "rare-animal",
    name: "Rare Animal Egg",
    cost: 10000,
    rarity: "rare",
    pets: [
      { name: "Puppy", chance: 80, income: 100, incomeType: "perSecond" },
      { name: "Kitten", chance: 15, income: 150, incomeType: "perSecond" },
      { name: "Ferret", chance: 5, income: 250, incomeType: "perSecond" },
    ],
  },
  {
    id: "legendary-animal",
    name: "Legendary Animal Egg",
    cost: 100000,
    rarity: "legendary",
    pets: [
      { name: "Baby Ferret", chance: 50, income: 245, incomeType: "perSecond" },
      { name: "Capybara", chance: 45, income: 600, incomeType: "perSecond" },
      { name: "Parrot", chance: 5, income: 1000, incomeType: "perSecond" },
    ],
  },
  {
    id: "common-reptile",
    name: "Common Reptile Egg",
    cost: 500000,
    rarity: "reptile",
    pets: [
      { name: "Salamander", chance: 33.33, income: 750, incomeType: "perSecond" },
      { name: "Gecko", chance: 33.33, income: 1200, incomeType: "perSecond" },
      { name: "Baby Gecko", chance: 22.22, income: 1500, incomeType: "perSecond" },
      { name: "Baby Salamander", chance: 11.11, income: 2000, incomeType: "perSecond" },
    ],
  },
  {
    id: "rare-reptile",
    name: "Rare Reptile Egg",
    cost: 750000,
    rarity: "reptile",
    pets: [
      { name: "Snake", chance: 50, income: 100, incomeType: "perSecond" },
      { name: "Boa Constrictor", chance: 35, income: 500, incomeType: "perSecond" },
      { name: "Baby Snake", chance: 15, income: 750, incomeType: "perSecond" },
    ],
  },
  {
    id: "legendary-reptile",
    name: "Legendary Reptile Egg",
    cost: 1000000,
    rarity: "reptile",
    pets: [
      { name: "Cute Snake", chance: 75, income: 650, incomeType: "perSecondSquared" },
      { name: "Baby Bearded Dragon", chance: 15, income: 5000, incomeType: "perSecond" },
      { name: "Bearded Dragon", chance: 9.5, income: 10000, incomeType: "perSecond" },
      { name: "Toothless the Bearded Dragon", chance: 0.5, income: 100000000, incomeType: "perSecond" },
    ],
  },
  {
    id: "common-bug",
    name: "Common Bug Egg",
    cost: 5000000,
    rarity: "bug",
    pets: [
      { name: "Ant", chance: 50, income: 10000, incomeType: "perSecond" },
      { name: "Firefly", chance: 35, income: 12000, incomeType: "perSecond" },
      { name: "Butterfly", chance: 15, income: 15000, incomeType: "perSecond" },
    ],
  },
  {
    id: "rare-bug",
    name: "Rare Bug Egg",
    cost: 10000000,
    rarity: "bug",
    pets: [
      { name: "Worm", chance: 75, income: 20000, incomeType: "perSecond" },
      { name: "Caterpillar", chance: 24, income: 25000, incomeType: "perSecond" },
      { name: "Queen Ant", chance: 1, income: 100000, incomeType: "perSecond" },
    ],
  },
];

const STORE_TYPES: StoreType[] = [
  { id: "shack", name: "Shack", capacity: 3, cost: 0 },
  { id: "small", name: "Small Store", capacity: 5, cost: 50000 },
  { id: "large", name: "Large Store", capacity: 10, cost: 100000 },
  { id: "mega", name: "Mega Store", capacity: 25, cost: 500000 },
  { id: "ultra", name: "Ultra Store", capacity: 50, cost: 1000000 },
  { id: "mall", name: "Pet Mall", capacity: 999999, cost: 1000000000 },
];

interface GameState {
  money: number;
  pets: Pet[];
  storeId: string;
  income: number;
  lastSave: number;
}

function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return Math.floor(num).toLocaleString();
}

function generateId(): string {
  return Math.random().toString(36).substr(2, 9);
}

function openEgg(eggType: EggType): Pet {
  const random = Math.random() * 100;
  let cumulativeChance = 0;

  for (const pet of eggType.pets) {
    cumulativeChance += pet.chance;
    if (random <= cumulativeChance) {
      return {
        id: generateId(),
        name: pet.name,
        rarity: eggType.rarity,
        income: pet.income,
        incomeType: pet.incomeType,
      };
    }
  }

  // Fallback to first pet if something goes wrong
  return {
    id: generateId(),
    name: eggType.pets[0].name,
    rarity: eggType.rarity,
    income: eggType.pets[0].income,
    incomeType: eggType.pets[0].incomeType,
  };
}

function calculateOfflineProgress(gameState: GameState, offlineTime: number): number {
  let totalIncome = 0;
  gameState.pets.forEach(pet => {
    if (pet.incomeType === "perSecond") {
      totalIncome += pet.income * offlineTime;
    } else if (pet.incomeType === "perSecondSquared") {
      // For per second squared, we calculate the accumulated value over time
      totalIncome += pet.income * Math.pow(offlineTime, 2) / 2;
    }
  });
  return totalIncome;
}

export default function Game() {
  const { toast } = useToast();
  const [gameState, setGameState] = useState<GameState>({
    money: 1000,
    pets: [],
    storeId: "shack",
    income: 0,
    lastSave: Date.now(),
  });

  const [eggModal, setEggModal] = useState<{
    isOpen: boolean;
    result?: Pet;
    eggType?: EggType;
  }>({ isOpen: false });

  const currentStore = STORE_TYPES.find(store => store.id === gameState.storeId) || STORE_TYPES[0];

  // Calculate current income per second
  const calculateIncome = useCallback(() => {
    return gameState.pets.reduce((total, pet) => {
      if (pet.incomeType === "perSecond") {
        return total + pet.income;
      } else if (pet.incomeType === "perSecondSquared") {
        // For per second squared, we add the base rate
        return total + pet.income;
      }
      return total;
    }, 0);
  }, [gameState.pets]);

  // Update income display
  useEffect(() => {
    const income = calculateIncome();
    setGameState(prev => ({ ...prev, income }));
  }, [calculateIncome]);

  // Game loop - update money every second
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState(prev => {
        let moneyGained = 0;
        prev.pets.forEach(pet => {
          if (pet.incomeType === "perSecond") {
            moneyGained += pet.income;
          } else if (pet.incomeType === "perSecondSquared") {
            // For per second squared, income increases over time
            const timeMultiplier = (Date.now() - prev.lastSave) / 1000 / 60; // minutes
            moneyGained += pet.income * (1 + timeMultiplier);
          }
        });

        return {
          ...prev,
          money: prev.money + moneyGained,
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Load game on mount
  useEffect(() => {
    const savedGame = localStorage.getItem("petStoreTycoon");
    if (savedGame) {
      try {
        const parsed = JSON.parse(savedGame);
        const offlineTime = (Date.now() - parsed.lastSave) / 1000; // seconds
        const offlineIncome = calculateOfflineProgress(parsed, offlineTime);
        
        setGameState({
          ...parsed,
          money: parsed.money + offlineIncome,
          lastSave: Date.now(),
        });

        if (offlineTime > 60) { // Show offline progress if away for more than 1 minute
          toast({
            title: "Welcome back!",
            description: `You earned $${formatNumber(offlineIncome)} while away!`,
          });
        }
      } catch (error) {
        console.error("Failed to load game:", error);
      }
    }
  }, [toast]);

  const saveGame = () => {
    const gameToSave = { ...gameState, lastSave: Date.now() };
    localStorage.setItem("petStoreTycoon", JSON.stringify(gameToSave));
    toast({
      title: "Game Saved!",
      description: "Your progress has been saved.",
    });
  };

  const resetGame = () => {
    const confirmReset = window.confirm("Are you sure you want to reset your game? This cannot be undone!");
    if (confirmReset) {
      localStorage.removeItem("petStoreTycoon");
      setGameState({
        money: 1000,
        pets: [],
        storeId: "shack",
        income: 0,
        lastSave: Date.now(),
      });
      toast({
        title: "Game Reset",
        description: "Your game has been reset to the beginning.",
      });
    }
  };

  const buyEgg = (eggType: EggType) => {
    if (gameState.money < eggType.cost) {
      toast({
        title: "Not enough money!",
        description: `You need $${formatNumber(eggType.cost)} to buy this egg.`,
        variant: "destructive",
      });
      return;
    }

    if (gameState.pets.length >= currentStore.capacity) {
      toast({
        title: "Store is full!",
        description: "Upgrade your store to hold more pets.",
        variant: "destructive",
      });
      return;
    }

    const newPet = openEgg(eggType);
    setGameState(prev => ({
      ...prev,
      money: prev.money - eggType.cost,
      pets: [...prev.pets, newPet],
    }));

    setEggModal({
      isOpen: true,
      result: newPet,
      eggType,
    });

    toast({
      title: `You got a ${newPet.name}!`,
      description: `Income: +$${formatNumber(newPet.income)}/${newPet.incomeType === "perSecond" ? "s" : "s²"}`,
    });
  };

  const upgradeStore = (storeType: StoreType) => {
    if (gameState.money < storeType.cost) {
      toast({
        title: "Not enough money!",
        description: `You need $${formatNumber(storeType.cost)} to upgrade to ${storeType.name}.`,
        variant: "destructive",
      });
      return;
    }

    setGameState(prev => ({
      ...prev,
      money: prev.money - storeType.cost,
      storeId: storeType.id,
    }));

    toast({
      title: "Store Upgraded!",
      description: `Welcome to your new ${storeType.name}! Capacity: ${storeType.capacity} pets.`,
    });
  };

  const getEggIcon = (rarity: string) => {
    switch (rarity) {
      case "basic": return "🥚";
      case "rare": return "🥚";
      case "legendary": return "🥚";
      case "reptile": return "🥚";
      case "bug": return "🥚";
      default: return "🥚";
    }
  };

  const getPetIcon = (petName: string) => {
    const iconMap: { [key: string]: string } = {
      "Dog": "🐕", "Bunny": "🐰", "Cat": "🐱",
      "Puppy": "🐶", "Kitten": "🐱", "Ferret": "🦫",
      "Baby Ferret": "🦫", "Capybara": "🦫", "Parrot": "🦜",
      "Salamander": "🦎", "Gecko": "🦎", "Baby Gecko": "🦎", "Baby Salamander": "🦎",
      "Snake": "🐍", "Boa Constrictor": "🐍", "Baby Snake": "🐍",
      "Cute Snake": "🐍", "Baby Bearded Dragon": "🦎", "Bearded Dragon": "🦎", "Toothless the Bearded Dragon": "🐲",
      "Ant": "🐜", "Firefly": "🪲", "Butterfly": "🦋",
      "Worm": "🪱", "Caterpillar": "🐛", "Queen Ant": "🐜"
    };
    return iconMap[petName] || "🐾";
  };

  const getNextStoreUpgrade = () => {
    const currentIndex = STORE_TYPES.findIndex(store => store.id === gameState.storeId);
    return STORE_TYPES[currentIndex + 1];
  };

  return (
    <div className="game-bg min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-card/90 backdrop-blur-md border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <i className="fas fa-store text-2xl text-primary"></i>
              <h1 className="text-xl font-bold text-foreground">Pet Store Tycoon</h1>
            </div>
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-2 bg-secondary/10 px-4 py-2 rounded-lg">
                <i className="fas fa-coins text-secondary"></i>
                <span className="font-semibold text-foreground pulse-money" data-testid="money-display">
                  ${formatNumber(gameState.money)}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-accent/10 px-4 py-2 rounded-lg">
                <i className="fas fa-dollar-sign text-accent"></i>
                <span className="text-sm text-muted-foreground" data-testid="income-display">
                  ${formatNumber(gameState.income)}/s
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Egg Shop */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center">
                    <i className="fas fa-egg mr-3 text-primary"></i>
                    Egg Shop
                  </h2>
                  <div className="bg-primary/10 px-3 py-1 rounded-full">
                    <span className="text-primary font-semibold text-sm">Choose Your Pet!</span>
                  </div>
                </div>

                {/* Group eggs by category */}
                <div className="space-y-8">
                  {/* Basic Animal Eggs */}
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-gray-400 mr-2"></span>
                      Basic Animal Eggs
                    </h3>
                    {EGG_TYPES.filter(egg => egg.rarity === "basic").map(egg => (
                      <div key={egg.id} className="bg-muted/30 rounded-lg p-4">
                        <div className={`rarity-${egg.rarity} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center text-xl">
                                {getEggIcon(egg.rarity)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{egg.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {egg.pets.map(p => `${p.name} (${p.chance}%)`).join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-secondary">${formatNumber(egg.cost)}</div>
                              <Button
                                onClick={() => buyEgg(egg)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-semibold"
                                data-testid={`buy-egg-${egg.id}`}
                              >
                                Buy Egg
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Rare Animal Eggs */}
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      Rare Animal Eggs
                    </h3>
                    {EGG_TYPES.filter(egg => egg.rarity === "rare").map(egg => (
                      <div key={egg.id} className="bg-blue-50/50 rounded-lg p-4">
                        <div className={`rarity-${egg.rarity} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center text-xl">
                                {getEggIcon(egg.rarity)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{egg.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {egg.pets.map(p => `${p.name} (${p.chance}%)`).join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-secondary">${formatNumber(egg.cost)}</div>
                              <Button
                                onClick={() => buyEgg(egg)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-semibold"
                                data-testid={`buy-egg-${egg.id}`}
                              >
                                Buy Egg
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legendary Animal Eggs */}
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                      Legendary Animal Eggs
                    </h3>
                    {EGG_TYPES.filter(egg => egg.rarity === "legendary").map(egg => (
                      <div key={egg.id} className="bg-purple-50/50 rounded-lg p-4">
                        <div className={`rarity-${egg.rarity} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="w-12 h-12 bg-purple-200 rounded-full flex items-center justify-center text-xl">
                                {getEggIcon(egg.rarity)}
                              </div>
                              <div>
                                <h4 className="font-semibold text-foreground">{egg.name}</h4>
                                <p className="text-sm text-muted-foreground">
                                  {egg.pets.map(p => `${p.name} (${p.chance}%)`).join(", ")}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold text-secondary">${formatNumber(egg.cost)}</div>
                              <Button
                                onClick={() => buyEgg(egg)}
                                className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-semibold"
                                data-testid={`buy-egg-${egg.id}`}
                              >
                                Buy Egg
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reptile Eggs */}
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-red-500 mr-2"></span>
                      Reptile Eggs
                    </h3>
                    <div className="space-y-4">
                      {EGG_TYPES.filter(egg => egg.rarity === "reptile").map(egg => (
                        <div key={egg.id} className="bg-red-50/50 rounded-lg p-4">
                          <div className={`rarity-${egg.rarity} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-red-200 rounded-full flex items-center justify-center text-xl">
                                  {getEggIcon(egg.rarity)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{egg.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {egg.pets.map(p => `${p.name} (${p.chance}%)`).join(", ")}
                                  </p>
                                  {egg.pets.some(p => p.incomeType === "perSecondSquared") && (
                                    <p className="text-xs text-accent font-bold">Contains pets with accelerating income!</p>
                                  )}
                                  {egg.pets.some(p => p.name.includes("Toothless")) && (
                                    <p className="text-xs text-accent font-bold">TOOTHLESS (0.5%) - 100M$/s!</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-secondary">${formatNumber(egg.cost)}</div>
                                <Button
                                  onClick={() => buyEgg(egg)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-semibold"
                                  data-testid={`buy-egg-${egg.id}`}
                                >
                                  Buy Egg
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bug Eggs */}
                  <div>
                    <h3 className="text-lg font-semibold text-muted-foreground mb-4 flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      Bug Eggs
                    </h3>
                    <div className="space-y-4">
                      {EGG_TYPES.filter(egg => egg.rarity === "bug").map(egg => (
                        <div key={egg.id} className="bg-green-50/50 rounded-lg p-4">
                          <div className={`rarity-${egg.rarity} border-2 rounded-xl p-4 cursor-pointer hover:shadow-lg transition-all`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-green-200 rounded-full flex items-center justify-center text-xl">
                                  {getEggIcon(egg.rarity)}
                                </div>
                                <div>
                                  <h4 className="font-semibold text-foreground">{egg.name}</h4>
                                  <p className="text-sm text-muted-foreground">
                                    {egg.pets.map(p => `${p.name} (${p.chance}%)`).join(", ")}
                                  </p>
                                  {egg.pets.some(p => p.name.includes("Queen")) && (
                                    <p className="text-xs text-accent font-bold">QUEEN ANT - Ultra Rare!</p>
                                  )}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-secondary">${formatNumber(egg.cost)}</div>
                                <Button
                                  onClick={() => buyEgg(egg)}
                                  className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-semibold"
                                  data-testid={`buy-egg-${egg.id}`}
                                >
                                  Buy Egg
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Store & Pets */}
          <div className="space-y-6">
            {/* Current Store */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <i className="fas fa-store-alt mr-3 text-accent"></i>
                  Your Store
                </h2>
                
                <div className="bg-accent/10 rounded-lg p-4 mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-foreground">{currentStore.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Capacity: {currentStore.capacity === 999999 ? "∞" : currentStore.capacity} pets
                      </p>
                    </div>
                    <div className="text-2xl">
                      <i className="fas fa-home text-accent"></i>
                    </div>
                  </div>
                  <div className="mt-3">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm text-muted-foreground">Pets</span>
                      <span className="text-sm text-foreground font-semibold" data-testid="pet-capacity">
                        {gameState.pets.length}/{currentStore.capacity === 999999 ? "∞" : currentStore.capacity}
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div 
                        className="bg-accent h-2 rounded-full" 
                        style={{ width: `${currentStore.capacity === 999999 ? 0 : (gameState.pets.length / currentStore.capacity) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                </div>

                {/* Store Upgrades */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">Store Upgrades</h4>
                  
                  {STORE_TYPES.slice(1).map(store => {
                    const isCurrentStore = store.id === gameState.storeId;
                    const isNextUpgrade = getNextStoreUpgrade()?.id === store.id;
                    const canAfford = gameState.money >= store.cost;
                    const isAvailable = isNextUpgrade && canAfford;

                    return (
                      <div 
                        key={store.id}
                        className={`bg-muted/50 rounded-lg p-3 border border-border ${
                          isCurrentStore ? "opacity-50" : 
                          isNextUpgrade ? "opacity-100" : "opacity-60"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <h5 className="font-medium text-foreground">{store.name}</h5>
                            <p className="text-sm text-muted-foreground">
                              {store.capacity === 999999 ? "∞" : store.capacity} pet capacity
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${isAvailable ? "text-secondary" : "text-muted-foreground"}`}>
                              ${formatNumber(store.cost)}
                            </p>
                            {isCurrentStore ? (
                              <span className="text-sm text-accent font-semibold">Current</span>
                            ) : isAvailable ? (
                              <Button
                                onClick={() => upgradeStore(store)}
                                className="bg-accent hover:bg-accent/90 text-accent-foreground px-3 py-1 text-sm font-semibold mt-1"
                                data-testid={`upgrade-store-${store.id}`}
                              >
                                Upgrade
                              </Button>
                            ) : (
                              <Button 
                                disabled 
                                className="bg-muted text-muted-foreground px-3 py-1 text-sm font-semibold cursor-not-allowed mt-1"
                              >
                                {!isNextUpgrade ? "Locked" : "Can't afford"}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Pet Inventory */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-xl font-bold text-foreground mb-4 flex items-center">
                  <i className="fas fa-paw mr-3 text-primary"></i>
                  Your Pets
                </h2>
                
                {gameState.pets.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="text-6xl mb-4 opacity-30">🥚</div>
                    <p className="font-medium">No pets yet!</p>
                    <p className="text-sm mt-1">Buy some eggs to get started</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3" data-testid="pet-inventory">
                    {gameState.pets.map(pet => (
                      <div key={pet.id} className="pet-card bg-muted/30 rounded-lg p-3 border border-border hover:shadow-md transition-all">
                        <div className="text-center">
                          <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2 text-lg">
                            {getPetIcon(pet.name)}
                          </div>
                          <h4 className="font-medium text-foreground text-sm">{pet.name}</h4>
                          <p className="text-xs text-accent font-semibold">
                            +${formatNumber(pet.income)}/{pet.incomeType === "perSecond" ? "s" : "s²"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Game Controls */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center">
                  <i className="fas fa-cog mr-3 text-muted-foreground"></i>
                  Game Controls
                </h2>
                
                <div className="space-y-3">
                  <Button 
                    onClick={saveGame}
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-2 px-4 font-semibold flex items-center justify-center"
                    data-testid="save-game"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Save Game
                  </Button>
                  
                  <Button 
                    onClick={resetGame}
                    className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground py-2 px-4 font-semibold flex items-center justify-center"
                    data-testid="reset-game"
                  >
                    <i className="fas fa-trash mr-2"></i>
                    Reset Game
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Egg Opening Modal */}
      <Modal
        isOpen={eggModal.isOpen}
        onClose={() => setEggModal({ isOpen: false })}
      >
        <div className="text-6xl mb-4">🥚</div>
        <h3 className="text-xl font-bold text-foreground mb-2">Egg Opened!</h3>
        
        {eggModal.result && (
          <div className="mt-4">
            <div className="text-4xl mb-4">{getPetIcon(eggModal.result.name)}</div>
            <h4 className="text-lg font-bold text-foreground">You got a {eggModal.result.name}!</h4>
            <p className="text-accent font-semibold">
              +${formatNumber(eggModal.result.income)}/{eggModal.result.incomeType === "perSecond" ? "s" : "s²"} income
            </p>
          </div>
        )}
        
        <Button 
          onClick={() => setEggModal({ isOpen: false })}
          className="mt-6 bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-2 font-semibold"
          data-testid="close-egg-modal"
        >
          Continue
        </Button>
      </Modal>
    </div>
  );
}
