import { Request, Response } from "express";
import { and, asc, eq, sql } from "drizzle-orm";
import { createHash, randomInt, randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  documentHandoversTable,
  documentsTable,
  handoverTrackingEventsTable,
} from "@workspace/db/schema";

const HANDOVER_MODES = ["local", "office", "courier", "international"] as const;
const HANDOVER_STATUSES = [
  "requested", "approved", "preparing", "dispatched", "in_transit", "customs",
  "ready_for_delivery", "delivered", "failed", "cancelled",
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

async function appendTrackingEvent(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  handoverId: string,
  event: {
    type: "status_change" | "location_update" | "customs" | "delivery_attempt" | "note";
    status?: HandoverStatus | null;
    location?: string | null;
    note?: string | null;
    createdBy: string;
  },
) {
  await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${handoverId}))`);
  const previous = await tx
    .select({ sequence: handoverTrackingEventsTable.sequence })
    .from(handoverTrackingEventsTable)
    .where(eq(handoverTrackingEventsTable.handoverId, handoverId))
    .orderBy(asc(handoverTrackingEventsTable.sequence));
  const sequence = (previous.at(-1)?.sequence ?? 0) + 1;
  const [created] = await tx.insert(handoverTrackingEventsTable).values({
    id: randomUUID(), handoverId, type: event.type, status: event.status ?? null,
    location: event.location ?? null, note: event.note ?? null, sequence, createdBy: event.createdBy,
  }).returning();
  return created;
}

export async function createDocumentHandover(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    const { documentId, caseId, recipientId, mode, originCountry, destinationCountry, originAddress, destinationAddress, carrier } = req.body ?? {};
    if (!documentId || !caseId || !HANDOVER_MODES.includes(mode)) {
      return res.status(400).json({ ok: false, error: "invalid_handover_request" });
    }
    const [document] = await db.select().from(documentsTable).where(eq(documentsTable.id, String(documentId))).limit(1);
    if (!document) return res.status(404).json({ ok: false, error: "document_not_found" });
    if (!isAdmin(req) && document.ownerId !== authUser.id) return res.status(403).json({ ok: false, error: "forbidden" });
    if (document.caseId !== String(caseId)) return res.status(409).json({ ok: false, error: "document_case_mismatch" });

    const otp = String(randomInt(100000, 1000000));
    const otpExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const handoverId = randomUUID();
    const handover = await db.transaction(async (tx) => {
      const [created] = await tx.insert(documentHandoversTable).values({
        id: handoverId, caseId: String(caseId), documentId: document.id, requestedBy: authUser.id,
        recipientId: recipientId ? String(recipientId) : null, mode,
        originCountry: originCountry ? String(originCountry) : null,
        destinationCountry: destinationCountry ? String(destinationCountry) : null,
        originAddress: originAddress ? String(originAddress) : null,
        destinationAddress: destinationAddress ? String(destinationAddress) : null,
        carrier: carrier ? String(carrier) : null,
        trackingNumber: mode === "office" ? null : `MSH-${randomUUID().replace(/-/g, "").slice(0, 12).toUpperCase()}`,
        deliveryOtpHash: createHash("sha256").update(otp).digest("hex"),
        deliveryOtpExpiresAt: otpExpiresAt,
        deliveryOtpAttempts: 0,
      }).returning();
      await appendTrackingEvent(tx, handoverId, {
        type: "status_change", status: "requested", note: "Handover requested", createdBy: authUser.id,
      });
      return created;
    });

    // The raw OTP is never persisted or returned after this response. It must be delivered through a dedicated notification channel.
    return res.status(201).json({ ok: true, handover, deliveryOtpIssued: Boolean(otp) });
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
    if (!isAdmin(req)) return res.status(403).json({ ok: false, error: "handover_operator_required" });
    const id = String(req.params.id ?? "");
    const nextStatus = String(req.body?.status ?? "") as HandoverStatus;
    if (!HANDOVER_STATUSES.includes(nextStatus)) return res.status(400).json({ ok: false, error: "invalid_status" });

    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
      const [currentRow] = await tx.select().from(documentHandoversTable).where(eq(documentHandoversTable.id, id)).limit(1);
      if (!currentRow) return { kind: "not_found" as const };
      const current = currentRow.status;
      if (!(TRANSITIONS[current] as readonly string[]).includes(nextStatus)) {
        return { kind: "invalid_transition" as const, current, nextStatus };
      }
      const [updated] = await tx.update(documentHandoversTable).set({ status: nextStatus, updatedAt: new Date() })
        .where(and(eq(documentHandoversTable.id, id), eq(documentHandoversTable.status, current))).returning();
      if (!updated) return { kind: "conflict" as const };
      await appendTrackingEvent(tx, id, {
        type: "status_change", status: nextStatus, note: `Status changed from ${current} to ${nextStatus}`, createdBy: authUser.id,
      });
      if (nextStatus === "delivered") {
        await tx.update(documentsTable).set({ status: "handed_over", updatedAt: new Date() }).where(eq(documentsTable.id, currentRow.documentId));
      }
      return { kind: "ok" as const, handover: updated };
    });

    if (result.kind === "not_found") return res.status(404).json({ ok: false, error: "handover_not_found" });
    if (result.kind === "invalid_transition") return res.status(409).json({ ok: false, error: "invalid_status_transition", from: result.current, to: result.nextStatus });
    if (result.kind === "conflict") return res.status(409).json({ ok: false, error: "handover_already_updated" });
    return res.json({ ok: true, handover: result.handover });
  } catch (error) {
    console.error("Update Document Handover Status Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function addDocumentHandoverTrackingEvent(req: Request, res: Response) {
  try {
    const authUser = req.authUser!;
    if (!isAdmin(req)) return res.status(403).json({ ok: false, error: "handover_operator_required" });
    const id = String(req.params.id ?? "");
    const row = await canAccessHandover(authUser.id, id, true);
    if (!row) return res.status(404).json({ ok: false, error: "handover_not_found" });
    const type = req.body?.type;
    if (!["status_change", "location_update", "customs", "delivery_attempt", "note"].includes(type)) {
      return res.status(400).json({ ok: false, error: "invalid_tracking_event" });
    }
    const event = await db.transaction((tx) => appendTrackingEvent(tx, id, {
      type, status: req.body?.status ?? null,
      location: req.body?.location ? String(req.body.location) : null,
      note: req.body?.note ? String(req.body.note) : null,
      createdBy: authUser.id,
    }));
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

    const result = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${id}))`);
      const [row] = await tx.select({ handover: documentHandoversTable, documentOwnerId: documentsTable.ownerId })
        .from(documentHandoversTable)
        .innerJoin(documentsTable, eq(documentHandoversTable.documentId, documentsTable.id))
        .where(eq(documentHandoversTable.id, id)).limit(1);
      if (!row) return { kind: "not_found" as const };
      if (!isAdmin(req) && row.handover.recipientId && row.handover.recipientId !== authUser.id) return { kind: "forbidden" as const };
      if (!["ready_for_delivery", "dispatched", "in_transit"].includes(row.handover.status)) return { kind: "not_ready" as const };
      if (row.handover.deliveryOtpConsumedAt) return { kind: "otp_used" as const };
      if (!row.handover.deliveryOtpExpiresAt || row.handover.deliveryOtpExpiresAt.getTime() <= Date.now()) return { kind: "otp_expired" as const };
      if (row.handover.deliveryOtpAttempts >= 5) return { kind: "otp_locked" as const };

      const hash = createHash("sha256").update(otp).digest("hex");
      if (hash !== row.handover.deliveryOtpHash) {
        await tx.update(documentHandoversTable).set({ deliveryOtpAttempts: row.handover.deliveryOtpAttempts + 1, updatedAt: new Date() }).where(eq(documentHandoversTable.id, id));
        return { kind: "otp_invalid" as const };
      }

      const now = new Date();
      const [updated] = await tx.update(documentHandoversTable).set({
        status: "delivered", deliveredToName: recipientName, deliveredAt: now,
        deliveryOtpConsumedAt: now, deliveryOtpHash: null, updatedAt: now,
      }).where(and(eq(documentHandoversTable.id, id), eq(documentHandoversTable.status, row.handover.status))).returning();
      if (!updated) return { kind: "conflict" as const };
      await appendTrackingEvent(tx, id, {
        type: "delivery_attempt", status: "delivered", note: `Delivered to ${recipientName}`, createdBy: authUser.id,
      });
      await tx.update(documentsTable).set({ status: "handed_over", updatedAt: now }).where(eq(documentsTable.id, row.handover.documentId));
      return { kind: "ok" as const, handover: updated };
    });

    if (result.kind === "not_found") return res.status(404).json({ ok: false, error: "handover_not_found" });
    if (result.kind === "forbidden") return res.status(403).json({ ok: false, error: "forbidden" });
    if (result.kind === "not_ready") return res.status(409).json({ ok: false, error: "handover_not_ready_for_delivery" });
    if (result.kind === "otp_used") return res.status(409).json({ ok: false, error: "delivery_otp_already_used" });
    if (result.kind === "otp_expired") return res.status(400).json({ ok: false, error: "delivery_otp_expired" });
    if (result.kind === "otp_locked") return res.status(429).json({ ok: false, error: "delivery_otp_locked" });
    if (result.kind === "otp_invalid") return res.status(400).json({ ok: false, error: "invalid_delivery_otp" });
    if (result.kind === "conflict") return res.status(409).json({ ok: false, error: "handover_already_updated" });
    return res.json({ ok: true, handover: result.handover });
  } catch (error) {
    console.error("Confirm Document Handover Delivery Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}
