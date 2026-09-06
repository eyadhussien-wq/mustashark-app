# DEPRECATED / ARCHIVED — E01-D Terms, Consent & Privacy Discovery Audit

> **Historical audit record only.** This 2026-09-03 E01-D discovery document is superseded by ID-01-D and the canonical Master State Register. Do not use it as the live execution status or implementation authority. Preserve it for audit trail.
>
> **Current execution authority:** `docs/governance/MUSTASHARK-MASTER-STATE-2026-09-03.md`

---

# E01-D — Terms, Consent & Privacy Discovery Audit

**Date:** 2026-09-03  
**Branch:** `security/e01-foundation-2026-09-03`  
**Status:** IN PROGRESS — DISCOVERY / ARCHITECTURE BASELINE  
**Scope:** C30 Terms / Legal Consent + C31 Privacy / Data Access Boundary  

## 1. Authority and execution boundary

This audit is executed under the canonical Mustashark Master Map and the E01 security sequence. E01-D is intentionally separated from legal-representation agreement consent. No Production DB mutation, financial-core change, or unrelated feature work is authorized by this audit.

Execution sequence:

`Architecture / Repository Discovery → Terms-versioning & consent enforcement → Privacy / data-access boundary audit → Negative Runtime Coverage → Security Gate → Evidence → CLOSE E01-D`

## 2. Repository discovery — current facts

### 2.1 Authentication boundary

`artifacts/api-server/src/middlewares/requireAuth.ts` performs JWT verification and then re-queries `users` by the authenticated user ID. It rejects missing/invalid tokens and rejects deleted or non-active accounts before attaching the database user to `req.authUser`.

This is a useful E01-D prerequisite because privacy enforcement must build on server-derived identity rather than client-supplied identity fields.

### 2.2 Role and object boundary

The Cases route applies `requireAuth`, role restriction, and (where required) `requireApprovedLawyer`. The route surface therefore has explicit authentication/role gates, but object-level authorization remains a controller/service concern and must be covered by negative runtime tests.

### 2.3 Legal representation agreements are already versioned

`lib/db/src/schema/agreements.ts` contains:

- `agreements`
- `agreement_versions`
- `agreement_confirmations`
- `agreement_evidence`

Agreement versions have an integer version, lifecycle status, immutable content hash, creator, and publication timestamp. Confirmations bind an actor to a specific agreement version and content hash; evidence records preserve the confirmation and supporting metadata.

**Decision:** This existing mechanism must NOT be reused as a substitute for platform Terms Consent. Platform Terms are a separate legal object and lifecycle.

### 2.4 Platform Terms Consent is not yet evidenced in this branch

Repository search and schema inspection did not identify `terms_versions` or `terms_consents` on this E01 branch. The current client auth model still exposes optional `termsAccepted` / `termsAcceptedAt` fields for lawyer registration, while the server-side local-auth schema shown in `artifacts/api-server/src/controllers/auth.ts` does not include those fields in its parsed schema.

The lawyer UI currently sends `termsAccepted` and `termsAcceptedAt` as part of the registration payload, but this is not evidence of server-side consent persistence or enforcement.

**Finding D-01 — CONFIRMED GAP / HIGH PRIORITY:** There is no verified versioned, server-authoritative Platform Terms Consent model in the current E01 branch.

### 2.5 Client-side terms acknowledgement exists

The client payment UI displays a notice that payment constitutes agreement to Terms of Service and Refund Policy. This is presentation-layer acknowledgement only unless the API independently enforces the required legal state.

**Finding D-02 — CONFIRMED GAP / HIGH PRIORITY:** A UI notice must not be treated as the security/legal enforcement boundary for protected actions.

## 3. Global benchmark — three reference products

### Clio

Clio's current privacy model explicitly covers collection, storage, processing, transfer, sharing and use of personal information and requires users to read/understand the policy before accessing or using the service. Clio also documents logical customer-data segregation and time-limited, logged support access requiring explicit customer permission.

