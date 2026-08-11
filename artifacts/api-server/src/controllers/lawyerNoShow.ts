import { Request, Response } from "express";
import { and, eq, gte, isNull, ne, sql } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  bookingsTable,
  bookingTransferRequestsTable,
  clientWalletsTable,
  lawyerCommitmentScoresTable,
  notificationsTable,
  platformDuesTable,
  usersTable,
} from "@workspace/db/schema";

const LIVE_NO_SHOW_MINUTES = 15;
const EMAIL_DEADLINE_HOURS = 48;
const COMMITMENT_PENALTY = 10;

type BookingType = "video" | "phone" | "chat" | "email";

function pricingBracket(hourlyRate: string | number | null | undefined) {
  const rate = Number(hourlyRate ?? 0);
  if (rate < 200) return "low";
  if (rate < 350) return "mid";
  return "high";
}

function scheduledAt(booking: { scheduledDate: string; scheduledTime: string }) {
  const date = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isExpiredNoShow(booking: {
  type: BookingType;
  scheduledDate: string;
  scheduledTime: string;
  createdAt: Date;
}, now = new Date()) {
  const start = scheduledAt(booking);
  if (!start) return false;
  if (booking.type === "email") {
    return now.getTime() >= booking.createdAt.getTime() + EMAIL_DEADLINE_HOURS * 60 * 60 * 1000;
  }
  return now.getTime() >= start.getTime() + LIVE_NO_SHOW_MINUTES * 60 * 1000;
}

async function markBookingAsNoShow(bookingId: string) {
  const now = new Date();
  return db.transaction(async (tx) => {
    const [booking] = await tx
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking || booking.status !== "accepted" || booking.lawyerJoinedAt) return null;
    if (!isExpiredNoShow(booking as never, now)) return null;

    const [updated] = await tx
      .update(bookingsTable)
      .set({
        status: "no_show_lawyer",
        escrowStatus: "held",
        noShowDetectedAt: now,
        noShowReason: booking.type === "email" ? "email_response_deadline_48h" : "live_join_timeout_15m",
        updatedAt: now,
      })
      .where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "accepted"), isNull(bookingsTable.lawyerJoinedAt)))
      .returning();

    if (!updated) return null;

    if (booking.lawyerId) {
      await tx
        .insert(lawyerCommitmentScoresTable)
        .values({ lawyerId: booking.lawyerId, score: String(100 - COMMITMENT_PENALTY), noShowCount: 1, lastNoShowAt: now })
        .onConflictDoUpdate({
          target: lawyerCommitmentScoresTable.lawyerId,
          set: {
            score: sql`GREATEST(0, ${lawyerCommitmentScoresTable.score} - ${COMMITMENT_PENALTY})`,
            noShowCount: sql`${lawyerCommitmentScoresTable.noShowCount} + 1`,
            lastNoShowAt: now,
            updatedAt: now,
          },
        });

      await tx.insert(notificationsTable).values({
        id: crypto.randomUUID(),
        userId: booking.lawyerId,
        bookingId: booking.id,
        title: "تنبيه على الالتزام",
        body: "تم تسجيل عدم حضور/تأخر في الاستشارة، وتم احتساب ذلك ضمن درجة الالتزام.",
        kind: "lawyer_no_show_warning",
        urgent: true,
      });
    }

    if (booking.clientId) {
      await tx.insert(notificationsTable).values({
        id: crypto.randomUUID(),
        userId: booking.clientId,
        bookingId: booking.id,
        title: "لديك خيارات لمعالجة الاستشارة",
        body: "لم ينضم المحامي ضمن المهلة المحددة. يمكنك طلب استرداد كامل أو نقل الاستشارة مجاناً إلى محامٍ بديل.",
        kind: "lawyer_no_show_action",
        urgent: true,
      });

      await tx.insert(bookingTransferRequestsTable).values({
        id: crypto.randomUUID(),
        originalBookingId: booking.id,
        clientId: booking.clientId,
        originalLawyerId: booking.lawyerId,
        status: "offered",
        reason: "lawyer_no_show",
      });
    }

    return updated;
  });
}

export async function detectLawyerNoShows() {
  const candidates = await db
    .select({ id: bookingsTable.id })
    .from(bookingsTable)
    .where(eq(bookingsTable.status, "accepted"));

  let detected = 0;
  for (const candidate of candidates) {
    if (await markBookingAsNoShow(candidate.id)) detected += 1;
  }
  return detected;
}

