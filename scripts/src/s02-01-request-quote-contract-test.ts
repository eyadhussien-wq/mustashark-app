import assert from "node:assert/strict";
import { createRepresentationQuoteRequestSchema } from "../../lib/api-zod/src/representationQuoteRequests";
import {
  requireAuthenticatedClientId,
  RepresentationQuoteRequestValidationError,
} from "../../artifacts/api-server/src/lib/representationQuoteRequestGuards";
import {
  getIdempotencyKey,
  getRequestHash,
} from "../../artifacts/api-server/src/lib/transactionalIdempotency";

type AuthRequest = Parameters<typeof requireAuthenticatedClientId>[0];

function request(overrides: Partial<AuthRequest> = {}): AuthRequest {
  return {
    get(name: string) {
      if (name.toLowerCase() === "idempotency-key") return "s02-01-test-key";
      return undefined;
    },
    method: "POST",
    path: "/api/representation/quote-requests",
    route: { path: "/representation/quote-requests" },
    params: {},
    query: {},
    body: {
      title: "Representation request",
      description: "Need legal representation.",
    },
    ...overrides,
  } as AuthRequest;
}

function expectValidationError(fn: () => unknown, code: string) {
  assert.throws(fn, (error: unknown) => {
    assert(error instanceof RepresentationQuoteRequestValidationError);
    assert.equal(error.code, code);
    return true;
  });
}

const valid = createRepresentationQuoteRequestSchema.safeParse({
  title: "Representation request",
  description: "Need legal representation.",
  lawyerId: "lawyer-123",
});
assert.equal(valid.success, true, "valid Request Quote payload must parse");

for (const forbiddenField of [
  "clientId",
  "status",
  "serialNumber",
  "quoteId",
  "createdAt",
  "updatedAt",
  "submittedAt",
]) {
  const result = createRepresentationQuoteRequestSchema.safeParse({
    title: "Representation request",
    [forbiddenField]: "attacker-controlled",
  });
  assert.equal(result.success, false, `${forbiddenField} must not be client-controlled`);
}

assert.equal(
  createRepresentationQuoteRequestSchema.safeParse({ title: "   " }).success,
  false,
  "blank title must be rejected",
);
assert.equal(
  createRepresentationQuoteRequestSchema.safeParse({ title: "x".repeat(201) }).success,
  false,
  "title over 200 characters must be rejected",
);
assert.equal(
  createRepresentationQuoteRequestSchema.safeParse({
    title: "Valid",
    description: "x".repeat(10_001),
  }).success,
  false,
  "description over 10,000 characters must be rejected",
);
assert.equal(
  createRepresentationQuoteRequestSchema.safeParse({
    title: "Valid",
    unexpected: true,
  }).success,
  false,
  "unknown fields must be rejected by strict schema",
);

expectValidationError(
  () => requireAuthenticatedClientId(request()),
  "AUTHENTICATION_REQUIRED",
);
expectValidationError(
  () =>
    requireAuthenticatedClientId(
      request({ authUser: { userId: "lawyer-1", role: "lawyer" } } as never),
    ),
  "CLIENT_ROLE_REQUIRED",
);
assert.equal(
  requireAuthenticatedClientId(
    request({ authUser: { userId: "client-1", role: "client" } } as never),
  ),
  "client-1",
  "authenticated client identity must come from auth context",
);

assert.equal(getIdempotencyKey(request()), "s02-01-test-key");
assert.throws(
  () => getIdempotencyKey(request({ get: () => "" } as never)),
  /IDEMPOTENCY_KEY_REQUIRED/,
  "missing idempotency key must be rejected",
);
assert.throws(
  () => getIdempotencyKey(request({ get: () => "x".repeat(201) } as never)),
  /IDEMPOTENCY_KEY_REQUIRED/,
  "oversized idempotency key must be rejected",
);

const hashA = getRequestHash(request());
const hashB = getRequestHash(
  request({
    body: { description: "Need legal representation.", title: "Representation request" },
  } as never),
);
assert.equal(hashA, hashB, "request hash must be deterministic for equivalent payloads");

const hashC = getRequestHash(
  request({ body: { title: "Different request" } } as never),
);
assert.notEqual(hashA, hashC, "different request intent must produce a different hash");

console.log("S02-01 REQUEST QUOTE CONTRACT/SECURITY TEST PASSED");
console.log("- valid payload contract: PASS");
console.log("- forbidden client-owned fields: PASS");
console.log("- strict unknown-field rejection: PASS");
console.log("- title/description bounds: PASS");
console.log("- authentication/client-role guards: PASS");
console.log("- server-derived client identity: PASS");
console.log("- idempotency key validation: PASS");
console.log("- deterministic request hashing: PASS");