**Pattern adopted for Mustasharek:** privacy is an explicit service-level contract, and privileged/support access is bounded, auditable and revocable rather than implicitly trusted.

### MyCase / 8am MyCase

MyCase's Terms describe an online SaaS legal-practice platform and explicitly connect acceptance of Terms with acknowledgement/consent regarding personal-information processing under its Privacy Policy. Its security material emphasizes role-based access and restricting users to information relevant to their function.

**Pattern adopted for Mustasharek:** Terms and Privacy must be distinct legal documents with explicit acceptance semantics, while access control must remain role- and scope-aware.

### Rocket Lawyer

Rocket Lawyer maintains separate General Terms, Privacy Policy, Legal Services Terms and other service-specific terms. Its Legal Services Terms separately address personal-data protection and attorney-client privilege. Rocket Lawyer also describes limiting access to personal data, encryption, and ongoing monitoring/testing.

**Pattern adopted for Mustasharek:** platform terms must be versioned independently from service-specific/legal-representation agreements, and sensitive legal data requires an explicit confidentiality/access boundary.

## 4. E01-D target invariants

### Terms / Consent invariants

1. A consent record MUST identify the user and the exact Terms version accepted.
2. A Terms version MUST be immutable after publication; changing legal text creates a new version.
3. The accepted Terms content/hash MUST be reproducible from the stored version.
4. Client-supplied `termsAccepted` or timestamps MUST NOT be authoritative.
5. A user MUST NOT be able to create/update consent for another user.
6. A protected action requiring current Terms MUST fail server-side when the user has no current consent.
7. If a newer mandatory Terms version is published, the prior consent MUST NOT silently satisfy the new version.
8. Agreement consent MUST remain separate from Platform Terms Consent.

### Privacy / data-access invariants

1. Client A MUST NOT read Client B's private profile or legal data through an object-ID substitution.
2. Lawyer A MUST NOT read Lawyer B's private/legal data outside an explicitly authorized relationship.
3. A lawyer MUST only access client/case/document data within the server-authorized relationship/scope.
4. A client MUST only access their own private data and explicitly authorized matter data.
5. Admin access, where necessary, MUST be explicit and auditable rather than an implicit bypass.
6. List endpoints MUST enforce the same ownership/relationship boundary as single-object endpoints.
7. DTOs/joins MUST NOT leak private fields merely because a parent object is accessible.
8. Deleted, suspended or otherwise inactive identities MUST not regain private-data access through stale sessions.

## 5. Required negative runtime coverage

The following tests are required before E01-D can close:

### Terms

- no consent → protected action denied;
- consent to old version → protected action denied after mandatory version change;
- valid current version → protected action allowed;
- forged/unknown version ID → denied;
- mismatched/tampered content hash → denied;
- consent payload naming another user → denied;
- duplicate/replay consent → idempotent and does not create contradictory legal state.

### Privacy / IDOR

- cross-client profile read → denied;
- cross-lawyer private-data read → denied;
- cross-client legal-document read → denied;
- cross-case read → denied;
- cross-case mutation → denied;
- wrong relationship/member → denied;
- list endpoint cross-scope leakage → denied;
- stale/deactivated identity attempting access → denied.

## 6. Discovery conclusion

E01-D cannot be closed from UI evidence alone. The current repository demonstrates strong authentication and several object-level authorization boundaries, but it does **not** yet demonstrate a server-authoritative, versioned Platform Terms Consent subsystem.

The next implementation decision is therefore **not** to add a Boolean `termsAccepted` field. The next step is to design the smallest versioned Terms model and enforcement boundary consistent with the existing architecture, then prove it with isolated negative runtime tests.

**Current E01-D status: OPEN — DISCOVERY COMPLETE / IMPLEMENTATION GAP CONFIRMED.**

**No Production DB changes were made by this audit.**
