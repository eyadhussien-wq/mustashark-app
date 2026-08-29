import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { lawyerVerificationsTable, usersTable } from "@workspace/db/schema";

/**
 * Single authority for lawyer operational eligibility.
 *
 * A lawyer is operationally eligible only when both independent authorities
 * agree: professional verification is approved and the user account is active.
 * Missing verification is intentionally treated as not eligible.
 */
export const isLawyerOperationallyEligible = async (userId: string): Promise<boolean> => {
  const [lawyer] = await db
    .select({
      accountStatus: usersTable.accountStatus,
      verificationStatus: lawyerVerificationsTable.status,
    })
    .from(usersTable)
    .leftJoin(lawyerVerificationsTable, eq(lawyerVerificationsTable.userId, usersTable.id))
    .where(and(eq(usersTable.id, userId), eq(usersTable.role, "lawyer")))
    .limit(1);

  return lawyer?.accountStatus === "active" && lawyer.verificationStatus === "approved";
};

export const isApprovedLawyerVerification = (status: string | null | undefined) => status === "approved";
