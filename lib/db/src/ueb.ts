import { sql, type ExtractTablesWithRelations } from "drizzle-orm";
import type { NodePgDatabase, NodePgQueryResultHKT } from "drizzle-orm/node-postgres";
import type { PgTransaction } from "drizzle-orm/pg-core";
import * as schema from "./schema/index.ts";

export type UebActor = Readonly<{ id: string; role: string }>;
export type UebContext = Readonly<{ actor: UebActor }>;

type UebDatabase = NodePgDatabase<typeof schema>;
type UebTransaction = PgTransaction<
  NodePgQueryResultHKT,
  typeof schema,
  ExtractTablesWithRelations<typeof schema>
>;

export class UebError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UebError";
  }
}

function assertTrustedActor(actor: UebActor): UebActor {
  if (!actor || typeof actor.id !== "string" || actor.id.trim() === "") {
    throw new UebError("UEB_TRUSTED_ACTOR_REQUIRED");
  }
  if (typeof actor.role !== "string" || actor.role.trim() === "") {
    throw new UebError("UEB_TRUSTED_ACTOR_ROLE_REQUIRED");
  }
  return Object.freeze({ id: actor.id, role: actor.role });
}

async function assertDbActorContext(tx: UebTransaction, actor: UebActor): Promise<void> {
  const result = await tx.execute(sql`
    select
      current_setting('app.actor_id', true) as actor_id,
      current_setting('app.actor_role', true) as actor_role
  `);
  const row = result.rows[0] as { actor_id?: string; actor_role?: string } | undefined;
  if (row?.actor_id !== actor.id || row?.actor_role !== actor.role) {
    throw new UebError("UEB_DB_ACTOR_CONTEXT_CONFLICT");
  }
}

async function establishDbActorContext(tx: UebTransaction, actor: UebActor): Promise<void> {
  await tx.execute(sql`select set_config('app.actor_id', ${actor.id}, true)`);
  await tx.execute(sql`select set_config('app.actor_role', ${actor.role}, true)`);
  await assertDbActorContext(tx, actor);
}

export async function withUeb<T>(
  db: UebDatabase,
  actor: UebActor,
  work: (tx: UebTransaction, context: UebContext) => Promise<T>,
): Promise<T> {
  const trustedActor = assertTrustedActor(actor);
  return db.transaction(async (tx) => {
    await establishDbActorContext(tx, trustedActor);
    const context = Object.freeze({ actor: trustedActor });
    const result = await work(tx, context);
    await assertDbActorContext(tx, trustedActor);
    return result;
  });
}

export async function withNestedUeb<T>(
  tx: UebTransaction,
  context: UebContext,
  requestedActor: UebActor,
  work: (tx: UebTransaction, context: UebContext) => Promise<T>,
): Promise<T> {
  const actor = assertNestedActorInheritance(context, requestedActor);
  await assertDbActorContext(tx, actor);
  return work(tx, context);
}

export async function assertNoUebDbActorContext(db: UebDatabase): Promise<void> {
  const result = await db.execute(sql`
    select
      current_setting('app.actor_id', true) as actor_id,
      current_setting('app.actor_role', true) as actor_role
  `);
  const row = result.rows[0] as { actor_id?: string; actor_role?: string } | undefined;
  if ((row?.actor_id ?? "") !== "" || (row?.actor_role ?? "") !== "") {
    throw new UebError("UEB_CONTEXT_LEAK_DETECTED");
  }
}

export function assertNestedActorInheritance(
  outer: UebContext,
  requestedActor: UebActor,
): UebActor {
  if (outer.actor.id !== requestedActor.id || outer.actor.role !== requestedActor.role) {
    throw new UebError("UEB_NESTED_IDENTITY_OVERRIDE_DENIED");
  }
  return outer.actor;
}
