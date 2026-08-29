import assert from "node:assert/strict";
import { after, test } from "node:test";

const testDatabaseUrl = process.env.ELIGIBILITY_TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  test("LAWYER ELIGIBILITY: isolated test database is required", () => {
    assert.fail(
      "ELIGIBILITY_TEST_DATABASE_URL is required; refusing to run eligibility tests without an isolated Test DB",
    );
  });
}

if (testDatabaseUrl && /(prod|production|live)/i.test(testDatabaseUrl)) {
  test("LAWYER ELIGIBILITY: production database URL is forbidden", () => {
    assert.fail("ELIGIBILITY_TEST_DATABASE_URL appears to reference production; refusing to run");
  });
}

process.env.DATABASE_URL = testDatabaseUrl ?? "";

const { db, pool, usersTable, lawyerVerificationsTable } = await import("@workspace/db");
const { eq } = await import("drizzle-orm");
const { isLawyerOperationallyEligible } = await import("./lawyerEligibility");

const createdUserIds: string[] = [];

const cases = [
  { name: "pending + active", verification: "pending" as const, account: "active" as const, expected: false },
  { name: "approved + pending", verification: "approved" as const, account: "pending" as const, expected: false },
  { name: "rejected + active", verification: "rejected" as const, account: "active" as const, expected: false },
  { name: "approved + suspended", verification: "approved" as const, account: "suspended" as const, expected: false },
  { name: "approved + terminated", verification: "approved" as const, account: "terminated" as const, expected: false },
  { name: "approved + active", verification: "approved" as const, account: "active" as const, expected: true },
];

test("S02-07 Eligibility Matrix: exactly one of six explicit state pairs is eligible", async () => {
  for (const [index, scenario] of cases.entries()) {
    const id = `eligibility-matrix-${Date.now()}-${index}-${Math.random().toString(36).slice(2)}`;
    createdUserIds.push(id);

    await db.insert(usersTable).values({
      id,
      name: `Eligibility Matrix ${scenario.name}`,
      email: `${id}@example.test`,
      role: "lawyer",
      authProvider: "local",
      accountStatus: scenario.account,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await db.insert(lawyerVerificationsTable).values({
      id: `${id}-verification`,
      userId: id,
      status: scenario.verification,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const actual = await isLawyerOperationallyEligible(id);
    assert.equal(actual, scenario.expected, `${scenario.name}: expected ${scenario.expected}, got ${actual}`);
    console.log(`ELIGIBILITY_MATRIX=${scenario.name} EXPECTED=${scenario.expected} ACTUAL=${actual}`);
  }
});

test("S02-07 Eligibility Matrix: missing verification is denied even when account is active", async () => {
  const id = `eligibility-matrix-missing-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  createdUserIds.push(id);

  await db.insert(usersTable).values({
    id,
    name: "Eligibility Matrix Missing Verification",
    email: `${id}@example.test`,
    role: "lawyer",
    authProvider: "local",
    accountStatus: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const actual = await isLawyerOperationallyEligible(id);
  assert.equal(actual, false, "missing verification must fail closed");
  console.log("ELIGIBILITY_MATRIX=missing + active EXPECTED=false ACTUAL=false");
});

after(async () => {
  for (const id of createdUserIds) {
    await db.delete(lawyerVerificationsTable).where(eq(lawyerVerificationsTable.userId, id));
    await db.delete(usersTable).where(eq(usersTable.id, id));
  }
  await pool.end();
});
