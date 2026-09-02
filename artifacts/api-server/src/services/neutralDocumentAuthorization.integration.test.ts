import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import test from "node:test";
import {
  getNeutralDocumentForClient,
  getNeutralDocumentForLawyer,
} from "./neutralDocumentAuthorization";

type LocalAuthResponse = {
  jwt?: unknown;
  user?: { id?: unknown };
};

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

const parsedDatabaseUrl = new URL(databaseUrl);
if (parsedDatabaseUrl.hostname !== "localhost" && parsedDatabaseUrl.hostname !== "127.0.0.1") {
  throw new Error("Neutral document IDOR tests require a localhost-only database target");
}
if (!/(^|[-_])(test|ephemeral)([-_]|$)/i.test(parsedDatabaseUrl.pathname.replace(/^\//, ""))) {
  throw new Error("Neutral document IDOR tests require an explicitly test/ephemeral database name");
}

function sqlLiteral(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

function psql(query: string) {
  return execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-At", "-c", query], {
    encoding: "utf8",
  }).trim();
}

async function login(email: string, role: "lawyer" | "client") {
  const response = await fetch(`${baseUrl}/api/auth/local-auth`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  });
  const body = (await response.json()) as LocalAuthResponse;
  assert.equal(response.status, 200, `${email} login failed: ${response.status} ${JSON.stringify(body)}`);
  assert.equal(typeof body.jwt, "string", `${email} login did not return a JWT`);
  assert.ok(body.user, `${email} login did not return a user`);
  assert.equal(typeof body.user.id, "string", `${email} login did not return a user id`);
  return { token: body.jwt as string, userId: body.user.id as string };
}

function seedFixtures() {
  psql(`
    INSERT INTO users (id, name, email, password_hash, phone, phone_country, role, auth_provider, account_status, specialization, deleted_at, deletion_scheduled_at, status_reason, created_at, updated_at)
    SELECT ${sqlLiteral(IDS.lawyerA)}, 'CI IDOR Lawyer A', 'ci-idor-lawyer-a@mustashark.com', password_hash, '+962790001101', 'jordan', 'lawyer', 'local', 'active', 'general', NULL, NULL, NULL, NOW(), NOW()
    FROM users WHERE email = 'lawyer@mustashark.com'
    ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, auth_provider = EXCLUDED.auth_provider, account_status = 'active', deleted_at = NULL, updated_at = NOW();

    INSERT INTO users (id, name, email, password_hash, phone, phone_country, role, auth_provider, account_status, specialization, deleted_at, deletion_scheduled_at, status_reason, created_at, updated_at)
    SELECT ${sqlLiteral(IDS.lawyerB)}, 'CI IDOR Lawyer B', 'ci-idor-lawyer-b@mustashark.com', password_hash, '+962790001102', 'jordan', 'lawyer', 'local', 'active', 'general', NULL, NULL, NULL, NOW(), NOW()
    FROM users WHERE email = 'lawyer@mustashark.com'
    ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, auth_provider = EXCLUDED.auth_provider, account_status = 'active', deleted_at = NULL, updated_at = NOW();

    INSERT INTO users (id, name, email, password_hash, phone, phone_country, role, auth_provider, account_status, specialization, deleted_at, deletion_scheduled_at, status_reason, created_at, updated_at)
    SELECT ${sqlLiteral(IDS.client)}, 'CI IDOR Client', 'ci-idor-client@mustashark.com', password_hash, '+962790001103', 'jordan', 'client', 'local', 'active', NULL, NULL, NULL, NULL, NOW(), NOW()
    FROM users WHERE email = 'client@mustashark.com'
    ON CONFLICT (email) DO UPDATE SET id = EXCLUDED.id, password_hash = EXCLUDED.password_hash, role = EXCLUDED.role, auth_provider = EXCLUDED.auth_provider, account_status = 'active', deleted_at = NULL, updated_at = NOW();

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

seedFixtures();

test("authenticated lawyer A cannot read lawyer B document by ID tampering", async () => {
  const lawyerA = await login("ci-idor-lawyer-a@mustashark.com", "lawyer");
  const own = await getNeutralDocumentForLawyer(lawyerA.userId, IDS.documentA);
  assert.equal(own.id, IDS.documentA);

  await assert.rejects(
    () => getNeutralDocumentForLawyer(lawyerA.userId, IDS.documentB),
    (error: unknown) => error instanceof Error && ["DOCUMENT_NOT_FOUND", "MATTER_NOT_OWNED"].includes(error.message),
  );
});

test("authenticated lawyer B cannot read lawyer A document by ID tampering", async () => {
  const lawyerB = await login("ci-idor-lawyer-b@mustashark.com", "lawyer");

  await assert.rejects(
    () => getNeutralDocumentForLawyer(lawyerB.userId, IDS.documentA),
    (error: unknown) => error instanceof Error && ["DOCUMENT_NOT_FOUND", "MATTER_NOT_OWNED"].includes(error.message),
  );
});

test("authenticated client is authorized only through explicit share plus active relationship", async () => {
  const client = await login("ci-idor-client@mustashark.com", "client");

  const documentA = await getNeutralDocumentForClient(client.userId, IDS.documentA);
  assert.equal(documentA.id, IDS.documentA);

  const documentB = await getNeutralDocumentForClient(client.userId, IDS.documentB);
  assert.equal(documentB.id, IDS.documentB);
});

test("revoked share blocks authenticated client while retaining the document", async () => {
  const client = await login("ci-idor-client@mustashark.com", "client");
  psql(`UPDATE neutral_document_shares SET status = 'revoked', revoked_at = NOW(), updated_at = NOW() WHERE id = ${sqlLiteral(IDS.shareA)};`);

  await assert.rejects(
    () => getNeutralDocumentForClient(client.userId, IDS.documentA),
    (error: unknown) => error instanceof Error && error.message === "SHARE_NOT_ACTIVE",
  );
  assert.equal(psql(`SELECT count(*) FROM neutral_documents WHERE id = ${sqlLiteral(IDS.documentA)};`), "1");
});

test("archived lawyer-client relationship blocks authenticated client while retaining records", async () => {
  const client = await login("ci-idor-client@mustashark.com", "client");
  psql(`UPDATE lawyer_clients SET status = 'archived', archived_at = NOW(), updated_at = NOW() WHERE lawyer_id = ${sqlLiteral(IDS.lawyerA)} AND client_id = ${sqlLiteral(IDS.client)};`);

  await assert.rejects(
    () => getNeutralDocumentForClient(client.userId, IDS.documentA),
    (error: unknown) => error instanceof Error && error.message === "RELATIONSHIP_NOT_ACTIVE",
  );
  assert.equal(psql(`SELECT count(*) FROM neutral_documents WHERE id = ${sqlLiteral(IDS.documentA)};`), "1");
  assert.equal(psql(`SELECT count(*) FROM lawyer_clients WHERE lawyer_id = ${sqlLiteral(IDS.lawyerA)} AND client_id = ${sqlLiteral(IDS.client)};`), "1");
});

console.log("NEUTRAL DOCUMENT DB-BACKED AUTHENTICATED IDOR TESTS PASSED");
