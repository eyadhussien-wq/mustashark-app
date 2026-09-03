# E01 — Security Foundation Audit

**Status:** E01-A CLOSED / E01-B READY  
**Branch:** `security/e01-foundation-2026-09-03`  
**Canonical starting point:** `main` / `93378a1f72517ab3dedd0eef06499d4d8f4094ce`  
**Scope:** C01, C02, C03, C12, C13, C30, C31  

## Branch discipline

This execution uses **one branch only** for the entire E01 package. E01-A through E01-E are logical work packages and will be represented by sequential commits on this branch, not child branches and not separate PRs.

`main → security/e01-foundation-2026-09-03 → one final PR → main`

No production database mutation, destructive migration, branch proliferation, or speculative security rewrite is authorized by this document.

## E01-A — Authentication & Authorization

### Closure decision

**E01-A is formally CLOSED on this branch.** Closure is based on source evidence, static authorization-boundary regression coverage, runtime negative authorization coverage, isolated Test DB execution, and typecheck evidence on the same branch.

### Evidence recorded

- Central route registry audited for the mounted API surface.
- High-risk controller/service boundaries were source-verified for ownership, membership, actor relationship, and explicit administrative exceptions.
- `artifacts/api-server/src/security/authorization-boundary.contract.test.ts` provides structural regression coverage for the audited authorization boundaries.
- `artifacts/api-server/src/security/runtime-negative-authorization.integration.test.ts` provides runtime negative coverage for cross-resource and wrong-actor access.
- Runtime negative coverage was expanded through R14, including cross-owner proposal, consultation, hearing, payment-proof, and unauthenticated/nonexistent-resource cases.
- Latest verified security commit: `d05c3fe9bd98faaafbee3ea983d61f50578fe23d`.
- Latest Security Auth workflow on that SHA passed the adversarial Security Gate, isolated Test DB guard/schema identity checks, library typecheck/declarations build, and API typecheck.
- Historical failures were traced to older SHAs or a test assertion/fixture issue and are not treated as current failures of `d05c3fe9bd98faaafbee3ea983d61f50578fe23d`.

### Route inventory discovered on the canonical baseline

The API route registry currently mounts these route modules:

- health.ts
- auth.ts
- profile.ts
- admin.ts
- bookings.ts
- availability.ts
- lawyerClients.ts
- lawyerConsultations.ts
- reviews.ts
- notifications.ts
- documentHandovers.ts
- paymentProofs.ts
- consultationDocumentation.ts
- representationQuoteRequests.ts
- lawyerProposals.ts
- agreements.ts
- legalRepresentationDocuments.ts
- cases.ts
- caseHearings.ts
- fundMilestone.ts
- allocateMilestone.ts
- createMilestoneProof.ts
- createMilestoneReleaseRequest.ts
- disputeMilestoneRelease.ts
- releaseMilestone.ts
- refundMilestone.ts

The central route registry is `artifacts/api-server/src/routes/index.ts`.

### High-risk controller audit — closed pass

The following object-level boundaries were source-verified on `security/e01-foundation-2026-09-03`:

- Booking confirmation checks the assigned lawyer against the authenticated actor; admin is an explicit exception.
- Booking join checks the authenticated client or assigned lawyer before state transition.
- Booking completion is restricted to the assigned lawyer or admin and uses optimistic versioning/idempotency.
- Booking dispute is restricted to booking participants or admin and uses optimistic versioning/idempotency.
- Lawyer no-show claim/refund/transfer checks the booking client; transfer also validates the replacement lawyer against the original lawyer's transfer rules.
- Payment-proof confirmation/rejection binds `proofId` to the route `bookingId` and checks assigned-lawyer ownership for lawyer actors.
- Agreement reads require agreement-party ownership; version creation/publishing is bound to the agreement lawyer and publishing additionally verifies `versionId` belongs to the same agreement.
- Legal-representation document operations resolve the parent agreement and enforce agreement-party access. Upload permission is constrained by document type and actor role.
- Document handovers check document ownership/requester/recipient; recipient operations also require active case membership. Operational status/tracking mutations are admin-only.
- Notifications are scoped to the authenticated user's ID for both reads and mutations.
- Lawyer verification submission/read uses the authenticated lawyer's own ID; review is admin-protected and audit logged.
- Lawyer availability update/delete uses only `req.authUser.id`; target availability lookup is limited to active lawyers.
- Parameterized lawyer-client, lawyer-consultation, representation-proposal, case, hearing, milestone, payment-proof, and handover boundaries were included in the authorization contract audit.

### Negative runtime coverage

