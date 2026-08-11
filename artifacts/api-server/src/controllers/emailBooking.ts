import { Request, Response } from "express";
import { z } from "zod";
import { and, eq, isNull } from "drizzle-orm";
import crypto from "crypto";
import { db } from "@workspace/db";
import { bookingsTable, usersTable } from "@workspace/db/schema";

const createEmailBookingSchema = z.object({
  lawyerId: z.string().min(1, "lawyerId is required"),
  subject: z.string().min(1, "subject is required"),
  description: z.string().optional(),
  scheduledDate: z.string().min(1, "scheduledDate is required"),
  scheduledTime: z.string().min(1, "scheduledTime is required"),
  officeId: z.string().optional(),
  attachments: z.array(z.object({ name: z.string(), uri: z.string() })).optional(),
});

export const createEmailBooking = async (req: Request, res: Response) => {
  try {
    const parsed = createEmailBookingSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_input", details: parsed.error.errors });

    const authUser = req.authUser!;
    const { lawyerId, subject, description, scheduledDate, scheduledTime, officeId, attachments } = parsed.data;

    const [lawyer] = await db.select().from(usersTable).where(and(
      eq(usersTable.id, lawyerId),
      eq(usersTable.role, "lawyer"),
      eq(usersTable.accountStatus, "active"),
      isNull(usersTable.deletedAt),
    )).limit(1);

    if (!lawyer) return res.status(404).json({ ok: false, error: "lawyer_not_found_or_inactive" });

    const bookingId = crypto.randomUUID();
    const serialNumber = `BK-${Date.now()}-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const responseDeadline = new Date(Date.now() + 48 * 60 * 60 * 1000);

    const [booking] = await db.insert(bookingsTable).values({
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
      type: "email",
      price: lawyer.hourlyRate ?? "0",
      paymentStatus: "pending",
      emailResponseDeadlineAt: responseDeadline,
      attachments: attachments ?? [],
    }).returning();

    return res.status(201).json({ ok: true, booking, responseDeadline });
  } catch (error) {
    console.error("Create Email Booking Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
};
