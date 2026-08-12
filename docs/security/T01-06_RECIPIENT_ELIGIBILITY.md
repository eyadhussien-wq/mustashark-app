# T01-06 Recipient Eligibility Gate

## Purpose

Document the security dependency identified during CodeRabbit review of PR #24: a document handover recipient must be a verified member of the same case before the handover grants access or delivery authority.

## Production-authoritative model

T01-06 now defines `case_memberships` as the authoritative membership store for this authorization boundary.

- `case_id` identifies the legal case.
- `user_id` identifies the member.
- `role` is `client`, `lawyer`, or `authorized_representative`.
- `status` must be `active` for access to be granted.
- The user must also have an active, non-deleted account.
- `(case_id, user_id)` is unique so membership cannot be duplicated silently.

The existing `recipient_id -> users.id` foreign key remains useful for referential integrity, but it is not considered proof of case membership by itself.

## Required production rule

Before creating a handover, the server must verify all of the following:

1. The recipient user exists and is not deleted.
2. The recipient account is active.
3. The recipient has an active membership in the same `case_id`.
4. The membership check is performed server-side before inserting the handover.
5. Failure returns a denial response and no handover record is created.
6. Delivery confirmation repeats the same membership check inside its transaction before OTP acceptance.
7. Administrators are the explicit operational bypass and are still protected by the existing admin authorization middleware.

## Migration safety

The migration defining `case_memberships` is repository code only. It must be rehearsed against an isolated test database before any production application. Do not run migration, reset, seed, or destructive schema commands against `heliumdb`.

## Merge rule

PR #24 remains open until the membership model and both authorization paths are validated by typecheck/tests and CI. This finding is a pre-merge security gate, not a reason to weaken the membership rule.
