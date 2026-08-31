# MUSTASHAREK — Gate #3 Baseline Contract

**Status:** `APPROVED BASELINE — READY FOR CONTROLLED IMPLEMENTATION`

**Evidence baseline:** `06c704f4e046a41982a0c439fcb7765673ab0151`

**Branch:** `security/gate-2-financial-guards`

**Approval basis:** Remote-Git inventory + verified repository route/controller provenance + accepted administrative audit baseline.

**Governance rule:** Gate #3 implementation is authorized only on an isolated branch and must remain fail-closed with respect to `main` and Production. No migration or production change is implied by this contract.

---

## Part I — Approved Baseline Scope

Gate #3 MVP Baseline covers the following real security/control surfaces:

1. Administrative identity and RBAC.
2. Human-in-the-loop lawyer verification and approval.
3. Transactional administrative audit persistence.
4. Existing authenticated dispute controls.
5. Existing authenticated release/refund authorization boundaries.
6. Administrative monitoring/intervention surfaces already present in the repository.
7. Evidence-driven CI/security verification for the implemented baseline.

The baseline explicitly excludes any undocumented or mock-only capability.

---

## G3-A — Admin Identity & RBAC

**Classification:** `VERIFIED BASELINE`

**Repository evidence:**

- `artifacts/api-server/src/middlewares/requireAdmin.ts`
- `artifacts/api-server/src/routes/admin.ts`

`requireAdmin` requires a Bearer token, verifies the JWT role, then performs a live database lookup against `usersTable` to confirm the authenticated identity still has the `admin` role. Failure is fail-closed. fileciteturn249file0L2-L6

Administrative endpoints are protected by `requireAdmin`, including lawyer verification review, monitoring, deletion review, profile-change review, bank-account review and moderation. fileciteturn250file0L2-L6

**Acceptance invariant:** administrative control cannot be exercised solely from an unverified/stale token claim.

---

## G3-B — Human-in-the-Loop Lawyer Approval

**Classification:** `VERIFIED BASELINE`

**Repository evidence:**

- `artifacts/api-server/src/controllers/lawyerVerification.ts`
- `/admin/lawyer-verifications/pending`
- `/admin/lawyer-verifications/:id/review`

The approval flow is transactional: pending verification is loaded, the lawyer is checked, the verification is updated with `reviewedBy`/`reviewedAt`, approval changes `accountStatus` to `active`, and an administrative audit record is written in the same transaction. fileciteturn251file0L2-L6

**Acceptance invariant:** a lawyer cannot enter the active production login path merely because a fixture or client claims approval; the authoritative DB state must be changed through the protected administrative lifecycle.

---

## G3-C — Administrative Audit Persistence

**Classification:** `ACCEPTED BASELINE`

**Baseline control:** `admin_audit_logs` is the authoritative MVP administrative audit persistence layer.

It records administrator attribution, action, entity type/id, description, before/after data and creation time. The lawyer approval transaction writes this evidence atomically with the state transition. fileciteturn251file0L2-L6

**Explicit limitation:** this does not constitute a case-specific Activity Log API.

---

## G3-D — Dispute Controls

**Classification:** `BASELINE ROUTE VERIFIED / BEHAVIOR EVIDENCE REQUIRED`

**Repository evidence:** `disputeMilestoneRelease.ts` provides a real authenticated client-only controller and delegates to the real dispute service. It validates the release-request identifier and dispute reason and maps authorization/idempotency failures to explicit HTTP responses. fileciteturn253file0L2-L6

**Implementation requirement:** the controlled implementation phase must add/verify assertions for ownership, state transition, idempotency and financial atomicity without weakening existing authorization.

**No status upgrade to fully behavior-verified is permitted until those assertions produce CI evidence.**

---

## G3-E — Release / Refund Authorization Boundary

**Classification:** `BASELINE ROUTE VERIFIED / BEHAVIOR EVIDENCE REQUIRED`

Release and refund controllers require an authenticated client and enforce the client role before entering the underlying services. They explicitly map idempotency and financial transaction errors instead of swallowing them. fileciteturn254file0L2-L6 fileciteturn255file0L2-L6

