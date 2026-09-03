# E01-A — Route Authentication & Authorization Matrix

Date: 2026-09-03  
Branch: `security/e01-foundation-2026-09-03`  
Canonical main baseline: `93378a1f72517ab3dedd0eef06499d4d8f4094ce`

## Audit rule

Route middleware is **not** accepted as proof of object-level authorization. For every parameterized or sensitive route, the controller/service must prove ownership, membership, actor relationship, or explicit administrative authority.

Legend:
- **Auth**: `Public` / `requireAuth` / `requireAdmin`
- **Role**: route-level role guard; `—` means no role restriction at route layer
- **Approved Lawyer**: `Yes` when `requireApprovedLawyer` is present; `N/A` when not a lawyer-gated action
- **Owner/Member**: required object-level relationship
- **Controller Check**: `Confirmed` only where the controller/service was inspected and the relationship check was evidenced; otherwise `Audit required`
- **IDOR Risk**: `Low` only when no user-controlled object boundary exists or the boundary is already proven; `Review` means object-level proof is still required; `High` means route exposes a sensitive object/action and current route layer does not prove access
- **Test Required**: negative authorization/BOLA test expected before E01-E closure

## Central registry

`artifacts/api-server/src/routes/index.ts` mounts 26 route modules. `/healthz` is intentionally public. The matrix below is the route-level inventory for the mounted API surface.

## Matrix

