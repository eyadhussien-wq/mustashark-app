import { pgEnum, pgTable, text, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const documentStatusEnum = pgEnum("document_status", ["draft", "ready", "handover_pending", "handed_over", "archived"]);
export const handoverModeEnum = pgEnum("handover_mode", ["local", "office", "courier", "international"]);
export const handoverStatusEnum = pgEnum("handover_status", ["requested", "approved", "preparing", "dispatched", "in_transit", "customs", "ready_for_delivery", "delivered", "failed", "cancelled"]);
export const trackingEventTypeEnum = pgEnum("handover_tracking_event_type", ["status_change", "location_update", "customs", "delivery_attempt", "note"]);

export const documentsTable = pgTable("documents", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  ownerId: text("owner_id").notNull().references(() => usersTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  fileName: text("file_name"),
  mimeType: text("mime_type"),
  storageKey: text("storage_key"),
  status: documentStatusEnum("status").notNull().default("draft"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const documentHandoversTable = pgTable("document_handovers", {
  id: text("id").primaryKey(),
  caseId: text("case_id").notNull(),
  documentId: text("document_id").notNull().references(() => documentsTable.id, { onDelete: "cascade" }),
  requestedBy: text("requested_by").notNull().references(() => usersTable.id),
  recipientId: text("recipient_id").references(() => usersTable.id, { onDelete: "set null" }),
  mode: handoverModeEnum("mode").notNull(),
  status: handoverStatusEnum("status").notNull().default("requested"),
  trackingNumber: text("tracking_number").unique(),
  carrier: text("carrier"),
  originCountry: text("origin_country"),
  destinationCountry: text("destination_country"),
  originAddress: text("origin_address"),
  destinationAddress: text("destination_address"),
  deliveryOtpHash: text("delivery_otp_hash"),
  deliveredToName: text("delivered_to_name"),
  deliveredAt: timestamp("delivered_at"),
  deliveryProofUri: text("delivery_proof_uri"),
  failureReason: text("failure_reason"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const handoverTrackingEventsTable = pgTable("handover_tracking_events", {
  id: text("id").primaryKey(),
  handoverId: text("handover_id").notNull().references(() => documentHandoversTable.id, { onDelete: "cascade" }),
  type: trackingEventTypeEnum("type").notNull(),
  status: handoverStatusEnum("status"),
  location: text("location"),
  note: text("note"),
  occurredAt: timestamp("occurred_at").notNull().defaultNow(),
  sequence: integer("sequence").notNull().default(0),
  createdBy: text("created_by").references(() => usersTable.id, { onDelete: "set null" }),
});

export const insertDocumentSchema = createInsertSchema(documentsTable).omit({ createdAt: true, updatedAt: true });
export const selectDocumentSchema = createSelectSchema(documentsTable);
export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documentsTable.$inferSelect;
export const insertDocumentHandoverSchema = createInsertSchema(documentHandoversTable).omit({ createdAt: true, updatedAt: true });
export const selectDocumentHandoverSchema = createSelectSchema(documentHandoversTable);
export type InsertDocumentHandover = z.infer<typeof insertDocumentHandoverSchema>;
export type DocumentHandover = typeof documentHandoversTable.$inferSelect;
