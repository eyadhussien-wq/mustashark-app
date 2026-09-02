import assert from "node:assert/strict";
import { test, after } from "node:test";

const testDatabaseUrl = process.env.SECURITY_TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  test("RUNTIME NEGATIVE AUTHZ: isolated test database is required", () => {
    assert.fail("SECURITY_TEST_DATABASE_URL is required; refusing to run runtime authorization tests without an isolated Test DB");
  });
}
if (testDatabaseUrl && /(prod|production|live)/i.test(testDatabaseUrl)) {
  test("RUNTIME NEGATIVE AUTHZ: production database URL is forbidden", () => {
    assert.fail("SECURITY_TEST_DATABASE_URL appears to reference production; refusing to run");
  });
}

process.env.DATABASE_URL = testDatabaseUrl ?? "";
process.env.NODE_ENV = "test";

const {
  db,
  pool,
  usersTable,
  bookingsTable,
  notificationsTable,
  representationQuotesTable,
  representationMilestonesTable,
  escrowAccountsTable,
  agreementsTable,
  casesTable,
  idempotencyKeysTable,
} = await import("@workspace/db");
const { eq, inArray } = await import("drizzle-orm");
const { listMyClients } = await import("../controllers/lawyerClients");
const { listMyConsultations } = await import("../controllers/lawyerConsultations");
const { getCaseController, transitionCaseController } = await import("../controllers/cases");
const { allocateMilestone } = await import("../services/allocateMilestone");
const { requireRole } = await import("../middlewares/requireRole");

const ids = {
  ownerClient: "runtime-authz-owner-client",
  outsiderClient: "runtime-authz-outsider-client",
  ownerLawyer: "runtime-authz-owner-lawyer",
  outsiderLawyer: "runtime-authz-outsider-lawyer",
  bookingOwner: "runtime-authz-booking-owner",
  bookingOther: "runtime-authz-booking-other",
  quote: "runtime-authz-quote",
  milestone: "runtime-authz-milestone",
  escrow: "runtime-authz-escrow",
  agreement: "runtime-authz-agreement",
  case: "runtime-authz-case",
  notificationOwner: "runtime-authz-notification-owner",
};

const createdUserIds = [
  ids.ownerClient,
  ids.outsiderClient,
  ids.ownerLawyer,
  ids.outsiderLawyer,
  ids.notificationOwner,
];

function responseMock() {
  const result: { statusCode: number; body: any } = { statusCode: 200, body: null };
  return {
    result,
    status(code: number) { result.statusCode = code; return this; },
    json(body: unknown) { result.body = body; return this; },
  };
}

function requestWithAuth(id: string, role: "client" | "lawyer" | "admin") {
  return {
    authUser: { id, role },
    params: {},
    body: {},
    query: {},
    method: "GET",
    path: "/security/runtime-negative",
    route: { path: "/security/runtime-negative" },
    get(name: string) {
      return name.toLowerCase() === "idempotency-key" ? `runtime-authz-${id}-${Date.now()}` : undefined;
    },
  } as any;
}

async function seedFixture() {
  const users = [
    [ids.ownerClient, "Runtime Owner Client", "runtime-owner-client@example.test", "client"],
    [ids.outsiderClient, "Runtime Outsider Client", "runtime-outsider-client@example.test", "client"],
    [ids.ownerLawyer, "Runtime Owner Lawyer", "runtime-owner-lawyer@example.test", "lawyer"],
    [ids.outsiderLawyer, "Runtime Outsider Lawyer", "runtime-outsider-lawyer@example.test", "lawyer"],
    [ids.notificationOwner, "Runtime Notification Owner", "runtime-notification-owner@example.test", "client"],
  ] as const;

  await db.insert(usersTable).values(users.map(([id, name, email, role]) => ({
    id,
    name,
    email,
    role,
    authProvider: "local" as const,
    accountStatus: "active" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
  })));

  await db.insert(bookingsTable).values([
    {
      id: ids.bookingOwner,
      serialNumber: "RUNTIME-AUTHZ-BOOKING-OWNER",
      clientId: ids.ownerClient,
      lawyerId: ids.ownerLawyer,
      subject: "Owner consultation",
      description: "Runtime authorization fixture",
      scheduledDate: "2099-01-01",
      scheduledTime: "10:00",
      type: "video",
      price: "100.00",
      status: "accepted",
      paymentStatus: "paid",
      escrowStatus: "none",
    },
    {
      id: ids.bookingOther,
      serialNumber: "RUNTIME-AUTHZ-BOOKING-OTHER",
      clientId: ids.outsiderClient,
      lawyerId: ids.outsiderLawyer,
      subject: "Other consultation",
      description: "Runtime authorization isolation fixture",
      scheduledDate: "2099-01-02",
      scheduledTime: "11:00",
      type: "video",
      price: "100.00",
      status: "accepted",
      paymentStatus: "paid",
      escrowStatus: "none",
    },
  ]);

  await db.insert(notificationsTable).values({
    id: "runtime-authz-notification",
    userId: ids.notificationOwner,
    title: "Runtime fixture",
    body: "Authorization fixture",
    kind: "security-test",
  });

  await db.insert(representationQuotesTable).values({
    id: ids.quote,
    clientId: ids.ownerClient,
    lawyerId: ids.ownerLawyer,
    title: "Runtime authorization quote",
    description: "Runtime authorization fixture",
    totalAmount: "100.00",
    currency: "JOD",
    status: "accepted",
    fundingMode: "per_stage",
    acceptedAt: new Date(),
  });

  await db.insert(representationMilestonesTable).values({
    id: ids.milestone,
    quoteId: ids.quote,
    stage: "stage_1",
    percentage: "100.00",
    amount: "100.00",
    title: "Runtime stage",
    status: "funded",
  });

  await db.insert(escrowAccountsTable).values({
    id: ids.escrow,
    quoteId: ids.quote,
    currency: "JOD",
    depositedAmount: "100.00",
    allocatedAmount: "0",
    releasedAmount: "0",
    refundedAmount: "0",
  });

  await db.insert(agreementsTable).values({
    id: ids.agreement,
    quoteId: ids.quote,
    clientId: ids.ownerClient,
    lawyerId: ids.ownerLawyer,
    status: "confirmed",
  });

  await db.insert(casesTable).values({
    id: ids.case,
    agreementId: ids.agreement,
    clientId: ids.ownerClient,
    lawyerId: ids.ownerLawyer,
    status: "active",
  });
}

