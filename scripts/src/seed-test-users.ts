import { randomBytes, scryptSync } from "node:crypto";
import { db, pool, usersTable } from "@workspace/db";

/**
 * Seed deterministic development accounts for end-to-end lifecycle testing.
 * These accounts are intended for the isolated Codespaces database only.
 */

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

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
  for (const user of TEST_USERS) {
    const values = {
      ...user,
      passwordHash: hashPassword("test1234"),
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
