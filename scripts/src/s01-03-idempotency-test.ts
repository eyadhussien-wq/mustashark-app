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

let lawyerId: string | undefined;
try {
  const existingLawyerId = psql(`SELECT id FROM users WHERE role = 'lawyer' LIMIT 1;`);
  if (existingLawyerId) lawyerId = existingLawyerId.trim();
} catch {
  // Fall through to controlled test-lawyer creation.
}

if (!lawyerId) {
  const lawyerEmail = `test-lawyer-${Date.now()}-${crypto.randomBytes(3).toString("hex")}@example.com`;
  lawyerId = psql(`
    INSERT INTO users (email, password_hash, role, name)
    VALUES (${sqlLiteral(lawyerEmail)}, ${sqlLiteral("s01-03-test-password-hash")}, 'lawyer', 'S01-03 Test Lawyer')
    RETURNING id;
  `).trim();
}

assert(lawyerId, "test lawyer could not be created or found");

const bookingId = crypto.randomUUID();
const serialNumber = `S0103-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`;
const idempotencyKey = `s01-03-idempotency-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

try {
  psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${sqlLiteral(bookingId)}, ${sqlLiteral(serialNumber)}, ${sqlLiteral(clientId)}, ${sqlLiteral(lawyerId)}, 'S01-03 idempotency test', '2099-01-01', '09:00', 'pending', 'chat', '100.00', 'pending', 'none', 1);`);

  const requestBody = { bookingId, reason: "idempotency test cancel", expectedVersion: 1 };
  const first = await post("/api/bookings/cancel", requestBody, clientToken, idempotencyKey);
  assert(first.status === 200, `first idempotent request failed: ${JSON.stringify(first)}`);

  const second = await post("/api/bookings/cancel", requestBody, clientToken, idempotencyKey);
  assert(second.status === 200, `second idempotent request failed: ${JSON.stringify(second)}`);
  assert(JSON.stringify(first.body) === JSON.stringify(second.body), "idempotent responses did not match");

  const state = psql(`SELECT status || '|' || version FROM bookings WHERE id = ${sqlLiteral(bookingId)};`);
  assert(state === "cancelled_by_client|2", `unexpected final booking state/version: ${state}`);

  const eventCount = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = 'CONSULTATION_CANCELLED';`));
  assert(eventCount === 1, `expected exactly one cancellation audit event, got ${eventCount}`);

  console.log("S01-03 IDEMPOTENCY TEST PASSED");
} finally {
  // Database is discarded by CI.
}
