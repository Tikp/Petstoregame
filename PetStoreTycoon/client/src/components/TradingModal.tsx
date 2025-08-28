import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import type { Pet, TradeOffer, GameState, User } from "@shared/schema";

interface TradingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameState: GameState;
  currentUser: User;
}

function formatNumber(num: number): string {
  if (num >= 1000000000) return (num / 1000000000).toFixed(1) + "B";
  if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
  if (num >= 1000) return (num / 1000).toFixed(1) + "K";
  return Math.floor(num).toLocaleString();
}

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

export function TradingModal({ isOpen, onClose, gameState, currentUser }: TradingModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"create" | "offers">("offers");
  const [selectedPets, setSelectedPets] = useState<Pet[]>([]);
  const [offerMoney, setOfferMoney] = useState(0);
  const [requestMoney, setRequestMoney] = useState(0);
  const [recipientUserId, setRecipientUserId] = useState("");

  // Fetch trade offers
  const { data: tradeOffers = [] } = useQuery({
    queryKey: ["/api/trades"],
    enabled: isOpen,
    retry: (failureCount, error) => {
      if (isUnauthorizedError(error as Error)) return false;
      return failureCount < 3;
    },
  });

  // Create trade offer mutation
  const createTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      return await apiRequest("/api/trades", "POST", tradeData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      setSelectedPets([]);
      setOfferMoney(0);
      setRequestMoney(0);
      setRecipientUserId("");
      toast({
        title: "Trade Created!",
        description: "Your trade offer has been sent.",
      });
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
        description: "Failed to create trade offer",
        variant: "destructive",
      });
    },
  });

  // Accept/reject trade mutation
  const updateTradeMutation = useMutation({
    mutationFn: async ({ tradeId, status }: { tradeId: string; status: string }) => {
      return await apiRequest(`/api/trades/${tradeId}/status`, "PATCH", { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/game-state"] });
      toast({
        title: "Trade Updated!",
        description: "The trade status has been updated.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to update trade",
        variant: "destructive",
      });
    },
  });

  const createTradeOffer = () => {
    if (!recipientUserId) {
      toast({
        title: "Missing Recipient",
        description: "Please enter a recipient user ID",
        variant: "destructive",
      });
      return;
    }

    if (selectedPets.length === 0 && offerMoney === 0) {
      toast({
        title: "Empty Offer",
        description: "Please select pets or add money to your offer",
        variant: "destructive",
      });
      return;
    }

    createTradeMutation.mutate({
      toUserId: recipientUserId,
      fromItems: {
        money: offerMoney,
        pets: selectedPets,
      },
      toItems: {
        money: requestMoney,
        pets: [], // For now, we'll keep it simple
      },
    });
  };

  const togglePetSelection = (pet: Pet) => {
    setSelectedPets(prev => 
      prev.some(p => p.id === pet.id)
        ? prev.filter(p => p.id !== pet.id)
        : [...prev, pet]
    );
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-4xl">
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-foreground flex items-center justify-center">
            <i className="fas fa-handshake mr-3 text-primary"></i>
            Trading Hub
          </h2>
          <p className="text-muted-foreground">Trade pets and money with other players</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-2 bg-muted rounded-lg p-1">
          <Button
            variant={activeTab === "offers" ? "default" : "ghost"}
            onClick={() => setActiveTab("offers")}
            className="flex-1"
            data-testid="tab-offers"
          >
            <i className="fas fa-inbox mr-2"></i>
            Trade Offers ({tradeOffers.length})
          </Button>
          <Button
            variant={activeTab === "create" ? "default" : "ghost"}
            onClick={() => setActiveTab("create")}
            className="flex-1"
            data-testid="tab-create"
          >
            <i className="fas fa-plus mr-2"></i>
            Create Trade
          </Button>
        </div>

        {/* Trade Offers Tab */}
        {activeTab === "offers" && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {tradeOffers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <i className="fas fa-inbox text-4xl mb-4"></i>
                <p>No trade offers yet</p>
                <p className="text-sm">Create a trade to get started!</p>
              </div>
            ) : (
              tradeOffers.map((trade: TradeOffer) => (
                <Card key={trade.id} className="border-2">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            trade.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                            trade.status === "accepted" ? "bg-green-100 text-green-800" :
                            "bg-red-100 text-red-800"
                          }`}>
                            {trade.status}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {trade.fromUserId === currentUser.id ? "Sent" : "Received"}
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <h4 className="font-medium text-sm">Offering:</h4>
                            <div className="text-sm text-muted-foreground">
                              {(trade.fromItems as any)?.money > 0 && (
                                <div>${formatNumber((trade.fromItems as any).money)}</div>
                              )}
                              {(trade.fromItems as any)?.pets?.map((pet: Pet) => (
                                <div key={pet.id} className="flex items-center space-x-1">
                                  <span>{getPetIcon(pet.name)}</span>
                                  <span>{pet.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div>
                            <h4 className="font-medium text-sm">Requesting:</h4>
                            <div className="text-sm text-muted-foreground">
                              {(trade.toItems as any)?.money > 0 && (
                                <div>${formatNumber((trade.toItems as any).money)}</div>
                              )}
                              {(trade.toItems as any)?.pets?.map((pet: Pet) => (
                                <div key={pet.id} className="flex items-center space-x-1">
                                  <span>{getPetIcon(pet.name)}</span>
                                  <span>{pet.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {trade.status === "pending" && trade.toUserId === currentUser.id && (
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => updateTradeMutation.mutate({ tradeId: trade.id, status: "accepted" })}
                            className="bg-green-600 hover:bg-green-700"
                            data-testid={`accept-trade-${trade.id}`}
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateTradeMutation.mutate({ tradeId: trade.id, status: "rejected" })}
                            data-testid={`reject-trade-${trade.id}`}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Create Trade Tab */}
        {activeTab === "create" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Your Offer */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Your Offer</h3>
                  
                  {/* Money Offer */}
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Money</label>
                    <Input
                      type="number"
                      value={offerMoney}
                      onChange={(e) => setOfferMoney(Number(e.target.value))}
                      placeholder="Enter amount"
                      max={gameState.money}
                      data-testid="offer-money-input"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Available: ${formatNumber(gameState.money)}
                    </p>
                  </div>

                  {/* Pet Selection */}
                  <div>
                    <label className="block text-sm font-medium mb-2">Pets</label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {gameState.pets?.map((pet: Pet) => (
                        <div
                          key={pet.id}
                          className={`p-2 rounded border cursor-pointer transition-all ${
                            selectedPets.some(p => p.id === pet.id)
                              ? "border-primary bg-primary/10"
                              : "border-muted hover:border-primary/50"
                          }`}
                          onClick={() => togglePetSelection(pet)}
                          data-testid={`select-pet-${pet.id}`}
                        >
                          <div className="flex items-center space-x-2">
                            <span>{getPetIcon(pet.name)}</span>
                            <span className="text-sm font-medium">{pet.name}</span>
                            <span className="text-xs text-muted-foreground">
                              ${formatNumber(pet.income)}/s
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Request */}
              <Card>
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Request</h3>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Recipient User ID</label>
                    <Input
                      value={recipientUserId}
                      onChange={(e) => setRecipientUserId(e.target.value)}
                      placeholder="Enter user ID"
                      data-testid="recipient-user-id-input"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-2">Money Request</label>
                    <Input
                      type="number"
                      value={requestMoney}
                      onChange={(e) => setRequestMoney(Number(e.target.value))}
                      placeholder="Enter amount"
                      data-testid="request-money-input"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Create Trade Button */}
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={onClose} data-testid="cancel-trade">
                Cancel
              </Button>
              <Button
                onClick={createTradeOffer}
                disabled={createTradeMutation.isPending}
                data-testid="create-trade-button"
              >
                {createTradeMutation.isPending ? "Creating..." : "Create Trade"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}