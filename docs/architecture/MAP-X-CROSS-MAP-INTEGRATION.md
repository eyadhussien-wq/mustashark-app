# Mustashark — MAP-X Cross-Map Integration & Build Control System

**Status:** CANONICAL GOVERNANCE MAP — ADOPTED
**Project identity:** Mustashark
**Scope:** all build stages, all roadmap/lifecycle families, all user surfaces, all design surfaces, all financial/legal controls, all verification gates.

## 00 — Purpose

MAP-X is the integration layer between the existing roadmap, lifecycle, role, product, financial/legal, security, data, design and verification maps.

It does not replace the canonical maps. It makes their intersections explicit so that every build item has one traceable identity and cannot drift from another map.

MAP-X is also the official intake, routing and change-impact control layer for new services, features and material changes. A new request enters MAP-X before implementation so that its identity, affected maps, existing reusable capabilities, implementation location and verification requirements are known before code is changed.

## 01 — The Build Pyramid

```text
L0  GOVERNANCE / IDENTITY / NON-NEGOTIABLES
│
├─ Project Identity: Mustashark
├─ Security / Privacy / Legal / Regulatory gates
├─ No premature PASS
└─ Evidence before closure
│
L1  FOUNDATIONAL FINANCIAL + LEGAL
│
├─ C1 Financial Surface Inventory
├─ C2 Financial/Legal Risk & Control Framework
├─ C3 Financial & Legal Operating Foundation
├─ C4 Runtime / Concurrency / External-Side-Effect Proof
└─ C5+ future control stages (reserved; never reuse IDs)
│
L2  PRODUCT ROLES
│
├─ X = Client
├─ Y = Lawyer
├─ Z = Admin
└─ W = Cross-System
│
L3  PRODUCT / LIFECYCLE
│
├─ N1 = Lawyer Digital Office
├─ T = transaction/service lifecycles
└─ S = service/system lifecycles
│
L4  DESIGN FOUNDATION
│
└─ D02 = mandatory design foundation for every visible surface
│
L5  DOMAIN + IMPLEMENTATION
│
├─ Domain
├─ Data
├─ State Machine
├─ API / Service / UI
├─ Security / Privacy
└─ Repository files
│
L6  PROOF / CLOSURE
│
├─ Unit / Integration / Concurrency tests
├─ Visual QA
├─ CI
├─ Diff audit
└─ Verify Main
```

## 02 — Canonical Trace Formula

Every implementation item must resolve to:

```text
Roadmap ID
→ Service ID when applicable
→ MAP-X ID
→ Role X/Y/Z/W
→ Lifecycle T/S
→ N1 if Lawyer Product
→ C-stage dependency if financial/legal
→ D02-01…D02-10
→ Architecture
→ Domain
→ Data
→ State Machine
→ Security / Privacy
→ Repository files
→ Tests / CI
→ Evidence
→ Verify Main
→ Closure
```

A missing applicable link means the item is **NOT READY FOR CLOSURE**.

## 03 — MAP-X ID Convention

MAP-X IDs are integration identifiers only. They must never replace or consume existing C-stage, N1, X/Y/Z/W, T/S or D02 identifiers.

Format:

`MX-<DOMAIN>-<NN>`

Examples:

- `MX-CLIENT-01`
- `MX-LAWYER-01`
- `MX-FIN-01`
- `MX-DESIGN-01`
- `MX-SEC-01`
- `MX-QA-01`

## 04 — Service Identity Convention

A new service or material product capability receives a stable **Service ID** at MAP-X intake when a distinct service identity is required.

Format:

`SVC-<DOMAIN>-<NN>`

Examples:

- `SVC-LAW-042`
- `SVC-CLIENT-018`
- `SVC-ADMIN-007`

`Service ID` identifies the service/capability itself.

`MAP-X ID` identifies the cross-map integration record.

They are related but must not be conflated.

A service may reuse existing infrastructure, domains, APIs, states, components or CI gates. Reuse does not require a new identifier for the reused asset; the new Service ID identifies the requested capability.

## 05 — New Service Intake & Cross-Map Routing

Every new service, feature or material change request enters through MAP-X before implementation begins. The request may originate from a lawyer, client, admin, product decision, security finding, engineering discovery or other authorized project source.

MAP-X performs the following intake and routing sequence:

