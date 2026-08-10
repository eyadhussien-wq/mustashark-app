import {
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const documentHandoverMethodEnum = pgEnum("document_handover_method", [
  "local_dispatch",
  "office_dropoff",
  "international_courier",
]);

export const documentHandoverStatusEnum = pgEnum("document_handover_status", [
  "requested",
  "approved",
  "preparing",
  "picked_up",
  "in_transit",
  "customs_clearance",
  "delivered",
  "lawyer_confirmed",
  "completed",
  "delivery_failed",
  "returned",
  "customs_hold",
  "cancelled",
]);

export const courierProviderEnum = pgEnum("document_courier_provider", [
  "dhl",
  "aramex",
  "fedex",
  "other",
]);

export const documentHandoversTable = pgTable("document_handovers", {
  id: text("id").primaryKey(),
  serialNumber: text("serial_number").notNull().unique(),
  caseId: text("case_id").notNull(),
  documentName: text("document_name").notNull(),
  method: documentHandoverMethodEnum("method").notNull(),
  status: documentHandoverStatusEnum("status").notNull().default("requested"),
  clientId: text("client_id").notNull().references(() => usersTable.id),
  lawyerId: text("lawyer_id").notNull().references(() => usersTable.id),
  clientCountry: text("client_country").notNull(),
  clientCity: text("client_city"),
  lawyerCountry: text("lawyer_country").notNull(),
  lawyerCity: text("lawyer_city"),
  officeId: text("office_id"),
  officeAddress: text("office_address"),
  officeHours: text("office_hours"),
  officeMapUrl: text("office_map_url"),
  courierProvider: courierProviderEnum("courier_provider"),
  trackingNumber: text("tracking_number"),
  trackingStatus: text("tracking_status"),
  otpHash: text("otp_hash"),
  otpExpiresAt: timestamp("otp_expires_at"),
  otpVerifiedAt: timestamp("otp_verified_at"),
  lawyerConfirmedAt: timestamp("lawyer_confirmed_at"),
  receiptId: text("receipt_id"),
  receiptConfirmedAt: timestamp("receipt_confirmed_at"),
  legalChecklistConfirmedAt: timestamp("legal_checklist_confirmed_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertDocumentHandoverSchema = createInsertSchema(documentHandoversTable).omit({
  createdAt: true,
  updatedAt: true,
});
export const selectDocumentHandoverSchema = createSelectSchema(documentHandoversTable);
export type InsertDocumentHandover = z.infer<typeof insertDocumentHandoverSchema>;
export type DocumentHandover = typeof documentHandoversTable.$inferSelect;
