import { type Request, type Response } from "express";
import { db, lawyerVerificationsTable, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod/v4";

/**
 * N1.01-A/B: canonical read-only lawyer identity contract.
 *
 * This DTO intentionally exposes only professional/profile state needed by
 * the lawyer command center. Financial authority, bank data, secrets, and
 * verification documents remain outside this contract.
 */
export const lawyerIdentityReadDtoSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().nullable(),
  country: z.enum(["qatar", "jordan"]).nullable(),
  role: z.literal("lawyer"),
  accountStatus: z.enum(["pending", "active", "suspended", "terminated", "rejected", "blocked"]),
  specialization: z.string().nullable(),
  litigationTier: z.string(),
  bio: z.string().nullable(),
  hourlyRate: z.number().nullable(),
  rating: z.number().nullable(),
  reviewsCount: z.number().int().nonnegative(),
  verification: z
    .object({
      status: z.enum(["pending", "approved", "rejected"]),
      licenseNumber: z.string().nullable(),
      barAssociation: z.string().nullable(),
      reviewedAt: z.coerce.date().nullable(),
      rejectionReason: z.string().nullable(),
    })
    .nullable(),
});

export type LawyerIdentityReadDto = z.infer<typeof lawyerIdentityReadDtoSchema>;

export async function getLawyerIdentity(
  req: Request,
  res: Response,
): Promise<Response> {
  const user = req.authUser;
  if (!user || user.role !== "lawyer") {
    return res.status(403).json({ ok: false, error: "lawyer_only" });
  }

  try {
    const [row] = await db
      .select({
        id: usersTable.id,
        name: usersTable.name,
        email: usersTable.email,
        phone: usersTable.phone,
        country: usersTable.country,
        role: usersTable.role,
        accountStatus: usersTable.accountStatus,
        specialization: usersTable.specialization,
        litigationTier: usersTable.litigationTier,
        bio: usersTable.bio,
        hourlyRate: usersTable.hourlyRate,
        rating: usersTable.rating,
        reviewsCount: usersTable.reviewsCount,
        verificationStatus: lawyerVerificationsTable.status,
        verificationLicenseNumber: lawyerVerificationsTable.licenseNumber,
        verificationBarAssociation: lawyerVerificationsTable.barAssociation,
        verificationReviewedAt: lawyerVerificationsTable.reviewedAt,
        verificationRejectionReason: lawyerVerificationsTable.rejectionReason,
      })
      .from(usersTable)
      .leftJoin(
        lawyerVerificationsTable,
        eq(lawyerVerificationsTable.userId, usersTable.id),
      )
      .where(eq(usersTable.id, user.userId))
      .limit(1);

    if (!row || row.role !== "lawyer") {
      return res.status(404).json({ ok: false, error: "lawyer_not_found" });
    }

    const dto: LawyerIdentityReadDto = lawyerIdentityReadDtoSchema.parse({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      country: row.country,
      role: "lawyer",
      accountStatus: row.accountStatus,
      specialization: row.specialization,
      litigationTier: row.litigationTier,
      bio: row.bio,
      hourlyRate: row.hourlyRate === null ? null : Number(row.hourlyRate),
      rating: row.rating === null ? null : Number(row.rating),
      reviewsCount: row.reviewsCount,
      verification: row.verificationStatus
        ? {
            status: row.verificationStatus,
            licenseNumber: row.verificationLicenseNumber,
            barAssociation: row.verificationBarAssociation,
            reviewedAt: row.verificationReviewedAt,
            rejectionReason: row.verificationRejectionReason,
          }
        : null,
    });

    return res.json({ ok: true, identity: dto });
  } catch (err) {
    req.log?.error?.(err, "getLawyerIdentity failed");
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
}
