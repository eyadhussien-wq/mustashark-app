import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  milestoneProofsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

export type CreateMilestoneProofResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 201; body: { ok: true; proof: unknown; milestone: unknown } }
  | {
      error:
        | "milestone_not_found"
        | "forbidden"
        | "milestone_not_proofable"
        | "invalid_document_key"
        | "proof_create_failed"
        | "milestone_transition_failed";
    };

/**
 * Creates a server-owned milestone proof for the assigned lawyer.
 * No client-supplied financial values are accepted and the milestone state
 * transition is atomic with proof creation and idempotency.
 */
export async function createMilestoneProof(
  req: Request,
  milestoneId: string,
  lawyerId: string,
  documentKey: string,
  proofType?: string,
  note?: string,
): Promise<CreateMilestoneProofResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, lawyerId);
    if (idempotency.replay) return idempotency;

    const normalizedDocumentKey = documentKey.trim();
    if (!normalizedDocumentKey) return { error: "invalid_document_key" };

    const [row] = await tx
      .select({ milestone: representationMilestonesTable, quote: representationQuotesTable })
      .from(representationMilestonesTable)
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .where(eq(representationMilestonesTable.id, milestoneId))
      .limit(1)
      .for("update");

    if (!row) return { error: "milestone_not_found" };
    if (row.quote.lawyerId !== lawyerId) return { error: "forbidden" };
    if (!["funded", "in_progress"].includes(row.milestone.status)) {
      return { error: "milestone_not_proofable" };
    }

    const now = new Date();
    const [proof] = await tx
      .insert(milestoneProofsTable)
      .values({
        id: randomUUID(),
        milestoneId: row.milestone.id,
        lawyerId,
        documentKey: normalizedDocumentKey,
        proofType: proofType?.trim() || null,
        note: note?.trim() || null,
        status: "submitted",
        submittedAt: now,
      })
      .returning();

    if (!proof) throw new Error("PROOF_CREATE_FAILED");

    const [updatedMilestone] = await tx
      .update(representationMilestonesTable)
      .set({ status: "proof_submitted", updatedAt: now })
      .where(and(
        eq(representationMilestonesTable.id, row.milestone.id),
        eq(representationMilestonesTable.status, row.milestone.status),
      ))
      .returning();

    if (!updatedMilestone) throw new Error("MILESTONE_PROOF_TRANSITION_FAILED");

    const body = { ok: true as const, proof, milestone: updatedMilestone };
    await persistIdempotencyResponse(tx, req, lawyerId, 201, body);
    return { replay: false as const, status: 201 as const, body };
  });
}
