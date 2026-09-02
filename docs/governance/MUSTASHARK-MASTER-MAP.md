# MUSTASHARK — MASTER MAP

**Status:** CANONICAL GOVERNANCE AUTHORITY — ADOPTED
**Adoption date:** 2026-08-25
**Product Master Map adoption:** 2026-09-03
**Capability Inventory V1:** 2026-09-03 — `main` baseline `93378a1f72517ab3dedd0eef06499d4d8f4094ce`
**Product Execution Roadmap V1:** 2026-09-03 — derived from Capability Inventory V1 and canonical MAP-X
**Scope:** governance, product vision, capability inventory, execution roadmap, roadmap control, cross-map traceability, implementation closure, evidence requirements.

## 00 — Mustashark Product North Star

Mustashark is a two-sided legal-services platform combining a legal marketplace with a digital law office, secure client relationships, legal-service workflows and a controlled financial architecture.

### Client experience
`Discover Lawyer → Review Profile → Communicate → Request Service → Pay → Book / Start → Receive Service → Documents / Case → Follow-up → Evaluate`

The platform must support both an existing lawyer already known to the client and a new lawyer discovered through Mustashark.

### Lawyer experience
Mustashark is the lawyer's digital law office: a professional workspace for profile, intake, consultations, calendar, clients, matters, documents, tasks, service offers, service delivery, entitlements, settlement, notifications, reporting and office operations.

### Lawyer SaaS model
`Verified Lawyer → 30-Day Free Trial → 50 JOD/month → Renewal / Expiry → Entitlement Enforcement`

The subscription is a platform-service entitlement and MUST remain separate from client service money and lawyer earned service entitlements. Documenting the price is not implementation evidence.

### Client-to-lawyer service payment
`Client → Mustashark Payment Flow → Verified Provider Event → Financial Authority → Lawyer Entitlement → Settlement → Reconciliation`

Client service payments, lawyer earned entitlements, Mustashark subscription revenue and external provider settlement status are separate financial concepts and MUST NOT be collapsed into one ambiguous authority.

## 00.1 — Product Capability Strategy

Target product composition:
`Legal Marketplace + Digital Law Office + Secure Client Relationship + Legal Services + Payments + Case/Document Workflow + Settlement/Reconciliation + Lawyer SaaS`

Validated capabilities from leading legal-service products may inform the roadmap, but every capability must first pass architectural, security, domain, data, state and MAP-X classification before implementation.

## 00.2 — Capability Inventory V1 — Canonical Main Baseline

**Inventory basis:** `main @ 93378a1f72517ab3dedd0eef06499d4d8f4094ce`.

