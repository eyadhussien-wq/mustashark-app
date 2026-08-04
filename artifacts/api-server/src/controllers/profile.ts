import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, lawyerDeletionRequestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";

// ── PATCH /api/profile ────────────────────────────────────────────────────────

const updateProfileSchema = z.object({
  name: z.string().min(2, "الاسم يجب أن يكون حرفين على الأقل").max(100).optional(),
  phone: z.string().max(20).optional().nullable(),
  country: z.enum(["qatar", "jordan"]).optional().nullable(),
  // Lawyer-specific fields
  specialization: z.string().max(200).optional().nullable(),
  bio: z.string().max(2000).optional().nullable(),
  hourlyRate: z.number().positive("الأتعاب يجب أن تكون قيمة موجبة").optional().nullable(),
});

export async function updateProfile(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }

  const parsed = updateProfileSchema.safeParse(req.body);
  if (!parsed.success) {
    return res
      .status(400)
      .json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  const { name, phone, country, specialization, bio, hourlyRate } = parsed.data;
  const updates: Record<string, unknown> = { updatedAt: new Date() };
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (country !== undefined) updates.country = country;
  // Lawyer-specific fields — only persist if the caller is a lawyer
  if (authUser.role === "lawyer") {
    if (specialization !== undefined) updates.specialization = specialization;
    if (bio !== undefined) updates.bio = bio;
    if (hourlyRate !== undefined)
      updates.hourlyRate = hourlyRate !== null ? String(hourlyRate) : null;
  }

  try {
    const [updated] = await db
      .update(usersTable)
      .set(updates as Parameters<typeof db.update>[0] extends any ? any : never)
      .where(eq(usersTable.id, authUser.userId))
      .returning();

    if (!updated) {
      return res.status(404).json({ ok: false, error: "user_not_found" });
    }

    req.log.info({ userId: authUser.userId }, "profile updated");

    return res.json({
      ok: true,
      user: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        phone: updated.phone,
        country: updated.country,
        role: updated.role,
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

// ── DELETE /api/profile  (client only — 30-day soft delete) ──────────────────

export async function softDeleteClient(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
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
      .where(eq(usersTable.id, authUser.userId));

    req.log.info(
      { userId: authUser.userId, scheduledAt },
      "client account soft-deleted",
    );

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

export async function requestLawyerDeletion(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }
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
          eq(lawyerDeletionRequestsTable.lawyerId, authUser.userId),
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

    const requestId = `delreq-${authUser.userId.slice(0, 8)}-${Date.now()}`;
    const [request] = await db
      .insert(lawyerDeletionRequestsTable)
      .values({
        id: requestId,
        lawyerId: authUser.userId,
        status: "pending",
        requestedAt: new Date(),
        createdAt: new Date(),
      })
      .returning();

    req.log.info(
      { requestId, lawyerId: authUser.userId },
      "lawyer deletion requested",
    );

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

export async function getDeletionStatus(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }

  try {
    const [userRow] = await db
      .select({
        deletionRejectionNote: usersTable.deletionRejectionNote,
        deletedAt: usersTable.deletedAt,
        deletionScheduledAt: usersTable.deletionScheduledAt,
      })
      .from(usersTable)
      .where(eq(usersTable.id, authUser.userId))
      .limit(1);

    const pendingRequest =
      authUser.role === "lawyer"
        ? await db
            .select({ id: lawyerDeletionRequestsTable.id })
            .from(lawyerDeletionRequestsTable)
            .where(
              and(
                eq(lawyerDeletionRequestsTable.lawyerId, authUser.userId),
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

export async function dismissRejectionNote(req: Request, res: Response) {
  const { authUser } = req;
  if (!authUser) {
    return res.status(401).json({ ok: false, error: "غير مصرح" });
  }

  try {
    await db
      .update(usersTable)
      .set({ deletionRejectionNote: null, updatedAt: new Date() })
      .where(eq(usersTable.id, authUser.userId));

    return res.json({ ok: true });
  } catch (err) {
    req.log.error(err, "dismissRejectionNote failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
