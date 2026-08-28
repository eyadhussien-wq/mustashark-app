import { and, eq, sql } from "drizzle-orm";
import crypto from "crypto";
import type { Request, Response } from "express";
import { z } from "zod";
import { db } from "@workspace/db";
import { bookingsTable, clientWalletsTable, consultationEventsTable, platformDuesTable } from "@workspace/db/schema";
import { assertT01Transition, getT01State } from "../lib/t01ConsultationStateMachine";
import { updateBookingWithOptimisticLock } from "../lib/updateBookingWithOptimisticLock";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";

const cancellationSchema = z.object({ bookingId: z.string().min(1), reason: z.string().trim().min(1).max(1000), expectedVersion: z.number().int().min(1) });
const BOOKING_TIME_ZONE = "Asia/Qatar";
const REFUND_WINDOW_MS = 24 * 60 * 60 * 1000;

function scheduledAt(scheduledDate: string, scheduledTime: string) {
  const [year, month, day] = scheduledDate.split("-").map(Number);
  const [hour, minute] = scheduledTime.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  const requestedWallClock = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: BOOKING_TIME_ZONE, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(requestedWallClock));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zoneWallClock = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute));
  return new Date(requestedWallClock - (zoneWallClock - requestedWallClock));
}
function isPaidHeld(booking: { paymentStatus: string; escrowStatus: string }) { return booking.paymentStatus === "paid" && booking.escrowStatus === "held"; }

export const cancelBookingSafely = async (req: Request, res: Response) => {
  const parsed = cancellationSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
  const { bookingId, reason, expectedVersion } = parsed.data;
  const authUser = req.authUser!;
  try {
    const result = await db.transaction(async (tx) => {
      const idempotency = await claimIdempotency(tx, req, authUser.id);
      if (idempotency.replay) return idempotency.body;
      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1).for("update");
      if (!booking) throw new Error("NOT_FOUND");
      const isClient = booking.clientId === authUser.id;
      const isLawyer = booking.lawyerId === authUser.id;
      if (!isClient && !isLawyer) throw new Error("FORBIDDEN");
      if (booking.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
      const state = getT01State(booking);
      if (!["PAYMENT_PENDING", "PENDING_ACCEPTANCE", "SCHEDULED"].includes(state)) throw new Error("INVALID_CANCEL_STATE");
      assertT01Transition(state, "CANCELLED");
      const now = new Date();
      const paidAndHeld = isPaidHeld(booking);
      let refundAmount = "0";
      let refundApplied = false;
      let newPaymentStatus = booking.paymentStatus;
      let newEscrowStatus = booking.escrowStatus;
      let dueStatus: "waived" | "collected" | null = null;
      if (isLawyer) {
        if (paidAndHeld) { refundAmount = booking.price; refundApplied = true; newPaymentStatus = "refunded"; newEscrowStatus = "refunded"; dueStatus = "waived"; }
      } else if (state === "PAYMENT_PENDING") {
      } else if (state === "PENDING_ACCEPTANCE") {
        if (paidAndHeld) { refundAmount = booking.price; refundApplied = true; newPaymentStatus = "refunded"; newEscrowStatus = "refunded"; dueStatus = "waived"; }
      } else {
        const appointment = scheduledAt(booking.scheduledDate, booking.scheduledTime);
        if (!appointment) throw new Error("INVALID_SCHEDULED_DATETIME");
        const timeUntilAppointment = appointment.getTime() - now.getTime();
        if (timeUntilAppointment >= REFUND_WINDOW_MS) {
          if (paidAndHeld) { refundAmount = booking.price; refundApplied = true; newPaymentStatus = "refunded"; newEscrowStatus = "refunded"; dueStatus = "waived"; }
        } else if (paidAndHeld) {
          newPaymentStatus = "forfeited";
          newEscrowStatus = "released";
          dueStatus = "collected";
        }
      }
      const cancelStatus = isClient ? "cancelled_by_client" : "cancelled_by_lawyer";
      const updatedBooking = await updateBookingWithOptimisticLock(tx, bookingId, expectedVersion, { status: cancelStatus, paymentStatus: newPaymentStatus, escrowStatus: newEscrowStatus }, [eq(bookingsTable.status, booking.status)]);
      if (refundApplied) {
        await tx.insert(clientWalletsTable).values({ clientId: booking.clientId!, availableCredits: refundAmount, totalRefunded: refundAmount, updatedAt: now }).onConflictDoUpdate({ target: clientWalletsTable.clientId, set: { availableCredits: sql`${clientWalletsTable.availableCredits} + ${refundAmount}`, totalRefunded: sql`${clientWalletsTable.totalRefunded} + ${refundAmount}`, updatedAt: now } });
      }
      if (dueStatus) await tx.update(platformDuesTable).set({ status: dueStatus, collectedAt: dueStatus === "collected" ? now : null, collectedBy: null, updatedAt: now }).where(and(eq(platformDuesTable.bookingId, bookingId), eq(platformDuesTable.status, "pending")));
      const responseBody = { ok: true, booking: updatedBooking, refund: { amount: refundAmount, refunded: refundApplied }, cancellation: { actor: isClient ? "client" : "lawyer", reason, policy: isClient && state === "SCHEDULED" ? (Number(refundAmount) > 0 ? "client_cancel_24h_or_more" : "client_cancel_under_24h") : isLawyer ? "lawyer_cancel_full_refund" : "client_cancel_before_acceptance" } };
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "CONSULTATION_CANCELLED", actorId: authUser.id, metadata: { fromState: state, toState: "CANCELLED", actorRole: isClient ? "client" : "lawyer", reason, expectedVersion, refundAmount, refundApplied, paymentStatus: newPaymentStatus, escrowStatus: newEscrowStatus, platformDueStatus: dueStatus } });
      await persistIdempotencyResponse(tx, req, authUser.id, 200, responseBody);
      return responseBody;
    });
    return res.status(200).json(result);
  } catch (error: any) {
    if (error?.message === "IDEMPOTENCY_KEY_REQUIRED") return res.status(400).json({ ok: false, error: "idempotency_key_required" });
    if (error?.message === "IDEMPOTENCY_REQUEST_MISMATCH") return res.status(409).json({ ok: false, error: "idempotency_key_reused_with_different_request" });
    if (error?.message === "IDEMPOTENCY_REQUEST_IN_PROGRESS") return res.status(409).json({ ok: false, error: "idempotency_request_in_progress" });
    if (error?.message === "NOT_FOUND") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (error?.message === "FORBIDDEN") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (error?.message === "VERSION_CONFLICT") return res.status(409).json({ ok: false, error: "booking_version_conflict", message: "Conflict: The booking state has been modified by another concurrent request." });
    if (error?.message === "INVALID_CANCEL_STATE" || error?.message?.startsWith("INVALID_T01_TRANSITION")) return res.status(409).json({ ok: false, error: "cannot_cancel_in_current_state" });
    if (error?.message === "INVALID_SCHEDULED_DATETIME") return res.status(400).json({ ok: false, error: "invalid_scheduled_datetime" });
    if (error?.message === "IDEMPOTENCY_CLAIM_FAILED") return res.status(409).json({ ok: false, error: "idempotency_claim_failed" });
    console.error("Safe Cancel Booking Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const cancelBooking = cancelBookingSafely;
