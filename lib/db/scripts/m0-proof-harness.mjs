import { strict as assert } from "node:assert";
import { M0ProofOracle, assertIsolatedDatabaseUrl } from "./m0-proof-oracle.mjs";

const PROOFS = Object.freeze([
  ["M0-P01", "Trusted Actor"],
  ["M0-P02", "Missing Actor"],
  ["M0-P03", "Missing Context"],
  ["M0-P04", "Conflicting Context"],
  ["M0-P05", "Actor Mutation"],
  ["M0-P06", "Normal Transaction"],
  ["M0-P07", "Commit Terminates Context"],
  ["M0-P08", "Rollback Terminates Context"],
  ["M0-P09", "Nested Execution Inheritance"],
  ["M0-P10", "Nested Identity Override"],
  ["M0-P11", "Retry New Context Same Actor"],
  ["M0-P12", "Concurrent A/B Isolation"],
  ["M0-P13", "Connection Reuse Isolation"],
  ["M0-P14", "Post-Transaction Context Denial"],
  ["M0-P15", "Connection Failure Abort"],
  ["M0-P16", "Authorization Denial Identity Preservation"],
  ["M0-P17", "Admin Uses UEB"],
  ["M0-P18", "Explicit System Identity"],
  ["M0-P19", "Direct DB Bypass"],
  ["M0-P20", "Client Actor Spoof"],
  ["M0-P21", "Cross-Request Isolation"],
  ["M0-P22", "Context Cleanup"],
  ["M0-P23", "Financial Identity Isolation"],
  ["M0-P24", "Nested Re-entry"],
  ["M0-P25", "Failure Recovery No Fallback"],
]);

function negativeControl(name, brokenBoundary) {
  const oracle = new M0ProofOracle();
  const before = JSON.stringify({ actor: "A", mutation: 0 });
  const after = JSON.stringify(brokenBoundary());
  oracle.requireNoMutation(before, after, `${name}: broken boundary must be rejected`);
  return oracle.snapshot();
}

function runHarnessSelfChecks() {
  const oracle = new M0ProofOracle();
  oracle.require(PROOFS.length === 25, "M0-P01..P25 registry must be complete");
  oracle.require(PROOFS.every(([id]) => /^M0-P(?:0[1-9]|1[0-9]|2[0-5])$/.test(id)), "proof IDs must be canonical");

  // These controls model intentionally broken implementations. The oracle must reject them.
  assert.throws(
    () => negativeControl("actor substitution", () => ({ actor: "B", mutation: 1 })),
    /broken boundary must be rejected/,
  );

  assert.throws(
    () => assertIsolatedDatabaseUrl("postgres://example.invalid/live"),
    /M0_HARNESS_REFUSES_NON_ISOLATED_DATABASE/,
  );

  return oracle.snapshot();
}

function main() {
  assertIsolatedDatabaseUrl();
  const evidence = runHarnessSelfChecks();
  console.log(JSON.stringify({ harness: "M0-PROOF-HARNESS-001", proofs: PROOFS.length, evidence, result: "SELF-CHECK-PASS" }));
}

main();
