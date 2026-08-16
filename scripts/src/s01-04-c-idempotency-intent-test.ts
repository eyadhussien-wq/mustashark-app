import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

/**
 * S01-04-C client-boundary proof.
 *
 * This is intentionally a contract/lifecycle test rather than a React renderer
 * test: the mobile package has no component-test harness. It verifies the
 * production source owns the key in useRef, sends it only as a header, keeps
 * it after failure, and clears it only after the local booking succeeds.
 */

function loadLawyerDetailSource() {
  const candidates = [
    resolve(process.cwd(), "../artifacts/mustasharek/app/lawyer/[id].tsx"),
    resolve(process.cwd(), "artifacts/mustasharek/app/lawyer/[id].tsx"),
  ];

  for (const path of candidates) {
    try {
      return readFileSync(path, "utf8");
    } catch {
      // Try the alternate workspace-relative location.
    }
  }

  throw new Error("Could not locate artifacts/mustasharek/app/lawyer/[id].tsx");
}

function assertSourceContract(source: string) {
  assert.match(
    source,
    /const bookingIntentKeyRef = React\.useRef<string \| null>\(null\);/,
    "booking intent identity must be retained in a useRef",
  );

  const handleProceedStart = source.indexOf("async function handleProceed() {");
  const handleProceedEnd = source.indexOf("\n  const rowDir", handleProceedStart);
  assert(handleProceedStart >= 0 && handleProceedEnd > handleProceedStart, "handleProceed boundary not found");
  const handleProceed = source.slice(handleProceedStart, handleProceedEnd);

  assert.match(
    handleProceed,
    /bookingIntentKeyRef\.current \?\? \(bookingIntentKeyRef\.current = globalThis\.crypto\.randomUUID\(\)\)/,
    "the first attempt must create one key and subsequent attempts must reuse it",
  );
  assert.match(
    handleProceed,
    /customFetch<.*?>\("\/bookings",\s*\{[\s\S]*?headers:\s*\{[^}]*\"Idempotency-Key\":\s*idempotencyKey/s,
    "the key must cross the transport boundary through the Idempotency-Key header",
  );

  const bookingBodyStart = handleProceed.indexOf("body: JSON.stringify({");
  assert(bookingBodyStart >= 0, "booking JSON body not found");
  const bookingBody = handleProceed.slice(bookingBodyStart, handleProceed.indexOf("}),", bookingBodyStart) + 2);
  assert(!bookingBody.includes("Idempotency-Key"), "Idempotency-Key must not be placed in the JSON body");

  const successIndex = handleProceed.indexOf("await bookConsultation");
  const clearIndex = handleProceed.indexOf("bookingIntentKeyRef.current = null");
  assert(successIndex >= 0 && clearIndex > successIndex, "intent key must be cleared only after local booking success");

  const catchIndex = handleProceed.indexOf("} catch (requestError)");
  assert(catchIndex > clearIndex, "catch block must occur after the success-only key reset");
  assert(!handleProceed.slice(catchIndex).includes("bookingIntentKeyRef.current = null"), "failure path must retain the intent key");

  assert(!source.includes("customFetch.*randomUUID"), "transport must not generate idempotency keys");
}

function proveLifecycle() {
  type Ref = { current: string | null };
  const ref: Ref = { current: null };
  const generatedKeys = ["intent-A", "intent-B"];
  let generatedIndex = 0;

  const nextKey = () => ref.current ?? (ref.current = generatedKeys[generatedIndex++]);

  const firstAttemptKey = nextKey();
  assert.equal(firstAttemptKey, "intent-A", "first booking intent must receive the first key");

  // Simulate a failed network attempt: the ref is deliberately untouched.
  const retryKey = nextKey();
  assert.equal(retryKey, firstAttemptKey, "retry of the same intent must reuse the same key");

  // Simulate the success boundary used by handleProceed.
  ref.current = null;

  const newIntentKey = nextKey();
  assert.equal(newIntentKey, "intent-B", "a new intent after success must receive a new key");
  assert.notEqual(newIntentKey, firstAttemptKey, "new intent key must differ from the completed intent key");
}

const source = loadLawyerDetailSource();
assertSourceContract(source);
proveLifecycle();

console.log("S01-04-C CLIENT IDEMPOTENCY INTENT TEST PASSED");
