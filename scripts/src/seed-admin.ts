import { randomBytes, scryptSync } from "node:crypto";
import { db, pool, usersTable } from "@workspace/db";

/**
 * Seed (or update) the platform ADMIN user in the database.
 *
 * The mobile app currently authenticates against local AsyncStorage, so this
 * DB record is the source of truth for any backend/admin API access. Passwords
 * are stored as a salted scrypt hash in the `scrypt$<salt>$<hash>` format.
 *
 * Run: pnpm --filter @workspace/scripts run seed-admin
 */

function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

const ADMIN = {
  id: "admin-seed",
  name: "مدير النظام",
  email: "admin@mustashark.com",
  passwordHash: hashPassword("test1234"),
  phone: "+97450000000",
  role: "admin" as const,
  country: "qatar" as const,
  authProvider: "local" as const,
};

async function main() {
  await db
    .insert(usersTable)
    .values(ADMIN)
    .onConflictDoUpdate({
      target: usersTable.email,
      set: {
        name: ADMIN.name,
        passwordHash: ADMIN.passwordHash,
        phone: ADMIN.phone,
        role: ADMIN.role,
        country: ADMIN.country,
        authProvider: ADMIN.authProvider,
        updatedAt: new Date(),
      },
    });

  console.log(`✅ Admin user ready: ${ADMIN.email} (role: ${ADMIN.role})`);
  await pool.end();
}

main().catch(async (err) => {
  console.error("❌ Failed to seed admin user:", err);
  await pool.end();
  process.exit(1);
});
