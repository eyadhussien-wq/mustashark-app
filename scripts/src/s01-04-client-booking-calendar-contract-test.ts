import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

function load(path: string) {
  const candidates = [resolve(process.cwd(), path), resolve(process.cwd(), "..", path)];
  for (const candidate of candidates) {
    try { return readFileSync(candidate, "utf8"); } catch {}
  }
  throw new Error(`Could not locate ${path}`);
}

const client = load("artifacts/mustasharek/app/lawyer/[id].tsx");
const availability = load("artifacts/api-server/src/controllers/availability.ts");
const routes = load("artifacts/api-server/src/routes/availability.ts");

// S01-04-A: calendar must consume server-generated slots for the selected date.
assert.match(client, /availability\/lawyers\/\$\{encodeURIComponent\(lawyer\.id\)\}\/slots\?date=\$\{encodeURIComponent\(selectedDate\)\}/);
assert.match(client, /setServerSlots\(body\.slots as ServerSlot\[\]\)/);
assert.match(client, /serverSlots\.find\(\(slot\) => slot\.startTime === selectedTime\)/);
assert.match(client, /scheduledTime:\s*selectedSlot\.startTime/);
assert.match(client, /scheduledEndTime:\s*selectedSlot\.endTime/);

// S01-04-B: the availability response is a non-financial scheduling contract.
assert.match(availability, /return res\.json\(\{ ok: true, date, timezone: "Asia\/Qatar", slots \}\)/);
const slotsBlock = availability.slice(availability.indexOf("const slots:"), availability.indexOf("return res.json", availability.indexOf("const slots:")));
for (const forbidden of ["price", "paymentStatus", "escrowStatus"]) {
  assert.equal(slotsBlock.includes(forbidden), false, `availability slot DTO must not expose ${forbidden}`);
}
assert.match(routes, /router\.get\("\/availability\/lawyers\/:lawyerId\/slots", requireAuth, getAvailableSlots\)/);

// S01-04 security boundary: client cannot mutate lawyer availability.
assert.match(routes, /router\.put\("\/availability\/lawyers\/me", requireAuth, requireLawyer, updateMyAvailability\)/);
assert.match(routes, /router\.delete\("\/availability\/lawyers\/me", requireAuth, requireLawyer, deleteMyAvailability\)/);

// Booking must use the server-selected slot and never invent client-side times.
const proceedStart = client.indexOf("async function handleProceed() {");
const proceedEnd = client.indexOf("\n  const rowDir", proceedStart);
assert(proceedStart >= 0 && proceedEnd > proceedStart, "handleProceed boundary not found");
const proceed = client.slice(proceedStart, proceedEnd);
assert.equal((proceed.match(/selectedSlot\.startTime/g) ?? []).length >= 1, true);
assert.equal(proceed.includes("selectedTime"), true);
assert.match(proceed, /Idempotency-Key/);

console.log("S01-04 CLIENT BOOKING CALENDAR CONTRACT TEST PASSED");
console.log("- server availability drives calendar slots: PASS");
console.log("- booking uses server-selected start/end: PASS");
console.log("- availability DTO financial isolation: PASS");
console.log("- client availability mutation boundary: PASS");
console.log("- booking idempotency boundary: PASS");
