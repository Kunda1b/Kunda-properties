import { pgTable, pgEnum, text, boolean, integer, numeric, timestamp, index, primaryKey } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";
import { listingCurrencyEnum } from "./users";

export const propertyTypeEnum = pgEnum("property_type", ["HOUSE", "APARTMENT", "LAND", "COMMERCIAL", "VILLA", "COMPOUND"]);
export const propertyStatusEnum = pgEnum("property_status", ["DRAFT", "PENDING_REVIEW", "ACTIVE", "UNDER_OFFER", "SOLD", "WITHDRAWN", "SUSPENDED"]);

export const listings = pgTable("listings", {
  id:                  text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  sellerId:            text("seller_id").notNull().references(() => users.id),
  title:               text("title").notNull(),
  slug:                text("slug").notNull().unique(),
  description:         text("description").notNull(),
  propertyType:        propertyTypeEnum("property_type").notNull(),
  status:              propertyStatusEnum("status").notNull().default("DRAFT"),
  price:               numeric("price", { precision: 15, scale: 2 }).notNull(),
  currency:            listingCurrencyEnum("currency").notNull().default("GMD"),
  priceUsd:            numeric("price_usd", { precision: 15, scale: 2 }),
  address:             text("address").notNull(),
  region:              text("region").notNull(),
  area:                text("area"),
  latitude:            numeric("latitude", { precision: 10, scale: 7 }),
  longitude:           numeric("longitude", { precision: 10, scale: 7 }),
  bedrooms:            integer("bedrooms"),
  bathrooms:           integer("bathrooms"),
  toilets:             integer("toilets"),
  landSizeSqm:         numeric("land_size_sqm", { precision: 10, scale: 2 }),
  buildingSizeSqm:     numeric("building_size_sqm", { precision: 10, scale: 2 }),
  yearBuilt:           integer("year_built"),
  floors:              integer("floors"),
  features:            text("features").array().default([]),
  furnished:           boolean("furnished").default(false),
  hasElectricity:      boolean("has_electricity").default(false),
  hasWater:            boolean("has_water").default(false),
  hasInternet:         boolean("has_internet").default(false),
  hasSecurity:         boolean("has_security").default(false),
  titleDeedAvailable:  boolean("title_deed_available").default(false),
  titleDeedNumber:     text("title_deed_number"),
  isNegotiable:        boolean("is_negotiable").default(false),
  isInstallment:       boolean("is_installment").default(false),
  installmentYears:    integer("installment_years"),
  diasporaHighlights:  text("diaspora_highlights").array().default([]),
  viewCount:           integer("view_count").notNull().default(0),
  savedCount:          integer("saved_count").notNull().default(0),
  aiSummary:           text("ai_summary"),
  publishedAt:         timestamp("published_at"),
  createdAt:           timestamp("created_at").defaultNow().notNull(),
  updatedAt:           timestamp("updated_at").defaultNow().notNull(),
}, (t) => [
  index("listings_seller_idx").on(t.sellerId),
  index("listings_status_idx").on(t.status),
  index("listings_region_idx").on(t.region),
  index("listings_type_idx").on(t.propertyType),
]);

export const listingImages = pgTable("listing_images", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:    text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  cloudinaryId: text("cloudinary_id"),
  url:          text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  caption:      text("caption"),
  isPrimary:    boolean("is_primary").notNull().default(false),
  order:        integer("order").notNull().default(0),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const listingVideos = pgTable("listing_videos", {
  id:           text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId:    text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  cloudinaryId: text("cloudinary_id"),
  url:          text("url").notNull(),
  thumbnailUrl: text("thumbnail_url"),
  title:        text("title"),
  duration:     integer("duration"),
  createdAt:    timestamp("created_at").defaultNow().notNull(),
});

export const savedListings = pgTable("saved_listings", {
  userId:    text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (t) => [primaryKey({ columns: [t.userId, t.listingId] })]);

export const priceHistory = pgTable("price_history", {
  id:        text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  listingId: text("listing_id").notNull().references(() => listings.id, { onDelete: "cascade" }),
  price:     numeric("price", { precision: 15, scale: 2 }).notNull(),
  currency:  text("currency").notNull(),
  reason:    text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ─── Relations ───────────────────────────────────────────────────────────────
export const listingsRelations = relations(listings, ({ one, many }) => ({
  seller:       one(users, { fields: [listings.sellerId], references: [users.id] }),
  images:       many(listingImages),
  videos:       many(listingVideos),
  savedBy:      many(savedListings),
  priceHistory: many(priceHistory),
}));

export const listingImagesRelations = relations(listingImages, ({ one }) => ({
  listing: one(listings, { fields: [listingImages.listingId], references: [listings.id] }),
}));

export const listingVideosRelations = relations(listingVideos, ({ one }) => ({
  listing: one(listings, { fields: [listingVideos.listingId], references: [listings.id] }),
}));

export const savedListingsRelations = relations(savedListings, ({ one }) => ({
  user:    one(users, { fields: [savedListings.userId], references: [users.id] }),
  listing: one(listings, { fields: [savedListings.listingId], references: [listings.id] }),
}));

export type Listing = typeof listings.$inferSelect;
export type InsertListing = typeof listings.$inferInsert;
export type ListingImage = typeof listingImages.$inferSelect;
