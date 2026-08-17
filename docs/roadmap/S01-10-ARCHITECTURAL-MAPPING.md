# S01-10 — Security & Edge Cases

## Architectural Mapping

- **Roadmap ID:** S01-10
- **Lifecycle:** S01 Smart Scheduling
- **Official scope:** Security & Edge Cases
- **Primary audit domains:** X/5 Client Security, Y/5 Lawyer Security, W/5 Cross-System Security, W/7 Identity & Access
- **Design linkage:** D02-08 i18n / RTL / Devices and D02-09 Visual QA
- **Dependency:** S01-08 Timezone & Localization; S01-09 Calendar UX & D02
- **Explicit exclusions:** no database schema changes, migrations, booking writes, financial logic, or Backfill work

## Security Scope

1. Presentation-layer authorization boundaries for client/lawyer/admin/unauthorized states.
2. Ownership/scope-safe rendering and IDOR-resistant UI contracts.
3. Deterministic handling of retry and duplicate requests at the presentation/API-contract boundary.
4. Safe rendering for UTC, DST transitions, and midnight crossing.
5. Deterministic loading, empty, error, conflict, and replay states.

## Verification Gate

`Repository Validation → Typecheck → Fixtures/Tests → Security Review → CI → Final Diff Audit → Draft PR → Review → Merge → Verify Main`

## Financial Isolation Gate

S01-10 must not create a financial effect. If a future implementation crosses into a financial transition, the FINANCIAL ISOLATION GATE becomes mandatory before implementation.

## Evidence Requirement

The final registry entry must record Branch, PR, tests, security review, CI status, Final Diff Audit, and Verify Main evidence before `CLOSED / VERIFIED`.
