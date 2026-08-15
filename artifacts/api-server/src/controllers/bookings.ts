import { Request, Response } from "express";
import { z } from "zod";
import { eq, and, isNull, or } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  bookingsTable,
  consultationEventsTable,
  platformDuesTable,
  usersTable,
  PLATFORM_COMMISSION_RATE,
} from "@workspace/db/schema";
import { assertT01Transition, getT01State } from "../lib/t01ConsultationStateMachine";

const createBookingSchema = z.object({ lawyerId: z.string().min(1), subject: z.string().min(1), description: z.string().optional(), scheduledDate: z.string().min(1), scheduledTime: z.string().min(1), type: z.enum(["video", "chat", "phone"]), officeId: z.string().optional() });
const checkAbsenceSchema = z.object({ bookingId: z.string().min(1) });
const cancellationSchema = z.object({ bookingId: z.string().min(1), reason: z.string().trim().min(1).max(1000) });
const disputeSchema = z.object({ bookingId: z.string().min(1), reason: z.string().trim().min(1).max(2000) });
const APPOINTMENT_EARLY_ACCESS_MS = 5 * 60 * 1000;
const APPOINTMENT_DURATION_MS = 30 * 60 * 1000;
const BOOKING_TIME_ZONE = "Asia/Qatar";

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

function isWithinAppointmentWindow(booking: { scheduledDate: string; scheduledTime: string }, now = new Date()) {
  const appointment = scheduledAt(booking.scheduledDate, booking.scheduledTime);
  if (!appointment) return false;
  const currentTime = now.getTime();
  return currentTime >= appointment.getTime() - APPOINTMENT_EARLY_ACCESS_MS && currentTime <= appointment.getTime() + APPOINTMENT_DURATION_MS;
}

