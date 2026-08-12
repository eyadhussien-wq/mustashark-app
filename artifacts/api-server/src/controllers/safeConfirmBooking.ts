import { Request, Response } from "express";
import { and, eq } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@workspace/db";
import { bookingsTable, notificationsTable, platformDuesTable, PLATFORM_COMMISSION_RATE } from "@workspace/db/schema";

export const confirmBookingSafely = async (req: Request, res: Response) => {
  try {
    const bookingId = typeof req.body?.bookingId === "string" ? req.body.bookingId : "";
    if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId_is_required" });

    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.lawyerId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (booking.status !== "pending") return res.status(400).json({ ok: false, error: "invalid_booking_status" });

    const googleMeetLink = booking.type === "video" ? `https://meet.google.com/mst-${booking.serialNumber.toLowerCase()}` : null;
    const updatedBooking = await db.transaction(async (tx) => {
      const [updated] = await tx.update(bookingsTable)
        .set({ status: "accepted", googleMeetLink, updatedAt: new Date() })
        .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "pending")))
        .returning();
      if (!updated) throw new Error("ALREADY_PROCESSED");

      const grossAmount = booking.price;
      const commissionRate = PLATFORM_COMMISSION_RATE;
      const commissionAmount = String((Number(grossAmount) * Number(commissionRate)).toFixed(2));
      await tx.insert(platformDuesTable).values({
        id: crypto.randomUUID(),
        bookingId,
        officeId: booking.officeId,
        lawyerId: booking.lawyerId,
        grossAmount,
        commissionRate,
        commissionAmount,
        status: "pending",
      }).onConflictDoNothing();

      await tx.insert(notificationsTable).values({
        id: crypto.randomUUID(),
        userId: booking.clientId!,
        bookingId,
        title: "تم تأكيد موعد الاستشارة",
        body: `وافق المحامي على طلبك. الموعد المؤكد هو ${booking.scheduledDate} الساعة ${booking.scheduledTime}.`,
        kind: "success",
        urgent: true,
      });

      return updated;
    });

    return res.json({ ok: true, booking: updatedBooking });
  } catch (error: any) {
    if (error?.message === "ALREADY_PROCESSED") return res.status(409).json({ ok: false, error: "already_processed_or_invalid_state" });
    console.error("Confirm Booking Safely Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
