import assert from "node:assert/strict";
import test from "node:test";
import {
  listNotificationsService,
  markNotificationReadService,
} from "./notifications";

function createQueryMock<T>(result: T) {
  const calls: string[] = [];
  const query = {
    from() {
      calls.push("from");
      return query;
    },
    where() {
      calls.push("where");
      return query;
    },
    orderBy() {
      calls.push("orderBy");
      return query;
    },
    limit() {
      calls.push("limit");
      return Promise.resolve(result);
    },
    update() {
      calls.push("update");
      return query;
    },
    set() {
      calls.push("set");
      return query;
    },
    returning() {
      calls.push("returning");
      return Promise.resolve(result);
    },
  };
  return { query, calls };
}

test("listNotificationsService executes against the supplied transaction", async () => {
  const { query, calls } = createQueryMock([{ id: "n1" }]);
  const tx = {
    select: () => query,
  };

  const result = await listNotificationsService(
    { userId: "user-123" },
    { tx: tx as never },
  );

  assert.deepEqual(result, [{ id: "n1" }]);
  assert.deepEqual(calls, ["from", "where", "orderBy", "limit"]);
});

test("markNotificationReadService executes against the supplied transaction", async () => {
  const updated = { id: "n1", readAt: new Date() };
  const { query, calls } = createQueryMock([updated]);
  const tx = {
    update: () => query,
  };

  const result = await markNotificationReadService(
    { userId: "user-123", notificationId: "n1" },
    { tx: tx as never },
  );

  assert.deepEqual(result, [updated]);
  assert.deepEqual(calls, ["update", "set", "where", "returning"]);
});
