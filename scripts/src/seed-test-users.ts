import bcrypt from "bcryptjs";
import { db, pool, usersTable } from "@workspace/db";

/**
 * Seed deterministic development accounts for end-to-end lifecycle testing.
 * These accounts are intended for the isolated Codespaces database only.
 *
 * IMPORTANT: the API local-auth controller verifies passwords with bcryptjs,
 * so test accounts must use the same password-hash format as real accounts.
 */

const TEST_PASSWORD = "test1234";

const TEST_USERS = [
  {
    id: "test-lawyer-seed",
    name: "Test Lawyer",
    email: "testlawyer@mustashark.com",
    phone: "+97450000001",
    role: "lawyer" as const,
    country: "qatar" as const,
    accountStatus: "pending" as const,
    specialization: "general",
  },
  {
    id: "test-client-seed",
    name: "Test Client",
    email: "testclient@mustasharak.com",
    phone: "+97450000002",
    role: "client" as const,
    country: "qatar" as const,
    accountStatus: "active" as const,
  },
];

async function main() {
  const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);

  for (const user of TEST_USERS) {
    const values = {
      ...user,
      passwordHash,
      authProvider: "local" as const,
    };

    await db
      .insert(usersTable)
      .values(values)
      .onConflictDoUpdate({
        target: usersTable.email,
        set: {
          name: values.name,
          passwordHash: values.passwordHash,
          phone: values.phone,
          role: values.role,
          country: values.country,
          accountStatus: values.accountStatus,
          specialization: values.specialization,
          authProvider: values.authProvider,
          updatedAt: new Date(),
        },
      });

    console.log(
      `✅ Test user ready: ${user.email} (role: ${user.role}, status: ${user.accountStatus})`,
    );
  }

  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Failed to seed test users:", err);
  await pool.end();
  process.exit(1);
});