| METHOD | PATH | Auth | Role | Approved Lawyer | Owner/Member | Controller Check | IDOR Risk | Test Required |
|---|---|---|---|---|---|---|---|---|
| GET | `/healthz` | Public | — | N/A | None | Confirmed: static health response | Low | Public health smoke |
| POST | `/auth/social` | Public | — | N/A | Provider identity | Audit required | High | Invalid/unverified social identity |
| POST | `/auth/local-auth` | `enforcePortalRole` | Portal-selected | N/A | Account identity | Audit required | High | Wrong portal/role + inactive/deleted user |
| GET | `/profile` | `requireAuth` | client/lawyer | N/A | Self | Audit required | Review | Cross-user profile access impossible by path, but response fields require test |
| PATCH | `/profile` | `requireAuth` | client/lawyer | N/A | Self | Audit required | Review | Attempt protected/sensitive field mutation |
| GET | `/profile/pending-changes` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cross-user pending-change isolation |
| GET | `/profile/bank-account` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cross-user bank-account isolation |
| PUT | `/profile/bank-account` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cross-user bank-account mutation |
| GET | `/profile/lawyer-verification` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cross-user verification isolation |
| POST | `/profile/lawyer-verification` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cross-user verification mutation |
| DELETE | `/profile` | `requireAuth` | client | N/A | Self | Audit required | Review | Cannot delete another user |
| POST | `/profile/deletion-request` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cannot create request for another lawyer |
| GET | `/profile/deletion-status` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cross-user status isolation |
| POST | `/profile/dismiss-rejection` | `requireAuth` | lawyer | N/A | Self | Audit required | Review | Cannot dismiss another lawyer's rejection |
| POST | `/admin/login` | Public | admin auth | N/A | Admin identity | Audit required | High | Invalid credentials + inactive admin |
| GET | `/admin/me` | `requireAdmin` | admin | N/A | Admin | Audit required | Low | Non-admin rejection |
| GET | `/admin/overview` | `requireAdmin` | admin | N/A | Platform | Audit required | Low | Non-admin rejection |
| GET | `/admin/lawyers` | `requireAdmin` | admin | N/A | Platform | Audit required | Low | Non-admin rejection + sensitive fields |
| GET | `/admin/clients` | `requireAdmin` | admin | N/A | Platform | Audit required | Low | Non-admin rejection + sensitive fields |
| GET | `/admin/consultations` | `requireAdmin` | admin | N/A | Platform | Audit required | Low | Non-admin rejection + data minimization |
| GET | `/admin/offices` | `requireAdmin` | admin | N/A | Platform | Audit required | Low | Non-admin rejection |
| PATCH | `/admin/lawyers/:id/status` | `requireAdmin` | admin | N/A | Target lawyer | Audit required | Review | Wrong-object status mutation |
| PATCH | `/admin/clients/:id/status` | `requireAdmin` | admin | N/A | Target client | Audit required | Review | Wrong-object status mutation |
| GET | `/admin/dues-report` | `requireAdmin` | admin | N/A | Platform financial data | Audit required | High | Non-admin rejection + financial field exposure |
| POST | `/admin/collect` | `requireAdmin` | admin | N/A | Financial target | Audit required | High | Wrong booking/target collection |
| POST | `/admin/kill-switch` | `requireAdmin` | admin | N/A | Office/platform target | Audit required | High | Wrong-office/platform scope |
| POST | `/admin/kill-switch/run-all` | `requireAdmin` | admin | N/A | Platform | Audit required | High | Non-admin + unintended global action |
| GET | `/admin/lawyer-verifications/pending` | `requireAdmin` | admin | N/A | Platform | Audit required | Review | Non-admin rejection |
| PATCH | `/admin/lawyer-verifications/:id/review` | `requireAdmin` | admin | N/A | Verification target | Audit required | High | Wrong verification target |
| GET | `/admin/deletion-requests` | `requireAdmin` | admin | N/A | Platform | Audit required | Review | Non-admin rejection |
| GET | `/admin/deletion-requests/:id/check` | `requireAdmin` | admin | N/A | Deletion request | Audit required | High | Wrong request target |
| POST | `/admin/deletion-requests/:id/approve` | `requireAdmin` | admin | N/A | Deletion request | Audit required | High | Wrong request approval |
| POST | `/admin/deletion-requests/:id/reject` | `requireAdmin` | admin | N/A | Deletion request | Audit required | High | Wrong request rejection |
| GET | `/admin/profile-change-requests` | `requireAdmin` | admin | N/A | Platform | Audit required | Review | Non-admin rejection |
| POST | `/admin/profile-change-requests/:id/approve` | `requireAdmin` | admin | N/A | Change request | Audit required | High | Wrong request approval |
| POST | `/admin/profile-change-requests/:id/reject` | `requireAdmin` | admin | N/A | Change request | Audit required | High | Wrong request rejection |
| GET | `/admin/bank-accounts` | `requireAdmin` | admin | N/A | Platform | Audit required | High | Non-admin + sensitive-field minimization |
| POST | `/admin/bank-accounts/:id/:action` | `requireAdmin` | admin | N/A | Bank account target | Audit required | High | Invalid action + wrong target |
| GET | `/admin/reviews` | `requireAdmin` | admin | N/A | Platform | Audit required | Review | Non-admin rejection |
| POST | `/admin/reviews/:id/approve` | `requireAdmin` | admin | N/A | Review target | Audit required | High | Wrong review approval |
| POST | `/admin/reviews/:id/reject` | `requireAdmin` | admin | N/A | Review target | Audit required | High | Wrong review rejection |
| POST | `/bookings/email` | `requireAuth` | client | N/A | Client self; selected lawyer | Audit required | Review | Cannot create booking as another client |
| POST | `/bookings` | `requireAuth` | client | N/A | Client self; selected lawyer | Confirmed server sets `clientId` from actor | Review | Cross-client creation + unauthorized lawyer target |
| GET | `/bookings` | `requireAuth` | client/lawyer/admin | N/A | Client/lawyer self; admin platform | Confirmed via ownership query in known booking/upcoming controllers; complete controller audit required | Review | Cross-user list isolation |
| GET | `/bookings/upcoming` | `requireAuth` | client/lawyer/admin | N/A | Client/lawyer self; admin platform | Confirmed ownership filter in controller | Low | Cross-user list isolation |
| GET | `/bookings/:id` | `requireAuth` | client/lawyer/admin | N/A | Client/lawyer participant; admin | Confirmed explicit client/lawyer ownership check | Low | BOLA: other client's/lawyer's booking |
| POST | `/bookings/confirm` | `requireAuth` | lawyer/admin | Yes for lawyer | Assigned lawyer; admin | Audit required | High | Lawyer cannot confirm another lawyer's booking |
| POST | `/bookings/join` | `requireAuth` | client/lawyer | N/A | Booking participant | Audit required | High | Non-participant join |
| POST | `/bookings/check-absence` | `requireAuth` | client/admin | N/A | Booking client; admin | Audit required | High | Other client's booking absence claim |
| POST | `/bookings/complete` | `requireAuth` | lawyer/admin | Yes for lawyer | Assigned lawyer; admin | Audit required | High | Other lawyer cannot complete booking |
| POST | `/bookings/dispute` | `requireAuth` | client/lawyer/admin | N/A | Booking participant; admin | Audit required | High | Non-participant dispute |
| POST | `/bookings/cancel` | `requireAuth` | client/lawyer | N/A | Booking participant | Confirmed explicit actor ownership in safe cancel service | Low | Non-participant cancellation |
| POST | `/bookings/:id/no-show` | `requireAuth` | client/admin | N/A | Booking client; admin | Confirmed client ownership in no-show flow | Low | Other client no-show claim |
| POST | `/bookings/:id/no-show/refund` | `requireAuth` | client | N/A | Booking client | Audit required beyond route | High | Other client refund |
| GET | `/bookings/:id/no-show/transfer-options` | `requireAuth` | client | N/A | Booking client | Audit required beyond route | High | Other client transfer options |
| POST | `/bookings/:id/no-show/transfer` | `requireAuth` | client | N/A | Booking client | Audit required beyond route | High | Other client transfer |
| GET | `/availability/lawyers/:lawyerId` | `requireAuth` | — | N/A | Target lawyer public availability | Audit required | Review | Sensitive/internal availability leakage |
| GET | `/availability/lawyers/me` | `requireAuth` | lawyer | N/A | Self | Audit required | Low | Cross-user self-route impossible by path |
| PUT | `/availability/lawyers/me` | `requireAuth` | lawyer | N/A | Self | Audit required | Low | Cross-user mutation |
| DELETE | `/availability/lawyers/me` | `requireAuth` | lawyer | N/A | Self | Audit required | Low | Cross-user mutation |
| GET | `/availability/lawyers/:lawyerId/slots` | `requireAuth` | — | N/A | Target lawyer availability | Audit required | Review | Unauthorized availability disclosure |
| GET | `/lawyers/me/clients` | `requireAuth` | lawyer | N/A | Self | Audit required | Low | Self-scope isolation |
| GET | `/lawyers/me/consultations` | `requireAuth` | lawyer | N/A | Self | Audit required | Low | Self-scope isolation |
| POST | `/reviews` | `requireAuth` | client | N/A | Client self; reviewed lawyer | Audit required | High | Client cannot review for another user / unauthorized booking relationship |
| GET | `/lawyers/:id/reviews` | Public | — | N/A | Public lawyer review aggregate | Public by design; sensitive-field audit required | Low | No private review data |
| GET | `/notifications` | `requireAuth` | — | N/A | Self | Audit required | Review | Cross-user notification list |
| POST | `/notifications/:id/read` | `requireAuth` | — | N/A | Notification owner | Audit required | High | Mark another user's notification read |
| POST | `/document-handovers` | `requireAuth` | — | N/A | Handover participants | Audit required | High | Create handover against unrelated document/booking |
| GET | `/document-handovers/:id` | `requireAuth` | — | N/A | Handover participants | Audit required | High | BOLA on handover ID |
| POST | `/document-handovers/:id/status` | `requireAuth` | — | N/A | Handover participant/authorized actor | Audit required | High | Non-participant status mutation |
| POST | `/document-handovers/:id/tracking` | `requireAuth` | — | N/A | Handover participant/authorized actor | Audit required | High | Non-participant tracking mutation |
| POST | `/document-handovers/:id/deliver` | `requireAuth` | — | N/A | Handover participant/authorized actor | Audit required | High | Non-participant delivery |
| GET | `/bookings/:id/payment-proofs` | `requireAuth` | client/lawyer/admin | N/A | Booking participant; admin | Controller has `getBookingForUser`; full action audit required | Review | Cross-booking proof access |
| POST | `/bookings/:id/payment-proofs` | `requireAuth` | client | N/A | Booking client | Controller has booking-user helper; full action audit required | Review | Other client proof submission |
| POST | `/bookings/:id/payment-proofs/:proofId/confirm` | `requireAuth` | lawyer/admin | N/A | Assigned lawyer; admin | Controller has booking-user helper; proof-to-booking binding must be tested | High | Cross-booking proof confirmation |
| POST | `/bookings/:id/payment-proofs/:proofId/reject` | `requireAuth` | lawyer/admin | N/A | Assigned lawyer; admin | Controller has booking-user helper; proof-to-booking binding must be tested | High | Cross-booking proof rejection |
| GET | `/consultations/archive` | `requireAuth` | client/lawyer/admin | N/A | Client/lawyer self; admin | Audit required | Review | Cross-user archive isolation |
| POST | `/consultations/:id/archive` | `requireAuth` | lawyer/admin | N/A | Consultation participant; admin | Audit required | High | Wrong consultation archive |
| GET | `/consultations/:id/print-data` | `requireAuth` | client/lawyer/admin | N/A | Consultation participant; admin | Audit required | High | BOLA/private data disclosure |
| POST | `/consultations/:id/print-export` | `requireAuth` | client/lawyer/admin | N/A | Consultation participant; admin | Audit required | High | Unauthorized export audit event |
| POST | `/representation/quote-requests` | `requireAuth` | client | N/A | Client self; selected lawyer/context | Audit required | Review | Cross-client request creation |
| POST | `/representation-quote-requests/:requestId/proposals` | `requireAuth` | lawyer | Yes | Approved lawyer + target request | Controller/service audit required | High | Unrelated lawyer proposal |
| GET | `/representation-quote-requests/:requestId/proposals` | `requireAuth` | — | N/A | Request participants; admin if supported | Audit required | High | BOLA on request ID |
| GET | `/representation-quote-requests/:requestId/proposals/:proposalId` | `requireAuth` | — | N/A | Request participants; proposal binding | Audit required | High | Cross-request proposal disclosure |
| POST | `/representation-quote-requests/:requestId/proposals/:proposalId/accept` | `requireAuth` | client | N/A | Request owner/client; proposal binding | Audit required | High | Other client acceptance |
| POST | `/representation-quote-requests/:requestId/proposals/:proposalId/reject` | `requireAuth` | client | N/A | Request owner/client; proposal binding | Audit required | High | Other client rejection |
| POST | `/representation-quote-requests/:requestId/proposals/:proposalId/withdraw` | `requireAuth` | lawyer | Yes | Proposal owner/assigned lawyer | Audit required | High | Other lawyer withdrawal |
| POST | `/agreements` | `requireAuth` | client/lawyer | N/A | Agreement parties | Audit required | Review | Cross-party creation |
| GET | `/agreements/:id` | `requireAuth` | client/lawyer | N/A | Agreement client/lawyer | Audit required | High | BOLA agreement disclosure |
| POST | `/agreements/:id/versions` | `requireAuth` | lawyer | Yes | Agreement lawyer | Audit required | High | Other lawyer version creation |
| POST | `/agreements/:id/versions/:versionId/publish` | `requireAuth` | lawyer | Yes | Agreement lawyer | Audit required; version must belong to agreement | High | Cross-agreement publish |
| POST | `/agreements/:id/confirm` | `requireAuth` | client/lawyer | N/A | Agreement party | Audit required | High | Non-party confirmation |
| POST | `/agreements/:agreementId/legal-representation-documents` | `requireAuth` | client/lawyer/admin | N/A | Agreement participant; admin | Confirmed in `legalRepresentationDocuments` service | Low | Cross-agreement upload |
| GET | `/agreements/:agreementId/legal-representation-documents` | `requireAuth` | client/lawyer/admin | N/A | Agreement participant; admin | Confirmed in service | Low | Cross-agreement list |
| GET | `/legal-representation-documents/:id` | `requireAuth` | client/lawyer/admin | N/A | Agreement participant; admin | Confirmed in service | Low | BOLA document disclosure |
| POST | `/legal-representation-documents/:id/submit` | `requireAuth` | client/lawyer/admin | N/A | Agreement participant + uploader; admin | Confirmed in service | Low | Other participant/uploader mutation |
| POST | `/legal-representation-documents/:id/review` | `requireAuth` | lawyer/admin | N/A | Agreement lawyer; admin | Confirmed in service | Low | Unrelated lawyer review |
| POST | `/legal-representation-documents/:id/verify` | `requireAuth` | lawyer/admin | N/A | Agreement lawyer; admin | Confirmed in service | Low | Unrelated lawyer verification |
| POST | `/legal-representation-documents/:id/reject` | `requireAuth` | lawyer/admin | N/A | Agreement lawyer; admin | Confirmed in service | Low | Unrelated lawyer rejection |
| POST | `/legal-representation-documents/:id/supersede` | `requireAuth` | lawyer/admin | N/A | Agreement lawyer; admin | Confirmed in service | Low | Unrelated lawyer supersede |
| POST | `/agreements/:agreementId/case` | `requireAuth` | client/lawyer/admin | Yes for lawyer | Agreement participant; admin | Confirmed in cases service | Low | Cross-agreement case creation |
| GET | `/cases/:id` | `requireAuth` | client/lawyer/admin | N/A | Case owner/member; admin | Confirmed: owner/member lookup in cases service | Low | BOLA case disclosure |
| POST | `/cases/:id/transition` | `requireAuth` | client/lawyer/admin | Yes for lawyer | Case participant; role-specific transition | Confirmed service-level actor check | Low | Unauthorized case transition |
| POST | `/cases/:caseId/hearings` | `requireAuth` | lawyer/admin | Yes for lawyer | Case lawyer/member; admin | Audit required | High | Unrelated lawyer hearing creation |
| GET | `/cases/:caseId/hearings` | `requireAuth` | client/lawyer/admin | N/A | Case member; admin | Audit required | High | Cross-case hearing disclosure |
| POST | `/cases/:caseId/hearings/:hearingId/transition` | `requireAuth` | lawyer/admin | Yes for lawyer | Case lawyer + hearing binding; admin | Audit required | High | Cross-case hearing transition |
| POST | `/representation-milestones/:milestoneId/fund` | `requireAuth` | client | N/A | Milestone/quote client owner | Audit required | High | Other client's milestone funding |
| POST | `/representation-milestones/:milestoneId/allocate` | `requireAuth` | client | N/A | Milestone/quote client owner | Confirmed transactional client ownership in allocation service | Low | Other client's allocation |
| POST | `/representation-milestones/:milestoneId/proofs` | `requireAuth` | lawyer | Yes | Milestone/quote assigned lawyer | Audit required | High | Unrelated lawyer proof creation |
| POST | `/representation-milestones/:milestoneId/release-requests` | `requireAuth` | client | N/A | Milestone/quote client owner | Audit required | High | Other client's release request |
| POST | `/representation-release-requests/:releaseRequestId/dispute` | `requireAuth` | client | N/A | Release request client owner | Audit required | High | Other client's dispute |
| GET | `/representation-milestones/:milestoneId/release-request` | `requireAuth` | client | N/A | Milestone/quote client owner | Audit required | High | Other client's release-request disclosure |
| POST | `/representation-release-requests/:releaseRequestId/release` | `requireAuth` | client | N/A | Release request client owner | Audit required | Critical | Unauthorized financial release |
| POST | `/representation-milestones/:milestoneId/refund` | `requireAuth` | client | N/A | Milestone/quote client owner | Audit required | Critical | Unauthorized financial refund |