| # | Capability | Main foundation | Status | Immediate disposition |
|---|---|---|---|---|
| C01 | Identity & Authentication | `requireAuth` + users DB re-check | **EXISTS** | Complete route audit |
| C02 | Authorization / Role Guards | `requireRole` + `requireApprovedLawyer` | **EXISTS** | Route-by-route authz audit |
| C03 | Lawyer Professional Verification | verification schema/routes/workflow | **EXISTS** | Verify end-to-end |
| C04 | Lawyer Profile | profile API/mobile/moderation | **EXISTS** | Verify publication rules |
| C05 | Lawyer Discovery | public profile + discovery foundation | **BROKEN / INCOMPLETE** | Complete search/filter/selection |
| C06 | Lawyer Availability | availability + time blocks | **EXISTS** | Verify timezone/concurrency |
| C07 | Booking / Scheduling | bookings + idempotency/versioning | **EXISTS** | Complete E2E gate |
| C08 | Consultation Lifecycle | consultation events + booking lifecycle | **EXISTS** | Verify state transitions |
| C09 | Client ↔ Lawyer Relationship | client/lawyer + membership foundations | **EXISTS** | Verify access boundaries |
| C10 | Secure Messaging / Communication | communication support/surface foundation | **NEEDS REFACTOR / VERIFICATION** | Prove secure runtime capability |
| C11 | Notifications | `user_notifications` + API | **EXISTS** | Verify delivery/dedupe/read lifecycle |
| C12 | Documents | handover + representation documents | **EXISTS** | Complete privacy/access audit |
| C13 | Cases / Matters | cases + memberships + hearings | **EXISTS** | Verify isolation |
| C14 | Legal Representation | quotes + proposals + agreements + documents | **EXISTS** | Complete E2E journey |
| C15 | Payment Proofs | payment proof schema/API | **EXISTS** | Preserve supported proof path |
| C16 | Online Provider Payment | provider boundary not proven as one canonical flow | **MISSING / NEEDS REFACTOR** | Provider → verified event → Financial Authority |
| C17 | Financial Authority | distributed financial components; authority not fully proven | **NEEDS REFACTOR** | Establish authoritative boundary |
| C18 | Escrow / Milestones | representation finance + fund/allocate/release | **EXISTS** | Complete E2E/concurrency evidence |
| C19 | Lawyer Wallet | wallet + transactions | **EXISTS** | Reconcile to Financial Authority |
| C20 | Client Wallet | wallet foundation | **EXISTS** | Reconcile to Financial Authority |
| C21 | Settlement / Payout | release/settlement/bank foundations | **NEEDS REFACTOR / VERIFICATION** | Close entitlement → payout |
| C22 | Reconciliation | complete cross-system control not proven | **MISSING** | Design and implement |
| C23 | Lawyer SaaS Subscription | 30-day trial → 50 JOD/month product rule | **MISSING** | Implement lifecycle/entitlement |
| C24 | Digital Law Office Workspace | N1 + lawyer/client/case/document foundations | **NEEDS REFACTOR** | Consolidate complete workspace |
| C25 | Tasks / Workflow Engine | N1 target; full engine not proven | **MISSING** | Design → implement → test |
| C26 | General Legal Service Catalog | consultation/representation foundations only | **MISSING** | Define catalog/offers/lifecycle |
| C27 | Ratings / Reputation | reviews + API/admin surface | **EXISTS** | Harden eligibility/anti-abuse/audit |
| C28 | Administration | admin routes/dashboard/audit surfaces | **EXISTS** | Least-privilege review |
| C29 | Audit Logging | admin audit + domain events | **EXISTS** | Verify security/financial coverage |
| C30 | Terms / Legal Consent | agreements exist; Terms Consent requires verification | **NEEDS VERIFICATION** | Verify main + server enforcement |
| C31 | Privacy / Data Access Boundary | auth/role/private-data foundations | **NEEDS REFACTOR / AUDIT** | Complete object-level access audit |
| C32 | CI / Security Gates | multiple workflows/security gates | **EXISTS** | Prove complete matrix green |

**Interpretation:** EXISTS is not CLOSED. BROKEN means repair is required. NEEDS REFACTOR means preserve valid foundations while correcting the boundary/composition. MISSING means design and implementation are required. No capability is authorized for deletion by this inventory alone.

## 00.3 — Mustashark Product Execution Roadmap V1

This section is the canonical execution table derived from the 32 capabilities. It is the project-level sequencing authority for turning the inventory into implementation work. It does not replace detailed lifecycle IDs or MAP-X; it binds them.

### Roadmap record contract
Every roadmap item is tracked as:
`Priority → Roadmap ID → Capability → MAP-X → Existing Files/Assets → Gap → PR Sequence → Definition of Done`

The implementation record must additionally resolve to:
`Role X/Y/Z/W → Lifecycle T/S → N1 when applicable → C-stage when applicable → D02 → Domain/Data/State → Auth/Privacy → Tests/CI → Evidence → Verify Main → Closure`

### Execution sequencing rule
- **P0** work protects identity, legal data and financial truth and blocks unsafe commercial launch.
- **P1** work completes the core client marketplace, lawyer digital office, legal services and subscription experience.
- **P2** work expands automation, workflow depth, portal maturity and intelligence after the P0/P1 foundations are proven.
- A later item may be implemented only when its upstream dependency is either `CLOSED / VERIFIED` or explicitly documented as a safe parallel dependency.

