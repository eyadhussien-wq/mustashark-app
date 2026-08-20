import assert from "node:assert/strict";
import fs from "node:fs";

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

const agreementSource = fs.readFileSync(
  new URL("../../lib/db/src/schema/agreements.ts", import.meta.url),
  "utf8",
);

assert.match(
  agreementSource,
  /currentVersionId:[\s\S]*?\.references\(\(\) => agreementVersionsTable\.id\)/,
  "currentVersionId must retain its FK to agreement_versions.id",
);

assert.doesNotMatch(
  agreementSource,
  /currentVersionId:[\s\S]*?onDelete:\s*["']cascade["']/i,
  "currentVersionId must not introduce ON DELETE CASCADE",
);

assert.match(
  agreementSource,
  /uniqueIndex\("agreement_versions_agreement_version_uidx"\)/,
  "agreement version uniqueness constraint must remain declared",
);

assert.match(
  agreementSource,
  /uniqueIndex\("agreement_confirmations_actor_uidx"\)/,
  "actor confirmation uniqueness constraint must remain declared",
);

assert.match(
  agreementSource,
  /uniqueIndex\("agreement_confirmations_idempotency_uidx"\)/,
  "confirmation idempotency uniqueness constraint must remain declared",
);

assert.match(
  agreementSource,
  /uniqueIndex\("agreement_evidence_confirmation_uidx"\)/,
  "evidence uniqueness constraint must remain declared",
);

console.log("S02-04 AGREEMENT ELECTRONIC CONFIRMATION CONTRACT TEST PASSED");
console.log("- agreement lifecycle enum: PASS");
console.log("- agreement version lifecycle enum: PASS");
console.log("- actor role contract: PASS");
console.log("- agreements schema surface: PASS");
console.log("- agreement_versions schema surface: PASS");
console.log("- agreement_confirmations schema surface: PASS");
console.log("- agreement_evidence schema surface: PASS");
console.log("- currentVersionId FK contract: PASS");
console.log("- uniqueness/idempotency constraints: PASS");
console.log("- no ON DELETE CASCADE on currentVersionId: PASS");
