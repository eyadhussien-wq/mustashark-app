# Production Database Emergency Lockdown

Status: ACTIVE

Date: 2026-08-12

Database in scope: `heliumdb`

## Rules

1. `heliumdb` is read-only for the rescue/audit process.
2. No reset, drop, truncate, destructive seed, or schema push is permitted against Production.
3. Database migrations must be reviewed and applied only through an explicitly approved production procedure.
4. All forensic checks must be read-only and must not alter rows, schemas, indexes, or extensions.
5. CI/Auth tests must use an isolated test PostgreSQL database and must never receive the Production `DATABASE_URL`.
6. External development platforms are not authorities for source synchronization or production database changes. The GitHub repository is the source of truth for code during the rescue.
7. Any future unlock of this policy requires an explicit human approval and a documented reason.

## Emergency verification checklist

- Confirm Production `DATABASE_URL` is not injected into CI test jobs.
- Search repository workflows/scripts for destructive database commands.
- Audit Production for duplicate/orphan/inconsistent records using read-only SQL.
- Compare Production schema against the reviewed GitHub schema/migrations before any migration is considered.
- Preserve an auditable backup/snapshot before any approved production mutation.

## External platform synchronization

External development-platform linkage is intentionally treated as untrusted for the rescue workflow. No deployment or correlation identifier may be invented or reused from memory; identifiers must be recorded only when the actual platform provides them.
