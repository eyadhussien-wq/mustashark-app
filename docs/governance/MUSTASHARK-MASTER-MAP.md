# MUSTASHARK — MASTER MAP

**Status:** CANONICAL GOVERNANCE AUTHORITY — ADOPTED
**Adoption date:** 2026-08-25
**Product Master Map adoption:** 2026-09-03
**Capability Inventory V1:** 2026-09-03 — `main` baseline `93378a1f72517ab3dedd0eef06499d4d8f4094ce`
**Scope:** governance, product vision, capability inventory, roadmap control, cross-map traceability, implementation closure, evidence requirements.

## 00 — Mustasharek product north star

Mustasharek is a two-sided legal-services platform with two primary experiences:

### Client experience

The client opens Mustasharek to find the right lawyer, communicate with that lawyer, purchase legal services, and manage the resulting legal relationship from inside the application.

The client journey is:

`Discover Lawyer → Review Profile → Communicate → Request Service → Pay In-App → Book / Start Service → Receive Service → Documents / Case Workspace → Follow-up → Evaluate`

The platform must support both:

- an existing lawyer whom the client already knows; and
- a new lawyer discovered through Mustasharek.

### Lawyer experience

The lawyer opens Mustasharek as a **digital law office**: a professional workspace through which the lawyer can operate substantially like a real-world practice while serving clients through the platform.

The lawyer experience includes, as applicable:

- professional profile and discovery;
- client intake and relationships;
- consultations and appointments;
- secure communication;
- cases / matters;
- documents and evidence;
- tasks and workflow;
- legal-service offers and fees;
- service milestones where applicable;
- payments and verified entitlements;
- settlement / payout visibility;
- notifications and reminders;
- office administration;
- reporting and operational controls.

### Lawyer subscription model

The product-commercial model adopted for planning is:

`Lawyer → 30-day free trial → 50 JOD/month subscription`

The first month is a trial. After the trial, the target subscription price is **50 Jordanian dinars per month**.

Subscription entitlement is a platform-service concern and MUST remain separate from client funds and lawyer earned service entitlements.

No subscription payment implementation is considered complete merely because the price is documented. It must pass the applicable product, authorization, payment, entitlement, security, and CI gates before closure.

### Client-to-lawyer service payment model

The product model is:

`Client → Mustasharek payment flow → verified service payment → lawyer entitlement / settlement`

Clients pay for legal services through Mustasharek. The financial architecture must preserve the distinction between:

1. client money / service payment;
2. lawyer earned entitlement;
3. Mustasharek platform subscription revenue;
4. any separately approved platform entitlement or fee;
5. external payment-provider settlement status.

These are not interchangeable balances and MUST NOT be represented by one legacy business-policy field or one ambiguous financial authority.

## 00.1 — Product capability strategy

The target product is not a simple consultation marketplace. It combines:

`Legal Marketplace + Digital Law Office + Secure Client Relationship + Payments + Case/Document Workflow + Settlement/Reconciliation + Lawyer SaaS`

The product roadmap may incorporate validated capabilities found in leading global legal-service products and the capabilities already present in Mustasharek. Such capabilities must be mapped into the canonical product/domain/security architecture before implementation; copying feature lists without architectural classification is prohibited.

## 00.2 — Main product capability map

| Capability domain | Target outcome | Classification rule |
|---|---|---|
| Identity & Trust | Safe, verified users and professional lawyers | Security-first; server authoritative |
| Lawyer Marketplace | Find and select the right lawyer | Discovery, profile, availability, trust |
| Consultation | Buy and deliver legal consultations | Payment + booking + service lifecycle |
| Digital Law Office | Lawyer operates an online practice | Workspace, clients, cases, tasks, documents |
| Client Relationship | Continuous lawyer-client relationship | Membership, communication, history |
| Legal Services | Multiple services beyond consultation | Service catalog / offers / milestones |
| Documents | Secure legal document lifecycle | Access control, auditability, privacy |
| Payments | Client pays through platform | Provider verification + Financial Authority |
| Financial Authority | One authoritative financial truth | Ledger + atomicity + idempotency + reconciliation |
| Settlement | Correct lawyer/platform settlement | Verified internal and external states |
| Lawyer SaaS | Trial and recurring subscription | Entitlement separate from client funds |
| Ratings & Reputation | Trustworthy marketplace signals | Abuse-resistant and auditable |
| Notifications | Timely operational communication | Delivery ledger / dedupe |
| Administration | Secure platform operations | Least privilege + audit |
| Security / Privacy | Protect legal and financial data | Mandatory gate across all domains |

