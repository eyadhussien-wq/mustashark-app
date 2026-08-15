# T01 — Consultation Lifecycle Governance

## Status

`GOVERNANCE BASELINE`

T01 is governed by the common Lifecycle Governance Standard and is the reference lifecycle for the consultation domain.

## Lifecycle Layers

```text
T01 — CONSULTATION
│
├── 01 State Machine
│   ├── DRAFT
│   ├── PAYMENT_PENDING
│   ├── PENDING_ACCEPTANCE
│   ├── SCHEDULED
│   ├── IN_PROGRESS
│   ├── COMPLETED
│   ├── CLOSED
│   ├── REJECTED
│   ├── CANCELLED
│   ├── EXPIRED
│   └── DISPUTED
│
├── 02 Database / Domain Model
├── 03 API / Service Transitions
├── 04 Authorization
├── 05 Financial Isolation Gate — conditional on financial effect
├── 06 Financial Audit Integrity — conditional on financial effect
├── 07 Audit Events
├── 08 Tests
└── 09 CI / Verification
```

## State Transition Baseline

| Current State | Event | Next State | Financial / Governance Requirement |
|---|---|---|---|
| `DRAFT` | `SUBMIT_CONSULTATION` | `PAYMENT_PENDING` | Validate request completeness and authorization |
| `PAYMENT_PENDING` | `PAYMENT_SUCCESS` | `PENDING_ACCEPTANCE` | Financial Isolation Gate + immutable financial event |
| `PAYMENT_PENDING` | `PAYMENT_FAILED` | `DRAFT` | No completed financial effect; retry safely |
| `PENDING_ACCEPTANCE` | `LAWYER_ACCEPT` | `SCHEDULED` | Authorization + schedule validation |
| `PENDING_ACCEPTANCE` | `LAWYER_REJECT` | `REJECTED` | Refund is a financial effect and requires both financial gates |
| `PENDING_ACCEPTANCE` | `TIMEOUT_EXPIRED` | `EXPIRED` | Refund, when applicable, requires both financial gates |
| `SCHEDULED` | `START_SESSION` | `IN_PROGRESS` | Authorization + session validation |
| `SCHEDULED` | `CLIENT_CANCEL` | `CANCELLED` | Any refund / fee requires both financial gates |
| `SCHEDULED` | `RAISE_DISPUTE` | `DISPUTED` | Freeze any affected financial release; route to T02 |
| `IN_PROGRESS` | `LAWYER_COMPLETE` | `COMPLETED` | Output validation + audit event |
| `IN_PROGRESS` | `RAISE_DISPUTE` | `DISPUTED` | Block affected financial release; route to T02 |
| `COMPLETED` | `CLIENT_APPROVE` | `CLOSED` | Release / settlement requires both financial gates |
| `COMPLETED` | `AUTO_CLOSE_TIMEOUT` | `CLOSED` | Any release / settlement requires both financial gates |
| `COMPLETED` | `CLIENT_RAISE_DISPUTE` | `DISPUTED` | Financial freeze where applicable; route to T02 |

## Architectural Rules

1. Consultation state and financial state are separate state domains.
2. A state transition alone never authorizes a financial mutation.
3. Every financial mutation must be server-authoritative.
4. Every financial mutation must be idempotent and atomic.
5. Financial effects must produce immutable audit events and remain reconcilable.
6. Authorization must verify identity, role, ownership, and resource scope before protected transitions.
7. `DISPUTED` transfers dispute resolution to `T02`; T01 does not silently resolve disputes.
8. Terminal consultation states cannot be changed through ordinary API transitions.
9. Retry and concurrent requests must not create duplicate financial effects.
10. A lifecycle is not complete until tests, typecheck, CI, security review, and final verification pass.

## Type-Safe Reference

```ts
export type ConsultationState =
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'PENDING_ACCEPTANCE'
  | 'SCHEDULED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CLOSED'
  | 'REJECTED'
  | 'CANCELLED'
  | 'EXPIRED'
  | 'DISPUTED';

export type ConsultationEvent =
  | { type: 'SUBMIT_CONSULTATION' }
  | { type: 'PAYMENT_SUCCESS'; transactionId: string }
  | { type: 'PAYMENT_FAILED'; reason: string }
  | { type: 'LAWYER_ACCEPT' }
  | { type: 'LAWYER_REJECT'; reason?: string }
  | { type: 'TIMEOUT_EXPIRED' }
  | { type: 'START_SESSION' }
  | { type: 'CLIENT_CANCEL'; reason?: string }
  | { type: 'LAWYER_COMPLETE'; summary: string }
  | { type: 'CLIENT_APPROVE' }
  | { type: 'AUTO_CLOSE_TIMEOUT' }
  | { type: 'RAISE_DISPUTE'; reason: string };

export const ALLOWED_TRANSITIONS: Record<ConsultationState, ConsultationState[]> = {
  DRAFT: ['PAYMENT_PENDING'],
  PAYMENT_PENDING: ['PENDING_ACCEPTANCE', 'DRAFT'],
  PENDING_ACCEPTANCE: ['SCHEDULED', 'REJECTED', 'EXPIRED'],
  SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'DISPUTED'],
  IN_PROGRESS: ['COMPLETED', 'DISPUTED'],
  COMPLETED: ['CLOSED', 'DISPUTED'],
  CLOSED: [],
  REJECTED: [],
  CANCELLED: [],
  EXPIRED: [],
  DISPUTED: [],
};
```

`DISPUTED` is intentionally terminal from T01's perspective. Resolution belongs to T02 and any resulting financial transition must be authorized and audited through the financial controls.

## Completion Gate

```text
T01
 ↓
State Machine Verified
 ↓
Database / Domain Verified
 ↓
API Transitions Verified
 ↓
Authorization Verified
 ↓
Financial Gates Verified (when applicable)
 ↓
Audit Events Verified
 ↓
Tests
 ↓
Typecheck
 ↓
CI
 ↓
Security Review
 ↓
Real Preview
 ↓
Final Verification
```
