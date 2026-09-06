import assert from "node:assert/strict";
import test from "node:test";
import { randomUUID } from "node:crypto";
import { eq } from "drizzle-orm";
import {
  assertNoUebDbActorContext,
  db,
  lawyerProfileChangeRequestsTable,
  pool,
  usersTable,
  withUeb,
} from "../src/index.ts";
import { updateProfile } from "../../../artifacts/api-server/src/controllers/profileMutations.ts";

const databaseUrl = process.env.DATABASE_URL ?? "";
const parsed = new URL(databaseUrl || "postgres://invalid");
if (!databaseUrl || !["localhost", "127.0.0.1", "::1"].includes(parsed.hostname) || !parsed.pathname.endsWith("_test")) {
  throw new Error("ID-01-C Oracle requires an isolated localhost database ending in _test");
}

function request(userId: string, role: "client" | "lawyer", body: unknown) {
  const response = {
    statusCode: 200,
    payload: undefined as unknown,
    status(code: number) {
      response.statusCode = code;
      return response;
    },
    json(payload: unknown) {
      response.payload = payload;
      return response;
    },
  };
  const req = {
    authUser: { userId, role },
    body,
    log: { info() {}, error() {} },
  } as any;
  return { req, res: response };
}

async function insertUser(id: string, role: "client" | "lawyer") {
  await db.insert(usersTable).values({
    id,
    name: `ID01C ${role}`,
    email: `${id}@id01c.test`,
    role,
    accountStatus: "active",
  });
}

test("ID-01-C UEB profile mutation oracle", async () => {
  const actorA = `id01c-a-${randomUUID()}`;
  const actorB = `id01c-b-${randomUUID()}`;
  const client = `id01c-client-${randomUUID()}`;

  try {
    await insertUser(actorA, "lawyer");
    await insertUser(actorB, "lawyer");
    await insertUser(client, "client");

    await db.insert(lawyerProfileChangeRequestsTable).values({
      id: `pcr-${randomUUID()}`,
      lawyerId: actorA,
      field: "bio",
      oldValue: "old",
      newValue: "pending-old",
      status: "pending",
    });

    const aCall = request(actorA, "lawyer", {
      name: "Lawyer A Updated",
      specialization: "Corporate",
      bio: "New bio A",
      hourlyRate: 125,
    });
    await updateProfile(aCall.req, aCall.res);
    assert.equal(aCall.res.statusCode, 200);
    assert.deepEqual((aCall.res.payload as any).pendingFields.sort(), ["bio", "hourlyRate", "specialization"]);

    const bCall = request(actorB, "lawyer", {
      specialization: "Family",
      bio: "New bio B",
      hourlyRate: 90,
    });
    await updateProfile(bCall.req, bCall.res);
    assert.equal(bCall.res.statusCode, 200);

    const aRequests = await db
      .select({ lawyerId: lawyerProfileChangeRequestsTable.lawyerId, field: lawyerProfileChangeRequestsTable.field })
      .from(lawyerProfileChangeRequestsTable)
      .where(eq(lawyerProfileChangeRequestsTable.lawyerId, actorA));
    const bRequests = await db
      .select({ lawyerId: lawyerProfileChangeRequestsTable.lawyerId, field: lawyerProfileChangeRequestsTable.field })
      .from(lawyerProfileChangeRequestsTable)
      .where(eq(lawyerProfileChangeRequestsTable.lawyerId, actorB));
    assert.equal(aRequests.length, 3);
    assert.equal(bRequests.length, 3);
    assert.ok(aRequests.every((row) => row.lawyerId === actorA));
    assert.ok(bRequests.every((row) => row.lawyerId === actorB));

    const clientCall = request(client, "client", { name: "Client Updated" });
    await updateProfile(clientCall.req, clientCall.res);
    assert.equal(clientCall.res.statusCode, 200);
    assert.deepEqual((clientCall.res.payload as any).pendingFields, []);

    const aConcurrent = request(actorA, "lawyer", { phone: "+962790000001" });
    const bConcurrent = request(actorB, "lawyer", { phone: "+962790000002" });
    await Promise.all([
      updateProfile(aConcurrent.req, aConcurrent.res),
      updateProfile(bConcurrent.req, bConcurrent.res),
    ]);
    assert.equal(aConcurrent.res.statusCode, 200);
    assert.equal(bConcurrent.res.statusCode, 200);

    const before = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, actorA));
    await assert.rejects(
      withUeb(db, { id: actorA, role: "lawyer" }, async (tx) => {
        await tx.update(usersTable).set({ name: "MUST-ROLLBACK" }).where(eq(usersTable.id, actorA));
        throw new Error("ID-01-C intentional rollback oracle");
      }),
    );
    const after = await db
      .select({ name: usersTable.name })
      .from(usersTable)
      .where(eq(usersTable.id, actorA));
    assert.deepEqual(after, before);

    await assertNoUebDbActorContext(db);

    console.log(JSON.stringify({
      harness: "M0-PROOF-HARNESS-001",
      mode: "ID-01-C-PROFILE-MUTATIONS",
      proofs: [
        "trusted-actor",
        "UEB-transaction",
        "A/B-negative-isolation",
        "atomic-mutation",
        "rollback-no-partial-commit",
        "concurrency",
        "context-cleanup",
      ],
      result: "DB-ORACLE-PASS",
    }));
  } finally {
    await db.delete(lawyerProfileChangeRequestsTable).where(eq(lawyerProfileChangeRequestsTable.lawyerId, actorA));
    await db.delete(lawyerProfileChangeRequestsTable).where(eq(lawyerProfileChangeRequestsTable.lawyerId, actorB));
    await db.delete(usersTable).where(eq(usersTable.id, actorA));
    await db.delete(usersTable).where(eq(usersTable.id, actorB));
    await db.delete(usersTable).where(eq(usersTable.id, client));
    await assertNoUebDbActorContext(db);
    await pool.end();
  }
});
