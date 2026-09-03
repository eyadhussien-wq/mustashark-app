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

These are **roadmap execution sequence identifiers**, not existing GitHub PR numbers. Actual GitHub PR numbers are assigned when each implementation branch is created.

### 32-capability execution matrix

| Priority | Roadmap ID | Capability | MAP-X | Existing files / assets | What is missing | PR sequence | Definition of Done |
|---|---|---|---|---|---|---|---|
| P0 | RM-C01 | Identity & Authentication | `MX-CLIENT-01`, `MX-SEC-01` | `artifacts/api-server/src/middlewares/requireAuth.ts`, auth routes/controllers | Full route inventory, negative tests, token/session lifecycle proof | E01 | Every protected route has verified auth behavior; active-user DB re-check; tests + CI + main verification |
| P0 | RM-C02 | Authorization / Role Guards | `MX-SEC-01` | `requireRole`, `requireApprovedLawyer`, protected route files | Route-by-route RBAC/ABAC/object authorization matrix and IDOR tests | E01 | Every sensitive endpoint has least-privilege authorization and denial tests |
| P0 | RM-C03 | Lawyer Professional Verification | `MX-LAWYER-01` | lawyer verification schema/routes/controllers | Complete applicant → review → approved/rejected → login/entitlement proof | E01 | Only correctly verified lawyers receive lawyer-authorized capabilities; audit evidence exists |
| P0 | RM-C12 | Documents | `MX-LAWYER-03`, `MX-SEC-01` | document handover and representation-document modules | Object-level access audit, private storage/access proof, retention rules | E01 | Client/lawyer isolation, secure access, audit and privacy tests pass |
| P0 | RM-C13 | Cases / Matters | `MX-LAWYER-03`, `MX-SEC-01` | `cases`, memberships, case-hearing routes/controllers | Full ownership/membership authorization matrix and E2E isolation | E01 | No cross-client/cross-lawyer access; lifecycle and permission tests pass |
| P0 | RM-C30 | Terms / Legal Consent | `MX-SEC-01` | terms/agreements foundation | Verify versioned consent exists on main and is enforced server-side before governed actions | E01 | Current terms version recorded, consent immutable/auditable, enforcement tests green |
| P0 | RM-C31 | Privacy / Data Access Boundary | `MX-SEC-01`, `MX-SHARED-01` | auth middleware + private controllers/routes | Object-level access map, sensitive-field review, privacy regression suite | E01 | Data access matrix is complete and automated denial cases pass |
| P0 | RM-C17 | Financial Authority | `MX-FIN-01`, `MX-FIN-02`, `MX-FIN-03` | financial schemas/services, escrow transactions, wallet transactions, payment proofs | Single authoritative boundary, event model, immutable financial facts, authority ownership | E02 | No controller/UI/wallet/provider adapter independently creates financial truth; atomic/idempotent evidence passes |
| P0 | RM-C16 | Online Provider Payment | `MX-FIN-01` | payment/provider integration boundary and payment-proof foundation | Server-created payment obligation, provider adapter, verified event, reference persistence, duplicate webhook safety | E03 | Provider event is independently verified; redirect alone cannot confirm payment; E2E passes |
| P0 | RM-C18 | Escrow / Milestones | `MX-FIN-03` + `MX-FIN-10/11/12` | `allocateMilestone.ts`, `releaseMilestone.ts`, representation finance schema | Full fund/release/refund lifecycle and concurrency evidence | E04 | Funding, allocation, release/refund are atomic, idempotent, race-safe and reconciled |
| P0 | RM-C19 | Lawyer Wallet | `MX-FIN-03` | lawyer wallet + transaction schema/services | Authority reconciliation and entitlement semantics | E04 | Wallet reflects authoritative entitlement only; no independent money authority |
| P0 | RM-C20 | Client Wallet | `MX-FIN-03` | client wallet foundation | Authority reconciliation and exact wallet semantics | E04 | Client balance/entitlement derives from authoritative financial events and passes replay/race tests |
| P0 | RM-C21 | Settlement / Payout | `MX-FIN-03`, `MX-FIN-15` | bank accounts, release/settlement foundations | Explicit entitlement → settlement → payout state machine and provider/bank status | E04 | Lawyer/platform entitlements are correct, payout is auditable, retries are safe |
| P0 | RM-C22 | Reconciliation | `MX-FIN-03`, `MX-FIN-15` | payment proofs, escrow transactions, wallets, settlement foundations | Provider ↔ payment ↔ financial authority ↔ wallet ↔ settlement reconciliation control | E05 | Mismatches detected, classified, auditable and recoverable without rewriting financial history |
| P1 | RM-C04 | Lawyer Profile | `MX-LAWYER-01` | profile API/mobile/admin moderation | Publication/verification rules, profile completeness and trust signals | E06 | Verified public profile is accurate, scoped, searchable and privacy-safe |
| P1 | RM-C05 | Lawyer Discovery | `MX-CLIENT-02` | public lawyer profile/discovery foundation | Search/filter/ranking/selection journey | E06 | Client can reliably find, filter and select an eligible lawyer with deterministic access rules |
| P1 | RM-C06 | Lawyer Availability | `MX-SHARED-01` | availability/time-block APIs | Timezone, conflict and concurrent booking verification | E06 | Available slots are correct under timezone and concurrent requests |
| P1 | RM-C07 | Booking / Scheduling | `MX-CLIENT-02`, `MX-SHARED-01` | bookings, time blocks, idempotency/versioning | Full client-to-lawyer E2E and edge-case verification | E06 | No double booking; retries/idempotency safe; cancellation/no-show states proven |
| P1 | RM-C08 | Consultation Lifecycle | `MX-CLIENT-02` | consultation events + booking lifecycle | Complete state transition map and terminal-state rules | E07 | Every consultation state transition is authorized, auditable and tested |
| P1 | RM-C09 | Client ↔ Lawyer Relationship | `MX-CLIENT-02`, `MX-LAWYER-02` | lawyer-client/case membership foundations | Relationship lifecycle, visibility and conversion rules | E07 | Access follows active relationship/membership state and cannot leak data |
| P1 | RM-C10 | Secure Messaging / Communication | `MX-SHARED-01` | communication surfaces/supporting APIs | Prove actual secure runtime channel, membership authorization, retention and audit | E07 | Messages are private to participants, authorized, auditable and resilient to retry/replay |
| P1 | RM-C11 | Notifications | `MX-SHARED-01` | `user_notifications` + notification API | Delivery ledger/dedupe/read lifecycle and retry behavior | E07 | Notifications are authorized, deduplicated, observable and stateful |
| P1 | RM-C14 | Legal Representation | `MX-LAWYER-03` | quotes, proposals, agreements, representation documents | Complete consultation → representation transition and document/consent lifecycle | E08 | Representation journey is end-to-end, permission-safe and auditable |
| P1 | RM-C15 | Payment Proofs | `MX-FIN-01` | `payment_proofs` schema/API and T01-05 security workflow | Harden submission/confirmation/rejection, ownership and audit semantics | E03 | Proofs cannot create false financial truth; confirmation maps to verified authority |
| P1 | RM-C26 | General Legal Service Catalog | `MX-CLIENT-02`, `MX-LAWYER-02` | consultation/representation offer foundations | Service types, pricing/fee offer states, eligibility and lifecycle | E09 | Lawyer can publish eligible services; client can request/accept/pay through governed lifecycle |
| P1 | RM-C27 | Ratings / Reputation | `MX-CLIENT-02`, `MX-LAWYER-01` | lawyer reviews/API/admin review surface | Eligibility, anti-abuse, moderation and audit | E13 | Only eligible service participants can rate; abuse controls and audit pass |
| P1 | RM-C28 | Administration | `MX-ADMIN-01` | `artifacts/api-server/src/routes/admin.ts`, admin controllers/dashboard | Least-privilege matrix, sensitive-operation review, legacy financial authority review | E13 | Admin cannot bypass financial/security authority; all sensitive actions audited |
| P1 | RM-C29 | Audit Logging | `MX-SEC-01`, `MX-FIN-03` | admin audit logs + consultation/domain events | Coverage matrix for security/financial/product actions and integrity checks | E13 | Security and financial actions produce reproducible audit evidence |
| P1 | RM-C24 | Digital Law Office Workspace | `MX-LAWYER-01`, `MX-LAWYER-02`, `MX-LAWYER-03` | `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md`, lawyer surfaces, clients/cases/docs | Consolidated workspace shell and complete daily-office workflows | E10 | Verified lawyer can operate profile, clients, calendar, consultations, cases, docs and service delivery from one coherent workspace |
| P1 | RM-C23 | Lawyer SaaS Subscription | `MX-LAWYER-01`, `MX-FIN-01` | current product rule only; no complete subscription implementation proven | Trial clock, subscription state, payment/renewal, entitlement enforcement | E11 | Verified lawyer receives 30-day trial; after trial active paid state is enforced at 50 JOD/month; expiry blocks only subscription-gated features |
| P1 | RM-C25 | Tasks / Workflow Engine | `MX-LAWYER-02`, `MX-SHARED-01` | N1 task/workflow target | Task model, assignment, due dates, transitions, reminders, retries | E12 | Lawyer can manage legal work queue with deterministic state, permissions and notifications |
| P1 | RM-C32 | CI / Security Gates | `MX-QA-01`, `MX-SEC-01` | existing GitHub Actions/security workflows | Complete product/financial/security matrix and release gate | E14 | Required typecheck/build/security/financial/E2E/visual evidence is green and tied to target main |

