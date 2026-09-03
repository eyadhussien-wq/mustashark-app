import { createHash } from "node:crypto";

export type ProfessionalVerificationStatus = "verified" | "rejected" | "exception";
export type LawyerVerificationState =
  | "pending"
  | "verifying"
  | "approved"
  | "rejected"
  | "exception"
  | "expired"
  | "suspended"
  | "revoked";

export type ProfessionalVerificationInput = {
  name: string;
  licenseNumber: string;
  barAssociation: string;
  documentStorageKey: string;
  documentHash: string;
};

export type ProfessionalVerificationResult = {
  status: ProfessionalVerificationStatus;
  source: string;
  sourceReference: string | null;
  sourceStatus: string | null;
  verificationMethod: "public_source_match" | "document_evidence_only" | "source_unavailable";
  matchedName: string | null;
  matchedLicense: string | null;
  confidence: number;
  reason: string;
  documentHash: string;
};

export interface ProfessionalVerificationProvider {
  readonly source: string;
  readonly barAssociations: readonly string[];
  verify(input: ProfessionalVerificationInput): Promise<ProfessionalVerificationResult>;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ar").replace(/[\s\-_/().،,:]+/g, "");
}

/** SHA-256 over the actual practice-card bytes supplied by the upload request. */
export function calculateDocumentHash(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

const allowedTransitions: Record<LawyerVerificationState, readonly LawyerVerificationState[]> = {
  pending: ["verifying", "rejected", "exception"],
  verifying: ["approved", "rejected", "exception"],
  approved: ["verifying", "expired", "suspended", "revoked"],
  rejected: ["pending"],
  exception: ["verifying", "approved", "rejected"],
  expired: ["verifying", "revoked"],
  suspended: ["verifying", "revoked"],
  revoked: ["verifying"],
};

export function canTransitionLawyerVerification(from: LawyerVerificationState, to: LawyerVerificationState): boolean {
  return allowedTransitions[from].includes(to);
}

export function assertLawyerVerificationTransition(from: LawyerVerificationState, to: LawyerVerificationState): void {
  if (!canTransitionLawyerVerification(from, to)) {
    throw new Error(`INVALID_VERIFICATION_TRANSITION:${from}->${to}`);
  }
}

/** A submission always enters the verifying phase before the provider decision. */
export function assertVerificationSubmissionTransition(
  from: LawyerVerificationState,
  decision: Exclude<LawyerVerificationState, "pending" | "verifying">,
): void {
  if (from === "rejected") assertLawyerVerificationTransition(from, "pending");
  else assertLawyerVerificationTransition(from, "verifying");
  assertLawyerVerificationTransition("pending" === from ? "verifying" : from === "rejected" ? "pending" : "verifying", decision);
}

const providers = new Map<string, ProfessionalVerificationProvider>();

/** Register only an explicitly authorized public-source provider at application bootstrap. */
export function registerProfessionalVerificationProvider(provider: ProfessionalVerificationProvider): void {
  for (const association of provider.barAssociations) providers.set(normalize(association), provider);
}

export async function verifyProfessionalStatus(input: ProfessionalVerificationInput): Promise<ProfessionalVerificationResult> {
  const provider = providers.get(normalize(input.barAssociation));
  if (!provider) {
    return {
      status: "exception",
      source: "none",
      sourceReference: null,
      sourceStatus: null,
      verificationMethod: "source_unavailable",
      matchedName: null,
      matchedLicense: null,
      confidence: 0,
      reason: "No authorized public professional verification source is configured for this bar association.",
      documentHash: input.documentHash,
    };
  }
  return provider.verify(input);
}
