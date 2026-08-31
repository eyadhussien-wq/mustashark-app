import bcrypt from "bcryptjs";
import { execFileSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error("DATABASE_URL must be set for CI auth fixture provisioning.");

const passwordHash = await bcrypt.hash("test1234", 10);

const sql = `
INSERT INTO users (
  id, name, email, password_hash, phone, phone_country, role, auth_provider,
  account_status, specialization, deleted_at, deletion_scheduled_at,
  status_reason, created_at, updated_at
) VALUES
  ('ci-fixture-client', 'CI Test Client', 'client@mustashark.com', :'password_hash', '+962790000001', 'jordan', 'client', 'local', 'active', NULL, NULL, NULL, NULL, NOW(), NOW()),
  ('ci-fixture-lawyer', 'CI Test Lawyer', 'lawyer@mustashark.com', :'password_hash', '+962790000002', 'jordan', 'lawyer', 'local', 'active', 'general', NULL, NULL, NULL, NOW(), NOW())
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  password_hash = EXCLUDED.password_hash,
  phone = EXCLUDED.phone,
  phone_country = EXCLUDED.phone_country,
  role = EXCLUDED.role,
  auth_provider = EXCLUDED.auth_provider,
  provider_id = NULL,
  account_status = EXCLUDED.account_status,
  specialization = EXCLUDED.specialization,
  deleted_at = NULL,
  deletion_scheduled_at = NULL,
  status_reason = NULL,
  updated_at = NOW();
`;

execFileSync("psql", [databaseUrl, "-v", "ON_ERROR_STOP=1", "-v", `password_hash=${passwordHash}`], {
  input: sql,
  stdio: ["pipe", "inherit", "inherit"],
});

console.log("CI local-auth identities provisioned in the isolated PostgreSQL database.");