### Roadmap grouping by product outcome

| Outcome | Roadmap IDs | Target |
|---|---|---|
| Secure foundation | RM-C01, C02, C03, C12, C13, C30, C31 | Identity → AuthN → AuthZ → Data Boundary → Consent → Audit |
| Financial integrity | RM-C16, C17, C18, C19, C20, C21, C22 | Provider → Verified Event → Financial Authority → Entitlement → Settlement → Reconciliation |
| Client marketplace | RM-C04, C05, C06, C07, C08, C09, C10, C11, C14, C15, C26, C27 | Discover → Buy → Work → Complete → Evaluate |
| Lawyer digital office | RM-C24, C25 plus C04/C06/C08/C09/C12/C13/C14/C21/C27/C28 | Verified Lawyer → Office → Clients → Work → Deliver → Earn → Operate |
| Lawyer SaaS | RM-C23 | Verified Lawyer → Trial → Subscription → Entitlement |
| Release control | RM-C29, C32 | Auditability → Evidence → CI → Verify Main |

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
                 MUSTASHARK-MASTER-MAP
                          │
                    PRODUCT NORTH STAR
                          │
                   CAPABILITY INVENTORY
                          │
                PRODUCT EXECUTION ROADMAP
                          │
                         MAP-X
                          │
        ┌─────────────────┼─────────────────┐
        │                 │                 │
   Architecture       Product/Lifecycle   Security
        │                 │                 │
     Design          Domain/Data/State    Auth/Privacy
        │                 │                 │
        └─────────────────┼─────────────────┘
                          │
                    Repository Code
                          │
                    CI / Evidence
                          │
                  CLOSED / VERIFIED
