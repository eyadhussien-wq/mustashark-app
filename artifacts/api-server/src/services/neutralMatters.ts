import { and, eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { neutralMattersTable } from "@workspace/db/schema";
import { ensureLawyerClientOwnership } from "./lawyerClientOwnership";

export class NeutralMatterError extends Error {
  constructor(public readonly code: "OWNERSHIP_NOT_FOUND" | "MATTER_NOT_FOUND") {
    super(code);
  }
}

/**
 * Neutral Matter operations are scoped to an explicit Lawyer ↔ Client
 * ownership relationship. No agreement, booking, quote, payment, wallet,
 * settlement, escrow, custody, or marketplace state is consulted.
 */
export async function createNeutralMatter(input: {
  id: string;
  lawyerId: string;
  clientId: string;
  title: string;
}) {
  await ensureLawyerClientOwnership(input.lawyerId, input.clientId);

  const [matter] = await db
    .insert(neutralMattersTable)
    .values({
      id: input.id,
      lawyerId: input.lawyerId,
      clientId: input.clientId,
      title: input.title,
      status: "active",
    })
    .returning();

  return matter;
}

export async function getNeutralMatterForLawyer(lawyerId: string, matterId: string) {
  const [matter] = await db
    .select()
    .from(neutralMattersTable)
    .where(and(eq(neutralMattersTable.id, matterId), eq(neutralMattersTable.lawyerId, lawyerId)))
    .limit(1);

  if (!matter) throw new NeutralMatterError("MATTER_NOT_FOUND");
  return matter;
}

export async function listNeutralMattersForLawyer(lawyerId: string) {
  return db
    .select()
    .from(neutralMattersTable)
    .where(eq(neutralMattersTable.lawyerId, lawyerId));
}
