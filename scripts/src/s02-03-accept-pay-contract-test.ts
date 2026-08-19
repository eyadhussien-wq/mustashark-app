import assert from "node:assert/strict";
import fs from "node:fs";
import {
  representationQuoteStatusEnum,
  escrowFundingModeEnum,
  representationQuotesTable,
  representationMilestonesTable,
  escrowAccountsTable,
} from "../../lib/db/src/schema/representationFinance";
import { lawyerProposalStatusEnum } from "../../lib/db/src/schema/lawyerProposals";
import { representationQuoteRequestStatusEnum } from "../../lib/db/src/schema/representationQuoteRequests";
import { generateRepresentationMilestones } from "../../artifacts/api-server/src/services/representationFinance";

assert.deepEqual(
  lawyerProposalStatusEnum.enumValues,
  ["draft", "submitted", "accepted", "rejected", "withdrawn", "expired"],
  "proposal status enum must retain the approved S02.2 lifecycle",
);

assert.deepEqual(
  representationQuoteStatusEnum.enumValues,
  ["draft", "sent", "accepted", "funding", "active", "completed", "cancelled", "disputed"],
  "quote status enum must support S02.3 funding state",
);

assert.deepEqual(
  escrowFundingModeEnum.enumValues,
  ["full", "per_stage"],
  "funding mode must remain constrained to the existing financial model",
);

assert.ok(
  representationQuoteRequestStatusEnum.enumValues.includes("converted_to_quote"),
  "quote requests must support conversion into the financial quote",
);

for (const [table, columns] of [
  [representationQuotesTable, ["id", "clientId", "lawyerId", "title", "description", "totalAmount", "currency", "status", "fundingMode", "acceptedAt"]],
  [representationMilestonesTable, ["id", "quoteId", "stage", "percentage", "amount", "title", "status"]],
  [escrowAccountsTable, ["id", "quoteId", "currency", "depositedAmount", "allocatedAmount", "releasedAmount", "refundedAmount"]],
] as const) {
  const schemaColumns = Object.keys(table);
  for (const column of columns) {
    assert(schemaColumns.includes(column), `schema must expose ${column}`);
  }
}

const milestones = generateRepresentationMilestones(1000);
assert.deepEqual(
  milestones.map((milestone) => milestone.amount),
  ["300.00", "400.00", "300.00"],
  "30/40/30 milestone calculation must remain exact",
);
assert.equal(
  milestones.reduce((sum, milestone) => sum + Number(milestone.amount), 0),
  1000,
  "milestones must reconcile exactly to the authoritative quote total",
);

const serviceSource = fs.readFileSync(
  new URL("../../artifacts/api-server/src/services/acceptLawyerProposal.ts", import.meta.url),
  "utf8",
);

for (const requiredFragment of [
  "claimIdempotency",
  "persistIdempotencyResponse",
  "status: \"accepted\"",
  "status: \"funding\"",
  "generateRepresentationMilestones",
  "escrowAccountsTable",
  "status: \"converted_to_quote\"",
  '.for("update")',
]) {
  assert(serviceSource.includes(requiredFragment), `S02.3 orchestrator must contain ${requiredFragment}`);
}

for (const forbiddenFragment of ["stripe", "paymentIntent", "webhook", "fetch(", "axios("]) {
  assert(!serviceSource.toLowerCase().includes(forbiddenFragment.toLowerCase()), `S02.3 must not own external payment capability: ${forbiddenFragment}`);
}

console.log("S02-03 ACCEPT & PAY CONTRACT TEST PASSED");
console.log("- proposal acceptance guard: PASS");
console.log("- quote funding state: PASS");
console.log("- 30/40/30 milestone invariant: PASS");
console.log("- quote/milestone/escrow schema surface: PASS");
console.log("- transactional idempotency + row locking: PASS");
console.log("- external payment capability remains out of scope: PASS");
