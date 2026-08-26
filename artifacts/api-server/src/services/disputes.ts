import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { adminAuditLogsTable, disputesTable } from "@workspace/db/schema";
import { claimIdempotency, persistIdempotencyResponse } from "../lib/transactionalIdempotency";
import type { Request } from "express";

export type DisputeTransitionAction =
  | "submit_for_review"
  | "resolve_client"
  | "resolve_lawyer"
  | "resolve_split"
  | "close"
  | "cancel";

export type DisputeTransitionResult =
  | { replay: true; status: number; body: unknown }
  | { replay: false; status: 200; body: { ok: true; dispute: unknown } }
  | { error: "dispute_not_found" | "forbidden" | "invalid_transition" };

export async function getDisputeById(disputeId: string, actorUserId: string, actorRole: string) {
  const [dispute] = await db
    .select()
    .from(disputesTable)
    .where(eq(disputesTable.id, disputeId))
    .limit(1);

  if (!dispute) throw new Error("DISPUTE_NOT_FOUND");
  if (actorRole !== "admin" && dispute.clientId !== actorUserId && dispute.lawyerId !== actorUserId) {
    throw new Error("FORBIDDEN");
  }

  return { dispute };
}

export async function transitionDispute(
  req: Request,
  disputeId: string,
  action: DisputeTransitionAction,
  actorUserId: string,
  actorRole: string,
  resolutionNote?: string,
): Promise<DisputeTransitionResult> {
  return db.transaction(async (tx) => {
    const idempotency = await claimIdempotency(tx, req, actorUserId);
    if (idempotency.replay) return idempotency;

    const [dispute] = await tx
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.id, disputeId))
      .limit(1)
      .for("update");

    if (!dispute) return { error: "dispute_not_found" };
    if (actorRole !== "admin" && dispute.clientId !== actorUserId && dispute.lawyerId !== actorUserId) {
      return { error: "forbidden" };
    }

    const isAdmin = actorRole === "admin";
    const isLawyer = actorRole === "lawyer" && dispute.lawyerId === actorUserId;
    const isClient = actorRole === "client" && dispute.clientId === actorUserId;

    let nextStatus: typeof dispute.status;
    let resolution: typeof dispute.resolution = dispute.resolution;
    const now = new Date();

    if (action === "submit_for_review") {
      if (!(isLawyer || isAdmin) || dispute.status !== "open") return { error: "invalid_transition" };
      nextStatus = "under_review";
    } else if (action === "resolve_client") {
      if (!isAdmin || dispute.status !== "under_review") return { error: "invalid_transition" };
      nextStatus = "resolved_client";
      resolution = "client";
    } else if (action === "resolve_lawyer") {
      if (!isAdmin || dispute.status !== "under_review") return { error: "invalid_transition" };
      nextStatus = "resolved_lawyer";
      resolution = "lawyer";
    } else if (action === "resolve_split") {
      if (!isAdmin || dispute.status !== "under_review") return { error: "invalid_transition" };
      nextStatus = "resolved_split";
      resolution = "split";
    } else if (action === "close") {
      if (!isAdmin || !["resolved_client", "resolved_lawyer", "resolved_split"].includes(dispute.status)) {
        return { error: "invalid_transition" };
      }
      nextStatus = "closed";
    } else {
      if (!(isClient || isAdmin) || dispute.status !== "open") return { error: "invalid_transition" };
      nextStatus = "cancelled";
    }

    const [updatedDispute] = await tx
      .update(disputesTable)
      .set({
        status: nextStatus,
        resolution,
        resolutionNote: resolutionNote?.trim() || dispute.resolutionNote,
        resolvedBy: resolution ? actorUserId : dispute.resolvedBy,
        resolvedAt: resolution ? now : dispute.resolvedAt,
        closedAt: nextStatus === "closed" ? now : dispute.closedAt,
        updatedAt: now,
      })
      .where(and(eq(disputesTable.id, dispute.id), eq(disputesTable.status, dispute.status)))
      .returning();

    if (!updatedDispute) throw new Error("DISPUTE_TRANSITION_CONFLICT");

    if (isAdmin) {
      await tx.insert(adminAuditLogsTable).values({
        id: crypto.randomUUID(),
        adminId: actorUserId,
        action: `dispute.${action}`,
        entityType: "dispute",
        entityId: dispute.id,
        description: `Dispute transitioned from ${dispute.status} to ${nextStatus}`,
        beforeData: { status: dispute.status, resolution: dispute.resolution },
        afterData: { status: updatedDispute.status, resolution: updatedDispute.resolution },
        createdAt: now,
      });
    }

    const body = { ok: true as const, dispute: updatedDispute };
    await persistIdempotencyResponse(tx, req, actorUserId, 200, body);
    return { replay: false as const, status: 200 as const, body };
  });
}
