import { z } from "zod/v4";

const legalDocumentTypeSchema = z.enum(["poa", "court_proof", "expert_report"]);

const issuedAtSchema = z
  .string()
  .datetime({ offset: true })
  .transform((value) => new Date(value));

const legalDocumentMetadataSchema = z
  .record(z.string(), z.unknown())
  .nullable()
  .optional();

export const legalDocumentIdParamsSchema = z
  .object({
    id: z.string().trim().min(1).max(200),
  })
  .strict();

export const agreementLegalDocumentsParamsSchema = z
  .object({
    agreementId: z.string().trim().min(1).max(200),
  })
  .strict();

export const uploadLegalDocumentSchema = z
  .object({
    agreementId: z.string().trim().min(1).max(200),
    documentType: legalDocumentTypeSchema,
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().max(200).nullable().optional(),
    storageKey: z.string().trim().min(1).max(2000),
    content: z.string().min(1),
    title: z.string().trim().min(1).max(500),
    courtName: z.string().trim().max(500).nullable().optional(),
    caseNumberReference: z.string().trim().max(200).nullable().optional(),
    issuedAt: issuedAtSchema.nullable().optional(),
    metadata: legalDocumentMetadataSchema,
  })
  .strict();

export const rejectLegalDocumentSchema = z
  .object({
    rejectionReason: z.string().trim().min(1).max(2000),
  })
  .strict();

export const supersedeLegalDocumentSchema = z
  .object({
    fileName: z.string().trim().min(1).max(255),
    mimeType: z.string().trim().max(200).nullable().optional(),
    storageKey: z.string().trim().min(1).max(2000),
    content: z.string().min(1),
    title: z.string().trim().min(1).max(500),
    courtName: z.string().trim().max(500).nullable().optional(),
    caseNumberReference: z.string().trim().max(200).nullable().optional(),
    issuedAt: issuedAtSchema.nullable().optional(),
    metadata: legalDocumentMetadataSchema,
  })
  .strict();

export type UploadLegalDocumentInput = z.infer<typeof uploadLegalDocumentSchema>;
export type RejectLegalDocumentInput = z.infer<typeof rejectLegalDocumentSchema>;
export type SupersedeLegalDocumentInput = z.infer<typeof supersedeLegalDocumentSchema>;
export type LegalDocumentIdParams = z.infer<typeof legalDocumentIdParamsSchema>;
export type AgreementLegalDocumentsParams = z.infer<typeof agreementLegalDocumentsParamsSchema>;

export function parseUploadLegalDocument(input: unknown) {
  return uploadLegalDocumentSchema.parse(input);
}

export function parseRejectLegalDocument(input: unknown) {
  return rejectLegalDocumentSchema.parse(input);
}

export function parseSupersedeLegalDocument(input: unknown) {
  return supersedeLegalDocumentSchema.parse(input);
}

export function parseLegalDocumentIdParams(input: unknown) {
  return legalDocumentIdParamsSchema.parse(input);
}

export function parseAgreementLegalDocumentsParams(input: unknown) {
  return agreementLegalDocumentsParamsSchema.parse(input);
}
