import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  lawyerDeletionRequestsTable,
  bookingsTable,
  platformDuesTable,
  officesTable,
} from "@workspace/db";
import { eq, and, inArray, sum } from "drizzle-orm";
import { z } from "zod/v4";

// Booking statuses that are NOT terminal — lawyer still has active obligations
const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "accepted",
  "disputed",
] as const;

// ── GET /api/admin/deletion-requests ─────────────────────────────────────────

export async function listDeletionRequests(req: Request, res: Response) {
  try {
    const requests = await db
      .select({
        id: lawyerDeletionRequestsTable.id,
        lawyerId: lawyerDeletionRequestsTable.lawyerId,
        lawyerName: usersTable.name,
        lawyerEmail: usersTable.email,
        status: lawyerDeletionRequestsTable.status,
        requestedAt: lawyerDeletionRequestsTable.requestedAt,
        rejectionNote: lawyerDeletionRequestsTable.rejectionNote,
      })
      .from(lawyerDeletionRequestsTable)
      .innerJoin(
        usersTable,
        eq(lawyerDeletionRequestsTable.lawyerId, usersTable.id),
      )
      .where(eq(lawyerDeletionRequestsTable.status, "pending"))
      .orderBy(lawyerDeletionRequestsTable.requestedAt);

    return res.json({ ok: true, requests, count: requests.length });
  } catch (err) {
    req.log.error(err, "listDeletionRequests failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── GET /api/admin/deletion-requests/:id/check ───────────────────────────────

export async function checkDeletionObligations(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const [request] = await db
      .select()
      .from(lawyerDeletionRequestsTable)
      .where(eq(lawyerDeletionRequestsTable.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ ok: false, error: "الطلب غير موجود" });
    }

    // Count active (non-terminal) bookings
    const activeBookings = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.lawyerId, request.lawyerId),
          inArray(bookingsTable.status, [...ACTIVE_BOOKING_STATUSES]),
        ),
      );

    // Sum unpaid/disputed platform dues
    const duesResult = await db
      .select({ total: sum(platformDuesTable.commissionAmount) })
      .from(platformDuesTable)
      .where(
        and(
          eq(platformDuesTable.lawyerId, request.lawyerId),
          inArray(platformDuesTable.status, ["pending", "disputed"]),
        ),
      );

    const unpaidDuesTotal = parseFloat(duesResult[0]?.total ?? "0");

    return res.json({
      ok: true,
      requestId: id,
      lawyerId: request.lawyerId,
      activeBookingsCount: activeBookings.length,
      unpaidDuesTotal,
      canApprove:
        activeBookings.length === 0 && unpaidDuesTotal === 0,
    });
  } catch (err) {
    req.log.error(err, "checkDeletionObligations failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/admin/deletion-requests/:id/approve ────────────────────────────

export async function approveDeletion(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const [request] = await db
      .select()
      .from(lawyerDeletionRequestsTable)
      .where(eq(lawyerDeletionRequestsTable.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ ok: false, error: "الطلب غير موجود" });
    }
    if (request.status !== "pending") {
      return res
        .status(409)
        .json({ ok: false, error: "تمت معالجة هذا الطلب مسبقاً" });
    }

    // Re-validate obligations before purge
    const activeBookings = await db
      .select({ id: bookingsTable.id })
      .from(bookingsTable)
      .where(
        and(
          eq(bookingsTable.lawyerId, request.lawyerId),
          inArray(bookingsTable.status, [...ACTIVE_BOOKING_STATUSES]),
        ),
      );

    if (activeBookings.length > 0) {
      return res.status(409).json({
        ok: false,
        error: `لا يمكن الحذف. يوجد ${activeBookings.length} استشارة نشطة لهذا المحامي.`,
      });
    }

    const duesResult = await db
      .select({ total: sum(platformDuesTable.commissionAmount) })
      .from(platformDuesTable)
      .where(
        and(
          eq(platformDuesTable.lawyerId, request.lawyerId),
          inArray(platformDuesTable.status, ["pending", "disputed"]),
        ),
      );

    const unpaidDuesTotal = parseFloat(duesResult[0]?.total ?? "0");
    if (unpaidDuesTotal > 0) {
      return res.status(409).json({
        ok: false,
        error: `لا يمكن الحذف. يوجد ${unpaidDuesTotal.toFixed(2)} مستحقات غير محصلة.`,
      });
    }

    // Transactional purge — nullify every FK referencing this lawyer or their
    // offices so PostgreSQL never rejects the DELETE.
    //
    // Direct user FKs (all nullable):
    //   bookings.lawyerId, platformDues.lawyerId, platformDues.collectedBy,
    //   lawyerDeletionRequests.reviewedBy
    //
    // Office FKs — offices.ownerId has onDelete:cascade, which cascades to the
    // office row first. bookings.officeId and platformDues.officeId have
    // restrictive default FKs; nullify them before the user delete triggers the
    // office cascade.
    //
    // After all FKs are cleared: DELETE user → offices cascade →
    //   lawyerDeletionRequests(lawyerId) cascade.
    const lawyerId = request.lawyerId;
    await db.transaction(async (tx) => {
      // Collect the lawyer's office IDs so we can nullify office-dependent FKs
      const lawyerOffices = await tx
        .select({ id: officesTable.id })
        .from(officesTable)
        .where(eq(officesTable.ownerId, lawyerId));
      const officeIds = lawyerOffices.map((o) => o.id);

      // Nullify office-dependent FKs in bookings and platform_dues
      if (officeIds.length > 0) {
        await tx
          .update(bookingsTable)
          .set({ officeId: null })
          .where(inArray(bookingsTable.officeId, officeIds));

        await tx
          .update(platformDuesTable)
          .set({ officeId: null })
          .where(inArray(platformDuesTable.officeId, officeIds));
      }

      // Nullify direct user FKs
      await tx
        .update(bookingsTable)
        .set({ lawyerId: null })
        .where(eq(bookingsTable.lawyerId, lawyerId));

      await tx
        .update(platformDuesTable)
        .set({ lawyerId: null })
        .where(eq(platformDuesTable.lawyerId, lawyerId));

      await tx
        .update(platformDuesTable)
        .set({ collectedBy: null })
        .where(eq(platformDuesTable.collectedBy, lawyerId));

      await tx
        .update(lawyerDeletionRequestsTable)
        .set({ reviewedBy: null })
        .where(eq(lawyerDeletionRequestsTable.reviewedBy, lawyerId));

      await tx.delete(usersTable).where(eq(usersTable.id, lawyerId));
    });

    req.log.info(
      { requestId: id, lawyerId: request.lawyerId, adminId: req.admin?.userId },
      "lawyer account purged by admin",
    );

    return res.json({
      ok: true,
      message: "تم حذف حساب المحامي بنجاح وتطهير جميع بياناته.",
    });
  } catch (err) {
    req.log.error(err, "approveDeletion failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/admin/deletion-requests/:id/reject ─────────────────────────────

const rejectSchema = z.object({
  rejectionNote: z.string().min(5, "يرجى كتابة سبب الرفض (5 أحرف على الأقل)"),
});

export async function rejectDeletion(req: Request, res: Response) {
  const id = req.params.id as string;

  const parsed = rejectSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { rejectionNote } = parsed.data;

  try {
    const [request] = await db
      .select()
      .from(lawyerDeletionRequestsTable)
      .where(eq(lawyerDeletionRequestsTable.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ ok: false, error: "الطلب غير موجود" });
    }
    if (request.status !== "pending") {
      return res
        .status(409)
        .json({ ok: false, error: "تمت معالجة هذا الطلب مسبقاً" });
    }

    const now = new Date();

    await db
      .update(lawyerDeletionRequestsTable)
      .set({
        status: "rejected",
        rejectionNote,
        reviewedAt: now,
        reviewedBy: req.admin?.userId ?? null,
      })
      .where(eq(lawyerDeletionRequestsTable.id, id));

    // Write rejection note to user row so app can surface it on next login
    await db
      .update(usersTable)
      .set({ deletionRejectionNote: rejectionNote, updatedAt: now })
      .where(eq(usersTable.id, request.lawyerId));

    req.log.info(
      { requestId: id, lawyerId: request.lawyerId, adminId: req.admin?.userId },
      "lawyer deletion request rejected",
    );

    return res.json({
      ok: true,
      message: "تم رفض طلب الحذف وإشعار المحامي بالسبب.",
    });
  } catch (err) {
    req.log.error(err, "rejectDeletion failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
