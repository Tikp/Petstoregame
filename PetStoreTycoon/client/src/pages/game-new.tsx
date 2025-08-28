import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { TradingModal } from "@/components/TradingModal";
import type { Pet, EggType, StoreType, StoreSlot, GameState } from "@shared/schema";

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
      { name: "Baby Ferret", chance: 50, income: 500, incomeType: "perSecond" },
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
      { name: "Salamander", chance: 33.33, income: 1000, incomeType: "perSecond" },
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

export default function Game() {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [eggModal, setEggModal] = useState<{
    isOpen: boolean;
    result?: Pet;
    eggType?: EggType;
  }>({ isOpen: false });
  const [isTradingModalOpen, setIsTradingModalOpen] = useState(false);

  // Fetch game state from server
  const { data: gameState, isLoading } = useQuery({
    queryKey: ["/api/game-state"],
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 3;
    },
  });

  // Save game state mutation
  const saveGameMutation = useMutation({
    mutationFn: async (gameData: Partial<GameState>) => {
      return await apiRequest("/api/game-state", "POST", gameData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
    },
    onError: (error) => {
      if (isUnauthorizedError(error as Error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: "Failed to save game progress",
        variant: "destructive",
      });
    },
  });

  // Auto-save game state
  useEffect(() => {
    if (gameState) {
      const interval = setInterval(() => {
        saveGameMutation.mutate(gameState);
      }, 30000); // Auto-save every 30 seconds

      return () => clearInterval(interval);
    }
  }, [gameState, saveGameMutation]);

  // Income calculation and money update
  useEffect(() => {
    if (!gameState) return;

    const interval = setInterval(() => {
      const currentGameState = gameState as GameState;
      const placedPets = currentGameState.pets?.filter((pet: Pet) => 
        currentGameState.storeSlots?.some((slot: StoreSlot) => slot.petId === pet.id)
      ) || [];

      let moneyGained = 0;
      placedPets.forEach((pet: Pet) => {
        if (pet.incomeType === "perSecond") {
          moneyGained += pet.income;
        } else if (pet.incomeType === "perSecondSquared") {
          const timeMultiplier = 1; // For now, just use base rate
          moneyGained += pet.income * timeMultiplier;
        }
      });

      if (moneyGained > 0) {
        saveGameMutation.mutate({
          ...currentGameState,
          money: currentGameState.money + moneyGained,
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [gameState, saveGameMutation]);

  if (isLoading) {
    return (
      <div className="game-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg text-muted-foreground">Loading your pet store...</p>
        </div>
      </div>
    );
  }

  if (!gameState) {
    return (
      <div className="game-bg min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">Failed to load game state</p>
        </div>
      </div>
    );
  }

  const currentStore = STORE_TYPES.find(store => store.id === gameState?.store) || STORE_TYPES[0];
  const placedPets = gameState?.pets?.filter((pet: Pet) => 
    gameState?.storeSlots?.some((slot: StoreSlot) => slot.petId === pet.id)
  ) || [];
  
  const currentIncome = placedPets.reduce((total: number, pet: Pet) => {
    return total + (pet.incomeType === "perSecond" ? pet.income : pet.income);
  }, 0);

  const buyEgg = (eggType: EggType) => {
    if (!gameState || gameState.money < eggType.cost) {
      toast({
        title: "Not enough money!",
        description: `You need $${formatNumber(eggType.cost)} to buy this egg.`,
        variant: "destructive",
      });
      return;
    }

    if ((gameState.pets?.length || 0) >= currentStore.capacity) {
      toast({
        title: "Store is full!",
        description: "Upgrade your store to hold more pets.",
        variant: "destructive",
      });
      return;
    }

    const newPet = openEgg(eggType);
    const updatedGameState = {
      ...gameState,
      money: gameState.money - eggType.cost,
      pets: [...(gameState.pets || []), newPet],
    };

    saveGameMutation.mutate(updatedGameState);

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
    if (!gameState || gameState.money < storeType.cost) {
      toast({
        title: "Not enough money!",
        description: `You need $${formatNumber(storeType.cost)} to upgrade to ${storeType.name}.`,
        variant: "destructive",
      });
      return;
    }

    // Create new store slots
    const newSlots: StoreSlot[] = [];
    for (let i = 0; i < storeType.capacity; i++) {
      newSlots.push({
        id: generateId(),
        position: i,
        petId: gameState.storeSlots?.[i]?.petId, // Keep existing pets
      });
    }

    const updatedGameState = {
      ...gameState,
      money: gameState.money - storeType.cost,
      store: storeType.id,
      storeSlots: newSlots,
    };

    saveGameMutation.mutate(updatedGameState);

    toast({
      title: "Store Upgraded!",
      description: `Welcome to your new ${storeType.name}! Capacity: ${storeType.capacity} pets.`,
    });
  };

  const placePetInSlot = (pet: Pet, slotId: string) => {
    if (!gameState) return;
    
    const updatedSlots = gameState.storeSlots?.map((slot: StoreSlot) => 
      slot.id === slotId ? { ...slot, petId: pet.id } : slot
    ) || [];

    saveGameMutation.mutate({
      ...gameState,
      storeSlots: updatedSlots,
    });

    toast({
      title: "Pet Placed!",
      description: `${pet.name} is now generating income!`,
    });
  };

  const removePetFromSlot = (slotId: string) => {
    if (!gameState) return;
    
    const updatedSlots = gameState.storeSlots?.map((slot: StoreSlot) => 
      slot.id === slotId ? { ...slot, petId: undefined } : slot
    ) || [];

    saveGameMutation.mutate({
      ...gameState,
      storeSlots: updatedSlots,
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
    if (!gameState) return undefined;
    const currentIndex = STORE_TYPES.findIndex(store => store.id === gameState.store);
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
                  ${formatNumber(gameState?.money || 0)}
                </span>
              </div>
              <div className="flex items-center space-x-2 bg-accent/10 px-4 py-2 rounded-lg">
                <i className="fas fa-dollar-sign text-accent"></i>
                <span className="text-sm text-muted-foreground" data-testid="income-display">
                  ${formatNumber(currentIncome)}/s
                </span>
              </div>
              <Button
                onClick={() => setIsTradingModalOpen(true)}
                className="bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700"
                size="sm"
                data-testid="trading-button"
              >
                <i className="fas fa-handshake mr-2"></i>
                Trade
              </Button>
              <Button
                onClick={() => window.location.href = "/api/logout"}
                variant="outline"
                size="sm"
                data-testid="logout-button"
              >
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Store Slots */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-foreground flex items-center">
                    <i className="fas fa-building mr-3 text-primary"></i>
                    {currentStore.name}
                  </h2>
                  <div className="bg-primary/10 px-3 py-1 rounded-full">
                    <span className="text-primary font-semibold text-sm">
                      {placedPets.length}/{currentStore.capacity} pets
                    </span>
                  </div>
                </div>

                {/* Store Slots Grid */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {gameState?.storeSlots?.slice(0, currentStore.capacity).map((slot: StoreSlot) => {
                    const pet = gameState?.pets?.find((p: Pet) => p.id === slot.petId);
                    return (
                      <div
                        key={slot.id}
                        className={`aspect-square border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-all ${
                          pet ? 'border-primary bg-primary/10' : 'border-muted-foreground/30 hover:border-primary/50'
                        }`}
                        data-testid={`store-slot-${slot.position}`}
                      >
                        {pet ? (
                          <div className="text-center" onClick={() => removePetFromSlot(slot.id)}>
                            <div className="text-2xl mb-1">{getPetIcon(pet.name)}</div>
                            <div className="text-xs font-medium text-foreground">{pet.name}</div>
                            <div className="text-xs text-muted-foreground">
                              ${formatNumber(pet.income)}/s
                            </div>
                          </div>
                        ) : (
                          <div className="text-center text-muted-foreground">
                            <i className="fas fa-plus text-xl mb-1"></i>
                            <div className="text-xs">Empty Slot</div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Store Upgrade */}
                {getNextStoreUpgrade() && (
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-foreground">Upgrade Available</h4>
                        <p className="text-sm text-muted-foreground">
                          {getNextStoreUpgrade()!.name} - {getNextStoreUpgrade()!.capacity} slots
                        </p>
                      </div>
                      <Button
                        onClick={() => upgradeStore(getNextStoreUpgrade()!)}
                        className="bg-accent hover:bg-accent/90"
                        data-testid="upgrade-store-button"
                      >
                        ${formatNumber(getNextStoreUpgrade()!.cost)}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pet Inventory */}
            <Card className="shadow-lg">
              <CardContent className="p-6">
                <h3 className="text-lg font-bold text-foreground mb-4 flex items-center">
                  <i className="fas fa-box mr-2 text-secondary"></i>
                  Pet Inventory ({gameState.pets?.length || 0})
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {gameState?.pets
                    ?.filter((pet: Pet) => !gameState?.storeSlots?.some((slot: StoreSlot) => slot.petId === pet.id))
                    .map((pet: Pet) => (
                    <div
                      key={pet.id}
                      className={`rarity-${pet.rarity} border-2 rounded-lg p-3 cursor-pointer hover:shadow-md transition-all`}
                      onClick={() => {
                        const emptySlot = gameState?.storeSlots?.find((slot: StoreSlot) => !slot.petId);
                        if (emptySlot) {
                          placePetInSlot(pet, emptySlot.id);
                        } else {
                          toast({
                            title: "No empty slots!",
                            description: "All store slots are occupied. Remove a pet first.",
                            variant: "destructive",
                          });
                        }
                      }}
                      data-testid={`pet-inventory-${pet.id}`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">{getPetIcon(pet.name)}</div>
                        <div className="flex-1">
                          <div className="font-medium text-foreground">{pet.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ${formatNumber(pet.income)}/{pet.incomeType === "perSecond" ? "s" : "s²"}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!gameState?.pets?.length || gameState?.pets.every((pet: Pet) => 
                    gameState?.storeSlots?.some((slot: StoreSlot) => slot.petId === pet.id)
                  )) && (
                    <div className="text-center text-muted-foreground py-8">
                      <i className="fas fa-shopping-cart text-3xl mb-2"></i>
                      <p>No pets in inventory</p>
                      <p className="text-sm">Buy eggs to get pets!</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Egg Shop */}
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

                <div className="space-y-4">
                  {EGG_TYPES.map(egg => (
                    <div key={egg.id} className={`rarity-${egg.rarity} border-2 rounded-xl p-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-xl">
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
                  ))}
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
        className="max-w-lg"
      >
        {eggModal.result && (
          <div className="text-center">
            <div className="mb-6">
              <div className="text-6xl mb-4">{getPetIcon(eggModal.result.name)}</div>
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Congratulations!
              </h3>
              <p className="text-lg text-muted-foreground">
                You got a <span className="font-semibold text-foreground">{eggModal.result.name}</span>!
              </p>
            </div>
            <div className="space-y-2 mb-6">
              <div className="flex justify-center items-center space-x-2">
                <i className="fas fa-dollar-sign text-accent"></i>
                <span className="text-lg">
                  Income: ${formatNumber(eggModal.result.income)}/{eggModal.result.incomeType === "perSecond" ? "s" : "s²"}
                </span>
              </div>
              <div className={`rarity-${eggModal.result.rarity} border rounded-lg p-2 inline-block`}>
                <span className="text-sm font-medium capitalize">{eggModal.result.rarity}</span>
              </div>
            </div>
            <Button
              onClick={() => setEggModal({ isOpen: false })}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              data-testid="close-egg-modal"
            >
              Place in Store
            </Button>
          </div>
        )}
      </Modal>

      {/* Trading Modal */}
      {gameState && user && (
        <TradingModal
          isOpen={isTradingModalOpen}
          onClose={() => setIsTradingModalOpen(false)}
          gameState={gameState}
          currentUser={user}
        />
      )}
    </div>
  );
}