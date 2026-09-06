# MUSTASHARK — E02 FINANCIAL AUTHORITY BOUNDARY MAPPING SPECIFICATION V1

**Status:** ARCHITECTURE FREEZE CANDIDATE — DISCOVER / MAP  
**Unit:** E02 — Financial Authority / C17  
**Version:** V1  
**Date:** 2026-09-07  
**Execution authority:** `docs/governance/MUSTASHARK-MASTER-STATE-2026-09-03.md`  
**Product / architecture authority:** `docs/governance/MUSTASHARK-MASTER-MAP.md`  
**Canonical financial architecture:** `docs/architecture/FINANCIAL-AUTHORITY-MIGRATION-V1-CANONICAL-2026-08-28.md`

> **Purpose:** freeze the E02 architectural boundary before implementation. This document records the current financial surfaces, authority ownership model, mandatory invariants, negative-oracle classes, and implementation gates. It does **not** authorize production financial-code changes, migrations, production database changes, live credentials, bank data, or live provider configuration.

---

## 1. Executive Boundary Decision

E02 is the financial-authority foundation for Mustashark. The adopted architecture is **not** a redesign of the product from zero; it establishes one authoritative financial boundary over existing financial surfaces that are currently distributed across schemas, services, controllers, provider-facing paths, escrow representations, wallets, settlement foundations, and payment-proof flows.

Canonical financial flow:

`Service → Payment Obligation → Provider Adapter → Verified Provider Event → Financial Authority → Ledger / Escrow Compatibility → Settlement → Reconciliation`

The central E02 problem is:

`Distributed Financial State → No single proven authoritative financial boundary → Financial integrity risk`

Therefore:

`Authority Boundary → Financial Facts → Ledger → Derived Projections → Settlement → Reconciliation`

must be established and proven before downstream financial implementation is promoted.

---

## 2. Scope and Non-Scope

### In scope

- C17 Financial Authority.
- `MX-FIN-01`, `MX-FIN-02`, `MX-FIN-03`.
- Financial fact ownership and authority boundaries.
- Double-entry ledger design.
- Chart of Accounts design.
- Payment obligations versus verified payments.
- Provider-event verification.
- Escrow compatibility semantics.
- Wallet projection semantics.
- Entitlement semantics.
- Settlement and payout authority.
- Reconciliation.
- Idempotency, atomicity, concurrency and rollback.
- Event Inbox / transactional Outbox boundaries.
- Financial state machine.
- Financial configuration authority.
- Financial period closing.
- Financial Controller / Operational Accountant segregation of duties.
- F01–F16 negative-oracle classes.

### Explicitly out of scope for Step 1

- Production financial-code mutation.
- Production database mutation.
- New or modified SQL migrations.
- RLS activation.
- Live MyFatoorah credentials.
- Real merchant, settlement, bank or IBAN data.
- Building a Financial Controller web domain/account as an implementation unit.
- Building a wallet as an independent source of truth.
- Premature Redis/distributed locking.
- Rewriting historical financial records.

Safety target:

`Production DB = 0 | Migration Mutation = 0 | Financial Production Code Mutation = 0 | Live Credentials / Bank Data = 0`

---

## 3. Authority Hierarchy

### 3.1 Financial Authority Engine

The Financial Authority is the only component permitted to create authoritative financial facts and post authoritative accounting effects.

No UI, controller, wallet endpoint, provider adapter, webhook handler, escrow helper, settlement handler, or background worker may independently create financial truth.

Required command pattern:

`Authorized Command → Financial Authority → Financial Fact → Ledger / controlled projections`

### 3.2 Ledger

The internal ledger is the authoritative accounting journal.

Mandatory design property:

`Debit = Credit`

Financial history is append-oriented. Corrections use reversal/adjustment mechanisms; normal operation does not hard-delete or retroactively rewrite posted financial facts.

### 3.3 Wallet

A wallet is a **projection of authoritative financial facts**, not an independent authority.

`Ledger / Financial Authority → Wallet Projection`

Wallet balance mutations without the corresponding authoritative financial event are forbidden.

### 3.4 Escrow

Escrow is an operational holding/compatibility representation. It is not the accounting authority.

`Financial Authority / Ledger ↔ Escrow Compatibility`

Escrow state must remain reconcilable to authoritative financial facts.

### 3.5 Payment Obligation

A payment obligation is not itself proof that money was received.

`Obligation ≠ Payment ≠ Provider Event ≠ Financial Fact`

A provider event becomes financially authoritative only after independent verification and controlled posting.

---

## 4. E02 Architectural Domains

