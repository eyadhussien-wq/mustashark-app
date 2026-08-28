import { Request, Response } from "express";
import { and, eq, or } from "drizzle-orm";
import { db } from "@workspace/db";
import { bookingsTable, usersTable } from "@workspace/db/schema";

/**
 * Explicit allow-list for booking reads. Never spread a database row into an
 * API response: booking records can gain sensitive columns over time.
 */
function toSafeBooking(booking: typeof bookingsTable.$inferSelect, names: { clientName?: string; lawyerName?: string; lawyerSpecialization?: string; lawyerCountry?: string | null }) {
  return {
    id: booking.id,
    serialNumber: booking.serialNumber,
    clientId: booking.clientId,
    clientName: names.clientName ?? null,
    lawyerId: booking.lawyerId,
    lawyerName: names.lawyerName ?? null,
    lawyerSpecialization: names.lawyerSpecialization ?? null,
    lawyerCountry: names.lawyerCountry ?? null,
    subject: booking.subject,
    description: booking.description,
    scheduledDate: booking.scheduledDate,
    scheduledTime: booking.scheduledTime,
    scheduledTimezone: booking.scheduledTimezone,
    status: booking.status,
    type: booking.type,
    price: booking.price,
    paymentStatus: booking.paymentStatus,
    refundAmount: booking.refundAmount,
    refundReason: booking.refundReason,
    cancelledAt: booking.cancelledAt,
    cancelledBy: booking.cancelledBy,
    disputedAt: booking.disputedAt,
    disputeReason: booking.disputeReason,
    googleMeetLink: booking.googleMeetLink,
    lawyerJoinedAt: booking.lawyerJoinedAt,
    clientJoinedAt: booking.clientJoinedAt,
    actualStartTime: booking.actualStartTime,
    actualEndTime: booking.actualEndTime,
    createdAt: booking.createdAt,
    updatedAt: booking.updatedAt,
    version: booking.version,
  };
}

async function enrichBooking(booking: typeof bookingsTable.$inferSelect) {
  const [client] = booking.clientId
    ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.clientId)).limit(1)
    : [];
  const [lawyer] = booking.lawyerId
    ? await db.select({ name: usersTable.name, specialization: usersTable.specialization, country: usersTable.country }).from(usersTable).where(eq(usersTable.id, booking.lawyerId)).limit(1)
    : [];
  return toSafeBooking(booking, {
    clientName: client?.name ?? undefined,
    lawyerName: lawyer?.name ?? undefined,
    lawyerSpecialization: lawyer?.specialization ?? undefined,
    lawyerCountry: lawyer?.country ?? null,
  });
}

export const listMyBookingsSafe = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const rows = await db
      .select()
      .from(bookingsTable)
      .where(authUser.role === "admin" ? undefined : or(eq(bookingsTable.clientId, authUser.id), eq(bookingsTable.lawyerId, authUser.id)));
    const bookings = await Promise.all(rows.map(enrichBooking));
    bookings.sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`));
    return res.json({ ok: true, bookings });
  } catch (error) {
    console.error("List My Bookings Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const getBookingByIdSafe = async (req: Request, res: Response) => {
  try {
    const rawBookingId = req.params.id;
    const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
    if (!bookingId) return res.status(400).json({ ok: false, error: "booking_id_is_required" });
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (authUser.role !== "admin" && booking.clientId !== authUser.id && booking.lawyerId !== authUser.id) {
      return res.status(403).json({ ok: false, error: "unauthorized_access" });
    }
    return res.json({ ok: true, booking: await enrichBooking(booking) });
  } catch (error) {
    console.error("Get Booking By ID Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
