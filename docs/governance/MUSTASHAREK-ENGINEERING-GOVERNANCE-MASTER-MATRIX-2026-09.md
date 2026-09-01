# Mustasharek Engineering & Governance Master Matrix — 2026-09

**Branch:** `docs/legaltech-discovery-baseline-2026-09`  
**Status:** CANONICAL EXECUTION MATRIX UNDER MUSTASHARK-MASTER-MAP  
**Runtime impact:** `NONE — DOCUMENTATION / GOVERNANCE ONLY`

## 1. Purpose

This matrix converts the accumulated LegalTech discovery, regulatory research, security decisions, and Round 6 construction direction into one controlled execution map.

It exists to prevent:

- returning to zero in future discussions;
- mixing historical discovery with new implementation;
- allowing a later construction phase to silently reopen a blocked regulatory phase;
- treating a business hypothesis as a legal conclusion;
- rebuilding functionality that already exists in the repository;
- activating financial or professional-regulatory behavior merely because the code is technically ready.

This is an engineering/governance artifact, not a Jordanian legal, tax, banking, or professional opinion.

## 2. Canonical authority

The project authority remains:

`MUSTASHARK-MASTER-MAP → MAP-X → detailed maps / governance records → repository implementation → CI / evidence → CLOSED / VERIFIED`

This matrix does not replace `MUSTASHARK-MASTER-MAP` or MAP-X. It is the execution matrix for the current LegalTech construction track.

## 3. Current strategic direction

### Preferred near-term product hypothesis

> **Mustasharek Lawyer OS v1** — a lawyer-facing practice-management SaaS with secure client communication capabilities, sold as software subscription, initially without professional-fee collection, fee sharing, escrow, split settlement, or platform commission.

### Commercial hypothesis

A fixed subscription such as **50 JOD/month** is an engineering/business hypothesis for the SaaS offering. The amount and final tax/invoicing treatment remain subject to commercial and specialist validation.

### Long-term hypothesis

`Model C — SaaS + Marketplace` remains a possible long-term direction, but it is not approved for implementation merely because the architecture can support it.

## 4. Master phase matrix

| Phase | Scope | Code/Data status | Gate | Required evidence / decision | Documentation |
|---|---|---|---|---|---|
| **P0 — Governance Baseline** | Discovery history, market benchmark, evidence hierarchy, liability tests, regulatory chain, legal boundary map, decision history | `RECORDED` | `CLOSED AS BASELINE` | Git records and traceable decision history | `docs/governance/legaltech-discovery-baseline-2026-09.md` and related records |
| **P1 — Repository Audit** | Inventory current packages, routes, services, schemas, UI, tests and existing domain capabilities | `READ-ONLY / AUDIT` | `OPEN` | Repository evidence + classification map | `docs/governance/` audit record |
| **P2 — Neutral Core Construction** | Identity, auth, RBAC, lawyer workspace, clients, matters, documents, scheduling, messaging, notifications, audit | `BUILD ALLOWED` | `OPEN WITH SECURITY CONTROLS` | Typecheck, tests, security review, CI, diff verification | `docs/governance/neutral-core-construction-round6-2026-09.md` |
| **P3 — SaaS Commercial Layer** | Lawyer subscription lifecycle, plan configuration, subscription state, billing abstraction | `DESIGN / ISOLATED` | `PENDING TAX + PAYMENT VALIDATION` | Tax/e-invoicing treatment, payment-provider structure, contractual model | This matrix + decision records |
| **P4 — Client Portal** | Client-facing workspace, secure lawyer-client messaging, document exchange, appointments | `PLANNED / BUILDABLE IN NEUTRAL FORM` | `PRIVACY / CONTRACT REVIEW REQUIRED` | Data-role analysis, privacy/security evidence, RBAC tests | Decision log + architecture maps |
| **P5 — Discovery / Connection** | Public directory, discovery, matching, referrals, lead workflows | `BLOCKED FOR COMMERCIAL ACTIVATION` | `PROFESSIONAL / ADVERTISING / REFERRAL VALIDATION` | Specialist opinion + applicable official framework | Evidence Register / Regulatory Questions |
| **P6 — Regulated Financial Core** | Professional-fee collection, split payments, settlement, payouts, escrow, wallets, revenue sharing | `BLOCKED` | `CLOSED UNTIL VALIDATED` | Payment/legal/tax evidence and provider authorization where required | Master Map + Legal Decision Record |
| **P7 — Production Commercial Activation** | Commercial launch of any model-dependent behavior | `BLOCKED` | `COMPLIANCE GATE REQUIRED` | Legal, tax, payment, privacy, security, operational and CI closure | Closure Register |

