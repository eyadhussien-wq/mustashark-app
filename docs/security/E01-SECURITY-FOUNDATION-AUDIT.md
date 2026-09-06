# DEPRECATED / ARCHIVED — E01 Security Foundation Audit

> **Historical audit record only.** This 2026-09-03 E01 execution document is superseded by the current ID-01 line and the canonical Master State Register. Do not use this document to determine current status, open a new unit, or authorize implementation. Preserve it for audit trail and historical reconstruction.
>
> **Current execution authority:** `docs/governance/MUSTASHARK-MASTER-STATE-2026-09-03.md`

---

# E01 — Security Foundation Audit

**Status:** E01-A CLOSED / E01-B SECURITY GATE READY  
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

**Status: SECURITY GATE READY — implementation closure evidence recorded; live-source enablement remains separately gated.**

### Approved product/security direction

Mustashark uses an automated professional-trust flow. A lawyer must provide a professional/bar number and upload a practice card. The normal path does not require an administrator to approve the lawyer.

Target flow:

`lawyer registration → professional number + practice card → automated evidence extraction/matching → permitted public/official source verification → automated decision → professional entitlement`

The administrator is an **exception/security handler only**, not the normal source of professional authority.

### Source-access rule

Only public information and public services that are technically and legally permitted for automated querying may be used. The existence of a public web page is **not** by itself authorization to scrape or automate it. No private portal, credentialed service, bypass, rate-limit evasion, or undocumented privileged endpoint is permitted.

The architecture therefore uses an explicit `ProfessionalVerificationProvider` boundary. Providers are opt-in and must be registered for an authorized public source. Missing/unavailable source evidence must never grant professional access; it produces an exception/non-verification outcome.

### Jordan professional verification

The Jordan Bar Association publishes a public lawyer directory and electronic services. These are potential evidence sources, but this implementation does not assume that automated scraping is permitted. A formally permitted public access path must be established before registering a live provider.

The Ministry of Justice also provides public electronic services and lawyer-facing services, including workflows that use the lawyer's bar number. This is treated as potential secondary official evidence, not as assumed integration permission.

### C03 implementation closure evidence

The verification record supports an auditable professional lifecycle:

`pending → verifying → approved | rejected | exception`

with additional administrative/security states:

`expired | suspended | revoked`

A submission is required to pass through the `verifying` transition before a provider decision. Rejected records re-enter through `pending → verifying`; approved records may be re-verified; expired/suspended/revoked records cannot directly promote to approved. Illegal promotions are rejected by the lifecycle guard.

The record includes source, source reference/status, verification method, matched identity/license, confidence, verification timestamps, exception reason, and document evidence hash metadata.

The lawyer verification submission contract requires:

- professional/bar number;
- bar association;
- practice-card storage key;
- the actual practice-card bytes encoded for the upload request.

The server derives SHA-256 from the actual document bytes. The authoritative hash is therefore server-derived and cannot be supplied as a client-selected hash value. The provider receives this hash as evidence metadata.

The submission invokes the provider orchestration boundary and derives the server-side decision from the provider result:

- `verified` → `approved` + account becomes active;
- `rejected` → `rejected` + account remains denied;
- `exception` / unavailable source → `exception` + account remains pending.

Verification-row and lawyer-account-status writes now occur in the same database transaction. A failure of either write rolls back the complete submission, preventing a partially activated lawyer account.

An administrator cannot approve a normal `pending` verification. Administrative review is restricted to unresolved `exception` cases and is audit logged. Professional privileged routes continue to require the canonical `approved` state from the database, so an existing JWT does not preserve professional entitlement after status loss.

### C03 source and integrity boundary

A provider may be registered only when its source is explicitly authorized for automated public querying. The repository intentionally contains no live JBA/MOJ scraper or undocumented endpoint. This prevents the security gate from silently turning a public page into an unauthorized data-collection mechanism.

The practice-card hash is computed over actual submitted bytes on the server. It is not a hash of the storage key and is not client-authoritative. The storage key remains a reference to the stored object; storage/object-level integrity and retention controls remain part of the later trusted storage hardening work and are not falsely represented as completed by this gate.

### C03 tests added

`artifacts/api-server/src/security/professional-verification.contract.test.ts` covers:

- fail-closed behavior when no authorized source provider exists;
- automatic approval from an explicitly registered provider with an exact professional match;
- automatic rejection from a registered provider when the provider reports a mismatch;
- deterministic SHA-256 calculation from actual document bytes.

`artifacts/api-server/src/security/professional-verification.lifecycle.test.ts` covers:

- normal pending/verifying/approved flow;
- rejection and safe resubmission path;
- exception resolution paths;
- expiration, suspension, and revocation;
- illegal direct promotions;
- the DB-backed entitlement rule: only `approved` is professionally entitled, so stale JWTs do not preserve professional access when the DB status is no longer approved.

### E01-B closure evidence checklist

| Gate | Result |
|---|---|
| Practice card required | PASS |
| Server-derived byte-level SHA-256 | PASS |
| Provider boundary fail-closed | PASS |
| Lifecycle state guard | PASS |
| Rejection/resubmission path | PASS |
| Expired/suspended/revoked paths | PASS |
| Illegal promotion denial | PASS |
| DB-backed entitlement / stale-session boundary | PASS |
| Atomic verification + account update | PASS |
| Exception-only admin review | PASS |
| Audit logging for exception review | PASS |
| No unauthorized JBA/MOJ automation fabricated | PASS |
| Security Gate test registration | PASS |

E01-B now has its implementation closure evidence and is **READY FOR THE E01-B SECURITY GATE RUN**. It must not be declared fully closed until the resulting branch head passes the Security Gate and the final evidence is recorded.

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
