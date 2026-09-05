import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import { bindDbActorContext } from "../db/transactionContext.ts";
import { systemActor, userActor } from "../db/systemActor.ts";

test("SET LOCAL identity remains on the same transaction connection", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("integration-user", "client"));

    const result = await tx.execute(
      sql`select current_setting('app.user_id', true) as user_id, current_setting('app.role', true) as role`,
    );

    assert.equal(result.rows[0]?.user_id, "integration-user");
    assert.equal(result.rows[0]?.role, "client");
  });
});

test("transaction-local context disappears after commit", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("scoped-user", "client"));

    const inside = await tx.execute(
      sql`select current_setting('app.user_id', true) as user_id`,
    );
    assert.equal(inside.rows[0]?.user_id, "scoped-user");
  });

  const outside = await pool.query(
    "select current_setting('app.user_id', true) as user_id",
  );
  assert.equal(outside.rows[0]?.user_id ?? "", "");
});

test("system actor clears user identity on its transaction connection", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, systemActor());

    const result = await tx.execute(
      sql`select current_setting('app.actor_kind', true) as actor_kind, current_setting('app.actor_id', true) as actor_id, current_setting('app.user_id', true) as user_id, current_setting('app.role', true) as role`,
    );

    assert.equal(result.rows[0]?.actor_kind, "system");
    assert.equal(result.rows[0]?.actor_id, "system_internal_actor");
    assert.equal(result.rows[0]?.user_id ?? "", "");
    assert.equal(result.rows[0]?.role ?? "", "");
  });
});

test("concurrent transactions do not share transaction-local actor context", async () => {
  const barrier = new Promise<void>((resolve) => {
    setTimeout(resolve, 50);
  });

  const first = db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("actor-one", "client"));
    await barrier;
    const result = await tx.execute(
      sql`select current_setting('app.user_id', true) as user_id`,
    );
    return result.rows[0]?.user_id;
  });

  const second = db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("actor-two", "lawyer"));
    await barrier;
    const result = await tx.execute(
      sql`select current_setting('app.user_id', true) as user_id`,
    );
    return result.rows[0]?.user_id;
  });

  const [firstUser, secondUser] = await Promise.all([first, second]);
  assert.equal(firstUser, "actor-one");
  assert.equal(secondUser, "actor-two");
});