### E02-Core — Financial Authority Engine

Responsibilities:

- Financial facts.
- Ledger / double-entry journal.
- Chart of Accounts.
- Idempotency.
- Atomicity.
- Concurrency control.
- Entitlements.
- Settlement state.
- Reconciliation facts and exceptions.
- Reversal / adjustment semantics.
- Financial state machine.
- Period closing.
- Financial configuration authority.
- Durable event processing.

### E02-Control Plane

Roles and workflows:

- Financial Controller (FC).
- Operational Accountant (OA).
- RBAC / least privilege.
- Approval workflow.
- Financial reporting.
- Reconciliation console.
- Financial audit review.

FC and OA are **identity/role classes**, not shared technical identities.

FC may approve an authorized financial command but must not write the ledger directly.

OA may prepare, review and reconcile but does not hold final approval authority.

### Platform Merchant Settlement Boundary

Conceptual future model:

`Platform Merchant Settlement Account → External Settlement Destination`

Future sensitive attributes may include bank/settlement identifiers, account ownership, provider merchant identifiers, status, effective dates and verification/audit metadata. No real bank data is introduced in E02 Step 1.

### Provider Boundary — MyFatoorah

MyFatoorah is an external payment provider and integration boundary, **not** Mustashark's financial authority.

Provider identifiers do not replace Mustashark's internal financial identity.

---

## 5. Architectural Additions Frozen for E02

### 5.1 Database-first concurrency

Prefer PostgreSQL transactions, row locks, unique constraints and idempotency constraints for financial correctness. Redis/distributed locking is not a default prerequisite; introduce it only after a measured requirement is demonstrated.

### 5.2 Double-entry accounting

Authoritative journal entries must balance:

`Total Debit = Total Credit`

### 5.3 Chart of Accounts

CoA is defined early enough that financial facts have explicit accounts and do not depend on ambiguous balance fields.

Representative conceptual accounts:

- Client Funds / Funds Held.
- Lawyer Payable.
- Platform Revenue.
- Provider Clearing.
- Escrow Holding.
- Refund Liability.
- Settlement Clearing.
- Fees / Provider Fees.
- Adjustments / Reversals.

Exact account codes are an implementation/design follow-up, not invented here.

### 5.4 Financial timestamp semantics

Distinct timestamps are required where applicable:

- `provider_event_time`.
- `server_received_at`.
- `financial_posted_at`.
- `settled_at`.
- `reconciled_at`.

One timestamp must not silently represent every lifecycle event.

### 5.5 Event Inbox / Transactional Outbox

Inbound provider events require durable receipt, dedupe identity, processing status and controlled processing.

Outbound financial/domain events require durable publication semantics where downstream processing depends on them.

### 5.6 Financial State Machine

Conceptual monotonic lifecycle:

`CREATED → PENDING → VERIFIED → POSTED → SETTLED → RECONCILED`

Terminal/exception states must be explicit. Backward mutation of posted history is forbidden; corrections use reversal/adjustment facts.

### 5.7 Segregation of Duties

`OA prepares/reconciles → FC approves → Financial Authority posts`

No role receives an implicit direct-write bypass.

### 5.8 Financial Period Closing

`OPEN → CLOSING → CLOSED`

Closed periods cannot receive retroactive ordinary mutation. Corrections after close are explicit adjustments/reversals with audit evidence.

### 5.9 Financial Configuration Authority

Configuration that can alter financial truth or financial calculation must have one authoritative owner, explicit effective dates and auditable approval.

Examples:

- Commission rates.
- Supported currencies.
- Provider configuration.
- Settlement accounts.
- Payout rules.
- Financial feature flags affecting posting behavior.

---

## 6. Current Repository Financial Surface Map

The current repository contains multiple financial-bearing surfaces. Their existence is evidence of capability, not proof of a single authority.

### 6.1 Schema surfaces

`lib/db/src/schema/representationFinance.ts` currently contains conceptual financial state across:

- Representation quotes.
- Representation milestones.
- Escrow accounts.
- Escrow transactions.
- Milestone proofs.
- Release requests.
- Commission tiers.
- Lawyer wallets.
- Lawyer wallet transactions.

Additional financial-bearing surfaces identified by the repository architecture include:

- `platformDues`.
- `representationFinance`.
- `representationQuoteRequests`.
- `lawyerProposals`.
- `paymentProofs`.

### 6.2 Service surfaces

Existing services include financial transitions such as:

- `allocateMilestone.ts`.
- `releaseMilestone.ts`.
- `refundMilestone.ts`.
- `createMilestoneReleaseRequest.ts`.
- `acceptLawyerProposal.ts`.

