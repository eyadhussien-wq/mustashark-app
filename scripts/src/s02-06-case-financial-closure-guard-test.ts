import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import {
  caseMembershipsTable,
  casesTable,
  db,
  pool,
  agreementsTable,
  representationMilestonesTable,
  representationQuotesTable,
  usersTable,
} from "@workspace/db";
import { transitionCase } from "../../artifacts/api-server/src/services/cases";

function id(prefix: string) {
  return `${prefix}-${crypto.randomUUID()}`;
}

async function expectError(action: () => Promise<unknown>, expectedPrefix: string) {
  await assert.rejects(action, (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    assert.equal(message.startsWith(expectedPrefix), true, `expected ${expectedPrefix}, got ${message}`);
    return true;
  });
}

type Fixture = {
  clientId: string;
  lawyerId: string;
  quoteId: string;
  agreementId: string;
  caseId: string;
  milestoneIds: string[];
};

async function seedFixture(): Promise<Fixture> {
  const clientId = id("s02-06-client");
  const lawyerId = id("s02-06-lawyer");
  const quoteId = id("s02-06-quote");
  const agreementId = id("s02-06-agreement");
  const caseId = id("s02-06-case");
  const milestoneIds = [id("s02-06-stage-1"), id("s02-06-stage-2")];

  await db.insert(usersTable).values([
    {
      id: clientId,
      name: "S02.6 Test Client",
      email: `${clientId}@example.test`,
      role: "client",
      accountStatus: "active",
      authProvider: "local",
    },
    {
      id: lawyerId,
      name: "S02.6 Test Lawyer",
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
    title: "S02.6 Financial Closure Fixture",
    description: "Case financial closure guard test fixture",
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
      id: id("s02-06-client-membership"),
      caseId,
      userId: clientId,
      role: "client",
      status: "active",
    },
    {
      id: id("s02-06-lawyer-membership"),
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
      title: "S02.6 Stage 1",
      status: "funded",
    },
    {
      id: milestoneIds[1],
      quoteId,
      stage: "stage_2",
      percentage: "50.00",
      amount: "100.00",
      title: "S02.6 Stage 2",
      status: "released",
    },
  ]);

  return { clientId, lawyerId, quoteId, agreementId, caseId, milestoneIds };
}

async function cleanup(fixture: Fixture | undefined) {
  if (!fixture) return;
  await db.delete(caseMembershipsTable).where(eq(caseMembershipsTable.caseId, fixture.caseId));
  await db.delete(casesTable).where(eq(casesTable.id, fixture.caseId));
  await db.delete(representationMilestonesTable).where(inArray(representationMilestonesTable.id, fixture.milestoneIds));
  await db.delete(agreementsTable).where(eq(agreementsTable.id, fixture.agreementId));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, fixture.quoteId));
  await db.delete(usersTable).where(inArray(usersTable.id, [fixture.clientId, fixture.lawyerId]));
}

async function run() {
  let fixture: Fixture | undefined;

  try {
    fixture = await seedFixture();

    await expectError(
      () =>
        transitionCase({
          caseId: fixture!.caseId,
          targetStatus: "completed",
          actorUserId: fixture!.lawyerId,
          actorRole: "lawyer",
        }),
      "CASE_FINANCIAL_CLOSURE_BLOCKED:",
    );
    console.log("- blocks completion while a milestone is funded: PASS");

    await db
      .update(representationMilestonesTable)
      .set({ status: "cancelled", updatedAt: new Date() })
      .where(eq(representationMilestonesTable.id, fixture.milestoneIds[0]));

    const completed = await transitionCase({
      caseId: fixture.caseId,
      targetStatus: "completed",
      actorUserId: fixture.lawyerId,
      actorRole: "lawyer",
    });
    assert.equal(completed.case.status, "completed");
    assert.ok(completed.case.completedAt);
    console.log("- allows completion when all milestones are released/cancelled: PASS");

    const closed = await transitionCase({
      caseId: fixture.caseId,
      targetStatus: "closed",
      actorUserId: fixture.clientId,
      actorRole: "admin",
    });
    assert.equal(closed.case.status, "closed");
    assert.ok(closed.case.closedAt);
    console.log("- allows final closure after financial settlement: PASS");

    console.log("S02-06 CASE FINANCIAL CLOSURE GUARD TEST PASSED");
  } finally {
    await cleanup(fixture).catch(() => undefined);
    await pool.end();
  }
}

await run();