## 5. Neutral Core boundary

### Allowed construction

- Identity and authentication foundations.
- Lawyer accounts and workspace.
- Client accounts and workspace foundations.
- Role-based authorization and ownership boundaries.
- Client/lawyer relationship data structures that do not decide unresolved legal ownership questions.
- Matters/cases/workflow foundations.
- Documents and secure storage/access lifecycle.
- Scheduling and availability.
- Secure client-lawyer communications.
- Notifications and workflow events.
- CRM/workspace organization.
- Audit logs and security traceability.
- Administrative governance controls.
- Generic/configurable interfaces for provider, fee and settlement concepts with **no live regulated transaction**.
- Tests, typecheck, security verification, CI and non-production verification.

### Prohibited by this construction track

- Acting as the legal service provider.
- Providing legal advice as Mustasharek.
- Representing a client as Mustasharek.
- Determining a lawyer's professional fee.
- Sharing professional fees with the platform.
- Holding or routing client/professional funds where authorization is required.
- Escrow.
- Split-payment execution.
- Automatic lawyer payout.
- Commission engine activation.
- Revenue-sharing activation.
- Tax/e-invoicing implementation based on an unresolved principal/agent model.
- Marketplace/referral activation before the applicable professional validation.

## 6. Commercial SaaS boundary

The first commercial hypothesis is a direct software relationship:

`Lawyer → Mustasharek`

for access to software functionality.

The professional legal relationship remains conceptually separate:

`Client ↔ Licensed Lawyer`

The architecture must not silently convert the SaaS subscription into a professional-service fee, referral fee, commission, or share of legal fees.

The product, contracts, marketing, UI labels, database semantics and payment flows must remain consistent with this distinction.

## 7. Three-layer architecture

```text
MUSTASHAREK
│
├── A. NEUTRAL CORE                         OPEN FOR CONSTRUCTION
│   ├── Identity / Auth
│   ├── RBAC
│   ├── Lawyer OS
│   ├── Clients / Matters
│   ├── Documents
│   ├── Scheduling
│   ├── Messaging
│   ├── Notifications
│   └── Audit / Security
│
├── B. COMMERCIAL SaaS                      ISOLATED / VALIDATION PENDING
│   ├── Subscription plan
│   ├── Subscription lifecycle
│   ├── Billing abstraction
│   └── Invoice integration boundary
│
└── C. REGULATED / MODEL-DEPENDENT          BLOCKED
    ├── Marketplace / referral
    ├── Professional-fee collection
    ├── Split settlement
    ├── Payouts
    ├── Commission / revenue sharing
    ├── Escrow / wallet
    └── Other regulated money flows
```

**Important:** architectural existence of an interface or abstraction is not permission to activate the associated behavior.

## 8. Build protocol — no phase mixing

Every engineering item must carry a phase identifier before implementation.

Required flow:

`DISCOVER → CLASSIFY → MAP → SCOPE → IMPLEMENT → TEST → SECURITY REVIEW → CI → VERIFY → CLOSE`

### Phase isolation rules

1. P1 audit may inspect existing code but does not redesign it.
2. P2 Neutral Core may reuse verified existing code and may harden security, but must not activate P5/P6 behavior.
3. P3 subscription work may model SaaS billing states, but live collection/tax behavior stays behind its validation gate.
4. P4 client portal work must use the Neutral Core identity/RBAC/data boundaries and must not introduce hidden Marketplace behavior.
5. P5/P6 work cannot enter an implementation branch as runtime behavior until its decision gate is closed.
6. A feature cannot move phases merely because another phase is technically complete.
7. A governance update never counts as runtime implementation.

## 9. Repository audit protocol

Before substantial new construction:

### A. Inventory

Record:

- workspace/package structure;
- application surfaces;
- API routes/controllers/services;
- database schemas/migrations;
- authentication/session implementation;
- authorization/RBAC;
- client/lawyer entities;
- booking/scheduling;
- documents/storage;
- messaging;
- case/matter structures;
- admin functionality;
- payment/financial code;
- tax/invoicing code;
- commission/settlement/escrow/wallet code;
- tests, E2E, typecheck and CI.

### B. Classification

Each relevant component receives one of:

`REUSE` / `HARDEN` / `ISOLATE` / `QUARANTINE` / `REPLACE` / `DEFER`

### C. Financial legacy quarantine

Any existing implementation involving commission, split payment, escrow, client funds, professional-fee collection, automatic payout, or fee sharing must be explicitly mapped and prevented from becoming part of the Neutral Core runtime path.

## 10. Founder-protection rules

