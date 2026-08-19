import { and, eq, gt, inArray, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import {
  escrowAccountsTable,
  lawyerProposalsTable,
  lawyerSettingsTable,
  representationMilestonesTable,
  representationQuoteRequestsTable,
  representationQuotesTable,
} from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { generateRepresentationMilestones } from "./representationFinance";
import type { Request } from "express";

const ACTIVE_REQUEST_STATUSES = ["submitted", "under_review"] as const;
type FundingMode = "full" | "per_stage";

export type AcceptLawyerProposalResult =
  | { replay: true; status: number; body: unknown }
  | {
      replay: false;
      status: 200;
      body: {
        ok: true;
        proposal: unknown;
        quote: unknown;
        milestones: unknown[];
        escrowAccount: unknown;
      };
    }
  | { error: "proposal_not_found" | "forbidden" | "request_not_available" | "proposal_expired" | "proposal_transition_conflict" | "request_already_converted" };

/**
 * S02.3 application orchestration boundary.
 *
 * This transaction owns only the internal acceptance/funding initialization
 * state. No external payment provider is called here; any external payment
 * capability must run after this transaction commits.
 */
export async function acceptLawyerProposalAndInitializeFunding(
  req: Request,
  requestId: string,
  proposalId: string,
  clientId: string,
): Promise<AcceptLawyerProposalResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, clientId);
    if (idempotency.replay) return idempotency;

    // Serialize all accept attempts for the same quote request. This prevents
    // two different proposals from both creating a financial quote for one
    // request while preserving the proposal-level conditional update below.
    const [request] = await tx
      .select({
        id: representationQuoteRequestsTable.id,
        clientId: representationQuoteRequestsTable.clientId,
        lawyerId: representationQuoteRequestsTable.lawyerId,
        quoteId: representationQuoteRequestsTable.quoteId,
        title: representationQuoteRequestsTable.title,
        description: representationQuoteRequestsTable.description,
        status: representationQuoteRequestsTable.status,
      })
      .from(representationQuoteRequestsTable)
      .where(eq(representationQuoteRequestsTable.id, requestId))
      .limit(1)
      .for("update");

    if (!request) return { error: "proposal_not_found" };
    if (request.clientId !== clientId) return { error: "forbidden" };
    if (request.quoteId || request.status === "converted_to_quote") {
      return { error: "request_already_converted" };
    }
    if (!ACTIVE_REQUEST_STATUSES.includes(request.status as (typeof ACTIVE_REQUEST_STATUSES)[number])) {
      return { error: "request_not_available" };
    }

    const [proposal] = await tx
      .select({
        id: lawyerProposalsTable.id,
        requestId: lawyerProposalsTable.requestId,
        lawyerId: lawyerProposalsTable.lawyerId,
        amount: lawyerProposalsTable.amount,
        currency: lawyerProposalsTable.currency,
        status: lawyerProposalsTable.status,
        expiresAt: lawyerProposalsTable.expiresAt,
      })
      .from(lawyerProposalsTable)
      .where(and(
        eq(lawyerProposalsTable.id, proposalId),
        eq(lawyerProposalsTable.requestId, requestId),
      ))
      .limit(1)
      .for("update");

    if (!proposal) return { error: "proposal_not_found" };

    const now = new Date();
    if (proposal.status === "submitted" && (!proposal.expiresAt || now >= proposal.expiresAt)) {
      await tx
        .update(lawyerProposalsTable)
        .set({ status: "expired", updatedAt: now })
        .where(and(
          eq(lawyerProposalsTable.id, proposal.id),
          eq(lawyerProposalsTable.status, "submitted"),
          lte(lawyerProposalsTable.expiresAt, now),
        ));
      return { error: "proposal_expired" };
    }

    const [updatedProposal] = await tx
      .update(lawyerProposalsTable)
      .set({ status: "accepted", updatedAt: now })
      .where(and(
        eq(lawyerProposalsTable.id, proposal.id),
        eq(lawyerProposalsTable.status, "submitted"),
        gt(lawyerProposalsTable.expiresAt, now),
      ))
      .returning();

    if (!updatedProposal) return { error: "proposal_transition_conflict" };

    const [settings] = await tx
      .select({ representationInstallmentsEnabled: lawyerSettingsTable.representationInstallmentsEnabled })
      .from(lawyerSettingsTable)
      .where(eq(lawyerSettingsTable.lawyerId, proposal.lawyerId))
      .limit(1);

    const fundingMode: FundingMode = settings?.representationInstallmentsEnabled ? "per_stage" : "full";
    const totalAmount = Number(proposal.amount);
    if (!Number.isFinite(totalAmount) || totalAmount <= 0) {
      throw new Error("INVALID_AUTHORITATIVE_PROPOSAL_AMOUNT");
    }

    const milestones = generateRepresentationMilestones(totalAmount);
    const quoteId = randomUUID();
    const [quote] = await tx
      .insert(representationQuotesTable)
      .values({
        id: quoteId,
        clientId: request.clientId,
        lawyerId: proposal.lawyerId,
        title: request.title,
        description: request.description,
        totalAmount: proposal.amount,
        currency: proposal.currency,
        status: "funding",
        fundingMode,
        acceptedAt: now,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!quote) throw new Error("REPRESENTATION_QUOTE_CREATE_FAILED");

    const createdMilestones = await tx
      .insert(representationMilestonesTable)
      .values(milestones.map((milestone) => ({
        id: randomUUID(),
        quoteId,
        stage: milestone.stage,
        percentage: milestone.percentage.toFixed(2),
        amount: milestone.amount,
        title: milestone.title,
        status: "awaiting_deposit" as const,
        createdAt: now,
        updatedAt: now,
      })))
      .returning();

    const [escrowAccount] = await tx
      .insert(escrowAccountsTable)
      .values({
        id: randomUUID(),
        quoteId,
        currency: proposal.currency,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (!escrowAccount) throw new Error("ESCROW_ACCOUNT_CREATE_FAILED");

    const [updatedRequest] = await tx
      .update(representationQuoteRequestsTable)
      .set({
        quoteId,
        status: "converted_to_quote",
        updatedAt: now,
      })
      .where(and(
        eq(representationQuoteRequestsTable.id, request.id),
        inArray(representationQuoteRequestsTable.status, ACTIVE_REQUEST_STATUSES),
        eq(representationQuoteRequestsTable.quoteId, request.quoteId),
      ))
      .returning({ id: representationQuoteRequestsTable.id });

    if (!updatedRequest) throw new Error("QUOTE_REQUEST_CONVERSION_FAILED");

    const body = {
      ok: true as const,
      proposal: updatedProposal,
      quote,
      milestones: createdMilestones,
      escrowAccount,
    };
    await persistIdempotencyResponse(tx, req, clientId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
