# E02-CI-01 — Controlled Implementation Plan V1

**Date:** 2026-09-07  
**Unit:** E02 / C17 — Financial Authority  
**Seam:** Milestone Allocation — `funded → in_progress`  
**Phase:** G3 — Controlled Implementation Preparation  
**Status:** **PLAN ONLY — NO PRODUCTION IMPLEMENTATION AUTHORIZED**

## 1. Gate Position

G0 = PASS  
G1 = PASS — disposable proof Run `34063301957`  
G2 = MAPPED / REVIEW CANDIDATE — Production Seam Mapping V1  
G3 = PREPARATION ONLY

This document defines the implementation contract and proof sequence for G3. It does not authorize merge, production deployment, live database access, migration modification, provider credentials, bank data, RLS activation, or expansion into adjacent financial seams.

## 2. Controlled Implementation Objective

The smallest implementation objective is:

`Authorized Client Actor → UEB Admission → Transaction-local Actor Context → Existing Milestone Allocation Logic → Atomic Financial Effect → Commit/Rollback`

The implementation must preserve current business behavior while moving the allocation transaction under the approved Unified Execution Boundary and making the boundary explicit enough to prevent alternate authority paths.

## 3. Authorized Mutation Boundary

### In scope

- `artifacts/api-server/src/services/allocateMilestone.ts`
- its direct production caller/controller only when required to bind the approved actor contract
- dedicated controlled tests/oracles
- CI workflow required to execute those tests in disposable PostgreSQL.

### Out of scope

- `fundMilestone.ts`
- `refundMilestone.ts`
- `releaseMilestone.ts`
- MyFatoorah/provider integration
- wallet/settlement/payout/reconciliation
- final double-entry ledger
- financial period closing
- financial configuration authority
- production/live database
- migration-file modification
- live credentials or bank/merchant data
- RLS activation.

## 4. Production Change Contract

The implementation must satisfy all of the following:

1. The trusted actor originates only from `requireAuth` / `req.authUser`.
2. The allocation command must not accept authoritative amount or currency from the client.
3. Amount remains derived from the locked milestone row.
4. Currency remains derived from the locked quote row.
5. Ownership remains verified against the authenticated client.
6. `funded` is the only admissible source state for CI-01.
7. The UEB owns transaction creation and actor-context establishment.
8. No global/session actor state is introduced.
9. Nested execution inherits the outer actor and cannot override it.
10. Financial writes remain atomic.
11. Idempotency remains atomic with the financial transition.
12. Any failure after a financial write rolls the complete unit back.
13. No second production path is introduced that can independently create the same `stage_allocation` truth.
14. Existing downstream behavior is unchanged.
15. No migration is changed solely to make the proof pass.

## 5. Implementation Shape

Preferred shape:

`Controller → Trusted Actor → Financial Command/UEB → allocateMilestone command body`

The UEB should be the owner of transaction lifecycle. Business logic must receive the transaction/context supplied by the boundary rather than opening an unrelated global transaction for the protected financial operation.

The implementation should not introduce a second competing abstraction merely for naming. Reuse the existing approved UEB infrastructure from ID-01-A where technically compatible.

## 6. Negative Oracles — Mandatory Before Promotion

The controlled test suite must prove, against disposable PostgreSQL:

| Oracle | Required result |
|---|---|
| Missing actor | DENY + `S_after == S_before` |
| Wrong role | DENY + no effect |
| Client B → Client A milestone | DENY + A unchanged |
| Missing milestone | DENY + no effect |
| Non-`funded` milestone | DENY + no effect |
| Insufficient escrow | DENY + no effect |
| Forged amount | DB amount remains authoritative |
| Forged currency | DB currency remains authoritative |
| Idempotent replay | exactly one financial effect |
| Same key + mismatched request | deterministic denial/no second effect |
| Failure after escrow update | complete rollback |
| Failure after transaction insert | complete rollback |
| Failure after milestone update | complete rollback |
| Concurrent allocation | no over-allocation |
| Connection reuse | no actor/context bleed |
| Post-transaction context | no persistent identity |
| Direct bypass | cannot become alternate authoritative path |

## 7. Independent Oracle Snapshot

Before each mutation scenario capture:

`S_before = { milestone, quote, escrow, escrow_transactions, idempotency }`

For denial and rollback:

