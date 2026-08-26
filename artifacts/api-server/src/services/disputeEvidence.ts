import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { disputeEvidenceTable, disputesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 5000;
const MAX_TYPE = 80;
const MAX_STORAGE_KEY = 1000;
const MAX_MIME = 200;
const MAX_SHA256 = 64;

export type AddEvidenceResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 201; body: { ok: true; evidence: unknown } }
  | { error: "dispute_not_found" | "forbidden" | "dispute_not_accepting_evidence" };

export async function addDisputeEvidence(
  req: Request,
  disputeId: string,
  actorId: string,
  actorRole: string,
  input: { evidenceType: string; title: string; description?: string; storageKey: string; mimeType?: string; sha256?: string },
): Promise<AddEvidenceResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, actorId);
    if (idempotency.replay) return idempotency;

    const [dispute] = await tx.select().from(disputesTable).where(eq(disputesTable.id, disputeId)).limit(1).for("update");
    if (!dispute) return { error: "dispute_not_found" };
    if (actorRole !== "admin" && dispute.clientId !== actorId && dispute.lawyerId !== actorId) return { error: "forbidden" };
    if (!["open", "under_review"].includes(dispute.status)) return { error: "dispute_not_accepting_evidence" };

    const [evidence] = await tx.insert(disputeEvidenceTable).values({
      id: crypto.randomUUID(),
      disputeId,
      submittedBy: actorId,
      evidenceType: input.evidenceType,
      title: input.title,
      description: input.description ?? null,
      storageKey: input.storageKey,
      mimeType: input.mimeType ?? null,
      sha256: input.sha256 ?? null,
      reviewStatus: "pending",
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning();
    if (!evidence) throw new Error("DISPUTE_EVIDENCE_CREATE_FAILED");

    const body = { ok: true as const, evidence };
    await persistIdempotencyResponse(tx, req, actorId, 201, body);
    return { replay: false as const, status: 201 as const, body };
  });
}

export async function listDisputeEvidence(disputeId: string, actorId: string, actorRole: string) {
  const [dispute] = await db.select().from(disputesTable).where(eq(disputesTable.id, disputeId)).limit(1);
  if (!dispute) throw new Error("DISPUTE_NOT_FOUND");
  if (actorRole !== "admin" && dispute.clientId !== actorId && dispute.lawyerId !== actorId) throw new Error("FORBIDDEN");
  const evidence = await db.select().from(disputeEvidenceTable).where(eq(disputeEvidenceTable.disputeId, disputeId));
  return { disputeId, evidence };
}

export async function reviewDisputeEvidence(
  req: Request,
  evidenceId: string,
  actorId: string,
  actorRole: string,
  reviewStatus: "accepted" | "rejected",
  reviewNote?: string,
) {
  if (actorRole !== "admin") return { error: "admin_required" as const };
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, actorId);
    if (idempotency.replay) return idempotency;

    const [evidence] = await tx.select().from(disputeEvidenceTable).where(eq(disputeEvidenceTable.id, evidenceId)).limit(1).for("update");
    if (!evidence) return { error: "evidence_not_found" as const };
    if (evidence.reviewStatus !== "pending") return { error: "evidence_already_reviewed" as const };

    const [updated] = await tx.update(disputeEvidenceTable).set({
      reviewStatus,
      reviewedBy: actorId,
      reviewNote: reviewNote?.trim() || null,
      reviewedAt: new Date(),
      updatedAt: new Date(),
    }).where(and(eq(disputeEvidenceTable.id, evidenceId), eq(disputeEvidenceTable.reviewStatus, "pending"))).returning();
    if (!updated) throw new Error("DISPUTE_EVIDENCE_REVIEW_CONFLICT");

    const body = { ok: true as const, evidence: updated, financialStateChanged: false as const };
    await persistIdempotencyResponse(tx, req, actorId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}

export const evidenceLimits = { MAX_TITLE, MAX_DESCRIPTION, MAX_TYPE, MAX_STORAGE_KEY, MAX_MIME, MAX_SHA256 } as const;