## 00.3 — Capability Inventory V1 — main baseline

**Inventory basis:** canonical `main` at `93378a1f72517ab3dedd0eef06499d4d8f4094ce`. This inventory is an implementation assessment, not a declaration that all listed capabilities are production-complete.

| # | Capability | Main evidence / foundation | Status | Immediate disposition |
|---|---|---|---|---|
| C01 | Identity & Authentication | `requireAuth` + users DB re-check | **EXISTS** | Preserve; complete route audit |
| C02 | Authorization / Role Guards | `requireRole`, `requireApprovedLawyer` on sensitive routes | **EXISTS** | Complete route-by-route authz audit |
| C03 | Lawyer Professional Verification | verification schema/routes/workflow | **EXISTS** | Verify end-to-end closure |
| C04 | Lawyer Profile | profile API/mobile surface/profile-change moderation | **EXISTS** | Preserve; verify publication rules |
| C05 | Lawyer Discovery | public lawyer profile exists; discovery foundation present | **BROKEN / INCOMPLETE** | Close search/filter/selection journey |
| C06 | Lawyer Availability | availability API + slots/time-block foundation | **EXISTS** | Verify timezone/concurrency behavior |
| C07 | Booking / Scheduling | bookings + time blocks + idempotency/versioning | **EXISTS** | Preserve; complete E2E gate |
| C08 | Consultation Lifecycle | consultation events + booking lifecycle | **EXISTS** | Verify complete state transitions |
| C09 | Client ↔ Lawyer Relationship | lawyer clients + case memberships foundations | **EXISTS** | Verify access boundaries |
| C10 | Secure Messaging / Communication | roadmap/surface contract and support communication exist | **NEEDS REFACTOR / VERIFICATION** | Prove actual secure in-app runtime capability |
| C11 | Notifications | `user_notifications` + authenticated notification API | **EXISTS** | Verify delivery/dedupe/read lifecycle |
| C12 | Documents | document handovers + legal representation documents | **EXISTS** | Complete privacy/access audit |
| C13 | Cases / Matters | cases + memberships + hearings | **EXISTS** | Verify client/lawyer isolation |
| C14 | Legal Representation | quotes + proposals + agreements + representation documents | **EXISTS** | Complete end-to-end journey |
| C15 | Payment Proofs | payment proof schema/API | **EXISTS** | Preserve as supported payment-proof path |
| C16 | Online Provider Payment | payment/provider boundary not yet proven as one complete canonical flow | **MISSING / NEEDS REFACTOR** | Build/verify provider → verified event → Financial Authority |
| C17 | Financial Authority | financial components exist but one authoritative platform-wide truth is not yet proven | **NEEDS REFACTOR** | Establish/verify authoritative boundary |
| C18 | Escrow / Milestones | representation finance + fund/allocate/release foundations | **EXISTS** | Complete financial E2E/concurrency evidence |
| C19 | Lawyer Wallet | lawyer wallet + transactions | **EXISTS** | Reconcile against Financial Authority |
| C20 | Client Wallet | client wallet foundation | **EXISTS** | Reconcile against Financial Authority |
| C21 | Settlement / Payout | bank accounts + release/settlement foundations | **NEEDS REFACTOR / VERIFICATION** | Close entitlement → settlement → payout path |
| C22 | Reconciliation | no complete provider/payment/ledger/wallet/settlement reconciliation closure proven | **MISSING** | Design and implement reconciliation control |
| C23 | Lawyer SaaS Subscription | product rule documented: 30-day trial → 50 JOD/month | **MISSING** | Implement entitlement/subscription lifecycle |
| C24 | Digital Law Office Workspace | N1 foundation + lawyer mobile surfaces + clients/cases/docs | **NEEDS REFACTOR** | Consolidate into complete lawyer workspace |
| C25 | Tasks / Workflow Engine | N1 target exists; complete operational engine not proven | **MISSING** | Design → implement → test |
| C26 | General Legal Service Catalog | consultation/representation foundations exist; general service catalog not proven | **MISSING** | Define service types/offers/lifecycle |
| C27 | Ratings / Reputation | lawyer reviews + API/admin review surface | **EXISTS** | Harden eligibility/anti-abuse/audit |
| C28 | Administration | admin routes/dashboard/audit surfaces | **EXISTS** | Security/least-privilege review |
| C29 | Audit Logging | admin audit logs and domain event foundations | **EXISTS** | Verify coverage of security/financial actions |
| C30 | Terms / Legal Consent | agreements exist; canonical Terms Consent implementation requires verification | **NEEDS VERIFICATION** | Verify main + server enforcement |
| C31 | Privacy / Data Access Boundary | auth/role foundations and private legal-data surfaces | **NEEDS REFACTOR / AUDIT** | Complete object-level access audit |
| C32 | CI / Security Gates | multiple workflow/security gates exist | **EXISTS** | Prove complete product/financial matrix green |