`S_after == S_before`

For successful allocation, assert exactly:

- milestone `funded → in_progress`
- escrow allocated amount increases by the DB-derived milestone amount
- exactly one `stage_allocation` transaction exists for the idempotency identity
- transaction amount/currency equal DB-derived values
- no unrelated actor rows changed
- idempotency result persisted once.

HTTP status alone is insufficient evidence.

## 8. Failure Injection Matrix

Inject failure at these points:

1. immediately after UEB admission but before DB mutation
2. after escrow allocation update
3. after escrow transaction insertion
4. after milestone state transition
5. during idempotency persistence
6. immediately before commit.

Every case must prove:

`ROLLBACK → no partial financial effect → context destroyed → retry remains safe`

## 9. Concurrency Proof

At minimum run two independent actors against a shared constrained escrow/resource and multiple competing allocations.

Required properties:

- no negative available funds
- no over-allocation
- no duplicate stage allocation for one idempotency identity
- no cross-actor ownership leakage
- no partial commit
- deterministic convergence or denial.

Repeat the concurrency proof more than once; one successful race is not sufficient evidence.

## 10. Bypass Review Gate

Before G3 implementation is considered complete, inspect all production writers affecting the CI-01 truth surfaces:

- `representation_milestones`
- `escrow_accounts`
- `escrow_transactions`
- allocation idempotency records.

The objective is not to prohibit legitimate adjacent workflows. It is to establish that no alternate path can silently create the same `stage_allocation` authority effect while bypassing the controlled command boundary.

Adjacent writers remain separate seams unless the proof demonstrates that CI-01 cannot be isolated safely.

## 11. CI Execution Contract

CI must:

1. create disposable PostgreSQL 16
2. use a dedicated `_test` database on loopback only
3. run the production database guard before DB access
4. install dependencies deterministically
5. execute any required existing migration unchanged only inside disposable DB
6. run UEB structural/type checks
7. run all CI-01 negative and positive oracles
8. run concurrency and rollback proofs
9. assert context cleanup
10. tear down the disposable service through CI lifecycle, without destructive application cleanup commands.

No production `DATABASE_URL` may be available to the proof process.

## 12. Gate Sequence

### G3-A — Implementation Branch

Create a dedicated controlled branch from the reconciled `main` baseline.

### G3-B — Minimal Production Mutation

Implement only the UEB integration required for CI-01.

### G3-C — Negative Oracle Execution

Run the complete disposable proof matrix.

### G3-D — Regression

Run typecheck/build and relevant existing financial/security tests.

### G3-E — Review

Inspect diff for scope expansion, bypass introduction, migration mutation, credential exposure, and unintended financial behavior.

### G3-F — Promotion Candidate

Only after all required evidence is green may the unit be classified as a G3 promotion candidate.

Merge remains a separate authorization decision.

## 13. Stop Conditions

Immediately stop and do not promote if any of the following occurs:

- production DB connection
- live credential access
- migration modification required to hide a failed oracle
- actor/context bleed
- accepted missing/conflicting actor context
- direct financial bypass remains capable of creating CI-01 truth
- duplicate financial effect
- partial commit after injected failure
- concurrency over-allocation
- downstream wallet/settlement mutation introduced
- unexplained behavior change
- any S4 financial integrity finding.

## 14. G3 Success Definition

G3 is not "code compiles".

G3 success requires:

`Minimal Production Mutation + Disposable DB Proof + Negative Oracles + Atomicity + Idempotency + Concurrency + Isolation + Regression + Scope Review`

with all mandatory evidence green.

## 15. Safety Register

| Control | Required state during G3 preparation/implementation |
|---|---:|
| Production DB mutation | 0 |
| Production financial code outside CI-01 | 0 |
| Migration modification | 0 |
| Live credentials | 0 |
| Bank/merchant data | 0 |
| RLS activation | 0 |
| Unauthorized merge | 0 |
| Guard modification | 0 |

## 16. Decision

**G3 preparation = APPROVED AS A PLAN ONLY.**

The next operational action is to create the dedicated controlled implementation branch and implement the minimum CI-01 UEB change only after the explicit G3 execution authorization is recorded.

**Canonical classification:** `E02 / C17 / G3 / E02-CI-01 / CONTROLLED IMPLEMENTATION PLAN / PLAN ONLY`