```text
NEW REQUEST
    │
    ▼
  MAP-X INTAKE
    │
    ├─ Create Service ID when applicable
    ├─ Classify the request
    ├─ Identify Role / Owner
    ├─ Identify Product / Lifecycle
    ├─ Determine Architecture impact
    ├─ Determine Design impact
    ├─ Determine Domain / Data / State impact
    ├─ Determine Security / Auth / Privacy impact
    ├─ Determine Repository / implementation location
    ├─ Determine applicable Tests / CI / Evidence
    └─ Create MAP-X integration record
              │
              ▼
       CROSS-MAP ROUTING
              │
              ▼
       IMPLEMENTATION PLAN
              │
              ▼
          REPOSITORY
              │
              ▼
           PR / CI
              │
              ▼
          EVIDENCE
              │
              ▼
         VERIFICATION
              │
              ▼
       CLOSED / VERIFIED
```

MAP-X is the routing and traceability control plane. It does not replace the detailed maps, Repository implementation, or CI.

MAP-X MUST NOT become a runtime dependency, a CI replacement, or a blanket CI-rerun trigger.

The intake step is governance work. Once implementation is authorized, the implementation proceeds through the normal Repository/PR/CI path.

## 06 — Existing Asset & Capability Reuse / Extension Rule

Before designing or building a new capability, MAP-X MUST first identify relevant existing assets and capabilities that may be reused or extended.

The control question is:

> **What already exists, what can it support, what can be reused, what can be extended, and what genuinely must be built new?**

MAP-X therefore distinguishes three primary outcomes:

```text
EXISTING + REUSABLE
        │
        ▼
      REUSE

EXISTING + EXTENSIBLE
        │
        ▼
      EXTEND

EXISTING + INSUFFICIENT
        │
        ▼
 REDESIGN / BUILD NEW
```

The assessment MUST consider, as applicable:

- existing architecture and structural capabilities;
- existing APIs and service boundaries;
- existing domain models;
- existing data structures and authoritative sources;
- existing state machines and transitions;
- existing authentication and authorization capabilities;
- existing UI components and design primitives;
- existing infrastructure and integrations;
- existing security/privacy controls;
- existing CI and verification gates;
- existing valid Evidence that can be reused.

The objective is **minimum safe change**, not maximum new construction.

An existing asset is not assumed reusable merely because it exists. Reuse or extension must be supported by appropriate evidence when the capability is security-sensitive, financial/legal, architectural, stateful, or otherwise material.

This rule prevents unnecessary reconstruction of already-built foundations and makes the project's existing engineering capacity visible to future work.

## 07 — Change Impact Analysis

MAP-X MUST identify the affected scope before implementation.

For every new request, determine:

```text
Existing assets
       │
Existing capabilities
       │
       ▼
  CHANGE IMPACT
       │
 ┌─────┼─────┐
 ▼     ▼     ▼
Reuse Extend New
 └─────┼─────┘
       ▼
 Minimum Safe Change
```

Change impact is not limited to files. It includes affected architecture, product lifecycle, design surfaces, domain/data/state, security/privacy, permissions, integrations, CI gates and Evidence.

A small request must not trigger a full-system rebuild merely because the request is new. Conversely, a request that crosses an existing boundary must not be treated as a local change merely because the code diff is small.

## 08 — Cross-Map Rules

### Rule A — D02 is mandatory

Every user-facing surface is D02-governed from architecture through verification. D02 controls presentation and interaction; it does not become financial authority.

### Rule B — C3 is mandatory for financial/legal behavior

Deposit, Fund, Escrow, Release, Refund, Cancel, Transfer, Settlement, Reconciliation, Commission and entitlement-ledger behavior must map to C3 before closure.

### Rule C — N1 is the Lawyer Product namespace

N1 defines the Lawyer Digital Office product. D02 defines its visual/interaction foundation. C3 governs financial/legal authority where applicable.

### Rule D — role maps do not replace lifecycle maps

X/Y/Z/W describe who/where. T/S describe the business lifecycle. MAP-X binds them.

### Rule E — no duplicated authority

A state may be displayed in several surfaces, but its authoritative source must be declared once in the backend/data/state model.

### Rule F — closure requires evidence

Architecture presence is not implementation completion. Implementation presence is not verification. Verification evidence is required for `CLOSED / VERIFIED`.

### Rule G — MAP-X routes; it does not execute

