import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";

const baseUrl = process.env.NEUTRAL_IDOR_BASE_URL ?? "http://127.0.0.1:8081";
const databaseUrl = process.env.DATABASE_URL;
const password = "test1234";

const IDS = {
  lawyerA: "ci-idor-lawyer-a",
  lawyerB: "ci-idor-lawyer-b",
  client: "ci-idor-client",
  matterA: "ci-idor-matter-a",
  matterB: "ci-idor-matter-b",
  documentA: "ci-idor-document-a",
  documentB: "ci-idor-document-b",
  shareA: "ci-idor-share-a",
  shareB: "ci-idor-share-b",
};

if (!databaseUrl) throw new Error("DATABASE_URL is required for neutral document IDOR integration tests");

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl!, "-v", "ON_ERROR_STOP=1", "-At", "-c", query], {
    encoding: "utf8",
  }).trim();
}

async function request(path: string, token: string, options: RequestInit = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${token}`,
      ...(options.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown = null;
  try {
    body = JSON.parse(text);
  } catch {
    body = { raw: text };
  }
  return { status: response.status, body };
}

async function login(email: string, role: "lawyer" | "client") {
  const result = await request("/api/auth/local-auth", "", {
    method: "POST",
    body: JSON.stringify({ email, password, role }),
  });
  assert.equal(result.status, 200, `${email} login failed: ${result.status} ${JSON.stringify(result.body)}`);
  const jwt = (result.body as { jwt?: unknown }).jwt;
  assert.equal(typeof jwt, "string", `${email} login did not return a JWT`);
  return jwt;
}

function seedFixtures() {
  psql(`
    INSERT INTO users (id, name, email, password_hash, phone, phone_country, role, auth_provider, account_status, specialization, deleted_at, deletion_scheduled_at, status_reason, created_at, updated_at)
    VALUES
      (${sqlLiteral(IDS.lawyerA)}, 'CI IDOR Lawyer A', 'ci-idor-lawyer-a@mustashark.com', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC7LqT0fQw6u0xQz2a5W', '+962790001101', 'jordan', 'lawyer', 'local', 'active', 'general', NULL, NULL, NULL, NOW(), NOW()),
      (${sqlLiteral(IDS.lawyerB)}, 'CI IDOR Lawyer B', 'ci-idor-lawyer-b@mustashark.com', '$2a$10$92IXUNpkj3g0w0j5r5r5rOe9mQY4h7W3q5r0o1y9c7m5x2w8z1u6', '+962790001102', 'jordan', 'lawyer', 'local', 'active', 'general', NULL, NULL, NULL, NOW(), NOW()),
      (${sqlLiteral(IDS.client)}, 'CI IDOR Client', 'ci-idor-client@mustashark.com', '$2a$10$92IXUNpkO0rOQ5byMi.Ye4oKoEa3Ro9llC7LqT0fQw6u0xQz2a5W', '+962790001103', 'jordan', 'client', 'local', 'active', NULL, NULL, NULL, NULL, NOW(), NOW())
    ON CONFLICT (email) DO UPDATE SET
      id = EXCLUDED.id,
      password_hash = EXCLUDED.password_hash,
      role = EXCLUDED.role,
      auth_provider = EXCLUDED.auth_provider,
      account_status = 'active',
      deleted_at = NULL,
      updated_at = NOW();

    INSERT INTO lawyer_clients (id, lawyer_id, client_id, status, created_at, updated_at, archived_at)
    VALUES
      ('${IDS.lawyerA}-client', '${IDS.lawyerA}', '${IDS.client}', 'active', NOW(), NOW(), NULL),
      ('${IDS.lawyerB}-client', '${IDS.lawyerB}', '${IDS.client}', 'active', NOW(), NOW(), NULL)
    ON CONFLICT (lawyer_id, client_id) DO UPDATE SET status = 'active', archived_at = NULL, updated_at = NOW();

    INSERT INTO neutral_matters (id, lawyer_id, client_id, title, status, created_at, updated_at, archived_at)
    VALUES
      ('${IDS.matterA}', '${IDS.lawyerA}', '${IDS.client}', 'CI IDOR Matter A', 'active', NOW(), NOW(), NULL),
      ('${IDS.matterB}', '${IDS.lawyerB}', '${IDS.client}', 'CI IDOR Matter B', 'active', NOW(), NOW(), NULL)
    ON CONFLICT (id) DO UPDATE SET lawyer_id = EXCLUDED.lawyer_id, client_id = EXCLUDED.client_id, status = 'active', archived_at = NULL, updated_at = NOW();

    INSERT INTO neutral_documents (id, lawyer_id, matter_id, title, storage_key, content_hash, status, created_at, updated_at, archived_at)
    VALUES
      ('${IDS.documentA}', '${IDS.lawyerA}', '${IDS.matterA}', 'CI IDOR Document A', 'ci/idor/a', NULL, 'active', NOW(), NOW(), NULL),
      ('${IDS.documentB}', '${IDS.lawyerB}', '${IDS.matterB}', 'CI IDOR Document B', 'ci/idor/b', NULL, 'active', NOW(), NOW(), NULL)
    ON CONFLICT (id) DO UPDATE SET lawyer_id = EXCLUDED.lawyer_id, matter_id = EXCLUDED.matter_id, status = 'active', archived_at = NULL, updated_at = NOW();

    INSERT INTO neutral_document_shares (id, document_id, client_id, status, created_at, updated_at, revoked_at)
    VALUES
      ('${IDS.shareA}', '${IDS.documentA}', '${IDS.client}', 'active', NOW(), NOW(), NULL),
      ('${IDS.shareB}', '${IDS.documentB}', '${IDS.client}', 'active', NOW(), NOW(), NULL)
    ON CONFLICT (document_id, client_id) DO UPDATE SET status = 'active', revoked_at = NULL, updated_at = NOW();
  `);
}

function cleanupFixtures() {
  psql(`
    DELETE FROM neutral_document_shares WHERE id IN (${sqlLiteral(IDS.shareA)}, ${sqlLiteral(IDS.shareB)});
    DELETE FROM neutral_documents WHERE id IN (${sqlLiteral(IDS.documentA)}, ${sqlLiteral(IDS.documentB)});
    DELETE FROM neutral_matters WHERE id IN (${sqlLiteral(IDS.matterA)}, ${sqlLiteral(IDS.matterB)});
    DELETE FROM lawyer_clients WHERE lawyer_id IN (${sqlLiteral(IDS.lawyerA)}, ${sqlLiteral(IDS.lawyerB)}) AND client_id = ${sqlLiteral(IDS.client)};
    DELETE FROM users WHERE id IN (${sqlLiteral(IDS.lawyerA)}, ${sqlLiteral(IDS.lawyerB)}, ${sqlLiteral(IDS.client)});
  `);
}

seedFixtures();

try {
  const lawyerAToken = await login("ci-idor-lawyer-a@mustashark.com", "lawyer");
  const lawyerBToken = await login("ci-idor-lawyer-b@mustashark.com", "lawyer");
  const clientToken = await login("ci-idor-client@mustashark.com", "client");

  test("lawyer A can access only lawyer A document", async () => {
    const own = await request(`/__internal/neutral-documents/${IDS.documentA}`, lawyerAToken);
    assert.equal(own.status, 200, `lawyer A own document denied: ${JSON.stringify(own.body)}`);

    const foreign = await request(`/__internal/neutral-documents/${IDS.documentB}`, lawyerAToken);
    assert.ok([403, 404].includes(foreign.status), `lawyer A accessed lawyer B document: ${foreign.status}`);
  });

  test("lawyer B cannot access lawyer A document by ID tampering", async () => {
    const result = await request(`/__internal/neutral-documents/${IDS.documentA}`, lawyerBToken);
    assert.ok([403, 404].includes(result.status), `cross-lawyer document IDOR succeeded: ${result.status}`);
  });

  test("client can access only explicitly shared documents inside active relationship scope", async () => {
    const ownShared = await request(`/__internal/neutral-documents/${IDS.documentA}`, clientToken);
    assert.equal(ownShared.status, 200, `client could not read explicitly shared document: ${JSON.stringify(ownShared.body)}`);

    const otherLawyerShared = await request(`/__internal/neutral-documents/${IDS.documentB}`, clientToken);
    assert.equal(otherLawyerShared.status, 200, `client should be able to access second explicitly shared document: ${JSON.stringify(otherLawyerShared.body)}`);
  });

  test("revoked share denies client access while retaining the document", async () => {
    psql(`UPDATE neutral_document_shares SET status = 'revoked', revoked_at = NOW(), updated_at = NOW() WHERE id = ${sqlLiteral(IDS.shareA)};`);
    const result = await request(`/__internal/neutral-documents/${IDS.documentA}`, clientToken);
    assert.ok([403, 404].includes(result.status), `revoked share still granted access: ${result.status}`);
    assert.equal(psql(`SELECT count(*) FROM neutral_documents WHERE id = ${sqlLiteral(IDS.documentA)};`), "1", "revoked share must not delete the document");
  });

  test("archived relationship denies client access without deleting records", async () => {
    psql(`UPDATE lawyer_clients SET status = 'archived', archived_at = NOW(), updated_at = NOW() WHERE lawyer_id = ${sqlLiteral(IDS.lawyerA)} AND client_id = ${sqlLiteral(IDS.client)};`);
    const result = await request(`/__internal/neutral-documents/${IDS.documentA}`, clientToken);
    assert.ok([403, 404].includes(result.status), `archived relationship still granted access: ${result.status}`);
    assert.equal(psql(`SELECT count(*) FROM neutral_documents WHERE id = ${sqlLiteral(IDS.documentA)};`), "1", "archiving relationship must retain document");
  });

  console.log("NEUTRAL DOCUMENT DB-BACKED IDOR TESTS PASSED");
} finally {
  cleanupFixtures();
}
