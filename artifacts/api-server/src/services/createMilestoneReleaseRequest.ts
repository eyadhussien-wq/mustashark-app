import { and, eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  milestoneProofsTable,
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { getReviewDeadline } from "./representationFinance";
import type { Request } from "express";

export type CreateMilestoneReleaseRequestResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 201; body: { ok: true; releaseRequest: unknown; proof: unknown; milestone: unknown } }
  | {
      error:
        | "milestone_not_found"
        | "proof_not_found"
        | "forbidden"
        | "proof_not_requestable"
        | "release_request_already_exists";
    };

/**
 * Creates the client-owned release request only for a submitted proof belonging
 * to the milestone's assigned lawyer. Proof/request creation is one atomic
 * state transition, so a release cannot bypass proof submission.
 */
export async function createMilestoneReleaseRequest(
  req: Request,
  milestoneId: string,
  proofId: string,
  clientId: string,
): Promise<CreateMilestoneReleaseRequestResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    const [row] = await tx
      .select({
        milestone: representationMilestonesTable,
        quote: representationQuotesTable,
        proof: milestoneProofsTable,
      })
      .from(representationMilestonesTable)
      .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
      .innerJoin(
        milestoneProofsTable,
        and(
          eq(milestoneProofsTable.milestoneId, representationMilestonesTable.id),
          eq(milestoneProofsTable.id, proofId),
        ),
      )
      .where(eq(representationMilestonesTable.id, milestoneId))
      .limit(1)
      .for("update");

    if (!row) return { error: "milestone_not_found" };
    if (row.quote.clientId !== clientId) return { error: "forbidden" };
    if (row.proof.milestoneId !== row.milestone.id || row.proof.lawyerId !== row.quote.lawyerId) {
      return { error: "forbidden" };
    }
    if (row.proof.status !== "submitted" || row.milestone.status !== "proof_submitted") {
      return { error: "proof_not_requestable" };
    }

    const [existing] = await tx
      .select({ id: milestoneReleaseRequestsTable.id })
      .from(milestoneReleaseRequestsTable)
      .where(and(
        eq(milestoneReleaseRequestsTable.milestoneId, milestoneId),
        eq(milestoneReleaseRequestsTable.proofId, proofId),
      ))
      .limit(1);

    if (existing) return { error: "release_request_already_exists" };

    const now = new Date();
    const [releaseRequest] = await tx
      .insert(milestoneReleaseRequestsTable)
      .values({
        id: randomUUID(),
        milestoneId: row.milestone.id,
        proofId: row.proof.id,
        clientId,
        lawyerId: row.quote.lawyerId,
        status: "pending",
        reviewDeadlineAt: getReviewDeadline(now),
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!releaseRequest) throw new Error("RELEASE_REQUEST_CREATE_FAILED");

    const [updatedMilestone] = await tx
      .update(representationMilestonesTable)
      .set({ status: "under_review", updatedAt: now })
      .where(and(
        eq(representationMilestonesTable.id, row.milestone.id),
        eq(representationMilestonesTable.status, "proof_submitted"),
      ))
      .returning();

    if (!updatedMilestone) throw new Error("MILESTONE_REVIEW_TRANSITION_FAILED");

    const body = {
      ok: true as const,
      releaseRequest,
      proof: row.proof,
      milestone: updatedMilestone,
    };
    await persistIdempotencyResponse(tx, req, clientId, 201, body);
    return { replay: false as const, status: 201 as const, body };
  });
}
