import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  bookingsTable,
  platformDuesTable,
  usersTable,
  officesTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";
import {
  createMeetEvent,
  cancelCalendarEvent,
} from "../services/googleCalendar";

const COMMISSION_RATE = 0.15;
const ABSENCE_WINDOW_MINUTES = 15;

// ── Confirm booking + create Google Meet event ───────────────────────────────

const confirmSchema = z.object({
  bookingId: z.string().min(1),
});

export async function confirmBooking(req: Request, res: Response) {
  const parsed = confirmSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "validation_error",
      issues: parsed.error.issues,
    });
  }

  const { bookingId } = parsed.data;
  const authUser = (req as any).authUser;

  let meetResult: {
    googleMeetLink: string;
    googleEventId: string;
    isSimulated: boolean;
  } | null = null;

  try {
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    if (booking.lawyerId !== authUser.userId) {
      return res
        .status(403)
        .json({ ok: false, error: "forbidden_not_booking_owner" });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        ok: false,
        error: "booking_already_processed_or_invalid_status",
      });
    }

    const grossAmount = Number(booking.price);
    const lawyerId = booking.lawyerId;
    const officeId = booking.officeId;

    const [lawyerUser, clientUser] = await Promise.all([
      lawyerId
        ? db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, lawyerId))
            .limit(1)
        : Promise.resolve([]),
      booking.clientId
        ? db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, booking.clientId))
            .limit(1)
        : Promise.resolve([]),
    ]);

    const lawyerName = lawyerUser[0]?.name ?? lawyerId;
    const clientName = clientUser[0]?.name ?? booking.clientId ?? "Client";

    meetResult = await createMeetEvent({
      bookingId: booking.id,
      lawyerName: lawyerName,
      clientName: clientName,
      subject: booking.subject,
      scheduledDate: booking.scheduledDate,
      scheduledTime: booking.scheduledTime,
      slotDurationMinutes: undefined,
    });

    const commissionAmount =
      Math.round(grossAmount * COMMISSION_RATE * 100) / 100;
    const dueId = `due-${bookingId}`;

    await db.transaction(async (tx) => {
      const updatedRows = await tx
        .update(bookingsTable)
        .set({
          googleMeetLink: meetResult!.googleMeetLink,
          googleEventId: meetResult!.googleEventId,
          status: "accepted",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            eq(bookingsTable.status, "pending"),
          ),
        )
        .returning({ id: bookingsTable.id });

      if (updatedRows.length === 0) {
        throw new Error("CONCURRENT_UPDATE_CONFLICT");
      }

      await tx
        .insert(platformDuesTable)
        .values({
          id: dueId,
          bookingId: bookingId,
          officeId: officeId ?? null,
          lawyerId: lawyerId,
          grossAmount: grossAmount.toFixed(2),
          commissionRate: COMMISSION_RATE.toFixed(4),
          commissionAmount: commissionAmount.toFixed(2),
          status: "pending",
        })
        .onConflictDoNothing();
    });

    req.log.info(
      {
        bookingId: bookingId,
        meetLink: meetResult.googleMeetLink,
        isSimulated: meetResult.isSimulated,
      },
      "booking confirmed successfully with race-condition protection",
    );

    return res.json({
      ok: true,
      googleMeetLink: meetResult.googleMeetLink,
      googleEventId: meetResult.googleEventId,
      isSimulated: meetResult.isSimulated,
      commissionAmount,
    });
  } catch (err: any) {
    req.log.error(err, "confirmBooking failed");

    if (meetResult?.googleEventId) {
      try {
        await cancelCalendarEvent(meetResult.googleEventId);
      } catch (cleanupErr) {
        req.log.error(cleanupErr, "failed to cleanup google calendar event");
      }
    }

    if (err.message === "CONCURRENT_UPDATE_CONFLICT") {
      return res.status(409).json({
        ok: false,
        error: "booking_already_processed_concurrently",
      });
    }

    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── Check Lawyer Absence & Refund Protocol ───────────────────────────────────

export async function checkLawyerAbsence(req: Request, res: Response) {
  try {
    const bookingId = String(req.params.id);
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    if (booking.status !== "accepted" || !booking.clientJoinedAt) {
      return res.json({
        ok: true,
        action: "no_action",
        reason:
          booking.status !== "accepted"
            ? "booking_not_active"
            : "client_has_not_joined",
      });
    }

    if (booking.lawyerJoinedAt) {
      return res.json({
        ok: true,
        action: "no_action",
        reason: "lawyer_already_joined",
      });
    }

    const scheduledStart = new Date(
      `${booking.scheduledDate}T${booking.scheduledTime}`,
    );
    const elapsedMinutes =
      (Date.now() - scheduledStart.getTime()) / (1000 * 60);

    if (elapsedMinutes < ABSENCE_WINDOW_MINUTES) {
      const remainingMinutes = Math.ceil(
        ABSENCE_WINDOW_MINUTES - elapsedMinutes,
      );
      return res.json({
        ok: true,
        action: "no_action",
        reason: "absence_window_not_elapsed",
        remainingMinutes,
      });
    }

    const grossAmount = Number(booking.price);
    const now = new Date();

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

    if (booking.googleEventId) {
      await cancelCalendarEvent(booking.googleEventId);
    }

    await db
      .update(platformDuesTable)
      .set({ status: "waived", updatedAt: now })
      .where(
        and(
          eq(platformDuesTable.bookingId, bookingId),
          eq(platformDuesTable.status, "pending"),
        ),
      );

    if (booking.officeId) {
      await checkOfficeKillSwitch(booking.officeId);
    }

    req.log.warn(
      {
        bookingId,
        lawyerId: booking.lawyerId,
        grossAmount,
        elapsedMinutes: Math.round(elapsedMinutes),
      },
      "lawyer absence confirmed — 100% refund triggered",
    );

    return res.json({
      ok: true,
      action: "refunded_absent",
      bookingId,
      refundAmount: grossAmount,
      message:
        "لم يحضر المحامي خلال 15 دقيقة — تم استرداد 100% إلى محفظة العميل وإلغاء جلسة Google Meet",
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
        totalPending: db.$count(
          platformDuesTable,
          eq(platformDuesTable.status, "pending"),
        ),
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

// ── Other Bookings Controllers ───────────────────────────────────────────────

export async function getBookings(req: Request, res: Response) {
  try {
    const authUser = (req as any).authUser;
    const allBookings = await db.select().from(bookingsTable);
    const filtered = allBookings.filter(
      (b) => b.clientId === authUser.userId || b.lawyerId === authUser.userId,
    );
    return res.json({ ok: true, bookings: filtered });
  } catch (err) {
    req.log.error(err, "getBookings failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function getBookingById(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    return res.json({ ok: true, booking });
  } catch (err) {
    req.log.error(err, "getBookingById failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function createBooking(req: Request, res: Response) {
  try {
    const authUser = (req as any).authUser;
    const body = req.body;
    const id = `booking-${Date.now()}`;
    const serialNumber = `SR-${Math.floor(100000 + Math.random() * 900000)}`;

    const [newBooking] = await db
      .insert(bookingsTable)
      .values({
        id,
        serialNumber,
        clientId: authUser.userId,
        lawyerId: body.lawyerId,
        officeId: body.officeId,
        subject: body.subject,
        description: body.description,
        scheduledDate: body.scheduledDate,
        scheduledTime: body.scheduledTime,
        type: body.type ?? "video",
        price: body.price ?? "0.00",
        status: "pending",
        paymentStatus: "pending",
      })
      .returning();

    return res.json({ ok: true, booking: newBooking });
  } catch (err) {
    req.log.error(err, "createBooking failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function recordJoin(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const authUser = (req as any).authUser;
    const now = new Date();

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    const updates: any = {};
    if (booking.lawyerId === authUser.userId) {
      updates.lawyerJoinedAt = now;
    } else if (booking.clientId === authUser.userId) {
      updates.clientJoinedAt = now;
    } else {
      return res.status(403).json({ ok: false, error: "forbidden" });
    }

    await db.update(bookingsTable).set(updates).where(eq(bookingsTable.id, id));

    return res.json({ ok: true, message: "join recorded" });
  } catch (err) {
    req.log.error(err, "recordJoin failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function checkAttendance(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, id))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    const lawyerAttended = !!booking.lawyerJoinedAt;
    return res.json({ ok: true, lawyerAttended });
  } catch (err) {
    req.log.error(err, "checkAttendance failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function completeBooking(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await db
      .update(bookingsTable)
      .set({ status: "completed", updatedAt: new Date() })
      .where(eq(bookingsTable.id, id));

    return res.json({ ok: true, message: "booking completed" });
  } catch (err) {
    req.log.error(err, "completeBooking failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function disputeBooking(req: Request, res: Response) {
  `use strict`;
  try {
    const id = String(req.params.id);
    await db
      .update(bookingsTable)
      .set({ status: "disputed", updatedAt: new Date() })
      .where(eq(bookingsTable.id, id));

    return res.json({ ok: true, message: "booking disputed" });
  } catch (err) {
    req.log.error(err, "disputeBooking failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function cancelBooking(req: Request, res: Response) {
  try {
    const id = String(req.params.id);
    await db
      .update(bookingsTable)
      .set({ status: "cancelled_by_client", updatedAt: new Date() })
      .where(eq(bookingsTable.id, id));

    return res.json({ ok: true, message: "booking cancelled" });
  } catch (err) {
    req.log.error(err, "cancelBooking failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
