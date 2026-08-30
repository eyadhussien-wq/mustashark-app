import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const baseUrl = process.env.S01_02_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const lawyerEmail = process.env.S01_02_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.S01_02_LAWYER_PASSWORD ?? "test1234";
const clientEmail = process.env.S01_02_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.S01_02_CLIENT_PASSWORD ?? "test1234";
const timeoutMs = 8_000;

if (!databaseUrl) throw new Error("DATABASE_URL is required");
const databaseHost = new URL(databaseUrl).hostname;
if (!["localhost", "127.0.0.1", "::1"].includes(databaseHost)) {
  throw new Error(`Refusing S01-03 security test against non-isolated database host ${databaseHost}`);
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-Atq", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8", timeout: timeoutMs }).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function request(path: string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(`${baseUrl}${path}`, { ...init, signal: controller.signal });
    const text = await response.text();
    let body: any = null;
    if (text) {
      try { body = JSON.parse(text); } catch { body = { raw: text }; }
    }
    return { status: response.status, body };
  } finally {
    clearTimeout(timer);
  }
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const result = await request("/api/auth/local-auth", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  assert(result.status === 200 && typeof result.body?.jwt === "string", `${role} login failed: ${JSON.stringify(result)}`);
  return result.body as { jwt: string; userId?: string; user?: { id?: string } };
}

function idempotencyKey(label: string) {
  return `s01-03-security-${label}-${crypto.randomUUID()}`;
}

function nextMonday() {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let offset = 1; offset <= 14; offset += 1) {
    const candidate = new Date(today.getTime() + offset * 86_400_000);
    if (candidate.getUTCDay() === 1) return candidate.toISOString().slice(0, 10);
  }
  throw new Error("Could not find a future Monday");
}

const lawyer = await login(lawyerEmail, lawyerPassword, "lawyer");
const client = await login(clientEmail, clientPassword, "client");
const lawyerId = lawyer.userId ?? lawyer.user?.id;
const clientId = client.userId ?? client.user?.id;
assert(lawyerId, "lawyer login did not return user id");
assert(clientId, "client login did not return user id");

const clientHeaders = { authorization: `Bearer ${client.jwt}` };
const lawyerHeaders = { authorization: `Bearer ${lawyer.jwt}` };

let result = await request(`/api/availability/lawyers/${lawyerId}`, { headers: clientHeaders });
assert(result.status === 200, `client availability read failed: ${JSON.stringify(result)}`);
const publicAvailability = result.body?.availability;
assert(Array.isArray(publicAvailability), "availability response is not an array");
for (const row of publicAvailability) {
  for (const key of ["price", "paymentStatus", "escrowStatus", "wallet", "commission", "refund"]) {
    assert(!(key in row), `financial/internal field leaked from availability DTO: ${key}`);
  }
}

result = await request("/api/availability/lawyers/me", {
  method: "PUT",
  headers: { ...clientHeaders, "content-type": "application/json" },
  body: JSON.stringify({ slots: [] }),
});
assert(result.status === 403, `client was allowed to mutate availability: ${JSON.stringify(result)}`);

result = await request("/api/availability/lawyers/me", { method: "DELETE", headers: clientHeaders });
assert(result.status === 403, `client was allowed to delete availability: ${JSON.stringify(result)}`);

const secondLawyerId = crypto.randomUUID();
const secondLawyerEmail = `s01-03-second-lawyer-${crypto.randomUUID()}@example.com`;
const existingHash = psql(`SELECT password_hash FROM users WHERE id=${sqlLiteral(lawyerId)} LIMIT 1;`);
assert(existingHash, "could not obtain isolated CI lawyer password hash");
psql(`INSERT INTO users (id, name, email, password_hash, phone, phone_country, role, auth_provider, account_status, specialization, created_at, updated_at) VALUES (${sqlLiteral(secondLawyerId)}, 'S01-03 Second Lawyer', ${sqlLiteral(secondLawyerEmail)}, ${sqlLiteral(existingHash)}, '+962790000099', 'jordan', 'lawyer', 'local', 'active', 'general', NOW(), NOW());`);
const secondLawyer = await login(secondLawyerEmail, lawyerPassword, "lawyer");
const secondHeaders = { authorization: `Bearer ${secondLawyer.jwt}` };