### PR sequence
`PR-E01 Security Foundation → PR-E02 Financial Authority → PR-E03 Provider Payment → PR-E04 Escrow/Wallet/Settlement → PR-E05 Reconciliation → PR-E06 Marketplace → PR-E07 Consultation/Communication → PR-E08 Documents/Cases/Representation → PR-E09 Legal Services Catalog → PR-E10 Lawyer Digital Office → PR-E11 Lawyer SaaS → PR-E12 Tasks/Workflow → PR-E13 Trust/Admin → PR-E14 Product E2E/Release Gate`

These are roadmap execution sequence identifiers, not existing GitHub PR numbers.

### E01 execution status

| Package | Status | Evidence / decision |
|---|---|---|
| E01-A Authentication & Authorization | **IN PROGRESS** | Parameterized-route/controller audit substantially advanced; no confirmed IDOR/BOLA defect in inspected set |
| E01-B Professional Trust | **PENDING** | Starts only after E01-A negative authorization coverage is established |
| E01-C Legal Data Isolation | **PENDING** | Document/case isolation evidence being carried forward from E01-A audit |
| E01-D Terms / Privacy | **PENDING** | Canonical-main Terms Consent primitives still require explicit verification |
| E01-E Security Gate | **PENDING** | Typecheck/tests/CI/final diff/main verification not yet closed |

### E01-A — Parameterized Route Audit Record

The following high-risk parameterized route families were inspected on `security/e01-foundation-2026-09-03`:

1. `lawyerClients`
2. `lawyerConsultations`
3. `consultationDocumentation`
4. `representationQuoteRequests`
5. `lawyerProposals`
6. `cases`
7. `caseHearings`
8. milestone authorization: fund / allocate / proof / release-request / dispute / release / refund

**Verified findings:**

- `lawyerClients` scopes the directory query by `bookings.lawyerId = authenticated lawyer`; inactive/deleted clients are excluded. No cross-lawyer object lookup was found. fileciteturn166file0L2-L4
- `lawyerConsultations` scopes consultations by the authenticated lawyer's own `bookings.lawyerId`; client records are constrained to active, non-deleted users. fileciteturn167file0L2-L4
- `consultationDocumentation` checks booking ownership/member identity for archive, print and export. Print output is reduced to an explicit safe DTO and event metadata is sanitized before response. fileciteturn168file0L2-L4
- `representationQuoteRequests` binds creation to an authenticated client; a supplied lawyer target is checked for active lawyer role/status before insertion. fileciteturn169file0L2-L4
- `lawyerProposals` binds proposal creation to the authenticated lawyer, verifies parent request availability and assigned-lawyer restriction, and jointly binds `requestId + proposalId` on reads/transitions. Client reads are restricted to the request owner; lawyer reads are restricted to the proposal owner or assigned lawyer. fileciteturn170file0L2-L2
- `cases` creation verifies agreement actor ownership, confirmed agreement, active lawyer state and approved professional verification. Case reads permit owner/member/admin access only; transitions restrict completion to the assigned lawyer/admin and closing to admin. fileciteturn172file0L2-L2
- `caseHearings` binds every hearing mutation to both `caseId` and `hearingId`; reads use case membership/owner access, while writes are limited to the assigned lawyer/admin. fileciteturn174file0L2-L2
- Milestone fund/allocate/release/refund/proof/dispute paths derive amount/currency and parent relationships from database state, lock the relevant rows, and enforce client/lawyer ownership at the service boundary. fileciteturn176file0L2-L2 fileciteturn177file0L2-L2 fileciteturn178file0L2-L2 fileciteturn179file0L2-L2 fileciteturn180file0L2-L2 fileciteturn181file0L2-L2
- Route-level role guards independently reinforce the milestone service checks: client-only fund/allocate/release/refund/release-request/dispute, and approved-lawyer-only proof submission. fileciteturn184file0L2-L4 fileciteturn185file0L2-L4 fileciteturn186file0L2-L4 fileciteturn187file0L2-L4 fileciteturn188file0L2-L4 fileciteturn189file0L2-L4 fileciteturn190file0L2-L4

