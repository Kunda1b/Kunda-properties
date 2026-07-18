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
  listingId:       text("listing_id").references(() => listings.id, { onDelete: "set null" }),
  uploadedById:    text("uploaded_by_id").references(() => users.id, { onDelete: "set null" }),
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
}, (t) => [
  index("doc_listing_idx").on(t.listingId),
  index("doc_uploader_idx").on(t.uploadedById),
  index("doc_status_idx").on(t.status),
]);

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
}, (t) => [
  index("notif_user_idx").on(t.userId),
  index("notif_status_idx").on(t.status),
  index("notif_created_idx").on(t.createdAt),
]);

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

export const conversations = pgTable("conversations", {
  id:         text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:  text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  buyerId:    text("buyer_id").notNull().references(() => users.id),
  sellerId:   text("seller_id").notNull().references(() => users.id),
  subject:    text("subject"),
  lastMessageAt: timestamp("last_message_at").defaultNow().notNull(),
  createdAt:  timestamp("created_at").defaultNow().notNull(),
  updatedAt:  timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("conv_listing_idx").on(t.listingId),
  index("conv_buyer_idx").on(t.buyerId),
  index("conv_seller_idx").on(t.sellerId),
]);

export const messages = pgTable("messages", {
  id:             text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  conversationId: text("conversation_id").notNull().references(() => conversations.id, { onDelete: "cascade" }),
  senderId:       text("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  body:           text("body").notNull(),
  readAt:         timestamp("read_at"),
  createdAt:      timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("msg_conv_idx").on(t.conversationId),
  index("msg_sender_idx").on(t.senderId),
]);

export const viewingRequests = pgTable("viewing_requests", {
  id:              text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:       text("listing_id").notNull().references(() => listings.id),
  buyerId:         text("buyer_id").notNull().references(() => users.id),
  sellerId:        text("seller_id").notNull().references(() => users.id),
  type:            text("type").notNull().default("IN_PERSON"),
  preferredDate:   timestamp("preferred_date").notNull(),
  preferredTime:   text("preferred_time"),
  message:         text("message"),
  status:          text("status").notNull().default("PENDING"),
  scheduledDate:   timestamp("scheduled_date"),
  scheduledTime:   text("scheduled_time"),
  meetingLink:     text("meeting_link"),
  notes:           text("notes"),
  respondedAt:     timestamp("responded_at"),
  createdAt:       timestamp("created_at").defaultNow().notNull(),
  updatedAt:       timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("vr_listing_idx").on(t.listingId),
  index("vr_buyer_idx").on(t.buyerId),
  index("vr_seller_idx").on(t.sellerId),
]);

export const neighbourhoodGuides = pgTable("neighbourhood_guides", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  area:        text("area").notNull().unique(),
  region:      text("region").notNull(),
  description: text("description").notNull(),
  imageUrl:    text("image_url"),
  latitude:    numeric("latitude", { precision: 10, scale: 7 }),
  longitude:   numeric("longitude", { precision: 10, scale: 7 }),
  highlights:  text("highlights").array().default([]),
  amenities:   text("amenities").array().default([]),
  diasporaTips: text("diaspora_tips"),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
  updatedAt:   timestamp("updated_at").defaultNow().notNull(),
});

export const listingAnalytics = pgTable("listing_analytics", {
  id:          text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:   text("listing_id").notNull().unique().references(() => listings.id, { onDelete: "cascade" }),
  viewCount:   integer("view_count").notNull().default(0),
  savedCount:  integer("saved_count").notNull().default(0),
  enquiryCount: integer("enquiry_count").notNull().default(0),
  offerCount:  integer("offer_count").notNull().default(0),
  date:        timestamp("date").notNull().defaultNow(),
  createdAt:   timestamp("created_at").defaultNow().notNull(),
}, (t) => [
  index("la_listing_idx").on(t.listingId),
  index("la_date_idx").on(t.date),
]);

// ─── Relations ───────────────────────────────────────────────────────────────
export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  listing: one(listings, { fields: [conversations.listingId], references: [listings.id] }),
  buyer:   one(users, { fields: [conversations.buyerId], references: [users.id], relationName: "convBuyer" }),
  seller:  one(users, { fields: [conversations.sellerId], references: [users.id], relationName: "convSeller" }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender:       one(users, { fields: [messages.senderId], references: [users.id] }),
}));

export const viewingRequestsRelations = relations(viewingRequests, ({ one }) => ({
  listing: one(listings, { fields: [viewingRequests.listingId], references: [listings.id] }),
  buyer:   one(users, { fields: [viewingRequests.buyerId], references: [users.id], relationName: "vrBuyer" }),
  seller:  one(users, { fields: [viewingRequests.sellerId], references: [users.id], relationName: "vrSeller" }),
}));

export const neighbourhoodGuidesRelations = relations(neighbourhoodGuides, () => ({}));

export const listingAnalyticsRelations = relations(listingAnalytics, ({ one }) => ({
  listing: one(listings, { fields: [listingAnalytics.listingId], references: [listings.id] }),
}));

export type Document = typeof documents.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type AuditLog = typeof auditLogs.$inferSelect;
export type ExchangeRate = typeof exchangeRates.$inferSelect;
export type Conversation = typeof conversations.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ViewingRequest = typeof viewingRequests.$inferSelect;
export type NeighbourhoodGuide = typeof neighbourhoodGuides.$inferSelect;
export type ListingAnalytics = typeof listingAnalytics.$inferSelect;
