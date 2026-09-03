# E01 — Security Foundation Audit

**Status:** E01-A CLOSED / E01-B IN PROGRESS  
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
- Latest verified security commit before E01-B: `d05c3fe9bd98faaafbee3ea983d61f50578fe23d`.
- Latest Security Auth workflow on that SHA passed the adversarial Security Gate, isolated Test DB guard/schema identity checks, library typecheck/declarations build, and API typecheck.

### E01-A DoD — CLOSED

| Gate | Result |
|---|---|
| Route inventory | PASS |
| Auth/authz source audit | PASS |
| Static authorization contract | PASS |
| Runtime negative authorization R1–R14 | PASS |
| Cross-resource isolation | PASS |
| Unauthenticated denial | PASS |
| Nonexistent-resource non-leakage | PASS |
| Isolated Test DB | PASS |
| Library typecheck | PASS |
| API typecheck | PASS |
| Production DB safety | PASS |
| Main protection | PASS |

**E01-A closure is recorded in GitHub, not merely announced in chat.**

## E01-B — Professional Trust

**Status: IN PROGRESS**

### Approved product/security direction

Mustashark will use an automated professional-trust flow. A lawyer must provide a professional/bar number and upload a practice card. The normal path must not require an administrator to approve the lawyer.

Target flow:

`lawyer registration → professional number + practice card → automated evidence extraction/matching → permitted public/official source verification → automated decision → professional entitlement`

The administrator is an **exception/security handler only**, not the normal source of professional authority.

### Source-access rule

Only public information and public services that are technically and legally permitted for automated querying may be used. The existence of a public web page is **not** by itself authorization to scrape or automate it. No private portal, credentialed service, bypass, rate-limit evasion, or undocumented privileged endpoint is permitted.

The architecture therefore uses a `ProfessionalVerificationProvider` boundary. A provider is opt-in and must be explicitly configured for an authorized public source. Missing/unavailable source evidence must never grant professional access; it produces an exception/non-verification outcome.

### Jordan professional verification

The Jordan Bar Association currently publishes a public lawyer directory and an electronic-services portal. The directory is useful as a potential public verification source, but this audit does not assume that automated scraping is permitted. A formal/publicly permitted access path must be established before enabling a live provider.

The Ministry of Justice also provides public electronic services and lawyer-facing services, including workflows that use the lawyer's bar number. This is treated as a potential secondary official evidence source, not as an assumed integration permission.

### Implemented boundary

`artifacts/api-server/src/services/professionalVerification.ts` establishes:

- provider-neutral professional verification input/output types;
- explicit `ProfessionalVerificationProvider` interface;
- verification result states: `verified`, `rejected`, `exception`;
- verification methods including `public_source_match`, `document_evidence_only`, and `source_unavailable`;
- document evidence hashing boundary;
- fail-closed provider selection: an unconfigured source cannot grant professional access.

This is intentionally an architecture/security boundary first. No unauthorized source automation is enabled by default.

### Required next implementation steps

1. Complete C03 lifecycle audit across registration, verification, account status and all approved-lawyer gates.
2. Define the permitted public-source adapters and their exact access rules.
3. Implement practice-card metadata/OCR handling as secondary evidence, with private storage and hashing.
4. Extend the verification record with auditable source/method/timestamps only after the schema change is justified by the audit.
5. Replace manual approval as the normal transition with automated verification; retain exception handling only for unresolved cases.
6. Add stale-state and negative runtime tests: verified → professionally suspended/rejected → privileged operation must fail even with an existing JWT.
7. Run the isolated Security Gate and typecheck before any closure decision.

### E01-B DoD

E01-B cannot be closed until:

- practice card is mandatory for lawyer verification;
- professional number is mandatory;
- normal verification is automated;
- no admin approval is required for a successful automated verification;
- only permitted public/official sources are queried;
- source failure cannot grant access;
- identity/card/source matching is auditable;
- professional status is enforced server-side;
- stale JWT cannot retain privileged access after professional status loss;
- exception handling is isolated from ordinary approval;
- negative runtime tests pass;
- typecheck and relevant CI checks pass.

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

### C31 Privacy/Data Boundary

Required controls:

- object-level access matrix;
- sensitive-field inventory;
- least-privilege reads/writes;
- cross-tenant/user isolation tests;
- admin exception boundaries;
- audit logging for security-sensitive access where required.

## E01-E — Final Security Gate

E01 is not CLOSED until all required evidence exists on the same branch and the final diff has been audited. Only then is one final PR opened to `main`.

## Closure rule

`E01-A → E01-B → E01-C → E01-D → E01-E` are sequential logical packages on **one branch**. No child branches. No separate PRs. No merge to `main` before the final Security Gate is satisfied.
