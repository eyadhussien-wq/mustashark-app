import { db } from "@workspace/db";

/** The exact Drizzle transaction type used by the shared DB package. */
export type DbTransaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Infrastructure options passed explicitly by transaction-aware services. */
export type DbTransactionOptions = {
  tx?: DbTransaction;
};
