# Mustasharek — Lawyer OS Construction Phase Matrix

**Status:** CANONICAL CONSTRUCTION CONTROL RECORD — ACTIVE  
**Branch:** `construction/lawyer-os-v1-p1-audit-2026-09`  
**Date:** 2026-09-01  
**Scope:** construction sequencing, phase control, boundary protection, evidence continuity.

## 01 — Purpose

This document prevents phase loss, scope drift, accidental reactivation of legacy financial/marketplace behavior, and repetition of previously completed governance work.

It is subordinate to `docs/governance/MUSTASHARK-MASTER-MAP.md` and integrates with `docs/roadmap/ROADMAP-REGISTRY.md`.

## 02 — Non-negotiable project state

- `SECURITY_HOLD = ACTIVE`
- `LEGAL_RESEARCH = ACTIVE`
- `CONSTRUCTION_TRACK = OPEN` only for approved Neutral Core / Lawyer SaaS work
- `FINANCIAL_COLLECTION = BLOCKED`
- `PAYOUT_SETTLEMENT = BLOCKED`
- `COMMISSION_ENGINE = BLOCKED`
- `ESCROW = BLOCKED`
- `CLIENT_FUNDS = BLOCKED`
- `TAX_E_INVOICING = PENDING / SPECIALIST VALIDATION`
- `MARKETPLACE_OPERATIONS = BLOCKED / PENDING LEGAL VALIDATION`
- `PRODUCTION_COMMERCIAL_ACTIVATION = BLOCKED`

**Important:** A SaaS label, disclaimer, fixed subscription price, or competitor behavior is not itself legal authorization.

## 03 — Construction phases

| Phase | Name | Scope | Status | Exit gate |
|---|---|---|---|---|
| P0 | Governance Baseline | LegalTech discovery, evidence classification, liability tests, boundary map, operating-model hypotheses | `CLOSED / BASELINED` | Existing canonical governance records retained |
| P1 | Repository Audit | Inventory existing code/data; classify Neutral Core / Commercial / Regulated; identify legacy financial/marketplace remnants | `COMPLETED / EVIDENCE RECORDED` | Audit findings mapped to repository and quarantine boundaries |
| P1.5 | CI Boundary Triage | Determine whether failing legacy S01-03 Join concurrency gate belongs to Lawyer OS construction; do not rerun blindly; classify as required or legacy | `ACTIVE` | Root cause + ownership of CI gate recorded; required CI green or legacy gate isolated |
| P2 | Boundary Enforcement | Enforce architectural separation; remove imports/dependencies from Neutral Core to regulated/legacy modules; lock sensitive feature flags | `NEXT` | Static/code boundary audit + typecheck |
| P3 | Lawyer OS v1 Scope Lock | Freeze functional scope for Identity, Lawyer Workspace, Clients, Matters, Documents, Scheduling, Messaging, Notifications, Audit | `PLANNED` | Scope approved and mapped to roadmap/design |
| P4 | Neutral Core Implementation | Build only approved Lawyer OS operational capabilities; preserve least privilege, tenant/ownership boundaries, auditability | `PLANNED` | Typecheck + tests + security review + CI |
| P5 | Commercial SaaS Design | Model lawyer subscription as a software subscription; no fee sharing, client-fund custody, or settlement | `PLANNED / ISOLATED` | Tax/payment specialist validation before commercial activation |
| P6 | Client Portal | Secure client↔lawyer communication and document exchange within approved data boundaries | `PLANNED` | Privacy/data-flow review + security verification |
| P7 | Preview / Visual QA | Open non-production preview for inspection of Lawyer OS v1; no regulated financial operations | `BLOCKED UNTIL REQUIRED CI GATES PASS` | CI evidence + preview evidence + visual/security review |
| P8 | Compliance Lock-in | Convert formal legal/tax/privacy/payment decisions into technical constraints and contracts | `PENDING` | Written specialist evidence recorded |
| P9 | Commercial Readiness | Subscription billing/invoicing activation only after applicable validation | `BLOCKED` | Compliance Gate passed |
| P10 | Regulated Expansion | Marketplace, referral economics, legal-fee collection, split settlement, commission, escrow/wallet | `BLOCKED` | Separate regulatory/legal approval for each applicable capability |

## 04 — Lawyer OS v1 scope lock

### Allowed in Neutral Core

- Identity and authentication
- Lawyer workspace
- Lawyer/client role separation
- Client records / CRM
- Matters / cases
- Document management
- Scheduling
- Secure messaging
- Notifications
- Audit logs
- Data export for the lawyer

### Explicitly excluded from P2–P7 unless separately authorized

- Commission calculation
- Revenue sharing
- Client lead pricing
- Platform-controlled lawyer fees
- Platform-held client funds
- Escrow
- Split settlement
- Wallet balances representing client/professional funds
- Automatic legal-fee collection on behalf of lawyers
- Marketplace ranking/revenue logic intended to operate as a referral marketplace

## 05 — Data ownership and security constraints

- Lawyer data must be exportable in a structured form.
- Access must follow least privilege and tenant/ownership boundaries.
- Client access is limited to authorized client-facing data.
- Platform staff access to case content must not be implicitly granted by database capability.
- Sensitive actions require auditable events.
- Legacy financial data/code may remain preserved for lineage, but must not become a dependency of the Neutral Core.

## 06 — Feature-flag rule

Sensitive capabilities must default to disabled/locked states. Suggested control names:

```text
LEGAL_MODEL=LAWYER_SAAS
PAYMENT_COLLECTION=BLOCKED
COMMISSION_ENGINE=BLOCKED
PAYOUT_SETTLEMENT=BLOCKED
ESCROW=BLOCKED
CLIENT_FUNDS=BLOCKED
MARKETPLACE=BLOCKED
```

These are engineering controls, not legal opinions.

## 07 — CI rule for P1.5

The current red workflow must be triaged before preview. The known failure is the S01-03 Join concurrency assertion returning `409 invalid_state_transition` for a concurrent lawyer join attempt.

Rules:

1. Do not rerun solely to make CI green.
2. Determine whether S01-03 is a required Lawyer OS gate or a legacy/regulated gate.
3. If legacy, isolate the gate from the Lawyer OS construction pipeline without weakening the underlying legacy test suite or deleting historical evidence.
4. If required, diagnose and fix the actual state/concurrency defect.
5. Record the decision and resulting CI evidence in the phase record.

## 08 — Phase transition protocol

Every transition follows:

`PLAN → IMPLEMENT → TEST → SECURITY REVIEW → CI → EVIDENCE → VERIFY → CLOSE → NEXT PHASE`

No phase is silently skipped.

A phase may remain `ACTIVE` across multiple commits. It becomes `CLOSED / VERIFIED` only when its applicable evidence is recorded.

## 09 — Anti-regression rule

Previously completed governance research is not restarted. New work must reference existing canonical records and update only the affected phase/evidence.

When a new decision changes scope, record the delta rather than rewriting history.

## 10 — Immediate execution queue

**Current:** `P1.5 — CI Boundary Triage`  
**Next:** `P2 — Boundary Enforcement`  
**Then:** `P3 — Lawyer OS v1 Scope Lock`  
**Then:** `P4 — Neutral Core Implementation`  
**Then:** `P5/P6` in parallel as appropriate.  
**Preview:** `P7` only after required CI/security gates.  
**Commercial:** `P8 → P9` only after specialist validation.  
**Regulated:** `P10` remains blocked.

## 11 — Governance continuity rule

This matrix is the working phase index. Any future construction discussion must first identify the current Phase ID and update its status/evidence before proposing work from a later phase.

The project must never return to an untracked "start from zero" state.
