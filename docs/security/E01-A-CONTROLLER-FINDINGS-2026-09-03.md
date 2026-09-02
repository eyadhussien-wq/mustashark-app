# E01-A — Controller/Service Findings

Date: 2026-09-03  
Branch: `security/e01-foundation-2026-09-03`

## Purpose

This file records the second pass after the route matrix. A route is not marked secure solely because middleware is present. The inspected controller/service must enforce the object boundary.

## Verified — no repair required in this pass

### Bookings
- Booking creation binds the client owner to the authenticated actor rather than trusting a client-supplied owner identifier.
- Booking detail access checks the authenticated actor against `clientId` or `lawyerId`.
- Upcoming-booking reads scope by authenticated ownership, with admin as the platform-wide exception.
- Safe cancellation checks that the actor is the booking client or lawyer.
- Lawyer no-show refund checks that the actor is the booking client.

These are preserved. No speculative refactor is authorized from this audit alone.

### Representation proposals
The proposal controller/service already binds:
- proposal creation to the authenticated lawyer;
- proposal creation to the assigned/request-eligible lawyer;
- proposal listing to the request client or an assigned/own-proposal lawyer;
- proposal reads to the request client or the proposal-owning lawyer;
- reject/withdraw actions to the correct client/lawyer actor;
- `requestId` and `proposalId` together when loading the target proposal.

No repair is authorized from the current evidence.

### Legal-representation documents
The service enforces agreement access for client/lawyer/admin and additionally restricts upload types by actor role. Document read/list/submit/review/verify/reject/supersede operations re-check agreement access. No repair is authorized from the current evidence.

### Cases
Case creation checks the agreement actor, active lawyer state, and current professional verification. Case reads enforce owner/member access. Case transitions enforce role-specific actor ownership. No repair is authorized from the current evidence.

### Case hearings
Hearing creation/transition checks the case lawyer/admin write boundary and binds `hearingId` to `caseId`. Hearing listing checks case access using owner/member membership. No repair is authorized from the current evidence.

### Document handovers
Handover creation verifies document ownership, document/case consistency, and active case membership for the recipient. Handover reads verify document owner/requester/recipient access. Status and tracking operations are restricted to admin/operator scope in the inspected controller. Delivery additionally verifies the recipient and active case membership, with OTP controls. No repair is authorized from the current evidence.

### Notifications
Notification listing is scoped to `notifications.userId = authenticated actor`. Mark-read updates require both notification ID and authenticated `userId`. No repair is authorized from the current evidence.

### Financial milestone funding
Milestone funding joins milestone → quote → escrow and verifies `quote.clientId === authenticated client`. Amount and currency are server-derived, and the mutation is transactional/idempotent. No authorization repair is authorized from the current evidence.

### Professional approval boundary
`requireApprovedLawyer` checks the current DB verification status for lawyer actors and is intentionally neutral for non-lawyer actors so mixed-role routes can compose safely. Case creation independently re-checks professional approval in its transaction. No repair is authorized from the current evidence.

## Still open — inspection required before any code change

The following remain audit targets because route/controller evidence has not yet been fully proven in this pass:

1. Auth entry points (`/auth/social`, `/auth/local-auth`) and portal-role enforcement.
2. Booking confirm/join/complete/dispute and all no-show transfer paths.
3. Availability privacy/publication boundary.
4. Profile and bank-account/verification self-scope.
5. Consultation archive/print/export object authorization.
6. Agreements object-level access and version-to-agreement binding.
7. Payment-proof proof-to-booking binding for confirm/reject.
8. Representation quote-request object access.
9. Remaining milestone release/refund/proof/release-request paths.
10. Admin object-target operations and sensitive-field minimization.

## Repair rule

No file is modified merely because a route is listed as `Audit required` or `High` in the matrix. A repair may be made only after the underlying controller/service proves a real authorization defect.

## E01-A status

**IN PROGRESS — NOT CLOSED.**

The route matrix is committed. The verified set above produced **no confirmed authorization defect requiring a code repair**. The remaining targets must be inspected before E01-A can be closed and before E01-B begins.
