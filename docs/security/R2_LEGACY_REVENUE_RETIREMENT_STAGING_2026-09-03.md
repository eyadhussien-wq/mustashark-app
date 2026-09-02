# R2 Legacy Revenue Retirement — Staging Plan

Date: 2026-09-03
Branch: `security/financial-revenue-retirement-2026-09-02`
Status: STAGED — DO NOT EXECUTE UNTIL R1 TYPECHECK + FINANCIAL E2E ARE GREEN

## Scope

R2 will remove legacy revenue-side `platformDues` mutations from cancellation and no-show/refund paths while preserving all client-funds protection invariants.

## Candidate execution surfaces

1. `artifacts/api-server/src/controllers/bookings.ts`
   - cancellation path(s)
   - lawyer-absence/refund path
   - preserve authoritative state transitions and financial gates
2. `artifacts/api-server/src/controllers/lawyerNoShow.ts`
   - `refundLawyerNoShow`
   - remove only the legacy `platformDuesTable` mutation
   - preserve `paymentStatus === "paid"` and `escrowStatus === "held"` preconditions
   - preserve atomic refund transaction and client-wallet credit
3. Any additional cancellation/no-show consumer discovered by the R2 consumer scan
   - must be classified before modification
   - no speculative deletion of tables, migrations, or client-funds infrastructure

## Safety invariants

- `paymentStatus = paid` remains a prerequisite for client-fund release/refund operations.
- `escrowStatus = held` remains a prerequisite for refund/release operations where currently required.
- Client wallet/refund accounting remains intact.
- Atomic transaction boundaries remain intact.
- Idempotency and optimistic-lock/state-machine protections remain intact.
- No changes to production/beta databases.
- No changes to `main` or `LawyerOS`.
- No removal of escrow/ledger/settlement/reconciliation merely because commission logic is being retired.

## Explicitly out of scope for R2

- `representationFinance.ts` commission tiers and release netting — reserved for the dedicated representation-finance separation stage.
- `platform_dues` table/migration deletion.
- 50 JOD subscription implementation.
- production data migration.
- merge to `main`.

## Gate sequence

1. R1 Typecheck: 0 TypeScript errors.
2. R1 Financial E2E: green, including client-funds invariants.
3. Execute R2 code changes on this isolated branch only.
4. Immediate Typecheck.
5. R2 Financial E2E and targeted cancellation/no-show tests.
6. Review diff for revenue-vs-funds-protection separation.
7. Only then consider R2 completion; no merge decision is implied by this staging document.
