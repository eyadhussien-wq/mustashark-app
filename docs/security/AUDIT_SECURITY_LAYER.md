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

### Legacy audit-row remediation

The existing `admin_audit_logs.before_data` and `after_data` rows are historical records and must retain their original row identity. The new redaction policy applies to **new writes by default**. If an approved privacy/security review finds forbidden keys in legacy rows, remediation must be performed by a dedicated maintenance process that updates the same row identity, records the remediation action in protected operational/audit logs, and preserves an explicit indication that historical payloads were redacted. No legacy row may be silently deleted or replaced with a new row merely to hide residual exposure. The remediation must be rehearsed on an isolated database before Production execution.

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
- `metadata` — JSONB containing only allowlisted, non-secret structured context. It must **not** contain copies of `ip_address` or `user_agent`; those values, when collected, remain in their dedicated fields and follow the same 30-day anonymization/deletion schedule.

## Privacy, retention, and access

Unless a documented incident/legal requirement requires a shorter or longer period, security audit records are retained for **180 days**. PII-bearing `ip_address` and `user_agent` are retained for **30 days**, then irreversibly anonymized or deleted by a controlled maintenance job. `metadata` must not duplicate either PII field and therefore must not be used to bypass the 30-day retention rule. Existing `admin_audit_logs` records are preserved; any future retention change must be reviewed before execution.

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
- `financial.refund.duplicate_blocked`: `booking_id`, `account_id`, `existing_refund_id` when known, `original_operation_id` when known, and `idempotency_key`.
- `financial.commission.changed`: `commission_id` when available, `booking_id`, `account_id`, `old_amount`, `new_amount`, `currency`, and `idempotency_key` when the operation can be retried.

Identifiers must be server-derived. Every retryable financial mutation must have a first-class operation identity (for example an `operation_id`/deduplication record) with a database-level unique constraint over the logical operation and idempotency key. Retries using the same key must resolve to the same logical operation. `financial.refund.duplicate_blocked` must reference the original operation/refund when known rather than creating an unrelated event identity. A duplicate attempt may be logged without mutating the original financial record.

## Event-to-failure-policy matrix

| Event class | Events | Failure policy | Business operation may succeed if audit store is unavailable? |
|---|---|---|---|
| Authentication success/telemetry | `auth.login.success`, `auth.logout`, `auth.session.expired` | Best-effort, protected operational log, bounded retry | Yes |
| Authentication failure/security state | `auth.login.failure`, `auth.token.rejected`, `auth.account.restricted`, `auth.account.suspended` | Best-effort unless the surrounding authorization policy explicitly requires durability; never convert a denial into an allow | Yes, only when the business operation is otherwise permitted |
| Authorization denial | `authz.denied`, `authz.role_mismatch`, `authz.resource_ownership_denied`, `authz.admin_access_denied`, `booking.authorization.denied` | Fail-closed; if durable audit is required and unavailable, keep the protected operation denied | **No for the denied operation** |
| Account mutation | `account.created`, `account.status.changed`, `account.role.changed`, `account.deleted` | Blocking/atomic; transaction rollback if required audit insert fails | No |
| Administrative mutation | `admin.permission.changed`, `admin.role.changed`, `admin.sensitive_action` | Blocking/atomic; transaction rollback if required audit insert fails | No |
| Booking mutation | `booking.status.changed`, `booking.price.server_authority_violation` | Blocking/atomic where the event is part of the protected business mutation; server authority violations remain denied | No for the protected mutation |
| Financial mutation | `financial.refund.created`, `financial.refund.duplicate_blocked`, `financial.commission.changed` | Blocking/atomic; durable operation identity plus audit obligation required | No |

This matrix is normative for the proposed audit layer. `booking.authorization.denied` is explicitly a deny decision and must remain denied if audit storage is unavailable; audit failure must never become a fallback grant.

## Required security properties

1. Server-generated timestamps; clients cannot choose event time.
2. Actor identity comes from authenticated server context, never from client claims alone.
3. Authorization failures are logged without exposing credentials or secrets.
4. Audit writes have the failure policy defined by the event-to-failure-policy matrix above.
   - **Blocking / atomic:** account, administrative, and financial mutations require the business mutation and required audit insert in the same database transaction where technically possible. If the audit insert fails, the transaction rolls back.
   - **Durable cross-service fallback:** when a shared database transaction is not technically possible, a transactional outbox or equivalent durable operation record is required before the business operation reports success. Reconciliation must confirm the audit obligation before success is returned; an audit-store failure must not leave a committed financial/business mutation with no durable audit obligation.
   - **Best-effort / non-blocking:** informational authentication telemetry may proceed when audit storage is unavailable, but the failure must be emitted to protected operational logs and retried with bounded backoff where supported.
   - **Fail-closed authorization events:** denied operations remain denied whenever policy requires a durable audit record and the audit store is unavailable.
