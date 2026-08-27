import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import {
  db,
  lawyerVerificationsTable,
  pool,
  usersTable,
} from "@workspace/db";
import { isApprovedLawyerVerification } from "../../artifacts/api-server/src/services/lawyerEligibility";

type Fixture = {
  userId: string;
  verificationId: string;
};

function isOperationallyEligible(
  user: Pick<typeof usersTable.$inferSelect, "role" | "accountStatus" | "deletedAt">,
  verificationStatus: string | null | undefined,
) {
  return (
    user.role === "lawyer" &&
    user.accountStatus === "active" &&
    user.deletedAt === null &&
    isApprovedLawyerVerification(verificationStatus)
  );
}

async function createFixture(): Promise<Fixture> {
  const suffix = crypto.randomUUID();
  const userId = `s02-07-lawyer-${suffix}`;
  const verificationId = `s02-07-verification-${suffix}`;
  const now = new Date();

  await db.insert(usersTable).values({
    id: userId,
    name: "S02-07 Eligibility Fixture",
    email: `s02-07-${suffix}@example.test`,
    role: "lawyer",
    accountStatus: "active",
    deletedAt: null,
    createdAt: now,
    updatedAt: now,
  });

  await db.insert(lawyerVerificationsTable).values({
    id: verificationId,
    userId,
    status: "approved",
    reviewedAt: now,
    createdAt: now,
    updatedAt: now,
  });

  return { userId, verificationId };
}

async function cleanup(fixture: Fixture | undefined) {
  if (!fixture) return;
  await db
    .delete(lawyerVerificationsTable)
    .where(eq(lawyerVerificationsTable.id, fixture.verificationId));
  await db.delete(usersTable).where(eq(usersTable.id, fixture.userId));
}

async function run() {
  let fixture: Fixture | undefined;

  try {
    fixture = await createFixture();

    const loadUser = async () => {
      const [user] = await db
        .select({
          role: usersTable.role,
          accountStatus: usersTable.accountStatus,
          deletedAt: usersTable.deletedAt,
        })
        .from(usersTable)
        .where(eq(usersTable.id, fixture!.userId))
        .limit(1);
      assert.ok(user, "fixture lawyer must exist in users");
      return user;
    };

    const loadVerificationStatus = async () => {
      const [verification] = await db
        .select({ status: lawyerVerificationsTable.status })
        .from(lawyerVerificationsTable)
        .where(eq(lawyerVerificationsTable.id, fixture!.verificationId))
        .limit(1);
      return verification?.status ?? null;
    };

    const baselineUser = await loadUser();
    const baselineVerification = await loadVerificationStatus();
    assert.equal(baselineUser.role, "lawyer");
    assert.equal(baselineUser.accountStatus, "active");
    assert.equal(baselineUser.deletedAt, null);
    assert.equal(baselineVerification, "approved");
    assert.equal(
      isOperationallyEligible(baselineUser, baselineVerification),
      true,
      "approved, active, non-deleted lawyer must be operationally eligible",
    );
    console.log("- approved + active + lawyer + non-deleted: PASS");

    await db
      .update(lawyerVerificationsTable)
      .set({ status: "pending", updatedAt: new Date() })
      .where(eq(lawyerVerificationsTable.id, fixture.verificationId));
    assert.equal(
      isOperationallyEligible(await loadUser(), await loadVerificationStatus()),
      false,
      "pending professional verification must block eligibility",
    );
    console.log("- pending verification: BLOCKED as expected");

    await db
      .update(lawyerVerificationsTable)
      .set({ status: "rejected", updatedAt: new Date() })
      .where(eq(lawyerVerificationsTable.id, fixture.verificationId));
    assert.equal(
      isOperationallyEligible(await loadUser(), await loadVerificationStatus()),
      false,
      "rejected professional verification must block eligibility",
    );
    console.log("- rejected verification: BLOCKED as expected");

    await db
      .update(lawyerVerificationsTable)
      .set({ status: "approved", updatedAt: new Date() })
      .where(eq(lawyerVerificationsTable.id, fixture.verificationId));

    await db
      .update(usersTable)
      .set({ accountStatus: "suspended", updatedAt: new Date() })
      .where(eq(usersTable.id, fixture.userId));
    assert.equal(
      isOperationallyEligible(await loadUser(), await loadVerificationStatus()),
      false,
      "suspended lawyer must not be operationally eligible",
    );
    console.log("- suspended account: BLOCKED as expected");

    await db
      .update(usersTable)
      .set({ accountStatus: "active", deletedAt: new Date(), updatedAt: new Date() })
      .where(eq(usersTable.id, fixture.userId));
    assert.equal(
      isOperationallyEligible(await loadUser(), await loadVerificationStatus()),
      false,
      "deleted lawyer must not be operationally eligible",
    );
    console.log("- deletedAt populated: BLOCKED as expected");

    await db
      .update(usersTable)
      .set({ role: "client", deletedAt: null, updatedAt: new Date() })
      .where(eq(usersTable.id, fixture.userId));
    assert.equal(
      isOperationallyEligible(await loadUser(), await loadVerificationStatus()),
      false,
      "non-lawyer role must never be operationally eligible as a lawyer",
    );
    console.log("- non-lawyer role: BLOCKED as expected");

    assert.equal(
      isApprovedLawyerVerification("approved"),
      true,
      "shared professional verification predicate must accept approved",
    );
    assert.equal(
      isApprovedLawyerVerification("pending"),
      false,
      "shared professional verification predicate must reject pending",
    );
    assert.equal(
      isApprovedLawyerVerification("rejected"),
      false,
      "shared professional verification predicate must reject rejected",
    );
    assert.equal(
      isApprovedLawyerVerification(null),
      false,
      "missing verification must be rejected",
    );
    console.log("- shared professional verification predicate: PASS");

    console.log("S02-07 LAWYER OPERATIONAL ELIGIBILITY TEST PASSED");
  } finally {
    await cleanup(fixture).catch(() => undefined);
    await pool.end();
  }
}

await run();
