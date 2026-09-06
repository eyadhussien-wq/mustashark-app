import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { and, eq, sql } from "drizzle-orm";
import {
  assertNoUebDbActorContext,
  db,
  escrowAccountsTable,
  escrowTransactionsTable,
  idempotencyKeysTable,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";
import { allocateMilestone } from "../src/services/allocateMilestone.ts";
import { allocateMilestoneController } from "../src/controllers/allocateMilestone.ts";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL_MISSING");
const url = new URL(databaseUrl);
if (!["localhost", "127.0.0.1", "::1"].includes(url.hostname) || !url.pathname.slice(1).endsWith("_test")) {
  throw new Error(`NON_DISPOSABLE_DATABASE_REJECTED:${url.hostname}${url.pathname}`);
}

const ids = {
  clientA: `e02-ci01-client-a-${randomUUID()}`,
  clientB: `e02-ci01-client-b-${randomUUID()}`,
  lawyerA: `e02-ci01-lawyer-a-${randomUUID()}`,
  quoteA: `e02-ci01-quote-a-${randomUUID()}`,
  milestoneA: `e02-ci01-milestone-a-${randomUUID()}`,
  milestoneInsufficient: `e02-ci01-milestone-insufficient-${randomUUID()}`,
  milestoneWrongState: `e02-ci01-milestone-wrong-state-${randomUUID()}`,
  escrowA: `e02-ci01-escrow-a-${randomUUID()}`,
};

const makeReq = (actorId: string, role: string, key: string, body: unknown = {}) => ({
  authUser: { userId: actorId, role },
  method: "POST",
  path: `/representation-milestones/${ids.milestoneA}/allocate`,
  params: { milestoneId: ids.milestoneA },
  query: {},
  body,
  route: { path: "/representation-milestones/:milestoneId/allocate" },
  get(name: string) {
    return name.toLowerCase() === "idempotency-key" ? key : undefined;
  },
}) as any;

const snapshot = async () => ({
  milestone: await db.select().from(representationMilestonesTable).where(eq(representationMilestonesTable.id, ids.milestoneA)),
  escrow: await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, ids.escrowA)),
  transactions: await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.milestoneId, ids.milestoneA)),
  idempotency: await db.select().from(idempotencyKeysTable).where(eq(idempotencyKeysTable.userId, ids.clientA)),
});

await db.insert(usersTable).values([
  { id: ids.clientA, name: "E02 CI-01 Client A", email: `${ids.clientA}@example.test`, role: "client", accountStatus: "active", authProvider: "local" },
  { id: ids.clientB, name: "E02 CI-01 Client B", email: `${ids.clientB}@example.test`, role: "client", accountStatus: "active", authProvider: "local" },
  { id: ids.lawyerA, name: "E02 CI-01 Lawyer A", email: `${ids.lawyerA}@example.test`, role: "lawyer", accountStatus: "active", authProvider: "local" },
]);

await db.insert(representationQuotesTable).values({
  id: ids.quoteA,
  clientId: ids.clientA,
  lawyerId: ids.lawyerA,
  title: "E02 CI-01 proof quote",
  description: "synthetic",
  totalAmount: "150.00",
  currency: "JOD",
  status: "active",
  fundingMode: "full",
});

await db.insert(representationMilestonesTable).values([
  { id: ids.milestoneA, quoteId: ids.quoteA, stage: "stage_1", percentage: "66.67", amount: "100.00", title: "Allocation A", status: "funded" },
  { id: ids.milestoneInsufficient, quoteId: ids.quoteA, stage: "stage_2", percentage: "33.33", amount: "100.00", title: "Allocation insufficient", status: "funded" },
  { id: ids.milestoneWrongState, quoteId: ids.quoteA, stage: "stage_3", percentage: "0.00", amount: "0.00", title: "Wrong state", status: "awaiting_deposit" },
]);

await db.insert(escrowAccountsTable).values({
  id: ids.escrowA,
  quoteId: ids.quoteA,
  currency: "JOD",
  depositedAmount: "150.00",
  allocatedAmount: "0.00",
  releasedAmount: "0.00",
  refundedAmount: "0.00",
});

const before = await snapshot();
const success = await allocateMilestone(makeReq(ids.clientA, "client", "e02-ci01-success"), ids.milestoneA, ids.clientA);
assert.equal(success.status, 200);
const after = await snapshot();
assert.equal(after.milestone[0]?.status, "in_progress");
assert.equal(after.escrow[0]?.allocatedAmount, "100.00");
assert.equal(after.transactions.length, 1);
assert.equal(after.transactions[0]?.type, "stage_allocation");
assert.equal(after.transactions[0]?.amount, "100.00");
assert.equal(after.transactions[0]?.currency, "JOD");
assert.equal(after.transactions[0]?.createdBy, ids.clientA);
assert.equal(after.idempotency.length, 1);
assert.notDeepEqual(after, before);
console.log(JSON.stringify({ oracle: "F01-AUTHORITY-DB-DERIVED-INPUTS", result: "PASS" }));

const replay = await allocateMilestone(makeReq(ids.clientA, "client", "e02-ci01-success"), ids.milestoneA, ids.clientA);
assert.equal(replay.replay, true);
const replayState = await snapshot();
assert.equal(replayState.transactions.length, 1);
assert.equal(replayState.escrow[0]?.allocatedAmount, "100.00");
console.log(JSON.stringify({ oracle: "F04-F05-IDEMPOTENT-REPLAY", result: "PASS" }));

