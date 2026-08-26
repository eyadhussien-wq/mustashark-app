import { z } from "zod/v4";
import type { Request } from "express";

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

// The authentication controller currently invokes this helper before the Local
// insert and after the Social insert. Keep the current contract source-compatible
// while removing raw PII from the security log. Durable DB evidence is added in
// the schema and must be wired from the post-insert creation points before merge.
export function auditTermsConsent(
  req: Request,
  data: { flow: "social" | "local"; role: "client" | "lawyer"; email: string; termsAcceptedAt: string },
) {
  void req.log.info({
    auditEvent: "terms_consent",
    flow: data.flow,
    role: data.role,
    consentVersion: TERMS_CONSENT_VERSION,
    termsAcceptedAt: data.termsAcceptedAt,
  }, "terms and conditions consent accepted");
}
