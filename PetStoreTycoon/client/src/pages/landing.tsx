import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function Landing() {
  return (
    <div className="game-bg min-h-screen flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="space-y-8">
          {/* Hero Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-center space-x-3 mb-6">
              <i className="fas fa-store text-6xl text-primary"></i>
              <h1 className="text-6xl font-bold text-foreground">Pet Store Tycoon</h1>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Build your pet empire! Buy eggs, collect amazing pets, upgrade your store, and trade with other players.
            </p>
          </div>

          {/* Features Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 my-12">
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-egg text-4xl text-secondary mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">Collect Pets</h3>
                <p className="text-muted-foreground">Buy eggs and discover rare pets with different income rates</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-building text-4xl text-accent mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">Upgrade Stores</h3>
                <p className="text-muted-foreground">Expand from a shack to a pet mall with hundreds of slots</p>
              </CardContent>
            </Card>
            
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6 text-center">
                <i className="fas fa-handshake text-4xl text-primary mb-4"></i>
                <h3 className="text-lg font-semibold mb-2">Trade & Connect</h3>
                <p className="text-muted-foreground">Trade pets and money with other players worldwide</p>
              </CardContent>
            </Card>
          </div>

          {/* Call to Action */}
          <div className="space-y-4">
            <Button 
              onClick={() => window.location.href = "/api/login"}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all"
              data-testid="login-button"
            >
              Start Your Pet Empire
            </Button>
            <p className="text-sm text-muted-foreground">
              Sign in with your Replit account to save your progress
            </p>
          </div>

          {/* Game Preview */}
          <div className="mt-12">
            <Card className="overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 p-8">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-foreground">🐕</div>
                      <div className="text-sm text-muted-foreground">Dogs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">🐍</div>
                      <div className="text-sm text-muted-foreground">Reptiles</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">🦋</div>
                      <div className="text-sm text-muted-foreground">Bugs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-foreground">🐲</div>
                      <div className="text-sm text-muted-foreground">Legendaries</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}