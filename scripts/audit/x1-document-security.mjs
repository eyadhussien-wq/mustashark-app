import process from "node:process";

const baseUrl = process.env.X1_API_BASE_URL ?? "http://127.0.0.1:8081";
const users = {
  clientA: { email: "testclient@mustasharak.com", password: "test1234", role: "client" },
  clientB: { email: "testclient-b@mustasharak.com", password: "test1234", role: "client" },
};

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

async function get(path, token) {
  const headers = token ? { authorization: `Bearer ${token}` } : {};
  const response = await fetch(`${baseUrl}${path}`, { headers });
  const text = await response.text();
  let json;
  try { json = JSON.parse(text); } catch { json = { raw: text }; }
  return { status: response.status, body: json };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function login(user) {
  const result = await post("/api/auth/local-auth", user);
  assert(result.status === 200, `login failed: ${result.status} ${JSON.stringify(result.body)}`);
  assert(typeof result.body?.jwt === "string", "login did not return JWT");
  return result.body.jwt;
}

const clientAToken = await login(users.clientA);
const clientBToken = await login(users.clientB);

// The fixture is supplied by CI/bootstrap. Never invent an ID: an absent fixture is a test setup failure.
const bookingId = process.env.X1_DOCUMENT_BOOKING_ID;
assert(bookingId, "X1_DOCUMENT_BOOKING_ID must point to a real consultation/booking fixture owned by client A");

const unauthenticatedPrintData = await get(`/api/consultations/${bookingId}/print-data`);
assert(unauthenticatedPrintData.status === 401, `unauthenticated print-data expected 401, got ${unauthenticatedPrintData.status}`);

const ownerPrintData = await get(`/api/consultations/${bookingId}/print-data`, clientAToken);
assert(ownerPrintData.status === 200, `owner print-data expected 200, got ${ownerPrintData.status}: ${JSON.stringify(ownerPrintData.body)}`);

const foreignPrintData = await get(`/api/consultations/${bookingId}/print-data`, clientBToken);
assert(foreignPrintData.status === 403, `cross-client print-data expected 403, got ${foreignPrintData.status}: ${JSON.stringify(foreignPrintData.body)}`);

const unauthenticatedExport = await post(`/api/consultations/${bookingId}/print-export`, {});
assert(unauthenticatedExport.status === 401, `unauthenticated print-export expected 401, got ${unauthenticatedExport.status}`);

const ownerExport = await post(`/api/consultations/${bookingId}/print-export`, {}, clientAToken);
assert([200, 201].includes(ownerExport.status), `owner print-export expected 200/201, got ${ownerExport.status}: ${JSON.stringify(ownerExport.body)}`);

const foreignExport = await post(`/api/consultations/${bookingId}/print-export`, {}, clientBToken);
assert(foreignExport.status === 403, `cross-client print-export expected 403, got ${foreignExport.status}: ${JSON.stringify(foreignExport.body)}`);

console.log("X/1 DOCUMENT SECURITY — PASS");
console.log("- unauthenticated print-data: 401");
console.log("- owner print-data: 200");
console.log("- cross-client print-data: 403");
console.log("- unauthenticated print-export: 401");
console.log("- owner print-export: 200/201");
console.log("- cross-client print-export: 403");
