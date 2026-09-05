import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { DbTransaction, DbTransactionOptions } from "./transactionContext.types";
import type { DbActor } from "./systemActor";

export type DbRequestContext = {
  actor: DbActor;
  tx: DbTransaction;
};

/**
 * Bind the application actor to the current PostgreSQL transaction.
 *
 * set_config(..., true) is transaction-local and therefore safe for pooled
 * connections. The caller must use the same tx for all RLS-sensitive work.
 */
export const bindDbActorContext = async (
  tx: DbTransaction,
  actor: DbActor,
): Promise<void> => {
  await tx.execute(
    sql`select set_config('app.actor_kind', ${actor.kind}, true)`,
  );

  if (actor.kind === "user") {
    await tx.execute(
      sql`select set_config('app.actor_id', ${actor.userId}, true)`,
    );
    await tx.execute(
      sql`select set_config('app.user_id', ${actor.userId}, true)`,
    );
    await tx.execute(
      sql`select set_config('app.role', ${actor.role}, true)`,
    );
    return;
  }

  await tx.execute(
    sql`select set_config('app.actor_id', ${actor.actorId}, true)`,
  );
  await tx.execute(sql`select set_config('app.user_id', '', true)`);
  await tx.execute(sql`select set_config('app.role', '', true)`);
};

/**
 * Execute work inside an existing transaction when supplied, otherwise own a
 * new transaction. This is the sole Phase-A transaction adapter primitive.
 */
export const withDbRequestContext = async <T>(
  actor: DbActor,
  work: (context: DbRequestContext) => Promise<T>,
  options: DbTransactionOptions = {},
): Promise<T> => {
  if (options.tx) {
    await bindDbActorContext(options.tx, actor);
    return work({ actor, tx: options.tx });
  }

  return db.transaction(async (tx) => {
    await bindDbActorContext(tx, actor);
    return work({ actor, tx });
  });
};
