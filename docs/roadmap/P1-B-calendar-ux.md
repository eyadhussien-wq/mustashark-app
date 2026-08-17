# P1-B — Calendar UX & D02

## Architectural mapping

- Roadmap: P1 Scheduling continuation
- Parent: P1-A Calendar-Agenda Presentation Foundation
- Security boundary: presentation/read-model only
- S01-08 / PR #55: explicitly excluded

## Implementation

P1-B adds a deterministic calendar grid over the P1-A `AgendaReadModel`. Calendar grouping consumes already-localized `dateKey` values while item times are formatted from immutable UTC instants using the model's IANA timezone.

The same presentation component is reusable for client and lawyer surfaces; role authorization remains an API concern and is not inferred from UI visibility.

## Fixture coverage

- Sunday-first month grids
- Five-row and six-row months
- Previous/next-month boundary cells
- Local calendar-day grouping
- UTC-preserving presentation through the existing timezone formatter

## Explicit exclusions

- No database access
- No migration
- No backfill
- No booking write-path changes
- No changes to PR #55
