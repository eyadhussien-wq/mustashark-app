# S01-07 — Upcoming Consultations

## Architectural mapping

- Roadmap sector: `S01-07`
- Scope: Upcoming Consultations API + reminder-delivery deduplication foundation.
- Security gate: authenticated user scope; client/lawyer/admin may only receive bookings they are entitled to see.
- Concurrency gate: reminder delivery claim is database-unique and therefore safe under concurrent workers.
- Extensibility: reminder deliveries are keyed by channel (`in_app`, `email`, `whatsapp`, future channels) without changing the table shape.

## Implemented boundary

- `GET /bookings/upcoming` is read-only and has no notification side effects.
- Upcoming results are server-derived from the authenticated user's booking ownership and scheduled occurrence.
- Reminder deliveries are claimed independently by a scheduler/worker through the S01-07 delivery ledger.
- Dedupe identity is `bookingId + recipientUserId + channel + reminderType + scheduledOccurrence` and is enforced by PostgreSQL uniqueness.
- No external notification provider or scheduler is introduced in this slice.
