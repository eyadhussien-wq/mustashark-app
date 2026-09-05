import assert from "node:assert/strict";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { test, after } from "node:test";
import app from "../app";
import { signToken } from "../lib/jwt";
import { db, pool, notificationsTable, usersTable } from "@workspace/db";
import { inArray } from "drizzle-orm";

const userA = {
  id: "phase-c-user-a",
  name: "Phase C User A",
  email: "phase-c-user-a@example.test",
  role: "client" as const,
  authProvider: "local" as const,
  accountStatus: "active" as const,
};

const userB = {
  id: "phase-c-user-b",
  name: "Phase C User B",
  email: "phase-c-user-b@example.test",
  role: "client" as const,
  authProvider: "local" as const,
  accountStatus: "active" as const,
};

const notificationA = {
  id: "phase-c-notification-a",
  userId: userA.id,
  title: "phase-c-a",
  body: "notification for A",
  kind: "info",
};

const notificationB = {
  id: "phase-c-notification-b",
  userId: userB.id,
  title: "phase-c-b",
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

async function requestNotifications(token: string, init: RequestInit = {}) {
  return fetch(`${baseUrl}/api/notifications`, {
    ...init,
    headers: {
      authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
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

test("C-01/C-02: protected notifications route requires auth and binds runtime identity", async () => {
  await ready;

  const unauthenticated = await fetch(`${baseUrl}/api/notifications`);
  assert.equal(unauthenticated.status, 401);

  const response = await requestNotifications(tokenFor(userA));
  assert.equal(response.status, 200);
  const body = (await response.json()) as {
    ok: boolean;
    notifications: Array<{ id: string; userId: string }>;
  };

  assert.equal(body.ok, true);
  assert.deepEqual(body.notifications.map((row) => row.id), [notificationA.id]);
  assert.ok(body.notifications.every((row) => row.userId === userA.id));
});

test("C-03: user isolation is preserved through the live HTTP route", async () => {
  await ready;

  const responseA = await requestNotifications(tokenFor(userA));
  const responseB = await requestNotifications(tokenFor(userB));
  assert.equal(responseA.status, 200);
  assert.equal(responseB.status, 200);

  const bodyA = (await responseA.json()) as { notifications: Array<{ id: string }> };
  const bodyB = (await responseB.json()) as { notifications: Array<{ id: string }> };

  assert.deepEqual(bodyA.notifications.map((row) => row.id), [notificationA.id]);
  assert.deepEqual(bodyB.notifications.map((row) => row.id), [notificationB.id]);
});

test("C-04/C-05: client-supplied identity hints cannot switch the authenticated actor", async () => {
  await ready;

  const response = await requestNotifications(tokenFor(userA), {
    headers: { "X-User-Id": userB.id },
  });
  assert.equal(response.status, 200);
  const body = (await response.json()) as { notifications: Array<{ id: string }> };
  assert.deepEqual(body.notifications.map((row) => row.id), [notificationA.id]);

  const queryResponse = await fetch(
    `${baseUrl}/api/notifications?userId=${encodeURIComponent(userB.id)}`,
    { headers: { authorization: `Bearer ${tokenFor(userA)}` } },
  );
  assert.equal(queryResponse.status, 200);
  const queryBody = (await queryResponse.json()) as {
    notifications: Array<{ id: string }>;
  };
  assert.deepEqual(queryBody.notifications.map((row) => row.id), [notificationA.id]);
});

test("C-06/C-07/C-08/C-09: repeated live requests remain isolated across pooled connections", async () => {
  await ready;

  const responses = await Promise.all(
    Array.from({ length: 12 }, (_, index) =>
      requestNotifications(index % 2 === 0 ? tokenFor(userA) : tokenFor(userB)),
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
    assert.ok(
      bodies[index].notifications.every((row) => row.userId === expected.userId),
    );
  }
});

after(async () => {
  if (server) {
    await new Promise<void>((resolve) => server?.close(() => resolve()));
  }
  await cleanup();
  await pool.end();
});
