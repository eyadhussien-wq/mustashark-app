import { z } from "zod/v4";

/**
 * Client-controlled fields for creating a representation quote request.
 * Identity, status, serial number, quote linkage, and timestamps are server-owned.
 */
export const createRepresentationQuoteRequestSchema = z
  .object({
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().min(1).max(10_000).optional(),
    lawyerId: z.string().trim().min(1).max(200).optional(),
  })
  .strict();

export type CreateRepresentationQuoteRequestInput = z.infer<
  typeof createRepresentationQuoteRequestSchema
>;

export function parseCreateRepresentationQuoteRequest(input: unknown) {
  return createRepresentationQuoteRequestSchema.parse(input);
}
