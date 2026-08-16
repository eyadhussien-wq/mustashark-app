import { execFileSync } from "node:child_process";
import assertStrict from "node:assert/strict";
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

let lawyerId: string | undefined;
try {
  const existingLawyerId = psql(`SELECT id FROM users WHERE role = 'lawyer' LIMIT 1;`);
  if (existingLawyerId) lawyerId = existingLawyerId.trim();
} catch {
  // Fall through to controlled test-lawyer creation.
}

if (!lawyerId) {
  const lawyerEmail = `test-lawyer-${Date.now()}-${crypto.randomBytes(3).toString("hex")}@example.com`;
  const generatedLawyerId = crypto.randomUUID();
  psql(`
    INSERT INTO users (id, email, password_hash, role, name)
    VALUES (${sqlLiteral(generatedLawyerId)}, ${sqlLiteral(lawyerEmail)}, ${sqlLiteral("s01-03-test-password-hash")}, 'lawyer', 'S01-03 Test Lawyer');
  `);
  lawyerId = generatedLawyerId;
}

assert(lawyerId, "test lawyer could not be created or found");

const bookingId = crypto.randomUUID();
const serialNumber = `S0103-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const keyA = `s01-03-concurrency-a-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
const keyB = `s01-03-concurrency-b-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

try {
  psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${sqlLiteral(bookingId)}, ${sqlLiteral(serialNumber)}, ${sqlLiteral(clientId)}, ${sqlLiteral(lawyerId)}, 'S01-03 concurrency test', '2099-01-01', '09:00', 'pending', 'chat', '100.00', 'pending', 'none', 1);`);

  const requestBody = { bookingId, reason: "S01-03 concurrency test", expectedVersion: 1 };
  const [first, second] = await Promise.all([
    post("/api/bookings/cancel", requestBody, clientToken, keyA),
    post("/api/bookings/cancel", requestBody, clientToken, keyB),
  ]);

  const statuses = [first.status, second.status].sort((a, b) => a - b);
  assertStrict.deepStrictEqual(statuses, [200, 409], `expected one success and one version conflict, got ${statuses.join(",")}`);

  const state = psql(`SELECT status || '|' || version FROM bookings WHERE id = ${sqlLiteral(bookingId)};`);
  assert(state === "cancelled_by_client|2", `unexpected final booking state/version: ${state}`);

  const eventCount = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = 'CONSULTATION_CANCELLED';`));
  assert(eventCount === 1, `expected exactly one cancellation audit event, got ${eventCount}`);

  const winningKey = first.status === 200 ? keyA : keyB;
  const replay = await post("/api/bookings/cancel", requestBody, clientToken, winningKey);
  assert(replay.status === 200, `idempotent replay failed: ${JSON.stringify(replay)}`);

  const replayEventCount = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = 'CONSULTATION_CANCELLED';`));
  assert(replayEventCount === 1, `idempotent replay created an additional side effect: ${replayEventCount}`);

  console.log("S01-03 CONCURRENCY + IDEMPOTENCY TEST PASSED");
} finally {
  // Database is discarded by CI.
}
