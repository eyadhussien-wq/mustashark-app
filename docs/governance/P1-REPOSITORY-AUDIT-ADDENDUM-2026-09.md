# P1 Repository Audit — Addendum
## Case / Agreement Coupling Finding — 2026-09

**Audited source:** `main` commit `93378a1f72517ab3dedd0eef06499d4d8f4094ce`

## Finding A — Cases are not currently a pure Neutral Core domain

`lib/db/src/schema/cases.ts` defines `casesTable`, but each case requires an `agreementId` referencing `agreements`.

`lib/db/src/schema/agreements.ts` in turn references `representationQuotesTable` from `representationFinance.ts`.

Therefore the current case model has a transitive dependency on the legacy representation/financial domain.

**Classification:** `ISOLATE / REPLACE BOUNDARY`

### Engineering consequence

We should **not** import the existing `casesTable` into a new Neutral Core Lawyer OS workflow merely because its name is neutral. The dependency chain currently crosses into the blocked representation/financial model.

For Lawyer OS v1, a neutral Matter/Workspace model should be designed with no dependency on:

- representation quotes;
- escrow;
- commission;
- professional-fee settlement;
- lawyer wallet;
- client-funds state.

The existing `cases` domain remains preserved as historical/model-dependent functionality until a deliberate migration decision is made.

## Finding B — Existing identity schema contains mixed concerns

`lib/db/src/schema/users.ts` is a useful identity foundation, but it currently combines identity/lifecycle data with professional-discovery attributes such as `hourlyRate`, `rating`, and `reviewsCount`.

**Classification:** `HARDEN`

No destructive schema change is authorized merely from this observation. The P2 design should establish which fields belong to Neutral Core identity versus future P5 discovery/Marketplace semantics.

## Finding C — Booking state is financially coupled

The existing booking schema/state machine includes `paymentStatus` and `escrowStatus`, and controllers such as `safeConfirmBooking` and `safeCancelBooking` enforce financial states.

**Classification:** `ISOLATE`

Pure availability/scheduling capabilities may be reused, but Lawyer OS v1 must not inherit financial state as a prerequisite for ordinary workspace operations.

## P1 decision update

The cleanest Lawyer OS v1 architecture is therefore **not** a thin rename of the existing consultation/representation flow.

It should be a neutral workspace layer built around:

`Lawyer → Clients → Matters → Documents → Appointments → Messages → Audit → Export`

with professional-fee and financial domains outside the dependency graph.

**Addendum status:** `CONFIRMED BY REPOSITORY READ-ONLY AUDIT`
