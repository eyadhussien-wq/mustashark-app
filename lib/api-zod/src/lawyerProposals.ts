import { z } from "zod/v4";

const proposalAmountSchema = z
  .string()
  .trim()
  .regex(/^\d+(\.\d{1,2})?$/, "amount must be a non-negative decimal with up to 2 fractional digits");

const proposalCurrencySchema = z.enum(["QAR", "JOD"]);

/**
 * Client-controlled fields for creating/submitting a lawyer proposal.
 * Identity, status, expiry, submission time, and timestamps are server-owned.
 */
export const createLawyerProposalSchema = z
  .object({
    amount: proposalAmountSchema,
    currency: proposalCurrencySchema,
  })
  .strict();

export const lawyerProposalParamsSchema = z
  .object({
    requestId: z.string().trim().min(1).max(200),
    proposalId: z.string().trim().min(1).max(200),
  })
  .strict();

export type CreateLawyerProposalInput = z.infer<typeof createLawyerProposalSchema>;
export type LawyerProposalParams = z.infer<typeof lawyerProposalParamsSchema>;

export function parseCreateLawyerProposal(input: unknown) {
  return createLawyerProposalSchema.parse(input);
}

export function parseLawyerProposalParams(input: unknown) {
  return lawyerProposalParamsSchema.parse(input);
}
