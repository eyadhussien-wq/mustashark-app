import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import { bookingsTable, platformDuesTable, officesTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import { createMeetEvent, cancelCalendarEvent } from "../services/googleCalendar";

const COMMISSION_RATE = 0.15;
const ABSENCE_WINDOW_MINUTES = 15;

// ── Confirm booking + create Google Meet event ───────────────────────────────

const confirmSchema = z.object({
  bookingId: z.string(),
  lawyerName: z.string(),
  clientName: z.string(),
  subject: z.string(),
  scheduledDate: z.string(),
  scheduledTime: z.string(),
  slotDurationMinutes: z.number().int().positive().optional(),
  lawyerId: z.string(),
  officeId: z.string().optional(),
  grossAmount: z.number().positive(),
});

export async function confirmBooking(req: Request, res: Response) {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const data = parsed.data;

  try {
    // 1. Generate Google Meet link
    const meetResult = await createMeetEvent({
      bookingId: data.bookingId,
      lawyerName: data.lawyerName,
      clientName: data.clientName,
      subject: data.subject,
      scheduledDate: data.scheduledDate,
      scheduledTime: data.scheduledTime,
      slotDurationMinutes: data.slotDurationMinutes,
    });

    // 2. Persist meet link + event ID into booking record
    await db
      .update(bookingsTable)
      .set({
        googleMeetLink: meetResult.googleMeetLink,
        googleEventId: meetResult.googleEventId,
        status: "accepted",
        updatedAt: new Date(),
      })
      .where(eq(bookingsTable.id, data.bookingId));

    // 3. Create platform due record (15% commission)
    const commissionAmount = Math.round(data.grossAmount * COMMISSION_RATE * 100) / 100;
    const dueId = `due-${data.bookingId}`;

    await db
      .insert(platformDuesTable)
      .values({
        id: dueId,
        bookingId: data.bookingId,
        officeId: data.officeId ?? null,
        lawyerId: data.lawyerId,
        grossAmount: data.grossAmount.toFixed(2),
        commissionRate: COMMISSION_RATE.toFixed(4),
        commissionAmount: commissionAmount.toFixed(2),
        status: "pending",
      })
      .onConflictDoNothing();

    req.log.info(
      { bookingId: data.bookingId, meetLink: meetResult.googleMeetLink, isSimulated: meetResult.isSimulated },
      "booking confirmed with Meet link",
    );

    return res.json({
      ok: true,
      googleMeetLink: meetResult.googleMeetLink,
      googleEventId: meetResult.googleEventId,
      isSimulated: meetResult.isSimulated,
      commissionAmount,
    });
  } catch (err) {
    req.log.error(err, "confirmBooking failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── Record attendance (join time) ────────────────────────────────────────────

const joinSchema = z.object({
  bookingId: z.string(),
  role: z.enum(["client", "lawyer"]),
});

export async function recordJoin(req: Request, res: Response) {
  const parsed = joinSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { bookingId, role } = parsed.data;
  const now = new Date();

  try {
    const updatePayload =
      role === "client"
        ? { clientJoinedAt: now, updatedAt: now }
        : { lawyerJoinedAt: now, actualStartTime: now, updatedAt: now };

    await db
      .update(bookingsTable)
      .set(updatePayload)
      .where(eq(bookingsTable.id, bookingId));

    req.log.info({ bookingId, role, at: now.toISOString() }, "attendance recorded");
    return res.json({ ok: true, recordedAt: now.toISOString() });
  } catch (err) {
    req.log.error(err, "recordJoin failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── Check & apply 15-minute lawyer-absence rule ───────────────────────────────

const absenceSchema = z.object({
  bookingId: z.string(),
  adminNotifyWebhook: z.string().url().optional(),
});

export async function checkLawyerAbsence(req: Request, res: Response) {
  const parsed = absenceSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { bookingId } = parsed.data;

  try {
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    // Must be accepted and client must have joined
    if (booking.status !== "accepted" || !booking.clientJoinedAt) {
      return res.json({
        ok: true,
        action: "no_action",
        reason: booking.status !== "accepted"
          ? "booking_not_active"
          : "client_has_not_joined",
      });
    }

    // Lawyer already joined — no absence
    if (booking.lawyerJoinedAt) {
      return res.json({ ok: true, action: "no_action", reason: "lawyer_already_joined" });
    }

    // Check if 15 minutes have elapsed since scheduled start
    const scheduledStart = new Date(`${booking.scheduledDate}T${booking.scheduledTime}`);
    const elapsedMinutes = (Date.now() - scheduledStart.getTime()) / (1000 * 60);

    if (elapsedMinutes < ABSENCE_WINDOW_MINUTES) {
      const remainingMinutes = Math.ceil(ABSENCE_WINDOW_MINUTES - elapsedMinutes);
      return res.json({
        ok: true,
        action: "no_action",
        reason: "absence_window_not_elapsed",
        remainingMinutes,
      });
    }

    // ── Trigger absence refund protocol ──
    const grossAmount = Number(booking.price);
    const now = new Date();

    // 1. Update booking to refunded_absent, clear meet link
    await db
      .update(bookingsTable)
      .set({
        status: "refunded_absent",
        paymentStatus: "refunded",
        googleMeetLink: null,
        actualEndTime: now,
        updatedAt: now,
      })
      .where(eq(bookingsTable.id, bookingId));

    // 2. Cancel the Google Calendar event (removes the link)
    if (booking.googleEventId) {
      await cancelCalendarEvent(booking.googleEventId);
    }

    // 3. Mark platform due as waived (lawyer didn't show — no commission owed)
    await db
      .update(platformDuesTable)
      .set({ status: "waived", updatedAt: now })
      .where(
        and(
          eq(platformDuesTable.bookingId, bookingId),
          eq(platformDuesTable.status, "pending"),
        ),
      );

    // 4. Check/apply kill switch on the office
    if (booking.officeId) {
      await checkOfficeKillSwitch(booking.officeId);
    }

    req.log.warn(
      { bookingId, lawyerId: booking.lawyerId, grossAmount, elapsedMinutes: Math.round(elapsedMinutes) },
      "lawyer absence confirmed — 100% refund triggered",
    );

    return res.json({
      ok: true,
      action: "refunded_absent",
      bookingId,
      refundAmount: grossAmount,
      message: "لم يحضر المحامي خلال 15 دقيقة — تم استرداد 100% إلى محفظة العميل وإلغاء جلسة Google Meet",
    });
  } catch (err) {
    req.log.error(err, "checkLawyerAbsence failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── Internal: kill switch check for an office after absence ──────────────────

async function checkOfficeKillSwitch(officeId: string) {
  try {
    const [office] = await db
      .select()
      .from(officesTable)
      .where(eq(officesTable.id, officeId))
      .limit(1);
    if (!office || office.isSuspended) return;

    const threshold = Number(office.debtThreshold);
    const [summary] = await db
      .select({
        totalPending: db.$count(platformDuesTable, eq(platformDuesTable.status, "pending")),
      })
      .from(platformDuesTable)
      .where(
        and(
          eq(platformDuesTable.officeId, officeId),
          eq(platformDuesTable.status, "pending"),
        ),
      );

    const totalPending = Number(summary?.totalPending ?? 0);
    if (totalPending > threshold) {
      await db
        .update(officesTable)
        .set({
          isSuspended: true,
          suspensionReason: `تجاوز حد الديون المعلقة (${totalPending} > ${threshold}) — تفعيل تلقائي`,
          updatedAt: new Date(),
        })
        .where(eq(officesTable.id, officeId));
    }
  } catch {
    // Non-critical — don't propagate
  }
}
