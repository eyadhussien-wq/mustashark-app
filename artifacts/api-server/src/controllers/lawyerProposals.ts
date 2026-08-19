import { Request, Response } from "express";
import { and, eq, exists, gt, inArray, lte } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { db } from "@workspace/db";
import { lawyerProposalsTable, representationQuoteRequestsTable, usersTable } from "@workspace/db/schema";
import { createLawyerProposalSchema, lawyerProposalParamsSchema } from "@workspace/api-zod";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import { acceptLawyerProposalAndInitializeFunding } from "../services/acceptLawyerProposal";

const PROPOSAL_TTL_MS = 24 * 60 * 60 * 1000;
const ACTIVE_PARENT_REQUEST_STATUSES = ["submitted", "under_review"] as const;
type ActorRole = "client" | "lawyer";

function requireActor(req: Request, role: ActorRole): string {
  const userId = req.authUser?.userId;
  if (!userId) throw new Error("AUTHENTICATION_REQUIRED");
  if (req.authUser?.role !== role) throw new Error(`${role.toUpperCase()}_ROLE_REQUIRED`);
  return userId;
}

function parseParams(req: Request) {
  return lawyerProposalParamsSchema.safeParse({ requestId: req.params.requestId, proposalId: req.params.proposalId });
}

function mapError(error: unknown): { status: number; code: string } | null {
  if (!(error instanceof Error)) return null;
  switch (error.message) {
    case "AUTHENTICATION_REQUIRED": return { status: 401, code: "authentication_required" };
    case "CLIENT_ROLE_REQUIRED": return { status: 403, code: "client_role_required" };
    case "LAWYER_ROLE_REQUIRED": return { status: 403, code: "lawyer_role_required" };
    case "IDEMPOTENCY_KEY_REQUIRED": return { status: 400, code: "idempotency_key_required" };
    case "IDEMPOTENCY_REQUEST_MISMATCH": return { status: 409, code: "idempotency_request_mismatch" };
    case "IDEMPOTENCY_REQUEST_IN_PROGRESS": return { status: 409, code: "idempotency_request_in_progress" };
    case "IDEMPOTENCY_CLAIM_FAILED": return { status: 409, code: "idempotency_claim_failed" };
    case "INVALID_AUTHORITATIVE_PROPOSAL_AMOUNT": return { status: 409, code: "invalid_authoritative_proposal_amount" };
    case "REPRESENTATION_QUOTE_CREATE_FAILED": return { status: 500, code: "representation_quote_create_failed" };
    case "ESCROW_ACCOUNT_CREATE_FAILED": return { status: 500, code: "escrow_account_create_failed" };
    case "QUOTE_REQUEST_CONVERSION_FAILED": return { status: 409, code: "quote_request_conversion_failed" };
    default: return null;
  }
}

async function reconcileExpiredProposals(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  requestId: string,
  now: Date,
) {
  await tx.update(lawyerProposalsTable).set({ status: "expired", updatedAt: now }).where(and(
    eq(lawyerProposalsTable.requestId, requestId),
    eq(lawyerProposalsTable.status, "submitted"),
    lte(lawyerProposalsTable.expiresAt, now),
  ));
}

