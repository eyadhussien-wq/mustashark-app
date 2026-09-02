# E01 — Security Foundation Audit

**Status:** DISCOVERY IN PROGRESS  
**Branch:** `security/e01-foundation-2026-09-03`  
**Canonical starting point:** `main` / `93378a1f72517ab3dedd0eef06499d4d8f4094ce`  
**Scope:** C01, C02, C03, C12, C13, C30, C31  

## Branch discipline

This execution uses **one branch only** for the entire E01 package. E01-A through E01-E are logical work packages and will be represented by sequential commits on this branch, not child branches and not separate PRs.

`main → security/e01-foundation-2026-09-03 → one final PR → main`

No production database mutation, destructive migration, branch proliferation, or speculative security rewrite is authorized by this document.

## E01-A — Authentication & Authorization

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

### Initial middleware evidence

- `profile.ts` uses `requireAuth` and role guards for client/lawyer profile operations.
- `admin.ts` protects administrative operations with `requireAdmin`; admin login is intentionally separate.
- `cases.ts` uses `requireAuth`, role guards, and `requireApprovedLawyer` on lawyer-sensitive operations.
- `documentHandovers.ts` currently applies authentication to every route; object-level authorization remains a controller-level audit item.
- `legalRepresentationDocuments.ts` applies authentication and role guards; object ownership/membership still requires controller-level verification.

### Required authorization matrix

| Route family | Authentication | Role | Approved lawyer | Object-level owner/member check | Status |
|---|---|---|---|---|---|
| auth | public/auth-dependent by endpoint | endpoint-specific | no | endpoint-specific | AUDIT |
| profile | required except login/public auth | client/lawyer | endpoint-specific | self | AUDIT |
| admin | required | admin | no | admin scope | AUDIT |
| bookings | required for protected mutations | endpoint-specific | endpoint-specific | booking participant | AUDIT |
| availability | required for protected mutations | lawyer/client | lawyer where applicable | lawyer ownership | AUDIT |
| lawyer clients | required | lawyer | yes where applicable | lawyer/client relationship | AUDIT |
| lawyer consultations | required | lawyer/client | where applicable | consultation participant | AUDIT |
| documents/handovers | required | endpoint-specific | endpoint-specific | document/case participant | AUDIT |
| representation documents | required | client/lawyer/admin | lawyer actions as required | agreement participant | AUDIT |
| cases | required | client/lawyer/admin | lawyer actions as required | case membership/ownership | AUDIT |
| hearings | required | client/lawyer/admin | lawyer actions as required | case membership | AUDIT |

The matrix is deliberately marked AUDIT until each controller path is verified. Middleware presence alone is not treated as proof of authorization.

## E01-B — Professional Trust

C03 must prove the complete lifecycle:

`applicant → pending → admin review → approved/rejected → login/authorization entitlement`

Required evidence:

1. pending lawyers cannot obtain lawyer-only capabilities;
2. rejected/suspended/deleted users cannot retain privileged access;
3. approval is server-authoritative;
4. lawyer-only operations enforce the approval boundary at runtime;
5. state transitions are auditable and tested negatively.

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