MAP-X classifies and routes work to the applicable maps and implementation targets. Repository code remains the actual implementation source and CI remains the implementation verification mechanism.

### Rule H — CI is impact-driven, not MAP-X-driven

MAP-X may identify the Tests/CI/Evidence required by the nature of the change, but MAP-X does not automatically require a blanket rerun of unrelated CI or historical tests. Existing valid Evidence may be reused under the Evidence Validity & Reuse Rule.

## 09 — D02 Integration Matrix

| Build area | D02 responsibility | MAP-X requirement |
|---|---|---|
| Client authentication | D02-01/02/03/04/05/06/08/09 | MX-CLIENT-01 |
| Client consultation | D02-03/04/05/08/09 | MX-CLIENT-02 |
| Client payment presentation | D02-04/05/08/09 + C3 | MX-FIN-01 |
| Client refund/cancel/transfer | D02-04/05/08/09 + C3 | MX-FIN-02 |
| Lawyer N1 dashboard | D02-01/02/03/04/05/06/08/09 | MX-LAWYER-01 |
| Lawyer consultation office | D02-03/04/05/06/08/09 | MX-LAWYER-02 |
| Lawyer memorandum/document/court mode | D02-07/08/09/10 | MX-LAWYER-03 |
| Lawyer financial center | D02-04/05/06/08/09/10 + C3 | MX-FIN-03 |
| Admin operations | D02-03/04/05/06/08/09/10 | MX-ADMIN-01 |
| Shared states/search/notifications | D02-03/04/05/06/08/09 | MX-SHARED-01 |
| Accessibility / RTL / LTR | D02-08/09/10 | MX-DESIGN-01 |
| Visual regression | D02-09/10 | MX-QA-01 |

## 10 — C3 Foundation Integration

C3 remains open and must be treated as an assumption-free foundation freeze until the operating/legal/regulatory model is verified.

### C3 decision questions now registered

1. Is Mustashark solely a technology platform connecting clients with licensed lawyers?
2. Who is the licensed payment provider in each launch market?
3. Does money ever enter a Mustashark-owned operating account?
4. Can provider settlement go directly to the lawyer?
5. How is Mustashark's commission collected and reconciled?
6. Are internal `wallet` tables only entitlement/ledger records rather than e-money wallets?
7. Who has legal authority to initiate refund, release, transfer or forfeiture?
8. What contractual consent authorizes lawyer replacement after no-show?
9. What is the external reconciliation authority?
10. Which AML/KYC obligations apply to Mustashark, the lawyer and the provider?
11. Which Jordanian requirements apply at launch, and what changes for Qatar/Egypt/future markets?
12. What corporate/banking structure is required before commercial launch?
13. Can operation begin under an individual owner or is a local corporate entity required?
14. What IP ownership and licensing structure protects Mustashark when the operating entity changes country?
15. Which data-protection, confidentiality and professional-secrecy obligations apply to legal consultations and documents?
16. Which electronic-consent records are required for service, replacement, payment, refund and representation transitions?

**Status:** `C3 FOUNDATION — 🟡 OPEN / ASSUMPTION FREEZE & REALITY EXTRACTION`

No code change is authorized merely because a C3 question is unresolved.

## 11 — C1 Financial Surface Inventory Integration

Current financial paths remain under verification:

| Path | Current status | MAP-X dependency |
|---|---|---|
| Fund Milestone | 🟡 NEEDS VERIFICATION | MX-FIN-10 |
| Release Milestone | 🟡 NEEDS VERIFICATION | MX-FIN-11 |
| Refund Milestone | 🟡 NEEDS VERIFICATION | MX-FIN-12 |
| Cancel | 🟡 NEEDS VERIFICATION | MX-FIN-13 |
| Transfer / No-show | 🔴 FINANCIAL & LEGAL RISK / DEEP VERIFICATION | MX-FIN-14 |
| Deposit / Fund origin | 🟡 OPEN / FOUNDATION DEPENDENT | MX-FIN-15 |

The current classification is deliberately conservative and is not a claim that the implementation is defective in every case.

## 12 — N1 Lawyer Digital Office Integration

N1 remains a dedicated product namespace. All N1 surfaces intersect D02 and role/lifecycle maps without consuming C-stage identifiers.

The complete N1.01–N1.40 surface list remains canonical in `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md` and D02 surface mapping.