The runtime suite covers wrong-actor and cross-resource denial with required HTTP-equivalent authorization outcomes and mutation-safety assertions where applicable, including:

- lawyer client directory isolation;
- lawyer consultation directory isolation;
- cross-owner case read denial;
- cross-owner case transition denial;
- cross-client milestone allocation denial before mutation;
- lawyer-only route rejection for a client;
- cross-client proposal list denial;
- cross-lawyer proposal read denial;
- consultation print-data isolation;
- case-hearing list isolation;
- case-hearing transition isolation;
- payment-proof access isolation;
- unauthenticated proposal access rejection;
- nonexistent proposal returns 404 without cross-resource leakage.

The suite is executed only against the isolated Security Test DB and refuses production/live database URLs.

### Important observations

1. No speculative IDOR patch was introduced where source evidence already proved the object boundary.
2. Availability lookup is actor-independent by design; security scope is limited to intended public availability fields and no private lawyer data leakage.
3. No-show transfer/refund remains a Financial Authority concern. It was not rewritten under E01-A without applying the canonical Financial Authority decision in dedicated financial work.
4. Existing `platform_dues` is preserved and is not treated as authoritative financial accounting merely because it exists.

### E01-A DoD — CLOSED

| Gate | Evidence | Result |
|---|---|---|
| Route inventory | Central route registry + route matrix | PASS |
| Auth/authz source audit | Controller/service inspection | PASS |
| Static authorization contract | `authorization-boundary.contract.test.ts` | PASS |
| Runtime negative authorization | `runtime-negative-authorization.integration.test.ts` R1–R14 | PASS |
| Cross-resource isolation | Case/proposal/hearing/payment-proof/consultation coverage | PASS |
| Unauthenticated denial | Runtime R13 | PASS |
| Nonexistent-resource non-leakage | Runtime R14 | PASS |
| Isolated Test DB | Security workflow DB guard + identity assertion | PASS |
| Library typecheck | Latest verified Security Auth run | PASS |
| API typecheck | Latest verified Security Auth run | PASS |
| Production DB safety | Test URL guard; no production mutation | PASS |
| Main protection | Work remains on E01 branch; no merge | PASS |

**E01-A closure is now recorded in GitHub, not merely announced in chat.**

## E01-B — Professional Trust

**Status: READY TO START**

C03 must prove the complete lifecycle:

`applicant → pending → admin review → approved/rejected → login/authorization entitlement`

Required evidence:

1. pending lawyers cannot obtain lawyer-only capabilities;
2. rejected/suspended/deleted users cannot retain privileged access;
3. approval is server-authoritative;
4. lawyer-only operations enforce the approval boundary at runtime;
5. state transitions are auditable and tested negatively.

E01-B starts only after this E01-A closure commit and continues on the same branch. No PR is opened yet.

## E01-C — Legal Data Isolation

### C12 Documents

Audit targets:

- document ownership and participant checks;
- agreement/case relationship checks;
- private storage/access boundaries;
- download/read authorization;
- mutation authorization;
- sensitive metadata exposure;
- cross-user ID substitution tests.

### C13 Cases

Audit targets:

- case ownership;
- membership authorization;
- client/lawyer/admin access separation;
- hearing access inherited from case membership;
- transition authorization;
- IDOR/BOLA negative tests;
- sensitive-field exposure.

## E01-D — Terms / Privacy

### C30 Terms Consent

The canonical baseline must be verified for:

- versioned terms records;
- consent records tied to a specific version;
- timestamp/audit evidence;
- server-side enforcement where consent is required;
- separation between terms consent and legal-representation agreements.

If these primitives are not present on canonical `main`, implementation is required; no assumption will be carried over from experimental branches.

### C31 Privacy/Data Boundary

Required controls:

- object-level access matrix;
- sensitive-field inventory;
- least-privilege reads/writes;
- cross-tenant/user isolation tests;
- admin exception boundaries;
- audit logging for security-sensitive access where required.

## E01-E — Final Security Gate

E01 is not CLOSED until all of the following have evidence on the same branch:

- route inventory complete;
- auth/authz matrix complete;
- IDOR/BOLA negative tests pass;
- lawyer approval boundary proven;
- document privacy tests pass;
- case membership isolation tests pass;
- Terms Consent status verified and enforced where required;
- sensitive-field review complete;
- typecheck passes;
- relevant tests pass;
- full required CI checks pass;
- final diff audit passes;
- branch is verified against the target `main` baseline;
- one final PR is opened to `main`.

## Closure rule

`E01-A → E01-B → E01-C → E01-D → E01-E` are sequential logical packages on **one branch**. No child branches. No separate PRs. No merge to `main` before the final Security Gate is satisfied.
