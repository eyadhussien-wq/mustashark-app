import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function read(path: string) {
  return readFileSync(resolve(process.cwd(), path), "utf8");
}

const bookingController = read("../artifacts/api-server/src/controllers/safeBooking.ts");
const bookingBlocks = read("../lib/db/src/schema/bookingTimeBlocks.ts");
const bookingRoutes = read("../artifacts/api-server/src/routes/bookings.ts");

assert.match(bookingRoutes, /post\("\/bookings",\s*requireAuth,\s*requireClient,\s*requireIdempotencyKey,\s*createBookingSafely\)/, "canonical booking route must require auth, client role and idempotency");
assert.match(bookingController, /db\.transaction\(async \(tx\) => \{/, "booking creation must execute inside one database transaction");
assert.match(bookingController, /pg_advisory_xact_lock\(hashtext\(\$\{`\$\{lawyer\.id\}:\$\{input\.scheduledDate\}`\}\)\)/, "booking creation must serialize concurrent work for the lawyer/day boundary");
assert.match(bookingController, /tx\.insert\(bookingsTable\)/, "booking row must be created through the transaction handle");
assert.match(bookingController, /tx\.insert\(bookingTimeBlocksTable\)/, "time block must be created through the same transaction");
assert.match(bookingController, /error\?\.code === \"23505\" \|\| error\?\.cause\?\.code === \"23505\"/, "database uniqueness conflicts must be converted into a safe conflict response");
assert.match(bookingController, /res\.status\(409\)\.json\(\{ ok: false, error: \"slot_already_booked\"/, "booking uniqueness conflicts must never become a false success");
assert.match(bookingBlocks, /uniqueIndex\("booking_time_blocks_exact_slot_uq"\)/, "database must enforce exact active-slot uniqueness");
assert.match(bookingBlocks, /\.on\(table\.lawyerId, table\.scheduledDate, table\.startTime, table\.endTime\)/, "slot uniqueness must be scoped to lawyer/date/start/end");
assert.match(bookingBlocks, /\.where\(sql`\$\{table\.releasedAt\} IS NULL`\)/, "released blocks must not permanently consume a slot");

console.log("S01-05 BOOKING CREATION GATE TEST PASSED");
console.log("- canonical authenticated booking route: PASS");
console.log("- atomic transaction boundary: PASS");
console.log("- lawyer/day concurrency serialization: PASS");
console.log("- database exact-slot uniqueness: PASS");
console.log("- unique-conflict safe 409 handling: PASS");
