import assert from "node:assert/strict";
import test from "node:test";
import { executeQuickAction } from "./quickActions";

const context = {
  userId: "lawyer-1",
  role: "lawyer" as const,
  caseId: "case-1",
  membershipVerified: true,
  ownershipVerified: true,
};

test("returns a non-persistent hearing quick action", () => {
  assert.deepEqual(executeQuickAction("create_hearing", context), {
    action: "create_hearing",
    caseId: "case-1",
    persisted: false,
    requiresDomainHandler: true,
  });
});

test("returns a non-persistent decision quick action", () => {
  assert.deepEqual(executeQuickAction("create_decision", context), {
    action: "create_decision",
    caseId: "case-1",
    persisted: false,
    requiresDomainHandler: true,
  });
});

test("blocks quick actions without verified membership", () => {
  assert.throws(
    () => executeQuickAction("create_hearing", { ...context, membershipVerified: false }),
    { message: "FORBIDDEN" },
  );
});

test("blocks unsupported quick actions", () => {
  assert.throws(
    () => executeQuickAction("unknown" as never, context),
    { message: "UNSUPPORTED_QUICK_ACTION" },
  );
});