```

The Product Execution Roadmap is a planning/control layer. It does not replace MAP-X or detailed maps.

## 02 — Authority Hierarchy

1. Governance / legal-regulatory decision record
2. Financial/legal foundation for financial/legal behavior
3. Product lifecycle maps
4. Role architecture and product namespaces
5. Design foundation for visible presentation
6. Domain / Data / State / Security models
7. Repository implementation
8. Tests and runtime evidence

`MUSTASHARK-MASTER-MAP` is the highest governance reference. `MAP-X` is the integration/control layer. Detailed maps remain authoritative within their namespaces. Repository code is implementation truth. CI/Evidence proves implementation state. `CLOSED / VERIFIED` is controlled and never inferred.

## 03 — Separation of Concerns

Governance remains separate from runtime. Governance documents, registries, crosswalks, roadmap records and evidence live under `docs/`. They MUST NOT become runtime dependencies or be bundled into application behavior.

## 04 — Canonical Maps and Namespaces

- `docs/governance/MUSTASHARK-MASTER-MAP.md` — supreme governance/product control reference.
- `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md` — cross-map integration and routing.
- `docs/architecture/FINANCIAL-AUTHORITY-MIGRATION-V1-CANONICAL-2026-08-28.md` — canonical financial authority decision.
- `docs/roadmap/ROADMAP-REGISTRY.md` — roadmap ↔ repository traceability.
- `docs/roadmap/MASTER-AUDIT-MAP.md` — audit/roadmap control.
- `docs/roadmap/MASTER-ROADMAP.md` when present — detailed roadmap.
- `docs/design/D02-SURFACE-MASTER-MAP.md` and `docs/design/D02-ROADMAP-CROSSWALK.md` — visible-surface design governance.
- `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md` — Lawyer Digital Office namespace N1.01–N1.40.

MAP-X convention: `MX-<DOMAIN>-<NN>`. Service convention: `SVC-<DOMAIN>-<NN>`. Existing C-stage, N1, X/Y/Z/W, T/S and D02 identifiers remain in their own namespaces.

## 05 — Mandatory Lifecycle

Every governed build item follows:

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

For new services/material changes, MAP includes:

`INTAKE → IDENTIFY → CLASSIFY → DISCOVER EXISTING ASSETS → IMPACT ANALYSIS → ROUTE → IMPLEMENTATION PLAN`

No stage may be skipped because a change appears small.

## 06 — Mandatory Closure Rule

No item may be marked `CLOSED / VERIFIED` until it is implemented, mapped, tested as applicable, security-reviewed, evidenced, verified on the target branch and recorded.

Minimum closure record:

`Roadmap ID → MAP-X ID → hierarchy/maps → repository files/commit → implementation status → tests → security/review → CI → evidence → final diff audit → target-branch verification → closure record`

Any missing required link or proof means `NOT READY FOR CLOSURE`.

## 07 — Evidence Validity and Reuse

- **VALID → REUSE:** reuse evidence when it is traceable to the exact implementation or an equivalent unchanged artifact and remains applicable.
- **STALE / INSUFFICIENT → REFRESH:** refresh only affected verification.
- **FAILED → BLOCK CLOSURE:** never infer PASS from absence of an error.

Evidence may include unit/integration/API/E2E/security/financial/concurrency/idempotency/permission/typecheck/build/CI/visual/accessibility/RTL/final-diff/target-main/runtime proof.

## 08 — MAP-X Control Contract

Every implementation item must resolve, as applicable, to:

`Roadmap → MAP-X → Architecture/Product-Lifecycle/Security → Design/Domain-Data-State/Auth-Privacy → Repository → Tests/CI → Evidence → Verify Main → Closure`

D02 is mandatory for user-facing surfaces. C3 is mandatory for financial/legal behavior. N1 is mandatory for Lawyer Digital Office surfaces.

## 09 — Financial and Security Non-Negotiables

### Financial

- Server is authoritative for financial truth.
- Browser/client redirect is never proof of payment.
- Provider event must be independently verified before financial fact is posted.
- Financial transitions are atomic, idempotent and concurrency-safe.
- Ledger/financial authority must own financial truth; controllers, UI, wallets and provider adapters must not independently create contradictory truth.
- Reconciliation is mandatory before financial closure.
- Historical financial records and migrations are preserved until safe retirement is proven.

### Security

- Authentication and authorization are separate controls.
- Sensitive routes require explicit authorization and object-level access checks.
- Legal data is private by default.
- Audit logs must cover security-sensitive and financial actions.
- No client-held password/JWT storage pattern may become the security authority.
- Production database remains protected by the active production lockdown; ordinary roadmap work does not authorize destructive production DB operations.

## 10 — C3 Financial/Legal Foundation Status

C3 remains an assumption-free foundation freeze until operating/legal/regulatory questions are resolved. Open questions include provider licensing, custody/settlement structure, commission collection, wallet legal meaning, refund/release authority, no-show/replacement consent, AML/KYC, Jordan launch requirements, corporate structure, IP ownership, professional secrecy and electronic-consent requirements.

No code change is authorized merely because an unresolved C3 question exists.

## 11 — Financial Surface Verification

Current canonical MAP-X financial dependencies remain conservative:

| Path | Status | MAP-X |
|---|---|---|
| Fund Milestone | NEEDS VERIFICATION | MX-FIN-10 |
| Release Milestone | NEEDS VERIFICATION | MX-FIN-11 |
| Refund Milestone | NEEDS VERIFICATION | MX-FIN-12 |
| Cancel | NEEDS VERIFICATION | MX-FIN-13 |
| Transfer / No-show | DEEP FINANCIAL & LEGAL VERIFICATION | MX-FIN-14 |
| Deposit / Fund origin | OPEN / FOUNDATION DEPENDENT | MX-FIN-15 |

## 12 — Lawyer Digital Office / N1

N1.01–N1.40 remains the Lawyer Digital Office namespace. High-value clusters include command center, client 360/intake, consultation inbox, lawyer workbench, memorandum/document center, matter/case workspace, court/meeting modes, relationship conversion, financial center, earnings/settlement/reconciliation, tasks/workflow, security/privacy, mobile/desktop, law-firm/team workspace, intelligence and continuity.

All N1 surfaces intersect D02, role/lifecycle maps and applicable C-stage financial/legal controls without consuming those identifiers.

## 13 — Universal Surface Contract

Every screen/workspace/modal/device mode must declare:

`Surface ID → Service ID when applicable → Role → Lifecycle → MAP-X → D02 → Authoritative API/state → Data classification → Permission model → UI states → RTL/LTR → Responsive behavior → Accessibility → Security/privacy presentation → Tests → CI evidence → Closure evidence`

## 14 — Historical / Experimental Work Rule

Experimental branches and PRs are not product authority. In particular, closed experimental financial-retirement work must not be treated as canonical architecture. `platform_dues` and historical migrations are preserved until a separate evidence-based reconciliation/retirement decision is approved.

No artifact is `SAFE TO DELETE` merely because it is old, experimental, inconvenient or inconsistent with a newer proposal.

## 15 — Build Execution Gate

The execution gate for every roadmap item is:

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

A new service or material change must also pass:

`INTAKE → IDENTIFY → DISCOVER EXISTING ASSETS/CAPABILITIES → IMPACT ANALYSIS → ROUTE → IMPLEMENTATION PLAN`

The Product Execution Roadmap sequences work; MAP-X controls cross-map traceability; the repository implements; CI/Evidence proves; Main verification closes.

## 16 — Release Gate

Mustashark cannot be declared launch-ready until:

1. P0 security controls are verified.
2. Provider payment and Financial Authority are verified.
3. Escrow/wallet/settlement/reconciliation gates are verified.
4. Core client marketplace and consultation journeys are E2E verified.
5. Lawyer Digital Office core workflow is E2E verified.
6. Lawyer SaaS trial/subscription entitlement is verified.
7. Legal-service catalog and representation journey are verified.
8. Privacy, consent, audit, accessibility and RTL/LTR requirements are evidenced.
9. Required typecheck/build/security/financial/E2E/CI gates are green.
10. Final diff audit and target-Main verification are recorded.

## 17 — Governance State

**Governance state:** `ADOPTED — CANONICAL OPERATING HIERARCHY + PRODUCT NORTH STAR + CAPABILITY INVENTORY V1 + PRODUCT EXECUTION ROADMAP V1`

**Canonical implementation baseline:** `main @ 93378a1f72517ab3dedd0eef06499d4d8f4094ce`

**Current branch:** `governance/capability-inventory-2026-09-03`

**Runtime impact:** `NONE — DOCUMENTATION / GOVERNANCE ONLY`

**Branding:** `Mustashark` is the canonical product spelling in this Master Map and all new governance text.
