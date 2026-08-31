# MUSTASHAREK — Gate #3 Design / Implementation Contract

**Status:** `ARCHITECTURAL INVENTORY / CONTRACT DRAFT — NOT APPROVED`

**Evidence baseline:** `06c704f4e046a41982a0c439fcb7765673ab0151`

**Branch:** `security/gate-2-financial-guards`

**Latest G3-F verification:** `2026-08-31 — Remote Git + live DB schema/state inspection`

**Scope rule:** This document is governance/design documentation only. No Gate #3 implementation, migration, merge, or production change is authorized by this document.

---

## Part I — Verified Current State (Remote Git Evidence)

### 1. Roadmap authority

`docs/roadmap/MASTER-ROADMAP.md` is the canonical architectural reference and explicitly requires repository validation before implementation. Its S02 sequence identifies:

- `S02.7` — Milestones & Escrow Release
- `S02.7.5` — Active Case Final State & Notification Synchronization — closed / PR #80 merged
- `S02.7.6` — Audit Trail / Activity Log — **TEMPORARILY BLOCKED** because there is no ready case-specific Backend Audit Trail API; mocks and architectural bypasses are prohibited
- `S02.7.7` — Investor Attachments Sync — already satisfied by existing document APIs/UI
- `S02.8` — Admin Monitoring & Intervention

The roadmap also defines T02 (Dispute & Resolution) as a separate lifecycle containing architecture/data audit, state machine, financial transaction safety, Admin Dispute API, Admin Resolution Controls, security/authorization, dashboard monitoring, tests/idempotency, and final CI/security verification.

### 2. API route surface

`artifacts/api-server/src/routes/index.ts` registers the current API route modules, including:

- `admin`
- `cases`
- `fundMilestone`
- `allocateMilestone`
- `createMilestoneProof`
- `createMilestoneReleaseRequest`
- `disputeMilestoneRelease`
- `releaseMilestone`
- `refundMilestone`

This establishes that the milestone/release/dispute/refund surface is implemented as real API modules rather than a test-only abstraction.

### 3. Administrative control and RBAC

`artifacts/api-server/src/routes/admin.ts` exposes real administrative endpoints protected by `requireAdmin`, including:

- `/admin/overview`
- `/admin/lawyers`
- `/admin/clients`
- `/admin/consultations`
- `/admin/offices`
- `/admin/lawyer-verifications/pending`
- `/admin/lawyer-verifications/:id/review`
- deletion-request review endpoints
- profile-change review endpoints
- bank-account review endpoints
- text-review moderation endpoints

`artifacts/api-server/src/middlewares/requireAdmin.ts` verifies the JWT role and then performs a live database lookup against `usersTable` to confirm the authenticated user is still an `admin`. Failure is fail-closed.

### 4. Lawyer verification / administrative approval

`artifacts/api-server/src/controllers/lawyerVerification.ts` contains the real approval lifecycle. The approval operation executes in a database transaction and:

1. loads the pending verification;
2. loads the corresponding lawyer;
3. atomically changes verification status and records `reviewedBy` / `reviewedAt`;
4. on approval, changes the lawyer `accountStatus` to `active`;
5. writes an `admin_audit_logs` record with before/after state.

This is relevant to Gate #3 because administrative intervention must be treated as a real security boundary, not a fixture-only shortcut.

### 5. Administrative audit-log persistence

`lib/db/src/schema/adminAuditLogs.ts` defines the real `admin_audit_logs` table with:

- `adminId`
- `action`
- `entityType`
- `entityId`
- `description`
- `beforeData`
- `afterData`
- `createdAt`

The schema has a primary key on `id`, a foreign key from `admin_id` to `users.id`, and required fields for administrator attribution, action, entity type, and creation time.

### 6. Dispute / release / refund API provenance

Current real routes include:

- `POST /representation-release-requests/:releaseRequestId/dispute` — authenticated client, role checked
- `GET /representation-milestones/:milestoneId/release-request` — authenticated client, role checked
- `POST /representation-release-requests/:releaseRequestId/release` — authenticated client, role checked
- `POST /representation-milestones/:milestoneId/refund` — authenticated client, role checked

These are real backend routes and must be evaluated as part of any Gate #3 financial-control boundary that includes dispute or release intervention.

---

## Part II — Gate #3 Contract Draft

The following matrix is **provisional**. Each item remains subject to evidence completion and architectural approval before implementation.