### Capability Inventory interpretation

- **EXISTS does not mean CLOSED.** It means a material implementation foundation exists on the canonical baseline.
- **BROKEN / INCOMPLETE** means the capability is present but does not yet satisfy the target journey or has a known defect/verification gap.
- **NEEDS REFACTOR** means valid capability exists but its current boundary or composition does not yet satisfy the canonical architecture.
- **MISSING** means the capability required by the Product North Star is not sufficiently implemented on `main`.
- **SAFE TO DELETE:** no capability is currently authorized for deletion by this inventory alone.

## 00.4 — Priority closure backlog

The inventory establishes the following product-completion order:

### P0 — Financial integrity

`C16 Online Provider Payment → C17 Financial Authority → C18 Escrow → C19/C20 Wallets → C21 Settlement → C22 Reconciliation`

Required target:

`Service → Payment Obligation → Provider → Verified Provider Event → Financial Authority → Ledger / Escrow Compatibility → Lawyer Entitlement → Settlement → Reconciliation`

### P0 — Security integrity

`C01/C02/C03/C12/C13/C30/C31`

Required target:

`Identity → Authentication → Authorization → Object/Data Boundary → Audit → Monitoring → Verification`

### P1 — Client marketplace completion

`C04/C05/C06/C07/C08/C09/C10/C11/C14/C15/C26/C27`

Required target:

`Discover → Profile → Communicate → Request Service → Pay → Book / Start → Deliver → Documents / Case → Complete → Evaluate`

### P1 — Lawyer Digital Law Office

`C24/C25` plus integration of `C09/C12/C13/C14/C21/C27/C28`

Required target:

`Professional Verification → Trial → Workspace → Clients → Calendar → Consultations → Cases → Documents → Tasks → Fees → Service Delivery → Entitlement → Settlement`

### P1 — Lawyer SaaS

`C23`

Required target:

`Verified Lawyer → 30-Day Trial → Active Subscription → 50 JOD/month → Renewal / Expiry → Entitlement Enforcement`

Subscription state MUST NOT grant access beyond authorization and MUST NOT become a financial authority for client service money.

## 00.5 — Implementation truth table

Every capability and every existing implementation is classified using the following mandatory table:

| Status | Meaning | Action |
|---|---|---|
| **EXISTS** | Required capability exists and evidence is sufficient for its current scope | Preserve; verify where needed |
| **BROKEN** | Required capability exists but has a functional/security/build/runtime defect | Repair; test; verify |
| **DUPLICATED** | Multiple implementations represent the same responsibility | Consolidate only after behavior and data lineage are reconciled |
| **MISSING** | Required product/security capability is not implemented | Design → implement → test → verify |
| **NEEDS REFACTOR** | Capability exists but violates the target architecture/boundary | Refactor without destroying valid data/history |
| **SAFE TO DELETE** | Artifact is proven obsolete, unreachable, redundant, and has no required historical/data/migration role | Delete only after evidence and dependency audit |

**No item may be marked `SAFE TO DELETE` merely because it is old, inconvenient, experimental, or inconsistent with a newer design document.**

## 00.6 — Work classification rule

All future work must first answer:

`EXISTS → BROKEN → DUPLICATED → MISSING → NEEDS REFACTOR → SAFE TO DELETE`

The classification is an audit decision, not a development shortcut.

For each item we record:

`Product Capability → Roadmap ID → MAP-X ID → Architecture → Domain/Data/State → Auth/Privacy → Repository → Tests → CI Evidence → Main Verification`

Only then can implementation begin.

## 00.7 — Product completion definition

Mustasharek is considered product-complete only when the core journeys are operational end-to-end, not merely when individual APIs or screens exist.

### Client core journey

`Register / Verify → Find Lawyer → Select → Communicate → Request Service → Pay → Book / Start → Receive Service → Documents / Case → Complete → Evaluate`

### Lawyer core journey

`Register → Professional Verification → Trial → Lawyer Workspace → Configure Profile / Availability → Receive Client → Accept Service → Deliver Service → Manage Case / Documents → Earn → Settlement → Subscription`

### Financial core journey

