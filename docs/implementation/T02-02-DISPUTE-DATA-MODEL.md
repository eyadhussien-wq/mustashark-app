# T02-02 — Dispute Data Model

## Decision

Introduce one dispute record as a governance/workflow layer over the existing representation financial chain. No new payment, escrow, wallet, refund, or payout authority is introduced.

## Canonical ownership chain

`disputes.releaseRequestId → milestoneReleaseRequests → representationMilestones → representationQuotes → escrowAccounts`

The dispute also stores the authoritative client/lawyer identities and immutable-at-creation reason, while resolution metadata records the decision actor and outcome.

## Financial boundary

Creating a dispute moves existing release-request/proof/milestone state into `disputed`; it does not move money. Any later release/refund/payout remains owned by the existing financial services and must enforce the disputed state.

## Concurrency / idempotency

`releaseRequestId` is unique so one release request can have at most one canonical dispute. Creation must use the existing transactional idempotency facility and a transaction/row lock around the release request.

## T02 implementation sequence

- T02-01: intake/recon — completed by repository inspection.
- T02-02: persistence model — this model.
- T02-03: secure dispute creation API — reuse existing release-request dispute path and persist the canonical dispute record.
- T02-04: dispute read/authorization — participant/admin scoped reads.
- T02-05: review state transitions — explicit state machine; no direct client financial mutation.
- T02-06: resolution decision — authorization + transaction + audit event.
- T02-07: financial resolution adapter — delegate to existing C3/milestone release/refund primitives.
- T02-08: notifications/evidence — reuse existing audit/event infrastructure.
- T02-09: race/idempotency tests.
- T02-10: final security/CI/diff audit.

## Safety gate

No financial effect is added by T02-02. The unique constraint and foreign keys are structural safeguards only. Production migration must be reviewed against live-data integrity before application.
