import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, test } from "node:test";
import app from "../app";
import { signToken } from "../lib/jwt";
import { withDbRequestContext } from "../db/transactionContext";
import { systemActor, userActor } from "../db/systemActor";
import { db, pool, notificationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const userA = {
  id: "phase-d-user-a",
  email: "phase-d-user-a@example.test",
  role: "client" as const,
};

const userB = {
  id: "phase-d-user-b",
  email: "phase-d-user-b@example.test",
  role: "client" as const,
};

const consultant = {
  id: "phase-d-consultant-c",
  email: "phase-d-consultant-c@example.test",
  role: "lawyer" as const,
};

const notificationA = "phase-d-notification-a";
const notificationB = "phase-d-notification-b";
const notificationC = "phase-d-notification-c";
const systemNotification = "phase-d-system-notification";

let server: Server | undefined;
let baseUrl = "";

function tokenFor(user: typeof userA | typeof userB | typeof consultant) {
  return signToken({
    userId: user.id,
    email: user.email,
    role: user.role,
    provider: "local",
  });
}

function authHeaders(token: string) {
  return { authorization: `Bearer ${token}` };
}

const ready = (async () => {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server?.once("listening", () => resolve());
    server?.once("error", reject);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
})();

test("D04-I01/I02: direct notification creation is absent and cannot be forged over HTTP", async () => {
  await ready;

  const selfInjection = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: {
      ...authHeaders(tokenFor(userA)),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: "attacker-notification-a",
      userId: userA.id,
      title: "forged",
      body: "forged",
      kind: "info",
    }),
  });

  const crossUserInjection = await fetch(`${baseUrl}/api/notifications`, {
    method: "POST",
    headers: {
      ...authHeaders(tokenFor(userA)),
      "content-type": "application/json",
    },
    body: JSON.stringify({
      id: "attacker-notification-b",
      userId: userB.id,
      title: "forged",
      body: "forged",
      kind: "info",
    }),
  });

  assert.equal(selfInjection.status, 404);
  assert.equal(crossUserInjection.status, 404);
});

test("D04-R01/R02/R03: Client and Consultant actors are isolated by transaction-local identity", async () => {
  await ready;

  const cases = [
    { actor: userA, expected: notificationA },
    { actor: userB, expected: notificationB },
    { actor: consultant, expected: notificationC },
  ] as const;

  for (const current of cases) {
    const response = await fetch(`${baseUrl}/api/notifications`, {
      headers: authHeaders(tokenFor(current.actor)),
    });

    assert.equal(response.status, 200);
    const body = (await response.json()) as {
      notifications: Array<{ id: string; userId: string }>;
    };

    assert.deepEqual(body.notifications.map((row) => row.id), [current.expected]);
    assert.ok(body.notifications.every((row) => row.userId === current.actor.id));
  }
});

test("D04-I03/I04: request identity hints cannot override the authenticated actor", async () => {
  await ready;

  const spoofed = await fetch(
    `${baseUrl}/api/notifications?userId=${encodeURIComponent(userB.id)}`,
    {
      headers: {
        ...authHeaders(tokenFor(userA)),
        "X-User-Id": userB.id,
      },
    },
  );

  assert.equal(spoofed.status, 200);
  const body = (await spoofed.json()) as {
    notifications: Array<{ id: string; userId: string }>;
  };
  assert.deepEqual(body.notifications.map((row) => row.id), [notificationA]);
  assert.ok(body.notifications.every((row) => row.userId === userA.id));
});

test("D04-U02/U03: owner UPDATE is allowed while cross-user UPDATE and ownership transfer are denied", async () => {
  await ready;

  const ownUpdate = await fetch(
    `${baseUrl}/api/notifications/${encodeURIComponent(notificationA)}/read`,
    {
      method: "POST",
      headers: authHeaders(tokenFor(userA)),
    },
  );
  assert.equal(ownUpdate.status, 200);

  const crossUserUpdate = await fetch(
    `${baseUrl}/api/notifications/${encodeURIComponent(notificationB)}/read`,
    {
      method: "POST",
      headers: authHeaders(tokenFor(userA)),
    },
  );
  assert.equal(crossUserUpdate.status, 404);

  const [ownerRow] = await db
    .select({ userId: notificationsTable.userId })
    .from(notificationsTable)
    .where(eq(notificationsTable.id, notificationA));
  assert.equal(ownerRow?.userId, userA.id);
});

test("D04-I05: only explicit SystemActor context may create a notification", async () => {
  await ready;

  const userInsert = await withDbRequestContext(
    userActor(userA.id, userA.role),
    async ({ tx }) => {
      try {
        await tx.insert(notificationsTable).values({
          id: "phase-d-user-forged-insert",
          userId: userB.id,
          title: "forged",
          body: "forged",
          kind: "info",
        });
        return true;
      } catch (error) {
        return error;
      }
    },
  );
  assert.ok(userInsert instanceof Error);

  const systemInsert = await withDbRequestContext(
    systemActor(),
    async ({ tx }) => {
      await tx.insert(notificationsTable).values({
        id: systemNotification,
        userId: consultant.id,
        title: "system-created",
        body: "trusted business notification",
        kind: "info",
      });
      return true;
    },
  );
  assert.equal(systemInsert, true);

  const systemRow = await withDbRequestContext(
    userActor(consultant.id, consultant.role),
    async ({ tx }) =>
      tx
        .select({ id: notificationsTable.id, userId: notificationsTable.userId })
        .from(notificationsTable)
        .where(eq(notificationsTable.id, systemNotification)),
  );
  assert.deepEqual(systemRow, [{ id: systemNotification, userId: consultant.id }]);
});

test("D04-D01: DELETE remains denied by default", async () => {
  await ready;

  await withDbRequestContext(
    userActor(userA.id, userA.role),
    async ({ tx }) => {
      await tx.delete(notificationsTable).where(eq(notificationsTable.id, notificationA));
    },
  );

  const remaining = await withDbRequestContext(
    userActor(userA.id, userA.role),
    async ({ tx }) =>
      tx
        .select({ id: notificationsTable.id })
        .from(notificationsTable)
        .where(eq(notificationsTable.id, notificationA)),
  );

  assert.deepEqual(remaining, [{ id: notificationA }]);
});

test("D04-C01/C02: concurrent Client and Consultant requests remain isolated", async () => {
  await ready;

  const actors = [userA, userB, consultant] as const;
  const responses = await Promise.all(
    Array.from({ length: 30 }, (_, index) => {
      const actor = actors[index % actors.length];
      return fetch(`${baseUrl}/api/notifications`, {
        headers: authHeaders(tokenFor(actor)),
      });
    }),
  );

  assert.ok(responses.every((response) => response.status === 200));
  const bodies = await Promise.all(
    responses.map(
      async (response) =>
        (await response.json()) as {
          notifications: Array<{ id: string; userId: string }>;
        },
    ),
  );

  const expected = [notificationA, notificationB, notificationC] as const;
  for (let index = 0; index < bodies.length; index += 1) {
    const expectedId = expected[index % expected.length];
    const expectedUserId = actors[index % actors.length].id;
    assert.deepEqual(bodies[index].notifications.map((row) => row.id), [expectedId]);
    assert.ok(bodies[index].notifications.every((row) => row.userId === expectedUserId));
  }
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }
  await pool.end();
});
