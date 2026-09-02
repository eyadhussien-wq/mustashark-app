# Financial Consumer Closure — 2026-09-02

## Status

**Audit-only / isolated branch. No production or `main` mutation. No DB migration. No revenue code removal in this phase.**

Branch: `security/financial-revenue-retirement-2026-09-02`

## 1. `platformDues` consumer graph

### Revenue authority

`lib/db/src/schema/platformDues.ts`

- `PLATFORM_COMMISSION_RATE = "0.15"`
- `platform_dues.commissionRate`
- `platform_dues.commissionAmount`
- `pending | collected | waived | disputed`

Classification: **LEGACY REVENUE AUTHORITY**.

### Confirm / booking consumers

1. `artifacts/api-server/src/controllers/bookings.ts`
   - Reads `PLATFORM_COMMISSION_RATE`.
   - Computes `commissionAmount = grossAmount * commissionRate`.
   - Inserts `platformDuesTable` after payment + escrow gates.
   - No client-funds mutation is performed by the commission calculation itself.

2. `src/controllers/bookingsController.ts`
   - Same commission calculation and `platformDuesTable` insertion path.
   - Classification: **LEGACY REVENUE EXECUTION**.

3. `artifacts/api-server/src/controllers/safeConfirmBooking.ts`
   - Same `PLATFORM_COMMISSION_RATE` calculation and `platformDuesTable` insertion.
   - Classification: **LEGACY REVENUE EXECUTION**.

### Revenue reporting / administration consumers

4. `artifacts/api-server/src/controllers/admin.ts`
   - Aggregates `pendingCommission` and `collectedCommission` from `platformDuesTable.commissionAmount`.
   - Classification: **LEGACY REVENUE REPORTING**.

5. `artifacts/api-server/src/controllers/adminData.ts`
   - Aggregates pending/collected commission from `platformDuesTable`.
   - Classification: **LEGACY REVENUE REPORTING**.

6. `artifacts/api-server/src/controllers/adminDeletionRequests.ts`
   - Reads/sums `platformDuesTable.commissionAmount` and nullifies office-dependent references.
   - Classification: **LEGACY REVENUE LIFECYCLE / DATA RETENTION**.
   - Must be redesigned before `platform_dues` retirement; it must not be allowed to block or corrupt deletion of unrelated client-funds records.

### Funds-protection lifecycle consumers

7. `artifacts/api-server/src/controllers/safeCancelBooking.ts`
   - Reads `platformDuesTable` during cancellation handling.
   - Classification: **MIXED**: the cancellation/refund state is client-funds protection; the platform-due mutation is legacy revenue state.
   - Retirement patch must remove the revenue side while preserving refund/escrow invariants.

8. `artifacts/api-server/src/controllers/lawyerNoShow.ts`
   - Refunds booking escrow and updates platform due state.
   - Classification: **MIXED**.
   - Required post-retirement behavior: refund/escrow path remains authoritative; there must be no requirement to create, calculate, collect, or waive a platform commission.

9. `scripts/src/x1-booking-cancel-test.ts`
   - Creates/asserts `platform_dues` and commission-related behavior.
   - Classification: **LEGACY TEST CONTRACT**.
   - Must be rewritten after the runtime retirement patch so it asserts client-funds safety rather than platform revenue.

## 2. Representation finance separation

`lib/db/src/schema/representationFinance.ts` contains two distinct concerns that must not be collapsed:

### Client-funds protection — PRESERVE

- `representationQuotesTable`
- `representationMilestonesTable`
- `escrowAccountsTable`
- `escrowTransactionsTable` for `deposit`, `stage_allocation`, `release`, `refund`
- milestone proof / release-request state
- escrow balances: deposited, allocated, released, refunded

These structures represent custody/state transitions for client-funded representation work. They are **not equivalent to platform revenue**.

### Legacy revenue — RETIRE

The same schema currently also contains:

