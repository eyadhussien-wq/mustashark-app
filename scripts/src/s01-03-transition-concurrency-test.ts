import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const baseUrl = process.env.CONCURRENCY_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const clientEmail = process.env.CONCURRENCY_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.CONCURRENCY_CLIENT_PASSWORD ?? "test1234";

if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-At", "-c", query], { encoding: "utf8" }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function post(path: string, body: unknown, token: string, idempotencyKey: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json: unknown;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

const clientLogin = await post("/api/auth/local-auth", { email: clientEmail, password: clientPassword, role: "client" }, "", `s01-03-login-${Date.now()}`);
assert(clientLogin.status === 200, `client login failed: ${clientLogin.status}`);
const clientToken = (clientLogin.body as { jwt?: string }).jwt;
const clientId = (clientLogin.body as { user?: { id?: string } }).user?.id;
assert(typeof clientToken === "string" && typeof clientId === "string", "client login did not return auth data");

const lawyerEmail = `test-lawyer-${Date.now()}-${crypto.randomBytes(3).toString("hex")}@example.com`;
const existingLawyerId = psql(`SELECT id FROM users WHERE role = 'lawyer' LIMIT 1;`);
const lawyerId = existingLawyerId || psql(`
  INSERT INTO users (email, password_hash, role, name)
  VALUES (${sqlLiteral(lawyerEmail)}, ${sqlLiteral("s01-03-test-password-hash")}, 'lawyer', 'S01-03 Test Lawyer')
  RETURNING id;
`);
assert(lawyerId, "test lawyer could not be created or found");

const bookingId = crypto.randomUUID();
const serialNumber = `S0103-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const idempotencyPrefix = `s01-03-transition-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
const keyA = `${idempotencyPrefix}-a`;
const keyB = `${idempotencyPrefix}-b`;

try {
  psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${sqlLiteral(bookingId)}, ${sqlLiteral(serialNumber)}, ${sqlLiteral(clientId)}, ${sqlLiteral(lawyerId)}, 'S01-03 optimistic-lock concurrency test', '2099-01-01', '09:00', 'pending', 'chat', '100.00', 'pending', 'none', 1);`);

  const [a, b] = await Promise.all([
    post("/api/bookings/cancel", { bookingId, reason: "concurrent cancel A", expectedVersion: 1 }, clientToken, keyA),
    post("/api/bookings/cancel", { bookingId, reason: "concurrent cancel B", expectedVersion: 1 }, clientToken, keyB),
  ]);

  const results = [a, b];
  const successCount = results.filter((result) => result.status === 200).length;
  const conflictCount = results.filter((result) => result.status === 409 && (result.body as { error?: string }).error === "booking_version_conflict").length;
  assert(successCount === 1, `expected one successful cancel, got ${successCount}: ${JSON.stringify(results)}`);
  assert(conflictCount === 1, `expected one 409 booking_version_conflict, got ${conflictCount}: ${JSON.stringify(results)}`);

  const state = psql(`SELECT status || '|' || version FROM bookings WHERE id = ${sqlLiteral(bookingId)};`);
  assert(state === "cancelled_by_client|2", `unexpected final booking state/version: ${state}`);

  const eventCount = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = 'CONSULTATION_CANCELLED';`));
  assert(eventCount === 1, `expected exactly one cancellation audit event, got ${eventCount}`);

  console.log("S01-03 TRANSITION CONCURRENCY TEST PASSED");
  console.log("- concurrent cancel winner: 1 x 200");
  console.log("- concurrent cancel loser: 1 x 409 booking_version_conflict");
  console.log("- final state/version: cancelled_by_client/2");
  console.log("- cancellation audit events: 1");
} finally {
  // This workflow uses a fresh ephemeral PostgreSQL database per run.
  // Do not issue destructive DELETE statements here; the database is discarded by CI.
}
