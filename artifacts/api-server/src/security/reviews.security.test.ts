import assert from "node:assert/strict";
import { test, after } from "node:test";

const testDatabaseUrl = process.env.SECURITY_TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  test("REVIEW SECURITY GATE: isolated test database is required", () => {
    assert.fail(
      "SECURITY_TEST_DATABASE_URL is required; refusing to run review security tests without an isolated TestDB",
    );
  });
}

if (/(prod|production|live)/i.test(testDatabaseUrl ?? "")) {
  test("REVIEW SECURITY GATE: production database URL is forbidden", () => {
    assert.fail(
      "SECURITY_TEST_DATABASE_URL appears to reference production; refusing to run",
    );
  });
}

process.env.DATABASE_URL = testDatabaseUrl ?? "";

const { db, pool, usersTable, bookingsTable, lawyerReviewsTable } =
  await import("@workspace/db");
const { eq, and, or, sql } = await import("drizzle-orm");
const { submitReview } = await import("../controllers/reviews");

function responseMock() {
  const result: { statusCode: number; body: any } = {
    statusCode: 200,
    body: null,
  };

  return {
    result,
    status(code: number) {
      result.statusCode = code;
      return this;
    },
    json(body: unknown) {
      result.body = body;
      return this;
    },
  };
}

function requestMock(
  userId: string,
  role: "client" | "lawyer" | "admin",
  body: unknown,
) {
  return {
    authUser: { userId, role },
    body,
    log: {
      error() {},
      warn() {},
      info() {},
    },
  } as any;
}

