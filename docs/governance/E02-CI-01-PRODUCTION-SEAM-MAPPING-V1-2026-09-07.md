# E02-CI-01 — Production Seam Mapping V1

**Date:** 2026-09-07  
**Unit:** E02 / C17 — Financial Authority  
**Seam:** Milestone Allocation — `funded → in_progress`  
**Phase:** G2 — Smallest Controlled Implementation Unit  
**Status:** **REVIEW CANDIDATE — NO PRODUCTION IMPLEMENTATION AUTHORIZED**

## 1. Purpose

This document records the current production seam boundary for the first controlled E02 implementation unit. It is a mapping artifact only. It does not authorize production-code mutation, migration changes, production database access, credentials, bank data, RLS activation, or merge.

The governing principle is:

`Authorized Financial Command → Financial Authority Boundary → Milestone Allocation → Atomic Financial Effect → Idempotency → Commit`

The existing implementation is treated as a **legacy transactional financial seam**, not as an already-certified Financial Authority.

## 2. Authoritative Current Seam

Current service:

`artifacts/api-server/src/services/allocateMilestone.ts`

Current route:

`POST /representation-milestones/:milestoneId/allocate`

Current controller:

`artifacts/api-server/src/controllers/allocateMilestone.ts`

The route applies `requireAuth` and `requireRole("client")` before the controller. The controller derives the client identity from `req.authUser` and passes it to the service.

The service then opens its own database transaction, claims idempotency, locks the milestone/quote/escrow row set, verifies ownership and state, derives amount from the milestone and currency from the quote, updates escrow allocation, inserts a posted `stage_allocation` transaction, transitions the milestone to `in_progress`, persists the idempotency response, and commits atomically.

This exact behavior is evidenced by the current main-branch source. The service does not accept a client-supplied amount or currency. fileciteturn121file0

## 3. Entry Path

### HTTP boundary

`POST /representation-milestones/:milestoneId/allocate`

Middleware chain:

1. `requireAuth`
2. `requireRole("client")`
3. `allocateMilestoneController`

The route definition confirms the protected client-only entry path. fileciteturn124file0

### Controller boundary

The controller:

- requires `req.authUser.userId`
- requires role `client`
- validates `milestoneId`
- invokes `allocateMilestone(req, milestoneId, clientId)`
- maps domain errors to HTTP responses
- maps idempotency errors deterministically
- does not receive amount or currency from the request body.

The current controller evidence is explicit. fileciteturn123file0

## 4. Current Authority Flow

`HTTP Client`

→ `requireAuth`

→ `Trusted Application Actor (client)`

→ `allocateMilestoneController`

→ `allocateMilestone`

→ `db.transaction(tx)`

→ lock milestone + quote + escrow

→ verify quote.clientId == authenticated client

→ require milestone.status == `funded`

→ derive `amount = milestone.amount`

→ derive `currency = quote.currency`

→ conditional escrow allocation

→ insert `escrow_transactions(stage_allocation)`

→ transition milestone `funded → in_progress`

→ persist idempotency response

→ commit

The implementation therefore already has several desirable local controls, but the transaction is owned by the service through the global DB handle rather than through the approved Unified Execution Boundary.

## 5. Financial State Surfaces

The seam touches these current financial representations:

| Surface | Role in E02-CI-01 | Authority status |
|---|---|---|
| `representation_milestones` | source of milestone amount + lifecycle state | existing domain source; migration target |
| `representation_quotes` | source of client ownership + currency | existing domain source; migration target |
| `escrow_accounts` | allocated-funds compatibility representation | existing financial representation |
| `escrow_transactions` | posted `stage_allocation` financial event | existing financial representation, **not final double-entry ledger** |
| idempotency store | replay/deduplication control | existing integrity control |

The schema defines milestone status values including `funded` and `in_progress`, and defines `stage_allocation` as an escrow transaction type. fileciteturn129file0 fileciteturn127file1

The escrow account currently contains deposited, allocated, released, and refunded amounts. fileciteturn131file1

## 6. Upstream and Downstream Boundaries

### Upstream — out of E02-CI-01 mutation scope

`Payment/Funding → funded milestone`

The existing `fundMilestone.ts` also writes `escrowTransactionsTable`; therefore the funding path is a separate financial authority seam and must not be silently absorbed into CI-01. fileciteturn130file0

CI-01 consumes the already-established `funded` state. It does not redesign how funding becomes `funded`.

### Downstream — out of E02-CI-01 mutation scope

`in_progress → proof → release request → release → wallet → settlement → reconciliation`

The current codebase contains separate financial writers for refund and release. `refundMilestone.ts` writes escrow refund transactions, while `releaseMilestone.ts` writes release/commission transactions and wallet effects. fileciteturn130file1 fileciteturn130file3

These are later E02/E04/E05 seams and are not to be pulled into CI-01.

## 7. Bypass / Alternate-Writer Map

The mapping objective is not merely to find callers of `allocateMilestone`; it is to identify every path that can mutate the same financial truth.

### Confirmed direct writer for CI-01 effect

`allocateMilestone.ts`

Writes:

- `escrow_accounts.allocatedAmount`
- `escrow_transactions` with `type = stage_allocation`
- `representation_milestones.status = in_progress`
- idempotency response state.

### Adjacent writers requiring boundary preservation

- `fundMilestone.ts` — creates funding effects and can write escrow transactions. fileciteturn130file0
- `refundMilestone.ts` — writes refund effects. fileciteturn130file1
- `releaseMilestone.ts` — writes release, commission, escrow and lawyer-wallet effects. fileciteturn130file3

