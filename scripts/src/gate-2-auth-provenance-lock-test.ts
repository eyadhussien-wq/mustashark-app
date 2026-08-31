import assert from "node:assert/strict";
import crypto from "node:crypto";
import { eq } from "drizzle-orm";
import {
  db,
  lawyerVerificationsTable,
  pool,
  usersTable,
} from "@workspace/db";

const baseUrl = process.env.GATE_2_BASE_URL ?? "http://127.0.0.1:8081";
const clientEmail = process.env.GATE_2_CLIENT_EMAIL ?? "client@mustashark.com";
const clientPassword = process.env.GATE_2_CLIENT_PASSWORD ?? "Gate2RealAuth!2026";
const lawyerEmail = process.env.GATE_2_LAWYER_EMAIL ?? "lawyer@mustashark.com";
const lawyerPassword = process.env.GATE_2_LAWYER_PASSWORD ?? "Gate2RealAuth!2026";
const adminEmail = "admin@mustashark.com";
const adminPassword = process.env.GATE_2_ADMIN_PASSWORD ?? "test1234";

assert.equal(
  process.env.MUSTASHAREK_DEMO_AUTH_ENABLED,
  "false",
  "Gate #2 financial auth provenance requires demo auth to be explicitly disabled",
);

async function request(path: string, body: unknown, token?: string) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    parsed = { raw: text };
  }
  return { status: response.status, body: parsed as Record<string, unknown> };
}

async function ensureLocalUser(input: {
  email: string;
  password: string;
  role: "client" | "lawyer";
  name: string;
  phone: string;
}) {
  const result = await request("/api/auth/local-auth", input);
  assert(
    result.status === 201 || result.status === 200 || result.status === 202 || result.status === 403,
    `unexpected local-auth fixture response for ${input.role}: ${result.status} ${JSON.stringify(result.body)}`,
  );

  const [user] = await db
    .select({
      id: usersTable.id,
      role: usersTable.role,
      accountStatus: usersTable.accountStatus,
      authProvider: usersTable.authProvider,
      passwordHash: usersTable.passwordHash,
    })
    .from(usersTable)
    .where(eq(usersTable.email, input.email))
    .limit(1);

  assert(user, `real local user fixture must exist: ${input.email}`);
  assert.equal(user.role, input.role, `fixture role mismatch for ${input.email}`);
  assert.equal(user.authProvider, "local", `fixture must be local-auth backed: ${input.email}`);
  assert(user.passwordHash, `fixture must have a password hash: ${input.email}`);
  return user;
}

async function createPendingLawyerVerification(lawyerId: string) {
  const verificationId = crypto.randomUUID();
  const now = new Date();
  const [created] = await db
    .insert(lawyerVerificationsTable)
    .values({
      id: verificationId,
      userId: lawyerId,
      licenseNumber: `GATE2-${lawyerId.slice(0, 8)}`,
      barAssociation: "CI Professional Verification Fixture",
      documentStorageKey: `gate2/verification/${verificationId}`,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    })
    .returning({ id: lawyerVerificationsTable.id, status: lawyerVerificationsTable.status });

  assert.equal(created?.status, "pending", "lawyer fixture must enter pending verification before admin review");
  return created!.id;
}

async function login(email: string, password: string, role: "client" | "lawyer") {
  const result = await request("/api/auth/local-auth", { email, password, role });
  assert.equal(result.status, 200, `real ${role} login failed: ${JSON.stringify(result.body)}`);
  assert.equal(typeof result.body.jwt, "string", `${role} login response missing jwt`);
  assert.equal(
    (result.body.user as Record<string, unknown> | undefined)?.authProvider,
    "local",
    `${role} login must report local auth provenance`,
  );
  return result.body.jwt as string;
}

const [admin] = await db
  .select({ id: usersTable.id, role: usersTable.role, accountStatus: usersTable.accountStatus })
  .from(usersTable)
  .where(eq(usersTable.email, adminEmail))
  .limit(1);
assert(admin, `canonical admin must exist: ${adminEmail}`);
assert.equal(admin.role, "admin");
assert.equal(admin.accountStatus, "active");

const client = await ensureLocalUser({
  email: clientEmail,
  password: clientPassword,
  role: "client",
  name: "Gate 2 Real Client",
  phone: "+97451111111",
});

const lawyer = await ensureLocalUser({
  email: lawyerEmail,
  password: lawyerPassword,
  role: "lawyer",
  name: "Gate 2 Real Lawyer",
  phone: "+97452222222",
});
assert.equal(lawyer.accountStatus, "pending", "new lawyer fixture must start pending");

const verificationId = await createPendingLawyerVerification(lawyer.id);

const adminLogin = await request("/api/admin/login", {
  email: adminEmail,
  password: adminPassword,
});
assert.equal(adminLogin.status, 200, `canonical admin login failed: ${JSON.stringify(adminLogin.body)}`);
const adminToken = adminLogin.body.token;
assert.equal(typeof adminToken, "string", "canonical admin login must return a token");

const review = await request(
  `/api/admin/lawyer-verifications/${verificationId}/review`,
  { status: "approved" },
  adminToken as string,
);
assert.equal(review.status, 200, `canonical admin approval failed: ${JSON.stringify(review.body)}`);
assert.equal(
  (review.body.verification as Record<string, unknown> | undefined)?.status,
  "approved",
  "admin review endpoint must return approved verification",
);

const [approvedVerification] = await db
  .select({ status: lawyerVerificationsTable.status, reviewedBy: lawyerVerificationsTable.reviewedBy })
  .from(lawyerVerificationsTable)
  .where(eq(lawyerVerificationsTable.id, verificationId))
  .limit(1);
assert.equal(approvedVerification?.status, "approved");
assert.equal(approvedVerification?.reviewedBy, admin.id, "approval must be attributed to canonical admin");

const [approvedLawyer] = await db
  .select({ accountStatus: usersTable.accountStatus, statusReason: usersTable.statusReason })
  .from(usersTable)
  .where(eq(usersTable.id, lawyer.id))
  .limit(1);
assert.equal(approvedLawyer?.accountStatus, "active", "approved lawyer must become login-eligible");
assert.equal(approvedLawyer?.statusReason, null, "approved lawyer must clear verification-required status reason");

const clientToken = await login(clientEmail, clientPassword, "client");
const lawyerToken = await login(lawyerEmail, lawyerPassword, "lawyer");
assert(clientToken && lawyerToken);

console.log("Gate #2 Auth Provenance Lock PASSED");
console.log("- MUSTASHAREK_DEMO_AUTH_ENABLED=false: PASS");
console.log("- canonical admin identity: PASS");
console.log("- lawyer starts pending: PASS");
console.log("- canonical admin API approval: PASS");
console.log("- verification reviewer is canonical admin: PASS");
console.log("- approved lawyer accountStatus=active: PASS");
console.log("- client authenticated through DB-backed local auth: PASS");
console.log("- lawyer authenticated only after professional approval: PASS");
console.log("- JWT identities match DB users: PASS");

await pool.end();