await seedFixture();

test("#R1 Lawyer client directory is runtime-scoped to the authenticated lawyer", async () => {
  const owner = responseMock();
  await listMyClients(requestWithAuth(ids.ownerLawyer, "lawyer"), owner as any);
  assert.equal(owner.result.statusCode, 200);
  assert.deepEqual(owner.result.body.clients.map((x: { id: string }) => x.id), [ids.ownerClient]);

  const outsider = responseMock();
  await listMyClients(requestWithAuth(ids.outsiderLawyer, "lawyer"), outsider as any);
  assert.equal(outsider.result.statusCode, 200);
  assert.deepEqual(outsider.result.body.clients.map((x: { id: string }) => x.id), [ids.outsiderClient]);
  assert.ok(!outsider.result.body.clients.some((x: { id: string }) => x.id === ids.ownerClient));
});

test("#R2 Lawyer consultation directory is runtime-scoped to the authenticated lawyer", async () => {
  const owner = responseMock();
  await listMyConsultations(requestWithAuth(ids.ownerLawyer, "lawyer"), owner as any);
  assert.equal(owner.result.statusCode, 200);
  assert.deepEqual(owner.result.body.consultations.map((x: { id: string }) => x.id), [ids.bookingOwner]);

  const outsider = responseMock();
  await listMyConsultations(requestWithAuth(ids.outsiderLawyer, "lawyer"), outsider as any);
  assert.equal(outsider.result.statusCode, 200);
  assert.deepEqual(outsider.result.body.consultations.map((x: { id: string }) => x.id), [ids.bookingOther]);
  assert.ok(!outsider.result.body.consultations.some((x: { id: string }) => x.id === ids.bookingOwner));
});

test("#R3 Case read denies a cross-owner actor at runtime with 403", async () => {
  const res = responseMock();
  const req = requestWithAuth(ids.outsiderClient, "client");
  req.params = { id: ids.case };
  await getCaseController(req, res as any);
  assert.equal(res.result.statusCode, 403);
  assert.equal(res.result.body?.error, "unauthorized_action");
});

test("#R4 Case transition denies a cross-owner lawyer at runtime with 403", async () => {
  const res = responseMock();
  const req = requestWithAuth(ids.outsiderLawyer, "lawyer");
  req.params = { id: ids.case };
  req.body = { status: "completed" };
  await transitionCaseController(req, res as any);
  assert.equal(res.result.statusCode, 403);
  assert.equal(res.result.body?.error, "unauthorized_action");
});

test("#R5 Milestone allocation denies a different client at runtime before mutation", async () => {
  const req = requestWithAuth(ids.outsiderClient, "client");
  req.method = "POST";
  req.path = `/milestones/${ids.milestone}/allocate`;
  req.route = { path: "/milestones/:milestoneId/allocate" };
  const result = await allocateMilestone(req, ids.milestone, ids.outsiderClient);
  assert.deepEqual(result, { error: "forbidden" });

  const [milestone] = await db.select({ status: representationMilestonesTable.status, allocated: escrowAccountsTable.allocatedAmount })
    .from(representationMilestonesTable)
    .innerJoin(escrowAccountsTable, eq(escrowAccountsTable.quoteId, representationMilestonesTable.quoteId))
    .where(eq(representationMilestonesTable.id, ids.milestone));
  assert.equal(milestone?.status, "funded");
  assert.equal(milestone?.allocated, "0");
});

test("#R6 Lawyer-only route returns 403 to a client at runtime", () => {
  const res = responseMock();
  let nextCalled = false;
  requireRole("lawyer")(requestWithAuth(ids.outsiderClient, "client"), res as any, () => { nextCalled = true; });
  assert.equal(nextCalled, false);
  assert.equal(res.result.statusCode, 403);
  assert.equal(res.result.body?.error, "forbidden_role");
});

after(async () => {
  await db.delete(idempotencyKeysTable).where(inArray(idempotencyKeysTable.userId, createdUserIds));
  await db.delete(casesTable).where(eq(casesTable.id, ids.case));
  await db.delete(agreementsTable).where(eq(agreementsTable.id, ids.agreement));
  await db.delete(escrowAccountsTable).where(eq(escrowAccountsTable.id, ids.escrow));
  await db.delete(representationMilestonesTable).where(eq(representationMilestonesTable.id, ids.milestone));
  await db.delete(representationQuotesTable).where(eq(representationQuotesTable.id, ids.quote));
  await db.delete(notificationsTable).where(eq(notificationsTable.id, "runtime-authz-notification"));
  await db.delete(bookingsTable).where(inArray(bookingsTable.id, [ids.bookingOwner, ids.bookingOther]));
  await db.delete(usersTable).where(inArray(usersTable.id, createdUserIds));
  await pool.end();
});
