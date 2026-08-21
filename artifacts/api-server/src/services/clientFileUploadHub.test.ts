import assert from "node:assert/strict";
import test from "node:test";
import { Buffer } from "node:buffer";
import {
  CLIENT_FILE_UPLOAD_MAX_BYTES,
  authorizeClientFileUpload,
  prepareClientFileUpload,
} from "./clientFileUploadHub";

test("rejects upload without trusted membership and ownership", () => {
  assert.throws(
    () =>
      authorizeClientFileUpload({
        actor: { userId: "lawyer-1", role: "lawyer" },
        clientId: "client-1",
        membershipVerified: false,
        ownershipVerified: true,
      }),
    { message: "FORBIDDEN" },
  );

  assert.throws(
    () =>
      authorizeClientFileUpload({
        actor: { userId: "lawyer-1", role: "lawyer" },
        clientId: "client-1",
        membershipVerified: true,
        ownershipVerified: false,
      }),
    { message: "FORBIDDEN" },
  );
});

test("rejects client-id mismatch even when authorization is valid", async () => {
  await assert.rejects(
    prepareClientFileUpload(
      {
        file: Buffer.from("receipt"),
        fileName: "receipt.pdf",
        mimeType: "application/pdf",
        clientId: "client-2",
      },
      {
        actor: { userId: "lawyer-1", role: "lawyer" },
        clientId: "client-1",
        membershipVerified: true,
        ownershipVerified: true,
      },
    ),
    { message: "FORBIDDEN" },
  );
});

test("prepares an upload without persistence and preserves human review", async () => {
  let parserCalled = false;
  const result = await prepareClientFileUpload(
    {
      file: Buffer.from("receipt"),
      fileName: "receipt.pdf",
      mimeType: "application/pdf",
      clientId: "client-1",
      caseId: "case-1",
    },
    {
      actor: { userId: "lawyer-1", role: "lawyer" },
      clientId: "client-1",
      caseId: "case-1",
      membershipVerified: true,
      ownershipVerified: true,
    },
    {
      async analyze(input) {
        parserCalled = true;
        assert.equal(input.documentType, "generic");
        return [{ field: "case_number", value: "2026/1", confidence: 0.94, source: "ocr" }];
      },
    },
  );

  assert.equal(parserCalled, true);
  assert.equal(result.persisted, false);
  assert.equal(result.humanReviewRequired, true);
  assert.equal(result.clientId, "client-1");
  assert.equal(result.caseId, "case-1");
  assert.equal(result.parserResult?.candidates[0]?.value, "2026/1");
  assert.match(result.contentSha256, /^[a-f0-9]{64}$/);
});

test("rejects oversized files before parser invocation", async () => {
  let parserCalled = false;

  await assert.rejects(
    prepareClientFileUpload(
      {
        file: Buffer.alloc(CLIENT_FILE_UPLOAD_MAX_BYTES + 1),
        fileName: "large.pdf",
        mimeType: "application/pdf",
        clientId: "client-1",
      },
      {
        actor: { userId: "lawyer-1", role: "lawyer" },
        clientId: "client-1",
        membershipVerified: true,
        ownershipVerified: true,
      },
      {
        async analyze() {
          parserCalled = true;
          return [];
        },
      },
    ),
    { message: "DOCUMENT_FILE_TOO_LARGE" },
  );

  assert.equal(parserCalled, false);
});
