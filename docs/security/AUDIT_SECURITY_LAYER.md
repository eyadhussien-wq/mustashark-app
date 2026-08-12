# Audit / Security Layer

## Purpose

Define a production-safe audit trail for authentication, authorization, account-state, administrative, booking, and financial security events.

This document is a specification only. It does **not** modify the Production database.

## Production safety

- Never run destructive schema commands against `heliumdb`.
- Audit storage must be migrated and tested against an isolated test database first.
- Audit failures must not grant access or silently bypass authorization.
- Sensitive secrets, passwords, password hashes, session tokens, JWTs, payment credentials, and full request bodies must never be recorded.

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
- `ip_address` — nullable, subject to retention/privacy policy.
- `user_agent` — nullable, subject to retention/privacy policy.
- `metadata` — JSONB containing only non-secret structured context.

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

## Required security properties

1. Server-generated timestamps; clients cannot choose event time.
2. Actor identity comes from authenticated server context, never from client claims alone.
3. Authorization failures are logged without exposing credentials or secrets.
4. Audit writes must not alter the authorization decision: a failed audit insert must fail closed for security-sensitive operations where required by policy.
5. Audit records are append-oriented; application code must not expose arbitrary update/delete endpoints.
6. Retention and access to audit data must be explicitly controlled.
7. Correlation IDs must allow an incident to connect API logs, security events, and relevant business events without storing secrets.

## Implementation gate

Before Production migration:

- implement on isolated test DB;
- typecheck;
- run migrations against isolated DB;
- test successful and failed authentication;
- test wrong-role and ownership denial;
- test admin authorization;
- test booking/financial security events;
- run security scanners;
- review migration SQL manually;
- only then prepare a separately reviewed Production migration.