## Confirmed evidence already established

1. The central route registry mounts the 26 route modules listed above. fileciteturn92file0L2-L10
2. Booking detail access contains an explicit client/lawyer ownership check in the controller audit. fileciteturn99file0L8-L19
3. Upcoming bookings filter by authenticated client/lawyer ownership, with admin platform scope. fileciteturn100file4L72-L80
4. Safe booking creation binds the new booking's `clientId` to the authenticated actor. fileciteturn100file1L21-L37
5. Safe cancellation explicitly checks that the authenticated actor is the booking client or lawyer. fileciteturn100file5L89-L99
6. Lawyer no-show refund flow checks booking client ownership. fileciteturn100file6L106-L116
7. Payment-proof controller has a dedicated booking-for-user authorization helper; proof-to-booking binding remains a required negative-test target. fileciteturn100file7L125-L135
8. Legal-representation document service enforces agreement access by client/lawyer/admin and additionally restricts upload type by actor role. fileciteturn114file0L17-L54
9. Legal-representation document read/list/update operations re-check agreement access at the service boundary. fileciteturn114file0L55-L72
10. Case creation verifies agreement actor relationship, active lawyer state, and approved professional verification. fileciteturn116file0L31-L73
11. Case reads enforce owner/member access; transitions enforce actor role and ownership. fileciteturn116file0L115-L177
12. `requireApprovedLawyer` is neutral for non-lawyer actors and verifies the lawyer's current DB verification status before allowing lawyer actions. fileciteturn111file0L17-L41

## Immediate E01-A repair queue

Only items with confirmed evidence of a missing boundary will be changed. The current highest-risk candidates requiring controller/service inspection before any code change are:

1. Representation proposal reads/actions (`requestId` + `proposalId`).
2. Document handover object access/actions (`id`).
3. Consultation documentation (`id`) and archive list isolation.
4. Case hearings (`caseId` + `hearingId`).
5. Financial milestone actions (`milestoneId` / `releaseRequestId`).
6. Booking confirmation/join/complete/dispute/refund/transfer object authorization.
7. Notifications `/:id` ownership.
8. Availability `/:lawyerId` privacy boundary.
9. Auth entry-point controller security and portal-role enforcement.

No code is changed merely because a row says `Audit required`; the controller/service must first be inspected and the gap proven.

## Closure rule

E01-A is not closed until every `Audit required` row has either:
- a verified controller/service authorization check plus a negative test, or
- a documented, deliberate public/platform authorization decision with a corresponding test.

The final E01 PR remains blocked until E01-B, E01-C, E01-D, and E01-E are complete.
