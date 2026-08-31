import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { milestoneProofsTable, milestoneReleaseRequestsTable, representationMilestonesTable, representationQuotesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { lockEscrowForMilestone } from "../lib/financialGuards";
import type { Request } from "express";

export type DisputeMilestoneReleaseResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; releaseRequest: unknown; proof: unknown; milestone: unknown } }
  | { error: "release_request_not_found" | "forbidden" | "dispute_reason_required" | "milestone_not_disputable" };

export async function disputeMilestoneRelease(req: Request, releaseRequestId: string, clientId: string, disputeReason: string): Promise<DisputeMilestoneReleaseResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;
    const normalizedReason = disputeReason.trim();
    if (!normalizedReason) return { error: "dispute_reason_required" };

    const [request] = await tx.select().from(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.id, releaseRequestId)).limit(1);
    if (!request) return { error: "release_request_not_found" };

    const locked = await lockEscrowForMilestone(tx, request.milestoneId);
    if (!locked) return { error: "release_request_not_found" };

    const [lockedRequest] = await tx.select().from(milestoneReleaseRequestsTable).where(eq(milestoneReleaseRequestsTable.id, releaseRequestId)).limit(1).for("update");
    if (!lockedRequest) return { error: "release_request_not_found" };

    const [quote] = await tx.select().from(representationQuotesTable).where(eq(representationQuotesTable.id, locked.milestone.quoteId)).limit(1);
    const [proof] = await tx.select().from(milestoneProofsTable).where(eq(milestoneProofsTable.id, lockedRequest.proofId)).limit(1).for("update");
    if (!quote || !proof) return { error: "release_request_not_found" };
    if (lockedRequest.clientId !== clientId || quote.clientId !== clientId) return { error: "forbidden" };
    if (lockedRequest.status !== "pending" || locked.milestone.status !== "under_review" || proof.status !== "submitted") return { error: "milestone_not_disputable" };

    const now = new Date();
    const [updatedRequest] = await tx.update(milestoneReleaseRequestsTable).set({ status: "disputed", disputeReason: normalizedReason, decidedAt: now, updatedAt: now }).where(and(
      eq(milestoneReleaseRequestsTable.id, lockedRequest.id), eq(milestoneReleaseRequestsTable.status, "pending"),
    )).returning();
    if (!updatedRequest) throw new Error("RELEASE_REQUEST_DISPUTE_TRANSITION_FAILED");

    const [updatedProof] = await tx.update(milestoneProofsTable).set({ status: "disputed" }).where(and(
      eq(milestoneProofsTable.id, proof.id), eq(milestoneProofsTable.status, "submitted"),
    )).returning();
    if (!updatedProof) throw new Error("PROOF_DISPUTE_TRANSITION_FAILED");

    const [updatedMilestone] = await tx.update(representationMilestonesTable).set({ status: "disputed", updatedAt: now }).where(and(
      eq(representationMilestonesTable.id, locked.milestone.id), eq(representationMilestonesTable.status, "under_review"),
    )).returning();
    if (!updatedMilestone) throw new Error("MILESTONE_DISPUTE_TRANSITION_FAILED");

    const body = { ok: true as const, releaseRequest: updatedRequest, proof: updatedProof, milestone: updatedMilestone };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
