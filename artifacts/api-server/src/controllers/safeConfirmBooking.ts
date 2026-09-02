import crypto from "crypto";
import type { Request, Response } from "express";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { bookingsTable, consultationEventsTable, notificationsTable } from "@workspace/db/schema";
import { assertT01Transition, getT01State } from "../lib/t01ConsultationStateMachine";
import { updateBookingWithOptimisticLock } from "../lib/updateBookingWithOptimisticLock";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";

export const confirmBookingSafely = async (req: Request, res: Response) => {
  try {
    const bookingId = typeof req.body?.bookingId === "string" ? req.body.bookingId : "";
    const expectedVersion = Number(req.body?.expectedVersion);
    if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId_is_required" });
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) return res.status(400).json({ ok: false, error: "expectedVersion_is_required" });
    const authUser = req.authUser!;

    const result = await db.transaction(async (tx) => {
      const idempotency = await claimIdempotency(tx, req, authUser.id);
      if (idempotency.replay) {
        return { status: idempotency.status, body: idempotency.body };
      }

      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.lawyerId !== authUser.id && authUser.role !== "admin") throw new Error("FORBIDDEN");
      if (booking.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
      if (booking.status !== "pending" || booking.paymentStatus !== "paid" || booking.escrowStatus !== "held") throw new Error("INVALID_FINANCIAL_STATE");
      try {
        assertT01Transition(getT01State(booking), "SCHEDULED");
      } catch (error: any) {
        if (typeof error?.message === "string" && error.message.startsWith("INVALID_T01_TRANSITION")) throw new Error("INVALID_STATE_TRANSITION");
        throw error;
      }
      const googleMeetLink = booking.type === "video" ? `https://meet.google.com/mst-${booking.serialNumber.toLowerCase()}` : null;
      const updatedBooking = await updateBookingWithOptimisticLock(
        tx,
        bookingId,
        expectedVersion,
        { status: "accepted", googleMeetLink },
        [
          eq(bookingsTable.status, "pending"),
          eq(bookingsTable.paymentStatus, "paid"),
          eq(bookingsTable.escrowStatus, "held"),
        ],
      );
      await tx.insert(notificationsTable).values({ id: crypto.randomUUID(), userId: booking.clientId!, bookingId, title: "تم تأكيد موعد الاستشارة", body: `وافق المحامي على طلبك. الموعد المؤكد هو ${booking.scheduledDate} الساعة ${booking.scheduledTime}.`, kind: "success", urgent: true });
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "LAWYER_ACCEPTED", actorId: authUser.id, metadata: { fromState: "PENDING_ACCEPTANCE", toState: "SCHEDULED", financialGate: true, expectedVersion } });

      const responseBody = { ok: true, booking: updatedBooking };
      await persistIdempotencyResponse(tx, req, authUser.id, 200, responseBody);
      return { status: 200, body: responseBody };
    });

    return res.status(result.status).json(result.body);
  } catch (error: any) {
    if (error?.message === "IDEMPOTENCY_KEY_REQUIRED") return res.status(400).json({ ok: false, error: "idempotency_key_required" });
    if (error?.message === "IDEMPOTENCY_REQUEST_MISMATCH") return res.status(409).json({ ok: false, error: "idempotency_request_mismatch" });
    if (error?.message === "IDEMPOTENCY_REQUEST_IN_PROGRESS") return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
    if (error?.message === "IDEMPOTENCY_CLAIM_FAILED") return res.status(409).json({ ok: false, error: "idempotency_claim_failed" });
    if (error?.message === "NOT_FOUND") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (error?.message === "FORBIDDEN") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (error?.message === "VERSION_CONFLICT") return res.status(409).json({ ok: false, error: "booking_version_conflict", message: "Conflict: The booking state has been modified by another concurrent request." });
    if (error?.message === "INVALID_FINANCIAL_STATE") return res.status(409).json({ ok: false, error: "payment_and_escrow_required_before_acceptance" });
    if (error?.message === "INVALID_STATE_TRANSITION") return res.status(409).json({ ok: false, error: "invalid_state_transition" });
    console.error("Confirm Booking Safely Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
