import assert from "node:assert/strict";
import { test } from "node:test";
import {
  assertLawyerVerificationTransition,
  canTransitionLawyerVerification,
  type LawyerVerificationState,
} from "../services/professionalVerification";
import { isApprovedLawyerVerification } from "../services/lawyerEligibility";

test("C03 lifecycle: normal verification path", () => {
  const path: LawyerVerificationState[] = ["pending", "verifying", "approved", "expired", "verifying", "approved"];
  for (let i = 0; i < path.length - 1; i += 1) {
    assert.equal(canTransitionLawyerVerification(path[i], path[i + 1]), true);
    assert.doesNotThrow(() => assertLawyerVerificationTransition(path[i], path[i + 1]));
  }
});

test("C03 lifecycle: rejection can be resubmitted, but rejected is not active", () => {
  assert.equal(canTransitionLawyerVerification("verifying", "rejected"), true);
  assert.equal(canTransitionLawyerVerification("rejected", "pending"), true);
  assert.equal(canTransitionLawyerVerification("rejected", "approved"), false);
});

test("C03 lifecycle: exceptions may be resolved only through re-verification or explicit exception review", () => {
  assert.equal(canTransitionLawyerVerification("verifying", "exception"), true);
  assert.equal(canTransitionLawyerVerification("exception", "verifying"), true);
  assert.equal(canTransitionLawyerVerification("exception", "approved"), true);
  assert.equal(canTransitionLawyerVerification("exception", "rejected"), true);
  assert.equal(canTransitionLawyerVerification("pending", "approved"), false);
});

test("C03 lifecycle: approved entitlement can be lost", () => {
  assert.equal(canTransitionLawyerVerification("approved", "expired"), true);
  assert.equal(canTransitionLawyerVerification("approved", "suspended"), true);
  assert.equal(canTransitionLawyerVerification("approved", "revoked"), true);
  assert.equal(canTransitionLawyerVerification("suspended", "revoked"), true);
  assert.equal(canTransitionLawyerVerification("revoked", "approved"), false);
});

test("C03 lifecycle: illegal promotions are rejected", () => {
  assert.throws(() => assertLawyerVerificationTransition("pending", "approved"), /INVALID_VERIFICATION_TRANSITION:pending->approved/);
  assert.throws(() => assertLawyerVerificationTransition("expired", "approved"), /INVALID_VERIFICATION_TRANSITION:expired->approved/);
  assert.throws(() => assertLawyerVerificationTransition("revoked", "approved"), /INVALID_VERIFICATION_TRANSITION:revoked->approved/);
});

test("C03 security boundary: only approved DB verification grants professional entitlement", () => {
  const states: LawyerVerificationState[] = ["pending", "verifying", "rejected", "exception", "expired", "suspended", "revoked"];
  for (const state of states) assert.equal(isApprovedLawyerVerification(state), false, state);
  assert.equal(isApprovedLawyerVerification("approved"), true);
});
