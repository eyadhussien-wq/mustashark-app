import { randomUUID } from "node:crypto";
import { z } from "zod/v4";
import type { Request } from "express";
import { db, termsConsentAuditTable } from "@workspace/db";

export const TERMS_CONSENT_VERSION = "2026-08-26";

export const termsConsentSchema = z.object({
  termsAccepted: z.literal(true),
  termsAcceptedAt: z.string().datetime({ offset: true }),
});

export function validateTermsConsent(termsAccepted: boolean | undefined, termsAcceptedAt: string | undefined): boolean {
  if (termsAccepted !== true || !termsAcceptedAt) return false;
  const parsed = termsConsentSchema.safeParse({ termsAccepted, termsAcceptedAt });
  if (!parsed.success) return false;
  const acceptedAt = new Date(termsAcceptedAt).getTime();
  return Number.isFinite(acceptedAt) && acceptedAt <= Date.now() + 60_000;
}

export async function auditTermsConsent(
  req: Request,
  data: { flow: "social" | "local"; role: "client" | "lawyer"; userId: string; termsAcceptedAt: string },
) {
  const acceptedAt = new Date(data.termsAcceptedAt);

  await db.insert(termsConsentAuditTable).values({
    id: randomUUID(),
    userId: data.userId,
    flow: data.flow,
    role: data.role,
    consentVersion: TERMS_CONSENT_VERSION,
    acceptedAt,
    createdAt: new Date(),
  });

  void req.log.info({
    auditEvent: "terms_consent",
    flow: data.flow,
    role: data.role,
    userId: data.userId,
    consentVersion: TERMS_CONSENT_VERSION,
    termsAcceptedAt: data.termsAcceptedAt,
  }, "terms and conditions consent accepted");
}
