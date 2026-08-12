import { Request, Response } from "express";
import { and, eq, isNull, notInArray, sql } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { bookingTimeBlocksTable, bookingsTable, notificationsTable, usersTable } from "@workspace/db/schema";

const schema = z.object({
  lawyerId: z.string().min(1),
  subject: z.string().min(1),
  description: z.string().optional(),
  scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  scheduledEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(),
  type: z.enum(["video", "chat", "phone"]),
  officeId: z.string().optional(),
});

function minutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

function formatTime(value: number) {
  return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
}

async function resolveLawyer(lawyerId: string) {
  let [lawyer] = await db.select().from(usersTable)
    .where(and(eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt)))
    .limit(1);
  if (!lawyer && lawyerId === "lawyer-test") {
    [lawyer] = await db.select().from(usersTable)
      .where(and(eq(usersTable.email, "lawyer@mustashark.com"), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt)))
      .limit(1);
  }
  if (!lawyer && lawyerId === "lawyer-demo") {
    [lawyer] = await db.select().from(usersTable)
      .where(and(eq(usersTable.email, "fatima@example.com"), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt)))
      .limit(1);
  }
  return lawyer;
}

export const createBookingSafely = async (req: Request, res: Response) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
    const authUser = req.authUser!;
    const input = parsed.data;
    const start = minutes(input.scheduledTime);
    const end = minutes(input.scheduledEndTime ?? formatTime(start + 60));
    if (end <= start || end > 24 * 60) return res.status(400).json({ ok: false, error: "invalid_booking_time_range" });

    const lawyer = await resolveLawyer(input.lawyerId);
    if (!lawyer) return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });

    const booking = await db.transaction(async (tx) => {
      // Serialize every booking write for this lawyer/day so two clients cannot
      // claim the same interval concurrently.
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${lawyer.id}:${input.scheduledDate}`}))`);

      const occupied = await tx.select({ block: bookingTimeBlocksTable })
        .from(bookingTimeBlocksTable)
        .innerJoin(bookingsTable, eq(bookingTimeBlocksTable.bookingId, bookingsTable.id))
        .where(and(
          eq(bookingTimeBlocksTable.lawyerId, lawyer.id),
          eq(bookingTimeBlocksTable.scheduledDate, input.scheduledDate),
          notInArray(bookingsTable.status, ["rejected", "cancelled_by_lawyer", "cancelled_by_client", "refunded_absent"]),
        ));

      const conflict = occupied.some(({ block }) => {
        const existingStart = minutes(block.startTime);
        const existingEnd = minutes(block.endTime);
        return start < existingEnd && end > existingStart;
      });
      if (conflict) throw new Error("SLOT_ALREADY_BOOKED");

      const bookingId = crypto.randomUUID();
      const serialNumber = `BK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const [created] = await tx.insert(bookingsTable).values({
        id: bookingId,
        serialNumber,
        clientId: authUser.id,
        lawyerId: lawyer.id,
        officeId: input.officeId || null,
        subject: input.subject,
        description: input.description || null,
        scheduledDate: input.scheduledDate,
        scheduledTime: input.scheduledTime,
        status: "pending",
        type: input.type,
        price: lawyer.hourlyRate ?? "0",
        paymentStatus: "pending",
      }).returning();

      await tx.insert(bookingTimeBlocksTable).values({
        id: crypto.randomUUID(),
        bookingId,
        lawyerId: lawyer.id,
        scheduledDate: input.scheduledDate,
        startTime: input.scheduledTime,
        endTime: formatTime(end),
      });

      await tx.insert(notificationsTable).values([
        {
          id: crypto.randomUUID(),
          userId: lawyer.id,
          bookingId,
          title: "طلب استشارة جديد",
          body: `طلب جديد من ${authUser.name} يوم ${input.scheduledDate} من ${input.scheduledTime} إلى ${formatTime(end)}. يرجى مراجعة الطلب وإرسال العرض.`,
          kind: "info",
          urgent: true,
        },
        {
          id: crypto.randomUUID(),
          userId: authUser.id,
          bookingId,
          title: "تم إرسال طلب الاستشارة",
          body: `تم إرسال طلبك إلى ${lawyer.name} يوم ${input.scheduledDate} من ${input.scheduledTime} إلى ${formatTime(end)}.`,
          kind: "success",
          urgent: false,
        },
      ]);

      return created;
    });

    return res.status(201).json({ ok: true, booking: { ...booking, scheduledEndTime: formatTime(end) } });
  } catch (error: any) {
    if (error?.message === "SLOT_ALREADY_BOOKED") {
      return res.status(409).json({ ok: false, error: "slot_already_booked", message: "هذا الموعد لم يعد متاحاً. يرجى اختيار وقت آخر." });
    }
    console.error("Create Booking Safely Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
