import { and, eq, sql } from "drizzle-orm";
import {
  escrowAccountsTable,
  escrowTransactionsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";

export async function lockEscrowForMilestone(tx: any, milestoneId: string) {
  const [identity] = await tx
    .select({ escrowId: escrowAccountsTable.id, milestoneId: representationMilestonesTable.id })
    .from(representationMilestonesTable)
    .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
    .innerJoin(escrowAccountsTable, eq(escrowAccountsTable.quoteId, representationQuotesTable.id))
    .where(eq(representationMilestonesTable.id, milestoneId))
    .limit(1);

  if (!identity) return null;

  const [escrow] = await tx
    .select()
    .from(escrowAccountsTable)
    .where(eq(escrowAccountsTable.id, identity.escrowId))
    .limit(1)
    .for("update");

  if (!escrow) return null;

  const [milestone] = await tx
    .select()
    .from(representationMilestonesTable)
    .where(eq(representationMilestonesTable.id, milestoneId))
    .limit(1)
    .for("update");

  if (!milestone) return null;

  return { escrow, milestone };
}

export async function assertEscrowCapacity(
  tx: any,
  escrowId: string,
  amount: string | number,
) {
  const [row] = await tx
    .select({ id: escrowAccountsTable.id })
    .from(escrowAccountsTable)
    .where(and(
      eq(escrowAccountsTable.id, escrowId),
      sql`${escrowAccountsTable.depositedAmount} - ${escrowAccountsTable.allocatedAmount} - ${escrowAccountsTable.refundedAmount} >= ${amount}`,
    ))
    .limit(1);

  return Boolean(row);
}

export async function assertMilestoneSettlementCapacity(
  tx: any,
  escrowId: string,
  milestoneId: string,
  amount: string | number,
) {
  const [row] = await tx
    .select({
      allocated: sql<string>`COALESCE(SUM(CASE WHEN ${escrowTransactionsTable.type} = 'stage_allocation' AND ${escrowTransactionsTable.status} = 'posted' THEN ${escrowTransactionsTable.amount} ELSE 0 END), 0)`,
      released: sql<string>`COALESCE(SUM(CASE WHEN ${escrowTransactionsTable.type} = 'release' AND ${escrowTransactionsTable.status} = 'posted' THEN ${escrowTransactionsTable.amount} ELSE 0 END), 0)`,
      refunded: sql<string>`COALESCE(SUM(CASE WHEN ${escrowTransactionsTable.type} = 'refund' AND ${escrowTransactionsTable.status} = 'posted' THEN ${escrowTransactionsTable.amount} ELSE 0 END), 0)`,
    })
    .from(escrowTransactionsTable)
    .where(and(
      eq(escrowTransactionsTable.escrowAccountId, escrowId),
      eq(escrowTransactionsTable.milestoneId, milestoneId),
    ));

  if (!row) return false;

  return Number(row.released) + Number(row.refunded) + Number(amount) <= Number(row.allocated);
}
