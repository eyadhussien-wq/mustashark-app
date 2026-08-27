import assert from "node:assert/strict";

const allowedStates = [
  "draft",
  "submitted",
  "under_review",
  "withdrawn",
  "expired",
  "converted_to_quote",
] as const;

type State = (typeof allowedStates)[number];

// S02-01 owns only creation/submission semantics. Later lifecycle transitions
// must not be silently broadened by the Request Quote endpoint.
const allowedTransitions: Record<State, readonly State[]> = {
  draft: ["submitted", "withdrawn", "expired"],
  submitted: ["under_review", "withdrawn", "expired"],
  under_review: ["converted_to_quote", "withdrawn", "expired"],
  withdrawn: [],
  expired: [],
  converted_to_quote: [],
};

function canTransition(from: State, to: State) {
  return allowedTransitions[from].includes(to);
}

assert.equal(canTransition("draft", "submitted"), true);
assert.equal(canTransition("submitted", "under_review"), true);
assert.equal(canTransition("under_review", "converted_to_quote"), true);

for (const terminal of ["withdrawn", "expired", "converted_to_quote"] as const) {
  assert.deepEqual(allowedTransitions[terminal], [], `${terminal} must remain terminal`);
}

assert.equal(canTransition("draft", "converted_to_quote"), false);
assert.equal(canTransition("submitted", "converted_to_quote"), false);
assert.equal(canTransition("withdrawn", "submitted"), false);
assert.equal(canTransition("expired", "under_review"), false);
assert.equal(canTransition("converted_to_quote", "under_review"), false);

assert.deepEqual(allowedStates, [
  "draft",
  "submitted",
  "under_review",
  "withdrawn",
  "expired",
  "converted_to_quote",
]);

console.log("S02-01 REQUEST QUOTE STATE CONTRACT PASSED");
console.log("- explicit lifecycle states: PASS");
console.log("- permitted forward transitions: PASS");
console.log("- terminal-state protection: PASS");
console.log("- invalid transition rejection: PASS");