**Security conclusion for this audit slice:** no confirmed authorization bypass was proven, so no runtime patch was manufactured. The remaining requirement is automated negative coverage proving cross-client, cross-lawyer, cross-case, wrong-request/wrong-proof, wrong-milestone and wrong-role denial behavior.

## 00.4 — Existing Asset Reuse Rule

Before creating new architecture or code, the team MUST determine:
`EXISTING + REUSABLE → REUSE`
`EXISTING + EXTENSIBLE → EXTEND`
`EXISTING + INSUFFICIENT → REDESIGN / BUILD NEW`

Old code is not automatically obsolete. Historical migrations, financial records and experimental branches are not deletion targets without dependency, lineage and authority evidence.

## 00.5 — Product Completion Definition

Mustashark is product-complete only when the core journeys operate end-to-end.

**Client:** `Register / Verify → Find Lawyer → Select → Communicate → Request Service → Pay → Book / Start → Receive Service → Documents / Case → Complete → Evaluate`

**Lawyer:** `Register → Professional Verification → Trial → Workspace → Profile / Availability → Receive Client → Accept Service → Deliver → Case / Documents → Earn → Settlement → Subscription`

**Financial:** `Service → Payment Obligation → Provider → Verified Provider Event → Financial Authority → Ledger / Escrow Compatibility → Lawyer Entitlement → Settlement → Reconciliation`

**Security:** `Identity → Authentication → Authorization → Data Access Boundary → Audit → Monitoring → Verification`

## 01 — Canonical Operating Hierarchy

```text
MUSTASHARK-MASTER-MAP → PRODUCT NORTH STAR → CAPABILITY INVENTORY → PRODUCT EXECUTION ROADMAP → MAP-X → Architecture/Product/Security → Repository → CI/Evidence → CLOSED / VERIFIED
```

## 02 — Authority Hierarchy

1. Governance / legal-regulatory decision record
2. Financial/legal foundation for financial/legal behavior
3. Product lifecycle maps
4. Role architecture and product namespaces
5. Design foundation for visible presentation
6. Domain / Data / State / Security models
7. Repository implementation
8. Tests and runtime evidence

`MUSTASHARK-MASTER-MAP` is the highest governance reference. `MAP-X` is the integration/control layer. Repository code is implementation truth. CI/Evidence proves implementation state. `CLOSED / VERIFIED` is controlled and never inferred.

## 03 — Separation of Concerns

Governance remains separate from runtime. Governance documents, registries, crosswalks, roadmap records and evidence live under `docs/`. They MUST NOT become runtime dependencies or be bundled into application behavior.

## 04 — Canonical Maps and Namespaces

- `docs/governance/MUSTASHARK-MASTER-MAP.md` — supreme governance/product control reference.
- `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md` — cross-map integration and routing.
- `docs/architecture/FINANCIAL-AUTHORITY-MIGRATION-V1-CANONICAL-2026-08-28.md` — canonical financial authority decision.
- `docs/roadmap/ROADMAP-REGISTRY.md` — roadmap ↔ repository traceability.
- `docs/roadmap/MASTER-AUDIT-MAP.md` — audit/roadmap control.
- `docs/design/D02-SURFACE-MASTER-MAP.md` and `docs/design/D02-ROADMAP-CROSSWALK.md` — visible-surface design governance.
- `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md` — Lawyer Digital Office namespace.

## 05 — Mandatory Lifecycle

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

For new services/material changes:
`INTAKE → IDENTIFY → CLASSIFY → DISCOVER EXISTING ASSETS → IMPACT ANALYSIS → ROUTE → IMPLEMENTATION PLAN`

## 06 — Mandatory Closure Rule

No item may be marked `CLOSED / VERIFIED` until it is implemented, mapped, tested as applicable, security-reviewed, evidenced, verified on the target branch and recorded.

Minimum closure record:
`Roadmap ID → MAP-X ID → hierarchy/maps → repository files/commit → implementation status → tests → security/review → CI → evidence → final diff audit → target-branch verification → closure record`

## 07 — Evidence Validity and Reuse

