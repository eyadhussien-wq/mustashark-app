import assert from "node:assert/strict";
import {
  ALLOWED_T01_TRANSITIONS,
  assertT01Transition,
  canTransitionT01,
  financialEffectRequiresGate,
  getT01State,
} from "../artifacts/api-server/src/lib/t01ConsultationStateMachine";

const base = {
  status: "pending" as const,
  paymentStatus: "pending" as const,
  escrowStatus: "none" as const,
  lawyerJoinedAt: null,
  clientJoinedAt: null,
};

assert.equal(getT01State(base), "PAYMENT_PENDING");
assert.equal(getT01State({ ...base, paymentStatus: "paid", escrowStatus: "held" }), "PENDING_ACCEPTANCE");
assert.equal(getT01State({ ...base, status: "accepted" }), "SCHEDULED");
assert.equal(getT01State({ ...base, status: "accepted", lawyerJoinedAt: new Date() }), "IN_PROGRESS");
assert.equal(getT01State({ ...base, status: "completed" }), "COMPLETED");
assert.equal(getT01State({ ...base, status: "completed", escrowStatus: "released" }), "CLOSED");
assert.equal(getT01State({ ...base, status: "disputed" }), "DISPUTED");

assert.equal(canTransitionT01("PAYMENT_PENDING", "PENDING_ACCEPTANCE"), true);
assert.equal(canTransitionT01("PENDING_ACCEPTANCE", "SCHEDULED"), true);
assert.equal(canTransitionT01("SCHEDULED", "IN_PROGRESS"), true);
assert.equal(canTransitionT01("IN_PROGRESS", "COMPLETED"), true);
assert.equal(canTransitionT01("COMPLETED", "CLOSED"), true);
assert.equal(canTransitionT01("CLOSED", "IN_PROGRESS"), false);
assert.equal(canTransitionT01("PAYMENT_PENDING", "CLOSED"), false);

assert.doesNotThrow(() => assertT01Transition("PENDING_ACCEPTANCE", "SCHEDULED"));
assert.throws(() => assertT01Transition("CLOSED", "IN_PROGRESS"));
assert.equal(financialEffectRequiresGate("PAYMENT_SUCCESS"), true);
assert.equal(financialEffectRequiresGate("CLIENT_APPROVE"), true);
assert.equal(financialEffectRequiresGate("LAWYER_ACCEPT"), false);

assert.deepEqual(ALLOWED_T01_TRANSITIONS.CLOSED, []);
console.log("T01 state machine contract: PASS");
