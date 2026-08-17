# S01-08 Phase A — Verification Record

## Scope

- Roadmap: `S01-08 — Timezone & Localization`
- Phase: `A — Schema + Dual-Writing`
- Strategy: non-destructive migration; legacy scheduling fields retained.

## Implemented

1. Added nullable `scheduled_at_utc` and `scheduled_timezone` to `bookings`.
2. Added nullable `scheduled_at_utc` and `scheduled_timezone` to `booking_time_blocks`.
3. Added `lib/db/migrations/0001_s01_08_timezone_localization.sql` using additive `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` statements.
4. Updated `createBookingSafely` so the legacy fields and new UTC/timezone fields are written in the same database transaction.
5. The time-block row is dual-written in that same transaction as the booking row.
6. No backfill, no destructive alteration, and no `NOT NULL` constraint was introduced in Phase A.

## Verification Status

- Repository diff: pending local/CI execution.
- Typecheck: pending local/CI execution.
- Migration execution against a provisioned database: pending.
- Backfill: intentionally deferred to the next approved phase.

## Architectural Safety

The legacy `scheduled_date` / `scheduled_time` fields remain intact. New writes populate both representations atomically. A failed transaction therefore cannot leave a booking and its time block with only one representation committed.
