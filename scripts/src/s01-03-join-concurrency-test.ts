import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const baseUrl = process.env.JOIN_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const sessionSecret = process.env.SESSION_SECRET;
const CLIENT_EMAIL = process.env.JOIN_CLIENT_EMAIL ?? "client@mustashark.com";
const CLIENT_PASSWORD = process.env.JOIN_CLIENT_PASSWORD ?? "test1234";
const LAWYER_EMAIL = process.env.JOIN_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const LAWYER_PASSWORD = process.env.JOIN_LAWYER_PASSWORD ?? "test1234";
const REQUEST_TIMEOUT_MS = 5_000;

if (!databaseUrl) throw new Error("DATABASE_URL is required");
if (!sessionSecret) throw new Error("SESSION_SECRET is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-At", "-c", query], {
    encoding: "utf8",
    timeout: 5_000,
  }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function post(path: string, body: unknown, token?: string, idempotencyKey?: string) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const headers: Record<string, string> = { "content-type": "application/json" };
    if (token) headers.authorization = `Bearer ${token}`;
    if (idempotencyKey) headers["Idempotency-Key"] = idempotencyKey;

    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let json: unknown;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }
    return { status: response.status, body: json };
  } finally {
    clearTimeout(timer);
  }
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const body = await response.json() as { jwt?: string; user?: { id?: string } };
  assert(response.status === 200, `${role} login failed: ${response.status} ${JSON.stringify(body)}`);
  assert(typeof body.jwt === "string", `${role} login did not return JWT`);
  assert(typeof body.user?.id === "string", `${role} login did not return user id`);
  return { token: body.jwt, id: body.user.id };
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function signAdminToken() {
  const header = base64Url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    userId: "admin-seed",
    email: "admin@mustashark.com",
    role: "admin",
    provider: "local",
    exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  }));
  const signingInput = `${header}.${payload}`;
  const signature = crypto.createHmac("sha256", sessionSecret!).update(signingInput).digest("base64url");
  return `${signingInput}.${signature}`;
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

async function seedBooking(clientId: string, lawyerId: string, options: { status?: "accepted" | "pending"; offsetMs?: number } = {}) {
  const id = crypto.randomUUID();
  const serial = `JOIN-${Date.now()}-${crypto.randomBytes(3).toString("hex")}`.toUpperCase();
  const scheduled = qatarLocalParts(options.offsetMs ?? 0);
  const status = options.status ?? "accepted";

  psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, description, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${sqlLiteral(id)}, ${sqlLiteral(serial)}, ${sqlLiteral(clientId)}, ${sqlLiteral(lawyerId)}, 'S01-03 Join integration test', 'CI only', ${sqlLiteral(scheduled.date)}, ${sqlLiteral(scheduled.time)}, ${sqlLiteral(status)}, 'chat', '100.00', 'paid', 'held', 1);`);
  return { id, scheduled };
}

function assertJoinSuccess(result: { status: number; body: unknown }, label: string) {
  assert(result.status === 200, `${label} expected 200, got ${result.status}: ${JSON.stringify(result)}`);
  const body = result.body as { ok?: boolean; booking?: { id?: string } };
  assert(body.ok === true && body.booking?.id, `${label} returned an unexpected success body: ${JSON.stringify(result.body)}`);
}

async function waitForIdempotencyCompletion(userId: string, key: string) {
  const deadline = Date.now() + 2_000;
  const query = `SELECT completed_at IS NOT NULL FROM idempotency_keys WHERE user_id = ${sqlLiteral(userId)} AND key = ${sqlLiteral(key)} AND route = '/bookings/join' AND method = 'POST' LIMIT 1;`;

  while (Date.now() < deadline) {
    if (psql(query) === "t") return;
    await new Promise((resolve) => setTimeout(resolve, 50));
  }

  throw new Error(`Idempotency-Key ${key} did not reach completed state within 2 seconds`);
}

const client = await login(CLIENT_EMAIL, CLIENT_PASSWORD, "client");
const lawyer = await login(LAWYER_EMAIL, LAWYER_PASSWORD, "lawyer");
const admin = { token: signAdminToken(), id: "admin-seed" };

// 1) Lawyer individual Join.
const lawyerBooking = await seedBooking(client.id, lawyer.id);
const lawyerJoin = await post("/api/bookings/join", { bookingId: lawyerBooking.id }, lawyer.token, `join-lawyer-${crypto.randomUUID()}`);
assertJoinSuccess(lawyerJoin, "lawyer individual join");
assert(Boolean(psql(`SELECT lawyer_joined_at IS NOT NULL FROM bookings WHERE id = ${sqlLiteral(lawyerBooking.id)};`)), "lawyer individual join did not persist lawyer_joined_at");

// 2) Client individual Join.
const clientBooking = await seedBooking(client.id, lawyer.id);
const clientJoin = await post("/api/bookings/join", { bookingId: clientBooking.id }, client.token, `join-client-${crypto.randomUUID()}`);
assertJoinSuccess(clientJoin, "client individual join");
assert(Boolean(psql(`SELECT client_joined_at IS NOT NULL FROM bookings WHERE id = ${sqlLiteral(clientBooking.id)};`)), "client individual join did not persist client_joined_at");

// 3) Lawyer + Client concurrent Join: both actors update independent columns and both succeed.
const dualBooking = await seedBooking(client.id, lawyer.id);
const [dualLawyer, dualClient] = await Promise.all([
  post("/api/bookings/join", { bookingId: dualBooking.id }, lawyer.token, `join-dual-lawyer-${crypto.randomUUID()}`),
  post("/api/bookings/join", { bookingId: dualBooking.id }, client.token, `join-dual-client-${crypto.randomUUID()}`),
]);
assertJoinSuccess(dualLawyer, "concurrent lawyer join");
assertJoinSuccess(dualClient, "concurrent client join");
const dualState = psql(`SELECT (lawyer_joined_at IS NOT NULL) || '|' || (client_joined_at IS NOT NULL) || '|' || (actual_start_time IS NOT NULL) FROM bookings WHERE id = ${sqlLiteral(dualBooking.id)};`);
assert(dualState === "true|true|true", `dual-actor join did not persist both timestamps: ${dualState}`);
const dualEvents = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(dualBooking.id)} AND event_type = 'SESSION_STARTED';`));
assert(dualEvents === 2, `expected two SESSION_STARTED events for dual-actor join, got ${dualEvents}`);

