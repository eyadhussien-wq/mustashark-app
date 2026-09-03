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
  verify(input: ProfessionalVerificationInput): Promise<ProfessionalVerificationResult>;
}

function normalize(value: string): string {
  return value.trim().toLocaleLowerCase("ar").replace(/[\s\-_/().،,:]+/g, "");
}

export function calculateDocumentHash(storageKey: string): string {
  return createHash("sha256").update(storageKey, "utf8").digest("hex");
}

/**
 * Provider orchestration boundary. Only providers that are explicitly configured
 * for a public/authorized source may be invoked. A missing provider never grants
 * professional access; it produces an exception result instead.
 */
export async function verifyProfessionalStatus(input: ProfessionalVerificationInput): Promise<ProfessionalVerificationResult> {
  const provider = getConfiguredProvider(input.barAssociation);
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

function getConfiguredProvider(barAssociation: string): ProfessionalVerificationProvider | null {
  // Providers are deliberately opt-in. Do not silently scrape or call a source
  // merely because a public web page exists.
  if (normalize(barAssociation).includes("نقابةالمحامينالأردنيين") || normalize(barAssociation).includes("jordanbarassociation")) {
    return null;
  }
  return null;
}