export const claimLawyerNoShow = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const bookingId = String(req.params.id ?? "");
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.clientId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_action" });

    const updated = await markBookingAsNoShow(bookingId);
    if (!updated) return res.status(400).json({ ok: false, error: "no_show_conditions_not_met_or_already_processed" });

    return res.json({ ok: true, booking: updated, options: ["refund", "smart_transfer"] });
  } catch (error) {
    console.error("Claim Lawyer No-Show Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const refundLawyerNoShow = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const bookingId = String(req.params.id ?? "");
    const result = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.clientId !== authUser.id) throw new Error("FORBIDDEN");
      if (booking.status !== "no_show_lawyer") throw new Error("INVALID_STATE");

      const [updated] = await tx.update(bookingsTable).set({ status: "refunded_absent", paymentStatus: "refunded", escrowStatus: "refunded", updatedAt: new Date() }).where(and(eq(bookingsTable.id, bookingId), eq(bookingsTable.status, "no_show_lawyer"))).returning();
      if (!updated) throw new Error("INVALID_STATE");

      await tx.update(platformDuesTable).set({ status: "waived", updatedAt: new Date() }).where(eq(platformDuesTable.bookingId, bookingId));

      const amount = Number(booking.price);
      await tx.insert(clientWalletsTable).values({ clientId: booking.clientId!, availableCredits: String(amount), totalRefunded: String(amount) }).onConflictDoUpdate({
        target: clientWalletsTable.clientId,
        set: {
          availableCredits: sql`${clientWalletsTable.availableCredits} + ${amount}`,
          totalRefunded: sql`${clientWalletsTable.totalRefunded} + ${amount}`,
          updatedAt: new Date(),
        },
      });
      await tx.insert(notificationsTable).values({ id: crypto.randomUUID(), userId: booking.clientId!, bookingId, title: "تم استرداد المبلغ", body: `تمت إضافة ${amount.toFixed(2)} إلى رصيدك المتاح في المحفظة.`, kind: "no_show_refund", urgent: false });
      return updated;
    });
    return res.json({ ok: true, booking: result, refunded: true });
  } catch (error: any) {
    if (error?.message === "NOT_FOUND") return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (error?.message === "FORBIDDEN") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (error?.message === "INVALID_STATE") return res.status(400).json({ ok: false, error: "refund_not_available" });
    console.error("Refund Lawyer No-Show Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const getSmartTransferOptions = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const bookingId = String(req.params.id ?? "");
    const [booking] = await db.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return res.status(404).json({ ok: false, error: "booking_not_found" });
    if (booking.clientId !== authUser.id && authUser.role !== "admin") return res.status(403).json({ ok: false, error: "unauthorized_action" });
    if (booking.status !== "no_show_lawyer") return res.status(400).json({ ok: false, error: "smart_transfer_not_available" });
    if (!booking.lawyerId) return res.status(400).json({ ok: false, error: "original_lawyer_unavailable" });

    const [original] = await db.select().from(usersTable).where(eq(usersTable.id, booking.lawyerId)).limit(1);
    if (!original) return res.status(404).json({ ok: false, error: "original_lawyer_not_found" });

    const bracket = pricingBracket(original.hourlyRate);
    const candidates = await db.select().from(usersTable).where(and(
      eq(usersTable.role, "lawyer"),
      eq(usersTable.accountStatus, "active"),
      isNull(usersTable.deletedAt),
      original.specialization === null
        ? isNull(usersTable.specialization)
        : eq(usersTable.specialization, original.specialization),
      eq(usersTable.litigationTier, original.litigationTier),
      ne(usersTable.id, original.id),
    )).limit(20);

    const available = candidates.filter((candidate) => pricingBracket(candidate.hourlyRate) === bracket).slice(0, 3);
    return res.json({ ok: true, pricingBracket: bracket, lawyers: available.map((lawyer) => ({ id: lawyer.id, name: lawyer.name, specialization: lawyer.specialization, litigationTier: lawyer.litigationTier, hourlyRate: lawyer.hourlyRate, rating: lawyer.rating, reviewsCount: lawyer.reviewsCount })) });
  } catch (error) {
    console.error("Smart Transfer Options Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const transferLawyerNoShowBooking = async (req: Request, res: Response) => {
  try {
    const authUser = req.authUser!;
    const bookingId = String(req.params.id ?? "");
    const newLawyerId = String(req.body?.newLawyerId ?? "");
    if (!newLawyerId) return res.status(400).json({ ok: false, error: "newLawyerId_is_required" });

    const result = await db.transaction(async (tx) => {
      const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
      if (!booking) throw new Error("NOT_FOUND");
      if (booking.clientId !== authUser.id) throw new Error("FORBIDDEN");
      if (booking.status !== "no_show_lawyer") throw new Error("INVALID_STATE");
      if (!booking.lawyerId) throw new Error("NO_ORIGINAL_LAWYER");

      const [originalLawyer] = await tx.select().from(usersTable).where(eq(usersTable.id, booking.lawyerId)).limit(1);
      const [newLawyer] = await tx.select().from(usersTable).where(and(eq(usersTable.id, newLawyerId), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"), isNull(usersTable.deletedAt))).limit(1);
      if (!originalLawyer || !newLawyer) throw new Error("LAWYER_NOT_FOUND");
      if (newLawyer.specialization !== originalLawyer.specialization || newLawyer.litigationTier !== originalLawyer.litigationTier || pricingBracket(newLawyer.hourlyRate) !== pricingBracket(originalLawyer.hourlyRate)) throw new Error("LAWYER_NOT_MATCHING");

      const [newBooking] = await tx.insert(bookingsTable).values({
        id: crypto.randomUUID(),
        serialNumber: `TR-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`,
        clientId: booking.clientId,
        lawyerId: newLawyer.id,
        officeId: booking.officeId,
        subject: booking.subject,
        description: booking.description,
        scheduledDate: booking.scheduledDate,
        scheduledTime: booking.scheduledTime,
        status: "pending",
        type: booking.type,
        price: booking.price,
        paymentStatus: "paid",
        escrowStatus: "held",
        transferredFromBookingId: booking.id,
        attachments: booking.attachments ?? [],
        emailResponseDeadlineAt: booking.type === "email" ? new Date(Date.now() + EMAIL_DEADLINE_HOURS * 60 * 60 * 1000) : null,
      }).returning();

      await tx.update(bookingsTable).set({ updatedAt: new Date() }).where(eq(bookingsTable.id, booking.id));
      await tx.update(platformDuesTable).set({ status: "waived", updatedAt: new Date() }).where(eq(platformDuesTable.bookingId, booking.id));
      await tx.insert(platformDuesTable).values({ id: crypto.randomUUID(), bookingId: newBooking.id, officeId: newBooking.officeId, lawyerId: newLawyer.id, grossAmount: booking.price, commissionRate: "0.15", commissionAmount: (Number(booking.price) * 0.15).toFixed(2), status: "pending" }).onConflictDoNothing();

      await tx.insert(bookingTransferRequestsTable).values({ id: crypto.randomUUID(), originalBookingId: booking.id, newBookingId: newBooking.id, clientId: booking.clientId!, originalLawyerId: booking.lawyerId, newLawyerId: newLawyer.id, status: "accepted", reason: "lawyer_no_show", selectedAt: new Date() });
      await tx.insert(notificationsTable).values({ id: crypto.randomUUID(), userId: newLawyer.id, bookingId: newBooking.id, title: "لديك استشارة محولة عاجلة جاهزة للمراجعة", body: "تم تحويل استشارة إليك مجاناً بسبب عدم حضور المحامي الأصلي. راجع الموضوع والمرفقات واتخذ الإجراء المناسب.", kind: "urgent_transfer", urgent: true });
      return newBooking;
    });

    return res.status(201).json({ ok: true, transferred: true, booking: result, extraCharge: 0 });
  } catch (error: any) {
    const map: Record<string, [number, string]> = {
      NOT_FOUND: [404, "booking_not_found"],
      FORBIDDEN: [403, "unauthorized_action"],
      INVALID_STATE: [400, "smart_transfer_not_available"],
      NO_ORIGINAL_LAWYER: [400, "original_lawyer_unavailable"],
      LAWYER_NOT_FOUND: [404, "lawyer_not_found"],
      LAWYER_NOT_MATCHING: [400, "lawyer_does_not_match_transfer_rules"],
    };
    if (map[error?.message]) return res.status(map[error.message][0]).json({ ok: false, error: map[error.message][1] });
    console.error("Transfer Lawyer No-Show Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
