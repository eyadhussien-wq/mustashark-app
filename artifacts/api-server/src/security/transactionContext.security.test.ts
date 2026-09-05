import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import test from "node:test";
import { sql } from "drizzle-orm";
import { db, pool } from "@workspace/db";
import { bindDbActorContext, withDbRequestContext } from "../db/transactionContext";
import type { DbTransaction } from "../db/transactionContext.types";
import { systemActor, userActor } from "../db/systemActor";
import { listNotificationsService, markNotificationReadService } from "../services/notifications";

async function currentContext(tx: DbTransaction) {
  const result = await tx.execute(sql`
    select
      current_setting('app.actor_kind', true) as actor_kind,
      current_setting('app.actor_id', true) as actor_id,
      current_setting('app.user_id', true) as user_id,
      current_setting('app.role', true) as role
  `);

  return result.rows[0] as {
    actor_kind?: string;
    actor_id?: string;
    user_id?: string;
    role?: string;
  };
}

test("B-01: user actor binds an exact identity tuple", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("b01-user", "client"));
    const context = await currentContext(tx);

    assert.equal(context.actor_kind, "user");
    assert.equal(context.actor_id, "b01-user");
    assert.equal(context.user_id, "b01-user");
    assert.equal(context.role, "client");
  });
});

test("B-03: system actor has no user identity or logical role", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, systemActor());
    const context = await currentContext(tx);

    assert.equal(context.actor_kind, "system");
    assert.equal(context.actor_id, "system_internal_actor");
    assert.equal(context.user_id ?? "", "");
    assert.equal(context.role ?? "", "");
  });
});

test("B-02/B-12: concurrent actors remain isolated", async () => {
  let release!: () => void;
  const barrier = new Promise<void>((resolve) => {
    release = resolve;
  });

  const first = db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("b02-user-a", "client"));
    await barrier;
    return currentContext(tx);
  });

  const second = db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("b02-user-b", "lawyer"));
    await barrier;
    return currentContext(tx);
  });

  await new Promise((resolve) => setTimeout(resolve, 25));
  release();

  const [a, b] = await Promise.all([first, second]);
  assert.equal(a.user_id, "b02-user-a");
  assert.equal(a.role, "client");
  assert.equal(b.user_id, "b02-user-b");
  assert.equal(b.role, "lawyer");
});

test("B-04: rollback cannot leak transaction-local identity", async () => {
  await assert.rejects(
    db.transaction(async (tx) => {
      await bindDbActorContext(tx, userActor("rollback-user", "client"));
      const inside = await currentContext(tx);
      assert.equal(inside.user_id, "rollback-user");
      throw new Error("intentional rollback");
    }),
    /intentional rollback/,
  );

  const outside = await pool.query(
    "select current_setting('app.user_id', true) as user_id, current_setting('app.role', true) as role",
  );
  assert.equal(outside.rows[0]?.user_id ?? "", "");
  assert.equal(outside.rows[0]?.role ?? "", "");
});

test("B-05/B-11: pooled connections do not retain a previous actor", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("poisoning-user", "client"));
    const context = await currentContext(tx);
    assert.equal(context.user_id, "poisoning-user");
  });

  await db.transaction(async (tx) => {
    const before = await currentContext(tx);
    assert.equal(before.user_id ?? "", "");
    assert.equal(before.role ?? "", "");

    await bindDbActorContext(tx, userActor("next-user", "lawyer"));
    const after = await currentContext(tx);
    assert.equal(after.user_id, "next-user");
    assert.equal(after.role, "lawyer");
  });
});

test("B-06: context and RLS-sensitive query use the same transaction connection", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("affinity-user", "client"));

    const result = await tx.execute(sql`
      select
        pg_backend_pid() as backend_pid,
        current_setting('app.user_id', true) as user_id
    `);

    assert.ok(Number(result.rows[0]?.backend_pid) > 0);
    assert.equal(result.rows[0]?.user_id, "affinity-user");
  });
});

test("B-08: explicit transaction is reused without creating another transaction", async () => {
  await db.transaction(async (outerTx) => {
    const observed = await withDbRequestContext(
      userActor("explicit-tx-user", "client"),
      async ({ tx }) => {
        assert.strictEqual(tx, outerTx);
        const context = await currentContext(tx);
        return context;
      },
      { tx: outerTx },
    );

    assert.equal(observed.user_id, "explicit-tx-user");
  });
});

test("B-08: absent transaction creates exactly one owned transaction boundary", async () => {
  const observed = await withDbRequestContext(
    userActor("owned-tx-user", "client"),
    async ({ tx }) => {
      const context = await currentContext(tx);
      const pid = await tx.execute(sql`select pg_backend_pid() as backend_pid`);
      return {
        context,
        backendPid: Number(pid.rows[0]?.backend_pid),
      };
    },
  );

  assert.equal(observed.context.user_id, "owned-tx-user");
  assert.ok(observed.backendPid > 0);
});

test("B-10: transaction context propagates through the service boundary", async () => {
  await db.transaction(async (tx) => {
    await bindDbActorContext(tx, userActor("propagation-user", "client"));

    const result = await listNotificationsService(
      { userId: "propagation-user" },
      { tx },
    );

    assert.ok(Array.isArray(result));
    const context = await currentContext(tx);
    assert.equal(context.user_id, "propagation-user");
    assert.equal(context.role, "client");
  });
});

test("B-13: transaction-aware notification services reuse the supplied transaction", async () => {
  await db.transaction(async (tx) => {
    const before = await currentContext(tx);
    assert.equal(before.user_id ?? "", "");

    await bindDbActorContext(tx, userActor("financial-boundary-user", "client"));

    await listNotificationsService(
      { userId: "financial-boundary-user" },
      { tx },
    );
    await markNotificationReadService(
      { userId: "financial-boundary-user", notificationId: "missing-notification" },
      { tx },
    );

    const after = await currentContext(tx);
    assert.equal(after.user_id, "financial-boundary-user");
  });
});

test("B-14: notification controller does not accept a client-supplied identity header", async () => {
  const sourcePath = fileURLToPath(new URL("../controllers/notifications.ts", import.meta.url));
  const source = await readFile(sourcePath, "utf8");

  assert.doesNotMatch(source, /X-User-Id/i);
  assert.doesNotMatch(source, /X-Actor-Id/i);
  assert.match(source, /req\.authUser/);
  assert.match(source, /userActor\(authUser\.id, authUser\.role\)/);
});

test("B-15: SystemActor is not represented as an admin UserActor", async () => {
  const actor = systemActor();
  assert.equal(actor.kind, "system");
  assert.equal(actor.actorId, "system_internal_actor");
  assert.equal("role" in actor, false);
  assert.equal("userId" in actor, false);
});

test("B-16: context binding is awaited before protected work executes", async () => {
  const result = await withDbRequestContext(
    userActor("failure-safety-user", "client"),
    async ({ tx }) => {
      const context = await currentContext(tx);
      return context.user_id;
    },
  );

  assert.equal(result, "failure-safety-user");
});
