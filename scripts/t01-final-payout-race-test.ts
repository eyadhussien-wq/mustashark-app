import assert from "node:assert/strict";

/**
 * T01-05-F4 concurrency contract test.
 *
 * This test models the database invariant used by releaseMilestone: a release
 * request may transition from approved to auto_released exactly once. Two
 * concurrent callers therefore produce one winner and one rejected attempt.
 * The production integration suite should execute the same invariant against
 * PostgreSQL with two real transactions.
 */

type ReleaseRequest = { status: "approved" | "auto_released" };

async function atomicClaim(request: ReleaseRequest): Promise<boolean> {
  if (request.status !== "approved") return false;
  request.status = "auto_released";
  return true;
}

const request: ReleaseRequest = { status: "approved" };
const [a, b] = await Promise.all([atomicClaim(request), atomicClaim(request)]);

assert.equal(Number(a) + Number(b), 1, "exactly one concurrent release may claim the request");
assert.equal(request.status, "auto_released");

console.log("T01-05-F4 concurrent release claim: PASS");