export const createBooking = async (req: Request, res: Response) => {
  try {
    const parsed = createBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
    const { lawyerId, subject, description, scheduledDate, scheduledTime, type, officeId } = parsed.data;
    const authUser = req.authUser!;
    let [lawyer] = await db.select().from(usersTable).where(and(eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1);
    if (!lawyer && lawyerId === "lawyer-test") [lawyer] = await db.select().from(usersTable).where(and(eq(usersTable.email, "lawyer@mustashark.com"), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1);
    if (!lawyer && lawyerId === "lawyer-demo") [lawyer] = await db.select().from(usersTable).where(and(eq(usersTable.email, "fatima@example.com"), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1);
    if (!lawyer) return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });
    const bookingId = crypto.randomUUID();
    const serialNumber = `BK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const price = lawyer.hourlyRate ?? "0";
    const newBooking = await db.transaction(async (tx) => {
      const [booking] = await tx.insert(bookingsTable).values({ id: bookingId, serialNumber, clientId: authUser.id, lawyerId: lawyer.id, officeId: officeId || null, subject, description: description || null, scheduledDate, scheduledTime, status: "pending", type, price, paymentStatus: "pending" }).returning();
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "CONSULTATION_CREATED", actorId: authUser.id, metadata: { initialState: "PAYMENT_PENDING", price, type } });
      return booking;
    });
    return res.status(201).json({ ok: true, booking: newBooking });
  } catch (error) { console.error("Create Booking Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" }); }
};

export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId_is_required" });
    const authUser = req.authUser!;
    const updatedBooking = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.lawyerId !== authUser.id && authUser.role !== "admin") throw new Error("FORBIDDEN");
      if (booking.status !== "pending" || booking.paymentStatus !== "paid" || booking.escrowStatus !== "held") throw new Error("INVALID_STATE");
      assertT01Transition(getT01State(booking), "SCHEDULED");
      const googleMeetLink = booking.type === "video" ? `https://meet.google.com/mst-${booking.serialNumber.toLowerCase()}` : null;
      const [updated] = await tx.update(bookingsTable).set({ status: "accepted", googleMeetLink, updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "pending"), eq(bookingsTable.paymentStatus, "paid"), eq(bookingsTable.escrowStatus, "held"))).returning();
      if (!updated) throw new Error("ALREADY_PROCESSED");
      const grossAmount = booking.price;
      const commissionRate = PLATFORM_COMMISSION_RATE;
      const commissionAmount = String((Number(grossAmount) * Number(commissionRate)).toFixed(2));
      await tx.insert(platformDuesTable).values({ id: crypto.randomUUID(), bookingId, officeId: booking.officeId, lawyerId: booking.lawyerId, grossAmount, commissionRate, commissionAmount, status: "pending" }).onConflictDoNothing();
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "LAWYER_ACCEPTED", actorId: authUser.id, metadata: { fromState: "PENDING_ACCEPTANCE", toState: "SCHEDULED", financialGate: true } });
      return updated;
    });
    return res.json({ ok: true, booking: updatedBooking });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (error?.message === "FORBIDDEN") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (error?.message === "INVALID_STATE") return res.status(409).json({ ok: false, error: "payment_and_escrow_required_before_acceptance" });
    if (error?.message === "ALREADY_PROCESSED") return res.status(409).json({ ok: false, error: "already_processed_or_invalid_state" });
    console.error("Confirm Booking Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const recordJoin = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId_is_required" });
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    const isLawyer = authUser.role === "lawyer" && booking.lawyerId === authUser.id;
    const isClient = authUser.role === "client" && booking.clientId === authUser.id;
    if (!isLawyer && !isClient) return res.status(403).json({ ok: false, error: "unauthorized_access" });
    if (booking.status !== "accepted" || !isWithinAppointmentWindow(booking) || (booking.type === "video" && !booking.googleMeetLink)) return res.status(400).json({ ok: false, error: "consultation_not_available" });
    const result = await db.transaction(async (tx) => {
      assertT01Transition(getT01State(booking), "IN_PROGRESS");
      const now = new Date();
      const rows = await tx.update(bookingsTable).set({ updatedAt: now, ...(isLawyer ? { lawyerJoinedAt: now } : { clientJoinedAt: now }), actualStartTime: booking.actualStartTime ?? now }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "accepted"), isLawyer ? isNull(bookingsTable.lawyerJoinedAt) : isNull(bookingsTable.clientJoinedAt), isLawyer ? eq(bookingsTable.lawyerId, authUser.id) : eq(bookingsTable.clientId, authUser.id))).returning();
      if (rows.length === 0) throw new Error("INVALID_JOIN");
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "SESSION_STARTED", actorId: authUser.id, metadata: { fromState: "SCHEDULED", toState: "IN_PROGRESS", actorRole: authUser.role } });
      return rows[0];
    });
    return res.json({ ok: true, booking: result });
  } catch (error: any) {
    if (error?.message === "INVALID_JOIN" || error?.message?.startsWith("INVALID_T01_TRANSITION")) return res.status(409).json({ ok: false, error: "invalid_state_transition" });
    console.error("Record Join Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const checkLawyerAbsence = async (req: Request, res: Response) => {
  try {
    const parsed = checkAbsenceSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
    const { bookingId } = parsed.data;
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.clientId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (!booking.clientJoinedAt) return res.status(400).json({ ok: false, error: "client_did_not_join" });
    const scheduledStartTime = scheduledAt(booking.scheduledDate, booking.scheduledTime);
    if (!scheduledStartTime) return res.status(400).json({ ok: false, error: "invalid_scheduled_datetime" });
    if ((Date.now() - scheduledStartTime.getTime()) / 60000 < 15) return res.status(400).json({ ok: false, error: "wait_15_minutes_from_scheduled_start_before_claiming_absence" });
    const updatedBooking = await db.transaction(async (tx) => {
      if (booking.paymentStatus !== "paid" || booking.escrowStatus !== "held") throw new Error("FINANCIAL_GATE_REQUIRED");
      const [updated] = await tx.update(bookingsTable).set({ status: "refunded_absent", paymentStatus: "refunded", escrowStatus: "refunded", updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "accepted"), eq(bookingsTable.paymentStatus, "paid"), eq(bookingsTable.escrowStatus, "held"), isNull(bookingsTable.lawyerJoinedAt))).returning();
      if (!updated) throw new Error("ALREADY_PROCESSED");
      await tx.update(platformDuesTable).set({ status: "waived", updatedAt: new Date() }).where(eq(platformDuesTable.bookingId, bookingId));
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "LAWYER_NO_SHOW_REFUND", actorId: authUser.id, metadata: { financialGate: true, refund: "full", reason: "Lawyer did not join within the permitted absence window." } });
      return updated;
    });
    return res.json({ ok: true, message: "lawyer_absent_refund_processed_successfully", booking: updatedBooking });
  } catch (error: any) {
    if (error?.message === "FINANCIAL_GATE_REQUIRED") return res.status(409).json({ ok: false, error: "paid_escrow_required_before_refund" });
    if (error?.message === "ALREADY_PROCESSED") return res.status(409).json({ ok: false, error: "already_processed_or_invalid_state" });
    console.error("Check Lawyer Absence Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const listMyBookings = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const rows = await db.select().from(bookingsTable).where(authUser.role === "admin" ? undefined : or(eq(bookingsTable.clientId, authUser.id), eq(bookingsTable.lawyerId, authUser.id)));
    const bookings = await Promise.all(rows.map(async (booking) => {
      const [client] = booking.clientId ? await db.select({ name: usersTable.name }).from(usersTable).where(eq(usersTable.id, booking.clientId)).limit(1) : [];
      const [lawyer] = booking.lawyerId ? await db.select({ name: usersTable.name, specialization: usersTable.specialization, country: usersTable.country }).from(usersTable).where(eq(usersTable.id, booking.lawyerId)).limit(1) : [];
      return { ...booking, clientName: client?.name ?? "العميل", lawyerName: lawyer?.name ?? "المحامي", lawyerSpecialization: lawyer?.specialization ?? "", lawyerCountry: lawyer?.country ?? null };
    }));
    bookings.sort((a, b) => `${a.scheduledDate}${a.scheduledTime}`.localeCompare(`${b.scheduledDate}${b.scheduledTime}`));
    return res.json({ ok: true, bookings });
  } catch (error) { console.error("List My Bookings Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" }); }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const rawBookingId = req.params.id;
    const bookingId = Array.isArray(rawBookingId) ? rawBookingId[0] : rawBookingId;
    if (!bookingId) return res.status(400).json({ ok: false, error: "booking_id_is_required" });
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.clientId !== authUser.id && booking.lawyerId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_access" });
    return res.json({ ok: true, booking });
  } catch (error) { console.error("Get Booking By ID Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" }); }
};

