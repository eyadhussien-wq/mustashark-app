# S01-03 — Booking State Machine Hardening

Initial implementation scope:

- Persist `Idempotency-Key` claims per authenticated user, route, and method.
- Hash the request payload and reject reuse of a key with a different request.
- Replay the cached status/body after a completed request.
- Add a monotonic `bookings.version` field for optimistic concurrency.
- Enforce expected booking version on the lawyer acceptance transition and return `409` on stale state.
- Add isolated CI coverage for idempotency and explicit migration rehearsal.

The branch remains isolated from `main` until the full verification sequence passes.