const concurrentKey = "e02-ci01-concurrent-same-key";
const concurrent = await Promise.all([
  allocateMilestone(makeReq(ids.clientA, "client", concurrentKey), ids.milestoneInsufficient, ids.clientA),
  allocateMilestone(makeReq(ids.clientA, "client", concurrentKey), ids.milestoneInsufficient, ids.clientA),
]);
assert.equal(concurrent.filter((r) => "status" in r && r.status === 200).length, 1);
assert.equal(concurrent.filter((r) => "replay" in r && r.replay).length, 1);
console.log(JSON.stringify({ oracle: "F07-CONCURRENCY-SAME-IDEMPOTENCY-KEY", result: "PASS" }));

const crossActorBefore = await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, ids.escrowA));
const crossActor = await allocateMilestone(makeReq(ids.clientB, "client", "e02-ci01-cross-actor"), ids.milestoneA, ids.clientB);
assert.deepEqual(crossActor, { error: "forbidden" });
const crossActorAfter = await db.select().from(escrowAccountsTable).where(eq(escrowAccountsTable.id, ids.escrowA));
assert.deepEqual(crossActorAfter, crossActorBefore);
assert.equal(await db.select({ count: sql<number>`count(*)` }).from(escrowTransactionsTable).where(and(eq(escrowTransactionsTable.milestoneId, ids.milestoneA), eq(escrowTransactionsTable.createdBy, ids.clientB))).then((r) => Number(r[0]?.count ?? 0)), 0);
console.log(JSON.stringify({ oracle: "F13-CROSS-ACTOR-DENY", result: "PASS" }));

const wrongState = await allocateMilestone(makeReq(ids.clientA, "client", "e02-ci01-wrong-state"), ids.milestoneWrongState, ids.clientA);
assert.deepEqual(wrongState, { error: "milestone_not_allocatable" });
const insufficient = await allocateMilestone(makeReq(ids.clientA, "client", "e02-ci01-insufficient"), ids.milestoneInsufficient, ids.clientA);
assert.deepEqual(insufficient, { error: "insufficient_unallocated_funds" });
console.log(JSON.stringify({ oracle: "F06-PRECONDITION-DENIALS", result: "PASS" }));

const forged = await allocateMilestone(makeReq(ids.clientA, "client", "e02-ci01-forged", { amount: "1.00", currency: "QAR" }), ids.milestoneA, ids.clientA);
assert.equal("replay" in forged, true);
assert.equal((await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.milestoneId, ids.milestoneA))).at(0)?.amount, "100.00");
assert.equal((await db.select().from(escrowTransactionsTable).where(eq(escrowTransactionsTable.milestoneId, ids.milestoneA))).at(0)?.currency, "JOD");
console.log(JSON.stringify({ oracle: "F02-CLIENT-AMOUNT-CURRENCY-CANNOT-OVERRIDE", result: "PASS" }));

const mismatchReq = makeReq(ids.clientA, "client", "e02-ci01-success", { changed: true });
await assert.rejects(
  () => allocateMilestone(mismatchReq, ids.milestoneA, ids.clientA),
  /IDEMPOTENCY_REQUEST_MISMATCH/,
);
console.log(JSON.stringify({ oracle: "F05-IDEMPOTENCY-MISMATCH-DENY", result: "PASS" }));

const wrongRoleReq = makeReq(ids.lawyerA, "lawyer", "e02-ci01-wrong-role");
const response = { statusCode: 200, body: undefined as unknown, status(code: number) { this.statusCode = code; return this; }, json(body: unknown) { this.body = body; return this; } };
await allocateMilestoneController(wrongRoleReq, response as any);
assert.equal(response.statusCode, 403);
assert.deepEqual(response.body, { ok: false, error: "client_role_required" });
console.log(JSON.stringify({ oracle: "F01-CONTROLLER-ROLE-GATE", result: "PASS" }));

await assert.rejects(
  () => allocateMilestone({ ...makeReq(ids.clientA, "client", "e02-ci01-actor-mismatch"), authUser: undefined }, ids.milestoneA, ids.clientA),
  /UEB_TRUSTED_ACTOR_REQUIRED/,
);
await assert.rejects(
  () => allocateMilestone(makeReq(ids.clientA, "client", "e02-ci01-actor-mismatch"), ids.milestoneA, ids.clientB),
  /UEB_ACTOR_ARGUMENT_MISMATCH/,
);
await assertNoUebDbActorContext(db);
console.log(JSON.stringify({ oracle: "F01-UEB-TRUSTED-ACTOR-AND-CONTEXT-CLEANUP", result: "PASS" }));

await db.delete(idempotencyKeysTable).where(sql`user_id in (${sql.join([sql`${ids.clientA}`, sql`${ids.clientB}`], sql`, `})`);
await db.delete(escrowTransactionsTable).where(eq(escrowTransactionsTable.escrowAccountId, ids.escrowA));
await db.delete(escrowAccountsTable).where(eq(escrowAccountsTable.id, ids.escrowA));
await db.delete(representationMilestonesTable).where(eq(representationMilestonesTable.quoteId, ids.quoteA));
await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, ids.quoteA));
await db.delete(usersTable).where(sql`id in (${sql.join([sql`${ids.clientA}`, sql`${ids.clientB}`, sql`${ids.lawyerA}`], sql`, `})`);
await assertNoUebDbActorContext(db);
console.log(JSON.stringify({ harness: "E02-CI-01-CONTROLLED-MUTATION-V1", seam: "milestone-allocation-funded-to-in_progress", result: "DB-ORACLE-PASS" }));
