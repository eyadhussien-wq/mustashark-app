import { and, asc, desc, eq, isNull } from "drizzle-orm";
import { db, lawyerVerificationsTable, usersTable } from "@workspace/db";
import { isApprovedLawyerVerification } from "./lawyerEligibility";

export const lawyerDiscoveryRequiresClientAuth = true as const;

export type ClientLawyer = {
  id: string;
  name: string;
  country: "qatar" | "jordan" | null;
  specialization: string | null;
  litigationTier: string;
  bio: string | null;
  hourlyRate: string | null;
  rating: string | null;
  reviewsCount: number;
};

export async function listClientLawyers(): Promise<ClientLawyer[]> {
  const rows = await db
    .select({
      id: usersTable.id,
      name: usersTable.name,
      country: usersTable.country,
      specialization: usersTable.specialization,
      litigationTier: usersTable.litigationTier,
      bio: usersTable.bio,
      hourlyRate: usersTable.hourlyRate,
      rating: usersTable.rating,
      reviewsCount: usersTable.reviewsCount,
      verificationStatus: lawyerVerificationsTable.status,
    })
    .from(usersTable)
    .innerJoin(
      lawyerVerificationsTable,
      eq(lawyerVerificationsTable.userId, usersTable.id),
    )
    .where(
      and(
        eq(usersTable.role, "lawyer"),
        eq(usersTable.accountStatus, "active"),
        isNull(usersTable.deletedAt),
      ),
    )
    .orderBy(desc(usersTable.rating), asc(usersTable.name));

  return rows
    .filter((row) => isApprovedLawyerVerification(row.verificationStatus))
    .map(({ verificationStatus: _verificationStatus, ...lawyer }) => lawyer);
}
