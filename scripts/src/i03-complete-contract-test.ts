import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const baseUrl = process.env.I03_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const clientEmail = process.env.I03_CLIENT_EMAIL ?? "client@mustashark.com";
const lawyerEmail = process.env.I03_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const secondLawyerEmail = process.env.I03_SECOND_LAWYER_EMAIL ?? "lawyer2@mustashark.com";
const password = process.env.I03_PASSWORD ?? "test1234";

if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function login(email: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const body = await response.json() as { jwt?: string; user?: { id?: string } };
  assert(response.status === 200, `${role} login failed: ${response.status} ${JSON.stringify(body)}`);
  assert(typeof body.jwt === "string" && typeof body.user?.id === "string", `${role} login did not return auth data`);
  return { token: body.jwt, userId: body.user.id };
}

async function complete(bookingId: string, expectedVersion: number, token: string, key: string) {
  const response = await fetch(`${baseUrl}/api/bookings/complete`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      "Idempotency-Key": key,
    },
    body: JSON.stringify({ bookingId, expectedVersion }),
  });
  const text = await response.text();
  let body: unknown;
  try { body = JSON.parse(text); } catch { body = { raw: text }; }
  return { status: response.status, body };
}

const client = await login(clientEmail, "client");
const lawyer = await login(lawyerEmail, "lawyer");

// Create a second lawyer fixture without introducing another auth secret.
psql(`
INSERT INTO users (
  id, name, email, password_hash, phone, phone_country, role, auth_provider,
  account_status, specialization, deleted_at, deletion_scheduled_at, status_reason,
  created_at, updated_at
)
SELECT
  ${sqlLiteral("ci-fixture-lawyer-2")}, 'CI Test Lawyer 2', ${sqlLiteral(secondLawyerEmail)},
  password_hash, '+962790000003', 'jordan', 'lawyer', 'local', 'active', 'general',
  NULL, NULL, NULL, NOW(), NOW()
FROM users
WHERE email = ${sqlLiteral(lawyerEmail)}
ON CONFLICT (email) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  role = EXCLUDED.role,
  account_status = EXCLUDED.account_status,
  deleted_at = NULL,
  updated_at = NOW();
`);

const secondLawyer = await login(secondLawyerEmail, "lawyer");

const baseBooking = (id: string, serial: string, status: string, lawyerId: string, lawyerJoinedAt: string | null) => `
INSERT INTO bookings (
  id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time,
  status, type, price, payment_status, escrow_status, lawyer_joined_at, version
) VALUES (
  ${sqlLiteral(id)}, ${sqlLiteral(serial)}, ${sqlLiteral(client.userId)}, ${sqlLiteral(lawyerId)},
  'I03 contract test', '2099-01-01', '09:00', ${sqlLiteral(status)}, 'chat',
  '100.00', 'paid', 'held', ${lawyerJoinedAt ? "now()" : "NULL"}, 1
);`;

// 1) Client must be blocked by the role middleware with 403.
const clientAttemptId = crypto.randomUUID();
psql(baseBooking(clientAttemptId, `I03-C-${Date.now()}`, "accepted", lawyer.userId, "joined"));
const clientAttempt = await complete(clientAttemptId, 1, client.token, `i03-client-${crypto.randomUUID()}`);
assert(clientAttempt.status === 403, `client must receive 403, got ${JSON.stringify(clientAttempt)}`);

// 2) A different lawyer must be rejected by ownership/IDOR protection with 403.
const idorAttemptId = crypto.randomUUID();
psql(baseBooking(idorAttemptId, `I03-I-${Date.now()}`, "accepted", lawyer.userId, "joined"));
const idorAttempt = await complete(idorAttemptId, 1, secondLawyer.token, `i03-idor-${crypto.randomUUID()}`);
assert(idorAttempt.status === 403, `unassigned lawyer must receive 403, got ${JSON.stringify(idorAttempt)}`);
assert(psql(`SELECT status || '|' || version FROM bookings WHERE id = ${sqlLiteral(idorAttemptId)};`) === "accepted|1", "IDOR attempt changed the booking");

// 3) A lawyer may not complete a booking that is not IN_PROGRESS.
const invalidStateId = crypto.randomUUID();
psql(baseBooking(invalidStateId, `I03-S-${Date.now()}`, "accepted", lawyer.userId, null));
const invalidStateAttempt = await complete(invalidStateId, 1, lawyer.token, `i03-state-${crypto.randomUUID()}`);
assert(invalidStateAttempt.status === 409, `invalid state must receive 409, got ${JSON.stringify(invalidStateAttempt)}`);
assert((invalidStateAttempt.body as { error?: string }).error === "invalid_state_transition", `unexpected invalid-state error: ${JSON.stringify(invalidStateAttempt)}`);
assert(psql(`SELECT status || '|' || version FROM bookings WHERE id = ${sqlLiteral(invalidStateId)};`) === "accepted|1", "invalid-state attempt changed the booking");

console.log("I03 COMPLETE CONTRACT TEST PASSED");
console.log("- client completion: 403");
console.log("- unassigned lawyer completion: 403 with booking unchanged");
console.log("- completion outside IN_PROGRESS: 409 invalid_state_transition with booking unchanged");
