import { pgTable, pgEnum, text, numeric, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { listings } from "./listings";
import { listingCurrencyEnum } from "./users";

export const offerStatusEnum = pgEnum("offer_status", ["PENDING", "ACCEPTED", "REJECTED", "COUNTERED", "EXPIRED", "WITHDRAWN"]);
export const escrowStatusEnum = pgEnum("escrow_status", ["INITIATED", "FUNDED", "INSPECTING", "APPROVED", "DISPUTED", "RELEASED", "REFUNDED", "CANCELLED"]);
export const transactionTypeEnum = pgEnum("transaction_type", ["DEPOSIT", "FULL_PAYMENT", "INSTALLMENT", "FEE", "REFUND", "RELEASE"]);
export const transactionStatusEnum = pgEnum("transaction_status", ["PENDING", "PROCESSING", "COMPLETED", "FAILED", "REVERSED"]);

export const offers = pgTable("offers", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:      text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId:        text("buyer_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amount:         numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency:       listingCurrencyEnum("currency").notNull().default("USD"),
  message:        text("message"),
  status:         offerStatusEnum("status").notNull().default("PENDING"),
  expiresAt:      timestamp("expires_at").notNull(),
  counterAmount:  numeric("counter_amount", { precision: 15, scale: 2 }),
  counterMessage: text("counter_message"),
  acceptedAt:     timestamp("accepted_at"),
  rejectedAt:     timestamp("rejected_at"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
  updatedAt:      timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("offers_listing_idx").on(t.listingId),
  index("offers_buyer_idx").on(t.buyerId),
  index("offers_status_idx").on(t.status),
]);

export const escrowAccounts = pgTable("escrow_accounts", {
  id:                     text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:              text("listing_id").notNull().references(() => listings.id),
  offerId:                text("offer_id").references(() => offers.id),
  buyerId:                text("buyer_id").notNull().references(() => users.id),
  sellerId:               text("seller_id").notNull().references(() => users.id),
  status:                 escrowStatusEnum("status").notNull().default("INITIATED"),
  totalAmount:            numeric("total_amount", { precision: 15, scale: 2 }).notNull(),
  currency:               listingCurrencyEnum("currency").notNull(),
  platformFeePercent:     numeric("platform_fee_percent", { precision: 5, scale: 2 }).notNull().default("2.5"),
  platformFeeAmount:      numeric("platform_fee_amount", { precision: 15, scale: 2 }),
  sellerPayoutAmount:     numeric("seller_payout_amount", { precision: 15, scale: 2 }),
  stripePaymentIntentId:  text("stripe_payment_intent_id"),
  stripeTransferId:       text("stripe_transfer_id"),
  referenceNumber:        text("reference_number"),
  inspectionDeadline:     timestamp("inspection_deadline"),
  releasedAt:             timestamp("released_at"),
  refundedAt:             timestamp("refunded_at"),
  adminNotes:             text("admin_notes"),
  notes:                  text("notes"),
  createdAt:              timestamp("created_at").defaultNow().notNull(),
  updatedAt:              timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("escrow_buyer_idx").on(t.buyerId),
  index("escrow_seller_idx").on(t.sellerId),
  index("escrow_listing_idx").on(t.listingId),
]);

export const escrowMilestones = pgTable("escrow_milestones", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  escrowId:    text("escrow_id").notNull().references(() => escrowAccounts.id, { onDelete: "cascade" }),
  title:       text("title").notNull(),
  description: text("description"),
  amount:      numeric("amount", { precision: 15, scale: 2 }).notNull().default("0"),
  order:       integer("order").notNull().default(0),
  completedAt: timestamp("completed_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("milestone_escrow_idx").on(t.escrowId),
]);

export const transactions = pgTable("transactions", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  escrowId:       text("escrow_id").notNull().references(() => escrowAccounts.id, { onDelete: "cascade" }),
  type:           transactionTypeEnum("type").notNull(),
  status:         transactionStatusEnum("status").notNull().default("PENDING"),
  amount:         numeric("amount", { precision: 15, scale: 2 }).notNull(),
  currency:       listingCurrencyEnum("currency").notNull(),
  stripeChargeId: text("stripe_charge_id"),
  processedAt:    timestamp("processed_at"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("transaction_escrow_idx").on(t.escrowId),
  index("transaction_status_idx").on(t.status),
]);

// ─── Relations ───────────────────────────────────────────────────────────────
export const offersRelations = relations(offers, ({ one }) => ({
  listing: one(listings, { fields: [offers.listingId], references: [listings.id] }),
  buyer:   one(users,    { fields: [offers.buyerId],   references: [users.id] }),
}));

export const escrowAccountsRelations = relations(escrowAccounts, ({ one, many }) => ({
  listing:      one(listings,  { fields: [escrowAccounts.listingId], references: [listings.id] }),
  offer:        one(offers,    { fields: [escrowAccounts.offerId],   references: [offers.id] }),
  buyer:        one(users,     { fields: [escrowAccounts.buyerId],   references: [users.id], relationName: "escrowBuyer" }),
  seller:       one(users,     { fields: [escrowAccounts.sellerId],  references: [users.id], relationName: "escrowSeller" }),
  milestones:   many(escrowMilestones),
  transactions: many(transactions),
}));

export const escrowMilestonesRelations = relations(escrowMilestones, ({ one }) => ({
  escrow: one(escrowAccounts, { fields: [escrowMilestones.escrowId], references: [escrowAccounts.id] }),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  escrow: one(escrowAccounts, { fields: [transactions.escrowId], references: [escrowAccounts.id] }),
}));

export type Offer = typeof offers.$inferSelect;
export type EscrowAccount = typeof escrowAccounts.$inferSelect;
export type Transaction = typeof transactions.$inferSelect;
