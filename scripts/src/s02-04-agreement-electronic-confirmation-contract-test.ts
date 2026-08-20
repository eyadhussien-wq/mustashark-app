import assert from "node:assert/strict";

import {
  agreementStatusEnum,
  agreementVersionStatusEnum,
  agreementActorRoleEnum,
  agreementsTable,
  agreementVersionsTable,
  agreementConfirmationsTable,
  agreementEvidenceTable,
} from "../../lib/db/src/schema/agreements";

assert.deepEqual(
  agreementStatusEnum.enumValues,
  [
    "draft",
    "prepared",
    "awaiting_confirmation",
    "confirmed",
    "superseded",
    "cancelled",
    "expired",
  ],
  "S02.4 agreement lifecycle enum must remain exact",
);

assert.deepEqual(
  agreementVersionStatusEnum.enumValues,
  ["draft", "prepared", "published", "superseded"],
  "S02.4 agreement version lifecycle enum must remain exact",
);

assert.deepEqual(
  agreementActorRoleEnum.enumValues,
  ["client", "lawyer"],
  "S02.4 actor roles must remain constrained",
);

const requiredColumns = [
  [
    agreementsTable,
    [
      "id",
      "quoteId",
      "clientId",
      "lawyerId",
      "status",
      "currentVersionId",
      "confirmedAt",
      "confirmedBy",
      "createdAt",
      "updatedAt",
    ],
  ],
  [
    agreementVersionsTable,
    [
      "id",
      "agreementId",
      "version",
      "status",
      "content",
      "contentHash",
      "createdBy",
      "publishedAt",
      "createdAt",
    ],
  ],
  [
    agreementConfirmationsTable,
    [
      "id",
      "agreementId",
      "agreementVersionId",
      "actorUserId",
      "actorRole",
      "confirmedAt",
      "contentHash",
      "idempotencyKey",
      "createdAt",
    ],
  ],
  [
    agreementEvidenceTable,
    [
      "id",
      "confirmationId",
      "agreementId",
      "agreementVersionId",
      "actorUserId",
      "contentHash",
      "ipAddress",
      "userAgent",
      "metadata",
      "createdAt",
    ],
  ],
] as const;

for (const [table, columns] of requiredColumns) {
  const schemaColumns = Object.keys(table);
  for (const column of columns) {
    assert(
      schemaColumns.includes(column),
      `S02.4 schema must expose ${column}`,
    );
  }
}

const agreementSource = JSON.stringify(agreementsTable);
assert.ok(
  Object.keys(agreementsTable).includes("currentVersionId"),
  "agreements must expose currentVersionId",
);
assert.ok(
  agreementSource.length > 0,
  "agreements schema must be materialized",
);

console.log("S02-04 AGREEMENT ELECTRONIC CONFIRMATION CONTRACT TEST PASSED");
console.log("- agreement lifecycle enum: PASS");
console.log("- agreement version lifecycle enum: PASS");
console.log("- actor role contract: PASS");
console.log("- agreements schema surface: PASS");
console.log("- agreement_versions schema surface: PASS");
console.log("- agreement_confirmations schema surface: PASS");
console.log("- agreement_evidence schema surface: PASS");
console.log("- currentVersionId schema surface: PASS");
