# MUSTASHAREK — P1-B Blueprint

**Roadmap mapping:** S01-09 Calendar UX & D02
**Parent:** P1-A / Calendar-Agenda Presentation Foundation
**Constraint:** Presentation-only. No database migration, backfill, or changes to PR #55.

## Scope
- Build the next presentation-layer scheduling components on top of the canonical Agenda Read Model/Contract delivered by P1-A.
- Provide reusable calendar/agenda views for client and lawyer surfaces.
- Preserve UTC as the canonical input to presentation adapters; localize only at the presentation boundary.
- Cover timezone, DST, midnight-crossing, empty/loading/error, and role-specific presentation fixtures.

## Security / architecture gates
- Read-model/contract only; no financial mutation.
- No direct database access from presentation components.
- No change to S01-08 migration/backfill code.
- Role boundaries remain enforced by existing API contracts; UI visibility is not an authorization mechanism.

## Verification
- Repository validation against main.
- Typecheck.
- Presentation fixtures/tests.
- UTC/DST/midnight-crossing tests.
- Final diff audit.
- CI.
- PR remains Draft until review approval.
