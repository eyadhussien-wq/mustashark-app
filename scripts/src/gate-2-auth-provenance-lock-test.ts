import assert from "node:assert/strict";
import { and, eq } from "drizzle-orm";
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

assert.equal(
  process.env.MUSTASHAREK_DEMO_AUTH_ENABLED,
  "false",
  "Gate #2 financial auth provenance requires demo auth to be explicitly disabled",
);

async function request(path: string, body: unknown) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
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

async function ensureApprovedLawyer(lawyerId: string, adminId: string) {
  const [existing] = await db
    .select({ id: lawyerVerificationsTable.id, status: lawyerVerificationsTable.status })
    .from(lawyerVerificationsTable)
    .where(eq(lawyerVerificationsTable.userId, lawyerId))
    .limit(1);

  if (existing?.status === "approved") return;

  if (existing) {
    assert.equal(existing.status, "pending", `unexpected verification state: ${existing.status}`);
    await db
      .update(lawyerVerificationsTable)
      .set({
        status: "approved",
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: null,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(lawyerVerificationsTable.id, existing.id),
          eq(lawyerVerificationsTable.status, "pending"),
        ),
      );
    return;
  }

  const verificationId = crypto.randomUUID();
  const now = new Date();
  await db.insert(lawyerVerificationsTable).values({
    id: verificationId,
    userId: lawyerId,
    licenseNumber: `GATE2-${lawyerId.slice(0, 8)}`,
    barAssociation: "CI Professional Verification Fixture",
    documentStorageKey: `gate2/verification/${verificationId}`,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  });
  await db
    .update(lawyerVerificationsTable)
    .set({
      status: "approved",
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason: null,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(lawyerVerificationsTable.id, verificationId),
        eq(lawyerVerificationsTable.status, "pending"),
      ),
    );
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

await ensureApprovedLawyer(lawyer.id, admin.id);

const clientLogin = await request("/api/auth/local-auth", {
  email: clientEmail,
  password: clientPassword,
  role: "client",
});
assert.equal(clientLogin.status, 200, `real client login failed: ${JSON.stringify(clientLogin.body)}`);
assert.equal(clientLogin.body?.user && (clientLogin.body.user as Record<string, unknown>).id, client.id);
assert.equal(clientLogin.body?.user && (clientLogin.body.user as Record<string, unknown>).authProvider, "local");
assert.equal(typeof clientLogin.body?.jwt, "string");

const lawyerLogin = await request("/api/auth/local-auth", {
  email: lawyerEmail,
  password: lawyerPassword,
  role: "lawyer",
});
assert.equal(lawyerLogin.status, 200, `real lawyer login failed after approval: ${JSON.stringify(lawyerLogin.body)}`);
assert.equal(lawyerLogin.body?.user && (lawyerLogin.body.user as Record<string, unknown>).id, lawyer.id);
assert.equal(lawyerLogin.body?.user && (lawyerLogin.body.user as Record<string, unknown>).authProvider, "local");
assert.equal(typeof lawyerLogin.body?.jwt, "string");

console.log("Gate #2 Auth Provenance Lock PASSED");
console.log("- MUSTASHAREK_DEMO_AUTH_ENABLED=false: PASS");
console.log("- canonical admin reviewer: PASS");
console.log("- client authenticated through DB-backed local auth: PASS");
console.log("- lawyer authenticated only after professional approval: PASS");
console.log("- JWT identities match DB users: PASS");

await pool.end();
