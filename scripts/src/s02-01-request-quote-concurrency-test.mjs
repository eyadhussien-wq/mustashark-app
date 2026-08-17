const baseUrl = process.env.S02_01_BASE_URL ?? "http://127.0.0.1:8081";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function post(path, body, headers = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text };
  }

  return { status: response.status, body: json };
}

async function login() {
  const response = await post("/api/auth/local-auth", {
    email: process.env.S02_01_CLIENT_EMAIL ?? "client@mustashark.com",
    password: process.env.S02_01_CLIENT_PASSWORD ?? "test1234",
    role: "client",
  });

  assert(response.status === 200, `client login failed: ${JSON.stringify(response.body)}`);
  assert(typeof response.body?.jwt === "string", "client login did not return JWT");
  return response.body.jwt;
}

const token = await login();
const payload = {
  title: `S02.1 concurrency ${Date.now()}`,
  description: "Concurrent duplicate Request Quote test",
};
const key = `s02-01-concurrency-${Date.now()}`;
const headers = {
  authorization: `Bearer ${token}`,
  "idempotency-key": key,
};

const results = await Promise.all(
  Array.from({ length: 8 }, () =>
    post("/api/representation/quote-requests", payload, headers),
  ),
);

const successful = results.filter((result) => result.status === 201);
assert(
  successful.length === results.length,
  `all concurrent requests must resolve through the same 201 replay contract: ${JSON.stringify(results)}`,
);

const createdIds = new Set(results.map((result) => result.body?.request?.id));
assert(
  createdIds.size === 1,
  `concurrent requests must resolve to exactly one persisted request id; got ${createdIds.size}: ${JSON.stringify(results)}`,
);

const [createdId] = createdIds;
assert(createdId, `concurrent requests returned no persisted request id: ${JSON.stringify(results)}`);

const conflict = await post(
  "/api/representation/quote-requests",
  { title: "Different intent" },
  headers,
);
assert(
  conflict.status === 409,
  `same idempotency key with different intent must return 409, got ${conflict.status}: ${JSON.stringify(conflict.body)}`,
);
assert(
  conflict.body?.error === "idempotency_request_mismatch",
  `unexpected conflict error: ${JSON.stringify(conflict.body)}`,
);

const forbidden = await post(
  "/api/representation/quote-requests",
  { title: "Attempted client identity injection", clientId: "attacker" },
  {
    authorization: `Bearer ${token}`,
    "idempotency-key": `${key}-forbidden-field`,
  },
);
assert(
  forbidden.status === 400,
  `clientId injection must be rejected by strict contract, got ${forbidden.status}: ${JSON.stringify(forbidden.body)}`,
);

console.log("S02-01 REQUEST QUOTE CONCURRENCY TEST PASSED");
console.log("- concurrent same-key requests: one persisted request id + deterministic 201 replay: PASS");
console.log("- same-key different intent conflict: PASS");
console.log("- client identity injection rejected: PASS");
