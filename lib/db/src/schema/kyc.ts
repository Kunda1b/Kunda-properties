import { pgTable, pgEnum, text, timestamp, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { users } from "./users";

export const kycStatusEnum = pgEnum("kyc_status", ["PENDING", "SUBMITTED", "VERIFIED", "REJECTED", "EXPIRED"]);

export const kycRecords = pgTable("kyc_records", {
  id:               text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId:           text("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  status:           kycStatusEnum("status").notNull().default("PENDING"),
  idType:           text("id_type"),
  idNumber:         text("id_number"),
  idCountry:        text("id_country"),
  idFrontUrl:       text("id_front_url"),
  idBackUrl:        text("id_back_url"),
  selfieImageUrl:   text("selfie_image_url"),
  smileJobId:       text("smile_job_id"),
  rawResponse:      jsonb("raw_response"),
  verifiedAt:       timestamp("verified_at"),
  rejectionReason:  text("rejection_reason"),
  createdAt:        timestamp("created_at").defaultNow().notNull(),
  updatedAt:        timestamp("updated_at").defaultNow().notNull(),
});

export const kycRecordsRelations = relations(kycRecords, ({ one }) => ({
  user: one(users, { fields: [kycRecords.userId], references: [users.id] }),
}));

export type KycRecord = typeof kycRecords.$inferSelect;
