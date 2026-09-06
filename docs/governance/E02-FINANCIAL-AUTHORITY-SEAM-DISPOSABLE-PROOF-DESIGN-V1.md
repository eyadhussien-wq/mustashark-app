# MUSTASHARK — E02 SMALLEST FINANCIAL AUTHORITY SEAM & DISPOSABLE DB PROOF DESIGN V1

**Status:** DISCOVER / MAP — REVIEW CANDIDATE  
**Unit:** E02 — Financial Authority / C17  
**Parent specification:** `docs/governance/E02-FINANCIAL-AUTHORITY-BOUNDARY-MAPPING-SPECIFICATION-V1.md`  
**Product authority:** `docs/governance/MUSTASHARK-MASTER-MAP.md`  
**Execution-state authority:** `docs/governance/MUSTASHARK-MASTER-STATE-2026-09-03.md`  
**Canonical financial architecture:** `docs/architecture/FINANCIAL-AUTHORITY-MIGRATION-V1-CANONICAL-2026-08-28.md`  
**Design date:** 2026-09-07

> **Purpose:** select the smallest currently observable financial-authority seam and define its disposable-database proof before any production implementation. This document is a design artifact only. It does not authorize production financial-code changes, migrations, live credentials, bank data, provider configuration, or production database access.

---

## 1 — Decision Summary

### Proposed smallest seam

The smallest useful E02 seam is the **Milestone Financial Transition Boundary**, centered on the existing server-owned milestone amount/currency and the transactional transition that currently creates an escrow financial transaction.

The initial proof target is deliberately narrower than the complete Financial Authority:

`Authorized Financial Command → Financial Authority Seam → Atomic Financial Fact/Transition → Controlled Escrow Compatibility Record → Independent Oracle`

The first concrete candidate operation is the existing **funded milestone allocation** transition represented by `allocateMilestone.ts`.

This is a **seam candidate, not yet an implementation authorization**.

### Why this seam is selected

The repository already provides a compact, observable financial transition:

- the milestone amount is server-owned;
- the currency is read from the authoritative quote;
- the client cannot submit the financial amount/currency;
- the milestone and escrow records are locked inside one transaction;
- the escrow balance has an explicit sufficiency predicate;
- an escrow transaction is created with a stable operation reference;
- the milestone transition is coupled to the financial mutation;
- transactional idempotency is already present.

These properties make allocation substantially smaller and safer to isolate than starting with provider payment, complete ledger construction, wallet redesign, settlement, or reconciliation.

Repository evidence: the current allocation service performs the financial mutation inside `db.transaction`, reads the milestone amount from database state, updates escrow conditionally, inserts a posted `stage_allocation` transaction, transitions the milestone, and persists the idempotency response. fileciteturn88file0

---

## 2 — Important Architectural Qualification

The current `allocateMilestone.ts` operation is **not** declared to be the final Financial Authority.

It is the smallest existing **authority-bearing financial seam** that can be used to prove the boundary contract.

Current implementation still writes directly to financial tables through a global `db.transaction`. Therefore:

`Existing transactional financial service ≠ proven E02 Financial Authority`

The E02 objective is to establish the authority boundary around this type of operation without prematurely rewriting all financial domains.

The proof must therefore distinguish:

1. **Existing local correctness** — amount ownership, transactionality and idempotency.
2. **Authority correctness** — only the designated financial boundary may create authoritative financial effects.
3. **Accounting correctness** — later E02 work must establish the authoritative double-entry ledger.

This distinction prevents the current escrow transaction table from being incorrectly promoted to the canonical ledger.

---

## 3 — Seam Contract

### 3.1 Input

The seam accepts only an authorized command containing the minimum business reference required to identify the financial resource.

For the allocation candidate:

- milestone identity;
- authenticated/authorized actor identity;
- request/idempotency identity.

The command must **not** make client-supplied amount or currency authoritative.

### 3.2 Authority-owned values

The seam derives from server/database state:

- milestone amount;
- quote currency;
- escrow account;
- milestone ownership/relationship;
- current milestone state;
- available unallocated funds.

### 3.3 Atomic effect

The candidate operation must be treated as one atomic unit:

`Validate → Lock → Verify authority → Update controlled financial representation → Record financial fact → Transition state → Persist idempotency result → Commit`

Any failure before commit must leave the financial state unchanged.

### 3.4 Output

The operation may return the resulting state to the caller, but the response is not itself financial truth.

The database state and independent oracle are authoritative for proof.

---

## 4 — Why Not Start With Other Financial Surfaces?

| Candidate | Disposition | Reason |
|---|---|---|
| Provider payment / MyFatoorah | Later E03 | External verification boundary adds provider trust and webhook complexity |
| Full ledger | Later within E02-Core | Architecturally central but too broad as first seam |
| Lawyer wallet | Later E04 | Wallet must become a projection, not a competing authority |
| Settlement / payout | Later E04 | Requires entitlement and external settlement-state semantics |
| Reconciliation | Later E05 | Depends on authoritative records across several systems |
| Escrow allocation | **E02 seam candidate** | Narrow, transactional, server-owned amount, observable state transition |
| Escrow refund | Secondary candidate | Useful but has broader refund semantics and must follow authority ownership |
| Milestone release | Secondary candidate | Includes commission calculation and wallet mutation, therefore broader |