const monday = nextMonday();
const schedulingTimezone = "Asia/Qatar";
const lawyerAWindow = { schedulingTimezone, slots: [{ dayOfWeek: 1, startTime: "09:00", endTime: "11:00", slotDurationMinutes: 60 }] };
const lawyerBWindow = { schedulingTimezone, slots: [{ dayOfWeek: 1, startTime: "14:00", endTime: "16:00", slotDurationMinutes: 60 }] };

result = await request("/api/availability/lawyers/me", { method: "PUT", headers: { ...lawyerHeaders, "content-type": "application/json" }, body: JSON.stringify(lawyerAWindow) });
assert(result.status === 200, `primary lawyer fixture failed: ${JSON.stringify(result)}`);
result = await request("/api/availability/lawyers/me", { method: "PUT", headers: { ...secondHeaders, "content-type": "application/json" }, body: JSON.stringify(lawyerBWindow) });
assert(result.status === 200, `second lawyer fixture failed: ${JSON.stringify(result)}`);

result = await request("/api/availability/lawyers/me", {
  method: "PUT",
  headers: { ...secondHeaders, "content-type": "application/json" },
  body: JSON.stringify({ lawyerId, schedulingTimezone, slots: [{ dayOfWeek: 1, startTime: "18:00", endTime: "19:00", slotDurationMinutes: 60 }] }),
});
assert(result.status === 200, `second lawyer self-update failed: ${JSON.stringify(result)}`);
result = await request(`/api/availability/lawyers/${lawyerId}`, { headers: secondHeaders });
assert(result.status === 200, `cross-lawyer availability read failed: ${JSON.stringify(result)}`);
assert(JSON.stringify(result.body.availability.map((x: any) => [x.dayOfWeek, x.startTime.slice(0, 5), x.endTime.slice(0, 5)])) === JSON.stringify([[1, "09:00", "11:00"]]), "second lawyer could alter primary lawyer availability; ownership isolation failed");

const bookingId = crypto.randomUUID();
const serialNumber = `S0103-SEC-${crypto.randomBytes(4).toString("hex")}`;
psql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${sqlLiteral(bookingId)}, ${sqlLiteral(serialNumber)}, ${sqlLiteral(clientId)}, ${sqlLiteral(lawyerId)}, 'S01-03 occupied-slot security test', ${sqlLiteral(monday)}, '10:00', 'pending', 'chat', '100.00', 'pending', 'none', 1);`);
psql(`INSERT INTO booking_time_blocks (id, booking_id, lawyer_id, scheduled_date, start_time, end_time) VALUES (${sqlLiteral(crypto.randomUUID())}, ${sqlLiteral(bookingId)}, ${sqlLiteral(lawyerId)}, ${sqlLiteral(monday)}, '10:00', '11:00');`);

result = await request(`/api/availability/lawyers/${lawyerId}/slots?date=${monday}`, { headers: clientHeaders });
assert(result.status === 200, `available-slots read failed: ${JSON.stringify(result)}`);
assert(result.body?.timezone === schedulingTimezone, `timezone contract changed: ${JSON.stringify(result.body)}`);
const generated = result.body?.slots;
assert(Array.isArray(generated), "available-slots response is not an array");
assert(!generated.some((slot: any) => slot.startTime === "10:00" && slot.endTime === "11:00"), "occupied booking block was returned as available");
const nineToTen = generated.find((slot: any) => slot.startTime === "09:00" && slot.endTime === "10:00");
assert(nineToTen, `expected unoccupied 09:00-10:00 slot was not returned: ${JSON.stringify(generated)}`);
assert(nineToTen.startAtUtc === `${monday}T06:00:00.000Z`, `UTC conversion contract failed for ${schedulingTimezone}: ${JSON.stringify(nineToTen)}`);
assert(nineToTen.endAtUtc === `${monday}T07:00:00.000Z`, `UTC end conversion contract failed for ${schedulingTimezone}: ${JSON.stringify(nineToTen)}`);

console.log("S01-03 CONTRACT + SECURITY HARDENING PASSED");
console.log("- public availability DTO: PASS (no financial/internal fields)");
console.log("- client mutation/delete boundary: PASS (403)");
console.log("- lawyer ownership isolation: PASS");
console.log("- occupied-block exclusion: PASS");
console.log("- Asia/Qatar -> UTC conversion: PASS");
