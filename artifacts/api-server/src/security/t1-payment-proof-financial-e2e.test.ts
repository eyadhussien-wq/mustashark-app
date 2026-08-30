import assert from "node:assert/strict";
import { after, test } from "node:test";
import type { Server } from "node:http";

// Financial E2E tests must never inherit a production DATABASE_URL.
// CI/local execution must explicitly provide an isolated test database.
const testDatabaseUrl = process.env.SECURITY_TEST_DATABASE_URL;
if (!testDatabaseUrl) {
  test("FINANCIAL E2E GATE: isolated test database is required", () => {
    assert.fail(
      "SECURITY_TEST_DATABASE_URL is required; refusing to run financial E2E tests without an isolated Test DB",
    );
  });
}
if (testDatabaseUrl && /(prod|production|live)/i.test(testDatabaseUrl)) {
  test("FINANCIAL E2E GATE: production database URL is forbidden", () => {
    assert.fail(
      "SECURITY_TEST_DATABASE_URL appears to reference production; refusing to run",
    );
  });
}

process.env.DATABASE_URL = testDatabaseUrl ?? "";
process.env.NODE_ENV = "test";

// Import only after DATABASE_URL has been replaced with the isolated test URL.
const { db, pool } = await import("@workspace/db");
const {
  usersTable,
  bookingsTable,
  paymentProofsTable,
  financialLedgerTable,
  escrowTransactionsTable,
} = await import("@workspace/db/schema");
const { eq, and } = await import("drizzle-orm");
const { signToken } = await import("../lib/jwt");
const { default: app } = await import("../app");

const createdUserIds: string[] = [];
const createdBookingIds: string[] = [];
const createdProofIds: string[] = [];
const createdLedgerIds: string[] = [];
const createdEscrowTransactionIds: string[] = [];
let server: Server | undefined;