- `escrowTransactionTypeEnum = commission`
- `commissionTiersTable`
- `commissionTiersTable.commissionRate`
- `lawyerWalletTransactionsTable.commissionAmount`
- `lawyerWalletTransactionsTable.netAmount`

`artifacts/api-server/src/services/releaseMilestone.ts` actively:

1. loads a `commissionTiersTable` rate;
2. calculates `commissionAmount` from the released milestone amount;
3. inserts a separate escrow `commission` transaction;
4. reduces the lawyer wallet payout to `netAmount`.

Classification: **LEGACY REVENUE EXECUTION**.

This is materially different from the escrow release itself. The retirement patch must preserve the release transaction and escrow balance invariant while removing the commission transaction/rate/netting behavior.

## 3. Required retirement boundary

The target model is fixed lawyer SaaS subscription revenue (50 JOD/month with the separately governed 30-day trial), not a percentage of client transactions.

Therefore the retirement target is:

- remove `PLATFORM_COMMISSION_RATE` from executable revenue logic;
- stop creating new `platform_dues` records;
- stop calculating or reporting platform commission;
- stop commission deductions from client-funded milestone releases;
- remove commission-specific wallet netting from release execution;
- preserve escrow deposit/allocation/release/refund transactions;
- preserve ledger/reconciliation/settlement invariants where they represent client funds;
- preserve idempotency and atomic transaction boundaries;
- preserve refund/no-show safety.

## 4. Explicit non-goals

The retirement patch must **not**:

- drop financial tables in this phase;
- delete historical client-funds records;
- mutate production/beta databases;
- alter `main`;
- alter `LawyerOS`;
- introduce subscription migrations;
- change payment-provider behavior;
- bypass existing authorization/security gates.

## 5. Proposed isolated implementation sequence

### Patch R1 — Booking commission retirement

- Remove commission calculation and `platformDuesTable` insertion from all booking-confirmation execution paths.
- Keep payment/escrow acceptance gates unchanged.
- Replace commission-specific tests with assertions that booking acceptance does not create a platform revenue obligation.

### Patch R2 — Cancellation/no-show separation

- Remove platform-due mutations from cancellation/no-show flows.
- Keep escrow refund and booking state transitions atomic/idempotent.
- Add regression tests proving refund behavior is unchanged when no platform-due record exists.

### Patch R3 — Representation release separation

- Remove commission tier lookup and commission transaction creation from `releaseMilestone`.
- Release the full approved milestone amount according to the existing escrow invariant.
- Remove `commissionAmount` from payout computation.
- Keep escrow release transaction, milestone transition, wallet credit semantics, idempotency, and balance checks.

### Patch R4 — Reporting/API contract retirement

- Remove commission aggregates from admin data contracts and implementation.
- Search generated API schemas/contracts for commission-only fields and retire them only after consumer inventory.

### Patch R5 — Schema retirement preparation

- Only after R1–R4 pass CI + financial E2E + security gates, mark `platform_dues`, `commission_tiers`, and commission-only columns as retirement candidates.
- No DROP migration is part of this audit branch.

## 6. Safety invariants for the implementation branch

The retirement patch is invalid if any test demonstrates:

- client funds can be released without an escrow balance check;
- refund can be duplicated;
- idempotency can be bypassed;
- a milestone can be released twice;
- an escrow release changes because commission was removed;
- a client-funded amount is reduced solely because legacy commission logic was removed;
- authorization is weakened;
- financial state is accepted from the client rather than derived server-side.

## 7. Current conclusion

`platformDues` is a legacy revenue subsystem with several mixed lifecycle consumers. It must be retired surgically, not deleted wholesale.

`representationFinance.ts` is **mixed-domain**: escrow/milestone/client-funds protection must survive; commission-tier and commission-netting behavior must be retired.

This document intentionally contains **no executable retirement change**. It is the evidence-backed design boundary for the next isolated implementation patch.

**Merge/Delete status: FROZEN.**
**Production status: untouched.**
**`main`: untouched.**
**PR #123: untouched and frozen.**