export async function createLawyerProposal(req: Request, res: Response) {
  let lawyerId: string;
  try { lawyerId = requireActor(req, "lawyer"); }
  catch (error) {
    const mapped = mapError(error);
    return res.status(mapped?.status ?? 500).json({ ok: false, error: mapped?.code ?? "internal_server_error" });
  }

  const requestId = String(req.params.requestId ?? "");
  const parsed = createLawyerProposalSchema.safeParse(req.body ?? {});
  if (!requestId || !parsed.success) return res.status(400).json({
    ok: false, error: "invalid_lawyer_proposal", ...(parsed.success ? {} : { issues: parsed.error.issues }),
  });

  try {
    const result = await db.transaction(async (tx) => {
      const [request] = await tx.select({
        id: representationQuoteRequestsTable.id,
        lawyerId: representationQuoteRequestsTable.lawyerId,
        status: representationQuoteRequestsTable.status,
      }).from(representationQuoteRequestsTable).where(eq(representationQuoteRequestsTable.id, requestId)).limit(1);
      if (!request) return { error: "request_not_found" as const };
      if (!ACTIVE_PARENT_REQUEST_STATUSES.includes(request.status as typeof ACTIVE_PARENT_REQUEST_STATUSES[number])) return { error: "request_not_available" as const };
      if (request.lawyerId && request.lawyerId !== lawyerId) return { error: "lawyer_not_authorized_for_request" as const };

      const [lawyer] = await tx.select({ id: usersTable.id }).from(usersTable).where(and(
        eq(usersTable.id, lawyerId), eq(usersTable.role, "lawyer"), eq(usersTable.accountStatus, "active"),
      )).limit(1);
      if (!lawyer) return { error: "lawyer_not_found_or_unavailable" as const };

      const idempotency = await claimIdempotency(tx, req, lawyerId);
      if (idempotency.replay) return idempotency;

      const now = new Date();
      const [created] = await tx.insert(lawyerProposalsTable).values({
        id: randomUUID(), requestId, lawyerId,
        amount: parsed.data.amount, currency: parsed.data.currency,
        status: "submitted", expiresAt: new Date(now.getTime() + PROPOSAL_TTL_MS),
        createdAt: now, updatedAt: now, submittedAt: now,
      }).returning();
      if (!created) throw new Error("LAWYER_PROPOSAL_CREATE_FAILED");

      const responseBody = { ok: true, proposal: created };
      await persistIdempotencyResponse(tx, req, lawyerId, 201, responseBody);
      return { replay: false as const, status: 201, body: responseBody };
    });

    if ("error" in result) return res.status(result.error === "request_not_found" ? 404 : 403).json({ ok: false, error: result.error });
    return res.status(result.status).json(result.body);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) return res.status(mapped.status).json({ ok: false, error: mapped.code });
    console.error("Lawyer Proposal Create Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function listLawyerProposals(req: Request, res: Response) {
  const requestId = String(req.params.requestId ?? "");
  const userId = req.authUser?.userId;
  const role = req.authUser?.role;
  if (!userId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (role !== "client" && role !== "lawyer") return res.status(403).json({ ok: false, error: "role_not_allowed" });

  try {
    const result = await db.transaction(async (tx) => {
      const [request] = await tx.select({ clientId: representationQuoteRequestsTable.clientId, lawyerId: representationQuoteRequestsTable.lawyerId })
        .from(representationQuoteRequestsTable).where(eq(representationQuoteRequestsTable.id, requestId)).limit(1);
      if (!request) return { error: "request_not_found" as const };
      if (role === "client" && request.clientId !== userId) return { error: "forbidden" as const };

      if (role === "lawyer") {
        const isAssignedLawyer = request.lawyerId === userId;
        if (!isAssignedLawyer) {
          const [ownProposal] = await tx.select({ id: lawyerProposalsTable.id })
            .from(lawyerProposalsTable)
            .where(and(eq(lawyerProposalsTable.requestId, requestId), eq(lawyerProposalsTable.lawyerId, userId)))
            .limit(1);
          if (!ownProposal) return { error: "forbidden" as const };
        }
      }

      const now = new Date();
      await reconcileExpiredProposals(tx, requestId, now);
      return { proposals: await tx.select().from(lawyerProposalsTable).where(eq(lawyerProposalsTable.requestId, requestId)) };
    });
    if ("error" in result) return res.status(result.error === "request_not_found" ? 404 : 403).json({ ok: false, error: result.error });
    return res.status(200).json({ ok: true, proposals: result.proposals });
  } catch (error) {
    console.error("Lawyer Proposal List Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function getLawyerProposal(req: Request, res: Response) {
  const parsed = parseParams(req);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_lawyer_proposal_params", issues: parsed.error.issues });
  const userId = req.authUser?.userId;
  const role = req.authUser?.role;
  if (!userId) return res.status(401).json({ ok: false, error: "authentication_required" });
  if (role !== "client" && role !== "lawyer") return res.status(403).json({ ok: false, error: "role_not_allowed" });

  try {
    const result = await db.transaction(async (tx) => {
      const [row] = await tx.select({
        proposal: lawyerProposalsTable, clientId: representationQuoteRequestsTable.clientId,
      }).from(lawyerProposalsTable).innerJoin(representationQuoteRequestsTable,
        eq(representationQuoteRequestsTable.id, lawyerProposalsTable.requestId),
      ).where(and(eq(lawyerProposalsTable.id, parsed.data.proposalId), eq(lawyerProposalsTable.requestId, parsed.data.requestId))).limit(1);
      if (!row) return { error: "proposal_not_found" as const };
      if (role === "client" && row.clientId !== userId) return { error: "forbidden" as const };
      if (role === "lawyer" && row.proposal.lawyerId !== userId) return { error: "forbidden" as const };

      const now = new Date();
      if (row.proposal.status === "submitted" && row.proposal.expiresAt && now >= row.proposal.expiresAt) {
        const [expired] = await tx.update(lawyerProposalsTable).set({ status: "expired", updatedAt: now }).where(and(
          eq(lawyerProposalsTable.id, row.proposal.id), eq(lawyerProposalsTable.status, "submitted"), lte(lawyerProposalsTable.expiresAt, now),
        )).returning();
        return { proposal: expired ?? { ...row.proposal, status: "expired" as const, updatedAt: now } };
      }
      return { proposal: row.proposal };
    });
    if ("error" in result) return res.status(result.error === "proposal_not_found" ? 404 : 403).json({ ok: false, error: result.error });
    return res.status(200).json({ ok: true, proposal: result.proposal });
  } catch (error) {
    console.error("Lawyer Proposal Get Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

async function transitionProposal(req: Request, res: Response, target: "rejected" | "withdrawn") {
  const parsed = parseParams(req);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_lawyer_proposal_params", issues: parsed.error.issues });

  let actorId: string;
  try { actorId = requireActor(req, target === "withdrawn" ? "lawyer" : "client"); }
  catch (error) {
    const mapped = mapError(error);
    return res.status(mapped?.status ?? 500).json({ ok: false, error: mapped?.code ?? "internal_server_error" });
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [row] = await tx.select({
        proposal: lawyerProposalsTable,
        clientId: representationQuoteRequestsTable.clientId,
        parentStatus: representationQuoteRequestsTable.status,
      })
        .from(lawyerProposalsTable).innerJoin(representationQuoteRequestsTable,
          eq(representationQuoteRequestsTable.id, lawyerProposalsTable.requestId),
        ).where(and(eq(lawyerProposalsTable.id, parsed.data.proposalId), eq(lawyerProposalsTable.requestId, parsed.data.requestId))).limit(1);
      if (!row) return { error: "proposal_not_found" as const };
      if (target === "withdrawn" ? row.proposal.lawyerId !== actorId : row.clientId !== actorId) return { error: "forbidden" as const };
      if (!ACTIVE_PARENT_REQUEST_STATUSES.includes(row.parentStatus as typeof ACTIVE_PARENT_REQUEST_STATUSES[number])) {
        return { error: "request_not_available" as const };
      }

      // Claim idempotency before evaluating terminal state so a retry can replay
      // the original successful response even after the proposal is no longer submitted.
      const idempotency = await claimIdempotency(tx, req, actorId);
      if (idempotency.replay) return idempotency;

      const now = new Date();
      if (row.proposal.status === "submitted" && row.proposal.expiresAt && now >= row.proposal.expiresAt) {
        await tx.update(lawyerProposalsTable).set({ status: "expired", updatedAt: now }).where(and(
          eq(lawyerProposalsTable.id, row.proposal.id), eq(lawyerProposalsTable.status, "submitted"), lte(lawyerProposalsTable.expiresAt, now),
        ));
        return { error: "proposal_expired" as const };
      }

      const [updated] = await tx.update(lawyerProposalsTable).set({
        status: target, updatedAt: now, ...(target === "withdrawn" ? { withdrawnAt: now } : {}),
      }).where(and(
        eq(lawyerProposalsTable.id, row.proposal.id),
        eq(lawyerProposalsTable.status, "submitted"),
        gt(lawyerProposalsTable.expiresAt, now),
        exists(tx.select({ id: representationQuoteRequestsTable.id }).from(representationQuoteRequestsTable).where(and(
          eq(representationQuoteRequestsTable.id, row.proposal.requestId),
          inArray(representationQuoteRequestsTable.status, ACTIVE_PARENT_REQUEST_STATUSES),
        )),
      )).returning();
      if (!updated) return { error: "proposal_transition_conflict" as const };

      const responseBody = { ok: true, proposal: updated };
      await persistIdempotencyResponse(tx, req, actorId, 200, responseBody);
      return { replay: false as const, status: 200, body: responseBody };
    });

    if ("error" in result) {
      const status = result.error === "proposal_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) return res.status(mapped.status).json({ ok: false, error: mapped.code });
    console.error("Lawyer Proposal Transition Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export async function acceptLawyerProposal(req: Request, res: Response) {
  const parsed = parseParams(req);
  if (!parsed.success) return res.status(400).json({ ok: false, error: "invalid_lawyer_proposal_params", issues: parsed.error.issues });

  let clientId: string;
  try { clientId = requireActor(req, "client"); }
  catch (error) {
    const mapped = mapError(error);
    return res.status(mapped?.status ?? 500).json({ ok: false, error: mapped?.code ?? "internal_server_error" });
  }

  try {
    const result = await acceptLawyerProposalAndInitializeFunding(
      req,
      parsed.data.requestId,
      parsed.data.proposalId,
      clientId,
    );

    if ("error" in result) {
      const status = result.error === "proposal_not_found" ? 404 : result.error === "forbidden" ? 403 : 409;
      return res.status(status).json({ ok: false, error: result.error });
    }
    return res.status(result.status).json(result.body);
  } catch (error) {
    const mapped = mapError(error);
    if (mapped) return res.status(mapped.status).json({ ok: false, error: mapped.code });
    console.error("Lawyer Proposal Accept Error:", error);
    return res.status(500).json({ ok: false, error: "internal_server_error" });
  }
}

export const rejectLawyerProposal = (req: Request, res: Response) => transitionProposal(req, res, "rejected");
export const withdrawLawyerProposal = (req: Request, res: Response) => transitionProposal(req, res, "withdrawn");
