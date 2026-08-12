import { Request, Response } from "express";
import { and, asc, eq, notInArray } from "drizzle-orm";
import { db } from "@workspace/db";
import { bookingsTable, usersTable } from "@workspace/db/schema";
import { lawyerAvailabilityTable } from "@workspace/db/schema/lawyerAvailability";
import { bookingTimeBlocksTable } from "@workspace/db/schema/bookingTimeBlocks";
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
  return /^\d{4}-\d{2}-\d{2}$/.test(value) ? value : null;
}

function formatTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

export const getLawyerAvailability = async (req: Request, res: Response) => {
  try {
    const lawyerId = String(req.params.lawyerId ?? "");
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
    for (const slot of parsed.data.slots) {
      if (minutes(slot.endTime) <= minutes(slot.startTime)) return res.status(400).json({ ok: false, error: "availability_end_must_be_after_start" });
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

export const getAvailableSlots = async (req: Request, res: Response) => {
  try {
    const lawyerId = String(req.params.lawyerId ?? "");
    const date = normalizeDate(String(req.query.date ?? ""));
    if (!date) return res.status(400).json({ ok: false, error: "invalid_date" });

    const [lawyer] = await db.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus })
      .from(usersTable).where(eq(usersTable.id, lawyerId)).limit(1);
    if (!lawyer || lawyer.role !== "lawyer" || lawyer.accountStatus !== "active") return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });

    const dayOfWeek = new Date(`${date}T12:00:00Z`).getUTCDay();
    let availability = await db.select().from(lawyerAvailabilityTable)
      .where(and(eq(lawyerAvailabilityTable.lawyerId, lawyerId), eq(lawyerAvailabilityTable.dayOfWeek, dayOfWeek), eq(lawyerAvailabilityTable.active, true)))
      .orderBy(asc(lawyerAvailabilityTable.startTime));

    if (availability.length === 0 && dayOfWeek >= 1 && dayOfWeek <= 5) {
      availability = [{ startTime: "09:00", endTime: "17:00", slotDurationMinutes: 60 } as typeof availability[number]];
    }

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
    const slots: Array<{ startTime: string; endTime: string }> = [];
    for (const window of availability) {
      const start = minutes(window.startTime);
      const end = minutes(window.endTime);
      const duration = window.slotDurationMinutes;
      for (let cursor = start; cursor + duration <= end; cursor += duration) {
        const slotStart = cursor;
        const slotEnd = cursor + duration;
        const isBooked = occupied.some((block) => slotStart < block.end && slotEnd > block.start);
        if (!isBooked) slots.push({ startTime: formatTime(slotStart), endTime: formatTime(slotEnd) });
      }
    }
    return res.json({ ok: true, date, slots });
  } catch (error) {
    console.error("Get Available Slots Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