function unique(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

async function startHttpServer() {
  server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve, reject) => {
    server!.once("listening", resolve);
    server!.once("error", reject);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object", "test HTTP server did not expose an address");
  return `http://127.0.0.1:${address.port}`;
}

async function closeHttpServer() {
  if (!server) return;
  await new Promise<void>((resolve, reject) => {
    server!.close((error) => (error ? reject(error) : resolve()));
  });
  server = undefined;
}

test("T1: confirming a fully paid payment proof must atomically post Ledger + Escrow compatibility records", async () => {
  const clientId = unique("t1-client");
  const lawyerId = unique("t1-lawyer");
  const bookingId = unique("t1-booking");
  const proofId = unique("t1-proof");
  const serialNumber = unique("T1-SERIAL");
  const price = "100.00";
  const currency = "JOD" as const;

  createdUserIds.push(clientId, lawyerId);
  createdBookingIds.push(bookingId);
  createdProofIds.push(proofId);

  // Baseline the financial tables so the assertion is about the effect of this
  // HTTP request, not about pre-existing synthetic data in the isolated DB.
  const beforeLedger = await db
    .select({ id: financialLedgerTable.id })
    .from(financialLedgerTable);
  const beforeEscrow = await db
    .select({ id: escrowTransactionsTable.id })
    .from(escrowTransactionsTable);

  await db.insert(usersTable).values([
    {
      id: clientId,
      name: "T1 Synthetic Client",
      email: `${clientId}@example.test`,
      role: "client",
      country: "jordan",
      authProvider: "local",
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: lawyerId,
      name: "T1 Synthetic Lawyer",
      email: `${lawyerId}@example.test`,
      role: "lawyer",
      country: "jordan",
      authProvider: "local",
      accountStatus: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);

  await db.insert(bookingsTable).values({
    id: bookingId,
    serialNumber,
    clientId,
    lawyerId,
    officeId: null,
    subject: "T1 financial E2E synthetic consultation",
    description: "Synthetic financial E2E fixture",
    scheduledDate: "2030-01-01",
    scheduledTime: "12:00",
    scheduledAtUtc: new Date("2030-01-01T09:00:00.000Z"),
    scheduledTimezone: "Asia/Amman",
    status: "accepted",
    type: "video",
    price,
    paymentStatus: "pending",
    escrowStatus: "none",
    attachments: [],
    version: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await db.insert(paymentProofsTable).values({
    id: proofId,
    bookingId,
    clientId,
    amount: price,
    currency,
    channel: "external",
    method: "bank_transfer",
    proofUri: "synthetic://t1/payment-proof",
    reference: `T1-REF-${proofId}`,
    note: "Synthetic T1 proof",
    status: "submitted",
    submittedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const lawyerToken = signToken({
    userId: lawyerId,
    email: `${lawyerId}@example.test`,
    role: "lawyer",
    provider: "local",
  });

  const baseUrl = await startHttpServer();
  try {
    // REAL HTTP: fetch -> Express app -> /api router -> requireAuth -> requireRole -> controller.
    const response = await fetch(
      `${baseUrl}/api/bookings/${encodeURIComponent(bookingId)}/payment-proofs/${encodeURIComponent(proofId)}/confirm`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${lawyerToken}`,
          "Content-Type": "application/json",
        },
      },
    );

    const body = (await response.json()) as {
      ok?: boolean;
      error?: string;
      proof?: { id?: string; status?: string; amount?: string; currency?: string };
      booking?: { id?: string; paymentStatus?: string; escrowStatus?: string };
    };

    assert.equal(response.status, 200, JSON.stringify(body));
    assert.equal(body.ok, true, JSON.stringify(body));
    assert.equal(body.proof?.id, proofId, JSON.stringify(body));
    assert.equal(body.proof?.status, "confirmed", JSON.stringify(body));
    assert.equal(body.proof?.amount, price, JSON.stringify(body));
    assert.equal(body.proof?.currency, currency, JSON.stringify(body));
    assert.equal(body.booking?.id, bookingId, JSON.stringify(body));
    assert.equal(body.booking?.paymentStatus, "paid", JSON.stringify(body));
    assert.equal(body.booking?.escrowStatus, "held", JSON.stringify(body));

    // Business-state proof: the real DB transaction committed.
    const [proofAfter] = await db
      .select({ status: paymentProofsTable.status, reviewedBy: paymentProofsTable.reviewedBy })
      .from(paymentProofsTable)
      .where(and(eq(paymentProofsTable.id, proofId), eq(paymentProofsTable.bookingId, bookingId)))
      .limit(1);
    assert.equal(proofAfter?.status, "confirmed");
    assert.equal(proofAfter?.reviewedBy, lawyerId);

    const [bookingAfter] = await db
      .select({ paymentStatus: bookingsTable.paymentStatus, escrowStatus: bookingsTable.escrowStatus })
      .from(bookingsTable)
      .where(eq(bookingsTable.id, bookingId))
      .limit(1);
    assert.equal(bookingAfter?.paymentStatus, "paid");
    assert.equal(bookingAfter?.escrowStatus, "held");

    // FINANCIAL CONTRACT: the same successful payment must create exactly one
    // authoritative Ledger fact and one compatibility Escrow transaction.
    const afterLedger = await db
      .select()
      .from(financialLedgerTable)
      .where(eq(financialLedgerTable.bookingId, bookingId));
    assert.equal(
      afterLedger.length,
      1,
      `T1 RED: expected exactly one financial_ledger entry for booking ${bookingId}, found ${afterLedger.length}`,
    );

    const ledger = afterLedger[0]!;
    createdLedgerIds.push(ledger.id);
    assert.equal(ledger.entryType, "payment");
    assert.equal(ledger.direction, "credit");
    assert.equal(ledger.status, "posted");
    assert.equal(ledger.amount, price);
    assert.equal(ledger.currency, currency);
    assert.equal(ledger.bookingId, bookingId);
    assert.equal(ledger.actorId, lawyerId);

    const afterEscrow = await db
      .select()
      .from(escrowTransactionsTable)
      .where(
        and(
          eq(escrowTransactionsTable.type, "deposit"),
          eq(escrowTransactionsTable.amount, price),
          eq(escrowTransactionsTable.currency, currency),
        ),
      );

    const newEscrow = afterEscrow.filter(
      (row) => !beforeEscrow.some((before) => before.id === row.id),
    );
    assert.equal(
      newEscrow.length,
      1,
      `T1 RED: expected exactly one new posted escrow deposit for ${price} ${currency}, found ${newEscrow.length}`,
    );

    const escrow = newEscrow[0]!;
    createdEscrowTransactionIds.push(escrow.id);
    assert.equal(escrow.status, "posted");
    assert.equal(escrow.amount, price);
    assert.equal(escrow.currency, currency);
    assert.equal(escrow.createdBy, lawyerId);

    // Cross-record integrity: the authoritative Ledger and compatibility record
    // must carry the same financial reference.
    assert.ok(ledger.reference, "Ledger payment must have a reference");
    assert.equal(escrow.reference, ledger.reference);

    // Guard against an implementation that writes an unrelated extra financial
    // record during this single confirmation.
    const allNewLedger = (await db.select({ id: financialLedgerTable.id }).from(financialLedgerTable)).filter(
      (row) => !beforeLedger.some((before) => before.id === row.id),
    );
    assert.equal(allNewLedger.length, 1, "T1 requires one and only one new Ledger fact");
  } finally {
    await closeHttpServer();
  }
});

after(async () => {
  // Cleanup financial children first, then payment proof, booking, and users.
  // This remains safe if the Red Phase fails before any financial record exists.
  for (const id of createdLedgerIds) {
    await db.delete(financialLedgerTable).where(eq(financialLedgerTable.id, id));
  }
  for (const id of createdEscrowTransactionIds) {
    await db.delete(escrowTransactionsTable).where(eq(escrowTransactionsTable.id, id));
  }
  for (const id of createdProofIds) {
    await db.delete(paymentProofsTable).where(eq(paymentProofsTable.id, id));
  }
  for (const id of createdBookingIds) {
    await db.delete(bookingsTable).where(eq(bookingsTable.id, id));
  }
  for (const id of createdUserIds) {
    await db.delete(usersTable).where(eq(usersTable.id, id));
  }

  await pool.end();
});
