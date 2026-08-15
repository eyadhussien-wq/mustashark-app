import { Request, Response } from "express";
import { and, eq, isNull, notInArray, sql } from "drizzle-orm";
import crypto from "crypto";
import { z } from "zod";
import { db, bookingTimeBlocksTable, bookingsTable, consultationEventsTable, lawyerAvailabilityTable, notificationsTable, usersTable } from "@workspace/db";

const schema = z.object({ lawyerId: z.string().min(1).max(128), subject: z.string().min(1).max(500), description: z.string().max(10000).optional(), scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/), scheduledTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), scheduledEndTime: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/).optional(), type: z.enum(["video", "chat", "phone"]), officeId: z.string().max(128).optional() });
function minutes(value: string) { const [h, m] = value.split(":").map(Number); return h * 60 + m; }
function formatTime(value: number) { return `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`; }
function isValidCalendarDate(value: string) { const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value); if (!match) return false; const year = Number(match[1]); const month = Number(match[2]); const day = Number(match[3]); const date = new Date(Date.UTC(year, month - 1, day)); return date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day; }
function scheduledAtQatar(date: string, time: string) { if (!isValidCalendarDate(date)) return null; const [year, month, day] = date.split("-").map(Number); const [hour, minute] = time.split(":").map(Number); if (![year, month, day, hour, minute].every(Number.isFinite)) return null; const requested = Date.UTC(year, month - 1, day, hour, minute); const parts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Qatar", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(requested)); const values = Object.fromEntries(parts.map((p) => [p.type, p.value])); const zoneWallClock = Date.UTC(Number(values.year), Number(values.month) - 1, Number(values.day), Number(values.hour), Number(values.minute)); return new Date(requested - (zoneWallClock - requested)); }
async function resolveLawyer(lawyerId: string) { let [lawyer] = await db.select().from(usersTable).where(and(eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1); if (!lawyer && lawyerId === "lawyer-test") [lawyer] = await db.select().from(usersTable).where(and(eq(usersTable.email, "lawyer@mustashark.com"), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1); if (!lawyer && lawyerId === "lawyer-demo") [lawyer] = await db.select().from(usersTable).where(and(eq(usersTable.email, "fatima@example.com"), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1); return lawyer; }

export const createBookingSafely = async (req: Request, res: Response) => {
  try {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
    const authUser = req.authUser!;
    if (authUser.role !== "client") return res.status(403).json({ ok: false, error: "client_role_required" });
    const input = parsed.data;
    if (!isValidCalendarDate(input.scheduledDate)) return res.status(400).json({ ok: false, error: "invalid_scheduled_date" });
    const start = minutes(input.scheduledTime); const requestedEnd = input.scheduledEndTime ? minutes(input.scheduledEndTime) : start + 60; const end = requestedEnd > start ? requestedEnd : start + 60;
    if (end <= start || end > 24 * 60) return res.status(400).json({ ok: false, error: "invalid_booking_time_range" });
    const scheduledStart = scheduledAtQatar(input.scheduledDate, input.scheduledTime);
    const scheduledEnd = scheduledAtQatar(input.scheduledDate, formatTime(end));
    if (!scheduledStart || !scheduledEnd) return res.status(400).json({ ok: false, error: "invalid_scheduled_datetime" });
    if (scheduledStart.getTime() <= Date.now()) return res.status(409).json({ ok: false, error: "slot_in_the_past", message: "هذا الموعد انتهى أو بدأ بالفعل. يرجى اختيار موعد مستقبلي." });
    const lawyer = await resolveLawyer(input.lawyerId);
    if (!lawyer) return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });

    const booking = await db.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${`${lawyer.id}:${input.scheduledDate}`}))`);
      const dayOfWeek = new Date(`${input.scheduledDate}T12:00:00Z`).getUTCDay();
      const availability = await tx.select().from(lawyerAvailabilityTable).where(and(eq(lawyerAvailabilityTable.lawyerId, lawyer.id), eq(lawyerAvailabilityTable.dayOfWeek, dayOfWeek), eq(lawyerAvailabilityTable.active, true)));
      const matchingWindow = availability.find((window) => { const windowStart = minutes(window.startTime); const windowEnd = minutes(window.endTime); const duration = window.slotDurationMinutes; return start >= windowStart && end <= windowEnd && (start - windowStart) % duration === 0 && end - start === duration; });
      if (!matchingWindow) throw new Error("SLOT_OUTSIDE_AVAILABILITY");

      const occupied = await tx.select({ block: bookingTimeBlocksTable }).from(bookingTimeBlocksTable).innerJoin(bookingsTable, eq(bookingTimeBlocksTable.bookingId, bookingsTable.id)).where(and(eq(bookingTimeBlocksTable.lawyerId, lawyer.id), eq(bookingTimeBlocksTable.scheduledDate, input.scheduledDate), notInArray(bookingsTable.status, ["rejected", "cancelled_by_lawyer", "cancelled_by_client", "refunded_absent"])));
      if (occupied.some(({ block }) => start < minutes(block.endTime) && end > minutes(block.startTime))) throw new Error("SLOT_ALREADY_BOOKED");
      const bookingId = crypto.randomUUID(); const serialNumber = `BK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
      const [created] = await tx.insert(bookingsTable).values({ id: bookingId, serialNumber, clientId: authUser.id, lawyerId: lawyer.id, officeId: input.officeId || null, subject: input.subject, description: input.description || null, scheduledDate: input.scheduledDate, scheduledTime: input.scheduledTime, status: "pending", type: input.type, price: lawyer.hourlyRate ?? "0", paymentStatus: "pending" }).returning();
      await tx.insert(bookingTimeBlocksTable).values({ id: crypto.randomUUID(), bookingId, lawyerId: lawyer.id, scheduledDate: input.scheduledDate, startTime: input.scheduledTime, endTime: formatTime(end) });
      await tx.insert(notificationsTable).values([{ id: crypto.randomUUID(), userId: lawyer.id, bookingId, title: "طلب استشارة جديد", body: `طلب جديد من ${authUser.name} مرجع ${serialNumber} يوم ${input.scheduledDate} من ${input.scheduledTime} إلى ${formatTime(end)}. يرجى مراجعة الطلب وإرسال العرض.`, kind: "info", urgent: true }, { id: crypto.randomUUID(), userId: authUser.id, bookingId, title: "تم إرسال طلب الاستشارة", body: `تم إرسال طلبك ${serialNumber} إلى ${lawyer.name} يوم ${input.scheduledDate} من ${input.scheduledTime} إلى ${formatTime(end)}.`, kind: "success", urgent: false }]);
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "CONSULTATION_CREATED", actorId: authUser.id, metadata: { initialState: "PAYMENT_PENDING", serialNumber, reference: serialNumber, price: lawyer.hourlyRate ?? "0", type: input.type, scheduledDate: input.scheduledDate, scheduledTime: input.scheduledTime } });
      return created;
    });
    return res.status(201).json({ ok: true, booking: { ...booking, reference: booking.serialNumber, timezone: "Asia/Qatar", scheduledEndTime: formatTime(end), scheduledStartAtUtc: scheduledStart.toISOString(), scheduledEndAtUtc: scheduledEnd.toISOString() } });
  } catch (error: any) {
    if (error?.message === "SLOT_ALREADY_BOOKED") return res.status(409).json({ ok: false, error: "slot_already_booked", message: "هذا الموعد لم يعد متاحاً. يرجى اختيار وقت آخر." });
    if (error?.message === "SLOT_OUTSIDE_AVAILABILITY") return res.status(409).json({ ok: false, error: "slot_not_available", message: "هذا الوقت خارج أوقات توفر المحامي." });
    console.error("Create Booking Safely Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