const createdUserIds: string[] = [];
const createdBookingIds: string[] = [];

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function createUser(
  role: "client" | "lawyer",
  prefix: string,
) {
  const id = unique(prefix);

  await db.insert(usersTable).values({
    id,
    name: `${prefix} Test User`,
    email: `${id}@example.test`,
    role,
    authProvider: "local",
    accountStatus: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  createdUserIds.push(id);
  return id;
}

async function createBooking(
  clientId: string,
  lawyerId: string,
  status: "completed" | "accepted",
  prefix: string,
) {
  const id = unique(prefix);

  await db.insert(bookingsTable).values({
    id,
    serialNumber: unique("SER"),
    clientId,
    lawyerId,
    subject: "Security review test consultation",
    description: "Security gate fixture",
    scheduledDate: "2026-08-24",
    scheduledTime: "12:00",
    status,
    type: "video",
    price: "100.00",
    paymentStatus: "paid",
    escrowStatus: status === "completed" ? "released" : "held",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  createdBookingIds.push(id);
  return id;
}

test("#R1 unauthenticated/non-client caller is rejected", async () => {
  const lawyerId = await createUser("lawyer", "review-lawyer-r1");
  const res = responseMock();

  await submitReview(
    requestMock("not-client", "lawyer", {
      consultationId: "irrelevant",
      lawyerId,
      stars: 5,
    }),
    res as any,
  );

  assert.equal(res.result.statusCode, 403);
  assert.equal(res.result.body?.error, "clients_only");
});

test("#R2 client cannot review another client's consultation", async () => {
  const ownerClientId = await createUser("client", "review-owner-r2");
  const attackerClientId = await createUser("client", "review-attacker-r2");
  const lawyerId = await createUser("lawyer", "review-lawyer-r2");

  const consultationId = await createBooking(
    ownerClientId,
    lawyerId,
    "completed",
    "review-booking-r2",
  );

  const res = responseMock();

  await submitReview(
    requestMock(attackerClientId, "client", {
      consultationId,
      lawyerId,
      stars: 5,
    }),
    res as any,
  );

  assert.equal(res.result.statusCode, 403);
  assert.equal(
    res.result.body?.error,
    "forbidden_not_booking_client",
  );
});

test("#R3 lawyer mismatch is rejected", async () => {
  const clientId = await createUser("client", "review-client-r3");
  const actualLawyerId = await createUser("lawyer", "review-lawyer-r3-a");
  const wrongLawyerId = await createUser("lawyer", "review-lawyer-r3-b");

  const consultationId = await createBooking(
    clientId,
    actualLawyerId,
    "completed",
    "review-booking-r3",
  );

  const res = responseMock();

  await submitReview(
    requestMock(clientId, "client", {
      consultationId,
      lawyerId: wrongLawyerId,
      stars: 5,
    }),
    res as any,
  );

  assert.equal(res.result.statusCode, 400);
  assert.equal(res.result.body?.error, "lawyer_mismatch");
});

test("#R4 incomplete consultation is rejected", async () => {
  const clientId = await createUser("client", "review-client-r4");
  const lawyerId = await createUser("lawyer", "review-lawyer-r4");

  const consultationId = await createBooking(
    clientId,
    lawyerId,
    "accepted",
    "review-booking-r4",
  );

  const res = responseMock();

  await submitReview(
    requestMock(clientId, "client", {
      consultationId,
      lawyerId,
      stars: 5,
    }),
    res as any,
  );

  assert.equal(res.result.statusCode, 400);
  assert.equal(
    res.result.body?.error,
    "consultation_not_completed",
  );
});

test("#R5 invalid stars are rejected by schema", async () => {
  const clientId = await createUser("client", "review-client-r5");
  const res = responseMock();

  await submitReview(
    requestMock(clientId, "client", {
      consultationId: "fake-consultation",
      lawyerId: "fake-lawyer",
      stars: 6,
    }),
    res as any,
  );

  assert.equal(res.result.statusCode, 400);
  assert.equal(res.result.body?.error, "validation_error");
});

test("#R6 concurrent duplicate review is rejected safely", async () => {
  const clientId = await createUser("client", "review-client-r6");
  const lawyerId = await createUser("lawyer", "review-lawyer-r6");

  const consultationId = await createBooking(
    clientId,
    lawyerId,
    "completed",
    "review-booking-r6",
  );

  const first = responseMock();
  const second = responseMock();

  await Promise.all([
    submitReview(
      requestMock(clientId, "client", {
        consultationId,
        lawyerId,
        stars: 5,
      }),
      first as any,
    ),
    submitReview(
      requestMock(clientId, "client", {
        consultationId,
        lawyerId,
        stars: 4,
      }),
      second as any,
    ),
  ]);

  const statuses = [
    first.result.statusCode,
    second.result.statusCode,
  ].sort((a, b) => a - b);

  assert.deepEqual(
    statuses,
    [201, 409],
    `expected exactly one successful review and one safe duplicate rejection; got ${statuses.join(", ")}`,
  );

  const responses = [first.result, second.result];
  const duplicateResponse = responses.find(
    (result) => result.statusCode === 409,
  );

  assert.ok(duplicateResponse);
  assert.equal(duplicateResponse.body?.error, "already_reviewed");

  const reviews = await db
    .select({
      id: lawyerReviewsTable.id,
      stars: lawyerReviewsTable.stars,
    })
    .from(lawyerReviewsTable)
    .where(
      and(
        eq(lawyerReviewsTable.clientId, clientId),
        eq(lawyerReviewsTable.consultationId, consultationId),
      ),
    );

  assert.equal(
    reviews.length,
    1,
    `expected exactly one persisted review, found ${reviews.length}`,
  );
});

test("#R7 database unique index exists", async () => {
  const indexes = await db.execute(sql`
    SELECT indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND tablename = 'lawyer_reviews'
      AND indexname = 'lawyer_reviews_client_consultation_unique'
  `);

  assert.equal(
    indexes.rows.length,
    1,
    "review duplicate-prevention unique index is missing",
  );
});

test("#R8 successful review updates lawyer aggregate", async () => {
  const clientId = await createUser("client", "review-client-r8");
  const lawyerId = await createUser("lawyer", "review-lawyer-r8");

  const consultationId = await createBooking(
    clientId,
    lawyerId,
    "completed",
    "review-booking-r8",
  );

  const res = responseMock();

  await submitReview(
    requestMock(clientId, "client", {
      consultationId,
      lawyerId,
      stars: 4,
    }),
    res as any,
  );

  assert.equal(res.result.statusCode, 201);

  const [lawyer] = await db
    .select({
      rating: usersTable.rating,
      reviewsCount: usersTable.reviewsCount,
    })
    .from(usersTable)
    .where(eq(usersTable.id, lawyerId))
    .limit(1);

  assert.equal(lawyer?.rating, "4.0");
  assert.equal(lawyer?.reviewsCount, 1);
});

after(async () => {
  for (const id of createdUserIds) {
    await db
      .delete(lawyerReviewsTable)
      .where(
        or(
          eq(lawyerReviewsTable.clientId, id),
          eq(lawyerReviewsTable.lawyerId, id),
        ),
      );
  }

  for (const id of createdBookingIds) {
    await db
      .delete(bookingsTable)
      .where(eq(bookingsTable.id, id));
  }

  for (const id of createdUserIds) {
    await db
      .delete(usersTable)
      .where(eq(usersTable.id, id));
  }

  await pool.end();
});