Several already enforce valuable local properties such as server-owned amounts/currencies, transactionality and idempotency. Those properties are preserved as evidence but do not by themselves prove central authority ownership.

### 6.3 Controller / cross-domain surfaces

Financial effects are also reachable from booking/admin/no-show paths, including surfaces referencing `platformDues` and consultation/booking lifecycle state.

This is a primary boundary-mapping obligation:

`Business Workflow → Financial Command → Financial Authority`

rather than:

`Business Workflow → Direct Financial Table Mutation`

### 6.4 Current architectural conclusion

The repository demonstrates substantial financial functionality, but financial truth is distributed across several schema and service surfaces.

**E02 GAP:**

`Distributed authority-bearing state + multiple mutation paths → central authority seam not yet proven`

---

## 7. MAP-X Traceability

| MAP-X | E02 Boundary | Current status |
|---|---|---|
| `MX-FIN-01` | Payment obligation / provider verification / financial fact | Existing pieces; authority seam not fully proven |
| `MX-FIN-02` | Ledger / financial fact / accounting authority | Existing financial records; single authoritative ledger boundary not yet proven |
| `MX-FIN-03` | Escrow / wallet / settlement / reconciliation | Existing components; projection and entitlement authority require consolidation/proof |

E02 does not collapse these into one table. It establishes the authority relationship among them.

---

## 8. Mandatory Financial Invariants

1. Financial authority is server-controlled.
2. Client-supplied amount, currency, commission or entitlement cannot become authoritative without server validation.
3. Provider redirect alone cannot prove payment.
4. Provider event alone cannot become a financial fact without verification.
5. Every financial fact has a stable identity, source, correlation/reference and timestamp.
6. Every posted journal entry is balanced.
7. Financial history is not hard-deleted or retroactively rewritten.
8. Corrections use reversal/adjustment facts.
9. Every retry is idempotent where the operation is financially repeatable.
10. Concurrent attempts converge to one valid financial result or fail safely.
11. Wallets cannot create independent financial truth.
12. Escrow cannot create independent accounting truth.
13. No wallet update without its authoritative financial source fact.
14. No settlement without an authoritative entitlement/source fact.
15. No payout without explicit entitlement and controlled state.
16. Reconciliation mismatch is an integrity exception, not a silent correction.
17. Missing actor/source/amount/currency/reference/verification/context fails closed.
18. Authorization is independent from financial execution identity.
19. Financial identity remains separate from Neutral Core identity and from unrelated application identities.
20. Closed financial periods cannot be silently mutated.

---

## 9. Negative Oracle Specification — F01–F16

The E02 proof model is:

`Unauthorized / malformed stimulus → Boundary decision → DB-observable effect → Independent oracle → PASS/DENY`

A `403` or thrown error alone is insufficient where a database side effect could still occur.

### F01 — Authority Ownership

Attempt financial mutation through controller/UI/provider/wallet/escrow path without Financial Authority.

**Expected:** DENY or route through Financial Authority; no independent financial truth created.

### F02 — Amount / Currency Integrity

Spoof amount, currency, commission, entitlement or fee.

**Expected:** authoritative values come from validated server-side financial state; spoofed values cannot alter financial truth.

### F03 — Provider Trust Boundary

Send forged, incomplete, stale or unverified provider event.

**Expected:** no financial posting until provider event is independently verified.

### F04 — Duplicate Event

Replay identical provider event/reference.

**Expected:** one financial effect only.

### F05 — Idempotency

Replay the same financially repeatable command with the same idempotency identity.

**Expected:** same valid outcome; no duplicate financial effect.

### F06 — Atomicity

Force failure after one financial mutation but before completion.

**Expected:** full rollback; no partial financial truth.

### F07 — Concurrency

Run competing financial commands concurrently for the same financial resource.

**Expected:** one valid converged result or deterministic safe denial; no double posting.

### F08 — Ledger Immutability / Balance

Attempt to mutate or delete posted financial history, or create unbalanced journal entries.

**Expected:** DENY; posted history remains intact; debit/credit invariant remains true.

### F09 — Entitlement Integrity

Attempt to settle/payout an amount greater than authoritative earned entitlement.

**Expected:** DENY; no over-credit or fabricated entitlement.

### F10 — Commission Integrity

Attempt to spoof commission rate, tier, effective date or fee.

**Expected:** server-owned effective configuration controls calculation; unauthorized configuration cannot alter posted truth.

### F11 — Settlement Truth

