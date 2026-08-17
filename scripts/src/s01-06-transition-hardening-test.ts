import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const baseUrl = process.env.CONCURRENCY_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const clientEmail = process.env.CONCURRENCY_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.CONCURRENCY_CLIENT_PASSWORD ?? "test1234";
const lawyerEmail = process.env.CONCURRENCY_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.CONCURRENCY_LAWYER_PASSWORD ?? "test1234";

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

async function login(email: string, password: string, role: "client" | "lawyer") {
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

async function assertConcurrentTransition({
  path,
  body,
  token,
  bookingId,
  eventType,
  expectedFinal,
  label,
}: {
  path: string;
  body: Record<string, unknown>;
  token: string;
  bookingId: string;
  eventType: string;
  expectedFinal: string;
  label: string;
}) {
  const keyA = `s01-06-${label}-a-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
  const keyB = `s01-06-${label}-b-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

  const [a, b] = await Promise.all([
    post(path, body, token, keyA),
    post(path, body, token, keyB),
  ]);

  const results = [a, b];
  const successCount = results.filter((result) => result.status === 200).length;
  const conflictCount = results.filter((result) => result.status === 409 && (result.body as { error?: string }).error === "booking_version_conflict").length;
  assert(successCount === 1, `${label}: expected one 200, got ${successCount}: ${JSON.stringify(results)}`);
  assert(conflictCount === 1, `${label}: expected one 409 booking_version_conflict, got ${conflictCount}: ${JSON.stringify(results)}`);

  const state = psql(`SELECT status || '|' || version FROM bookings WHERE id = ${sqlLiteral(bookingId)};`);
  assert(state === expectedFinal, `${label}: unexpected final booking state/version: ${state}`);

  const eventCount = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = ${sqlLiteral(eventType)};`));
  assert(eventCount === 1, `${label}: expected exactly one ${eventType} event, got ${eventCount}`);

  const winnerKey = a.status === 200 ? keyA : keyB;
  const replay = await post(path, body, token, winnerKey);
  assert(replay.status === 200, `${label}: same-key replay failed: ${JSON.stringify(replay)}`);

  const replayEventCount = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(bookingId)} AND event_type = ${sqlLiteral(eventType)};`));
  assert(replayEventCount === 1, `${label}: replay created an additional side effect: ${replayEventCount}`);
}

const client = await login(clientEmail, clientPassword, "client");
const lawyer = await login(lawyerEmail, lawyerPassword, "lawyer");

const completeBookingId = crypto.randomUUID();
const disputeBookingId = crypto.randomUUID();
const completeSerial = `S0106-C-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
const disputeSerial = `S0106-D-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;

psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, lawyer_joined_at, version) VALUES (${sqlLiteral(completeBookingId)}, ${sqlLiteral(completeSerial)}, ${sqlLiteral(client.userId)}, ${sqlLiteral(lawyer.userId)}, 'S01-06 complete concurrency', '2099-01-01', '09:00', 'accepted', 'chat', '100.00', 'paid', 'held', now(), 1);`);
psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, lawyer_joined_at, version) VALUES (${sqlLiteral(disputeBookingId)}, ${sqlLiteral(disputeSerial)}, ${sqlLiteral(client.userId)}, ${sqlLiteral(lawyer.userId)}, 'S01-06 dispute concurrency', '2099-01-01', '09:30', 'accepted', 'chat', '100.00', 'paid', 'held', now(), 1);`);

await assertConcurrentTransition({
  path: "/api/bookings/complete",
  body: { bookingId: completeBookingId, expectedVersion: 1 },
  token: lawyer.token,
  bookingId: completeBookingId,
  eventType: "LAWYER_COMPLETED",
  expectedFinal: "completed|2",
  label: "complete",
});

await assertConcurrentTransition({
  path: "/api/bookings/dispute",
  body: { bookingId: disputeBookingId, reason: "S01-06 concurrency test", expectedVersion: 1 },
  token: client.token,
  bookingId: disputeBookingId,
  eventType: "DISPUTE_RAISED",
  expectedFinal: "disputed|2",
  label: "dispute",
});

console.log("S01-06 TRANSITION HARDENING TEST PASSED");
console.log("- complete: one 200 + one 409 version conflict");
console.log("- complete: same-key replay returned 200 without duplicate event");
console.log("- dispute: one 200 + one 409 version conflict");
console.log("- dispute: same-key replay returned 200 without duplicate event");
