import crypto from "crypto";
import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  disputesTable,
  milestoneProofsTable,
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

export type DisputeMilestoneReleaseResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 201; body: { ok: true; dispute: unknown; releaseRequest: unknown; proof: unknown; milestone: unknown } }
  | { error: "release_request_not_found" | "forbidden" | "dispute_reason_required" | "milestone_not_disputable" | "dispute_already_exists" };

/**
 * Creates the canonical T02 dispute record and atomically moves the existing
 * release-request/proof/milestone state to disputed. No amount is accepted
 * from the client and no financial movement occurs here; C3 remains the only
 * settlement authority.
 */
export async function disputeMilestoneRelease(
  req: Request,
  releaseRequestId: string,
  clientId: string,
  disputeReason: string,
): Promise<DisputeMilestoneReleaseResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const normalizedReason = disputeReason.trim();
    if (!normalizedReason) return { error: "dispute_reason_required" };

    const [row] = await tx
      .select({
        request: milestoneReleaseRequestsTable,
        proof: milestoneProofsTable,
        milestone: representationMilestonesTable,
        quote: representationQuotesTable,
      })
      .from(milestoneReleaseRequestsTable)
      .innerJoin(representationMilestonesTable, eq(representationMilestonesTable.id, milestoneReleaseRequestsTable.milestoneId))
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .innerJoin(milestoneProofsTable, eq(milestoneProofsTable.id, milestoneReleaseRequestsTable.proofId))
      .where(eq(milestoneReleaseRequestsTable.id, releaseRequestId))
      .limit(1)
      .for("update");

    if (!row) return { error: "release_request_not_found" };
    if (row.request.clientId !== clientId || row.quote.clientId !== clientId) return { error: "forbidden" };
    if (row.request.status !== "pending" || row.milestone.status !== "under_review" || row.proof.status !== "submitted") {
      return { error: "milestone_not_disputable" };
    }

    const [existingDispute] = await tx
      .select({ id: disputesTable.id })
      .from(disputesTable)
      .where(eq(disputesTable.releaseRequestId, row.request.id))
      .limit(1)
      .for("update");
    if (existingDispute) return { error: "dispute_already_exists" };

    const now = new Date();
    const [dispute] = await tx
      .insert(disputesTable)
      .values({
        id: crypto.randomUUID(),
        releaseRequestId: row.request.id,
        milestoneId: row.milestone.id,
        quoteId: row.quote.id,
        clientId: row.request.clientId,
        lawyerId: row.request.lawyerId,
        reason: normalizedReason,
        status: "open",
        createdAt: now,
        updatedAt: now,
      })
      .returning();
    if (!dispute) throw new Error("DISPUTE_CREATE_FAILED");

    const [updatedRequest] = await tx
      .update(milestoneReleaseRequestsTable)
      .set({ status: "disputed", disputeReason: normalizedReason, decidedAt: now, updatedAt: now })
      .where(and(
        eq(milestoneReleaseRequestsTable.id, row.request.id),
        eq(milestoneReleaseRequestsTable.status, "pending"),
      ))
      .returning();
    if (!updatedRequest) throw new Error("RELEASE_REQUEST_DISPUTE_TRANSITION_FAILED");

    const [updatedProof] = await tx
      .update(milestoneProofsTable)
      .set({ status: "disputed" })
      .where(and(
        eq(milestoneProofsTable.id, row.proof.id),
        eq(milestoneProofsTable.status, "submitted"),
      ))
      .returning();
    if (!updatedProof) throw new Error("PROOF_DISPUTE_TRANSITION_FAILED");

    const [updatedMilestone] = await tx
      .update(representationMilestonesTable)
      .set({ status: "disputed", updatedAt: now })
      .where(and(
        eq(representationMilestonesTable.id, row.milestone.id),
        eq(representationMilestonesTable.status, "under_review"),
      ))
      .returning();
    if (!updatedMilestone) throw new Error("MILESTONE_DISPUTE_TRANSITION_FAILED");

    const body = { ok: true as const, dispute, releaseRequest: updatedRequest, proof: updatedProof, milestone: updatedMilestone };
    await persistIdempotencyResponse(tx, req, clientId, 201, body);
    return { replay: false as const, status: 201 as const, body };
  });
}
