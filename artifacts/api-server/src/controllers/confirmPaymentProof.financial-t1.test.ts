import assert from "node:assert/strict";
import { test } from "node:test";

/**
 * S02.3-B T1 — Financial invariant contract.
 *
 * RED PHASE: this test intentionally targets the currently missing integration
 * between verified payment-proof confirmation and the Financial Core.
 *
 * Production code is not modified by this test.
 */
test("T1: verified collection produces exactly one ledger posting and exactly one escrow funding", async () => {
  // The fixture must exercise the real confirmPaymentProof path, not fundMilestone
  // directly. Once the real DB/API harness is wired here, these are the invariants:
  //
  //   verified collection
  //     -> exactly 1 financial_ledger payment posting
  //     -> exactly 1 escrow_transactions deposit
  //     -> exactly 1 depositedAmount increment
  //
  // The current production path is expected to fail this contract because
  // confirmPaymentProof changes booking/proof state without invoking the
  // Financial Authority.
  assert.fail(
    "T1 fixture is not yet bound to the repository's real confirmPaymentProof HTTP/DB harness; do not replace this with mocks or fundMilestone directly.",
  );
});
