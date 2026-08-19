# S02.3 Accept & Pay — Implementation Contract

## Scope

S02.3 is the internal orchestration boundary between an accepted `lawyer_proposals` row and the existing representation-finance persistence model.

### In scope

- Extend the existing proposal `POST .../:proposalId/accept` endpoint.
- Require an authenticated client and a valid `submitted` proposal whose `expires_at` is still in the future.
- Claim and persist the existing transactional idempotency key inside the same database transaction.
- Serialize acceptance attempts for the parent `representation_quote_requests` row.
- Atomically transition the proposal to `accepted`.
- Use the proposal's server-owned `amount` and `currency` as the authoritative financial values.
- Reuse `generateRepresentationMilestones()` for the existing 30/40/30 model.
- Create `representation_quotes` directly in `funding` state.
- Create the three `representation_milestones` rows.
- Create the unique `escrow_accounts` row for the quote.
- Mark the parent quote request as `converted_to_quote` and link its `quote_id`.
- Commit all internal state atomically.

### Out of scope

- External payment-provider calls.
- Stripe/payment-intent adapters.
- Webhook handling.
- New generic `audit_events` infrastructure.
- Changes to the existing financial calculator rules.
- Agreement/S02.4 orchestration.

## Non-negotiable invariants

1. No client-supplied amount or currency is trusted for acceptance/funding initialization.
2. A proposal must be `submitted` and unexpired to win the acceptance transition.
3. A request can convert to a financial quote only once.
4. Repeated requests with the same idempotency key replay the original successful response.
5. Concurrent acceptance attempts with different idempotency keys yield one winner and one conflict.
6. Quote total equals the milestone total exactly.
7. The quote starts in `funding`; this does not assert that external money has been received.
8. External payment capability starts only after the internal transaction commits.

## Implementation surface

- `artifacts/api-server/src/services/acceptLawyerProposal.ts`
- `artifacts/api-server/src/controllers/lawyerProposals.ts`
- `scripts/src/s02-03-accept-pay-contract-test.ts`
- `scripts/src/s02-03-accept-pay-concurrency-test.ts`
- `scripts/package.json`
