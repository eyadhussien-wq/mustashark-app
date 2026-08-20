import { z } from "zod/v4";

const legalDocumentTypeSchema = z.enum(["poa", "court_proof", "expert_report"]);
const issuedAtSchema = z.string().datetime({ offset: true }).transform((value) => new Date(value));
const legalDocumentMetadataSchema = z.record(z.string(), z.unknown()).nullable().optional();

export const legalDocumentIdParamsSchema = z.object({ id: z.string().trim().min(1).max(200) }).strict();
export const agreementLegalDocumentsParamsSchema = z.object({ agreementId: z.string().trim().min(1).max(200) }).strict();

export const uploadLegalDocumentSchema = z.object({
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
}).strict();

export const rejectLegalDocumentSchema = z.object({ rejectionReason: z.string().trim().min(1).max(2000) }).strict();

export const supersedeLegalDocumentSchema = z.object({
  fileName: z.string().trim().min(1).max(255),
  mimeType: z.string().trim().max(200).nullable().optional(),
  storageKey: z.string().trim().min(1).max(2000),
  content: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  courtName: z.string().trim().max(500).nullable().optional(),
  caseNumberReference: z.string().trim().max(200).nullable().optional(),
  issuedAt: issuedAtSchema.nullable().optional(),
  metadata: legalDocumentMetadataSchema,
}).strict();

export type UploadLegalDocumentInput = z.infer<typeof uploadLegalDocumentSchema>;
export type RejectLegalDocumentInput = z.infer<typeof rejectLegalDocumentSchema>;
export type SupersedeLegalDocumentInput = z.infer<typeof supersedeLegalDocumentSchema>;
export type LegalDocumentIdParams = z.infer<typeof legalDocumentIdParamsSchema>;
export type AgreementLegalDocumentsParams = z.infer<typeof agreementLegalDocumentsParamsSchema>;

export const parseUploadLegalDocument = (input: unknown) => uploadLegalDocumentSchema.parse(input);
export const parseRejectLegalDocument = (input: unknown) => rejectLegalDocumentSchema.parse(input);
export const parseSupersedeLegalDocument = (input: unknown) => supersedeLegalDocumentSchema.parse(input);
export const parseLegalDocumentIdParams = (input: unknown) => legalDocumentIdParamsSchema.parse(input);
export const parseAgreementLegalDocumentsParams = (input: unknown) => agreementLegalDocumentsParamsSchema.parse(input);
