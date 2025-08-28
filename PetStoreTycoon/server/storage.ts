import {
  users,
  gameStates,
  tradeOffers,
  type User,
  type UpsertUser,
  type GameState,
  type InsertGameState,
  type TradeOffer,
  type InsertTradeOffer,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Game state operations
  getGameState(userId: string): Promise<GameState | undefined>;
  upsertGameState(gameState: InsertGameState): Promise<GameState>;
  
  // Trade operations
  getTradeOffers(userId: string): Promise<TradeOffer[]>;
  createTradeOffer(tradeOffer: InsertTradeOffer): Promise<TradeOffer>;
  updateTradeOfferStatus(id: string, status: string): Promise<TradeOffer>;
  getTradeOffer(id: string): Promise<TradeOffer | undefined>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getGameState(userId: string): Promise<GameState | undefined> {
    const [gameState] = await db.select().from(gameStates).where(eq(gameStates.userId, userId));
    return gameState;
  }

  async upsertGameState(gameStateData: InsertGameState): Promise<GameState> {
    const existingGameState = await this.getGameState(gameStateData.userId);
    
    if (existingGameState) {
      const [gameState] = await db
        .update(gameStates)
        .set({
          ...gameStateData,
          updatedAt: new Date(),
          lastSave: new Date(),
        })
        .where(eq(gameStates.userId, gameStateData.userId))
        .returning();
      return gameState;
    } else {
      const [gameState] = await db
        .insert(gameStates)
        .values({
          ...gameStateData,
          lastSave: new Date(),
        })
        .returning();
      return gameState;
    }
  }

  async getTradeOffers(userId: string): Promise<TradeOffer[]> {
    const trades = await db
      .select()
      .from(tradeOffers)
      .where(
        or(
          eq(tradeOffers.fromUserId, userId),
          eq(tradeOffers.toUserId, userId)
        )
      );
    return trades;
  }

  async createTradeOffer(tradeOfferData: InsertTradeOffer): Promise<TradeOffer> {
    const [tradeOffer] = await db
      .insert(tradeOffers)
      .values(tradeOfferData)
      .returning();
    return tradeOffer;
  }

  async updateTradeOfferStatus(id: string, status: string): Promise<TradeOffer> {
    const [tradeOffer] = await db
      .update(tradeOffers)
      .set({ status, updatedAt: new Date() })
      .where(eq(tradeOffers.id, id))
      .returning();
    return tradeOffer;
  }

  async getTradeOffer(id: string): Promise<TradeOffer | undefined> {
    const [tradeOffer] = await db.select().from(tradeOffers).where(eq(tradeOffers.id, id));
    return tradeOffer;
  }
}

export const storage = new DatabaseStorage();
