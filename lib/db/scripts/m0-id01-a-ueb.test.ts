import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { Client } from "pg";
import { sql } from "drizzle-orm";
import { test } from "node:test";
import { db, pool } from "../src/index";
import { assertNoUebDbActorContext, UebError, withNestedUeb, withUeb } from "../src/ueb";

function isolatedUrl(): string {
  const value = process.env.DATABASE_URL;
  if (!value) throw new Error("M0_ID01A_DATABASE_URL_MISSING");
  const url = new URL(value);
  const database = decodeURIComponent(url.pathname.replace(/^\//, ""));
  const local = url.hostname === "localhost" || url.hostname === "127.0.0.1" || url.hostname === "::1";
  if (!local || !database.endsWith("_test")) throw new Error("M0_ID01A_REFUSES_NON_ISOLATED_DATABASE");
  return value;
}

test("M0 ID-01-A UEB DB-observable proof", async () => {
  const observer = new Client({ connectionString: isolatedUrl() });
  await observer.connect();
  const schemaName = `m0_id01a_${process.pid}_${Date.now()}_${randomUUID().replaceAll("-", "")}`;
  const qSchema = `"${schemaName}"`;
  const actorA = { id: "m0-actor-a", role: "client" } as const;
  const actorB = { id: "m0-actor-b", role: "lawyer" } as const;

  try {
    await observer.query(`create schema ${qSchema}`);
    await observer.query(`create table ${qSchema}.observations (id bigserial primary key, actor_id text not null, actor_role text not null, tx_id bigint not null, marker text not null)`);

    const committed = await withUeb(db, actorA, async (tx, context) => {
      const result = await tx.execute(sql`select current_setting('app.actor_id', true) as actor_id, current_setting('app.actor_role', true) as actor_role, txid_current() as tx_id`);
      const row = result.rows[0] as { actor_id: string; actor_role: string; tx_id: string };
      assert.deepEqual(row, { actor_id: actorA.id, actor_role: actorA.role, tx_id: row.tx_id });

      const inherited = await withNestedUeb(tx, context, actorA, async (nestedTx, nestedContext) => {
        assert.equal(nestedContext.actor.id, actorA.id);
        const nested = await nestedTx.execute(sql`select current_setting('app.actor_id', true) as actor_id`);
        return (nested.rows[0] as { actor_id: string }).actor_id;
      });
      assert.equal(inherited, actorA.id);

      await assert.rejects(
        () => withNestedUeb(tx, context, actorB, async () => "must-not-run"),
        (error: unknown) => error instanceof UebError && error.message === "UEB_NESTED_IDENTITY_OVERRIDE_DENIED",
      );

      await tx.execute(sql`
        insert into ${sql.raw(`${qSchema}.observations`)} (actor_id, actor_role, tx_id, marker)
        values (${actorA.id}, ${actorA.role}, ${row.tx_id}, 'commit')
      `);
      return row.tx_id;
    });

    const observed = await observer.query(`select actor_id, actor_role, tx_id::text, marker from ${qSchema}.observations where marker = 'commit'`);
    assert.equal(observed.rowCount, 1);
    assert.deepEqual(observed.rows[0], { actor_id: actorA.id, actor_role: actorA.role, tx_id: String(committed), marker: "commit" });
    await assertNoUebDbActorContext(db);

    await assert.rejects(
      () => withUeb(db, actorA, async (tx) => {
        await tx.execute(sql`insert into ${sql.raw(`${qSchema}.observations`)} (actor_id, actor_role, tx_id, marker) values (${actorA.id}, ${actorA.role}, txid_current(), 'rollback')`);
        throw new UebError("M0_FORCED_ROLLBACK");
      }),
      (error: unknown) => error instanceof UebError && error.message === "M0_FORCED_ROLLBACK",
    );
    const rollback = await observer.query(`select count(*)::int as count from ${qSchema}.observations where marker = 'rollback'`);
    assert.equal(rollback.rows[0].count, 0);
    await assertNoUebDbActorContext(db);

    const a = await withUeb(db, actorA, async (tx) => (await tx.execute(sql`select current_setting('app.actor_id', true) as actor_id, txid_current() as tx_id`)).rows[0] as { actor_id: string; tx_id: string });
    const b = await withUeb(db, actorB, async (tx) => (await tx.execute(sql`select current_setting('app.actor_id', true) as actor_id, txid_current() as tx_id`)).rows[0] as { actor_id: string; tx_id: string });
    assert.equal(a.actor_id, actorA.id);
    assert.equal(b.actor_id, actorB.id);
    assert.notEqual(a.tx_id, b.tx_id);
    await assertNoUebDbActorContext(db);

    const raw = await pool.connect();
    try {
      const result = await raw.query(`select nullif(current_setting('app.actor_id', true), '') as id, nullif(current_setting('app.actor_role', true), '') as role`);
      assert.deepEqual(result.rows[0], { id: null, role: null });
    } finally {
      raw.release();
    }

    console.log(JSON.stringify({
      harness: "M0-PROOF-HARNESS-001",
      mode: "ID-01-A-UEB",
      proofs: ["trusted-actor", "commit", "rollback", "nested-inheritance", "nested-override-deny", "A/B-isolation", "context-cleanup", "pool-reuse"],
      observedCommit: observed.rows[0],
      rollbackRows: rollback.rows[0].count,
      result: "DB-ORACLE-PASS",
    }));
  } finally {
    await observer.query(`drop schema if exists ${qSchema} cascade`);
    await observer.end();
    await pool.end();
  }
});
