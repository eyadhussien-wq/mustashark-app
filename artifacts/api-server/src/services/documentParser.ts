import { Buffer } from "node:buffer";

export type SupportedDocumentMimeType =
  | "application/pdf"
  | "image/jpeg"
  | "image/png"
  | "image/webp";

export type DocumentCandidateSource = "ocr" | "vision" | "metadata" | "text";

export type DocumentParserDocumentType = "generic" | "jordan_bar_association_id";

export type JordanBarAssociationField =
  | "bar_registration_number"
  | "full_name_ar"
  | "full_name_en"
  | "national_number";

export type DocumentCandidate = {
  field: string;
  value: string;
  confidence: number;
  source: DocumentCandidateSource;
};

export type DocumentParserInput = {
  file: Buffer;
  fileName: string;
  mimeType: SupportedDocumentMimeType;
  documentType?: DocumentParserDocumentType;
};

export type DocumentParserProviderInput = DocumentParserInput & {
  targetFields: readonly string[];
};

export type DocumentParserProvider = {
  analyze: (
    input: DocumentParserProviderInput,
  ) => Promise<readonly DocumentCandidate[]>;
};

export type DocumentParserResult = {
  candidates: DocumentCandidate[];
};

export const JORDAN_BAR_ASSOCIATION_ID_FIELDS: readonly JordanBarAssociationField[] = [
  "bar_registration_number",
  "full_name_ar",
  "full_name_en",
  "national_number",
];

const MAX_DOCUMENT_BYTES = 10 * 1024 * 1024;

const SUPPORTED_MIME_TYPES = new Set<SupportedDocumentMimeType>([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
]);

const isSupportedMimeType = (
  mimeType: string,
): mimeType is SupportedDocumentMimeType =>
  SUPPORTED_MIME_TYPES.has(mimeType as SupportedDocumentMimeType);

const normalizeCandidate = (candidate: DocumentCandidate): DocumentCandidate => {
  const field = candidate.field.trim();
  const value = candidate.value.trim();

  if (!field) throw new Error("PARSER_CANDIDATE_FIELD_REQUIRED");
  if (!value) throw new Error("PARSER_CANDIDATE_VALUE_REQUIRED");
  if (!Number.isFinite(candidate.confidence)) {
    throw new Error("PARSER_CANDIDATE_CONFIDENCE_INVALID");
  }

  return {
    field,
    value,
    confidence: Math.min(1, Math.max(0, candidate.confidence)),
    source: candidate.source,
  };
};

const getTargetFields = (
  documentType: DocumentParserDocumentType,
): readonly string[] =>
  documentType === "jordan_bar_association_id"
    ? JORDAN_BAR_ASSOCIATION_ID_FIELDS
    : [];

const defaultProvider: DocumentParserProvider = {
  async analyze() {
    throw new Error("DOCUMENT_PARSER_PROVIDER_NOT_CONFIGURED");
  },
};

/**
 * AI/OCR boundary for Z01-I.
 *
 * This service intentionally has no database imports and no persistence side effects.
 * A provider performs the actual OCR/vision/model inference; this layer validates
 * and normalizes the model output into reviewable candidates for the human-in-the-loop.
 *
 * The Jordan Bar Association ID profile exposes the four fields needed by the
 * lawyer-registration review screen. The provider remains responsible for OCR/
 * vision extraction; this service never writes the extracted values anywhere.
 */
export const parseDocument = async (
  input: DocumentParserInput,
  provider: DocumentParserProvider = defaultProvider,
): Promise<DocumentParserResult> => {
  if (!Buffer.isBuffer(input.file) || input.file.length === 0) {
    throw new Error("DOCUMENT_FILE_REQUIRED");
  }

  if (input.file.length > MAX_DOCUMENT_BYTES) {
    throw new Error("DOCUMENT_FILE_TOO_LARGE");
  }

  if (!input.fileName.trim()) {
    throw new Error("DOCUMENT_FILE_NAME_REQUIRED");
  }

  if (!isSupportedMimeType(input.mimeType)) {
    throw new Error("UNSUPPORTED_DOCUMENT_MIME_TYPE");
  }

  const documentType = input.documentType ?? "generic";
  const candidates = await provider.analyze({
    ...input,
    documentType,
    targetFields: getTargetFields(documentType),
  });

  return {
    candidates: candidates.map(normalizeCandidate),
  };
};

export const DOCUMENT_PARSER_MAX_FILE_BYTES = MAX_DOCUMENT_BYTES;