The current release path is explicitly broader: it creates release and commission transactions, updates escrow, transitions the milestone, creates a wallet transaction and updates the lawyer wallet in one transaction. fileciteturn90file0

The refund path is also compact and atomic, but represents a different financial fact and should not be combined with allocation in the first proof. fileciteturn89file0

---

## 5 — Disposable Database Proof Topology

The proof environment must be disposable and structurally unable to reach production.

### Required topology

`CI Runner → Local PostgreSQL Container → dedicated *_test database → test role → seam proof → independent SQL/application oracles → teardown`

### Required properties

- database name ends in `_test`;
- host is local/loopback only;
- production/Beta hosts are rejected before any connection attempt;
- no production `DATABASE_URL` is available to the proof process;
- no live provider credentials are available;
- no bank/merchant data exists;
- schema is provisioned only inside the disposable environment;
- test data is synthetic;
- teardown destroys the disposable database/container.

### Migration rule

If the seam requires an existing migration for database behavior, the test may execute the **unchanged existing migration** inside the disposable database.

No migration file may be modified for the proof.

---

## 6 — Proof Data Model

Synthetic identities:

- Client A.
- Client B.
- Lawyer A.
- Lawyer B.
- Optional explicit system actor for future background-path proof.

Synthetic financial resource:

- Quote A owned by Client A and assigned to Lawyer A.
- Quote B owned by Client B and assigned to Lawyer B.
- Milestone A under Quote A.
- Milestone B under Quote B.
- Escrow A under Quote A.
- Escrow B under Quote B.

Financial fixtures must include at least:

- one valid funded milestone;
- one insufficient-funds case;
- one incompatible currency case where schema/business rules permit;
- one replayable idempotency identity;
- one concurrent A/B pair;
- one failure-injection point before commit.

All identifiers and financial amounts are synthetic.

---

## 7 — Negative Oracle Design

The seam proof will implement only the relevant F01–F16 classes for this first operation, while explicitly marking non-applicable classes rather than manufacturing false coverage.

### F01 — Authority Ownership

Stimulus:
- attempt to produce the allocation financial effect through a path bypassing the designated seam.

Expected:
- bypass is denied or produces no authoritative financial effect.

### F02 — Amount / Currency Integrity

Stimulus:
- attempt to substitute amount or currency through the request.

Expected:
- supplied values are ignored/rejected as authority inputs; database-owned values control the result.

### F03 — Provider Trust Boundary

Status:
- **N/A for first seam proof**.

Reason:
- allocation occurs after funding and does not itself establish provider payment verification.

Provider trust will be proven in E03/provider-specific work.

### F04 — Duplicate Event

Stimulus:
- replay the same allocation event/reference.

Expected:
- no second authoritative financial effect.

### F05 — Idempotency

Stimulus:
- repeat the same command with the same idempotency identity.

Expected:
- deterministic replay response and exactly one financial effect.

### F06 — Atomicity

Stimulus:
- force failure after a financial mutation but before successful completion.

Expected:
- complete rollback; no partial escrow transaction, balance mutation or milestone transition remains.

### F07 — Concurrency

Stimulus:
- concurrently allocate competing milestones against the same constrained escrow resource.

Expected:
- no over-allocation; one valid result or deterministic safe denial.

### F08 — Ledger Immutability / Balance

Status:
- **Partial for seam proof**.

The current escrow transaction is not yet the canonical double-entry ledger. The seam proof may verify transaction-state integrity and balance constraints, but canonical debit/credit ledger invariants remain an E02-Core follow-up.

### F09 — Entitlement Integrity

Status:
- **Partial / deferred**.

Allocation proves movement into milestone execution, not final lawyer entitlement. Full entitlement proof belongs to release/settlement authority work.

### F10 — Commission Integrity

Status:
- **N/A for first seam**.

Allocation does not calculate commission. Commission authority will be proved on the release seam.

### F11 — Settlement Truth

Status:
- **N/A for first seam**.

Settlement is downstream.

### F12 — Reconciliation

Status:
- **Partial / deferred**.

The first seam must expose enough stable references for later reconciliation, but cross-system reconciliation is a separate E05 capability.

### F13 — Financial Authorization

Stimulus:
- Client B attempts to allocate Client A's milestone.

Expected:
- deny; no A financial state changes; no B financial state changes.

### F14 — Cross-Currency / Identity Isolation

Stimulus:
- substitute an escrow/milestone/quote combination belonging to another identity or incompatible currency.

Expected:
- deny or no financial effect.

### F15 — Rollback / Failure Recovery

Stimulus:
- fail at each critical point, then retry with the same idempotency identity.

Expected:
- no orphaned partial effect; retry produces at most one valid result.

### F16 — Financial / Neutral Boundary

Stimulus:
- invoke financial mutation through a neutral-domain path or attempt to inject financial state into a neutral operation.

Expected:
- financial authority boundary remains closed.

---

## 8 — Independent Oracle Requirements