Mark a settlement/payout successful without authoritative external confirmation where confirmation is required.

**Expected:** state cannot be falsely advanced to settled/paid solely from local assertion.

### F12 — Reconciliation

Introduce a mismatch between provider/payment/ledger/wallet/settlement representations.

**Expected:** mismatch is detected and classified; no silent rewrite of financial history.

### F13 — Financial Authorization

Attempt another actor's financial mutation or privileged financial action.

**Expected:** DENY; actor identity and financial state remain unchanged.

### F14 — Cross-Currency / Identity Isolation

Cross currency or actor identities between otherwise similar financial records.

**Expected:** DENY incompatible identity/currency combinations; no cross-owner financial effect.

### F15 — Rollback / Failure Recovery

Force database or processing failure at a critical financial boundary, then retry.

**Expected:** no orphaned partial fact; recovery creates at most one authoritative effect and does not fall back to an alternate identity/source.

### F16 — Financial / Neutral Boundary

Attempt financial behavior from a Neutral Core path or inject financial state into a neutral operation.

**Expected:** boundary blocks unauthorized financial authority crossing; financial behavior remains within E02 ownership.

---

## 10. Smallest Implementation Unit Rule

No broad “financial rewrite” is authorized.

The first implementation unit must be selected only after mapping current mutation paths and identifying the smallest **Financial Authority Seam** that can be isolated and proven in a disposable database.

Selection order:

`DISCOVER / MAP → Boundary Freeze → Oracle Specification → Smallest Seam → Disposable DB Proof → Controlled Implementation`

The first seam must be:

- narrow;
- authority-bearing;
- independently observable;
- transactionally bounded;
- testable without production dependencies;
- compatible with the adopted canonical architecture;
- capable of proving at least the relevant F01–F16 classes without requiring the entire financial platform.

---

## 11. E02 Gate Model

### G1 — Boundary Freeze

This specification and the canonical financial architecture agree on authority ownership and domain separation.

### G2 — Current Mutation-Path Inventory

All relevant controller/service/provider/wallet/escrow financial mutation paths for the selected seam are enumerated.

### G3 — Authority Seam Selected

One smallest Financial Authority seam is selected and its input/output contract is explicit.

### G4 — Oracle Specification

Required negative, isolation, concurrency and rollback oracles are defined before implementation.

### G5 — Disposable DB Proof

Proof runs against a local/ephemeral `_test` PostgreSQL database only. Production DB must be structurally impossible to reach.

### G6 — Controlled Implementation

Only the selected seam is changed. No unrelated financial refactor.

### G7 — Full Verification

Typecheck, build, authorization, provider boundary, financial invariants, idempotency, concurrency, rollback and security gates pass as applicable.

### G8 — Promotion Candidate

The unit is verified, isolated, auditable and compatible with the Master State. G8 is not itself a merge authorization.

---

## 12. Financial Security and Operational Rules

- Provider secrets remain server-side.
- No payment-card data is introduced by E02 Step 1.
- Sensitive settlement/bank data is not introduced as real data in discovery/proof.
- Logs must not expose secrets, tokens or unnecessary sensitive financial identifiers.
- Financial actions must be auditable.
- Administrative financial operations use explicit RBAC and SoD.
- System/background execution requires an explicit system identity/context; no hidden fallback identity.
- No global/session financial identity.
- No silent fallback from Financial Authority to direct DB mutation.
- No financial operation relies on client authority.
- No historical financial data is rewritten merely to satisfy tests.

---

## 13. Decision Record

**Architecture decision:** ADOPTED for E02 boundary mapping.  
**Implementation decision:** NOT YET AUTHORIZED.  
**Production financial-code mutation:** `0`.  
**Production DB mutation:** `0`.  
**Migration mutation:** `0`.  
**Live credentials / bank data:** `0`.  
**RLS activation:** `0`.

The next authorized step, after final review of this specification, is **not** a broad implementation. It is the selection and proof of the smallest isolated Financial Authority Seam in a disposable database.

---

## 14. Authority References

1. `docs/governance/MUSTASHARK-MASTER-MAP.md` — canonical product/architecture authority.
2. `docs/governance/MUSTASHARK-MASTER-STATE-2026-09-03.md` — canonical current execution-state authority.
3. `docs/architecture/FINANCIAL-AUTHORITY-MIGRATION-V1-CANONICAL-2026-08-28.md` — adopted E02 financial architecture.
4. `lib/db/src/schema/representationFinance.ts` — current representation-finance schema surface.

Historical E01 documents remain audit history and cannot authorize E02 implementation.