- **VALID → REUSE** when traceable and applicable.
- **STALE / INSUFFICIENT → REFRESH** affected verification.
- **FAILED → BLOCK CLOSURE**.

## 08 — MAP-X Control Contract

Every implementation item must resolve, as applicable, to:
`Roadmap → MAP-X → Architecture/Product-Lifecycle/Security → Design/Domain-Data-State/Auth-Privacy → Repository → Tests/CI → Evidence → Verify Main → Closure`

## 09 — Financial and Security Non-Negotiables

### Financial
- Server is authoritative for financial truth.
- Browser/client redirect is never proof of payment.
- Provider event must be independently verified before financial fact is posted.
- Financial transitions are atomic, idempotent and concurrency-safe.
- Ledger/financial authority must own financial truth.
- Reconciliation is mandatory before financial closure.
- Historical financial records and migrations are preserved until safe retirement is proven.

### Security
- Authentication and authorization are separate controls.
- Sensitive routes require explicit authorization and object-level access checks.
- Legal data is private by default.
- Audit logs must cover security-sensitive and financial actions.
- No client-held password/JWT storage pattern may become the security authority.
- Production database remains protected by the active production lockdown.

## 10 — C3 Financial/Legal Foundation Status

C3 remains an assumption-free foundation freeze until operating/legal/regulatory questions are resolved. No code change is authorized merely because an unresolved C3 question exists.

## 11 — Financial Surface Verification

| Path | Status | MAP-X |
|---|---|---|
| Fund Milestone | NEEDS VERIFICATION | MX-FIN-10 |
| Release Milestone | NEEDS VERIFICATION | MX-FIN-11 |
| Refund Milestone | NEEDS VERIFICATION | MX-FIN-12 |
| Cancel | NEEDS VERIFICATION | MX-FIN-13 |
| Transfer / No-show | DEEP FINANCIAL & LEGAL VERIFICATION | MX-FIN-14 |
| Deposit / Fund origin | OPEN / FOUNDATION DEPENDENT | MX-FIN-15 |

## 12 — Lawyer Digital Office / N1

N1.01–N1.40 remains the Lawyer Digital Office namespace. All N1 surfaces intersect D02, role/lifecycle maps and applicable C-stage financial/legal controls.

## 13 — Universal Surface Contract

Every screen/workspace/modal/device mode must declare:
`Surface ID → Service ID → Role → Lifecycle → MAP-X → D02 → Authoritative API/state → Data classification → Permission model → UI states → RTL/LTR → Responsive behavior → Accessibility → Security/privacy presentation → Tests → CI evidence → Closure evidence`

## 14 — Historical / Experimental Work Rule

Experimental branches and PRs are not product authority. `platform_dues` and historical migrations are preserved until a separate evidence-based reconciliation/retirement decision is approved.

## 15 — Build Execution Gate

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

The Product Execution Roadmap sequences work; MAP-X controls cross-map traceability; the repository implements; CI/Evidence proves; Main verification closes.

## 16 — Release Gate

Mustashark cannot be declared launch-ready until P0 security, Financial Authority, provider payment, escrow/wallet/settlement/reconciliation, core marketplace, Lawyer Digital Office, legal services, privacy/consent/audit/accessibility/RTL and required CI gates are verified.

## 17 — Governance State

**Governance state:** `ADOPTED — CANONICAL OPERATING HIERARCHY + PRODUCT NORTH STAR + CAPABILITY INVENTORY V1 + PRODUCT EXECUTION ROADMAP V1`

**Canonical implementation baseline:** `main @ 93378a1f72517ab3dedd0eef06499d4d8f4094ce`

**Current execution branch:** `security/e01-foundation-2026-09-03`

**Runtime impact of this Master Map update:** `NONE — GOVERNANCE / EVIDENCE DOCUMENTATION ONLY`

**E01-A status:** `IN PROGRESS — PARAMETERIZED ROUTE AUDIT ADVANCED; NEGATIVE AUTHORIZATION COVERAGE STILL REQUIRED`

**E01 policy:** one branch, one eventual PR, no direct `main`, no Production DB mutation, no speculative security patching.
