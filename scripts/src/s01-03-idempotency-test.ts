const baseUrl = process.env.S01_03_BASE_URL ?? "http://127.0.0.1:8081";
const clientEmail = process.env.S01_03_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.S01_03_CLIENT_PASSWORD ?? "test1234";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function request(path: string, init: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, init);
  const text = await response.text();
  let body: any = null;
  if (text) {
    try { body = JSON.parse(text); } catch { body = { raw: text }; }
  }
  return { status: response.status, body };
}

const login = await request("/api/auth/local-auth", {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: clientEmail, password: clientPassword, role: "client" }),
});
assert(login.status === 200 && typeof login.body?.jwt === "string", `client login failed: ${JSON.stringify(login)}`);
const token = login.body.jwt;

const missing = await request("/api/bookings/cancel", {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json" },
  body: JSON.stringify({ bookingId: "s01-03-missing", reason: "idempotency test" }),
});
assert(missing.status === 400 && missing.body?.error === "idempotency_key_required", `missing key was not rejected: ${JSON.stringify(missing)}`);

const key = `s01-03-${Date.now()}`;
const first = await request("/api/bookings/cancel", {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": key },
  body: JSON.stringify({ bookingId: "s01-03-missing", reason: "idempotency test" }),
});
assert(first.status === 404 && first.body?.error === "booking_not_found", `first idempotent request failed: ${JSON.stringify(first)}`);

const replay = await request("/api/bookings/cancel", {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": key },
  body: JSON.stringify({ bookingId: "s01-03-missing", reason: "idempotency test" }),
});
assert(replay.status === first.status && JSON.stringify(replay.body) === JSON.stringify(first.body), `replay did not return cached response: first=${JSON.stringify(first)} replay=${JSON.stringify(replay)}`);

const mismatch = await request("/api/bookings/cancel", {
  method: "POST",
  headers: { authorization: `Bearer ${token}`, "content-type": "application/json", "Idempotency-Key": key },
  body: JSON.stringify({ bookingId: "different-booking", reason: "different request" }),
});
assert(mismatch.status === 409 && mismatch.body?.error === "idempotency_key_reused_with_different_request", `mismatched replay was not rejected: ${JSON.stringify(mismatch)}`);

console.log("S01-03 IDEMPOTENCY CONTRACT PASSED");
console.log("- missing key: PASS (400)");
console.log("- first request persisted: PASS");
console.log("- replay returns cached response: PASS");
console.log("- same key with different request: PASS (409)");