export const completeBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;
    if (!bookingId) return res.status(400).json({ ok: false, error: "bookingId_is_required" });
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.lawyerId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (getT01State(booking) !== "IN_PROGRESS") return res.status(400).json({ ok: false, error: "invalid_state_transition" });
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(bookingsTable).set({ status: "completed", actualEndTime: new Date(), updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "accepted"))).returning();
      if (!row) throw new Error("ALREADY_PROCESSED");
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "LAWYER_COMPLETED", actorId: authUser.id, metadata: { fromState: "IN_PROGRESS", toState: "COMPLETED" } });
      return row;
    });
    return res.json({ ok: true, booking: updated });
  } catch (error: any) {
    if (error?.message === "ALREADY_PROCESSED") return res.status(409).json({ ok: false, error: "already_processed_or_invalid_state" });
    console.error("Complete Booking Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const disputeBooking = async (req: Request, res: Response) => {
  try {
    const parsed = disputeSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
    const { bookingId, reason } = parsed.data;
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.clientId !== authUser.id && booking.lawyerId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_access" });
    const state = getT01State(booking);
    if (!["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(state)) return res.status(409).json({ ok: false, error: "invalid_dispute_state" });
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(bookingsTable).set({ status: "disputed", paymentStatus: booking.escrowStatus === "held" ? "disputed" : booking.paymentStatus, updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, booking.status))).returning();
      if (!row) throw new Error("ALREADY_PROCESSED");
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "DISPUTE_RAISED", actorId: authUser.id, metadata: { fromState: state, toState: "DISPUTED", reason, financialFreeze: booking.escrowStatus === "held" } });
      return row;
    });
    return res.json({ ok: true, booking: updated });
  } catch (error: any) {
    if (error?.message === "ALREADY_PROCESSED") return res.status(409).json({ ok: false, error: "already_processed_or_invalid_state" });
    console.error("Dispute Booking Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const parsed = cancellationSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });
    const { bookingId, reason } = parsed.data;
    const authUser = req.authUser!;
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.clientId !== authUser.id && booking.lawyerId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_access" });
    const state = getT01State(booking);
    if (!["PAYMENT_PENDING", "PENDING_ACCEPTANCE", "SCHEDULED"].includes(state)) return res.status(400).json({ ok: false, error: "cannot_cancel_in_current_state" });
    const cancelStatus = booking.clientId === authUser.id ? "cancelled_by_client" : "cancelled_by_lawyer";
    const updated = await db.transaction(async (tx) => {
      const [row] = await tx.update(bookingsTable).set({ status: cancelStatus, updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, booking.status))).returning();
      if (!row) throw new Error("ALREADY_PROCESSED");
      await tx.insert(consultationEventsTable).values({ id: crypto.randomUUID(), bookingId, eventType: "CONSULTATION_CANCELLED", actorId: authUser.id, metadata: { fromState: state, toState: "CANCELLED", reason, financialEffectPendingPolicy: booking.paymentStatus === "paid" } });
      return row;
    });
    return res.json({ ok: true, booking: updated });
  } catch (error: any) {
    if (error?.message === "ALREADY_PROCESSED") return res.status(409).json({ ok: false, error: "already_processed_or_invalid_state" });
    console.error("Cancel Booking Error:", error); return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