// 4) Concurrent duplicate Join for the same lawyer: exactly one request mutates the booking.
const lawyerRaceBooking = await seedBooking(client.id, lawyer.id);
const [lawyerRaceA, lawyerRaceB] = await Promise.all([
  post("/api/bookings/join", { bookingId: lawyerRaceBooking.id }, lawyer.token, `join-lawyer-race-a-${crypto.randomUUID()}`),
  post("/api/bookings/join", { bookingId: lawyerRaceBooking.id }, lawyer.token, `join-lawyer-race-b-${crypto.randomUUID()}`),
]);
const lawyerRaceStatuses = [lawyerRaceA.status, lawyerRaceB.status].sort((a, b) => a - b);
assert(lawyerRaceStatuses[0] === 200 && lawyerRaceStatuses[1] === 409, `expected one 200 and one 409 for duplicate lawyer join: ${JSON.stringify([lawyerRaceA, lawyerRaceB])}`);
const lawyerRaceEvents = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(lawyerRaceBooking.id)} AND event_type = 'SESSION_STARTED';`));
assert(lawyerRaceEvents === 1, `expected one SESSION_STARTED event for duplicate lawyer join, got ${lawyerRaceEvents}`);

// 5) Concurrent duplicate Join for the same client: exactly one request mutates the booking.
const clientRaceBooking = await seedBooking(client.id, lawyer.id);
const [clientRaceA, clientRaceB] = await Promise.all([
  post("/api/bookings/join", { bookingId: clientRaceBooking.id }, client.token, `join-client-race-a-${crypto.randomUUID()}`),
  post("/api/bookings/join", { bookingId: clientRaceBooking.id }, client.token, `join-client-race-b-${crypto.randomUUID()}`),
]);
const clientRaceStatuses = [clientRaceA.status, clientRaceB.status].sort((a, b) => a - b);
assert(clientRaceStatuses[0] === 200 && clientRaceStatuses[1] === 409, `expected one 200 and one 409 for duplicate client join: ${JSON.stringify([clientRaceA, clientRaceB])}`);
const clientRaceEvents = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(clientRaceBooking.id)} AND event_type = 'SESSION_STARTED';`));
assert(clientRaceEvents === 1, `expected one SESSION_STARTED event for duplicate client join, got ${clientRaceEvents}`);

