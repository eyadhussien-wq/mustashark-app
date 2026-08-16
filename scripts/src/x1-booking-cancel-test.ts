import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const baseUrl = process.env.X1_CANCEL_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const CLIENT_EMAIL = process.env.X1_CLIENT_EMAIL ?? "client@mustashark.com";
const CLIENT_PASSWORD = process.env.X1_CLIENT_PASSWORD ?? "test1234";
const LAWYER_EMAIL = process.env.X1_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const LAWYER_PASSWORD = process.env.X1_LAWYER_PASSWORD ?? "test1234";

if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-At", "-c", query], { encoding: "utf8", timeout: 5_000 }).trim();
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
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }
  return { status: response.status, body: json };
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const body = await response.json() as { jwt?: string; user?: { id?: string } };
  assert(response.status === 200, `${role} login failed: ${response.status}`);
  assert(typeof body.jwt === "string", `${role} login did not return JWT`);
  assert(typeof body.user?.id === "string", `${role} login did not return user id`);
  return { token: body.jwt, id: body.user.id };
}

function qatarLocalParts(offsetMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Qatar",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(Date.now() + offsetMs));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return {
    date: `${values.year}-${values.month}-${values.day}`,
    time: `${values.hour}:${values.minute}`,
  };
}

async function seedAcceptedBooking(clientId: string, lawyerId: string, price: string, offsetMs: number) {
  const id = crypto.randomUUID();
  const serial = `X1-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`.toUpperCase();
  const scheduled = qatarLocalParts(offsetMs);

  psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, description, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${sqlLiteral(id)}, ${sqlLiteral(serial)}, ${sqlLiteral(clientId)}, ${sqlLiteral(lawyerId)}, 'X1 cancellation smoke test', 'CI only', ${sqlLiteral(scheduled.date)}, ${sqlLiteral(scheduled.time)}, 'accepted', 'chat', ${sqlLiteral(price)}, 'paid', 'held', 1);`);
  psql(`INSERT INTO platform_dues (id, booking_id, lawyer_id, gross_amount, commission_rate, commission_amount, status) VALUES (${sqlLiteral(crypto.randomUUID())}, ${sqlLiteral(id)}, ${sqlLiteral(lawyerId)}, ${sqlLiteral(price)}, '0.15', ${sqlLiteral((Number(price) * 0.15).toFixed(2))}, 'pending');`);
  return { id, version: 1, scheduled };
}

const client = await login(CLIENT_EMAIL, CLIENT_PASSWORD, "client");
const lawyer = await login(LAWYER_EMAIL, LAWYER_PASSWORD, "lawyer");

// 1) Same idempotency key, concurrent requests: exactly one financial mutation.
const first = await seedAcceptedBooking(client.id, lawyer.id, "300.00", 72 * 60 * 60 * 1000);
const sameKey = `x1-same-${crypto.randomUUID()}`;
const sameKeyResults = await Promise.all([
  post("/api/bookings/cancel", { bookingId: first.id, expectedVersion: first.version, reason: "CI same-key race" }, client.token, sameKey),
  post("/api/bookings/cancel", { bookingId: first.id, expectedVersion: first.version, reason: "CI same-key race" }, client.token, sameKey),
]);
assert(sameKeyResults.every((r) => r.status === 200), `same-key requests must both return the committed response: ${JSON.stringify(sameKeyResults)}`);
const sameBodies = sameKeyResults.map((r) => JSON.stringify(r.body));
assert(new Set(sameBodies).size === 1, "same idempotency key must replay the exact response");
const firstBooking = psql(`SELECT status || '|' || payment_status || '|' || escrow_status || '|' || version FROM bookings WHERE id = ${sqlLiteral(first.id)};`);
assert(firstBooking === "cancelled_by_client|refunded|refunded|2", `unexpected same-key booking state: ${firstBooking}`);
const firstWallet = psql(`SELECT available_credits || '|' || total_refunded FROM client_wallets WHERE client_id = ${sqlLiteral(client.id)};`);
assert(firstWallet === "300.00|300.00", `expected exactly one 300.00 wallet credit, got ${firstWallet}`);
const firstDue = psql(`SELECT status FROM platform_dues WHERE booking_id = ${sqlLiteral(first.id)};`);
assert(firstDue === "waived", `expected pending platform due to become waived, got ${firstDue}`);

// 2) Different keys, same expected version: optimistic locking allows exactly one winner.
const second = await seedAcceptedBooking(client.id, lawyer.id, "200.00", 72 * 60 * 60 * 1000);
const [raceA, raceB] = await Promise.all([
  post("/api/bookings/cancel", { bookingId: second.id, expectedVersion: second.version, reason: "CI version race A" }, client.token, `x1-race-a-${crypto.randomUUID()}`),
  post("/api/bookings/cancel", { bookingId: second.id, expectedVersion: second.version, reason: "CI version race B" }, client.token, `x1-race-b-${crypto.randomUUID()}`),
]);
const statuses = [raceA.status, raceB.status].sort((a, b) => a - b);
assert(statuses[0] === 200 && statuses[1] === 409, `expected one 200 and one 409 on version race: ${JSON.stringify([raceA, raceB])}`);
const secondBooking = psql(`SELECT status || '|' || payment_status || '|' || escrow_status || '|' || version FROM bookings WHERE id = ${sqlLiteral(second.id)};`);
assert(secondBooking === "cancelled_by_client|refunded|refunded|2", `unexpected version-race booking state: ${secondBooking}`);
const secondWallet = psql(`SELECT available_credits || '|' || total_refunded FROM client_wallets WHERE client_id = ${sqlLiteral(client.id)};`);
assert(secondWallet === "500.00|500.00", `expected wallet to increase exactly once by 200.00, got ${secondWallet}`);

// 3) Client cancellation under 24h: no refund, payment forfeited, due collected.
const late = await seedAcceptedBooking(client.id, lawyer.id, "150.00", 2 * 60 * 60 * 1000);
const lateResult = await post("/api/bookings/cancel", { bookingId: late.id, expectedVersion: late.version, reason: "CI late cancellation" }, client.token, `x1-late-${crypto.randomUUID()}`);
assert(lateResult.status === 200, `late cancellation failed: ${JSON.stringify(lateResult)}`);
const lateBooking = psql(`SELECT status || '|' || payment_status || '|' || escrow_status || '|' || version FROM bookings WHERE id = ${sqlLiteral(late.id)};`);
assert(lateBooking === "cancelled_by_client|forfeited|released|2", `unexpected late cancellation state: ${lateBooking}`);
const lateDue = psql(`SELECT status FROM platform_dues WHERE booking_id = ${sqlLiteral(late.id)};`);
assert(lateDue === "collected", `expected pending platform due to become collected, got ${lateDue}`);
const lateWallet = psql(`SELECT available_credits || '|' || total_refunded FROM client_wallets WHERE client_id = ${sqlLiteral(client.id)};`);
assert(lateWallet === "500.00|500.00", `late cancellation must not credit the wallet, got ${lateWallet}`);

console.log("X1 BOOKING CANCEL SMOKE TEST PASSED");
console.log("- same Idempotency-Key concurrent replay: PASS");
console.log("- double-refund protection: PASS");
console.log("- optimistic version race: PASS");
console.log("- >=24h full refund + platform due waived: PASS");
console.log("- <24h forfeiture + platform due collected: PASS");
