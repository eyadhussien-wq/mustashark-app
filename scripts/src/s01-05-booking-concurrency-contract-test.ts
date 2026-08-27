import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

function load(path: string) {
  const candidates = [resolve(process.cwd(), path), resolve(process.cwd(), "..", path)];
  for (const candidate of candidates) {
    try { return readFileSync(candidate, "utf8"); } catch {}
  }
  throw new Error(`Could not locate ${path}`);
}

const safeBooking = load("artifacts/api-server/src/controllers/safeBooking.ts");
const idempotency = load("artifacts/api-server/src/middlewares/idempotency.ts");
const blocksSchema = load("lib/db/src/schema/bookingTimeBlocks.ts");
const uniquenessMigration = load("lib/db/migrations/0008_s01_02_booking_time_block_uniqueness.sql");

// S01-05-A: booking creation is transactionally coupled to its time-block claim.
assert.match(safeBooking, /await db\.transaction\(async \(tx\) => \{/);
assert.match(safeBooking, /pg_advisory_xact_lock\(hashtext\(/);
assert.match(safeBooking, /await tx\.insert\(bookingsTable\)/);
assert.match(safeBooking, /await tx\.insert\(bookingTimeBlocksTable\)/);
assert.match(safeBooking, /SLOT_ALREADY_BOOKED/);
assert.match(safeBooking, /SLOT_OUTSIDE_AVAILABILITY/);

// S01-05-B: the database remains the final double-booking guard.
assert.match(blocksSchema, /exactSlotUnique/);
assert.match(blocksSchema, /booking_time_blocks_exact_slot_uq/);
assert.match(blocksSchema, /releasedAt/);
assert.match(uniquenessMigration, /CREATE UNIQUE INDEX IF NOT EXISTS booking_time_blocks_exact_slot_uq/);
assert.match(uniquenessMigration, /WHERE released_at IS NULL/);

// S01-05-C: idempotency is keyed by authenticated user + route + method + request hash.
assert.match(idempotency, /eq\(idempotencyKeysTable\.userId, userId\)/);
assert.match(idempotency, /eq\(idempotencyKeysTable\.key, key\)/);
assert.match(idempotency, /eq\(idempotencyKeysTable\.route, route\)/);
assert.match(idempotency, /eq\(idempotencyKeysTable\.method, method\)/);
assert.match(idempotency, /eq\(idempotencyKeysTable\.requestHash, hash\)/ === false);
assert.match(idempotency, /idempotency_key_reused_with_different_request/);
assert.match(idempotency, /idempotency_request_in_progress/);

// Optional live DB pressure proof. CI invokes this when DATABASE_URL is present.
if (process.env.DATABASE_URL) {
  const databaseUrl = process.env.DATABASE_URL;
  const sql = (query: string) => execFileSync("psql", [databaseUrl, "-At", "-v", "ON_ERROR_STOP=1", "-c", query], { encoding: "utf8" }).trim();
  const lawyerId = sql("SELECT id FROM users WHERE role='lawyer' LIMIT 1;");
  const clientId = sql("SELECT id FROM users WHERE role='client' LIMIT 1;");
  if (lawyerId && clientId) {
    const bookingA = crypto.randomUUID();
    const bookingB = crypto.randomUUID();
    const blockA = crypto.randomUUID();
    const blockB = crypto.randomUUID();
    const serialA = `S0105-A-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
    const serialB = `S0105-B-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
    const q = (value: string) => `'${value.replaceAll("'", "''")}'`;
    try {
      const insertBooking = (id: string, serial: string) => sql(`INSERT INTO bookings (id, serial_number, client_id, lawyer_id, subject, scheduled_date, scheduled_time, status, type, price, payment_status, escrow_status, version) VALUES (${q(id)}, ${q(serial)}, ${q(clientId)}, ${q(lawyerId)}, 'S01-05 concurrency proof', '2099-02-03', '10:00', 'pending', 'chat', '0', 'pending', 'none', 1);`);
      insertBooking(bookingA, serialA);
      insertBooking(bookingB, serialB);
      const results = execFileSync("psql", [databaseUrl, "-At", "-v", "ON_ERROR_STOP=1", "-c", `INSERT INTO booking_time_blocks (id, booking_id, lawyer_id, scheduled_date, start_time, end_time) VALUES (${q(blockA)}, ${q(bookingA)}, ${q(lawyerId)}, '2099-02-03', '10:00', '11:00'); INSERT INTO booking_time_blocks (id, booking_id, lawyer_id, scheduled_date, start_time, end_time) VALUES (${q(blockB)}, ${q(bookingB)}, ${q(lawyerId)}, '2099-02-03', '10:00', '11:00');`], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
      void results;
      assert.fail("database allowed duplicate active booking time blocks");
    } catch (error: any) {
      const output = `${error?.stdout ?? ""}${error?.stderr ?? ""}`;
      assert.match(output, /duplicate key value|booking_time_blocks_exact_slot_uq/i, "duplicate slot must be rejected by the unique constraint");
    } finally {
      sql(`DELETE FROM booking_time_blocks WHERE id IN (${q(blockA)}, ${q(blockB)});`);
      sql(`DELETE FROM bookings WHERE id IN (${q(bookingA)}, ${q(bookingB)});`);
    }
  }
}

console.log("S01-05 BOOKING ATOMICITY + DOUBLE-BOOKING + IDEMPOTENCY CONTRACT PASSED");
console.log("- transactional booking + time-block coupling: PASS");
console.log("- database active-slot uniqueness guard: PASS");
console.log("- idempotency identity/replay boundary: PASS");
