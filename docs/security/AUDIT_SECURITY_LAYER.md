# Audit / Security Layer

## Purpose

Define a production-safe audit trail for authentication, authorization, account-state, administrative, booking, and financial security events.

This document is a specification only. It does **not** modify the Production database.

## Production safety

- Never run destructive schema commands against `heliumdb`.
- Audit storage must be migrated and tested against an isolated test database first.
- Audit failures must never grant access or silently bypass authorization.
- Sensitive secrets, passwords, password hashes, session tokens, JWTs, payment credentials, and full request bodies must never be recorded.
- The same secret policy applies to `metadata`, `admin_audit_logs.before_data`, and `admin_audit_logs.after_data`: use an explicit allowlist of safe keys and reject or redact forbidden keys such as `password`, `passwordHash`, `token`, `accessToken`, `refreshToken`, `authorization`, `cookie`, `secret`, `apiKey`, payment credentials, and request/response bodies.

## Audit stores and compatibility

The application already has `admin_audit_logs`, with a text `id`, `admin_id`, `action`, `entity_type`, `entity_id`, `description`, `before_data`, `after_data`, and `created_at`. The proposed `security_audit_events` store does **not** replace it automatically.

Until an approved migration exists, the two stores have distinct ownership:

- `admin_audit_logs` remains the historical/admin audit store and its existing records must be preserved unchanged.
- `security_audit_events` is the proposed security-event store for authentication, authorization, account-state, booking, and financial security telemetry.
- A future consolidation may use a UUID primary key for `security_audit_events`, while preserving the original `admin_audit_logs.id` as a legacy/source identifier. No history may be dropped or silently rewritten.
- Field mapping for a future consolidation is: `admin_id` → `actor_user_id`; `entity_id` → `target_user_id` when the entity is a user, otherwise retain it in event metadata; `action` → `event_type`; `created_at` → `occurred_at`; `before_data`/`after_data` → explicitly allowlisted metadata fields after redaction. `entity_type` and `description` remain metadata unless a future schema promotes them to first-class fields.
- Until consolidation is explicitly approved, existing admin audit read paths remain authoritative for admin history, while security-event read paths are authoritative for `security_audit_events`. There must be no dual-write requirement introduced by this specification.

## Proposed table: `security_audit_events`

Recommended fields:

- `id` — UUID primary key.
- `occurred_at` — timestamptz, server-generated.
- `event_type` — controlled security event name.
- `severity` — `info | warning | critical`.
- `actor_user_id` — nullable UUID for authenticated actor.
- `target_user_id` — nullable UUID when an event concerns another account.
- `request_id` — nullable correlation identifier.
- `source` — `api | admin | system | job`.
- `ip_address` — nullable PII-bearing field; collect only when operationally justified.
- `user_agent` — nullable PII-bearing field; collect only when operationally justified.
- `metadata` — JSONB containing only allowlisted, non-secret structured context.

## Privacy, retention, and access

Unless a documented incident/legal requirement requires a shorter or longer period, security audit records are retained for **180 days**. PII-bearing `ip_address` and `user_agent` are retained for **30 days**, then irreversibly anonymized or deleted by a controlled maintenance job. Existing `admin_audit_logs` records are preserved; any future retention change must be reviewed before execution.

Permitted readers:

- `security_audit_events`: security/audit service role and explicitly authorized admin/security roles only.
- `admin_audit_logs`: existing admin audit readers plus explicitly authorized security/audit roles.
- Application users and ordinary client/lawyer roles must never have direct read access to either audit store.

Any deletion/anonymization operation must be performed by a dedicated maintenance role under an approved retention job. It must never be exposed as a user-facing API operation.

## Event classes

### Authentication

- `auth.login.success`
- `auth.login.failure`
- `auth.logout`
- `auth.token.rejected`
- `auth.session.expired`
- `auth.account.restricted`
- `auth.account.suspended`

### Authorization

- `authz.denied`
- `authz.role_mismatch`
- `authz.resource_ownership_denied`
- `authz.admin_access_denied`

