# MUSTASHAREK — ROADMAP REGISTRY

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

## 03 — S01 Traceability Baseline

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

## 04 — Financial Governance

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

## 05 — Roadmap ↔ Repository Validation

Validation is bidirectional:

`Roadmap → Code` and `Code → Roadmap`

Detect and classify:

- Orphan code
- Unmapped feature
- Duplicate feature
- Roadmap item without repository evidence
- Repository functionality without roadmap classification

## 06 — QA / Verification Registry

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
- Final Diff Audit
- Verify Main

## 07 — Historical Source Reconciliation

| Historical source | Role | Canonical disposition |
|---|---|---|
| PR #32 | Master Roadmap baseline | consolidated into this canonical roadmap set |
| PR #33 | Roadmap/financial registry baseline | consolidated |
| PR #34 | Alternate roadmap registry | overlapping source; not a competing authority |
| PR #35 | System Governance Map / financial controls | preserved in Master Audit Map |
| PR #36 | Governance + D02 structural base | preserved |
| PR #47 | Governance consolidation | source lineage for this repository publication |

Future governance changes update this canonical set rather than creating parallel competing maps.

## 08 — Current Evidence Record: S01-06

- **Roadmap ID:** S01-06
- **Feature:** Transition Hardening
- **Branch:** `codex/s01-06-transition-hardening`
- **PR:** #52
- **Final commit:** `e01604115c161e0538d89cbc689df4763b5e9bba`
- **Merge commit:** `5e92f3dfe10f8081b6542b1e460cde20eb12db63`
- **Scope:** transactional idempotency for `complete`/`dispute`, optimistic concurrency, audit-event atomicity, same-key replay and cross-key conflict coverage
- **Validation evidence:** `git diff --check` passed; API-server typecheck passed; DB project rebuild passed; dedicated S01-06 verification was reported green before merge
- **Final Diff Audit:** completed before merge
- **Merge:** squash-merged into `main`
- **Verification status:** `VERIFIED / CLOSED`

## 09 — Completion Pipeline

```text
Architectural Classification
→ Master Audit Placement
→ Domain + Data + State + Security Impact
→ Functional Lifecycle Placement
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
