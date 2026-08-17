import { Request, Response } from "express";
import { and, eq, or, inArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { bookingsTable, usersTable } from "@workspace/db/schema";

const UPCOMING_STATUSES = ["pending", "accepted"] as const;
const DEFAULT_WINDOW_DAYS = 7;
const MAX_WINDOW_DAYS = 30;
const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

function parseScheduledAt(scheduledDate: string, scheduledTime: string) {
  const value = new Date(`${scheduledDate}T${scheduledTime}:00`);
  return Number.isNaN(value.getTime()) ? null : value;
}

export const listUpcomingBookings = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const requestedDays = Number(req.query.days ?? DEFAULT_WINDOW_DAYS);
    const requestedLimit = Number(req.query.limit ?? DEFAULT_LIMIT);

    if (!Number.isInteger(requestedDays) || requestedDays < 1 || requestedDays > MAX_WINDOW_DAYS) {
      return res.status(400).json({ ok: false, error: "invalid_days" });
    }
    if (!Number.isInteger(requestedLimit) || requestedLimit < 1 || requestedLimit > MAX_LIMIT) {
      return res.status(400).json({ ok: false, error: "invalid_limit" });
    }

    const now = new Date();
    const until = new Date(now.getTime() + requestedDays * 24 * 60 * 60 * 1000);
    const ownership = authUser.role === "admin"
      ? undefined
      : or(eq(bookingsTable.clientId, authUser.id), eq(bookingsTable.lawyerId, authUser.id));

    const rows = await db
      .select()
      .from(bookingsTable)
      .where(and(
        inArray(bookingsTable.status, [...UPCOMING_STATUSES]),
        ownership,
      ));

    const upcoming = rows
      .map((booking) => ({ booking, scheduledAt: parseScheduledAt(booking.scheduledDate, booking.scheduledTime) }))
      .filter((item): item is { booking: typeof rows[number]; scheduledAt: Date } =>
        item.scheduledAt !== null && item.scheduledAt > now && item.scheduledAt <= until,
      )
      .sort((a, b) => a.scheduledAt.getTime() - b.scheduledAt.getTime())
      .slice(0, requestedLimit);

    const enriched = await Promise.all(upcoming.map(async ({ booking, scheduledAt }) => {
      const [client] = booking.clientId
        ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.clientId)).limit(1)
        : [];
      const [lawyer] = booking.lawyerId
        ? await db.select({ name: usersTable.name, specialization: usersTable.specialization, country: usersTable.country }).from(usersTable).where(eq(usersTable.id, booking.lawyerId)).limit(1)
        : [];
      return {
        ...booking,
        scheduledAt: scheduledAt.toISOString(),
        clientName: client?.name ?? "العميل",
        lawyerName: lawyer?.name ?? "المحامي",
        lawyerSpecialization: lawyer?.specialization ?? "",
        lawyerCountry: lawyer?.country ?? null,
      };
    }));

    return res.json({
      ok: true,
      windowDays: requestedDays,
      bookings: enriched,
    });
  } catch (error) {
    console.error("List Upcoming Bookings Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
