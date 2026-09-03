import { type Request, type Response } from "express";
import { db, lawyerVerificationsTable, usersTable, adminAuditLogsTable } from "@workspace/db";
import { and, asc, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { Buffer } from "node:buffer";
import { z } from "zod/v4";
import { calculateDocumentHash, verifyProfessionalStatus } from "../services/professionalVerification";

const submissionSchema = z.object({
  licenseNumber: z.string().trim().min(2).max(100),
  barAssociation: z.string().trim().min(2).max(200),
  // The upload path supplies the actual card bytes. The server hashes these bytes;
  // the client never supplies the authoritative hash.
  documentStorageKey: z.string().trim().min(1).max(500),
  documentContentBase64: z.string().min(1).max(12_000_000),
});
const reviewSchema = z.object({ status: z.enum(["approved", "rejected"]), rejectionReason: z.string().trim().max(1000).optional().nullable() });

type LawyerVerificationWrite = Pick<typeof lawyerVerificationsTable.$inferInsert,
  | "licenseNumber" | "barAssociation" | "documentStorageKey" | "documentHash" | "status"
  | "verificationSource" | "sourceReference" | "sourceStatus" | "verificationMethod"
  | "matchedName" | "matchedLicense" | "confidence" | "verifiedAt" | "lastCheckedAt"
  | "exceptionReason" | "reviewedBy" | "reviewedAt" | "rejectionReason" | "updatedAt"
>;

export async function submitLawyerVerification(req: Request, res: Response) {
  const user = req.authUser;
  if (!user || user.role !== "lawyer") return res.status(403).json({ ok: false, error: "lawyer_only" });
  const parsed = submissionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });

  try {
    const documentBytes = Buffer.from(parsed.data.documentContentBase64, "base64");
    if (documentBytes.length === 0) return res.status(400).json({ ok: false, error: "empty_document" });
    const documentHash = calculateDocumentHash(documentBytes);
    const now = new Date();
    const result = await verifyProfessionalStatus({
      name: user.name,
      licenseNumber: parsed.data.licenseNumber,
      barAssociation: parsed.data.barAssociation,
      documentStorageKey: parsed.data.documentStorageKey,
      documentHash,
    });

    const status = result.status === "verified" ? "approved" : result.status === "rejected" ? "rejected" : "exception";
    const values: LawyerVerificationWrite = {
      licenseNumber: parsed.data.licenseNumber,
      barAssociation: parsed.data.barAssociation,
      documentStorageKey: parsed.data.documentStorageKey,
      documentHash,
      status,
      verificationSource: result.source,
      sourceReference: result.sourceReference,
      sourceStatus: result.sourceStatus,
      verificationMethod: result.verificationMethod,
      matchedName: result.matchedName,
      matchedLicense: result.matchedLicense,
      confidence: result.confidence,
      verifiedAt: result.status === "verified" ? now : null,
      lastCheckedAt: now,
      exceptionReason: result.status === "exception" ? result.reason : null,
      reviewedBy: null,
      reviewedAt: null,
      rejectionReason: result.status === "rejected" ? result.reason : null,
      updatedAt: now,
    };

    const row = await db.transaction(async (tx) => {
      const [existing] = await tx.select().from(lawyerVerificationsTable).where(eq(lawyerVerificationsTable.userId, user.userId)).limit(1);
      const [verification] = existing
        ? await tx.update(lawyerVerificationsTable).set(values).where(eq(lawyerVerificationsTable.id, existing.id)).returning()
        : await tx.insert(lawyerVerificationsTable).values({ id: `lawyer_verification_${randomUUID()}`, userId: user.userId, ...values }).returning();
      if (!verification) throw new Error("VERIFICATION_WRITE_FAILED");

      const accountStatus = result.status === "verified" ? "active" : result.status === "rejected" ? "rejected" : "pending";
      const [updatedUser] = await tx.update(usersTable).set({
        accountStatus,
        statusReason: result.status === "verified" ? "lawyer_professional_verification_approved" : result.reason,
        updatedAt: now,
      }).where(and(eq(usersTable.id, user.userId), eq(usersTable.role, "lawyer"))).returning({ id: usersTable.id });
      if (!updatedUser) throw new Error("LAWYER_ACCOUNT_WRITE_FAILED");
      return verification;
    });

    return res.status(row ? (row.createdAt.getTime() === row.updatedAt.getTime() ? 201 : 200) : 500).json({ ok: true, verification: {
      id: row.id,
      status: row.status,
      licenseNumber: row.licenseNumber,
      barAssociation: row.barAssociation,
      verificationSource: row.verificationSource,
      verificationMethod: row.verificationMethod,
      confidence: row.confidence,
      verifiedAt: row.verifiedAt,
      lastCheckedAt: row.lastCheckedAt,
      exceptionReason: row.exceptionReason,
      rejectionReason: row.rejectionReason,
    }});
  } catch (err) {
    req.log?.error?.(err, "submitLawyerVerification failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}

export async function getLawyerVerification(req: Request, res: Response) {
  const user = req.authUser;
  if (!user || user.role !== "lawyer") return res.status(403).json({ ok: false, error: "lawyer_only" });
  const [row] = await db.select().from(lawyerVerificationsTable).where(eq(lawyerVerificationsTable.userId, user.userId)).limit(1);
  return res.json({ ok: true, verification: row ? {
    id: row.id, status: row.status, licenseNumber: row.licenseNumber, barAssociation: row.barAssociation,
    verificationSource: row.verificationSource, verificationMethod: row.verificationMethod,
    confidence: row.confidence, verifiedAt: row.verifiedAt, lastCheckedAt: row.lastCheckedAt,
    exceptionReason: row.exceptionReason, rejectionReason: row.rejectionReason,
  } : null });
}

/** Exception queue only. Pending verification is not an admin approval queue. */
export async function listPendingLawyerVerifications(req: Request, res: Response) {
  const rows = await db.select({
    id: lawyerVerificationsTable.id,
    lawyerId: lawyerVerificationsTable.userId,
    lawyerName: usersTable.name,
    lawyerEmail: usersTable.email,
    licenseNumber: lawyerVerificationsTable.licenseNumber,
    barAssociation: lawyerVerificationsTable.barAssociation,
    status: lawyerVerificationsTable.status,
    exceptionReason: lawyerVerificationsTable.exceptionReason,
    createdAt: lawyerVerificationsTable.createdAt,
  }).from(lawyerVerificationsTable)
    .innerJoin(usersTable, eq(lawyerVerificationsTable.userId, usersTable.id))
    .where(eq(lawyerVerificationsTable.status, "exception"))
    .orderBy(asc(lawyerVerificationsTable.createdAt));
  return res.json({ ok: true, items: rows });
}

/** Admin action is deliberately restricted to unresolved exceptions. */
export async function reviewLawyerVerification(req: Request, res: Response) {
  const adminId = req.admin?.userId;
  if (!adminId) return res.status(401).json({ ok: false, error: "admin_only" });
  const parsed = reviewSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "validation_error", issues: parsed.error.issues });
  if (parsed.data.status === "rejected" && !parsed.data.rejectionReason) return res.status(400).json({ ok: false, error: "rejection_reason_required" });
  try {
    const result = await db.transaction(async (tx) => {
      const [current] = await tx.select().from(lawyerVerificationsTable).where(eq(lawyerVerificationsTable.id, String(req.params.id))).limit(1);
      if (!current) throw new Error("VERIFICATION_NOT_FOUND");
      if (current.status !== "exception") throw new Error("VERIFICATION_NOT_EXCEPTION");
      const [lawyer] = await tx.select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus, statusReason: usersTable.statusReason }).from(usersTable).where(eq(usersTable.id, current.userId)).limit(1);
      if (!lawyer || lawyer.role !== "lawyer") throw new Error("LAWYER_NOT_FOUND");
      const now = new Date();
      const [updated] = await tx.update(lawyerVerificationsTable).set({
        status: parsed.data.status,
        reviewedBy: adminId,
        reviewedAt: now,
        rejectionReason: parsed.data.status === "rejected" ? parsed.data.rejectionReason! : null,
        verifiedAt: parsed.data.status === "approved" ? now : null,
        updatedAt: now,
      }).where(and(eq(lawyerVerificationsTable.id, current.id), eq(lawyerVerificationsTable.status, "exception"))).returning();
      if (!updated) throw new Error("VERIFICATION_CONFLICT");

      const nextAccountStatus = parsed.data.status === "approved" ? "active" : "rejected";
      await tx.update(usersTable).set({ accountStatus: nextAccountStatus, statusReason: parsed.data.status === "approved" ? "lawyer_verification_exception_resolved" : (parsed.data.rejectionReason ?? "lawyer_verification_rejected"), updatedAt: now }).where(and(eq(usersTable.id, lawyer.id), eq(usersTable.role, "lawyer")));

      await tx.insert(adminAuditLogsTable).values({
        id: `audit_${randomUUID()}`, adminId, action: `LAWYER_VERIFICATION_EXCEPTION_${parsed.data.status.toUpperCase()}`,
        entityType: "lawyer_verification", entityId: updated.id,
        description: `Lawyer professional verification exception ${parsed.data.status}`,
        beforeData: { status: current.status, reviewedBy: current.reviewedBy, reviewedAt: current.reviewedAt, accountStatus: lawyer.accountStatus },
        afterData: { status: updated.status, reviewedBy: updated.reviewedBy, reviewedAt: updated.reviewedAt, accountStatus: nextAccountStatus },
      });
      return updated;
    });
    return res.json({ ok: true, verification: { id: result.id, lawyerId: result.userId, status: result.status, reviewedAt: result.reviewedAt, rejectionReason: result.rejectionReason } });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message === "VERIFICATION_NOT_FOUND") return res.status(404).json({ ok: false, error: "verification_not_found" });
    if (message === "VERIFICATION_NOT_EXCEPTION") return res.status(409).json({ ok: false, error: "verification_not_exception" });
    if (message === "LAWYER_NOT_FOUND") return res.status(404).json({ ok: false, error: "lawyer_not_found" });
    if (message === "VERIFICATION_CONFLICT") return res.status(409).json({ ok: false, error: "verification_conflict" });
    req.log?.error?.(err, "reviewLawyerVerification failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
