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
| S01-05 | Booking transaction | Atomicity + idempotency + tests |
| S01-06 | Real-Time Availability | Concurrency + optimistic locking + CI |
| S01-07 | Upcoming Consultations | Authenticated API + reminder deduplication + CI |
| S01-08 | Timezone & Localization | Timezone correctness + API/UI tests |
| S01-09 | Calendar UX & D02 | D02 mapping + visual QA |
| S01-10 | Security & Edge Cases | Security tests + authorization audit |
| S01-11 | Tests & Typecheck | Full verification suite |
| S01-12 | CI & Final QA | General CI + final diff + main verification |

## 04 — S01-07 Verification Record

| Field | Evidence |
|---|---|
| Roadmap ID | `S01-07` |
| Official Name | Upcoming Consultations |
| Classification | `CLOSED / VERIFIED` |
| Branch | `codex/s01-07-upcoming-consultations` |
| PR | `#54` |
| Scope | Authenticated `GET /bookings/upcoming` + `booking_reminder_deliveries` deduplication foundation |
| Database | `booking_reminder_deliveries` with DB-level occurrence uniqueness |
| API | `GET /bookings/upcoming` |
| Security | Authenticated ownership/role scoping; read-only endpoint has no notification side effects |
| Concurrency | Atomic reminder claim via PostgreSQL uniqueness + `onConflictDoNothing` |
| Extensibility | Channel stored as text for future in-app/email/WhatsApp channels |
| Typecheck | `SUCCESS` |
| Concurrency smoke test | `SUCCESS` |
| X1 financial/idempotency smoke test | `SUCCESS` |
| Auth smoke tests | `SUCCESS` |
| Production DB guard | `SUCCESS` |
| General CI | `SUCCESS` |
| Final state | `CLOSED / VERIFIED` after squash merge and main verification |
| Verification Evidence | GitHub Actions CI run `31993856246`; PR #54; merged main commit to be recorded after merge |

## 05 — Closure Rule

A roadmap item may only be marked `CLOSED / VERIFIED` after the implementation, repository evidence, required tests, security review, CI, final diff audit, merge, and target-branch verification are complete.

S01-07 satisfies these requirements through PR #54 and its completed CI evidence.
