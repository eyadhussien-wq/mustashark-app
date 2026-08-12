# T01-08 — Consultation Documentation, Archive & Printing

## Scope

T01-08 adds a controlled documentation layer for completed legal consultations. It does not delete consultation history and does not execute migrations against `heliumdb`.

## Serial identity

- Every booking/consultation uses the existing server-generated `bookings.serial_number` as its permanent document identifier.
- The identifier is unique and is never reused after cancellation, rejection, refund, or archival.
- The mobile client must never generate or overwrite this identifier.

## Archive lifecycle

- Only terminal consultations may be archived.
- Archiving records `archived_at` and `archived_by`; the consultation row itself remains available for audit and legal reference.
- Clients can read only their own archived consultations.
- Lawyers can read/archive only consultations they own.
- Administrators can read/archive all authorized records.
- Unarchiving and destructive deletion are intentionally outside T01-08.

## Printing / PDF

- The server exposes a permission-checked print-data endpoint.
- The client generates the PDF from server-authoritative data only.
- Export contains the serial number, consultation details, permitted party information, payment/escrow state, attachments as references, and consultation event history.
- Credentials, tokens, passwords, payment secrets, and full request bodies are prohibited from print payloads.
- Each print request records `document.printed` in `consultation_events` with the authenticated actor.

## Attachments

- Attachment names and references are bounded before inclusion in the print payload.
- The system stores references rather than embedding arbitrary client-local content into the server audit trail.
- Resolving/downloading a protected attachment remains subject to its own authorization controls.

## Administration

The admin dashboard must expose archive search, serial-number lookup, archive status, print/export history, and the actor who archived or printed a document. Admin actions remain protected by server-side authorization.

## Required gate

Before T01 closure:

- typecheck the API and mobile workspaces;
- test archive authorization for client, lawyer, and admin;
- test rejection of non-terminal archive requests;
- test duplicate archive requests are idempotent;
- test print-data authorization and secret exclusion;
- test that printing creates an audit event;
- rehearse migration `0007_consultation_archive.sql` on an isolated database only;
- run CI and CodeRabbit review.
