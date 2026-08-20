import { type Request, type Response } from "express";
import { db, lawyerVerificationsTable, usersTable, adminAuditLogsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { z } from "zod/v4";

const submissionSchema = z.object({
  licenseNumber: z.string().trim().min(2).max(100),
  barAssociation: z.string().trim().min(2).max(200),
  documentStorageKey: z.string().trim().min(1).max(500),
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  rejectionReason: z.string().trim().max(1000).optional().nullable(),
});

export async function submitLawyerVerification(req: Request, res: Response) {
  const user = req.authUser;
  if (!user || user.role !== "lawyer") {
    return res.status(403).json({ ok: false, error: "lawyer_only" });
  }

  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }

  try {
    const [existing] = await db
      .select()
      .from(lawyerVerificationsTable)
      .where(eq(lawyerVerificationsTable.userId, user.userId))
      .limit(1);

    const now = new Date();
    const values = {
      licenseNumber: parsed.data.licenseNumber,
      barAssociation: parsed.data.barAssociation,
      documentStorageKey: parsed.data.documentStorageKey,
      status: "pending" as const,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: null,
      updatedAt: now,
    };

    const row = existing
      ? (await db.update(lawyerVerificationsTable).set(values).where(eq(lawyerVerificationsTable.id, existing.id)).returning())[0]
      : (await db.insert(lawyerVerificationsTable).values({
          id: `lawyer_verification_${randomUUID()}`,
          userId: user.userId,
          ...values,
        }).returning())[0];

    return res.status(existing ? 200 : 201).json({
      ok: true,
      verification: {
        id: row!.id,
        status: row!.status,
        licenseNumber: row!.licenseNumber,
        barAssociation: row!.barAssociation,
        reviewedAt: row!.reviewedAt,
        rejectionReason: row!.rejectionReason,
      },
    });
  } catch (err) {
    req.log?.error?.(err, "submitLawyerVerification failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function getLawyerVerification(req: Request, res: Response) {
  const user = req.authUser;
  if (!user || user.role !== "lawyer") {
    return res.status(403).json({ ok: false, error: "lawyer_only" });
  }

  const [row] = await db
    .select()
    .from(lawyerVerificationsTable)
    .where(eq(lawyerVerificationsTable.userId, user.userId))
    .limit(1);

  return res.json({
    ok: true,
    verification: row
      ? {
          id: row.id,
          status: row.status,
          licenseNumber: row.licenseNumber,
          barAssociation: row.barAssociation,
          reviewedAt: row.reviewedAt,
          rejectionReason: row.rejectionReason,
        }
      : null,
  });
}

export async function listPendingLawyerVerifications(req: Request, res: Response) {
  const rows = await db
    .select({
      id: lawyerVerificationsTable.id,
      lawyerId: lawyerVerificationsTable.userId,
      lawyerName: usersTable.name,
      lawyerEmail: usersTable.email,
      licenseNumber: lawyerVerificationsTable.licenseNumber,
      barAssociation: lawyerVerificationsTable.barAssociation,
      status: lawyerVerificationsTable.status,
      rejectionReason: lawyerVerificationsTable.rejectionReason,
      createdAt: lawyerVerificationsTable.createdAt,
    })
    .from(lawyerVerificationsTable)
    .innerJoin(usersTable, eq(lawyerVerificationsTable.userId, usersTable.id))
    .where(eq(lawyerVerificationsTable.status, "pending"))
    .orderBy(asc(lawyerVerificationsTable.createdAt));

  return res.json({ ok: true, items: rows });
}

export async function reviewLawyerVerification(req: Request, res: Response) {
  const adminId = req.admin?.userId;
  if (!adminId) return res.status(401).json({ ok: false, error: "admin_only" });

  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  }
  if (parsed.data.status === "rejected" && !parsed.data.rejectionReason) {
    return res.status(400).json({ ok: false, error: "rejection_reason_required" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx
        .select()
        .from(lawyerVerificationsTable)
        .where(eq(lawyerVerificationsTable.id, String(req.params.id)))
        .limit(1);
      if (!current) throw new Error("VERIFICATION_NOT_FOUND");
      if (current.status !== "pending") throw new Error("VERIFICATION_NOT_PENDING");

      const [lawyer] = await tx
        .select({ id: usersTable.id, role: usersTable.role })
        .from(usersTable)
        .where(eq(usersTable.id, current.userId))
        .limit(1);
      if (!lawyer || lawyer.role !== "lawyer") throw new Error("LAWYER_NOT_FOUND");

      const now = new Date();
      const [updated] = await tx
        .update(lawyerVerificationsTable)
        .set({
          status: parsed.data.status,
          reviewedBy: adminId,
          reviewedAt: now,
          rejectionReason: parsed.data.status === "rejected" ? parsed.data.rejectionReason! : null,
          updatedAt: now,
        })
        .where(and(eq(lawyerVerificationsTable.id, current.id), eq(lawyerVerificationsTable.status, "pending")))
        .returning();
      if (!updated) throw new Error("VERIFICATION_CONFLICT");

      await tx.insert(adminAuditLogsTable).values({
        id: `audit_${randomUUID()}`,
        adminId,
        action: `LAWYER_VERIFICATION_${parsed.data.status.toUpperCase()}`,
        entityType: "lawyer_verification",
        entityId: updated.id,
        description: `Lawyer professional verification ${parsed.data.status}`,
        beforeData: { status: current.status, reviewedBy: current.reviewedBy, reviewedAt: current.reviewedAt },
        afterData: { status: updated.status, reviewedBy: updated.reviewedBy, reviewedAt: updated.reviewedAt },
      });

      return updated;
    });

    return res.json({
      ok: true,
      verification: {
        id: result.id,
        lawyerId: result.userId,
        status: result.status,
        reviewedAt: result.reviewedAt,
        rejectionReason: result.rejectionReason,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "VERIFICATION_NOT_FOUND") return res.status(404).json({ ok: false, error: "verification_not_found" });
    if (message === "VERIFICATION_NOT_PENDING") return res.status(409).json({ ok: false, error: "verification_not_pending" });
    if (message === "LAWYER_NOT_FOUND") return res.status(404).json({ ok: false, error: "lawyer_not_found" });
    if (message === "VERIFICATION_CONFLICT") return res.status(409).json({ ok: false, error: "verification_conflict" });
    req.log?.error?.(err, "reviewLawyerVerification failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
