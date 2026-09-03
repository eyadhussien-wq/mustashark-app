# MUSTASHARK — ROADMAP REGISTRY

**Canonical traceability layer for roadmap ↔ repository validation.**

## 00 — Governance

Classification vocabulary:

- KEEP
- RENAME / ALIGN
- ADD TO MAP
- DUPLICATE
- CONSOLIDATE
- NEEDS DECISION
- DEFERRED
- CLOSED / VERIFIED

**Rule:** roadmap presence is not implementation evidence. `CLOSED / VERIFIED` requires repository evidence, tests, security review, CI, final diff audit, and verification on the target branch.

## 01 — Required Traceability Record

Every task/PR must be traceable as:

```text
Roadmap ID
→ Official Name
→ Legacy Name (if any)
→ Classification
→ X/Y/Z/W Placement
→ Lifecycle Placement
→ D02-01…D02-10 Design Placement
→ Repository Files
→ Database Tables
→ API / Service
→ UI Components
→ Branch
→ PR
→ Tests
→ Security Review
→ CI Status
→ Current State
→ Verification Evidence
```

## 02 — Canonical Architecture IDs

### Audit
X/1–X/7 · Y/1–Y/8 · Z/1–Z/7 · W/1–W/9

### Consultation
T01-01 through T01-09+ and T01 FINAL GATE

### Scheduling
S01-01 through S01-12

### Representation
S02.1 through S02.8

### Dispute
T02-01 through T02-10 and VERIFY MAIN

### Design
D02-01 through D02-10

### Lawyer Product Architecture
**N1.01 through N1.40 — Mustashark Lawyer Digital Office**

N1 is a separate product namespace. It does not consume or rename C-stage financial/legal foundation identifiers.

## 03 — N1 Traceability Baseline

| Roadmap ID | Scope | Primary placement | D02 | Verification expectation |
|---|---|---|---|---|
| N1.01–N1.02 | Lawyer identity / Digital Law Office / Command Center | Y/1, Y/7 | D02-01/02/03/05/06/08/09 | auth, ownership, UX, typecheck/CI |
| N1.03–N1.06 | Clients / Intake / Consultation / Marketplace | Y/2, Y/7 + X/W | D02-01/03/04/05/06/08/09 | ownership, scope, service/API/E2E |
| N1.07–N1.15 | Workbench / Memorandum / Documents / Matters / Court / Relationship | Y/2–Y/5 + X/W; T01/S02 | D02-03/04/05/06/07/08/09 | confidentiality, state, documents, E2E |
| N1.16–N1.18 | Financial Center / BI / Reputation | Y/8 + W/8; C3 | D02-04/05/06/08/09 | financial authorization, reconciliation, audit |
| N1.19–N1.20 | Tasks / Notifications | Y/3 + W; T01/S01/S02/T02 | D02-04/05/06/08/09 | state, retry, notification tests |
| N1.21–N1.24 | Search / AI future / Templates / Client Conversion | Y/2/Y/3 + X/W | D02-03/04/05/06/08/09 | scoped access, AI guardrails, E2E |
| N1.25–N1.27 | Marketplace Profile / Availability / Archive | Y/1/Y/2/Y/7; T01/S01/S02 | D02-01/02/03/05/06/07/08/09 | public/private separation, retention |
| N1.28–N1.29 | Audit/Security / Confidentiality/Privacy | Y/5/Y/7 + W/5 | D02-04/05/06/08/09 | security, IDOR, privacy, audit |
| N1.30–N1.32 | Mobile / Desktop / Court & Meeting modes | Y/1/Y/4; S01/S02 | D02-01/03/05/07/08/09/10 | visual, RTL, accessibility, security |
| N1.33–N1.35 | External integrations / Investment future / Ecosystem | W + Y/2/Y/6 | D02-01/03/05/06/08/09 | regulatory/API source verification |
| N1.36–N1.40 | Office settings / Law Firm / Intelligence / Continuity / Core | Y/8 + W/8 | D02-01/03/05/06/08/09 | RBAC, revenue, performance, E2E |

## 04 — Client D02 Traceability Baseline

Every client-facing build item is now explicitly D02-bound. This includes the client login/registration journey, account surfaces, discovery, consultation, scheduling, payment presentation, documents, communication, archive and financial-state presentation.

