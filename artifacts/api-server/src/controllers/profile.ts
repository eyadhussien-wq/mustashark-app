import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import {
  usersTable,
  lawyerDeletionRequestsTable,
  lawyerProfileChangeRequestsTable,
} from "@workspace/db";
import { eq, and, inArray } from "drizzle-orm";
import { z } from "zod";

// تعريف واجهة الطلب الموسعة لدعم مصادقة المستخدم وسجل الأخطاء (Pino logger)

// Fields that require admin approval before going live on a lawyer's public profile
const MODERATED_LAWYER_FIELDS = [
  "specialization",
  "bio",
  "hourlyRate",
] as const;
type ModeratedField = (typeof MODERATED_LAWYER_FIELDS)[number];

// ── PATCH /api/profile ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z
    .string()
    .min(2, "الاسم يجب أن يكون حرفين على الأقل")
    .max(100)
    .optional(),
  phone: z.string().max(20).optional().nullable(),
  country: z.enum(["qatar", "jordan"]).optional().nullable(),
  // Lawyer-specific fields — queued for admin review, not applied directly
  specialization: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  hourlyRate: z
    .number()
    .positive("الأتعاب يجب أن تكون قيمة موجبة")
    .optional()
    .nullable(),
});

export async function updateProfile(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
  const userId = authUser.userId;

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      ok: false,
      error: "validation_error",
      issues: parsed.error.issues,
    });
  }

  const { name, phone, country, specialization, bio, hourlyRate } = parsed.data;

  // Immediate updates (name/phone/country for all; nothing lawyer-specific here)
  const immediateUpdates: Partial<typeof usersTable.$inferInsert> = {
    updatedAt: new Date(),
  };
  if (name !== undefined) immediateUpdates.name = name;
  if (phone !== undefined) immediateUpdates.phone = phone;
  if (country !== undefined) immediateUpdates.country = country;

  // Lawyer moderated fields — create pending change requests instead of writing directly
  const pendingFields: ModeratedField[] = [];

  try {
    // Fetch current lawyer profile for old values
    let currentUser: typeof usersTable.$inferSelect | null = null;
    if (authUser.role === "lawyer") {
      const [row] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, userId))
        .limit(1);
      currentUser = row ?? null;
    }

    // Apply immediate updates
    const [updated] = await db
      .update(usersTable)
      .set(immediateUpdates)
      .where(eq(usersTable.id, userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ ok: false, error: "user_not_found" });
    }

    // Queue moderated lawyer fields as pending change requests
    if (authUser.role === "lawyer" && currentUser) {
      const requestsToInsert: {
        id: string;
        lawyerId: string;
        field: ModeratedField;
        oldValue: string | null;
        newValue: string | null;
      }[] = [];

      // Helper: atomically cancel existing pending request for a field (DELETE,
      // not UPDATE-to-rejected) so superseded/reverted requests never appear in
      // the lawyer-facing or admin-facing query results.
      const cancelPending = (field: ModeratedField) =>
        db
          .delete(lawyerProfileChangeRequestsTable)
          .where(
            and(
              eq(lawyerProfileChangeRequestsTable.lawyerId, userId),
              eq(lawyerProfileChangeRequestsTable.field, field),
              eq(lawyerProfileChangeRequestsTable.status, "pending"),
            ),
          );

      if (specialization !== undefined) {
        const oldVal = currentUser.specialization ?? null;
        const newVal = specialization ?? null;
        // Always cancel any outstanding pending request first (supersede/revert)
        await cancelPending("specialization");
        if (oldVal !== newVal) {
          // Lawyer changed to a new value — queue a new request
          requestsToInsert.push({
            id: `pcr-${userId.slice(0, 8)}-spec-${Date.now()}`,
            lawyerId: userId,
            field: "specialization",
            oldValue: oldVal,
            newValue: newVal,
          });
          pendingFields.push("specialization");
        }
        // If newVal === oldVal (revert to live), the cancel above is all we need
      }

      if (bio !== undefined) {
        const oldVal = currentUser.bio ?? null;
        const newVal = bio ?? null;
        await cancelPending("bio");
        if (oldVal !== newVal) {
          requestsToInsert.push({
            id: `pcr-${userId.slice(0, 8)}-bio-${Date.now()}`,
            lawyerId: userId,
            field: "bio",
            oldValue: oldVal,
            newValue: newVal,
          });
          pendingFields.push("bio");
        }
      }

      if (hourlyRate !== undefined) {
        const oldVal = currentUser.hourlyRate
          ? String(parseFloat(currentUser.hourlyRate))
          : null;
        const newVal = hourlyRate !== null ? String(hourlyRate) : null;
        await cancelPending("hourlyRate");
        if (oldVal !== newVal) {
          requestsToInsert.push({
            id: `pcr-${userId.slice(0, 8)}-rate-${Date.now()}`,
            lawyerId: userId,
            field: "hourlyRate",
            oldValue: oldVal,
            newValue: newVal,
          });
          pendingFields.push("hourlyRate");
        }
      }

      if (requestsToInsert.length > 0) {
        await db
          .insert(lawyerProfileChangeRequestsTable)
          .values(requestsToInsert);
      }
    }

    req.log.info(
      { userId, pendingFields },
      "profile updated (moderated fields queued)",
    );

    return res.json({
      ok: true,
      pendingFields,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        country: updated.country,
        role: updated.role,
        // Return current live values (not the pending ones)
        specialization: updated.specialization,
        bio: updated.bio,
        hourlyRate: updated.hourlyRate ? parseFloat(updated.hourlyRate) : null,
        deletionRejectionNote: updated.deletionRejectionNote,
      },
    });
  } catch (err) {
    req.log.error(err, "updateProfile failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── GET /api/profile/pending-changes ─────────────────────────────────────────
// Returns the lawyer's own pending and recently-rejected change requests.

export async function getPendingChanges(
  req: Request,
  res: Response,
) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
  const userId = authUser.userId;

  if (authUser.role !== "lawyer") {
    return res.json({ ok: true, requests: [] });
  }

  try {
    const rows = await db
      .select({
        id: lawyerProfileChangeRequestsTable.id,
        field: lawyerProfileChangeRequestsTable.field,
        newValue: lawyerProfileChangeRequestsTable.newValue,
        status: lawyerProfileChangeRequestsTable.status,
        rejectionNote: lawyerProfileChangeRequestsTable.rejectionNote,
        reviewedBy: lawyerProfileChangeRequestsTable.reviewedBy,
        createdAt: lawyerProfileChangeRequestsTable.createdAt,
      })
      .from(lawyerProfileChangeRequestsTable)
      .where(
        and(
          eq(lawyerProfileChangeRequestsTable.lawyerId, userId),
          inArray(lawyerProfileChangeRequestsTable.status, [
            "pending",
            "rejected",
          ]),
        ),
      )
      .orderBy(lawyerProfileChangeRequestsTable.createdAt);

    // Keep only relevant rows: pending (any reviewedBy) or admin-rejected
    const filtered = rows.filter(
      (r) =>
        r.status === "pending" ||
        (r.status === "rejected" && r.reviewedBy !== null),
    );

    // Deduplicate: one entry per field — pending wins over rejection; within same
    // status, keep the latest (rows are ordered ASC so last wins)
    const byField = new Map<string, (typeof filtered)[0]>();
    for (const row of filtered) {
      const existing = byField.get(row.field);
      if (!existing) {
        byField.set(row.field, row);
      } else if (row.status === "pending") {
        byField.set(row.field, row);
      } else if (existing.status === "rejected") {
        byField.set(row.field, row);
      }
    }

    const requests = Array.from(byField.values()).map(
      ({ reviewedBy: _rb, ...rest }) => rest,
    );

    return res.json({ ok: true, requests });
  } catch (err) {
    req.log.error(err, "getPendingChanges failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── DELETE /api/profile  (client only — 30-day soft delete) ──────────────────

export async function softDeleteClient(
  req: Request,
  res: Response,
) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
  const userId = authUser.userId;

  if (authUser.role !== "client") {
    return res.status(403).json({
      ok: false,
      error: "هذه الميزة للعملاء فقط. المحامون يستخدمون طلب حذف الحساب.",
    });
  }

  const now = new Date();
  const scheduledAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  try {
    await db
      .update(usersTable)
      .set({
        deletedAt: now,
        deletionScheduledAt: scheduledAt,
        accountStatus: "terminated",
        updatedAt: now,
      })
      .where(eq(usersTable.id, userId));

    req.log.info({ userId, scheduledAt }, "client account soft-deleted");

    return res.json({
      ok: true,
      message:
        "تم تقديم طلب حذف حسابك. سيتم حذفه نهائياً بعد 30 يوماً. يمكنك التراجع بتسجيل الدخول خلال هذه الفترة.",
      scheduledAt: scheduledAt.toISOString(),
    });
  } catch (err) {
    req.log.error(err, "softDeleteClient failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/profile/deletion-request  (lawyer only) ────────────────────────

export async function requestLawyerDeletion(
  req: Request,
  res: Response,
) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
  const userId = authUser.userId;

  if (authUser.role !== "lawyer") {
    return res
      .status(403)
      .json({ ok: false, error: "هذه الميزة للمحامين فقط." });
  }

  try {
    // Check for an existing pending request
    const existing = await db
      .select({ id: lawyerDeletionRequestsTable.id })
      .from(lawyerDeletionRequestsTable)
      .where(
        and(
          eq(lawyerDeletionRequestsTable.lawyerId, userId),
          eq(lawyerDeletionRequestsTable.status, "pending"),
        ),
      )
      .limit(1);

    if (existing.length > 0) {
      return res.status(409).json({
        ok: false,
        error: "لديك طلب حذف قيد المراجعة بالفعل.",
      });
    }

    const requestId = `delreq-${userId.slice(0, 8)}-${Date.now()}`;
    const [request] = await db
      .insert(lawyerDeletionRequestsTable)
      .values({
        id: requestId,
        lawyerId: userId,
        status: "pending",
        requestedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    req.log.info({ requestId, lawyerId: userId }, "lawyer deletion requested");

    return res.json({
      ok: true,
      request,
      message:
        "تم تقديم طلب حذف حسابك. ستتم مراجعته من قِبَل الإدارة وستُبلَّغ بالنتيجة.",
    });
  } catch (err) {
    req.log.error(err, "requestLawyerDeletion failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── GET /api/profile/deletion-status  (lawyer only) ──────────────────────────

export async function getDeletionStatus(
  req: Request,
  res: Response,
) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
  const userId = authUser.userId;

  try {
    const [userRow] = await db
      .select({
        deletionRejectionNote: usersTable.deletionRejectionNote,
        deletedAt: usersTable.deletedAt,
        deletionScheduledAt: usersTable.deletionScheduledAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, userId))
      .limit(1);

    const pendingRequest =
      authUser.role === "lawyer"
        ? await db
            .select({ id: lawyerDeletionRequestsTable.id })
            .from(lawyerDeletionRequestsTable)
            .where(
              and(
                eq(lawyerDeletionRequestsTable.lawyerId, userId),
                eq(lawyerDeletionRequestsTable.status, "pending"),
              ),
            )
            .limit(1)
        : [];

    return res.json({
      ok: true,
      deletionPendingRequest: pendingRequest.length > 0,
      deletionRejectionNote: userRow?.deletionRejectionNote ?? null,
    });
  } catch (err) {
    req.log.error(err, "getDeletionStatus failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/profile/dismiss-rejection  (lawyer — clears rejection note) ────

export async function dismissRejectionNote(
  req: Request,
  res: Response,
) {
  const { authUser } = req;
  if (!authUser || !authUser.userId) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
  const userId = authUser.userId;

  try {
    await db
      .update(usersTable)
      .set({ deletionRejectionNote: null, updatedAt: new Date() })
      .where(eq(usersTable.id, userId));

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "dismissRejectionNote failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
