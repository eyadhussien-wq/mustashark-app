import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { after, test } from "node:test";
import app from "../app";
import { signToken } from "../lib/jwt";
import { db, pool, notificationsTable, usersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const userA = {
  id: "phase-d-user-a",
  name: "Phase D User A",
  email: "phase-d-user-a@example.test",
  role: "client" as const,
  authProvider: "local" as const,
  accountStatus: "active" as const,
};

const userB = {
  id: "phase-d-user-b",
  name: "Phase D User B",
  email: "phase-d-user-b@example.test",
  role: "client" as const,
  authProvider: "local" as const,
  accountStatus: "active" as const,
};

const notificationA = {
  id: "phase-d-notification-a",
  userId: userA.id,
  title: "phase-d-a",
  body: "notification for A",
  kind: "info",
};

const notificationB = {
  id: "phase-d-notification-b",
  userId: userB.id,
  title: "phase-d-b",
  body: "notification for B",
  kind: "info",
};

let server: Server | undefined;
let baseUrl = "";

function tokenFor(user: typeof userA) {
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

async function seed() {
  await db.delete(notificationsTable).where(
    inArray(notificationsTable.id, [notificationA.id, notificationB.id]),
  );
  await db.delete(usersTable).where(
    inArray(usersTable.id, [userA.id, userB.id]),
  );

  await db.insert(usersTable).values([userA, userB]);
  await db.insert(notificationsTable).values([notificationA, notificationB]);
}

async function cleanup() {
  await db.delete(notificationsTable).where(
    inArray(notificationsTable.id, [notificationA.id, notificationB.id]),
  );
  await db.delete(usersTable).where(
    inArray(usersTable.id, [userA.id, userB.id]),
  );
}

const ready = (async () => {
  await seed();
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server?.once("listening", () => resolve());
    server?.once("error", reject);
  });

  const address = server.address();
  assert.ok(address && typeof address === "object");
  baseUrl = `http://127.0.0.1:${(address as AddressInfo).port}`;
})();

test("D04-I01/I02: notifications have no direct HTTP creation endpoint", async () => {
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

  const [forgedA, forgedB] = await Promise.all([
    db.select().from(notificationsTable).where(eqId("attacker-notification-a")),
    db.select().from(notificationsTable).where(eqId("attacker-notification-b")),
  ]);
  assert.equal(forgedA.length, 0);
  assert.equal(forgedB.length, 0);
});

function eqId(id: string) {
  return (notificationsTable.id as typeof notificationsTable.id).mapWith((value) => value).$eq(id);
}

test("D04-I03/I04: client identity hints cannot change the authenticated actor", async () => {
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
  assert.deepEqual(body.notifications.map((row) => row.id), [notificationA.id]);
  assert.ok(body.notifications.every((row) => row.userId === userA.id));
});

test("D04-U02/U03: a user cannot mark another user's notification as read", async () => {
  await ready;

  const response = await fetch(
    `${baseUrl}/api/notifications/${encodeURIComponent(notificationB.id)}/read`,
    {
      method: "POST",
      headers: authHeaders(tokenFor(userA)),
    },
  );

  assert.equal(response.status, 404);
  const [row] = await db
    .select({ readAt: notificationsTable.readAt })
    .from(notificationsTable)
    .where(eqId(notificationB.id));
  assert.equal(row?.readAt, null);
});

 test("D04-C01/C02: concurrent actors remain isolated", async () => {
  await ready;

  const responses = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      fetch(`${baseUrl}/api/notifications`, {
        headers: authHeaders(index % 2 === 0 ? tokenFor(userA) : tokenFor(userB)),
      }),
    ),
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

  for (let index = 0; index < bodies.length; index += 1) {
    const expected = index % 2 === 0 ? notificationA : notificationB;
    assert.deepEqual(bodies[index].notifications.map((row) => row.id), [expected.id]);
    assert.ok(bodies[index].notifications.every((row) => row.userId === expected.userId));
  }
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }
  await cleanup();
  await pool.end();
});
