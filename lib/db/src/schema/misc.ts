import { pgTable, pgEnum, text, boolean, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { listings } from "./listings";
import { numeric } from "drizzle-orm/pg-core";

export const documentTypeEnum = pgEnum("document_type", [
  "TITLE_DEED", "SURVEY_PLAN", "BUILDING_PERMIT", "PURCHASE_AGREEMENT",
  "POWER_OF_ATTORNEY", "IDENTITY_DOCUMENT", "PROOF_OF_FUNDS",
  "INSPECTION_REPORT", "TAX_CLEARANCE", "OTHER",
]);
export const documentStatusEnum = pgEnum("document_status", ["PENDING", "UPLOADED", "VERIFIED", "REJECTED", "EXPIRED"]);
export const notificationTypeEnum = pgEnum("notification_type", ["EMAIL", "SMS", "PUSH", "IN_APP"]);
export const notificationStatusEnum = pgEnum("notification_status", ["PENDING", "SENT", "DELIVERED", "FAILED", "READ"]);

export const documents = pgTable("documents", {
  id:              text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:       text("listing_id").references(() => listings.id),
  uploadedById:    text("uploaded_by_id").references(() => users.id),
  type:            documentTypeEnum("type").notNull(),
  status:          documentStatusEnum("status").notNull().default("PENDING"),
  title:           text("title").notNull(),
  fileUrl:         text("file_url"),
  fileSize:        integer("file_size"),
  mimeType:        text("mime_type"),
  isPublic:        boolean("is_public").notNull().default(false),
  verifiedAt:      timestamp("verified_at"),
  verifiedById:    text("verified_by_id"),
  rejectionReason: text("rejection_reason"),
  expiresAt:       timestamp("expires_at"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:      text("user_id").references(() => users.id, { onDelete: "cascade" }),
  type:        notificationTypeEnum("type").notNull().default("IN_APP"),
  status:      notificationStatusEnum("status").notNull().default("PENDING"),
  title:       text("title").notNull(),
  body:        text("body").notNull(),
  data:        jsonb("data"),
  scheduledAt: timestamp("scheduled_at"),
  sentAt:      timestamp("sent_at"),
  readAt:      timestamp("read_at"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
});

export const auditLogs = pgTable("audit_logs", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:     text("user_id"),
  action:     text("action").notNull(),
  resource:   text("resource").notNull(),
  resourceId: text("resource_id"),
  oldValues:  jsonb("old_values"),
  newValues:  jsonb("new_values"),
  ipAddress:  text("ip_address"),
  userAgent:  text("user_agent"),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("audit_resource_idx").on(t.resource, t.resourceId),
  index("audit_created_idx").on(t.createdAt),
]);

export const exchangeRates = pgTable("exchange_rates", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  fromCurrency: text("from_currency").notNull(),
  toCurrency:   text("to_currency").notNull(),
  rate:         numeric("rate", { precision: 15, scale: 6 }).notNull(),
  source:       text("source").notNull().default("manual"),
  updatedAt:    timestamp("updated_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const documentsRelations = relations(documents, ({ one }) => ({
  listing:    one(listings, { fields: [documents.listingId],    references: [listings.id] }),
  uploadedBy: one(users,    { fields: [documents.uploadedById], references: [users.id] }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, { fields: [notifications.userId], references: [users.id] }),
}));

export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
