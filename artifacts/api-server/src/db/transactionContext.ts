import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import type { DbTransaction, DbTransactionOptions } from "./transactionContext.types";
import type { DbActor } from "./systemActor";

export type DbRequestContext = {
  actor: DbActor;
  tx: DbTransaction;
};

const emitRlsDiagnostic = async (tx: DbTransaction, phase: string): Promise<void> => {
  if (process.env.PHASE_D_RLS_DIAGNOSTICS !== "true") return;

  const [row] = await tx.execute(sql`
    select
      current_user as current_user,
      pg_backend_pid() as backend_pid,
      current_setting('app.actor_kind', true) as actor_kind,
      current_setting('app.actor_id', true) as actor_id,
      current_setting('app.user_id', true) as user_id,
      current_setting('app.role', true) as app_role,
      c.relrowsecurity as rls_enabled,
      c.relforcerowsecurity as force_rls,
      exists (
        select 1
        from pg_policy p
        where p.polrelid = c.oid
          and p.polcmd = '*'
      ) as has_all_policy
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relname = 'notifications'
  `);

  console.error(`[PHASE-D-RLS-EVIDENCE] ${phase}`, row);
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
    await emitRlsDiagnostic(tx, `bound:user:${actor.userId}`);
    return;
  }

  await tx.execute(
    sql`select set_config('app.actor_id', ${actor.actorId}, true)`,
  );
  await tx.execute(sql`select set_config('app.user_id', '', true)`);
  await tx.execute(sql`select set_config('app.role', '', true)`);
  await emitRlsDiagnostic(tx, `bound:system:${actor.actorId}`);
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
