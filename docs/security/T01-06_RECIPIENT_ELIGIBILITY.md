# T01-06 Recipient Eligibility Gate

## Purpose

Document the security dependency identified during CodeRabbit review of PR #24: a document handover recipient must be a verified member of the same case before the handover grants access or delivery authority.

## Current state

- `documents.case_id` and `document_handovers.case_id` are text identifiers.
- The current schema does not expose a dedicated case-membership table or foreign key that can prove recipient membership.
- `recipient_id` is a foreign key to `users.id`, which proves that the user exists but does not prove case membership.

## Required production rule

Before creating a handover, the server must verify all of the following:

1. The recipient user exists and is not deleted.
2. The recipient account is eligible for the requested role/action.
3. The recipient belongs to the same case identified by `case_id`.
4. The membership check is performed server-side before inserting the handover.
5. Failure returns a denial response and no handover record is created.
6. The same membership rule remains authoritative for delivery confirmation.

## Implementation gate

Do not add a production migration or modify `heliumdb` for this document. Implement the membership model against an isolated test database first, then add migration/tests only after the case model is established.

## Merge rule

PR #24 remains open until the recipient eligibility requirement is either implemented against an existing authoritative case-membership model or the missing case-membership model is implemented and tested. This finding is therefore a pre-merge security gate, not a reason to weaken the authorization rule.
