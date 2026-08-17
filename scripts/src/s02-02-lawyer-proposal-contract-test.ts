import assert from "node:assert/strict";
import {
  createLawyerProposalSchema,
  lawyerProposalParamsSchema,
} from "../../lib/api-zod/src/lawyerProposals";
import {
  lawyerProposalStatusEnum,
  lawyerProposalsTable,
} from "../../lib/db/src/schema/lawyerProposals";

const valid = createLawyerProposalSchema.safeParse({ amount: "125.50", currency: "QAR" });
assert.equal(valid.success, true, "valid proposal payload must parse");

for (const forbiddenField of [
  "lawyerId",
  "status",
  "expiresAt",
  "submittedAt",
  "createdAt",
  "updatedAt",
  "withdrawnAt",
  "requestId",
]) {
  const result = createLawyerProposalSchema.safeParse({
    amount: "125.50",
    currency: "QAR",
    [forbiddenField]: "attacker-controlled",
  });
  assert.equal(result.success, false, `${forbiddenField} must be server-owned`);
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

assert.equal(
  createLawyerProposalSchema.safeParse({ amount: "1", currency: "QAR", unexpected: true }).success,
  false,
  "unknown fields must be rejected",
);

assert.equal(
  lawyerProposalParamsSchema.safeParse({ requestId: "request-1", proposalId: "proposal-1" }).success,
  true,
  "valid proposal params must parse",
);
assert.equal(
  lawyerProposalParamsSchema.safeParse({ requestId: "request-1", proposalId: "proposal-1", status: "accepted" }).success,
  false,
  "status must not be client-controlled through route params",
);

assert.deepEqual(
  lawyerProposalStatusEnum.enumValues,
  ["draft", "submitted", "accepted", "rejected", "withdrawn", "expired"],
  "proposal status enum must match the approved transition model",
);

const schemaColumns = Object.keys(lawyerProposalsTable);
for (const requiredColumn of [
  "id",
  "requestId",
  "lawyerId",
  "amount",
  "currency",
  "status",
  "expiresAt",
  "createdAt",
  "updatedAt",
  "submittedAt",
  "withdrawnAt",
]) {
  assert(schemaColumns.includes(requiredColumn), `schema must expose ${requiredColumn}`);
}

console.log("S02-02 LAWYER PROPOSAL CONTRACT TEST PASSED");
console.log("- strict create payload: PASS");
console.log("- server-owned identity/state/timestamps: PASS");
console.log("- amount/currency validation: PASS");
console.log("- route parameter validation: PASS");
console.log("- approved proposal status enum: PASS");
console.log("- required schema columns: PASS");