**Implementation requirement:** controlled tests must prove mutually exclusive financial outcomes under the relevant release/refund races and verify terminal idempotency replay.

---

## G3-F — Case-specific Audit Trail / Activity API

**Classification:** `DEFERRED FEATURE — NOT A BASELINE BLOCKER`

`admin_audit_logs` is accepted for administrative state-change auditing. A dedicated case-level Activity Log API is not part of this MVP baseline.

No mock endpoint, undocumented route or architectural bypass may be introduced to simulate it.

If case-specific activity retrieval becomes a release requirement, it must receive a separate approved contract before implementation.

---

## G3-G — Administrative Monitoring & Intervention

**Classification:** `BASELINE SURFACE VERIFIED / BEHAVIOR EVIDENCE REQUIRED`

The repository contains real protected administrative monitoring and intervention surfaces through `admin.ts` and related controllers. fileciteturn250file0L2-L6

**Implementation requirement:** tests must demonstrate that administrative intervention respects RBAC, target ownership/state constraints, and audit attribution.

---

## G3-H — Evidence, CI & Security Verification

**Classification:** `APPROVED CONTROL REQUIREMENT`

Every Gate #3 acceptance claim must map to:

`Gate ID → Requirement → Repository File(s) → Database Table(s) → API/Service → Authorization Boundary → Test → CI Run → Raw Evidence → Classification`

A green CI check alone is insufficient. The relevant assertion and resulting state transition must be traceable.

---

## Controlled Implementation Rules

The implementation authorization granted by this contract is bounded as follows:

- **Allowed:** code/tests required to satisfy the approved baseline on the isolated Gate #3 branch.
- **Allowed:** additional test fixtures that use the real production lifecycle and canonical identities.
- **Allowed:** CI/test instrumentation required to produce raw evidence.
- **Forbidden:** weakening or bypassing `requireAdmin`/authorization.
- **Forbidden:** mocks that substitute for missing production APIs.
- **Forbidden:** changes to Gate #2 financial guards unless a separate approved change is issued.
- **Forbidden:** migrations unless separately reviewed and explicitly authorized.
- **Forbidden:** changes to `main`.
- **Forbidden:** Production changes.

### Stop conditions

Implementation must stop immediately and return to architectural review if:

1. an existing API contract must be weakened to satisfy a test;
2. a financial invariant requires bypassing an authorization boundary;
3. a new schema/migration becomes necessary for the claimed baseline;
4. a test can pass only through a mock or undocumented route;
5. a concurrency test produces a non-deterministic financial outcome.

---

## Final MVP Baseline Decision

Gate #3 is now an **approved contract baseline**, not a declaration that every behavioral assertion has already passed.

The distinction is intentional:

- **Contract readiness:** `APPROVED 🟢`
- **Implementation:** `AUTHORIZED / CONTROLLED 🟢`
- **Behavioral evidence:** `PENDING EXECUTION 🟡`
- **Case-specific Audit API:** `DEFERRED ⚪`

This prevents the common governance error of converting architectural approval into an unsupported claim of runtime success.

---

## Current Governance State

- **Gate #2:** `PASSED & DOCUMENTED 🟢`
- **Gate #3 Contract:** `APPROVED BASELINE & READY FOR IMPLEMENTATION 🟢`
- **Gate #3 Implementation:** `AUTHORIZED — ISOLATED / CONTROLLED 🟢`
- **G3-D/G3-E/G3-G:** route/control provenance verified; behavioral evidence still required
- **G3-F:** deferred, not a baseline blocker
- **PR #121:** `DRAFT 🟡`
- **main:** `UNTOUCHED 🔒`
- **Production:** `UNTOUCHED 🔒`

## Next Execution Gate

Begin controlled implementation/testing on the isolated branch, starting with behavioral evidence for G3-D, G3-E and G3-G. Do not declare Gate #3 runtime-passed until the corresponding CI assertions and raw evidence are available.
