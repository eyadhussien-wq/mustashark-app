import assert from "node:assert/strict";
import test from "node:test";
import { Buffer } from "node:buffer";
import {
  DOCUMENT_PARSER_MAX_FILE_BYTES,
  JORDAN_BAR_ASSOCIATION_ID_FIELDS,
  parseDocument,
  type DocumentParserProvider,
} from "./documentParser";

const validInput = {
  file: Buffer.from("fake-pdf-bytes"),
  fileName: "judgment.pdf",
  mimeType: "application/pdf" as const,
};

test("returns normalized candidates from the injected AI provider", async () => {
  let receivedBuffer: Buffer | undefined;

  const provider: DocumentParserProvider = {
    async analyze(input) {
      receivedBuffer = input.file;
      return [
        {
          field: " case_number ",
          value: " 2026/123 ",
          confidence: 0.93,
          source: "ocr",
        },
      ];
    },
  };

  const result = await parseDocument(validInput, provider);

  assert.equal(receivedBuffer, validInput.file);
  assert.deepEqual(result, {
    candidates: [
      {
        field: "case_number",
        value: "2026/123",
        confidence: 0.93,
        source: "ocr",
      },
    ],
  });
});

test("passes the Jordan Bar Association ID target fields to the provider", async () => {
  let receivedDocumentType: string | undefined;
  let receivedTargetFields: readonly string[] | undefined;

  const provider: DocumentParserProvider = {
    async analyze(input) {
      receivedDocumentType = input.documentType;
      receivedTargetFields = input.targetFields;
      return [
        { field: "bar_registration_number", value: "JBA-12345", confidence: 0.98, source: "ocr" },
        { field: "full_name_ar", value: "إياد حسين", confidence: 0.96, source: "vision" },
        { field: "full_name_en", value: "Eyad Hussein", confidence: 0.95, source: "vision" },
        { field: "national_number", value: "9900000000", confidence: 0.91, source: "ocr" },
      ];
    },
  };

  const result = await parseDocument(
    {
      ...validInput,
      fileName: "jordan-bar-id.jpg",
      mimeType: "image/jpeg",
      documentType: "jordan_bar_association_id",
    },
    provider,
  );

  assert.equal(receivedDocumentType, "jordan_bar_association_id");
  assert.deepEqual(receivedTargetFields, JORDAN_BAR_ASSOCIATION_ID_FIELDS);
  assert.deepEqual(result.candidates.map(({ field, value }) => ({ field, value })), [
    { field: "bar_registration_number", value: "JBA-12345" },
    { field: "full_name_ar", value: "إياد حسين" },
    { field: "full_name_en", value: "Eyad Hussein" },
    { field: "national_number", value: "9900000000" },
  ]);
});

test("accepts supported image and PDF MIME types", async () => {
  const provider: DocumentParserProvider = {
    async analyze() {
      return [];
    },
  };

  for (const mimeType of [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
  ] as const) {
    const result = await parseDocument(
      { ...validInput, mimeType },
      provider,
    );
    assert.deepEqual(result, { candidates: [] });
  }
});

test("rejects missing and oversized files before calling the provider", async () => {
  let providerCalled = false;
  const provider: DocumentParserProvider = {
    async analyze() {
      providerCalled = true;
      return [];
    },
  };

  await assert.rejects(
    parseDocument({ ...validInput, file: Buffer.alloc(0) }, provider),
    { message: "DOCUMENT_FILE_REQUIRED" },
  );

  await assert.rejects(
    parseDocument(
      { ...validInput, file: Buffer.alloc(DOCUMENT_PARSER_MAX_FILE_BYTES + 1) },
      provider,
    ),
    { message: "DOCUMENT_FILE_TOO_LARGE" },
  );

  assert.equal(providerCalled, false);
});

test("rejects unsupported MIME types before model invocation", async () => {
  let providerCalled = false;
  const provider: DocumentParserProvider = {
    async analyze() {
      providerCalled = true;
      return [];
    },
  };

  await assert.rejects(
    parseDocument(
      { ...validInput, mimeType: "text/plain" as never },
      provider,
    ),
    { message: "UNSUPPORTED_DOCUMENT_MIME_TYPE" },
  );

  assert.equal(providerCalled, false);
});

test("clamps confidence into the safe review range", async () => {
  const provider: DocumentParserProvider = {
    async analyze() {
      return [
        { field: "a", value: "x", confidence: 2, source: "vision" },
        { field: "b", value: "y", confidence: -1, source: "text" },
      ];
    },
  };

  const result = await parseDocument(validInput, provider);

  assert.deepEqual(result.candidates.map((candidate) => candidate.confidence), [1, 0]);
});

test("does not persist or import any database layer", async () => {
  const provider: DocumentParserProvider = {
    async analyze() {
      return [{ field: "client_name", value: "Example", confidence: 0.8, source: "ocr" }];
    },
  };

  const result = await parseDocument(validInput, provider);

  assert.equal(result.candidates[0]?.field, "client_name");
  assert.equal(result.candidates[0]?.value, "Example");
});
