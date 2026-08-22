import bcrypt from "bcryptjs";
import { db, pool, usersTable } from "@workspace/db";

const password = "test1234";
const passwordHash = await bcrypt.hash(password, 10);
const now = new Date();

const fixtures = [
  {
    id: "ci-fixture-client",
    name: "CI Test Client",
    email: "client@mustashark.com",
    phone: "+962790000001",
    phoneCountry: "jordan",
    role: "client",
    authProvider: "local",
    accountStatus: "active",
  },
  {
    id: "ci-fixture-lawyer",
    name: "CI Test Lawyer",
    email: "lawyer@mustashark.com",
    phone: "+962790000002",
    phoneCountry: "jordan",
    role: "lawyer",
    authProvider: "local",
    accountStatus: "active",
    specialization: "general",
  },
];

for (const fixture of fixtures) {
  await db
    .insert(usersTable)
    .values({
      ...fixture,
      passwordHash,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: usersTable.email,
      set: {
        name: fixture.name,
        passwordHash,
        phone: fixture.phone,
        phoneCountry: fixture.phoneCountry,
        role: fixture.role,
        authProvider: fixture.authProvider,
        providerId: null,
        accountStatus: fixture.accountStatus,
        statusReason: null,
        specialization: fixture.specialization ?? null,
        deletedAt: null,
        deletionScheduledAt: null,
        updatedAt: now,
      },
    });
}

await pool.end();
console.log("CI auth fixtures provisioned in the isolated PostgreSQL database.");
