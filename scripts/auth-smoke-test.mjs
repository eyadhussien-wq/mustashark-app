const baseUrl = process.env.AUTH_BASE_URL ?? "http://127.0.0.1:8081";

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertJwtResponse(result, label, expectedRole) {
  assert(result.status === 200, `${label} expected 200, got ${result.status}: ${JSON.stringify(result.body)}`);
  assert(typeof result.body?.jwt === "string" && result.body.jwt.length > 20, `${label} did not return a JWT`);
  assert(result.body?.user?.role === expectedRole, `${label} returned the wrong role`);
}

const client = await post("/api/auth/local-auth", {
  email: "client@mustashark.com",
  password: "test1234",
  role: "client",
});
assertJwtResponse(client, "client login", "client");

const lawyer = await post("/api/auth/local-auth", {
  email: "lawyer@mustashark.com",
  password: "test1234",
  role: "lawyer",
});
assertJwtResponse(lawyer, "lawyer login", "lawyer");

const clientFromLawyerPortal = await post("/api/auth/local-auth", {
  email: "client@mustashark.com",
  password: "test1234",
  role: "lawyer",
});
assert(clientFromLawyerPortal.status === 403, `client through lawyer portal expected 403, got ${clientFromLawyerPortal.status}: ${JSON.stringify(clientFromLawyerPortal.body)}`);
assert(clientFromLawyerPortal.body?.error === "role_mismatch", "client through lawyer portal returned the wrong error");

const lawyerFromClientPortal = await post("/api/auth/local-auth", {
  email: "lawyer@mustashark.com",
  password: "test1234",
  role: "client",
});
assert(lawyerFromClientPortal.status === 403, `lawyer through client portal expected 403, got ${lawyerFromClientPortal.status}: ${JSON.stringify(lawyerFromClientPortal.body)}`);
assert(lawyerFromClientPortal.body?.error === "role_mismatch", "lawyer through client portal returned the wrong error");

console.log("AUTH SMOKE TESTS PASSED");
console.log("- client demo login: 200 + JWT + client role");
console.log("- lawyer demo login: 200 + JWT + lawyer role");
console.log("- client via lawyer portal: 403 role_mismatch");
console.log("- lawyer via client portal: 403 role_mismatch");
