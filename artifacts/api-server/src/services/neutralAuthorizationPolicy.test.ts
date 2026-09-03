import assert from "node:assert/strict";
import test from "node:test";
import { decideNeutralAuthorization } from "./neutralAuthorizationPolicy";

const base = {
  actorState: "active" as const,
  relationshipState: "active" as const,
  matterState: "active" as const,
  resourceState: "active" as const,
  resourceExists: true,
  resourceInActorScope: true,
  resourceMatchesMatter: true,
  operation: "read" as const,
  actorRole: "lawyer" as const,
};

test("positive authorization requires every active scope boundary", () => {
  const decision = decideNeutralAuthorization(base);
  assert.deepEqual(decision, {
    allowed: true,
    status: 200,
    reasonCode: "AUTHORIZED",
    existenceDisclosure: "confirm",
  });
});

test("negative: inactive actor fails closed and hides resource existence", () => {
  const decision = decideNeutralAuthorization({ ...base, actorState: "inactive" });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 404);
  assert.equal(decision.reasonCode, "ACTOR_NOT_ACTIVE");
  assert.equal(decision.existenceDisclosure, "hide");
});

test("negative: out-of-scope resource cannot be enumerated", () => {
  const decision = decideNeutralAuthorization({ ...base, resourceInActorScope: false });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 404);
  assert.equal(decision.reasonCode, "RESOURCE_NOT_ACCESSIBLE");
});

test("negative: inactive relationship is an explicit context denial", () => {
  const decision = decideNeutralAuthorization({ ...base, relationshipState: "inactive" });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 403);
  assert.equal(decision.reasonCode, "RELATIONSHIP_NOT_ACTIVE");
  assert.equal(decision.existenceDisclosure, "confirm");
});

test("negative: archived matter blocks access even when ownership still matches", () => {
  const decision = decideNeutralAuthorization({ ...base, matterState: "archived" });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 403);
  assert.equal(decision.reasonCode, "MATTER_ARCHIVED");
});

test("negative: cross-matter resource is hidden rather than enumerable", () => {
  const decision = decideNeutralAuthorization({ ...base, resourceMatchesMatter: false });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 404);
  assert.equal(decision.reasonCode, "RESOURCE_MATTER_SCOPE_MISMATCH");
});

test("negative: admin has no Neutral Core confidential-data bypass", () => {
  const decision = decideNeutralAuthorization({ ...base, actorRole: "admin" });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 404);
  assert.equal(decision.reasonCode, "ADMIN_CONFIDENTIAL_ACCESS_DENIED");
});

test("negative: archived resource is denied for normal reads", () => {
  const decision = decideNeutralAuthorization({ ...base, resourceState: "archived" });
  assert.equal(decision.allowed, false);
  assert.equal(decision.status, 403);
  assert.equal(decision.reasonCode, "RESOURCE_ARCHIVED");
});

test("positive: export may read an archived resource when actor and scope remain valid", () => {
  const decision = decideNeutralAuthorization({ ...base, resourceState: "archived", operation: "export" });
  assert.equal(decision.allowed, true);
  assert.equal(decision.status, 200);
});

console.log("P3.1-I AUTHORIZATION POLICY POSITIVE + NEGATIVE TESTS PASSED");