### Account changes

- `account.created`
- `account.status.changed`
- `account.role.changed`
- `account.deleted`

### Administrative

- `admin.permission.changed`
- `admin.role.changed`
- `admin.sensitive_action`

### Booking / financial security

- `booking.authorization.denied`
- `booking.status.changed`
- `booking.price.server_authority_violation`
- `financial.refund.created`
- `financial.refund.duplicate_blocked`
- `financial.commission.changed`

Required metadata for financial events:

- `financial.refund.created`: `refund_id`, `booking_id`, `account_id`, `amount`, `currency`, and `idempotency_key`.
- `financial.refund.duplicate_blocked`: `booking_id`, `account_id`, `existing_refund_id` when known, and `idempotency_key`.
- `financial.commission.changed`: `commission_id` when available, `booking_id`, `account_id`, `old_amount`, `new_amount`, `currency`, and `idempotency_key` when the operation can be retried.

Identifiers must be server-derived. `idempotency_key` must be unique for the logical financial operation. Retries using the same key must resolve to the same logical event rather than create an indistinguishable duplicate. A duplicate attempt may be logged as `financial.refund.duplicate_blocked` without mutating the original financial record.

## Required security properties

1. Server-generated timestamps; clients cannot choose event time.
2. Actor identity comes from authenticated server context, never from client claims alone.
3. Authorization failures are logged without exposing credentials or secrets.
4. Audit writes have an explicit failure policy by event class:
   - **Blocking / atomic:** `account.role.changed`, `account.status.changed`, `admin.permission.changed`, `admin.role.changed`, `admin.sensitive_action`, `financial.refund.created`, `financial.refund.duplicate_blocked`, and `financial.commission.changed`. The business mutation and required audit insert occur in the same database transaction where technically possible; if the audit insert fails, the transaction rolls back. No asynchronous retry may claim success before durable audit storage exists.
   - **Best-effort / non-blocking:** `auth.login.success`, `auth.logout`, `auth.session.expired`, and ordinary informational telemetry. An audit-store outage must not prevent the user-facing operation, but the failure must be emitted to protected operational logs and retried with bounded backoff where supported.
   - **Fail-closed authorization events:** `authz.denied`, `authz.role_mismatch`, `authz.resource_ownership_denied`, and `authz.admin_access_denied` must never turn a denied operation into an allowed operation. If policy requires a durable audit record and storage is unavailable, the protected operation remains denied; no fallback grants access.
5. Audit records are append-only. Application code exposes no arbitrary update/delete endpoints.
6. Database enforcement must provide insert-only permissions to the application audit writer role. The application writer may `INSERT` but may not `UPDATE` or `DELETE` audit rows. The maintenance role may perform only the approved retention anonymization/deletion job; ordinary application and admin roles receive no direct mutation privileges. Direct SQL access must use a controlled database role; the default application role must not have update/delete rights. These grants must be verified by an isolated test database before Production migration.
7. Correlation IDs must allow an incident to connect API logs, security events, and relevant business events without storing secrets.
8. JSONB audit payloads use the same explicit allowlist/redaction policy across `metadata`, `before_data`, and `after_data`; full request/response bodies are prohibited.

## Implementation gate

Before Production migration:

- implement on isolated test DB;
- typecheck;
- run migrations against isolated DB;
- test successful and failed authentication;
- test wrong-role and ownership denial;
- test admin authorization;
- test booking/financial security events;
- test forbidden-key submission against `metadata`, `before_data`, and `after_data`, verifying rejection or deterministic redaction;
- inject an audit-store/database failure and verify the expected fail-closed rollback for blocking events and the documented bounded retry/non-blocking behavior for best-effort events;
- verify that an authorization failure can never become an allow decision when audit storage is unavailable;
- verify database roles can insert audit rows but cannot update/delete them, while the controlled retention role alone can perform approved anonymization/deletion;
- run security scanners;
- review migration SQL manually;
- verify retention/anonymization jobs and permitted reader roles;
- only then prepare a separately reviewed Production migration.
