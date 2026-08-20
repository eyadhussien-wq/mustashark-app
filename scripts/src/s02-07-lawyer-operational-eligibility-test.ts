import assert from "node:assert/strict";
import { isApprovedLawyerVerification } from "../../artifacts/api-server/src/services/lawyerEligibility";

assert.equal(isApprovedLawyerVerification("approved"), true, "approved lawyers must pass the operational eligibility predicate");
assert.equal(isApprovedLawyerVerification("pending"), false, "pending lawyers must be blocked");
assert.equal(isApprovedLawyerVerification("rejected"), false, "rejected lawyers must be blocked");
assert.equal(isApprovedLawyerVerification(undefined), false, "missing verification must be blocked");

console.log("lawyer operational eligibility guard: PASS");