| Client surface | Audit/Lifecycle | D02 foundation |
|---|---|---|
| Client Login / Sign-in | X/7 | D02-01/02/03/04/05/06/08/09 |
| Registration / Onboarding | X/7 | D02-01/02/03/04/05/06/08/09 |
| Home / Client Command Surface | X/1/X/2 | D02-01/02/03/05/06/08/09 |
| Profile / Account | X/7 | D02-01/03/05/06/08/09 |
| Lawyer Discovery / Profile | X/2 + T01 | D02-01/02/03/05/06/08/09 |
| Consultation Request | X/2/X/3 + T01-01 | D02-03/04/05/08/09 |
| Proposal Review / Acceptance | X/2/X/3 + T01-02/03 | D02-04/05/06/08/09 |
| Scheduling / Booking | S01 | D02-01/03/04/05/08/09 |
| Payment / Payment Proof | T01-05 + C3 | D02-04/05/08/09 |
| Consultation Workspace | T01 | D02-01/03/05/06/08/09 |
| Documents / Upload / Preview | T01-04/06 | D02-04/05/07/08/09 |
| Messages / Communication | X/2/X/3 + T01 | D02-03/04/05/08/09 |
| History / Archive | X/2 | D02-01/03/05/07/08/09 |
| Cancel / Refund / Transfer presentation | C-stage + T01/S01 | D02-04/05/08/09 + C3 semantics |

## 05 — Build Phase D02 Gate

- Phase 2.5: all client/lawyer consultation, profile, availability and command surfaces require D02 mapping before closure.
- Phase 2.6: document, matter, handover, courtroom and communication surfaces require D02-07 and D02-08 where applicable.
- Phase 2.7: financial/payment UI requires D02 mapping plus C3 financial semantics; D02 does not define financial authority.
- Phase 2.8: security/role-boundary UI requires semantic security messaging and D02-09/10 evidence.
- Phase 3+: every new user-facing feature must declare D02 mapping before implementation acceptance.

## 06 — S01 Traceability Baseline

| Roadmap ID | Scope | D02 | Verification expectation |
|---|---|---|---|
| S01-03 | Lawyer interactive calendar | D02-01/03/04/05/08/09 | Typecheck/tests/CI |
| S01-04 | Client booking calendar | D02-01/03/04/05/08/09 | API contract + auth + tests |
| S01-05 | Booking transaction | D02-04/05/08/09 | Atomicity + idempotency + double-booking protection |
| S01-06 | Real-time availability / transition hardening | D02-04/05/08/09 | Concurrency + optimistic conflict + replay + CI |
| S01-07 | Upcoming consultations | D02-03/05/08/09 | API/UI integration + notifications |
| S01-08 | Timezone/localization | D02-03/08/09 | deterministic time tests |
| S01-09 | Calendar UX/D02 | D02-01…D02-10 | visual QA |
| S01-10 | Security/edge cases | D02-04/05/09/10 | security + race/retry tests |
| S01-11 | Tests/typecheck | D02-09/10 | green typecheck + test evidence |
| S01-12 | CI/final QA | D02-09/10 | green CI + final audit |

## 07 — Financial Governance

### FINANCIAL ISOLATION GATE

Required controls where a transition can create or alter financial state:

- Atomic transaction
- Idempotency
- Concurrency/race protection
- Locking where required
- State validation
- Duplicate-effect prevention
- Retry safety
- Failure recovery
- Financial state lock

### FINANCIAL AUDIT INTEGRITY

Required evidence includes:

- immutable event
- actor
- timestamp
- before/after state
- transaction reference
- idempotency reference
- event integrity
- reconciliation
- duplicate detection
- consistent audit trail

N1.16 and any N1 operation that alters financial entitlement must map to these gates and to C3.

## 08 — Roadmap ↔ Repository Validation

Validation is bidirectional:

`Roadmap → Code` and `Code → Roadmap`

Detect and classify:

- Orphan code
- Unmapped feature
- Duplicate feature
- Roadmap item without repository evidence
- Repository functionality without roadmap classification
- **User-facing item without D02 mapping**

## 09 — QA / Verification Registry

Track:

- Unit
- Integration
- API
- Security
- Financial
- State transition
- Race condition
- Idempotency
- Permission
- E2E
- Regression
- Typecheck
- CI
- Real Preview
- Visual QA
- Accessibility/RTL/i18n
- Final Diff Audit
- Verify Main

## 10 — Historical Source Reconciliation

