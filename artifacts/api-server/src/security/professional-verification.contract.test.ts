import assert from "node:assert/strict";
import { test, afterEach } from "node:test";
import {
  registerProfessionalVerificationProvider,
  verifyProfessionalStatus,
  type ProfessionalVerificationProvider,
} from "../services/professionalVerification";

const input = {
  name: "محامٍ تجريبي",
  licenseNumber: "JBA-12345",
  barAssociation: "Test Bar Association",
  documentStorageKey: "private/lawyer-card/test-card.pdf",
};

const provider: ProfessionalVerificationProvider = {
  source: "authorized-public-test-source",
  barAssociations: ["Test Bar Association"],
  async verify(value) {
    return {
      status: value.licenseNumber === "JBA-12345" ? "verified" : "rejected",
      source: "authorized-public-test-source",
      sourceReference: `public:${value.licenseNumber}`,
      sourceStatus: "active",
      verificationMethod: "public_source_match",
      matchedName: value.name,
      matchedLicense: value.licenseNumber,
      confidence: 1,
      reason: value.licenseNumber === "JBA-12345" ? "exact public-source match" : "license mismatch",
      documentHash: "test-document-hash",
    };
  },
};

afterEach(() => {
  // Providers are process-local and this test intentionally runs serially with
  // a single deterministic provider registration.
});

test("C03: no authorized provider means exception and never automatic approval", async () => {
  const result = await verifyProfessionalStatus({ ...input, barAssociation: "Unconfigured Bar" });
  assert.equal(result.status, "exception");
  assert.equal(result.verificationMethod, "source_unavailable");
  assert.equal(result.confidence, 0);
});

test("C03: an explicitly registered authorized public provider can automatically verify an exact match", async () => {
  registerProfessionalVerificationProvider(provider);
  const result = await verifyProfessionalStatus(input);
  assert.equal(result.status, "verified");
  assert.equal(result.verificationMethod, "public_source_match");
  assert.equal(result.source, "authorized-public-test-source");
  assert.equal(result.matchedLicense, input.licenseNumber);
});

test("C03: an authorized provider can reject a professional mismatch", async () => {
  registerProfessionalVerificationProvider(provider);
  const result = await verifyProfessionalStatus({ ...input, licenseNumber: "JBA-99999" });
  assert.equal(result.status, "rejected");
  assert.equal(result.verificationMethod, "public_source_match");
  assert.equal(result.matchedLicense, "JBA-99999");
});
