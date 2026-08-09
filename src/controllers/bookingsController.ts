declare global {
  namespace Express {
    interface Request {
      authUser?: {
        id: string;
        role: "client" | "lawyer" | "admin";
      };
    }
  }
}
import { Request, Response } from "express";
import { z } from "zod";
import { eq, and, isNull, inArray } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@workspace/db";
import {
  bookingsTable,
  platformDuesTable,
  usersTable,
  officesTable,
  PLATFORM_COMMISSION_RATE,
} from "@workspace/db/schema";

const createBookingSchema = z.object({
  lawyerId: z.string().min(1, "lawyerId is required"),
  subject: z.string().min(1, "subject is required"),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, "scheduledDate is required"),
  scheduledTime: z.string().min(1, "scheduledTime is required"),
  type: z.enum(["video", "chat", "phone"]),
  officeId: z.string().optional(),
});

const checkAbsenceSchema = z.object({
  bookingId: z.string().min(1, "bookingId is required"),
});

export const createBooking = async (req: Request, res: Response) => {
  try {
    const parseResult = createBookingSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: "invalid_input",
        details: parseResult.error.errors,
      });
    }

    const {
      lawyerId,
      subject,
      description,
      scheduledDate,
      scheduledTime,
      type,
      officeId,
    } = parseResult.data;

    const authUser = req.authUser!;

    if (authUser.id === lawyerId) {
      return res.status(400).json({
        ok: false,
        error: "cannot_book_yourself",
      });
    }

    const scheduledDateTimeStr = `${scheduledDate}T${scheduledTime}`;
    const scheduledDateTime = new Date(scheduledDateTimeStr);

    if (Number.isNaN(scheduledDateTime.getTime())) {
      return res.status(400).json({
        ok: false,
        error: "invalid_scheduled_datetime_format",
      });
    }

    if (scheduledDateTime <= new Date()) {
      return res.status(400).json({
        ok: false,
        error: "booking_must_be_in_future",
      });
    }

    const newBooking = await db.transaction(async (tx) => {
      const [lawyer] = await tx
        .select()
        .from(usersTable)
        .where(
          and(
            eq(usersTable.id, lawyerId),
            eq(usersTable.role, "lawyer"),
            eq(usersTable.accountStatus, "active"),
            isNull(usersTable.deletedAt),
          ),
        )
        .limit(1);

      if (!lawyer) {
        throw new Error("LAWYER_NOT_FOUND");
      }

      if (officeId) {
        const [office] = await tx
          .select()
          .from(officesTable)
          .where(
            and(
              eq(officesTable.id, officeId),
              eq(officesTable.lawyerId, lawyerId),
            ),
          )
          .limit(1);

        if (!office) {
          throw new Error("INVALID_OFFICE");
        }
      }

      const [existingBooking] = await tx
        .select()
        .from(bookingsTable)
        .where(
          and(
            eq(bookingsTable.lawyerId, lawyerId),
            eq(bookingsTable.scheduledDate, scheduledDate),
            eq(bookingsTable.scheduledTime, scheduledTime),
            inArray(bookingsTable.status, ["pending", "accepted"]),
          ),
        )
        .limit(1);

      if (existingBooking) {
        throw new Error("SLOT_ALREADY_BOOKED");
      }

      const price = lawyer.hourlyRate ?? "0";
      const bookingId = crypto.randomUUID();
      const serialNumber = `BK-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;

      const [inserted] = await tx
        .insert(bookingsTable)
        .values({
          id: bookingId,
          serialNumber,
          clientId: authUser.id,
          lawyerId,
          officeId: officeId || null,
          subject,
          description: description || null,
          scheduledDate,
          scheduledTime,
          status: "pending",
          type,
          price,
          paymentStatus: "pending",
        })
        .returning();

      return inserted;
    });

    return res.status(201).json({
      ok: true,
      booking: newBooking,
    });
  } catch (error: any) {
    if (error?.message === "LAWYER_NOT_FOUND") {
      return res.status(404).json({
        ok: false,
        error: "lawyer_not_found_or_inactive",
      });
    }
    if (error?.message === "INVALID_OFFICE") {
      return res.status(400).json({
        ok: false,
        error: "office_does_not_belong_to_lawyer",
      });
    }
    if (error?.message === "SLOT_ALREADY_BOOKED") {
      return res.status(409).json({
        ok: false,
        error: "time_slot_already_booked",
      });
    }

    console.error("Create Booking Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};

export const confirmBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        error: "bookingId_is_required",
      });
    }

    const authUser = req.authUser!;

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        ok: false,
        error: "booking_not_found",
      });
    }

    if (booking.lawyerId !== authUser.id && authUser.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "unauthorized_action",
      });
    }

    if (booking.status !== "pending") {
      return res.status(400).json({
        ok: false,
        error: "invalid_booking_status",
      });
    }

    let googleMeetLink: string | null = null;
    if (booking.type === "video") {
      googleMeetLink = `https://meet.google.com/mst-${booking.serialNumber.toLowerCase()}`;
    }

    const updatedBooking = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(bookingsTable)
        .set({
          status: "accepted",
          googleMeetLink,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            eq(bookingsTable.status, "pending"),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error("ALREADY_PROCESSED");
      }

      const grossAmount = booking.price;
      const commissionRate = PLATFORM_COMMISSION_RATE;

      const commissionAmount = String(
        (Number(grossAmount) * Number(commissionRate)).toFixed(2),
      );

      await tx
        .insert(platformDuesTable)
        .values({
          id: crypto.randomUUID(),
          bookingId,
          officeId: booking.officeId,
          lawyerId: booking.lawyerId,
          grossAmount,
          commissionRate,
          commissionAmount,
          status: "pending",
        })
        .onConflictDoNothing();

      return updated;
    });

    return res.json({
      ok: true,
      booking: updatedBooking,
    });
  } catch (error: any) {
    if (error?.message === "ALREADY_PROCESSED") {
      return res.status(409).json({
        ok: false,
        error: "already_processed_or_invalid_state",
      });
    }

    console.error("Confirm Booking Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};

export const recordJoin = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res
        .status(400)
        .json({ ok: false, error: "bookingId_is_required" });
    }

    const authUser = req.authUser!;
    const now = new Date();

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({ ok: false, error: "booking_not_found" });
    }

    if (authUser.role === "client") {
      const scheduledDateTime = new Date(
        `${booking.scheduledDate}T${booking.scheduledTime}`,
      );
      const diffMinutesFromStart =
        (now.getTime() - scheduledDateTime.getTime()) / 60000;

      if (diffMinutesFromStart < -15) {
        return res.status(400).json({
          ok: false,
          error: "cannot_join_too_early_before_scheduled_time",
        });
      }
    }

    const result = await db
      .update(bookingsTable)
      .set({
        updatedAt: now,
        ...(authUser.role === "lawyer"
          ? { lawyerJoinedAt: now }
          : { clientJoinedAt: now }),
      })
      .where(
        and(
          eq(bookingsTable.id, bookingId),
          eq(bookingsTable.status, "accepted"),
          authUser.role === "lawyer"
            ? isNull(bookingsTable.lawyerJoinedAt)
            : isNull(bookingsTable.clientJoinedAt),
          authUser.role === "lawyer"
            ? eq(bookingsTable.lawyerId, authUser.id)
            : eq(bookingsTable.clientId, authUser.id),
        ),
      )
      .returning();

    if (result.length === 0) {
      return res.status(400).json({
        ok: false,
        error: "cannot_record_join_invalid_state_or_already_recorded",
      });
    }

    return res.json({
      ok: true,
      booking: result[0],
    });
  } catch (error) {
    console.error("Record Join Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};

export const checkLawyerAbsence = async (req: Request, res: Response) => {
  try {
    const parseResult = checkAbsenceSchema.safeParse(req.body);

    if (!parseResult.success) {
      return res.status(400).json({
        ok: false,
        error: "invalid_input",
        details: parseResult.error.errors,
      });
    }

    const { bookingId } = parseResult.data;
    const authUser = req.authUser!;

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        ok: false,
        error: "booking_not_found",
      });
    }

    if (booking.clientId !== authUser.id && authUser.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "unauthorized_action",
      });
    }

    if (!booking.clientJoinedAt) {
      return res.status(400).json({
        ok: false,
        error: "client_did_not_join",
      });
    }

    const scheduledDateTimeStr = `${booking.scheduledDate}T${booking.scheduledTime}`;
    const scheduledStartTime = new Date(scheduledDateTimeStr);

    if (Number.isNaN(scheduledStartTime.getTime())) {
      return res.status(400).json({
        ok: false,
        error: "invalid_scheduled_datetime",
      });
    }

    const clientJoinTime = new Date(booking.clientJoinedAt);
    const joinDiffFromStart =
      (clientJoinTime.getTime() - scheduledStartTime.getTime()) / 60000;

    if (joinDiffFromStart < -30) {
      return res.status(400).json({
        ok: false,
        error: "invalid_client_join_timestamp_suspicious",
      });
    }

    const now = new Date();
    const diffMinutes = (now.getTime() - scheduledStartTime.getTime()) / 60000;

    if (diffMinutes < 15) {
      return res.status(400).json({
        ok: false,
        error: "wait_15_minutes_from_scheduled_start_before_claiming_absence",
      });
    }

    const updatedBooking = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(bookingsTable)
        .set({
          status: "refunded_absent",
          paymentStatus: "refunded",
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            eq(bookingsTable.status, "accepted"),
            isNull(bookingsTable.lawyerJoinedAt),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error("ALREADY_PROCESSED");
      }

      await tx
        .update(platformDuesTable)
        .set({
          status: "waived",
          updatedAt: new Date(),
        })
        .where(eq(platformDuesTable.bookingId, bookingId));

      return updated;
    });

    return res.json({
      ok: true,
      message: "lawyer_absent_refund_processed_successfully",
      booking: updatedBooking,
    });
  } catch (error: any) {
    if (error?.message === "ALREADY_PROCESSED") {
      return res.status(409).json({
        ok: false,
        error: "already_processed_or_invalid_state",
      });
    }

    console.error("Check Lawyer Absence Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};

export const getBookingById = async (req: Request, res: Response) => {
  try {
    const rawBookingId = req.params.id;

    const bookingId = Array.isArray(rawBookingId)
      ? rawBookingId[0]
      : rawBookingId;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        error: "booking_id_is_required",
      });
    }

    const authUser = req.authUser!;

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        ok: false,
        error: "booking_not_found",
      });
    }

    if (
      booking.clientId !== authUser.id &&
      booking.lawyerId !== authUser.id &&
      authUser.role !== "admin"
    ) {
      return res.status(403).json({
        ok: false,
        error: "unauthorized_access",
      });
    }

    return res.json({
      ok: true,
      booking,
    });
  } catch (error) {
    console.error("Get Booking By ID Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};

export const completeBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        error: "bookingId_is_required",
      });
    }

    const authUser = req.authUser!;

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        ok: false,
        error: "booking_not_found",
      });
    }

    if (booking.lawyerId !== authUser.id && authUser.role !== "admin") {
      return res.status(403).json({
        ok: false,
        error: "unauthorized_action",
      });
    }

    const [updated] = await db
      .update(bookingsTable)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookingsTable.id, bookingId),
          eq(bookingsTable.status, "accepted"),
        ),
      )
      .returning();

    if (!updated) {
      return res.status(400).json({
        ok: false,
        error: "invalid_state_transition_or_already_completed",
      });
    }

    return res.json({
      ok: true,
      booking: updated,
    });
  } catch (error) {
    console.error("Complete Booking Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};

export const disputeBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        error: "bookingId_is_required",
      });
    }

    const authUser = req.authUser!;

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        ok: false,
        error: "booking_not_found",
      });
    }

    if (
      booking.clientId !== authUser.id &&
      booking.lawyerId !== authUser.id &&
      authUser.role !== "admin"
    ) {
      return res.status(403).json({
        ok: false,
        error: "unauthorized_action",
      });
    }

    const [updated] = await db
      .update(bookingsTable)
      .set({
        status: "disputed",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(bookingsTable.id, bookingId),
          inArray(bookingsTable.status, ["accepted", "completed"]),
        ),
      )
      .returning();

    if (!updated) {
      return res.status(400).json({
        ok: false,
        error: "cannot_dispute_booking_in_current_status",
      });
    }

    return res.json({
      ok: true,
      booking: updated,
    });
  } catch (error) {
    console.error("Dispute Booking Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        ok: false,
        error: "bookingId_is_required",
      });
    }

    const authUser = req.authUser!;

    const [booking] = await db
      .select()
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);

    if (!booking) {
      return res.status(404).json({
        ok: false,
        error: "booking_not_found",
      });
    }

    if (
      booking.clientId !== authUser.id &&
      booking.lawyerId !== authUser.id &&
      authUser.role !== "admin"
    ) {
      return res.status(403).json({
        ok: false,
        error: "unauthorized_action",
      });
    }

    const cancelStatus =
      booking.clientId === authUser.id
        ? "cancelled_by_client"
        : "cancelled_by_lawyer";

    const updatedBooking = await db.transaction(async (tx) => {
      const [updated] = await tx
        .update(bookingsTable)
        .set({
          status: cancelStatus,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(bookingsTable.id, bookingId),
            inArray(bookingsTable.status, ["pending", "accepted"]),
          ),
        )
        .returning();

      if (!updated) {
        throw new Error("CANNOT_CANCEL");
      }

      await tx
        .update(platformDuesTable)
        .set({
          status: "waived",
          updatedAt: new Date(),
        })
        .where(eq(platformDuesTable.bookingId, bookingId));

      return updated;
    });

    return res.json({
      ok: true,
      booking: updatedBooking,
    });
  } catch (error: any) {
    if (error?.message === "CANNOT_CANCEL") {
      return res.status(400).json({
        ok: false,
        error: "cannot_cancel_booking_in_current_status",
      });
    }

    console.error("Cancel Booking Error:", error);

    return res.status(500).json({
      ok: false,
      error: "internal_server_error",
    });
  }
};
