import assert from "node:assert/strict";
import test from "node:test";
import { Buffer } from "node:buffer";
import {
  DOCUMENT_PARSER_MAX_FILE_BYTES,
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
