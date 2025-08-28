import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, real, jsonb, timestamp, uuid, boolean } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const sessions = pgTable("sessions", {
  sid: varchar("sid").primaryKey(),
  sess: jsonb("sess").notNull(),
  expire: timestamp("expire").notNull(),
});

// User storage table.
// (IMPORTANT) This table is mandatory for Replit Auth, don't drop it.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gameStates = pgTable("game_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  money: real("money").notNull().default(1000),
  pets: jsonb("pets").notNull().default([]),
  storeSlots: jsonb("store_slots").notNull().default([]),
  store: text("store").notNull().default("shack"),
  lastSave: timestamp("last_save").notNull().defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const tradeOffers = pgTable("trade_offers", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fromUserId: varchar("from_user_id").notNull().references(() => users.id),
  toUserId: varchar("to_user_id").notNull().references(() => users.id),
  fromItems: jsonb("from_items").notNull(), // { money: number, pets: Pet[] }
  toItems: jsonb("to_items").notNull(), // { money: number, pets: Pet[] }
  status: varchar("status").notNull().default("pending"), // pending, accepted, rejected, cancelled
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  gameState: one(gameStates),
  sentTrades: many(tradeOffers, { relationName: "sentTrades" }),
  receivedTrades: many(tradeOffers, { relationName: "receivedTrades" }),
}));

export const gameStatesRelations = relations(gameStates, ({ one }) => ({
  user: one(users, {
    fields: [gameStates.userId],
    references: [users.id],
  }),
}));

export const tradeOffersRelations = relations(tradeOffers, ({ one }) => ({
  fromUser: one(users, {
    fields: [tradeOffers.fromUserId],
    references: [users.id],
    relationName: "sentTrades",
  }),
  toUser: one(users, {
    fields: [tradeOffers.toUserId],
    references: [users.id],
    relationName: "receivedTrades",
  }),
}));

// Schema types
export const insertGameStateSchema = createInsertSchema(gameStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastSave: true,
});

export const insertTradeOfferSchema = createInsertSchema(tradeOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type InsertGameState = z.infer<typeof insertGameStateSchema>;
export type GameState = typeof gameStates.$inferSelect;
export type InsertTradeOffer = z.infer<typeof insertTradeOfferSchema>;
export type TradeOffer = typeof tradeOffers.$inferSelect;

// Store slot type for game logic
export type StoreSlot = {
  id: string;
  petId?: string; // undefined if empty slot
  position: number;
};

// Trade items type
export type TradeItems = {
  money: number;
  pets: Pet[];
};

// Pet type for game logic
export type Pet = {
  id: string;
  name: string;
  rarity: string;
  income: number;
  incomeType: 'perSecond' | 'perSecondSquared';
};

// Egg type for game logic
export type EggType = {
  id: string;
  name: string;
  cost: number;
  rarity: string;
  pets: {
    name: string;
    chance: number;
    income: number;
    incomeType: 'perSecond' | 'perSecondSquared';
  }[];
};

// Store type for game logic
export type StoreType = {
  id: string;
  name: string;
  capacity: number;
  cost: number;
};
