import { Request, Response } from "express";
import { and, asc, eq, inArray } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod";
import { db } from "@workspace/db";
import { adminAuditLogsTable, bookingsTable, consultationEventsTable, usersTable } from "@workspace/db/schema";

const terminalStatuses = [
  "completed",
  "rejected",
  "cancelled_by_lawyer",
  "cancelled_by_client",
  "no_show_lawyer",
  "no_show_client",
  "refunded_absent",
] as const;

const archiveSchema = z.object({
  reason: z.string().trim().max(500).optional(),
});

function canAccessBooking(req: Request, booking: { clientId: string | null; lawyerId: string | null }) {
  const user = req.authUser!;
  return user.role === "admin" || booking.clientId === user.id || booking.lawyerId === user.id;
}

function canManageArchive(req: Request) {
  return req.authUser?.role === "admin" || req.authUser?.role === "lawyer";
}

export async function listConsultationArchive(req: Request, res: Response) {
  const user = req.authUser!;
  const rows = await db
    .select({
      id: bookingsTable.id,
      serialNumber: bookingsTable.serialNumber,
      clientId: bookingsTable.clientId,
      lawyerId: bookingsTable.lawyerId,
      subject: bookingsTable.subject,
      scheduledDate: bookingsTable.scheduledDate,
      scheduledTime: bookingsTable.scheduledTime,
      status: bookingsTable.status,
      price: bookingsTable.price,
      paymentStatus: bookingsTable.paymentStatus,
      escrowStatus: bookingsTable.escrowStatus,
      archivedAt: bookingsTable.archivedAt,
    })
    .from(bookingsTable)
    .where(
      and(
        eq(bookingsTable.archivedAt, bookingsTable.archivedAt),
        user.role === "admin"
          ? inArray(bookingsTable.status, [...terminalStatuses])
          : and(
              inArray(bookingsTable.status, [...terminalStatuses]),
              user.role === "lawyer" ? eq(bookingsTable.lawyerId, user.id) : eq(bookingsTable.clientId, user.id),
            ),
      ),
    )
    .orderBy(asc(bookingsTable.scheduledDate), asc(bookingsTable.scheduledTime));

  return res.json({ ok: true, archive: rows });
}

export async function archiveConsultation(req: Request, res: Response) {
  if (!canManageArchive(req)) return res.status(403).json({ ok: false, error: "archive_operator_required" });
  const bookingId = String(req.params.id ?? "");
  const parsed = archiveSchema.safeParse(req.body ?? {});
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_archive_request" });

  const result = await db.transaction(async (tx) => {
    const [booking] = await tx.select().from(bookingsTable).where(eq(bookingsTable.id, bookingId)).limit(1);
    if (!booking) return { kind: "not_found" as const };
    if (!canAccessBooking(req, booking)) return { kind: "forbidden" as const };
    if (!terminalStatuses.includes(booking.status as (typeof terminalStatuses)[number])) return { kind: "not_terminal" as const };
    if (booking.archivedAt) return { kind: "already_archived" as const, booking };

    const archivedAt = new Date();
    const [updated] = await tx
      .update(bookingsTable)
      .set({ archivedAt, archivedBy: req.authUser!.id, updatedAt: archivedAt })
      .where(eq(bookingsTable.id, bookingId))
      .returning();

    if (req.authUser!.role === "admin") {
      await tx.insert(adminAuditLogsTable).values({
        id: randomUUID(),
        adminId: req.authUser!.id,
        action: "consultation.archived",
        entityType: "booking",
        entityId: bookingId,
        description: parsed.data.reason ?? "Consultation archived",
        beforeData: { archivedAt: null, status: booking.status },
        afterData: { archivedAt, status: updated?.status },
      });
    }

    return { kind: "ok" as const, booking: updated };
  });

  if (result.kind === "not_found") return res.status(404).json({ ok: false, error: "consultation_not_found" });
  if (result.kind === "forbidden") return res.status(403).json({ ok: false, error: "forbidden" });
  if (result.kind === "not_terminal") return res.status(409).json({ ok: false, error: "consultation_not_terminal" });
  if (result.kind === "already_archived") return res.json({ ok: true, booking: result.booking, alreadyArchived: true });
  return res.json({ ok: true, booking: result.booking });
}

export async function getConsultationPrintData(req: Request, res: Response) {
  const bookingId = String(req.params.id ?? "");
  const [row] = await db
    .select({
      booking: bookingsTable,
      client: usersTable,
    })
    .from(bookingsTable)
    .leftJoin(usersTable, eq(bookingsTable.clientId, usersTable.id))
    .where(eq(bookingsTable.id, bookingId))
    .limit(1);

  if (!row) return res.status(404).json({ ok: false, error: "consultation_not_found" });
  if (!canAccessBooking(req, row.booking)) return res.status(403).json({ ok: false, error: "forbidden" });

  const events = await db
    .select({
      id: consultationEventsTable.id,
      eventType: consultationEventsTable.eventType,
      metadata: consultationEventsTable.metadata,
      createdAt: consultationEventsTable.createdAt,
    })
    .from(consultationEventsTable)
    .where(eq(consultationEventsTable.bookingId, bookingId))
    .orderBy(asc(consultationEventsTable.createdAt));

  const safeClient = row.client
    ? { id: row.client.id, name: row.client.name, email: row.client.email, phone: row.client.phone }
    : null;

  return res.json({
    ok: true,
    document: {
      serialNumber: row.booking.serialNumber,
      booking: {
        id: row.booking.id,
        subject: row.booking.subject,
        description: row.booking.description,
        scheduledDate: row.booking.scheduledDate,
        scheduledTime: row.booking.scheduledTime,
        status: row.booking.status,
        type: row.booking.type,
        price: row.booking.price,
        paymentStatus: row.booking.paymentStatus,
        escrowStatus: row.booking.escrowStatus,
        attachments: row.booking.attachments ?? [],
        archivedAt: row.booking.archivedAt,
      },
      client: safeClient,
      events,
      generatedAt: new Date().toISOString(),
    },
  });
}
