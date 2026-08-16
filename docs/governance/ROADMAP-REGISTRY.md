# MUSTASHAREK — ROADMAP REGISTRY

> **Canonical registry:** This document is the traceability layer for the canonical System Governance Map. It consolidates the roadmap structure from the historical Registry sources (#33/#34) and preserves the governance controls identified as unique in #35.

## 00 — Registry Governance

Classification vocabulary:

- `KEEP`
- `RENAME / ALIGN`
- `ADD TO MAP`
- `DUPLICATE`
- `CONSOLIDATE`
- `NEEDS DECISION`
- `DEFERRED`
- `CLOSED / VERIFIED`

**Governance rule:** roadmap presence is not implementation evidence. `CLOSED / VERIFIED` requires repository evidence, tests, security review, CI, and final verification.

## 01 — Master Audit Architecture

`Identity → Navigation → Service → Action → Permission → Resource / Scope → Data → FINANCIAL ISOLATION GATE → Financial Effect → FINANCIAL AUDIT INTEGRITY → Admin Oversight → Audit Log → D02`

### Financial Isolation Gate

No financial effect may occur before all applicable controls pass:

- Atomic Transaction
- Idempotency Key
- Concurrency / Race Protection
- Locking
- State Validation
- Duplicate Financial Effect Prevention
- Retry Safety
- Network Failure Recovery
- Financial State Lock

### Financial Audit Integrity

Every completed financial effect must have auditable evidence containing, as applicable:

- Immutable Financial Event
- Before / After
- Actor
- Timestamp
- Transaction Reference
- Idempotency Reference
- Event Integrity
- Reconciliation Integrity
- Duplicate Detection
- Audit Trail Consistency
- No Silent Mutation

## 02 — Master Audit: X / Y / Z / W

### X — Client

- X/1 Navigation
- X/2 Services
- X/3 Actions
- X/4 D02 / Design
- X/5 Security
- X/6 Admin Relationship
- X/7 Identity & Access Security

### Y — Lawyer

- Y/1 Navigation
- Y/2 Services
- Y/3 Actions
- Y/4 D02
- Y/5 Security
- Y/6 Admin Relationship
- Y/7 Identity & Access
- Y/8 Office / Staff / Revenue

#### Y/8 — Office / Staff / Revenue

- Y/8.1 Office Entity
- Y/8.2 Office Staff
- Y/8.3 Office Permissions
- Y/8.4 Membership
- Y/8.5 Multiple Offices
- Y/8.6 Case Ownership
- Y/8.7 Staff Audit Log
- Y/8.8 Revenue Sharing
- Y/8.9 Revenue Agreement
- Y/8.10 Mutual Consent
- Y/8.11 Office Suspension
- Y/8.12 Reactivation
- Y/8.13 Historical Financial Terms
- Y/8.14 Settlement
- Y/8.15 Pending Settlement Protection
- Y/8.16 Instant Office Suspension
- Y/8.17 Dual-Consent Reactivation
- Y/8.18 New Agreement on Reactivation
- Y/8.19 Immutable Historical Financial Terms
- Y/8.20 Pending Settlement Protection
- Y/8.21 SUSPENDED vs FROZEN
- Y/8.22 Office Financial Permissions
- Y/8.23 Lawyer Financial Consent
- Y/8.24 Admin Financial Override Controls
- Y/8.25 Revenue Agreement State Machine
- Y/8.26 Financial Tamper Protection
- Y/8.27 Mandatory Financial Audit Events
- Y/8.28 Financial Ledger UI

### Z — Admin

- Z/1 Navigation
- Z/2 Monitoring
- Z/3 Administrative Actions
- Z/4 Reports / Analytics
- Z/5 Security
- Z/6 RBAC / Permissions
- Z/7 Super Admin

### W — Cross-System

- W/1 Shared Navigation
- W/2 Shared Services
  - W/2.1 Smart Notifications & Alerts
    - Booking Alerts
    - Consultation Alerts
    - Written Inquiry Alerts
    - Push Notifications
    - SMS
    - WhatsApp Business API / Supported Channel
- W/3 Shared Actions
- W/4 D02
- W/5 Cross-System Security
  - IDOR Protection
  - Ownership Checks
  - Encryption at Rest — AES-256
  - Encryption in Transit — TLS 1.3
  - Secure Document Access
  - Dynamic Watermarking
  - Immutable Financial Audit Log
  - Financial Tamper Protection
- W/6 Admin Control
- W/7 Identity & Access
- W/8 Office ↔ Lawyer Revenue
- W/9 Affiliate / Referral — DEFERRED

## 03 — Functional Lifecycles

### T01 — Consultation

- T01-01 Create Request
- T01-02 Lawyer Review & Proposal
- T01-03 Accept Proposal & Start Service
- T01-04 Documents & Reuse
- T01-05 Payment & Payment Proof 🔒
- T01-06 POA / Document Handover
- T01-07 Scope Review & Acceptance
- T01-08 Consultation Archive & Printing
- T01-09+ Recover Previous Scope
- T01 FINAL GATE

T01-05 financial subcomponents:

- T01-05-F1 Post-Consultation Hold — configurable 24–48h; release when no active dispute; freeze on dispute.
- T01-05-F2 Commission & Tax Engine — gross amount, platform commission, applicable tax, lawyer net.
- T01-05-F3 Automated Invoicing — jurisdiction rules, electronic tax invoice, national e-invoicing integration, PDF invoice.
- T01-05-F4 Payout Engine — scheduled payouts, supported rails, minimum threshold, status tracking, audit trail.

T01 completion gate:

`Integration Review → Real Preview → Typecheck → Tests → CI → Security Review → Final PR → Verify Main`

### S01 — Smart Scheduling

- S01-01 Existing Scheduling Audit
- S01-02 Lawyer Availability Model
- S01-03 Lawyer Interactive Calendar
- S01-04 Client Booking Calendar
- S01-05 Booking Transaction
- S01-06 Real-Time Availability
- S01-07 Upcoming Consultations
- S01-08 Timezone & Localization
- S01-09 Calendar UX & D02
- S01-10 Security & Edge Cases
- S01-11 Tests & Typecheck
- S01-12 CI & Final QA → S01 CLOSED

Booking controls include server-side source of truth, idempotency, double-booking protection, temporary slot locking, concurrent booking protection, race protection, and lock recovery.

### S02 — Legal Representation

- S02.1 Request Quote
- S02.2 Lawyer Proposal & 24h Expiry
- S02.3 Accept & Pay
- S02.4 Agreement & Electronic Confirmation
- S02.5 POA / Court Proof Upload
- S02.6 Active Case Workspace
- S02.7 Milestones & Escrow Release
- S02.8 Admin Monitoring & Intervention

### T02 — Dispute & Resolution

- T02-01 Architecture & Data Audit
- T02-02 Dispute Data Model
- T02-03 Dispute State Machine
- T02-04 Financial Transaction Safety
- T02-05 Admin Dispute API
- T02-06 Admin Resolution Controls
- T02-07 Security & Authorization
- T02-08 Admin Dashboard UI & Monitoring
- T02-09 Tests & Idempotency
- T02-10 Typecheck → CI → Security Review → Merge
- VERIFY MAIN
- T02 CLOSED

## 04 — D02 Design System

D02 is the single official design-system map. D02-01 is the Visual Design Foundation; it is not a separate competing design map.

- D02-01 Visual Design Audit & Design System Foundation
- D02-02 Brand Identity
- D02-03 Typography / Tajawal
- D02-04 Buttons / Actions
- D02-05 Cards / Forms / Navigation
- D02-06 Role UI Unification
- D02-07 Print / PDF / Share / Documents
- D02-08 i18n / RTL / Devices
- D02-09 Visual QA
- D02-10 Tests / CI / Final Review

Canonical token implementations from #36:

- `artifacts/mustasharek/theme/tokens.ts`
- `artifacts/mustasharek/theme/tokens.native.ts`
- `docs/governance/D02-01-DESIGN-TOKENS.md`

## 05 — Development Phases

### Phase 2.5 — Case & Consultation Experience

- T01
- S01
- S02

### Phase 2.6 — Documents & Handover

- T01-04
- T01-06
- Secure Document Vault
- Document Preview
- Dynamic Watermarking

### Phase 2.7 — Financial & Payment Experience

- T01-05 Payment Foundation
- T01-05-F1 Post-Consultation Hold
- T01-05-F2 Commission & Tax Engine
- T01-05-F3 Automated Invoicing
- T01-05-F4 Payout Engine
- Y/8.28 Financial Ledger UI
- Financial Isolation Gate
- Financial Audit Integrity
- Financial Audit / Reconciliation
- Payout Audit Trail

### Phase 2.8 — Security & Role Boundaries

- Continuous Security Gate
- IDOR / Ownership Protection
- Financial Authorization
- Financial Isolation Gate
- Payout Authorization
- Invoice Integrity
- Dispute / Refund Protection
- AES-256 at Rest
- TLS 1.3 in Transit
- Immutable Financial Audit Log
- Secure Document Access
- WebRTC Secure Communications

### Phase 3 — Production Readiness

- Payment Provider Production Integration
- Tax / E-Invoicing Production Integration
- Payout Rails Production Integration
- Operational Monitoring
- Resilience & Recovery
- QA Performance Metrics
- Security / Privacy Validation
- Compliance Validation
- Final Production QA

## 06 — Registry Record

Every roadmap item must be traceable through:

```text
Roadmap ID
→ Official Name
→ Legacy Name (if any)
→ Classification
→ Repository Files
→ Database Tables
→ API / Service
→ UI Components
→ PR
→ Branch
→ Tests
→ Security Review
→ CI Status
→ Current State
→ Verification Evidence
```

## 07 — Architecture Decision Records

Required fields:

- ADR ID
- Decision
- Context
- Alternatives
- Consequences
- Superseded / Active

ADRs are required for decisions affecting architecture, security boundaries, financial behavior, data ownership, state machines, or long-lived external integrations.

## 08 — Domain / Data Registry

Track:

- Domain
- Entity
- Table
- Field
- Owner
- Relationships
- Lifecycle
- Data Classification

## 09 — State Machine Registry

Track:

- Booking States
- Consultation States
- Payment States
- Hold States
- Payout States
- Dispute States
- Lawyer / Office States
- Allowed Transitions

No state-changing endpoint should invent an undocumented transition; allowed transitions must be explicit and testable.

## 10 — Security Control Registry

Track:

- Authentication
- Authorization
- RBAC
- Ownership / Scope
- IDOR Protection
- Encryption
- Secrets
- Rate Limiting
- Idempotency
- Atomic Transactions
- Race Conditions
- Financial Isolation Gate

Security controls are continuous lifecycle controls, not a final checklist.

## 11 — Observability & Operations

Track:

- Application Logs
- Metrics
- Alerts
- Health Checks
- Error Tracking
- Financial Monitoring
- Admin Monitoring
- Operational Runbooks

## 12 — Resilience & Recovery

Track:

- Retry Strategy
- Idempotent Recovery
- Failure Handling
- Backup
- Restore
- Disaster Recovery
- Payment Recovery
- Payout Recovery
- Database Recovery
- Data Recovery

Financial and operational recovery must preserve idempotency and auditability.

## 13 — Compliance & Legal

Track:

- Privacy
- Legal Data Retention
- Financial Records
- Tax / E-Invoicing
- Audit Requirements
- Document Confidentiality
- Regulatory Dependencies

## 14 — Notification Policy

Channels:

- Push
- SMS
- WhatsApp Business
- Email

Events:

- Booking Alerts
- Consultation Alerts
- Payment Alerts
- Dispute Alerts
- Reminder Policy

Notifications must respect role, ownership, privacy, consent, and delivery reliability.

## 15 — Financial Ledger Architecture

`Gross Amount → Platform Commission → Applicable Tax → Lawyer Net → Hold → Release → Refund → Payout → Reconciliation → Immutable Financial Events → Financial Audit Integrity → Ledger Invariants`

Ledger invariants:

1. Every financial effect has a controlled source operation.
2. Every financial effect passes the Financial Isolation Gate.
3. Every financial effect has immutable audit evidence.
4. Retries do not create duplicate financial effects.
5. Financial state transitions are validated.
6. Historical financial terms cannot be silently rewritten.
7. Reconciliation must be possible from recorded financial events.

## 16 — Roadmap ↔ Repository Validation

Validation is bidirectional:

`Roadmap → Code` and `Code → Roadmap`

Detect and classify:

- Orphan Code
- Unmapped Feature
- Duplicate Feature
- Roadmap item without repository evidence
- Repository functionality without roadmap classification

## 17 — QA / Test Registry

Track:

- Unit Tests
- Integration Tests
- API Tests
- Security Tests
- Financial Tests
- State Transition Tests
- Race Condition Tests
- Idempotency Tests
- Permission Tests
- E2E Tests
- Regression Tests
- Typecheck
- CI
- Real Preview
- Final Verification

## 18 — Canonical Source Reconciliation

The historical governance PRs are not independent features:

| Source | Role | Disposition |
|---|---|---|
| #33 | Detailed Roadmap Registry baseline | Source material consolidated here |
| #34 | Alternate Roadmap Registry | Duplicate/overlapping source; do not merge independently |
| #35 | Detailed Governance Map baseline | Unique governance controls preserved here and in the canonical map |
| #36 | Governance + D02 + token implementation | Canonical structural base |

**Rule:** future governance changes update the canonical map/registry rather than opening parallel competing governance documents.

## 19 — Completion Pipeline

```text
Architectural Classification
→ Master Audit Placement
→ Domain + Security + UX/D02 Impact
→ Functional Lifecycle Placement
→ Roadmap Registry Update
→ Implementation
→ Typecheck
→ Tests
→ Security Review
→ CI
→ PR
→ Merge
→ Verify Main
→ CLOSED / VERIFIED
```

## Final Governance Rule

> **No Financial Effect before FINANCIAL ISOLATION GATE.**
>
> **No completed Financial Effect without FINANCIAL AUDIT INTEGRITY.**
>
> **No `CLOSED / VERIFIED` roadmap item without repository evidence, tests, security review, CI, and final verification.**

**Document role:** canonical roadmap traceability registry. It records intended architecture and evidence requirements; it does not claim that every listed capability is implemented.