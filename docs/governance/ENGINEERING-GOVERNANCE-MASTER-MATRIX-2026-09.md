# Mustasharek — Engineering & Governance Master Matrix

**Effective:** 2026-09-01  
**Current construction branch:** `construction/lawyer-os-v1-p1-audit-2026-09`  
**Main branch:** untouched by this track  
**Security Hold:** `ACTIVE`

## Canonical rule

This matrix is the execution index. It does not replace `MUSTASHARK-MASTER-MAP` or the legal discovery baseline. Historical decisions remain preserved. New implementation work enters through the current phase and must not reopen completed discovery unless new evidence materially changes a decision.

| Phase | Scope | Status | Gate | Output |
|---|---|---|---|---|
| P0 — Governance Baseline | LegalTech discovery, evidence classification, Round 1–5, operating-model hypotheses | `RECORDED / BASELINED` | Legal operating model remains pending | Legal discovery baseline + decision records |
| P1 — Repository Audit | Inventory runtime/tests, classify Neutral / Commercial / Regulated, identify legacy coupling | `COMPLETED FOR CURRENT SNAPSHOT` | No production mutation | Audit evidence on construction branch |
| P1.5 — CI Boundary Triage | Decide ownership of legacy CI gates; quarantine regulated-dependent tests; restore scope-aligned CI | `COMPLETED — GREEN` | Current construction CI is green | P1.5 decision record + clean CI gate |
| **P2 — Neutral Core Architecture** | **Lawyer OS boundaries, RBAC, data minimization, auditability, exportability, module boundaries** | **`ACTIVE`** | **Architecture boundary review before P3 implementation expansion** | **Technical Boundary Map + P2 architecture decision record** |
| P3 — Lawyer OS v1 Build | Lawyer Workspace, Clients, Matters/Cases, Documents, Scheduling, Messaging, Notifications, Audit Logs | `PLANNED` | P2 architecture baseline | Working Lawyer OS v1 |
| P4 — Commercial SaaS | Fixed lawyer subscription model (hypothesis: 50 JOD/month), subscription lifecycle, invoice integration | `DESIGN / PENDING SPECIALIST VALIDATION` | Tax/e-invoicing/payment validation | Isolated SaaS billing layer |
| P5 — Client Portal | Secure lawyer-client communication, document sharing, appointments | `PLANNED` | Privacy/controller-processor review | Client Portal |
| P6 — Marketplace / Regulated Features | Discovery, referral, legal-fee collection, split settlement, commission, escrow, wallet | `BLOCKED` | Formal legal/regulatory validation | Future only; no active execution |
| P7 — Production Commercial Activation | Commercial launch | `BLOCKED` | Compliance Gate + security + operational verification | Production release |

## P1.5 decision: S01-03 Join

The existing `S01-03 Join concurrency` test is classified as **legacy/regulated-dependent evidence**, not a Neutral Core acceptance gate. Its fixture writes `paid` and `held` financial states and its route contract depends on the legacy booking state machine. Therefore the correct action is quarantine, not repair inside Lawyer OS v1.

The historical test is preserved under `scripts/quarantine/legacy-booking/`. Its active package command and CI workflow are removed from the construction acceptance path.

The resulting CI verification completed **GREEN** on the construction branch. The green run included successful Concurrency, Production DB Guard, Auth smoke tests, X1 booking-cancel smoke tests, and workspace typecheck/build/dependency-alignment checks.

This does **not** declare all future session/join behavior obsolete. A later Client Portal/session contract may introduce a new test designed specifically for the new model.

## P2 operating decision: Neutral Core first

The project now adopts the following engineering direction for construction:

> **Mustasharek Lawyer OS v1 is a lawyer-facing operating system / SaaS core. The first commercial hypothesis is a fixed software subscription, currently modeled as 50 JOD/month, with no percentage commission, no legal-fee pricing by the platform, and no platform-held client funds in the initial model.**

This is an **engineering/business hypothesis, not a legal conclusion**. The Legal Research track remains active. The subscription amount and all tax, invoicing, payment-provider, professional-regulation, and data-protection treatment remain subject to specialist validation.

### P2 boundary rules

1. Neutral Core may be built: identity, authentication, lawyer workspace, clients, matters/cases, documents, scheduling, secure messaging, notifications, audit logs, and export.
2. Lawyer data must be isolated by tenant/ownership boundaries and protected by least-privilege RBAC.
3. Sensitive actions must be auditable.
4. Exportability (`Export → Lawyer`) is a first-class architectural requirement, not a later migration task.
5. The Neutral Core must not depend on Marketplace or financial settlement modules.
6. Historical financial/regulated code remains quarantined unless a future, separately approved phase explicitly reintroduces it.
7. Marketplace, referral monetization, commission, escrow, wallet, split settlement, and client-fund custody remain blocked.
8. No architecture decision in P2 is a legal authorization to operate; legal/regulatory evidence remains authoritative for commercial activation.

## Work-in-progress state

```text
SECURITY_HOLD                 = ACTIVE
CONSTRUCTION_TRACK            = OPEN (scope-limited)
LEGAL_RESEARCH                = ACTIVE
P1_REPOSITORY_AUDIT           = COMPLETE FOR CURRENT SNAPSHOT
P1.5_CI_BOUNDARY_TRIAGE       = COMPLETE / GREEN
P2_NEUTRAL_CORE_ARCHITECTURE  = ACTIVE
FINANCIAL_COLLECTION          = BLOCKED
PAYOUT_SETTLEMENT             = BLOCKED
COMMISSION_ENGINE             = BLOCKED
ESCROW_WALLET                 = BLOCKED
TAX_E_INVOICING               = BLOCKED UNTIL VALIDATED
PRODUCTION_COMMERCIAL         = BLOCKED
LAWYER_OS_V1_BUILD            = WAITING FOR P2 ARCHITECTURE BASELINE
```

## Mandatory phase transition

`P1.5 TRIAGE → GREEN CI → P2 ARCHITECTURE → P3 LAWYER OS V1 BUILD → P4/P5 → LEGAL/COMPLIANCE GATES → P6 IF APPROVED → PRODUCTION`

No later phase may silently import assumptions from a blocked phase. A feature that belongs to P6 remains blocked even if code already exists historically.

## No-return-to-zero rule

When work resumes, start from this matrix and the linked evidence/decision records. Do not repeat the entire discovery conversation. Reopen only the specific decision whose evidence, scope, or legal assumption has materially changed.