// 6) Same Idempotency-Key: concurrent callers are explicitly split into one owner (200) and one in-progress rejection (409).
// After the owner commits, a sequential replay with the same key must return the stored business response (200) without a second mutation.
const sameKeyBooking = await seedBooking(client.id, lawyer.id);
const sameKey = `join-same-key-${crypto.randomUUID()}`;
const [sameKeyA, sameKeyB] = await Promise.all([
  post("/api/bookings/join", { bookingId: sameKeyBooking.id }, client.token, sameKey),
  post("/api/bookings/join", { bookingId: sameKeyBooking.id }, client.token, sameKey),
]);
const sameKeyStatuses = [sameKeyA.status, sameKeyB.status].sort((a, b) => a - b);
assert(sameKeyStatuses[0] === 200 && sameKeyStatuses[1] === 409, `same-key concurrent requests expected one 200 and one 409: ${JSON.stringify([sameKeyA, sameKeyB])}`);
const sameKeyOwner = sameKeyA.status === 200 ? sameKeyA : sameKeyB;
const sameKeyInProgress = sameKeyA.status === 409 ? sameKeyA : sameKeyB;
assert((sameKeyInProgress.body as { error?: string }).error === "idempotency_request_in_progress", `same-key concurrent loser returned wrong error: ${JSON.stringify(sameKeyInProgress.body)}`);
assertJoinSuccess(sameKeyOwner, "same-key owner join");
await waitForIdempotencyCompletion(client.id, sameKey);
const sameKeyReplay = await post("/api/bookings/join", { bookingId: sameKeyBooking.id }, client.token, sameKey);
assertJoinSuccess(sameKeyReplay, "same-key committed replay");
assert(JSON.stringify(sameKeyOwner.body) === JSON.stringify(sameKeyReplay.body), "same Idempotency-Key replay must return the exact committed response body");
const sameKeyEvents = Number(psql(`SELECT count(*) FROM consultation_events WHERE booking_id = ${sqlLiteral(sameKeyBooking.id)} AND event_type = 'SESSION_STARTED';`));
assert(sameKeyEvents === 1, `same Idempotency-Key must create one SESSION_STARTED event, got ${sameKeyEvents}`);

// 7) Appointment window guard: accepted booking outside the -5/+30 minute window is rejected.
const outsideWindowBooking = await seedBooking(client.id, lawyer.id, { offsetMs: 2 * 60 * 60 * 1000 });
const outsideWindow = await post("/api/bookings/join", { bookingId: outsideWindowBooking.id }, client.token, `join-outside-window-${crypto.randomUUID()}`);
assert(outsideWindow.status === 400, `outside-window join expected 400, got ${outsideWindow.status}: ${JSON.stringify(outsideWindow)}`);
assert((outsideWindow.body as { error?: string }).error === "consultation_not_available", `outside-window join returned wrong error: ${JSON.stringify(outsideWindow.body)}`);

// 8) State guard: pending booking is rejected even when the appointment window is open.
const pendingBooking = await seedBooking(client.id, lawyer.id, { status: "pending" });
const pendingJoin = await post("/api/bookings/join", { bookingId: pendingBooking.id }, client.token, `join-pending-${crypto.randomUUID()}`);
assert(pendingJoin.status === 400, `pending booking join expected 400, got ${pendingJoin.status}: ${JSON.stringify(pendingJoin)}`);
assert((pendingJoin.body as { error?: string }).error === "consultation_not_available", `pending booking returned wrong error: ${JSON.stringify(pendingJoin.body)}`);

// 9) Authorization guards: unauthenticated and admin requests are rejected by the route middleware.
const authBooking = await seedBooking(client.id, lawyer.id);
const noAuth = await post("/api/bookings/join", { bookingId: authBooking.id }, undefined, `join-no-auth-${crypto.randomUUID()}`);
assert(noAuth.status === 401, `unauthenticated join expected 401, got ${noAuth.status}: ${JSON.stringify(noAuth)}`);
const adminJoin = await post("/api/bookings/join", { bookingId: authBooking.id }, admin.token, `join-admin-${crypto.randomUUID()}`);
assert(adminJoin.status === 403, `admin join expected 403, got ${adminJoin.status}: ${JSON.stringify(adminJoin)}`);

console.log("S01-03 JOIN CONCURRENCY INTEGRATION TEST PASSED");
console.log("- lawyer individual join: PASS");
console.log("- client individual join: PASS");
console.log("- concurrent lawyer + client join: PASS");
console.log("- concurrent duplicate lawyer join: PASS (1x 200, 1x 409)");
console.log("- concurrent duplicate client join: PASS (1x 200, 1x 409)");
console.log("- same Idempotency-Key concurrent + committed replay: PASS (1x 200, 1x 409, then replay 200)");
console.log("- appointment window guard: PASS");
console.log("- accepted-state guard: PASS");
console.log("- authentication/role guards: PASS");
