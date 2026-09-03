import { createHash } from "node:crypto";

export type ProfessionalVerificationStatus = "verified" | "rejected" | "exception";

export type ProfessionalVerificationInput = {
  name: string;
  licenseNumber: string;
  barAssociation: string;
  documentStorageKey: string;
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

export function calculateDocumentHash(storageKey: string): string {
  // This is a reference hash, not a claim that the underlying object bytes were
  // hashed. Byte-level hashing belongs in the trusted upload/storage pipeline.
  return createHash("sha256").update(storageKey, "utf8").digest("hex");
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
      documentHash: calculateDocumentHash(input.documentStorageKey),
    };
  }
  return provider.verify(input);
}
