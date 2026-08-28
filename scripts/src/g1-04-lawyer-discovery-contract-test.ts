import { execFileSync } from "node:child_process";

const baseUrl = process.env.G1_04_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const password = process.env.G1_04_PASSWORD ?? "test1234";

if (!databaseUrl) throw new Error("DATABASE_URL is required");

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function psql(query: string) {
  return execFileSync(
    "psql",
    [databaseUrl!, "-At", "-v", "ON_ERROR_STOP=1", "-c", query],
    { encoding: "utf8" },
  ).trim();
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function login(email: string, role: "client" | "lawyer") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const body = (await response.json()) as { jwt?: string; user?: { id?: string } };
  assert(response.status === 200, `login failed for ${email}: ${response.status} ${JSON.stringify(body)}`);
  assert(typeof body.jwt === "string", `login returned no JWT for ${email}`);
  return { token: body.jwt };
}

function provisionDiscoveryFixtures() {
  const fixtureRows = [
    ["ci-g104-approved", "G1.4 Approved Lawyer", "g104-approved@mustashark.com", "active", "approved"],
    ["ci-g104-pending", "G1.4 Pending Lawyer", "g104-pending@mustashark.com", "active", "pending"],
    ["ci-g104-rejected", "G1.4 Rejected Lawyer", "g104-rejected@mustashark.com", "active", "rejected"],
    ["ci-g104-suspended", "G1.4 Suspended Lawyer", "g104-suspended@mustashark.com", "suspended", "approved"],
    ["ci-g104-deleted", "G1.4 Deleted Lawyer", "g104-deleted@mustashark.com", "active", "approved"],
    ["ci-g104-role", "G1.4 Lawyer Role", "g104-role@mustashark.com", "active", "approved"],
  ] as const;

  const values = fixtureRows
    .map(
      ([id, name, email, accountStatus]) => `(
        ${sqlLiteral(id)}, ${sqlLiteral(name)}, ${sqlLiteral(email)},
        (SELECT password_hash FROM users WHERE email = 'client@mustashark.com' LIMIT 1),
        '+9627900001${id.slice(-1)}', 'jordan', 'lawyer', 'local', ${sqlLiteral(accountStatus)},
        'general', NULL, NULL, NULL, NOW(), NOW()
      )`,
    )
    .join(",\n");

  psql(`
    INSERT INTO users (
      id, name, email, password_hash, phone, phone_country, role, auth_provider,
      account_status, specialization, deleted_at, deletion_scheduled_at, status_reason,
      created_at, updated_at
    ) VALUES ${values}
    ON CONFLICT (email) DO UPDATE SET
      name = EXCLUDED.name,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      account_status = EXCLUDED.account_status,
      deleted_at = NULL,
      deletion_scheduled_at = NULL,
      status_reason = NULL,
      updated_at = NOW();
  `);

  for (const [id, _name, _email, accountStatus, verificationStatus] of fixtureRows) {
    psql(`
      INSERT INTO lawyer_verifications (id, user_id, license_number, bar_association, status, created_at, updated_at)
      VALUES (
        ${sqlLiteral(`verification-${id}`)}, ${sqlLiteral(id)}, ${sqlLiteral(`LIC-${id}`)},
        'CI Test Bar', ${sqlLiteral(verificationStatus)}, NOW(), NOW()
      )
      ON CONFLICT (user_id) DO UPDATE SET
        status = EXCLUDED.status,
        license_number = EXCLUDED.license_number,
        updated_at = NOW();
    `);

    if (id === "ci-g104-deleted") {
      psql(`UPDATE users SET deleted_at = NOW() WHERE id = ${sqlLiteral(id)};`);
    }
  }

  // Ensure the dedicated lawyer-role fixture is active and approved for the 403 test.
  psql(`UPDATE users SET account_status = 'active', deleted_at = NULL WHERE id = 'ci-g104-role';`);
}

provisionDiscoveryFixtures();

// Unauthenticated clients must not discover lawyers.
const anonymous = await fetch(`${baseUrl}/api/lawyers`);
assert(anonymous.status === 401, `anonymous discovery must be 401, got ${anonymous.status}`);

const client = await login("client@mustashark.com", "client");
const clientResponse = await fetch(`${baseUrl}/api/lawyers`, {
  headers: { authorization: `Bearer ${client.token}` },
});
const clientBody = (await clientResponse.json()) as {
  ok?: boolean;
  lawyers?: Array<Record<string, unknown>>;
};
assert(clientResponse.status === 200, `client discovery must be 200, got ${clientResponse.status} ${JSON.stringify(clientBody)}`);
assert(clientBody.ok === true && Array.isArray(clientBody.lawyers), "client discovery response contract is invalid");

const ids = new Set(clientBody.lawyers.map((lawyer) => lawyer.id));
assert(ids.has("ci-g104-approved"), "approved active lawyer must be visible");
for (const hiddenId of ["ci-g104-pending", "ci-g104-rejected", "ci-g104-suspended", "ci-g104-deleted"]) {
  assert(!ids.has(hiddenId), `${hiddenId} must not be visible in client discovery`);
}

for (const lawyer of clientBody.lawyers) {
  for (const forbidden of [
    "passwordHash",
    "password_hash",
    "providerId",
    "provider_id",
    "documentStorageKey",
    "document_storage_key",
    "reviewedBy",
    "reviewed_by",
    "rejectionReason",
    "rejection_reason",
  ]) {
    assert(!(forbidden in lawyer), `forbidden field ${forbidden} leaked in lawyer DTO`);
  }
}

// A lawyer account must not use the client discovery surface.
const lawyer = await login("g104-role@mustashark.com", "lawyer");
const lawyerResponse = await fetch(`${baseUrl}/api/lawyers`, {
  headers: { authorization: `Bearer ${lawyer.token}` },
});
assert(lawyerResponse.status === 403, `lawyer discovery must be 403, got ${lawyerResponse.status}`);

console.log("G1.4 LAWYER DISCOVERY CONTRACT TEST PASSED");
console.log("- anonymous: 401");
console.log("- client: 200 with approved/active/non-deleted only");
console.log("- pending/rejected/suspended/deleted: hidden");
console.log("- sensitive verification/auth fields: not exposed");
console.log("- lawyer role: 403");
