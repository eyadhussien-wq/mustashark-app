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

const client = await post("/api/auth/local-auth", {
  email: "client@mustashark.com",
  password: "test1234",
  role: "client",
});
assert(client.status === 200, `client login expected 200, got ${client.status}`);
assert(typeof client.body?.token === "string" && client.body.token.length > 20, "client login did not return a JWT");
assert(client.body?.user?.role === "client", "client login returned the wrong role");

const lawyer = await post("/api/auth/local-auth", {
  email: "lawyer@mustashark.com",
  password: "test1234",
  role: "lawyer",
});
assert(lawyer.status === 200, `lawyer login expected 200, got ${lawyer.status}`);
assert(typeof lawyer.body?.token === "string" && lawyer.body.token.length > 20, "lawyer login did not return a JWT");
assert(lawyer.body?.user?.role === "lawyer", "lawyer login returned the wrong role");

const clientFromLawyerPortal = await post("/api/auth/local-auth", {
  email: "client@mustashark.com",
  password: "test1234",
  role: "lawyer",
});
assert(clientFromLawyerPortal.status === 403, `client through lawyer portal expected 403, got ${clientFromLawyerPortal.status}`);
assert(clientFromLawyerPortal.body?.error === "role_mismatch", "client through lawyer portal returned the wrong error");

const lawyerFromClientPortal = await post("/api/auth/local-auth", {
  email: "lawyer@mustashark.com",
  password: "test1234",
  role: "client",
});
assert(lawyerFromClientPortal.status === 403, `lawyer through client portal expected 403, got ${lawyerFromClientPortal.status}`);
assert(lawyerFromClientPortal.body?.error === "role_mismatch", "lawyer through client portal returned the wrong error");

console.log("AUTH SMOKE TESTS PASSED");
console.log("- client demo login: 200 + JWT + client role");
console.log("- lawyer demo login: 200 + JWT + lawyer role");
console.log("- client via lawyer portal: 403 role_mismatch");
console.log("- lawyer via client portal: 403 role_mismatch");
