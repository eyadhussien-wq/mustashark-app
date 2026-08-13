# T01-08 Consultation Documentation Security

## Scope

Consultation archive and print/export are server-authoritative features. The client does not decide whether a consultation is archivable or which data may be printed.

## Authorization

- Archive listing is restricted to authenticated client/lawyer/admin users and filtered by ownership for non-admin users.
- Archive mutation is restricted to lawyer/admin users and additionally checks booking ownership for lawyers.
- Print data and print-export require authentication and client/lawyer/admin role membership, then enforce booking ownership.

## State and audit controls

- Only terminal consultation statuses can be archived.
- Archiving is idempotent and guarded by `archived_at IS NULL`.
- Archive operations create consultation events; admin actions also create admin audit logs.
- Print-data access and print-export create consultation audit events.

## Data minimization

Print metadata is allowlisted and truncated. Attachments are limited to bounded name/URI strings. The PDF is generated from server-authorized data.

## Database

Migration `0007_consultation_archive.sql` adds archive metadata and a partial index. CI rehearses this migration against an isolated PostgreSQL database. It must not be applied to Production/`heliumdb` during development.
