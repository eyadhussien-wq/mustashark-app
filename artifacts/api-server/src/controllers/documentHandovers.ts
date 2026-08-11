import { Request, Response } from "express";
import { and, asc, eq } from "drizzle-orm";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  documentHandoversTable,
  documentsTable,
  handoverTrackingEventsTable,
} from "@workspace/db/schema";

const HANDOVER_STATUSES = [
  "requested",
  "approved",
  "preparing",
  "dispatched",
  "in_transit",
  "customs",
  "ready_for_delivery",
  "delivered",
  "failed",
  "cancelled",
] as const;
type HandoverStatus = (typeof HANDOVER_STATUSES)[number];

const TRANSITIONS: Record<HandoverStatus, readonly HandoverStatus[]> = {
  requested: ["approved", "cancelled"],
  approved: ["preparing", "cancelled"],
  preparing: ["dispatched", "cancelled", "failed"],
  dispatched: ["in_transit", "failed", "cancelled"],
  in_transit: ["customs", "ready_for_delivery", "failed"],
  customs: ["ready_for_delivery", "failed"],
  ready_for_delivery: ["delivered", "failed"],
  delivered: [],
  failed: ["preparing", "cancelled"],
  cancelled: [],
};

const isAdmin = (req: Request) => req.authUser?.role === "admin";

async function canAccessHandover(userId: string, handoverId: string, admin: boolean) {
  const rows = await db
    .select({ handover: documentHandoversTable, documentOwnerId: documentsTable.ownerId })
    .from(documentHandoversTable)
    .innerJoin(documentsTable, eq(documentHandoversTable.documentId, documentsTable.id))
    .where(eq(documentHandoversTable.id, handoverId))
    .limit(1);
  const row = rows[0];
  if (!row) return null;
  if (admin) return row;
  if (row.documentOwnerId !== userId && row.handover.requestedBy !== userId && row.handover.recipientId !== userId) return null;
  return row;
}

