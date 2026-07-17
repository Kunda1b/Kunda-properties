import { pgTable, pgEnum, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

export const userRoleEnum = pgEnum("user_role", ["BUYER", "SELLER", "AGENT", "ADMIN", "SUPER_ADMIN"]);
export const listingCurrencyEnum = pgEnum("listing_currency", ["GMD", "USD", "GBP", "EUR"]);

export const users = pgTable("users", {
  id:                 text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email:              text("email").notNull().unique(),
  phone:              text("phone").unique(),
  passwordHash:       text("password_hash").notNull(),
  role:               userRoleEnum("role").notNull().default("BUYER"),
  isEmailVerified:    boolean("is_email_verified").notNull().default(false),
  isPhoneVerified:    boolean("is_phone_verified").notNull().default(false),
  isActive:           boolean("is_active").notNull().default(true),
  isSuspended:        boolean("is_suspended").notNull().default(false),
  diasporaCountry:    text("diaspora_country"),
  preferredCurrency:  listingCurrencyEnum("preferred_currency").notNull().default("USD"),
  stripeCustomerId:   text("stripe_customer_id"),
  stripeAccountId:    text("stripe_account_id"),
  createdAt:          timestamp("created_at").defaultNow().notNull(),
  updatedAt:          timestamp("updated_at").defaultNow().notNull(),
});

export const userProfiles = pgTable("user_profiles", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:      text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  firstName:   text("first_name"),
  lastName:    text("last_name"),
  bio:         text("bio"),
  avatarUrl:   text("avatar_url"),
  city:        text("city"),
  country:     text("country"),
  languages:   text("languages").array().default([]),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export const sessions = pgTable("sessions", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:       text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  refreshToken: text("refresh_token").notNull().unique(),
  userAgent:    text("user_agent"),
  ipAddress:    text("ip_address"),
  expiresAt:    timestamp("expires_at").notNull(),
  revokedAt:    timestamp("revoked_at"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const usersRelations = relations(users, ({ one, many }) => ({
  profile:  one(userProfiles, { fields: [users.id], references: [userProfiles.userId] }),
  sessions: many(sessions),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
  user: one(users, { fields: [userProfiles.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type Session = typeof sessions.$inferSelect;
