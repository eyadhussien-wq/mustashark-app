import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@workspace/db";
import { bookingsTable, consultationEventsTable, notificationsTable, platformDuesTable, PLATFORM_COMMISSION_RATE } from "@workspace/db/schema";
import { assertT01Transition, getT01State } from "../lib/t01ConsultationStateMachine";

export const confirmBookingSafely = async (req: Request, res: Response) => {
  try {
    const bookingId = typeof req.body?.bookingId === "string" ? req.body.bookingId : "";
    const expectedVersion = Number(req.body?.expectedVersion);
    if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId_is_required" });
    if (!Number.isInteger(expectedVersion) || expectedVersion < 1) return res.status(400).json({ ok: false, error: "expectedVersion_is_required" });
    const authUser = req.authUser!;
    const updatedBooking = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.lawyerId !== authUser.id && authUser.role !== "admin") throw new Error("FORBIDDEN");
      if (booking.version !== expectedVersion) throw new Error("VERSION_CONFLICT");
      if (booking.status !== "pending" || booking.paymentStatus !== "paid" || booking.escrowStatus !== "held") throw new Error("INVALID_FINANCIAL_STATE");
      assertT01Transition(getT01State(booking), "SCHEDULED");
      const googleMeetLink = booking.type === "video" ? `https://meet.google.com/mst-${booking.serialNumber.toLowerCase()}` : null;
      const [updated] = await tx.update(bookingsTable)
        .set({ status: "accepted", googleMeetLink, version: expectedVersion + 1, updatedAt: new Date() })
        .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.version, expectedVersion), eq(bookingsTable.status, "pending"), eq(bookingsTable.paymentStatus, "paid"), eq(bookingsTable.escrowStatus, "held")))
        .returning();
      if (!updated) throw new Error("VERSION_CONFLICT");
      const grossAmount = booking.price;
      const commissionRate = PLATFORM_COMMISSION_RATE;
      const commissionAmount = String((Number(grossAmount) * Number(commissionRate)).toFixed(2));
      await tx.insert(platformDuesTable).values({ id: crypto.randomUUID(), bookingId, officeId: booking.officeId, lawyerId: booking.lawyerId, grossAmount, commissionRate, commissionAmount, status: "pending" }).onConflictDoNothing();
      await tx.insert(notificationsTable).values({ id: crypto.randomUUID(), userId: booking.clientId!, bookingId, title: "تم تأكيد موعد الاستشارة", body: `وافق المحامي على طلبك. الموعد المؤكد هو ${booking.scheduledDate} الساعة ${booking.scheduledTime}.`, kind: "success", urgent: true });
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "LAWYER_ACCEPTED", actorId: authUser.id, metadata: { fromState: "PENDING_ACCEPTANCE", toState: "SCHEDULED", financialGate: true, expectedVersion } });
      return updated;
    });
    return res.json({ ok: true, booking: updatedBooking });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (error?.message === "FORBIDDEN") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (error?.message === "VERSION_CONFLICT") return res.status(409).json({ ok: false, error: "booking_version_conflict", message: "Conflict: The booking state has been modified by another concurrent request." });
    if (error?.message === "INVALID_FINANCIAL_STATE") return res.status(409).json({ ok: false, error: "payment_and_escrow_required_before_acceptance" });
    console.error("Confirm Booking Safely Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