### Important negative finding

The current search did **not** establish a second production implementation of the exact `allocateMilestone(...)` service call. The known direct runtime caller is the allocation controller; existing security tests also invoke the service directly as a test seam. fileciteturn125file1 fileciteturn125file2

This is sufficient to define CI-01 as a narrow command seam, but it is **not** sufficient to claim that no other code can independently mutate the underlying financial tables. That broader writer inventory remains a G2 control item before G3.

## 8. Authority Gaps Identified

### G2-GAP-01 — No Unified Execution Boundary

The route/controller obtains a trusted actor, but `allocateMilestone` opens `db.transaction(...)` directly. This is not yet the approved UEB execution lifecycle.

### G2-GAP-02 — Financial Authority is implicit

The service currently acts as the authority-bearing seam, but there is no explicit E02 Financial Authority boundary object/command contract surrounding it.

### G2-GAP-03 — Escrow transaction is not final ledger

The existing `escrow_transactions` record is a controlled compatibility representation. It is not the final balanced double-entry financial ledger specified by E02.

### G2-GAP-04 — Same-table writer inventory is broader than CI-01

Funding, refund, and release paths independently write related financial representations. They remain separate seams and must not be allowed to bypass the eventual Financial Authority boundary once E02 migration expands.

### G2-GAP-05 — Full financial state machine remains broader than CI-01

CI-01 covers only the `funded → in_progress` transition. It does not certify `CREATED → PENDING → VERIFIED → POSTED → SETTLED → RECONCILED` for the whole financial domain.

## 9. Smallest Controlled Implementation Boundary

The proposed G3 candidate remains:

**E02-CI-01 — Financial Authority Command Boundary for Milestone Allocation**

Minimum production change should be limited to establishing the approved execution boundary around the existing allocation transaction while preserving current business behavior.

### Required invariants

1. Actor comes only from server-authenticated identity.
2. Client cannot supply authoritative amount.
3. Client cannot supply authoritative currency.
4. Milestone ownership is checked server-side.
5. Only `funded` milestones may allocate.
6. Escrow allocation is conditional and atomic.
7. Exactly one `stage_allocation` effect may result from one idempotency identity.
8. Failure produces no partial financial effect.
9. Actor A cannot allocate actor B's milestone.
10. Concurrent allocation cannot over-allocate shared escrow.
11. Transaction-local identity/context cannot leak across requests or pooled connections.
12. No downstream wallet/settlement/reconciliation behavior is introduced.
13. No migration file is modified unless an existing migration is executed unchanged in an isolated test database.

## 10. Negative Oracle Matrix for Controlled Implementation

| Oracle | Required result |
|---|---|
| Missing authenticated actor | DENY; no DB effect |
| Non-client actor | DENY; no DB effect |
| Client B allocates Client A milestone | DENY; A unchanged |
| Missing milestone | DENY; no effect |
| Non-`funded` milestone | DENY; no effect |
| Insufficient escrow | DENY; no effect |
| Forged amount | Ignored/rejected; DB amount remains authoritative |
| Forged currency | Ignored/rejected; DB currency remains authoritative |
| Same idempotency key replay | One financial effect only |
| Same key with mismatched request | DENY deterministic; no second effect |
| Injected failure after escrow update | Full rollback |
| Injected failure after transaction insert | Full rollback |
| Injected failure after milestone transition | Full rollback |
| Concurrent A/B allocation | No over-allocation / no cross-actor leakage |
| Connection reuse | No actor/context bleed |
| Post-transaction query | No persistent actor context |
| Direct bypass attempt | Must not become an alternate authoritative path |

## 11. Independent Oracle Requirements

HTTP status alone is never accepted as proof.

For every controlled proof, capture before/after state for:

- milestone status
- milestone amount
- quote ownership/currency
- escrow deposited/allocated/refunded/released totals
- escrow transaction count
- exact transaction reference
- idempotency effect count
- actor ownership
- cross-actor absence
- rollback state.

Success must prove the exact intended delta.

Denial and rollback must prove:

`S_after == S_before`

for every authoritative field affected by the seam.

## 12. G2 Decision

### Selected seam

`E02-CI-01 / milestone allocation / funded → in_progress`

### Selection status

**G2 = ACTIVE / MAPPED / REVIEW CANDIDATE**

### Not yet authorized

- production implementation
- main merge
- live DB integration
- provider integration
- wallet integration
- settlement/payout
- reconciliation
- final ledger implementation
- bank/merchant data
- live credentials
- RLS activation.

## 13. Evidence and Safety Register

| Control | Current state |
|---|---:|
| Production DB mutation | 0 |
| Production financial code mutation in this mapping step | 0 |
| Migration modification | 0 |
| Live credentials | 0 |
| Bank data | 0 |
| RLS activation | 0 |
| Merge | 0 |
| Guard modification | 0 |

The existing disposable proof for the chosen seam remains the G1 authority evidence: **Run `34063301957` — `DISPOSABLE-DB-PROOF-PASS`, 16 proofs, F01–F16 coverage.**

## 14. Review Gate

This mapping is raised for review as the G2 production seam artifact.

**Required decision before G3:**

`REVIEW → ACCEPT / REJECT CI-01 BOUNDARY → CONTROLLED IMPLEMENTATION AUTHORIZATION`

No production mutation is implied by acceptance of this document alone.

---

**Canonical classification:** `E02 / C17 / G2 / E02-CI-01 / REVIEW CANDIDATE`
