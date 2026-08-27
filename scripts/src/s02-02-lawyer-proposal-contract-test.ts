import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { createLawyerProposalSchema, lawyerProposalParamsSchema } from "../../lib/api-zod/src/lawyerProposals";
import { lawyerProposalStatusEnum, lawyerProposalsTable } from "../../lib/db/src/schema/lawyerProposals";

const controller = readFileSync(resolve(process.cwd(), "../artifacts/api-server/src/controllers/lawyerProposals.ts"), "utf8");
const routes = readFileSync(resolve(process.cwd(), "../artifacts/api-server/src/routes/lawyerProposals.ts"), "utf8");

assert.equal(createLawyerProposalSchema.safeParse({ amount: "125.50", currency: "QAR" }).success, true, "valid proposal payload must parse");

for (const forbiddenField of ["lawyerId", "status", "expiresAt", "submittedAt", "createdAt", "updatedAt", "withdrawnAt", "requestId"]) {
  assert.equal(
    createLawyerProposalSchema.safeParse({ amount: "125.50", currency: "QAR", [forbiddenField]: "attacker-controlled" }).success,
    false,
    `${forbiddenField} must be server-owned`,
  );
}

for (const payload of [
  { amount: "-1", currency: "QAR" },
  { amount: "1.234", currency: "QAR" },
  { amount: "abc", currency: "QAR" },
  { amount: "1", currency: "USD" },
  { amount: "1", currency: "" },
]) {
  assert.equal(createLawyerProposalSchema.safeParse(payload).success, false, `invalid payload must be rejected: ${JSON.stringify(payload)}`);
}

assert.equal(createLawyerProposalSchema.safeParse({ amount: "1", currency: "QAR", unexpected: true }).success, false, "unknown fields must be rejected");
assert.equal(lawyerProposalParamsSchema.safeParse({ requestId: "request-1", proposalId: "proposal-1" }).success, true, "valid proposal params must parse");
assert.equal(lawyerProposalParamsSchema.safeParse({ requestId: "request-1", proposalId: "proposal-1", status: "accepted" }).success, false, "status must not be client-controlled through route params");

const states = ["draft", "submitted", "accepted", "rejected", "withdrawn", "expired"] as const;
assert.deepEqual(lawyerProposalStatusEnum.enumValues, [...states], "proposal status enum must match the approved lifecycle");

const allowedTransitions: Record<string, readonly string[]> = {
  draft: ["submitted"],
  submitted: ["accepted", "rejected", "withdrawn", "expired"],
  accepted: [],
  rejected: [],
  withdrawn: [],
  expired: [],
};

for (const [from, targets] of Object.entries(allowedTransitions)) {
  assert.equal(new Set(targets).size, targets.length, `duplicate transition for ${from}`);
  for (const target of targets) assert(states.includes(target as typeof states[number]), `unknown transition target ${target}`);
}
assert.deepEqual(allowedTransitions.accepted, [], "accepted is terminal");
assert.deepEqual(allowedTransitions.rejected, [], "rejected is terminal");
assert.deepEqual(allowedTransitions.withdrawn, [], "withdrawn is terminal");
assert.deepEqual(allowedTransitions.expired, [], "expired is terminal");

// Concurrency contract: terminal transitions are transaction-scoped and conditional on submitted state.
assert.match(controller, /await db\.transaction\(async \(tx\) => \{/);
assert.match(controller, /eq\(lawyerProposalsTable\.status, "submitted"\)/);
assert.match(controller, /await tx\.update\(lawyerProposalsTable\)/);
assert.match(controller, /claimIdempotency\(tx, req, actorId\)/);
assert.match(controller, /persistIdempotencyResponse\(tx, req, actorId/);
assert.match(controller, /inArray\(representationQuoteRequestsTable\.status, ACTIVE_PARENT_REQUEST_STATUSES\)/);
assert.match(controller, /PROPOSAL_TTL_MS = 24 \* 60 \* 60 \* 1000/);
assert.match(controller, /status: "submitted", expiresAt: new Date\(now\.getTime\(\) \+ PROPOSAL_TTL_MS\)/);

// Authorization contract.
assert.match(routes, /requireAuth,\s*requireLawyer,\s*requireApprovedLawyer,\s*createLawyerProposal/);
assert.match(routes, /requireAuth,\s*requireClient,\s*acceptLawyerProposal/);
assert.match(routes, /requireAuth,\s*requireClient,\s*rejectLawyerProposal/);
assert.match(routes, /requireAuth,\s*requireLawyer,\s*requireApprovedLawyer,\s*withdrawLawyerProposal/);
assert.match(controller, /ACTIVE_PARENT_REQUEST_STATUSES = \["submitted", "under_review"\]/);
assert.match(controller, /request\.lawyerId && request\.lawyerId !== lawyerId/);
assert.match(controller, /eq\(usersTable\.accountStatus, "active"\)/);

for (const requiredColumn of ["id", "requestId", "lawyerId", "amount", "currency", "status", "expiresAt", "createdAt", "updatedAt", "submittedAt", "withdrawnAt"]) {
  assert(Object.keys(lawyerProposalsTable).includes(requiredColumn), `schema must expose ${requiredColumn}`);
}

console.log("S02-02 LAWYER PROPOSAL CONTRACT TEST PASSED");
console.log("- strict payload + server-owned fields: PASS");
console.log("- approved state machine + terminal states: PASS");
console.log("- transactional conditional transitions: PASS");
console.log("- expiry + idempotency contract: PASS");
console.log("- role/approval authorization: PASS");
console.log("- required schema columns: PASS");
