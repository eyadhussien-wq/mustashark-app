import { Request, Response } from "express";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { db, bookingTimeBlocksTable, bookingsTable, usersTable, lawyerAvailabilityTable } from "@workspace/db";
import crypto from "crypto";
import { z } from "zod";

const availabilitySchema = z.object({
  slots: z.array(z.object({
    dayOfWeek: z.number().int().min(0).max(6),
    startTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    endTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    slotDurationMinutes: z.number().int().min(15).max(240).default(60),
  })).max(50),
});

function minutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function normalizeDate(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(Date.UTC(year, month - 1, day));
  return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day ? value : null;
}

function formatTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

function wallClockToUtc(date: string, time: string) {
  const normalizedDate = normalizeDate(date);
  if (!normalizedDate) return null;
  const [year, month, day] = normalizedDate.split("-").map(Number);
  const [hour, minute] = time.split(":").map(Number);
  if (![year, month, day, hour, minute].every(Number.isFinite)) return null;
  const requested = Date.UTC(year, month - 1, day, hour, minute);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Qatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(requested));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const zoneWallClock = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
  );
  return new Date(requested - (zoneWallClock - requested)).toISOString();
}

export const getLawyerAvailability = async (req: Request, res: Response) => {
  try {
    const lawyerId = String(req.params.lawyerId ?? "");
    const [lawyer] = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus })
      .from(usersTable)
      .where(eq(usersTable.id, lawyerId))
      .limit(1);
    if (!lawyer || lawyer.role !== "lawyer" || lawyer.accountStatus !== "active") {
      return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });
    }

    const rows = await db.select().from(lawyerAvailabilityTable)
      .where(and(eq(lawyerAvailabilityTable.lawyerId, lawyerId), eq(lawyerAvailabilityTable.active, true)))
      .orderBy(asc(lawyerAvailabilityTable.dayOfWeek), asc(lawyerAvailabilityTable.startTime));
    return res.json({ ok: true, availability: rows });
  } catch (error) {
    console.error("Get Lawyer Availability Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const updateMyAvailability = async (req: Request, res: Response) => {
  try {
    const parsed = availabilitySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_availability", details: parsed.error.errors });
    const lawyerId = req.authUser!.id;

    const seen = new Set<string>();
    const byDay = new Map<number, Array<{ start: number; end: number }>>();
    for (const slot of parsed.data.slots) {
      const start = minutes(slot.startTime);
      const end = minutes(slot.endTime);
      if (end <= start) return res.status(400).json({ ok: false, error: "availability_end_must_be_after_start" });
      if (end - start < slot.slotDurationMinutes) {
        return res.status(400).json({ ok: false, error: "availability_window_shorter_than_slot_duration" });
      }
      const key = `${slot.dayOfWeek}|${slot.startTime}|${slot.endTime}`;
      if (seen.has(key)) return res.status(400).json({ ok: false, error: "availability_duplicate_window" });
      seen.add(key);
      const day = byDay.get(slot.dayOfWeek) ?? [];
      day.push({ start, end });
      byDay.set(slot.dayOfWeek, day);
    }
    for (const day of byDay.values()) {
      day.sort((a, b) => a.start - b.start);
      for (let index = 1; index < day.length; index += 1) {
        if (day[index].start < day[index - 1].end) {
          return res.status(400).json({ ok: false, error: "availability_slots_overlap" });
        }
      }
    }

    const rows = await db.transaction(async (tx) => {
      await tx.delete(lawyerAvailabilityTable).where(eq(lawyerAvailabilityTable.lawyerId, lawyerId));
      if (parsed.data.slots.length === 0) return [];
      return tx.insert(lawyerAvailabilityTable).values(parsed.data.slots.map((slot) => ({ id: crypto.randomUUID(), lawyerId, ...slot, active: true }))).returning();
    });
    return res.json({ ok: true, availability: rows });
  } catch (error) {
    console.error("Update Lawyer Availability Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const deleteMyAvailability = async (req: Request, res: Response) => {
  try {
    const lawyerId = req.authUser!.id;
    const result = await db.delete(lawyerAvailabilityTable).where(eq(lawyerAvailabilityTable.lawyerId, lawyerId));
    return res.json({ ok: true, deleted: Number(result.rowCount ?? 0) });
  } catch (error) {
    console.error("Delete Lawyer Availability Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const lawyerId = String(req.params.lawyerId ?? "");
    const date = normalizeDate(String(req.query.date ?? ""));
    if (!date) return res.status(400).json({ ok: false, error: "invalid_date" });

    const [lawyer] = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus })
      .from(usersTable).where(eq(usersTable.id, lawyerId)).limit(1);
    if (!lawyer || lawyer.role !== "lawyer" || lawyer.accountStatus !== "active") return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });

    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
    const availability = await db.select().from(lawyerAvailabilityTable)
      .where(and(eq(lawyerAvailabilityTable.lawyerId, lawyerId), eq(lawyerAvailabilityTable.dayOfWeek, dayOfWeek), eq(lawyerAvailabilityTable.active, true)))
      .orderBy(asc(lawyerAvailabilityTable.startTime));

    const blocks = await db.select({ block: bookingTimeBlocksTable })
      .from(bookingTimeBlocksTable)
      .innerJoin(bookingsTable, eq(bookingTimeBlocksTable.bookingId, bookingsTable.id))
      .where(and(
        eq(bookingTimeBlocksTable.lawyerId, lawyerId),
        eq(bookingTimeBlocksTable.scheduledDate, date),
        notInArray(bookingsTable.status, ["rejected", "cancelled_by_lawyer", "cancelled_by_client", "refunded_absent"]),
      ))
      .orderBy(asc(bookingTimeBlocksTable.startTime));

    const occupied = blocks.map(({ block }) => ({ start: minutes(block.startTime), end: minutes(block.endTime) }));
    const slots: Array<{ startTime: string; endTime: string; startAtUtc: string; endAtUtc: string }> = [];
    for (const window of availability) {
      const start = minutes(window.startTime);
      const end = minutes(window.endTime);
      const duration = window.slotDurationMinutes;
      for (let cursor = start; cursor + duration <= end; cursor += duration) {
        const slotStart = cursor;
        const slotEnd = cursor + duration;
        const isBooked = occupied.some((block) => slotStart < block.end && slotEnd > block.start);
        if (!isBooked) {
          const startTime = formatTime(slotStart);
          const endTime = formatTime(slotEnd);
          const startAtUtc = wallClockToUtc(date, startTime);
          const endAtUtc = wallClockToUtc(date, endTime);
          if (startAtUtc && endAtUtc) slots.push({ startTime, endTime, startAtUtc, endAtUtc });
        }
      }
    }
    return res.json({ ok: true, date, timezone: "Asia/Qatar", slots });
  } catch (error) {
    console.error("Get Available Slots Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
