import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  milestoneProofsTable,
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

export type DisputeMilestoneReleaseResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; releaseRequest: unknown; proof: unknown; milestone: unknown } }
  | { error: "release_request_not_found" | "forbidden" | "dispute_reason_required" | "milestone_not_disputable" };

/**
 * Locks a release request into dispute before release. No financial amount is
 * accepted from the client and no money moves during dispute creation. The
 * request, proof and milestone states change atomically so release/refund
 * guards cannot bypass the dispute.
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

    const now = new Date();
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

    const body = { ok: true as const, releaseRequest: updatedRequest, proof: updatedProof, milestone: updatedMilestone };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