| Historical source | Role | Canonical disposition |
|---|---|---|
| PR #32 | Master Roadmap baseline | consolidated into this canonical roadmap set |
| PR #33 | Roadmap/financial registry baseline | consolidated |
| PR #34 | Alternate roadmap registry | overlapping source; not a competing authority |
| PR #35 | System Governance Map / financial controls | preserved in Master Audit Map |
| PR #36 | Governance + D02 structural base | preserved |
| PR #47 | Governance consolidation | source lineage for this repository publication |

Future governance changes update this canonical set rather than creating parallel competing maps.

## 11 — N1 Current Architecture Record

- **Roadmap ID family:** `N1.01–N1.40`
- **Official name:** `Mustashark Lawyer Digital Office`
- **Classification:** `ADD TO MAP`
- **Primary audit home:** `Y/1–Y/8`
- **Cross-system overlays:** `X/W/Z` where applicable
- **Lifecycle overlays:** `T01/S01/S02/T02`
- **Design overlay:** `D02-01–D02-10`
- **Financial dependency:** `C3` for N1.16 and related financial states
- **Implementation status:** `OPEN / PRODUCT ARCHITECTURE`

## 12 — D02 Crosswalk Authority

Canonical bridge: `docs/design/D02-ROADMAP-CROSSWALK.md`.

Every user-facing roadmap item must declare:

`Roadmap ID → X/Y/Z/W → Lifecycle → N1 if applicable → D02-01…D02-10 → UI states → RTL/i18n/device → Visual QA → Verify Main`

D02 is therefore a **build-time foundation**, not a final cosmetic pass.

## 13 — Completion Pipeline

```text
Architectural Classification
→ Master Audit Placement
→ Domain + Data + State + Security Impact
→ Functional Lifecycle Placement
→ N1 Product Placement
→ D02 Placement
→ ROADMAP-REGISTRY UPDATE
→ Implementation
→ Typecheck
→ Tests
→ Security Review
→ CI
→ Final Diff Audit
→ PR Review
→ Merge
→ Verify Main
→ CLOSED / VERIFIED
```

## 14 — Lawyer OS Construction Phase Control

The canonical construction sequence is now tracked separately from the historical product roadmap so that construction work cannot silently reopen or rewrite previously completed governance work.

| Phase | Status | Scope |
|---|---|---|
| P0 Governance Baseline | `CLOSED / BASELINED` | LegalTech discovery, evidence hierarchy, liability/boundary analysis, operating-model hypotheses |
| P1 Repository Audit | `COMPLETED / EVIDENCE RECORDED` | Classify current repository into Neutral Core / Commercial / Regulated and identify legacy remnants |
| P1.5 CI Boundary Triage | `ACTIVE` | Resolve ownership of the failing legacy S01-03 Join concurrency gate; no blind rerun |
| P2 Boundary Enforcement | `NEXT` | Prevent regulated/legacy dependencies from entering Neutral Core; lock sensitive flags |
| P3 Lawyer OS v1 Scope Lock | `PLANNED` | Freeze approved Lawyer OS operational scope |
| P4 Neutral Core Implementation | `PLANNED` | Build Lawyer OS v1 operational core |
| P5 Commercial SaaS Design | `PLANNED / ISOLATED` | Fixed lawyer subscription model; no fee sharing or client-fund custody |
| P6 Client Portal | `PLANNED` | Secure lawyer↔client communication and document exchange |
| P7 Preview / Visual QA | `BLOCKED UNTIL REQUIRED CI GATES PASS` | Non-production visual inspection only |
| P8 Compliance Lock-in | `PENDING` | Translate specialist decisions into technical/contractual constraints |
| P9 Commercial Readiness | `BLOCKED` | Subscription/invoicing activation after applicable validation |
| P10 Regulated Expansion | `BLOCKED` | Marketplace, referral economics, client-fund collection, settlement, commission, escrow/wallet |

The detailed control record is `docs/governance/LAWYER-OS-CONSTRUCTION-PHASE-MATRIX-2026-09.md`.

## Final Governance Rules

> No implementation before architectural classification.
>
> No user-facing implementation closure without D02 mapping.
>
> No financial effect before FINANCIAL ISOLATION GATE.
>
> No completed financial effect without FINANCIAL AUDIT INTEGRITY.
>
> No `CLOSED / VERIFIED` roadmap item without repository evidence, tests, security review, CI, final diff audit, and verification.
>
> Lawyer OS construction must follow the separate P0→P10 phase control record and may not reopen completed governance work without an explicit new decision record.
