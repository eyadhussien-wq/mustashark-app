# Mustasharek — Decision Log — September 2026

## D-2026-09-01-01 — Advance from P1.5 to P2

**Status:** APPROVED / ACTIVE  
**Date:** 2026-09-01  
**Branch:** `construction/lawyer-os-v1-p1-audit-2026-09`  
**Security Hold:** ACTIVE

### Decision

After P1 Repository Audit and P1.5 CI Boundary Triage, S01-03 Join is treated as legacy/regulated-dependent evidence and remains quarantined. The current construction CI is GREEN, so the project advances to **P2 — Neutral Core Architecture**.

### Engineering direction

Build **Mustasharek Lawyer OS v1** as the neutral lawyer-facing operating core:

- Identity and authentication
- Lawyer Workspace
- Clients
- Matters / Cases
- Documents
- Appointments / Scheduling
- Secure Messaging
- Notifications
- Audit Logs
- Data Export (`Export → Lawyer`)

### Commercial hypothesis

The initial commercial model may be a fixed lawyer SaaS subscription, currently modeled at **50 JOD/month**. This is an engineering/business hypothesis only and is not treated as legal or tax authorization.

### Explicit exclusions

The following remain outside P2 and blocked:

- Percentage commissions
- Legal-fee pricing by the platform
- Platform-held client funds
- Escrow
- Split settlement
- Lawyer wallet
- Marketplace monetization
- Referral-fee logic
- Regulated payment/settlement execution

### Governance rule

P2 architecture must be reversible and must not require any blocked P6/P7 behavior. Historical regulated/financial code may remain preserved in quarantine but must not become an implicit dependency of the Neutral Core.

### Legal boundary

No SaaS label, fixed subscription price, disclaimer, or technical architecture is itself a legal authorization. Professional regulation, tax/e-invoicing, payment-provider treatment, privacy/data-protection obligations, and the final operating model remain subject to appropriate Jordanian specialist validation.

---

## D-2026-09-01-02 — No-return-to-zero rule

**Status:** APPROVED / PERMANENT WORKFLOW RULE

Every future engineering phase must begin from the current Master Matrix and Decision Log. Completed discovery is not repeated merely because implementation moves forward. A previous decision is reopened only when new evidence materially changes its scope, risk, or legal assumption.

The phase transition is:

`P0 Governance → P1 Repository Audit → P1.5 CI Boundary Triage → P2 Neutral Core Architecture → P3 Lawyer OS v1 Build → P4/P5 → Compliance Gates → P6 if approved → P7 Production`

---

## D-2026-09-01-03 — Construction and Legal tracks remain parallel

**Status:** APPROVED / ACTIVE

The engineering Construction Track may proceed within approved neutral boundaries while the Legal Research Track continues in parallel. No technical completion is treated as regulatory approval. A later Compliance Gate must connect the specialist/legal conclusions to concrete technical constraints before any regulated capability is activated.
