import { type Request, type Response } from "express";
import { db } from "@workspace/db";
import { usersTable, lawyerProfileChangeRequestsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { z } from "zod/v4";

const FIELD_LABELS: Record<string, string> = {
  specialization: "التخصص القانوني",
  bio: "النبذة التعريفية",
  hourlyRate: "الأتعاب بالساعة",
};

// ── GET /api/admin/profile-change-requests ────────────────────────────────────

export async function listProfileChangeRequests(req: Request, res: Response) {
  try {
    const requests = await db
      .select({
        id: lawyerProfileChangeRequestsTable.id,
        lawyerId: lawyerProfileChangeRequestsTable.lawyerId,
        lawyerName: usersTable.name,
        lawyerEmail: usersTable.email,
        lawyerSpecialization: usersTable.specialization,
        field: lawyerProfileChangeRequestsTable.field,
        oldValue: lawyerProfileChangeRequestsTable.oldValue,
        newValue: lawyerProfileChangeRequestsTable.newValue,
        status: lawyerProfileChangeRequestsTable.status,
        createdAt: lawyerProfileChangeRequestsTable.createdAt,
      })
      .from(lawyerProfileChangeRequestsTable)
      .innerJoin(
        usersTable,
        eq(lawyerProfileChangeRequestsTable.lawyerId, usersTable.id),
      )
      .where(eq(lawyerProfileChangeRequestsTable.status, "pending"))
      .orderBy(lawyerProfileChangeRequestsTable.createdAt);

    return res.json({ ok: true, requests, count: requests.length });
  } catch (err) {
    req.log.error(err, "listProfileChangeRequests failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/admin/profile-change-requests/:id/approve ──────────────────────

export async function approveProfileChange(req: Request, res: Response) {
  const id = req.params.id as string;

  try {
    const [request] = await db
      .select()
      .from(lawyerProfileChangeRequestsTable)
      .where(eq(lawyerProfileChangeRequestsTable.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ ok: false, error: "الطلب غير موجود" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ ok: false, error: "تمت معالجة هذا الطلب مسبقاً" });
    }

    const now = new Date();

    // Apply the value to the users table
    const fieldUpdate: Record<string, unknown> = { updatedAt: now };
    if (request.field === "specialization") {
      fieldUpdate.specialization = request.newValue;
    } else if (request.field === "bio") {
      fieldUpdate.bio = request.newValue;
    } else if (request.field === "hourlyRate") {
      fieldUpdate.hourlyRate =
        request.newValue !== null && request.newValue !== ""
          ? request.newValue
          : null;
    }

    // Atomically claim the request inside the transaction. The conditional WHERE
    // status = 'pending' prevents a double-approval race: if another admin or a
    // supersession already processed this row, the UPDATE returns 0 rows and the
    // transaction is aborted before touching the users table.
    let claimed = false;
    await db.transaction(async (tx) => {
      const claimedRows = await tx
        .update(lawyerProfileChangeRequestsTable)
        .set({
          status: "approved",
          reviewedAt: now,
          reviewedBy: req.admin?.userId ?? null,
        })
        .where(
          and(
            eq(lawyerProfileChangeRequestsTable.id, id),
            eq(lawyerProfileChangeRequestsTable.status, "pending"),
          ),
        )
        .returning({ id: lawyerProfileChangeRequestsTable.id });

      if (claimedRows.length === 0) {
        // Row was already processed — abort without touching the user record
        return;
      }

      claimed = true;
      await tx
        .update(usersTable)
        .set(fieldUpdate as any)
        .where(eq(usersTable.id, request.lawyerId));
    });

    if (!claimed) {
      return res.status(409).json({ ok: false, error: "تمت معالجة هذا الطلب مسبقاً" });
    }

    req.log.info(
      { requestId: id, lawyerId: request.lawyerId, field: request.field },
      "profile change approved",
    );

    return res.json({
      ok: true,
      message: `تمت الموافقة على تغيير ${FIELD_LABELS[request.field] ?? request.field} وتطبيقه على الملف العام.`,
    });
  } catch (err) {
    req.log.error(err, "approveProfileChange failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

// ── POST /api/admin/profile-change-requests/:id/reject ───────────────────────

const rejectSchema = z.object({
  rejectionNote: z
    .string()
    .min(5, "يرجى كتابة سبب الرفض (5 أحرف على الأقل)"),
});

export async function rejectProfileChange(req: Request, res: Response) {
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
      .from(lawyerProfileChangeRequestsTable)
      .where(eq(lawyerProfileChangeRequestsTable.id, id))
      .limit(1);

    if (!request) {
      return res.status(404).json({ ok: false, error: "الطلب غير موجود" });
    }
    if (request.status !== "pending") {
      return res.status(409).json({ ok: false, error: "تمت معالجة هذا الطلب مسبقاً" });
    }

    const now = new Date();

    await db
      .update(lawyerProfileChangeRequestsTable)
      .set({
        status: "rejected",
        rejectionNote,
        reviewedAt: now,
        reviewedBy: req.admin?.userId ?? null,
      })
      .where(eq(lawyerProfileChangeRequestsTable.id, id));

    req.log.info(
      { requestId: id, lawyerId: request.lawyerId, field: request.field },
      "profile change rejected",
    );

    return res.json({
      ok: true,
      message: "تم رفض طلب التغيير وسيتمكن المحامي من رؤية السبب.",
    });
  } catch (err) {
    req.log.error(err, "rejectProfileChange failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