5. Audit records are append-only. Application code exposes no arbitrary update/delete endpoints.
6. Database enforcement must provide insert-only permissions to the application audit writer role. The application writer may `INSERT` but may not `UPDATE` or `DELETE` audit rows. The maintenance role may perform only the approved retention anonymization/deletion job; ordinary application and admin roles receive no direct mutation privileges. Direct SQL access must use a controlled database role; the default application role must not have update/delete rights. These grants must be verified by an isolated test database before Production migration.
7. Correlation IDs must allow an incident to connect API logs, security events, and relevant business events without storing secrets.
8. JSONB audit payloads use the same explicit allowlist/redaction policy across `metadata`, `before_data`, and `after_data`; full request/response bodies are prohibited, and `metadata` must not duplicate dedicated PII fields.
9. Retryable financial operations must have a database-enforced unique operation identity so duplicate attempts resolve to one logical business operation and can be linked to the original audit event.

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
- test that `metadata` cannot duplicate `ip_address` or `user_agent` and that the 30-day PII retention rule is enforced;
- inject an audit-store/database failure and verify the expected fail-closed rollback for blocking events and the documented bounded retry/non-blocking behavior for best-effort events;
- verify that an authorization failure, including `booking.authorization.denied`, can never become an allow decision when audit storage is unavailable;
- verify database roles can insert audit rows but cannot update/delete them, while the controlled retention role alone can perform approved anonymization/deletion;
- test the financial operation identity/unique constraint and verify duplicate retries resolve to the original operation and audit reference;
- rehearse the approved legacy-row remediation path on an isolated database;
- run security scanners;
- review migration SQL manually;
- verify retention/anonymization jobs and permitted reader roles;
- only then prepare a separately reviewed Production migration.

## Security addendum — normative implementation boundaries

### Legacy remediation role and append-only exception

The normal application audit writer and ordinary admin roles remain insert-only. A separately scoped `audit_legacy_remediation` maintenance role is the **only** role permitted to update an existing `admin_audit_logs` payload for an approved legacy-redaction case. It may update only the specific row identified by `admin_audit_logs.id`, only the approved `before_data`/`after_data` payload fields, and only within a rehearsed maintenance job. It may not delete rows, change row identity, alter unrelated fields, or perform general-purpose updates. Every remediation action must emit a protected operational event containing the original row ID, reason/ticket, actor/service identity, timestamp, redaction result, and resulting redaction marker. This is an explicit, narrowly scoped exception to append-only preservation and must be verified as a distinct database privilege in the isolated privilege test.

### Lossless legacy identity mapping

A future consolidation must add `legacy_source_store` and `legacy_source_id` to `security_audit_events` (or an equivalently constrained mapping table). For migrated `admin_audit_logs`, `legacy_source_store = 'admin_audit_logs'` and `legacy_source_id = admin_audit_logs.id`; the original source ID is never discarded. The UUID `security_audit_events.id` is a new event identity, not a replacement for the historical ID.

Because current `users.id` and `admin_audit_logs.admin_id` are text values, `admin_id` may populate `actor_user_id` only when it is a valid, authoritative UUID that resolves to an existing user. Provider-prefixed, local, malformed, or otherwise unmapped IDs remain losslessly represented in `legacy_source_id`/metadata and produce a documented `unmapped_actor` migration status; they must never be coerced into a fabricated UUID. A valid UUID that does not resolve to a current user is preserved as the legacy actor value and leaves `actor_user_id` null. The consolidation report must include counts for mapped, unmapped, and invalid identities and require explicit review of the unmapped set before completion.

### Canonical metadata allowlist and recursive validation

`metadata` is an allowlist, not a denylist. The canonical top-level keys are: `request_id`, `source`, `entity_type`, `entity_id`, `description_code`, `ip_hash`, `operation_id`, `idempotency_key`, `booking_id`, `account_id`, `refund_id`, `existing_refund_id`, `original_operation_id`, `commission_id`, `amount`, `old_amount`, `new_amount`, and `currency`. Event-specific required keys listed above are permitted only for their corresponding event types. Unknown keys are rejected; case variants are rejected rather than normalized into an allowed key.

Values must be scalar strings/numbers/booleans or explicitly defined bounded objects for event-specific structured data. Nested objects and arrays are recursively validated against the same allowlist; arbitrary `request`, `response`, `headers`, `cookies`, `authorization`, credentials, tokens, secrets, payment data, or free-form payload objects are rejected at any depth. `ip_address` and `user_agent` are never accepted in metadata under any spelling/case variant. `before_data` and `after_data` use an equally explicit allowlist and the same recursive validation/redaction rules. The implementation gate must include unknown-key, case-variant, and nested-secret rejection tests.

### Financial uniqueness scope

For retryable financial operations, the database uniqueness key is the tuple `(account_id, operation_type, target_resource_id, idempotency_key)`, where `target_resource_id` is the booking/refund/commission target when applicable and is nullable only for operation types that have no target resource. `operation_type` is a controlled value such as `refund.create` or `commission.change`. This scope prevents cross-account collisions while guaranteeing that concurrent retries for the same account, operation, target, and idempotency key resolve to one operation record. `financial.refund.duplicate_blocked` stores the resulting `operation_id` and original `refund_id` when available. The concurrency test must issue simultaneous retries and assert exactly one financial mutation and one linked audit operation.

### Non-transactional durability and failure-injection test

When a shared database transaction cannot cover the business mutation and audit store, the business service must first persist a durable outbox/operation record containing the operation identity, business mutation reference, audit event type, canonical metadata, and reconciliation status. A success response is forbidden until that durable obligation exists. Failure-injection testing must force the downstream audit write to fail after the business mutation request is accepted, assert that no success is returned without the durable obligation, then run reconciliation and verify that the recorded audit obligation is replayed exactly once. Reconciliation itself must be idempotent by `operation_id`.