`Service → Payment Obligation → Provider → Verified Provider Event → Financial Authority → Ledger / Escrow Compatibility → Lawyer Entitlement → Settlement → Reconciliation`

### Security core journey

`Identity → Authentication → Authorization → Data Access Boundary → Audit → Monitoring → Verification`

## 00.8 — Non-negotiable product principles

1. **Main is the canonical implementation reference.**
2. **Client money and lawyer SaaS subscription money are separate domains.**
3. **Financial truth is server-authoritative.**
4. **The browser/client never proves payment.**
5. **A verified provider event is required before treating external payment as financial fact.**
6. **The Financial Authority owns financial truth; controllers, wallets, webhooks, and UI do not independently mutate it.**
7. **Authorization is independent of authentication.**
8. **Legal data is private by default and access-controlled.**
9. **Historical migrations and financial records are preserved until reconciliation proves they can be retired safely.**
10. **Experimental branches are not product authority.**
11. **No feature is complete until its applicable tests, security checks, CI evidence, and target-Main verification pass.**
12. **No destructive production database action is part of ordinary development.**

## 01 — Canonical operating hierarchy

The project adopts this hierarchy as the canonical operating model:

```text
                 MUSTASHARK-MASTER-MAP
                          │
                    PRODUCT NORTH STAR
                          │
                   CAPABILITY INVENTORY
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

The Capability Inventory is the bridge between the Product North Star and implementation work. It does not replace MAP-X or detailed maps.

## 02 — Authority hierarchy

`MUSTASHARK-MASTER-MAP` is the highest-level governance reference for the project.

`PRODUCT NORTH STAR` defines the canonical product target.

`CAPABILITY INVENTORY` defines the current implementation classification against that target.

`MAP-X` is the integration and control layer.

Detailed maps are authoritative for their own namespaces and provide implementation-level detail. They are linked through MAP-X and do not silently become competing master authorities.

Repository code is the actual implementation source. Presence of code is not proof of completion.

CI and other declared Evidence prove the state of implementation. `CLOSED / VERIFIED` is a controlled outcome, not an assumption.

## 03 — Separation of concerns

Governance is intentionally separated from runtime.

- Governance documents, registries, crosswalks, capability inventory and evidence records live under `docs/`.
- Runtime/application behavior remains under the application source trees.
- Governance artifacts MUST NOT be imported by runtime code, bundled into the application, or made runtime dependencies merely for traceability.
- A governance change is not a runtime change unless a separate implementation change explicitly modifies runtime code.

## 04 — Canonical roles

### MUSTASHARK-MASTER-MAP
The supreme control reference. It defines authority order, closure rules, product target, capability classification, and the non-negotiable requirement for traceability and evidence.

### PRODUCT NORTH STAR
The canonical target for client, lawyer, financial, security and subscription journeys.

### CAPABILITY INVENTORY
The controlled implementation view of what exists, what is incomplete, what is missing, and what requires refactoring on the canonical baseline. It must be refreshed after material implementation changes.

### MAP-X
The cross-map integration and control layer. It binds roadmap items to architecture, product/lifecycle, design, domain/data/state, security/auth/privacy, repository implementation, CI and verification.

### Architecture / Product-Lifecycle / Security
The primary structural branches of the operating hierarchy. Their detailed maps remain authoritative within their namespaces.

### Design / Domain-Data-State / Auth-Privacy
The principal detail layers underneath the corresponding branches and must remain traceable through MAP-X.

### Repository Code
The implementation source. Code proves what exists; it does not by itself prove that the work is verified or closed.

### CI / Evidence
The proof layer. Evidence may be reused when it remains valid for the exact implementation being closed; otherwise the affected verification must be refreshed.

### CLOSED / VERIFIED
The final controlled state, reached only when all applicable mapping, implementation, review, verification and evidence requirements are satisfied and recorded.

## 05 — Mandatory lifecycle

Every governed build item follows:

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

No stage may be skipped because a change appears small.

## 06 — Mandatory closure rule

> **No stage may be marked CLOSED / VERIFIED until it has been implemented, linked to the applicable maps, tested, evidenced, verified, and its closure has been recorded.**

A roadmap entry, documentation statement, passing local command, or code presence alone MUST NOT be treated as closure evidence.

Minimum closure record:

```text
Roadmap ID
→ MAP-X ID
→ applicable hierarchy/map mappings
→ repository files / commit
→ implementation status
→ applicable tests
→ security/review status
→ CI status
→ verification evidence
→ final diff audit
→ target-branch verification
→ closure record
```

Any missing required link or proof means `NOT READY FOR CLOSURE`.

## 07 — Evidence validity and reuse

The purpose of Evidence is to preserve verified project state and prevent unnecessary rework.

- **VALID → REUSE:** Existing evidence may be reused when it is traceable to the exact implementation/commit or an equivalent unchanged artifact and remains applicable to the closure decision.
- **STALE / INSUFFICIENT → REFRESH:** Only the affected verification must be refreshed when the existing evidence no longer proves the required state.
- **FAILED → BLOCK CLOSURE:** Failed evidence cannot be converted into PASS by inference or by ignoring the failure.

A newly adopted governance rule does not, by itself, invalidate previously valid evidence. A material implementation change, scope change, security concern, or evidence-expiry rule may require fresh verification.

## 08 — Authority resolution

When sources disagree, use this order unless a stronger governance/legal decision record explicitly overrides it:

1. Governance / legal-regulatory decision record
2. Financial/legal foundation for financial/legal behavior
3. Product lifecycle maps
4. Role architecture and product namespaces
5. Design foundation for visible presentation
6. Domain / Data / State / Security models
7. Repository implementation
8. Tests and runtime evidence

Historical maps are preserved as lineage; they are not silently rewritten into a new authority.

## 09 — MAP-X control contract

MAP-X is the mandatory integration layer for build work.

Every implementation item must resolve, as applicable, to:

`Roadmap → MAP-X → Architecture/Product-Lifecycle/Security → Design/Domain-Data-State/Auth-Privacy → Repository → Tests/CI → Evidence → Verify Main → Closure`

MAP-X identifiers are integration identifiers only and MUST NOT replace existing namespace identifiers.

## 10 — Detailed-map rule

A detailed map may define its own IDs, semantics and verification requirements. It must not silently become a competing master authority.

If two detailed maps conflict, the conflict is registered and resolved through governance/MAP-X; it is not resolved by silently editing one historical source.

## 11 — Evidence rule

Evidence must be specific enough to reproduce the closure decision. Depending on the stage, evidence may include:

- test output;
- typecheck/build output;
- security verification;
- API/integration/E2E results;
- concurrency/idempotency results;
- CI status;
- visual/accessibility/RTL verification;
- final diff audit;
- target-branch verification;
- runtime/preview proof.

`PASS` is not inferred from the absence of an error message. The actual result must be recorded.

## 12 — Governance registry

The canonical control set currently includes:

- `docs/governance/MUSTASHARK-MASTER-MAP.md`
- `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md`
- `docs/architecture/FINANCIAL-AUTHORITY-MIGRATION-V1-CANONICAL-2026-08-28.md`
- `docs/roadmap/ROADMAP-REGISTRY.md`
- `docs/roadmap/MASTER-AUDIT-MAP.md`
- `docs/roadmap/MASTER-ROADMAP.md` when present
- `docs/design/D02-SURFACE-MASTER-MAP.md` when present
- `docs/design/D02-ROADMAP-CROSSWALK.md`
- `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md`

The list is a governance registry, not a runtime dependency list.

## 13 — Adoption / change control

Any future change to the control model MUST:

1. identify the governing rule being changed;
2. preserve traceability to the prior decision;
3. update this Master Map when authority changes;
4. update MAP-X when cross-map behavior changes;
5. update detailed maps only within their namespaces;
6. provide evidence for implementation changes;
7. record closure only after verification.

No parallel "master" map may silently supersede this document.

## 14 — Current adoption statement

The project formally adopts the following operating model:

- `MUSTASHARK-MASTER-MAP` = highest governance reference.
- `PRODUCT NORTH STAR` = canonical product target for client, lawyer, financial, and subscription journeys.
- `CAPABILITY INVENTORY` = controlled implementation classification against the canonical target.
- `MAP-X` = integration/control layer.
- Architecture / Product-Lifecycle / Security = primary structural branches.
- Design / Domain-Data-State / Auth-Privacy = detail layers.
- Repository Code = actual implementation.
- CI / Evidence = proof layer.
- `CLOSED / VERIFIED` = controlled final state.
- Valid Evidence may be reused when still applicable; stale or insufficient Evidence is refreshed only where needed.
- Governance remains separate from runtime.

**Governance state:** `ADOPTED — CANONICAL OPERATING HIERARCHY + PRODUCT NORTH STAR + CAPABILITY INVENTORY V1`
**Capability Inventory baseline:** `main @ 93378a1f72517ab3dedd0eef06499d4d8f4094ce`
**Runtime impact:** `NONE — DOCUMENTATION / GOVERNANCE ONLY`