| ID | Control / Contract Area | Verified Repository Basis | Current Classification | Implementation Authorization |
|---|---|---|---|---|
| G3-A | Admin identity & RBAC | `requireAdmin.ts`, `admin.ts` | **VERIFIED FOUNDATION** | Not yet authorized |
| G3-B | Administrative lawyer approval | `lawyerVerification.ts` + verification route | **VERIFIED FOUNDATION** | Not yet authorized |
| G3-C | Administrative audit persistence | `adminAuditLogs.ts` + approval transaction | **ACCEPTED BASELINE FOR ADMIN AUDIT** | Not yet authorized |
| G3-D | Dispute controls | `disputeMilestoneRelease.ts` + T02 roadmap | **PARTIALLY VERIFIED** | Not yet authorized |
| G3-E | Release / refund authorization boundary | release/refund route modules | **PARTIALLY VERIFIED** | Not yet authorized |
| G3-F | Case-specific Audit Trail / Activity Log API | roadmap S02.7.6 + repository inventory + live DB verification | **DEFERRED FEATURE / NOT A G3 BLOCKER FOR ADMIN AUDIT BASELINE** | Case-specific API still requires a separate approved contract before implementation |
| G3-G | Admin monitoring & intervention | `adminData.ts` + admin routes; S02.8 | **PARTIALLY VERIFIED** | Not yet authorized |
| G3-H | Evidence, tests, CI, security verification | roadmap execution protocol + QA registry | **REQUIRES GATE DEFINITION** | Not yet authorized |

---

## G3-F — Final Classification Decision

### Evidence reviewed

**Remote Git evidence:**

- `lib/db/src/schema/adminAuditLogs.ts` defines a real persistent administrative audit table.
- The table records `admin_id`, `action`, `entity_type`, `entity_id`, `description`, `before_data`, `after_data`, and `created_at`.
- `admin_id` is constrained by a foreign key to `users.id`.
- `artifacts/api-server/src/controllers/lawyerVerification.ts` writes the audit row inside the same database transaction that updates verification state and, for approval, changes the lawyer account status to `active`.
- `artifacts/api-server/src/routes/admin.ts` exposes the real administrative review boundary and protects it with `requireAdmin`.

**Live database evidence:**

- `public.admin_audit_logs` exists.
- Actual columns match the repository schema: `id`, `admin_id`, `action`, `entity_type`, `entity_id`, `description`, `before_data`, `after_data`, `created_at`.
- The live database confirms the `admin_id → users.id` foreign key and primary key on `id`.
- The current table contains **0 rows** at inspection time. Therefore no historical production-like audit records are claimed as evidence by this inspection.

### Decision

`admin_audit_logs` is sufficient to establish an **Accepted Baseline for administrative audit persistence** for Gate #3 because it provides attributable, entity-scoped, action-scoped, timestamped state-change evidence and is written transactionally by the real administrative approval flow.

However, this table **does not prove the existence of a case-specific Audit Trail / Activity Log API**. The roadmap's `S02.7.6` statement remains technically valid: the repository does not currently establish a ready dedicated case-level audit API, and no mock or undocumented endpoint may be substituted.

Therefore:

- **G3-F is not a blocker for the minimum administrative audit baseline.**
- **S02.7.6 Case-specific Audit Trail API is classified as `DEFERRED FEATURE`.**
- If a future Gate explicitly requires case-level activity-history retrieval, a separate API contract must be designed and approved before implementation.
- No implementation is authorized merely by this classification.

---

## Gate #3 Evidence Standard

Every future Gate #3 acceptance claim must map to:

`Gate ID → Requirement → Repository File(s) → Database Table(s) → API/Service → Authorization Boundary → Test → CI Run → Raw Evidence → Classification`

A green CI result alone is not sufficient evidence for a security or financial control. The underlying assertion, route, state transition, and relevant database effect must be traceable.

---

## Explicit Non-Goals for This Document

- No production modification.
- No migration.
- No financial-core implementation.
- No modification of Gate #2 guards.
- No PR merge.
- No change to `main`.
- No mock implementation to bypass an absent API.
- No final declaration that Gate #3 is approved.

---

## Current Governance State

- **Gate #2:** `PASSED & DOCUMENTED` per prior approved evidence package; this document does not alter Gate #2.
- **Gate #3:** `UNDER ARCHITECTURAL INVENTORY / CONTRACT DRAFT`.
- **G3-F:** `DEFERRED FEATURE / ACCEPTED ADMIN-AUDIT BASELINE`.
- **PR #121:** remains `DRAFT`; merge remains prohibited.
- **Main / Production:** untouched by this document.

## Next Required Step

Complete the remaining Remote-Git inventory for G3-A, G3-B, G3-D, G3-E, G3-G and G3-H, then submit the complete Part II contract for explicit architectural approval before any Gate #3 implementation begins.
