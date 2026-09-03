import { createHash, randomUUID } from "node:crypto";
import { and, desc, eq, lte } from "drizzle-orm";
import { db, termsConsentsTable, termsVersionsTable } from "@workspace/db";

export function sha256(content: string): string {
  return createHash("sha256").update(content, "utf8").digest("hex");
}

export async function getCurrentMandatoryTerms(now = new Date()) {
  const rows = await db
    .select()
    .from(termsVersionsTable)
    .where(
      and(
        eq(termsVersionsTable.status, "published"),
        eq(termsVersionsTable.mandatory, true),
        lte(termsVersionsTable.effectiveAt, now),
      ),
    )
    .orderBy(desc(termsVersionsTable.version))
    .limit(1);
  return rows[0] ?? null;
}

export async function hasCurrentMandatoryTermsConsent(userId: string, now = new Date()) {
  const current = await getCurrentMandatoryTerms(now);
  if (!current) return { allowed: false as const, reason: "terms_not_configured" as const, current: null };

  const rows = await db
    .select({ consent: termsConsentsTable, version: termsVersionsTable })
    .from(termsConsentsTable)
    .innerJoin(termsVersionsTable, eq(termsConsentsTable.termsVersionId, termsVersionsTable.id))
    .where(
      and(
        eq(termsConsentsTable.userId, userId),
        eq(termsConsentsTable.termsVersionId, current.id),
      ),
    )
    .limit(1);

  const record = rows[0];
  if (!record) return { allowed: false as const, reason: "consent_required" as const, current };
  if (record.consent.contentHash.toLowerCase() !== current.contentHash.toLowerCase()) {
    return { allowed: false as const, reason: "consent_evidence_mismatch" as const, current };
  }
  return { allowed: true as const, reason: "current_consent" as const, current };
}

export async function recordTermsConsent(params: {
  userId: string;
  termsVersionId: string;
  contentHash: string;
  source: "registration" | "settings" | "required_action";
  ipAddress?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}) {
  const versionRows = await db
    .select()
    .from(termsVersionsTable)
    .where(eq(termsVersionsTable.id, params.termsVersionId))
    .limit(1);
  const version = versionRows[0];
  if (!version || version.status !== "published" || !version.mandatory) {
    throw new Error("invalid_terms_version");
  }
  if (version.contentHash.toLowerCase() !== params.contentHash.toLowerCase()) {
    throw new Error("terms_content_hash_mismatch");
  }

  const [consent] = await db
    .insert(termsConsentsTable)
    .values({
      id: randomUUID(),
      userId: params.userId,
      termsVersionId: version.id,
      version: version.version,
      contentHash: version.contentHash,
      source: params.source,
      ipAddress: params.ipAddress ?? null,
      userAgent: params.userAgent ?? null,
      metadata: params.metadata ?? null,
    })
    .onConflictDoNothing({
      target: [termsConsentsTable.userId, termsConsentsTable.termsVersionId],
    })
    .returning();

  return consent ?? (await db.select().from(termsConsentsTable).where(and(eq(termsConsentsTable.userId, params.userId), eq(termsConsentsTable.termsVersionId, version.id))).limit(1))[0] ?? null;
}