High-value N1 clusters:

- Command Center / Dashboard
- Client 360 and intake
- Consultation inbox and marketplace
- Lawyer workbench
- Consultation workspace
- Memorandum studio
- Document center
- PDF / print / share / court mode
- Matter / case workspace
- Client-meeting mode
- Relationship conversion from consultation to representation
- Financial center / entitlement ledger
- Earnings / settlement / reconciliation
- Tasks / workflow queue
- Security / confidentiality / privacy
- Mobile and desktop Lawyer Office
- Law-firm / team workspace
- Intelligence / analytics
- Continuity / recovery

## 13 — Universal Surface Contract

Every screen, drawer, modal, workspace or device mode must declare:

```text
Surface ID
Service ID when applicable
Role
Lifecycle
MAP-X ID
D02 mapping
Authoritative API/state
Data classification
Permission model
UI states
RTL/LTR
Responsive behavior
Accessibility
Security/privacy presentation
Tests
CI evidence
Closure evidence
```

## 14 — Legacy Map Review Protocol

Before declaring MAP-X canonical, review every existing map for:

- duplicate identifiers;
- conflicting ownership of a state;
- missing D02 links;
- missing C3 links on financial/legal behavior;
- missing N1 links on Lawyer Office surfaces;
- orphaned roadmap items;
- lifecycle items without UI mapping;
- UI items without repository mapping;
- financial actions without reconciliation/security proof;
- closure claims without evidence.

MAP-X is the control plane for resolving these intersections; it does not silently rewrite historical records.

## 15 — Build Execution Gate

For each task:

`DISCOVER → CLASSIFY → MAP → IMPLEMENT → TEST → REVIEW → VERIFY → CLOSE`

A task may not skip `MAP` merely because implementation is small.

For a new service or material change, the `MAP` stage includes:

`INTAKE → IDENTIFY → CLASSIFY → DISCOVER EXISTING ASSETS/CAPABILITIES → IMPACT ANALYSIS → ROUTE TO APPLICABLE MAPS → IMPLEMENTATION PLAN`

Only after this governance routing is complete does the normal Repository/PR/CI execution proceed.

## 16 — Evidence Validity & Reuse

Evidence exists to preserve verified project state and prevent unnecessary rework.

- **VALID → REUSE:** Existing evidence may be reused when it is traceable to the exact implementation/commit or an equivalent unchanged artifact and remains applicable to the closure decision.
- **STALE / INSUFFICIENT → REFRESH:** Only the affected verification must be refreshed when the existing evidence no longer proves the required state.
- **FAILED → BLOCK CLOSURE:** Failed evidence cannot be converted into PASS by inference or by ignoring the failure.

A newly adopted governance rule does not, by itself, invalidate previously valid evidence. A material implementation change, scope change, security concern, or evidence-expiry rule may require fresh verification.

## 17 — Canonical Source Order

When maps disagree, resolve authority in this order:

1. Governance / legal-regulatory decision record
2. C3 financial/legal foundation for financial/legal behavior
3. Product lifecycle T/S
4. Role architecture X/Y/Z/W and N1
5. D02 design foundation for visible presentation
6. Domain/Data/State/Security model
7. Repository implementation
8. Tests and runtime evidence

## 18 — Reference Status & Governance

This file is the **canonical MAP-X integration, intake, routing and change-control map**. Existing canonical maps remain authoritative for their own namespaces.

The intended repository control set is:

```text
docs/governance/MUSTASHARK-MASTER-MAP.md
docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md

docs/design/D02-SURFACE-MASTER-MAP.md
docs/design/D02-ROADMAP-CROSSWALK.md

docs/roadmap/MASTER-ROADMAP.md
docs/roadmap/MASTER-AUDIT-MAP.md
docs/roadmap/ROADMAP-REGISTRY.md
docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md
```

## 19 — Adoption Rule

Every new build stage or material service request must register its MAP-X intersection before implementation begins and must retain the complete trace to applicable role/lifecycle, architecture, D02, security, data, tests and verification evidence.

MAP-X adoption does not alter runtime behavior and does not create a runtime dependency.

**Governance state:** `ADOPTED — CANONICAL INTEGRATION / INTAKE / ROUTING CONTROL`
**Runtime impact:** `NONE — GOVERNANCE / TRACEABILITY ONLY`