No technical design can guarantee zero legal liability for the founder.

The engineering objective is instead to maintain alignment among:

`Entity + Permitted Activities + Contracts + Professional Structure + Money Flow + Tax Treatment + Data Compliance + Actual Conduct + Technical Enforcement`

The platform must not rely on:

- SaaS naming;
- disclaimers;
- checkboxes;
- competitor behavior;
- company registration alone;

as substitutes for applicable law or specialist advice.

## 11. Legal track continues in parallel

The Legal/Regulatory Track remains active and must answer, at minimum:

- Bar/professional-regulation treatment of the SaaS and client communication model;
- company activities and registrations;
- tax and e-invoicing treatment of the subscription;
- payment-provider structure for the lawyer's subscription;
- personal-data controller/processor roles;
- confidentiality and access obligations;
- consumer/contract/refund obligations;
- professional-liability allocation;
- future discovery/referral permissions;
- future professional-fee collection/settlement permissions.

No single adviser is assumed to authorize all domains.

## 12. Decision gates

### Gate G0 — Baseline

`PASS` when the discovery/governance history is preserved and traceable.

### Gate G1 — Neutral Core Build

`OPEN` for scoped non-regulated construction subject to engineering/security controls.

### Gate G2 — SaaS Commercial Activation

`PENDING` until tax/e-invoicing and payment/contract structure are validated.

### Gate G3 — Client Portal Commercial Use

`PENDING` applicable privacy, confidentiality, contractual and security validation.

### Gate G4 — Discovery / Marketplace

`BLOCKED` until professional/regulatory/contractual validation.

### Gate G5 — Financial / Settlement

`BLOCKED` until payment, tax and legal structure is formally validated.

### Gate G6 — Production Commercial Launch

`BLOCKED` until all applicable gates are closed and closure evidence exists.

## 13. Current system-state variables

```text
CONSTRUCTION_TRACK              = OPEN (Neutral Core only)
SECURITY_HOLD                   = ACTIVE
LEGAL_RESEARCH                  = ACTIVE
ZERO_MUTATION_SENSITIVE         = ACTIVE
NEUTRAL_CORE_BUILD              = ALLOWED
SAAS_BILLING_DESIGN             = ISOLATED / VALIDATION PENDING
CLIENT_PORTAL                   = PLANNED
MARKETPLACE                     = BLOCKED
PROFESSIONAL_FEE_COLLECTION     = BLOCKED
PAYOUT_SETTLEMENT               = BLOCKED
ESCROW                          = BLOCKED
COMMISSION / REVENUE_SHARING   = BLOCKED
TAX_E_INVOICING_RUNTIME         = BLOCKED PENDING VALIDATION
PRODUCTION_COMMERCIAL           = BLOCKED
LEGAL_OPERATING_MODEL           = PENDING
```

## 14. Never-return-to-zero protocol

At the beginning of any future discussion about Mustasharek LegalTech architecture, the team must first read:

1. `docs/governance/MUSTASHARK-MASTER-MAP.md`
2. `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md`
3. `docs/governance/legaltech-discovery-baseline-2026-09.md`
4. `docs/governance/decision-log-2026-09.md` when present
5. `docs/governance/neutral-core-construction-round6-2026-09.md`
6. this matrix: `docs/governance/MUSTASHAREK-ENGINEERING-GOVERNANCE-MASTER-MATRIX-2026-09.md`

Then identify the current phase and gate before proposing any change.

No future conversation may treat a historical unresolved question as newly discovered merely because the discussion restarted.

## 15. Change-control rule

If the business model changes, do not rewrite history.

Instead:

`NEW DECISION → NEW RECORD → IMPACT ANALYSIS → MAP UPDATE → PHASE/GATE UPDATE → IMPLEMENTATION PLAN`

Historical decisions remain preserved as historical lineage.

## 16. Immediate next action

The next action is fixed:

> **P1 — Neutral Core Repository Audit**

Deliverable:

`Repository → Current Capability Map → Boundary Classification → Security/Authorization Gap List → Reuse/Harden/Isolate/Defer Backlog → P2 Construction Plan`

No broad rewrite is authorized before this audit.

## 17. Acceptance statement

This matrix is the operational bridge between the completed discovery/governance work and the construction phase.

**Approved direction:**

> Build `Mustasharek Lawyer OS v1` as a neutral, reversible technology core; keep model-dependent, professional-regulatory, financial and tax-sensitive behavior isolated or blocked; continue legal/regulatory validation in parallel; and preserve every material decision in Git.

**Status:** `ACTIVE — P1 AUDIT → P2 NEUTRAL CORE CONSTRUCTION`
