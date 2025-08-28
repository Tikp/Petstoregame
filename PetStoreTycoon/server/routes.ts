import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { insertGameStateSchema, insertTradeOfferSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Game state endpoints
  app.get("/api/game-state", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let gameState = await storage.getGameState(userId);
      
      // Create initial game state if it doesn't exist
      if (!gameState) {
        gameState = await storage.upsertGameState({
          userId,
          money: 1000,
          pets: [],
          storeSlots: [
            { id: "1", position: 0 },
            { id: "2", position: 1 },
            { id: "3", position: 2 }
          ],
          store: "shack"
        });
      }
      
      res.json(gameState);
    } catch (error) {
      console.error("Error fetching game state:", error);
      res.status(500).json({ message: "Failed to fetch game state" });
    }
  });

  app.post("/api/game-state", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const gameStateData = insertGameStateSchema.parse({
        ...req.body,
        userId
      });
      
      const gameState = await storage.upsertGameState(gameStateData);
      res.json(gameState);
    } catch (error) {
      console.error("Error saving game state:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid game state data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to save game state" });
      }
    }
  });

  // Trade endpoints
  app.get("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const trades = await storage.getTradeOffers(userId);
      res.json(trades);
    } catch (error) {
      console.error("Error fetching trades:", error);
      res.status(500).json({ message: "Failed to fetch trades" });
    }
  });

  app.post("/api/trades", isAuthenticated, async (req: any, res) => {
    try {
      const fromUserId = req.user.claims.sub;
      const tradeData = insertTradeOfferSchema.parse({
        ...req.body,
        fromUserId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
      });
      
      const trade = await storage.createTradeOffer(tradeData);
      res.json(trade);
    } catch (error) {
      console.error("Error creating trade:", error);
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid trade data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create trade" });
      }
    }
  });

  app.patch("/api/trades/:id/status", isAuthenticated, async (req: any, res) => {
    try {
      const tradeId = req.params.id;
      const { status } = req.body;
      const userId = req.user.claims.sub;
      
      // Verify trade exists and user is involved
      const trade = await storage.getTradeOffer(tradeId);
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      if (trade.fromUserId !== userId && trade.toUserId !== userId) {
        return res.status(403).json({ message: "Not authorized to modify this trade" });
      }
      
      const updatedTrade = await storage.updateTradeOfferStatus(tradeId, status);
      res.json(updatedTrade);
    } catch (error) {
      console.error("Error updating trade status:", error);
      res.status(500).json({ message: "Failed to update trade status" });
    }
  });

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", message: "Pet Store Tycoon API is running" });
  });

  const httpServer = createServer(app);
  return httpServer;
}
