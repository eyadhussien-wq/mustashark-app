const base = process.env.AUTH_BASE_URL || "http://127.0.0.1:8081";

async function request(path, options = {}) {
  const response = await fetch(`${base}${path}`, {
    ...options,
    headers: { "content-type": "application/json", ...(options.headers || {}) },
  });
  let body = null;
  try { body = await response.json(); } catch {}
  return { status: response.status, body };
}

function assert(condition, message) {
  if (!condition) throw new Error(`SECURITY SMOKE FAILED: ${message}`);
}

async function login(email, role) {
  const result = await request("/api/auth/local-auth", {
    method: "POST",
    body: JSON.stringify({ email, password: "test1234", role }),
  });
  assert(result.status === 200 && result.body?.jwt, `${email} login did not return JWT (${result.status})`);
  return result.body.jwt;
}

const clientJwt = await login("client@mustashark.com", "client");
const lawyerJwt = await login("lawyer@mustashark.com", "lawyer");

let result = await request("/api/bookings", { headers: { authorization: "Bearer not-a-real-token" } });
assert(result.status === 401, `invalid JWT was accepted: ${result.status}`);

result = await request("/api/bookings", { headers: { authorization: `Bearer ${lawyerJwt}` } });
assert(result.status === 200, `lawyer could not access own bookings endpoint: ${result.status}`);

result = await request("/api/bookings/confirm", {
  method: "POST",
  headers: { authorization: `Bearer ${clientJwt}` },
  body: JSON.stringify({ bookingId: "does-not-exist" }),
});
assert(result.status === 403, `client reached lawyer-only confirm endpoint: ${result.status}`);

result = await request("/api/bookings/check-absence", {
  method: "POST",
  headers: { authorization: `Bearer ${lawyerJwt}` },
  body: JSON.stringify({ bookingId: "does-not-exist" }),
});
assert(result.status === 403, `lawyer reached client-only absence endpoint: ${result.status}`);

result = await request("/api/bookings/does-not-exist", {
  headers: { authorization: `Bearer ${clientJwt}` },
});
assert(result.status === 404, `unknown booking did not return 404: ${result.status}`);

console.log("API SECURITY SMOKE TESTS PASSED");
