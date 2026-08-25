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

| Roadmap ID | Scope | Primary placement | Verification expectation |
|---|---|---|---|
| N1.01–N1.02 | Lawyer identity / Digital Law Office / Command Center | Y/1, Y/7 | auth, ownership, UX, typecheck/CI |
| N1.03–N1.06 | Clients / Intake / Consultation / Marketplace | Y/2, Y/7 + X/W | ownership, scope, service/API/E2E |
| N1.07–N1.15 | Workbench / Memorandum / Documents / Matters / Court / Relationship | Y/2–Y/5 + X/W; T01/S02 | confidentiality, state, documents, E2E |
| N1.16–N1.18 | Financial Center / BI / Reputation | Y/8 + W/8; C3 | financial authorization, reconciliation, audit |
| N1.19–N1.20 | Tasks / Notifications | Y/3 + W; T01/S01/S02/T02 | state, retry, notification tests |
| N1.21–N1.24 | Search / AI future / Templates / Client Conversion | Y/2/Y/3 + X/W | scoped access, AI guardrails, E2E |
| N1.25–N1.27 | Marketplace Profile / Availability / Archive | Y/1/Y/2/Y/7; T01/S01/S02 | public/private separation, retention |
| N1.28–N1.29 | Audit/Security / Confidentiality/Privacy | Y/5/Y/7 + W/5 | security, IDOR, privacy, audit |
| N1.30–N1.32 | Mobile / Desktop / Court & Meeting modes | Y/1/Y/4; S01/S02 | visual, RTL, accessibility, security |
| N1.33–N1.35 | External integrations / Investment future / Ecosystem | W + Y/2/Y/6 | regulatory/API source verification |
| N1.36–N1.40 | Office settings / Law Firm / Intelligence / Continuity / Core | Y/8 + W/8 | RBAC, revenue, performance, E2E |

## 04 — N1 Build Phase Mapping

- **Phase 2.5:** N1.01–N1.06, N1.12, N1.20, N1.25, N1.26, N1.30
- **Phase 2.6:** N1.07–N1.15, N1.19, N1.27, N1.31, N1.32, N1.39
- **Phase 2.7:** N1.16 plus required N1.18/N1.20 financial visibility; governed by C3
- **Phase 2.8:** N1.28–N1.29 and cross-cutting security/privacy
- **Phase 3:** N1.17, N1.18, N1.23, N1.24, N1.33, N1.36, N1.38
- **Phase 3+:** N1.15, N1.21–N1.22, N1.34–N1.35, N1.37, advanced N1.40

## 05 — S01 Traceability Baseline

| Roadmap ID | Scope | Verification expectation |
|---|---|---|
| S01-03 | Lawyer interactive calendar | Typecheck/tests/CI |
| S01-04 | Client booking calendar | API contract + auth + tests |
| S01-05 | Booking transaction | Atomicity + idempotency + double-booking protection |
| S01-06 | Real-time availability / transition hardening | Concurrency + optimistic conflict + replay + CI |
| S01-07 | Upcoming consultations | API/UI integration + notifications |
| S01-08 | Timezone/localization | deterministic time tests |
| S01-09 | Calendar UX/D02 | visual QA |
| S01-10 | Security/edge cases | security + race/retry tests |
| S01-11 | Tests/typecheck | green typecheck + test evidence |
| S01-12 | CI/final QA | green CI + final audit |

## 06 — Financial Governance

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

## 07 — Roadmap ↔ Repository Validation

Validation is bidirectional:

`Roadmap → Code` and `Code → Roadmap`

Detect and classify:

- Orphan code
- Unmapped feature
- Duplicate feature
- Roadmap item without repository evidence
- Repository functionality without roadmap classification

## 08 — QA / Verification Registry

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

## 09 — Historical Source Reconciliation

| Historical source | Role | Canonical disposition |
|---|---|---|
| PR #32 | Master Roadmap baseline | consolidated into this canonical roadmap set |
| PR #33 | Roadmap/financial registry baseline | consolidated |
| PR #34 | Alternate roadmap registry | overlapping source; not a competing authority |
| PR #35 | System Governance Map / financial controls | preserved in Master Audit Map |
| PR #36 | Governance + D02 structural base | preserved |
| PR #47 | Governance consolidation | source lineage for this repository publication |

Future governance changes update this canonical set rather than creating parallel competing maps.

## 10 — Current Evidence Record: S01-06

- **Roadmap ID:** S01-06
- **Feature:** Transition Hardening
- **Branch:** `codex/s01-06-transition-hardening`
- **PR:** #52
- **Final commit:** `e01604115c161e0538d89cbc689df4763b5e9bba`
- **Merge commit:** `5e92f3dfe10f8081b6542b1e460cde20eb12db63`
- **Verification status:** `VERIFIED / CLOSED`

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
- **Implementation evidence:** none implied by this architecture publication

## 12 — Completion Pipeline

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

## Final Governance Rules

> No implementation before architectural classification.
>
> No financial effect before FINANCIAL ISOLATION GATE.
>
> No completed financial effect without FINANCIAL AUDIT INTEGRITY.
>
> No `CLOSED / VERIFIED` roadmap item without repository evidence, tests, security review, CI, final diff audit, and verification.
