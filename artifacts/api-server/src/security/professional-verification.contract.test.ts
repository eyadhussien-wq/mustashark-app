import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import {
  calculateDocumentHash,
  registerProfessionalVerificationProvider,
  verifyProfessionalStatus,
  type ProfessionalVerificationProvider,
} from "../services/professionalVerification";

const input = {
  name: "محامٍ تجريبي",
  licenseNumber: "JBA-12345",
  barAssociation: "Test Bar Association",
  documentStorageKey: "private/lawyer-card/test-card.pdf",
  documentHash: "test-document-hash",
};

const provider: ProfessionalVerificationProvider = {
  source: "authorized-public-test-source",
  barAssociations: ["Test Bar Association"],
  async verify(value) {
    const matched = value.licenseNumber === "JBA-12345";
    return {
      status: matched ? "verified" : "rejected",
      source: "authorized-public-test-source",
      sourceReference: `public:${value.licenseNumber}`,
      sourceStatus: "active",
      verificationMethod: "public_source_match",
      matchedName: matched ? value.name : null,
      matchedLicense: matched ? value.licenseNumber : "JBA-12345",
      confidence: matched ? 1 : 0,
      reason: matched ? "exact public-source match" : "license mismatch",
      documentHash: value.documentHash,
    };
  },
};

afterEach(() => {
  // Providers are process-local; registrations are intentionally stable for this contract suite.
});

test("C03: SHA-256 is calculated from actual document bytes", () => {
  const first = new TextEncoder().encode("practice-card-v1");
  const second = new TextEncoder().encode("practice-card-v2");
  const firstHash = calculateDocumentHash(first);
  assert.equal(firstHash, "0e0f7f8f0e8c6b20f3a8d0dc7d18d8b7b9b6c7bde0c5e5f0f6e8a3c9f0f4e0d7");
  assert.notEqual(firstHash, calculateDocumentHash(second));
  assert.equal(firstHash.length, 64);
});

test("C03: no authorized provider means exception and never automatic approval", async () => {
  const result = await verifyProfessionalStatus({ ...input, barAssociation: "Unconfigured Bar" });
  assert.equal(result.status, "exception");
  assert.equal(result.verificationMethod, "source_unavailable");
  assert.equal(result.confidence, 0);
  assert.equal(result.documentHash, input.documentHash);
});

test("C03: an explicitly registered authorized public provider can automatically verify an exact match", async () => {
  registerProfessionalVerificationProvider(provider);
  const result = await verifyProfessionalStatus(input);
  assert.equal(result.status, "verified");
  assert.equal(result.verificationMethod, "public_source_match");
  assert.equal(result.source, "authorized-public-test-source");
  assert.equal(result.matchedLicense, input.licenseNumber);
  assert.equal(result.documentHash, input.documentHash);
});

test("C03: an authorized provider can reject a professional mismatch", async () => {
  registerProfessionalVerificationProvider(provider);
  const result = await verifyProfessionalStatus({ ...input, licenseNumber: "JBA-99999" });
  assert.equal(result.status, "rejected");
  assert.equal(result.verificationMethod, "public_source_match");
  assert.equal(result.matchedLicense, "JBA-12345");
});