export async function createDocumentHandover(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const { documentId, caseId, recipientId, mode, originCountry, destinationCountry, originAddress, destinationAddress, carrier } = req.body ?? {};
    if (!documentId || !caseId || !["local", "office", "courier", "international"].includes(mode)) {
      return res.status(400).json({ ok: false, error: "invalid_handover_request" });
    }
    const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, String(documentId))).limit(1);
    if (!document) return res.status(404).json({ ok: false, error: "document_not_found" });
    if (!isAdmin(req) && document.ownerId !== authUser.id) return res.status(403).json({ ok: false, error: "forbidden" });
    if (document.caseId !== String(caseId)) return res.status(409).json({ ok: false, error: "document_case_mismatch" });

    const otp = String(randomInt(100000, 1000000));
    const [handover] = await db.insert(documentHandoversTable).values({
      id: randomUUID(), caseId: String(caseId), documentId: document.id, requestedBy: authUser.id,
      recipientId: recipientId ? String(recipientId) : null, mode,
      originCountry: originCountry ? String(originCountry) : null,
      destinationCountry: destinationCountry ? String(destinationCountry) : null,
      originAddress: originAddress ? String(originAddress) : null,
      destinationAddress: destinationAddress ? String(destinationAddress) : null,
      carrier: carrier ? String(carrier) : null,
      trackingNumber: mode === "office" ? null : `MSH-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
      deliveryOtpHash: createHash("sha256").update(otp).digest("hex"),
    }).returning();
    await db.insert(handoverTrackingEventsTable).values({
      id: randomUUID(), handoverId: handover.id, type: "status_change", status: "requested",
      note: "Handover requested", sequence: 1, createdBy: authUser.id,
    });
    return res.status(201).json({ ok: true, handover, deliveryOtp: otp });
  } catch (error) {
    console.error("Create Document Handover Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function getDocumentHandover(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const id = String(req.params.id ?? "");
    const row = await canAccessHandover(authUser.id, id, isAdmin(req));
    if (!row) return res.status(404).json({ ok: false, error: "handover_not_found" });
    const events = await db.select().from(handoverTrackingEventsTable)
      .where(eq(handoverTrackingEventsTable.handoverId, id))
      .orderBy(asc(handoverTrackingEventsTable.sequence), asc(handoverTrackingEventsTable.occurredAt));
    return res.json({ ok: true, handover: row.handover, documentOwnerId: row.documentOwnerId, events });
  } catch (error) {
    console.error("Get Document Handover Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function updateDocumentHandoverStatus(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const id = String(req.params.id ?? "");
    const nextStatus = String(req.body?.status ?? "") as HandoverStatus;
    if (!HANDOVER_STATUSES.includes(nextStatus)) return res.status(400).json({ ok: false, error: "invalid_status" });
    const row = await canAccessHandover(authUser.id, id, isAdmin(req));
    if (!row) return res.status(404).json({ ok: false, error: "handover_not_found" });
    if (!isAdmin(req) && row.handover.requestedBy !== authUser.id) return res.status(403).json({ ok: false, error: "forbidden" });
    const current = row.handover.status;
    if (!(TRANSITIONS[current] as readonly string[]).includes(nextStatus)) {
      return res.status(409).json({ ok: false, error: "invalid_status_transition", from: current, to: nextStatus });
    }
    const [updated] = await db.update(documentHandoversTable).set({ status: nextStatus, updatedAt: new Date() })
      .where(and(eq(documentHandoversTable.id, id), eq(documentHandoversTable.status, current))).returning();
    if (!updated) return res.status(409).json({ ok: false, error: "handover_already_updated" });
    const previousEvents = await db.select({ sequence: handoverTrackingEventsTable.sequence })
      .from(handoverTrackingEventsTable).where(eq(handoverTrackingEventsTable.handoverId, id))
      .orderBy(asc(handoverTrackingEventsTable.sequence));
    await db.insert(handoverTrackingEventsTable).values({
      id: randomUUID(), handoverId: id, type: "status_change", status: nextStatus,
      note: `Status changed from ${current} to ${nextStatus}`, sequence: (previousEvents.at(-1)?.sequence ?? 0) + 1, createdBy: authUser.id,
    });
    if (nextStatus === "delivered") {
      await db.update(documentsTable).set({ status: "handed_over", updatedAt: new Date() }).where(eq(documentsTable.id, row.handover.documentId));
    }
    return res.json({ ok: true, handover: updated });
  } catch (error) {
    console.error("Update Document Handover Status Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function addDocumentHandoverTrackingEvent(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const id = String(req.params.id ?? "");
    const row = await canAccessHandover(authUser.id, id, isAdmin(req));
    if (!row) return res.status(404).json({ ok: false, error: "handover_not_found" });
    if (!isAdmin(req) && row.handover.requestedBy !== authUser.id) return res.status(403).json({ ok: false, error: "forbidden" });
    const type = req.body?.type;
    if (!["status_change", "location_update", "customs", "delivery_attempt", "note"].includes(type)) return res.status(400).json({ ok: false, error: "invalid_tracking_event" });
    const previous = await db.select({ sequence: handoverTrackingEventsTable.sequence })
      .from(handoverTrackingEventsTable).where(eq(handoverTrackingEventsTable.handoverId, id))
      .orderBy(asc(handoverTrackingEventsTable.sequence));
    const [event] = await db.insert(handoverTrackingEventsTable).values({
      id: randomUUID(), handoverId: id, type, status: req.body?.status ?? null,
      location: req.body?.location ? String(req.body.location) : null,
      note: req.body?.note ? String(req.body.note) : null,
      sequence: (previous.at(-1)?.sequence ?? 0) + 1, createdBy: authUser.id,
    }).returning();
    return res.status(201).json({ ok: true, event });
  } catch (error) {
    console.error("Add Document Handover Tracking Event Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function confirmDocumentHandoverDelivery(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const id = String(req.params.id ?? "");
    const otp = String(req.body?.otp ?? "");
    const recipientName = String(req.body?.recipientName ?? "").trim();
    if (!/^\d{6}$/.test(otp) || !recipientName) return res.status(400).json({ ok: false, error: "invalid_delivery_confirmation" });
    const row = await canAccessHandover(authUser.id, id, isAdmin(req));
    if (!row) return res.status(404).json({ ok: false, error: "handover_not_found" });
    if (!isAdmin(req) && row.handover.recipientId && row.handover.recipientId !== authUser.id) return res.status(403).json({ ok: false, error: "forbidden" });
    if (!["ready_for_delivery", "dispatched", "in_transit"].includes(row.handover.status)) return res.status(409).json({ ok: false, error: "handover_not_ready_for_delivery" });
    if (createHash("sha256").update(otp).digest("hex") !== row.handover.deliveryOtpHash) return res.status(400).json({ ok: false, error: "invalid_delivery_otp" });
    const [updated] = await db.update(documentHandoversTable).set({
      status: "delivered", deliveredToName: recipientName, deliveredAt: new Date(), updatedAt: new Date(),
    }).where(and(eq(documentHandoversTable.id, id), eq(documentHandoversTable.status, row.handover.status))).returning();
    if (!updated) return res.status(409).json({ ok: false, error: "handover_already_updated" });
    const previous = await db.select({ sequence: handoverTrackingEventsTable.sequence })
      .from(handoverTrackingEventsTable).where(eq(handoverTrackingEventsTable.handoverId, id))
      .orderBy(asc(handoverTrackingEventsTable.sequence));
    await db.insert(handoverTrackingEventsTable).values({
      id: randomUUID(), handoverId: id, type: "delivery_attempt", status: "delivered",
      note: `Delivered to ${recipientName}`, sequence: (previous.at(-1)?.sequence ?? 0) + 1, createdBy: authUser.id,
    });
    await db.update(documentsTable).set({ status: "handed_over", updatedAt: new Date() }).where(eq(documentsTable.id, row.handover.documentId));
    return res.json({ ok: true, handover: updated });
  } catch (error) {
    console.error("Confirm Document Handover Delivery Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
