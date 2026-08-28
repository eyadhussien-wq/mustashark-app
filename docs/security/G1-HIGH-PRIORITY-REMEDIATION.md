# G1 High-Priority Security Remediation

## Scope
This gate covers authorization, data minimization, production demo isolation, and financial authority for Mustashark.

## Implemented in this step

### 1. Production demo isolation
`safeBooking.ts` no longer resolves `lawyer-test` or `lawyer-demo` through hard-coded demo email fallbacks. Lawyer resolution is now exclusively by an active, non-deleted lawyer record identified by the authenticated request's selected lawyer ID.

### 2. Booking response minimization
The safe booking creation endpoint now returns an explicit booking DTO instead of spreading the complete database booking row into the API response. This establishes a deny-by-default output boundary for future sensitive columns.

### 3. Server-authoritative booking price
The booking price remains derived from the server-side lawyer record rather than from client input.

### 4. Transactional booking protection
The booking creation path retains the database transaction, advisory lock, availability validation, overlap check, and server-generated identifiers.

## Existing controls verified during review

- Booking routes require authentication and role checks.
- Booking confirmation requires lawyer/admin authorization, paid payment state, held escrow, optimistic version matching, and transactional idempotency.
- Financial state transitions are performed inside database transactions.
- Consultation events provide an audit trail for important state changes.

## Remaining G1 work

- Replace broad `select().from(usersTable)` usage in all sensitive paths with explicit server DTO projections where applicable.
- Complete authorization/IDOR review for every booking endpoint.
- Remove production Demo/Sample data and local fallback behavior from the mobile data layer.
- Move refund, wallet, payout, commission, and attendance authority completely to server-side services.
- Add automated red tests for IDOR, role escalation, sensitive-field exposure, duplicate financial operations, and client-side financial tampering.
- Verify CI typecheck/build/security gates before merging to `main`.

## Verification status

- Production demo fallback removal: **IMPLEMENTED**
- Booking response minimization: **IMPLEMENTED**
- Full G1 security gate: **NOT YET VERIFIED**

No production-security claim is made until the remaining controls pass automated and repository-level verification.
