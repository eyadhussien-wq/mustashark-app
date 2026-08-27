import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  agreementsTable,
  caseMembershipsTable,
  casesTable,
  db,
  pool,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";
import { transitionCase } from "../../artifacts/api-server/src/services/cases";

type Fixture = {
  clientId: string;
  lawyerId: string;
  quoteId: string;
  agreementId: string;
  caseId: string;
  milestoneIds: string[];
};

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function seedFixture(): Promise<Fixture> {
  const clientId = id("s02-06-concurrency-client");
  const lawyerId = id("s02-06-concurrency-lawyer");
  const quoteId = id("s02-06-concurrency-quote");
  const agreementId = id("s02-06-concurrency-agreement");
  const caseId = id("s02-06-concurrency-case");
  const milestoneIds = [
    id("s02-06-concurrency-stage-1"),
    id("s02-06-concurrency-stage-2"),
  ];

  await db.insert(usersTable).values([
    {
      id: clientId,
      name: "S02.6 Concurrency Client",
      email: `${clientId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: lawyerId,
      name: "S02.6 Concurrency Lawyer",
      email: `${lawyerId}@example.test`,
      role: "lawyer",
      accountStatus: "active",
      authProvider: "local",
    },
  ]);

  await db.insert(representationQuotesTable).values({
    id: quoteId,
    clientId,
    lawyerId,
    title: "S02.6 Concurrency Fixture",
    description: "S02.6 transition race-condition fixture",
    totalAmount: "200.00",
    currency: "JOD",
    status: "active",
    fundingMode: "per_stage",
  });

  await db.insert(agreementsTable).values({
    id: agreementId,
    quoteId,
    clientId,
    lawyerId,
    status: "confirmed",
    confirmedAt: new Date(),
    confirmedBy: clientId,
  });

  await db.insert(casesTable).values({
    id: caseId,
    agreementId,
    clientId,
    lawyerId,
    status: "active",
  });

  await db.insert(caseMembershipsTable).values([
    {
      id: id("s02-06-concurrency-client-membership"),
      caseId,
      userId: clientId,
      role: "client",
      status: "active",
    },
    {
      id: id("s02-06-concurrency-lawyer-membership"),
      caseId,
      userId: lawyerId,
      role: "lawyer",
      status: "active",
    },
  ]);

  await db.insert(representationMilestonesTable).values([
    {
      id: milestoneIds[0],
      quoteId,
      stage: "stage_1",
      percentage: "50.00",
      amount: "100.00",
      title: "S02.6 Concurrency Stage 1",
      status: "released",
    },
    {
      id: milestoneIds[1],
      quoteId,
      stage: "stage_2",
      percentage: "50.00",
      amount: "100.00",
      title: "S02.6 Concurrency Stage 2",
      status: "released",
    },
  ]);

  return { clientId, lawyerId, quoteId, agreementId, caseId, milestoneIds };
}

async function cleanup(fixture: Fixture | undefined) {
  if (!fixture) return;

  await db
    .delete(caseMembershipsTable)
    .where(eq(caseMembershipsTable.caseId, fixture.caseId));

  await db.delete(casesTable).where(eq(casesTable.id, fixture.caseId));

  await db
    .delete(representationMilestonesTable)
    .where(inArray(representationMilestonesTable.id, fixture.milestoneIds));

  await db
    .delete(agreementsTable)
    .where(eq(agreementsTable.id, fixture.agreementId));

  await db
    .delete(representationQuotesTable)
    .where(eq(representationQuotesTable.id, fixture.quoteId));

  await db
    .delete(usersTable)
    .where(inArray(usersTable.id, [fixture.clientId, fixture.lawyerId]));
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function run() {
  let fixture: Fixture | undefined;

  try {
    fixture = await seedFixture();

    const [first, second] = await Promise.allSettled([
      transitionCase({
        caseId: fixture.caseId,
        targetStatus: "completed",
        actorUserId: fixture.lawyerId,
        actorRole: "lawyer",
      }),
      transitionCase({
        caseId: fixture.caseId,
        targetStatus: "completed",
        actorUserId: fixture.lawyerId,
        actorRole: "lawyer",
      }),
    ]);

    const results = [first, second];
    const fulfilled = results.filter((result) => result.status === "fulfilled");
    const rejected = results.filter((result) => result.status === "rejected");

    assert.equal(
      fulfilled.length,
      1,
      `expected exactly one successful transition, got ${fulfilled.length}`,
    );
    assert.equal(
      rejected.length,
      1,
      `expected exactly one rejected transition, got ${rejected.length}`,
    );

    const rejection = rejected[0];
    assert.equal(rejection.status, "rejected");
    const message = errorMessage(rejection.reason);
    assert.ok(
      message === "CASE_TRANSITION_CONFLICT" || message === "INVALID_CASE_TRANSITION",
      `unexpected concurrency rejection: ${message}`,
    );

    const successfulResult = fulfilled[0];
    assert.equal(successfulResult.status, "fulfilled");
    assert.equal(successfulResult.value.case.status, "completed");
    assert.ok(successfulResult.value.case.completedAt);

    const [finalCase] = await db
      .select()
      .from(casesTable)
      .where(eq(casesTable.id, fixture.caseId))
      .limit(1);

    assert.ok(finalCase);
    assert.equal(finalCase.status, "completed");
    assert.ok(finalCase.completedAt);
    assert.equal(finalCase.closedAt, null);

    console.log("- exactly one concurrent transition succeeds: PASS");
    console.log("- competing transition is rejected safely: PASS");
    console.log("- final state remains completed: PASS");
    console.log("- completedAt is populated and closedAt remains unset: PASS");
    console.log("S02-06 CASE TRANSITION CONCURRENCY TEST PASSED");
  } finally {
    await cleanup(fixture).catch(() => undefined);
    await pool.end();
  }
}

await run();
