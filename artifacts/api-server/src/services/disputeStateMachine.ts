import { and, eq } from "drizzle-orm";
import { db, disputesTable, type Dispute } from "@workspace/db";

export const DISPUTE_LIFECYCLE_STATES = [
  "open",
  "mediation",
  "admin_review",
  "decision_pending",
  "resolution_pending",
  "closed",
] as const;

export type DisputeLifecycleState = (typeof DISPUTE_LIFECYCLE_STATES)[number];
export type DisputeResolutionOutcome = "client" | "lawyer" | "split" | "dismissed";

const transitions: Record<DisputeLifecycleState, readonly DisputeLifecycleState[]> = {
  open: ["mediation"],
  mediation: ["admin_review"],
  admin_review: ["decision_pending"],
  decision_pending: ["resolution_pending"],
  resolution_pending: ["closed"],
  closed: [],
};

export function isAllowedDisputeTransition(from: DisputeLifecycleState, to: DisputeLifecycleState) {
  return transitions[from].includes(to);
}

export async function transitionDispute(
  disputeId: string,
  expectedVersion: number,
  to: DisputeLifecycleState,
  resolutionOutcome?: DisputeResolutionOutcome,
): Promise<Dispute | null> {
  return db.transaction(async (tx) => {
    const [current] = await tx
      .select()
      .from(disputesTable)
      .where(eq(disputesTable.id, disputeId))
      .limit(1);

    if (!current) return null;
    const from = current.lifecycleState as DisputeLifecycleState;
    if (!isAllowedDisputeTransition(from, to)) {
      throw new Error(`dispute_transition_not_allowed:${from}->${to}`);
    }

    if (to === "closed" && !resolutionOutcome) {
      throw new Error("dispute_resolution_outcome_required");
    }
    if (to !== "closed" && resolutionOutcome) {
      throw new Error("dispute_resolution_outcome_forbidden_before_closed");
    }

    const now = new Date();
    const [updated] = await tx
      .update(disputesTable)
      .set({
        lifecycleState: to,
        resolutionOutcome: resolutionOutcome ?? null,
        version: expectedVersion + 1,
        closedAt: to === "closed" ? now : null,
        updatedAt: now,
      })
      .where(
        and(
          eq(disputesTable.id, disputeId),
          eq(disputesTable.version, expectedVersion),
          eq(disputesTable.lifecycleState, from),
        ),
      )
      .returning();

    return updated ?? null;
  });
}
