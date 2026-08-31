# MUSTASHAREK — Gate #3 Design / Implementation Contract

**Status:** `ARCHITECTURAL INVENTORY / CONTRACT DRAFT — NOT APPROVED`

**Evidence baseline:** `06c704f4e046a41982a0c439fcb7765673ab0151`

**Branch:** `security/gate-2-financial-guards`

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

The schema is therefore real persistence infrastructure. However, this does **not** by itself prove the existence of a case-specific Audit Trail / Activity Log API required by S02.7.6.

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
| G3-C | Administrative audit persistence | `adminAuditLogs.ts` + approval transaction | **VERIFIED FOUNDATION / API GAP POSSIBLE** | Not yet authorized |
| G3-D | Dispute controls | `disputeMilestoneRelease.ts` + T02 roadmap | **PARTIALLY VERIFIED** | Not yet authorized |
| G3-E | Release / refund authorization boundary | release/refund route modules | **PARTIALLY VERIFIED** | Not yet authorized |
| G3-F | Case-specific Audit Trail / Activity Log API | roadmap S02.7.6 says no ready backend API | **BLOCKED / REQUIRES INVENTORY** | Prohibited until resolved |
| G3-G | Admin monitoring & intervention | `adminData.ts` + admin routes; S02.8 | **PARTIALLY VERIFIED** | Not yet authorized |
| G3-H | Evidence, tests, CI, security verification | roadmap execution protocol + QA registry | **REQUIRES GATE DEFINITION** | Not yet authorized |

---

## Audit Trail Decision Gate

`S02.7.6` is **not automatically promoted to a Gate #3 blocker solely because the roadmap marks it temporarily blocked**.

Before any implementation decision, the following must be established from Remote Git evidence:

1. whether a case-specific Audit Trail backend API exists elsewhere under another name;
2. whether existing `admin_audit_logs` persistence is intended to satisfy the required control or only administrative review history;
3. whether Gate #3 requires case-level activity history as a security invariant;
4. whether the missing API is a true blocker or a deferred feature outside the Gate #3 acceptance boundary.

No mock endpoint or alternate undocumented path may be used to close this decision.

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
- **PR #121:** remains `DRAFT`; merge remains prohibited.
- **Main / Production:** untouched by this document.

## Next Required Step

Complete the remaining Remote-Git inventory for each provisional G3 control, resolve the S02.7.6 Audit Trail classification, then submit Part II for explicit architectural approval before any Gate #3 implementation begins.
