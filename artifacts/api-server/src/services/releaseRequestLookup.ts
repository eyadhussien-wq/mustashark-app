import { and, eq, sql } from "drizzle-orm";
import { db } from "@workspace/db";
import {
  milestoneReleaseRequestsTable,
  representationMilestonesTable,
  representationQuotesTable,
} from "@workspace/db/schema";

export type ReleaseRequestLookupResult =
  | { ok: true; releaseRequest: typeof milestoneReleaseRequestsTable.$inferSelect }
  | { error: "milestone_not_found" | "release_request_not_found" | "forbidden" };

export async function getReleaseRequestForMilestone(
  milestoneId: string,
  clientId: string,
): Promise<ReleaseRequestLookupResult> {
  const [row] = await db
    .select({
      request: milestoneReleaseRequestsTable,
      milestone: representationMilestonesTable,
      quote: representationQuotesTable,
    })
    .from(representationMilestonesTable)
    .innerJoin(representationQuotesTable, eq(representationQuotesTable.id, representationMilestonesTable.quoteId))
    .leftJoin(
      milestoneReleaseRequestsTable,
      and(
        eq(milestoneReleaseRequestsTable.milestoneId, representationMilestonesTable.id),
        eq(milestoneReleaseRequestsTable.clientId, clientId),
        sql`${milestoneReleaseRequestsTable.status} IN ('pending', 'approved', 'auto_released')`,
      ),
    )
    .where(eq(representationMilestonesTable.id, milestoneId))
    .limit(1);

  if (!row) return { error: "milestone_not_found" };
  if (row.quote.clientId !== clientId) return { error: "forbidden" };
  if (!row.request) return { error: "release_request_not_found" };

  return { ok: true, releaseRequest: row.request };
}
