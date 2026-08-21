import { createHash } from "node:crypto";
import { Buffer } from "node:buffer";
import type { DocumentParserResult, DocumentParserProvider, SupportedDocumentMimeType } from "./documentParser";
import { parseDocument } from "./documentParser";

export type ClientFileUploadActor = {
  userId: string;
  role: "client" | "lawyer" | "admin";
};

export type ClientFileUploadAuthorization = {
  actor: ClientFileUploadActor;
  clientId: string;
  caseId?: string;
  membershipVerified: boolean;
  ownershipVerified: boolean;
};

export type ClientFileUploadInput = {
  file: Buffer;
  fileName: string;
  mimeType: SupportedDocumentMimeType;
  clientId: string;
  caseId?: string;
  documentType?: "generic" | "jordan_bar_association_id";
};

export type ClientFileUploadPreparation = {
  uploadId: string;
  clientId: string;
  caseId?: string;
  fileName: string;
  mimeType: SupportedDocumentMimeType;
  sizeBytes: number;
  contentSha256: string;
  persisted: false;
  humanReviewRequired: true;
  parserResult?: DocumentParserResult;
};

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

const newUploadId = (file: Buffer) =>
  `upload_${createHash("sha256").update(file).digest("hex").slice(0, 24)}`;

export const authorizeClientFileUpload = (
  authorization: ClientFileUploadAuthorization,
): void => {
  if (!authorization.actor.userId) throw new Error("UNAUTHORIZED");
  if (!authorization.clientId) throw new Error("CLIENT_ID_REQUIRED");
  if (!authorization.membershipVerified || !authorization.ownershipVerified) {
    throw new Error("FORBIDDEN");
  }
};

/**
 * Z01-J boundary service. It validates and fingerprints a file and may invoke
 * the Z01-I parser, but it deliberately does not persist bytes, metadata,
 * candidates, or client/case changes anywhere.
 *
 * The authorization flags must come from a trusted server-side membership /
 * ownership resolver. They are intentionally not inferred from request input.
 */
export const prepareClientFileUpload = async (
  input: ClientFileUploadInput,
  authorization: ClientFileUploadAuthorization,
  provider?: DocumentParserProvider,
): Promise<ClientFileUploadPreparation> => {
  authorizeClientFileUpload(authorization);

  if (authorization.clientId !== input.clientId) {
    throw new Error("FORBIDDEN");
  }

  if (!Buffer.isBuffer(input.file) || input.file.length === 0) {
    throw new Error("DOCUMENT_FILE_REQUIRED");
  }

  if (input.file.length > MAX_UPLOAD_BYTES) {
    throw new Error("DOCUMENT_FILE_TOO_LARGE");
  }

  if (!input.fileName.trim()) {
    throw new Error("DOCUMENT_FILE_NAME_REQUIRED");
  }

  const result = provider
    ? await parseDocument(
        {
          file: input.file,
          fileName: input.fileName,
          mimeType: input.mimeType,
          documentType: input.documentType,
        },
        provider,
      )
    : undefined;

  return {
    uploadId: newUploadId(input.file),
    clientId: input.clientId,
    caseId: input.caseId,
    fileName: input.fileName.trim(),
    mimeType: input.mimeType,
    sizeBytes: input.file.length,
    contentSha256: createHash("sha256").update(input.file).digest("hex"),
    persisted: false,
    humanReviewRequired: true,
    ...(result ? { parserResult: result } : {}),
  };
};

export const CLIENT_FILE_UPLOAD_MAX_BYTES = MAX_UPLOAD_BYTES;
