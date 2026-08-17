# P1-A — Calendar / Agenda Presentation Foundation

## Architectural mapping

- Roadmap: P1 Scheduling continuation
- Scope: presentation layer only
- Explicitly excluded: database schema, migrations, backfill, booking write paths, PR #55

## Contract

`AgendaReadModel` groups immutable UTC instants into local calendar days using an explicit IANA timezone. The presentation layer owns date/time rendering; it does not infer or mutate booking persistence fields.

## Fixture coverage

- UTC presentation
- Asia/Amman UTC offset presentation
- Europe/London DST transition
- Local midnight crossing
- UTC ordering within a local day

## Verification boundary

All fixtures are deterministic and presentation-only. No database connection, migration, backfill, or production booking mutation is required by P1-A.