The test must not prove the operation solely by inspecting its own return value.

For every mutation proof, independently inspect:

1. milestone status;
2. escrow deposited/allocated/released/refunded totals;
3. escrow transaction count and exact operation reference;
4. idempotency record/effect count where applicable;
5. actor ownership relationships;
6. absence of cross-actor rows;
7. rollback state after injected failure.

For negative tests:

`Denied/Failed → DB state snapshot before = DB state snapshot after`

is the minimum integrity assertion.

---

## 9 — Snapshot Oracle

Before each destructive/negative stimulus, capture the relevant financial state:

`S_before = { milestone, escrow, escrowTransactions, idempotency }`

After the stimulus:

`S_after`

For denial/rollback cases:

`S_after == S_before`

For successful allocation:

`S_after` must satisfy the exact expected transition and contain exactly one new financial transaction with the expected server-derived amount/currency and operation reference.

No test may use “HTTP 403/500 = PASS” as its only financial oracle.

---

## 10 — Concurrency Proof

Concurrency must use two independent actors/requests and a shared constrained financial resource.

Required scenario:

`Request A + Request B → same escrow constraint → concurrent transaction execution → lock/constraint decision → exactly one valid aggregate result`

Assertions:

- no negative unallocated balance;
- no over-allocation;
- no duplicate financial effect for one idempotency identity;
- no cross-actor leakage;
- committed rows are internally consistent;
- a failed race does not leave a partial mutation.

The proof must run repeatedly enough to expose nondeterministic races; a single successful concurrent run is not sufficient evidence by itself.

---

## 11 — Context / Identity Isolation

Because E02 must eventually integrate with the Unified Execution Boundary, the proof must reserve explicit assertions for actor isolation:

`Actor A → Transaction A → Financial effect A`

`Actor B → Transaction B → Financial effect B`

and:

`Actor A cannot cause Actor B's financial effect`

No global/session identity is permitted in the test harness.

No actor identity may be accepted from an untrusted request body.

---

## 12 — Failure Injection Matrix

At minimum inject failure at:

1. before financial update;
2. after escrow update;
3. after financial transaction insert;
4. after milestone transition;
5. during idempotency persistence;
6. before transaction commit.

Expected for every injected failure:

`ROLLBACK → no partial authoritative effect → context ends → retry is safe`

If any failure leaves an orphaned financial effect, the seam is **NOT PROMOTABLE**.

---

## 13 — Proof Deliverables

The eventual implementation/proof branch must produce:

- one isolated test script for the selected seam;
- one dedicated CI workflow;
- production-host guard;
- disposable PostgreSQL provisioning;
- synthetic fixtures;
- positive oracle;
- negative oracle matrix;
- concurrency proof;
- rollback proof;
- isolation proof;
- cleanup/teardown proof;
- machine-readable final result.

Expected terminal result:

```json
{
  "harness": "M0-PROOF-HARNESS-001",
  "mode": "E02-FINANCIAL-AUTHORITY-SEAM",
  "seam": "milestone-allocation",
  "result": "DB-ORACLE-PASS"
}
```

The result must not be emitted as PASS unless every required applicable oracle passes and every deferred oracle is explicitly recorded.

---

## 14 — Promotion Gates

### G1 — Seam Review

The milestone-allocation seam is accepted as the smallest initial E02 proof target.

### G2 — Proof Harness Review

The disposable DB topology, production guard and independent oracle model are accepted.

### G3 — Oracle Coverage Review

Applicable F01–F16 classes are mapped; deferred/non-applicable classes are explicitly recorded.

### G4 — Disposable DB Proof

The proof passes in isolated PostgreSQL with production structurally unreachable.

### G5 — Controlled Implementation Authorization

Only after G1–G4 may an implementation change be considered.

### G6 — E02 Promotion

Promotion requires the full applicable financial gate, not merely a green seam test.

---

## 15 — Explicit Non-Claims

This design does **not** claim that:

- the existing escrow transaction table is the final ledger;
- the existing allocation service is already the Financial Authority;
- the full E02 financial architecture is implemented;
- wallet balances are already derived projections;
- provider payment verification is already proven by this seam;
- settlement/reconciliation are complete;
- any financial path is “100% immune” from defects.

The purpose is deterministic evidence: prove the smallest boundary first, then expand only when the evidence supports expansion.

---

## 16 — Current Safety State

At document creation:

`Production DB = 0`  
`Migration Mutation = 0`  
`Financial Production Code Mutation = 0`  
`Live Credentials = 0`  
`Bank Data = 0`  
`RLS Activation = 0`

No implementation code is changed by this document.

---

## 17 — Final Engineering Decision Pending Review

**Recommended first seam:**

`Milestone Allocation — funded → in_progress with server-owned amount/currency and atomic escrow transaction`

**Recommended proof environment:**

`Disposable PostgreSQL *_test + production guard + independent DB snapshot oracles + concurrency + rollback + actor isolation`

**Recommended next action after approval:**

`CONTROLLED DISPOSABLE DB PROOF DESIGN REVIEW → implement proof harness only → CI → evaluate evidence`

No production financial implementation is authorized by this document alone.
