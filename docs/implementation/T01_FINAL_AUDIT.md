# T01 — Consultation Final Audit

## Governance standard

T01 is evaluated across:

- State Machine Registry
- Database
- API transitions
- Authorization
- Financial Gate
- Financial Audit Integrity
- Audit Events
- Tests
- CI

Financial Gate and Financial Audit Integrity are mandatory only where a transition has a Financial Effect.

## Current implementation truth

### State Machine

The canonical T01 state machine is implemented in:

`artifacts/api-server/src/lib/t01ConsultationStateMachine.ts`

The database keeps consultation status, payment status, and escrow status separate. The canonical state is derived from those authoritative fields rather than duplicating all states in `booking_status`.

### Database

Existing authoritative data includes:

- `bookings.status`
- `bookings.paymentStatus`
- `bookings.escrowStatus`
- `bookings.lawyerJoinedAt`
- `bookings.clientJoinedAt`
- `bookings.actualStartTime`
- `bookings.actualEndTime`
- `payment_proofs`
- `platform_dues`
- `consultation_events`
- `admin_audit_logs`

No production database migration is introduced by this T01 pass.

### API transitions

The active booking routes are audited around the safe controllers. The acceptance path now requires:

`PENDING_ACCEPTANCE → SCHEDULED`

and requires `paymentStatus=paid` plus `escrowStatus=held` before acceptance.

Session join records:

`SCHEDULED → IN_PROGRESS`

Completion records:

`IN_PROGRESS → COMPLETED`

Dispute and cancellation paths are restricted to the states allowed by the canonical registry.

### Authorization

Existing route-level authentication and role middleware remain the first boundary. Ownership checks remain in the controllers for booking-specific actions.

### Financial Gate

Full payment confirmation now atomically moves the booking to:

- `paymentStatus=paid`
- `escrowStatus=held`

before the lawyer can accept the consultation.

The lawyer-no-show refund path requires the same paid/held financial precondition and performs the refund state update atomically.

### Financial Audit Integrity

Financial transitions are performed inside database transactions and are accompanied by consultation events. Duplicate-sensitive updates continue to use conditional updates and transaction boundaries.

### Audit Events

The following T01 events are now explicitly recorded:

- `CONSULTATION_CREATED`
- `PAYMENT_PROOF_SUBMITTED`
- `PAYMENT_PROOF_CONFIRMED`
- `PAYMENT_SUCCESS_ESCROW_HELD`
- `PAYMENT_PROOF_REJECTED`
- `LAWYER_ACCEPTED`
- `SESSION_STARTED`
- `LAWYER_COMPLETED`
- `LAWYER_NO_SHOW_REFUND`
- `DISPUTE_RAISED`
- `CONSULTATION_CANCELLED`

## Remaining T01 boundary

`CLOSED` is intentionally derived only when `COMPLETED` is combined with `escrowStatus=released`. The current repository does not yet contain the final payout/release engine required to perform that financial release. That work belongs to the financial/payout scope already defined under `T01-05-F4` / Phase 2.7 and must not be simulated as a completed production financial effect.

Therefore T01's consultation transition/security work can be verified independently, while final financial closure remains gated on the real payout/release implementation.

## Verification contract

`scripts/t01-consultation-state-machine-test.ts` covers:

- canonical state derivation
- allowed transitions
- illegal terminal transitions
- financial-gate classification

Final merge criteria remain:

`Diff → Security Review → Typecheck → Tests → CI → PR → Squash Merge → Verify main`
