import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { bindDbActorContext } from "../db/transactionContext";
import { systemActor, userActor } from "../db/systemActor";

class FakeTx {
  public readonly statements: unknown[] = [];

  async execute(statement: unknown) {
    this.statements.push(statement);
    return { rows: [] };
  }
}

test("bindDbActorContext uses the supplied transaction", async () => {
  const tx = new FakeTx();

  await bindDbActorContext(tx as never, userActor("user-123", "client"));

  assert.equal(tx.statements.length, 4);
});

test("bindDbActorContext sets transaction-local identity for user actors", async () => {
  const tx = new FakeTx();

  await bindDbActorContext(tx as never, userActor("user-123", "lawyer"));

  const rendered = tx.statements.map(String).join("\n");
  assert.match(rendered, /app\.actor_kind/);
  assert.match(rendered, /app\.actor_id/);
  assert.match(rendered, /app\.user_id/);
  assert.match(rendered, /app\.role/);
});

test("bindDbActorContext clears user-specific context for system actors", async () => {
  const tx = new FakeTx();

  await bindDbActorContext(tx as never, systemActor());

  assert.equal(tx.statements.length, 3);
  const rendered = tx.statements.map(String).join("\n");
  assert.match(rendered, /app\.actor_kind/);
  assert.match(rendered, /app\.actor_id/);
  assert.match(rendered, /app\.user_id/);
  assert.match(rendered, /app\.role/);
});

test("context binding is transaction-local rather than session-global", async () => {
  const tx = new FakeTx();

  await bindDbActorContext(tx as never, userActor("user-123", "client"));

  const statements = tx.statements.map(String);
  assert.ok(statements.every((statement) => statement.includes("set_config")));
  assert.ok(statements.every((statement) => statement.includes("true")));
});
