# MUSTASHAREK — SYSTEM GOVERNANCE MAP

**Status:** GOVERNANCE BASELINE

**Purpose:** The authoritative architectural governance map for Mustasharek. This document defines how roadmap decisions, architecture, security, financial controls, UX/D02, functional lifecycles, repository implementation, QA, CI, PR review, and production verification relate to one another.

> **Governance rule:** No feature is considered implemented merely because it appears in this document. A feature reaches `CLOSED / VERIFIED` only when repository evidence, tests, security review, CI, and final verification support that state.

---

## 0 — GOVERNANCE FOUNDATION

```text
00 — REGISTRY GOVERNANCE
│
├── No Implementation Before Architectural Classification
├── KEEP
├── RENAME / ALIGN
├── ADD TO MAP
├── DUPLICATE
├── CONSOLIDATE
├── NEEDS DECISION
└── CLOSED / VERIFIED
```

### Core governance principles

1. Architecture is classified before implementation.
2. Roadmap entries are linked to actual repository evidence.
3. Security and authorization are part of each lifecycle, not a final afterthought.
4. Financial effects require the Financial Isolation Gate before execution.
5. Financial effects require Financial Audit Integrity before being considered complete.
6. A roadmap item is not `CLOSED / VERIFIED` without evidence.
7. PR, CI, tests, security review, and real verification are part of completion.
8. Deferred work remains explicitly marked `DEFERRED` rather than silently disappearing.

---

# 1 — MASTER AUDIT ARCHITECTURE

Every meaningful system action follows this control chain:

```text
Identity
   ↓
Navigation
   ↓
Service
   ↓
Action
   ↓
Permission
   ↓
Resource / Scope
   ↓
Data
   ↓
FINANCIAL ISOLATION GATE
   ↓
Financial Effect
   ↓
FINANCIAL AUDIT INTEGRITY
   ↓
Admin Oversight
   ↓
Audit Log
   ↓
D02
```

### Interpretation

- **Identity:** Who is acting? Client, Lawyer, Office Staff, Admin, or Super Admin.
- **Navigation:** From which role-specific or shared area was the action reached?
- **Service:** Which business service owns the operation?
- **Action:** What operation is being attempted?
- **Permission:** Is the actor allowed to perform the operation?
- **Resource / Scope:** Does the actor have access to this exact resource, case, document, booking, payment, or office scope?
- **Data:** What data is read, created, updated, or returned?
- **Financial Isolation Gate:** Mandatory controls before any financial effect.
- **Financial Effect:** The actual financial mutation or state transition.
- **Financial Audit Integrity:** Immutable evidence and reconciliation data for the effect.
- **Admin Oversight:** Monitoring, intervention, and controlled administrative actions.
- **Audit Log:** Traceability of security and operational events.
- **D02:** Consistent user-facing design and interaction rules.

---

# 2 — FINANCIAL ISOLATION GATE

No financial mutation may bypass this gate.

```text
FINANCIAL ISOLATION GATE
│
├── Atomic Transaction
├── Idempotency Key
├── Concurrency / Race Protection
├── Locking
├── State Validation
└── Duplicate Financial Effect Prevention
```

### Required invariant

> **No Financial Effect occurs unless the FINANCIAL ISOLATION GATE has been passed.**

The gate applies to payment, refund, release, commission, tax allocation, payout, settlement, dispute resolution, and any other operation capable of changing financial state.

### Required protections

- **Atomic Transaction:** related financial mutations succeed or fail together.
- **Idempotency Key:** retries do not create duplicate financial effects.
- **Concurrency / Race Protection:** concurrent requests cannot create inconsistent financial outcomes.
- **Locking:** financial state is protected while a critical transition is being committed.
- **State Validation:** only allowed source states may transition.
- **Duplicate Prevention:** repeated calls cannot produce repeated money movement or ledger effects.

---

# 3 — FINANCIAL EFFECT

After the isolation gate succeeds, the controlled financial effect may occur.

```text
Gross Amount
      ↓
Platform Commission
      ↓
Applicable Tax
      ↓
Lawyer Net
      ↓
Hold
      ↓
Release / Refund
      ↓
Payout
      ↓
Reconciliation
```

The exact financial provider and production rails remain implementation/production-readiness concerns unless explicitly promoted from the roadmap.

---

# 4 — FINANCIAL AUDIT INTEGRITY

A financial effect is not complete without auditable evidence.

```text
FINANCIAL AUDIT INTEGRITY
│
├── Immutable Financial Event
├── Before / After
├── Actor
├── Timestamp
├── Transaction Reference
├── Idempotency Reference
└── Reconciliation Integrity
```

### Required invariant

> **A Financial Effect is not considered complete without FINANCIAL AUDIT INTEGRITY.**

The financial audit record should establish:

- what changed;
- the previous state/value;
- the resulting state/value;
- who or what actor caused the change;
- when it occurred;
- which transaction or idempotency reference was involved;
- whether the resulting ledger state reconciles.

Silent mutation of financial state is prohibited by this governance model.

---

# 5 — MASTER AUDIT: X / Y / Z / W

## X — CLIENT

```text
X — CLIENT
├── X/1 Navigation
├── X/2 Services
├── X/3 Actions
├── X/4 D02 / Design
├── X/5 Security
├── X/6 Admin Relationship
└── X/7 Identity & Access Security
```

## Y — LAWYER

```text
Y — LAWYER
├── Y/1 Navigation
├── Y/2 Services
├── Y/3 Actions
├── Y/4 D02
├── Y/5 Security
├── Y/6 Admin Relationship
├── Y/7 Identity & Access
└── Y/8 Office / Staff / Revenue
```

### Y/8 — Office / Staff / Revenue

```text
Y/8.1 Office Entity
Y/8.2 Office Staff
Y/8.3 Office Permissions
Y/8.4 Membership
Y/8.5 Multiple Offices
Y/8.6 Case Ownership
Y/8.7 Staff Audit Log
Y/8.8 Revenue Sharing
Y/8.9 Revenue Agreement
Y/8.10 Mutual Consent
Y/8.11 Office Suspension
Y/8.12 Reactivation
Y/8.13 Historical Financial Terms
Y/8.14 Settlement
Y/8.15 Pending Settlement Protection
Y/8.16 Instant Office Suspension
Y/8.17 Dual-Consent Reactivation
Y/8.18 New Agreement on Reactivation
Y/8.19 Immutable Historical Financial Terms
Y/8.20 Pending Settlement Protection
Y/8.21 SUSPENDED vs FROZEN
Y/8.22 Office Financial Permissions
Y/8.23 Lawyer Financial Consent
Y/8.24 Admin Financial Override Controls
Y/8.25 Revenue Agreement State Machine
Y/8.26 Financial Tamper Protection
Y/8.27 Mandatory Financial Audit Events
Y/8.28 Financial Ledger UI
```

## Z — ADMIN

```text
Z — ADMIN
├── Z/1 Navigation
├── Z/2 Monitoring
├── Z/3 Administrative Actions
├── Z/4 Reports / Analytics
├── Z/5 Security
├── Z/6 RBAC / Permissions
└── Z/7 Super Admin
```

## W — CROSS-SYSTEM

```text
W — CROSS-SYSTEM
├── W/1 Shared Navigation
├── W/2 Shared Services
│   └── W/2.1 Smart Notifications & Alerts
├── W/3 Shared Actions
├── W/4 D02
├── W/5 Cross-System Security
├── W/6 Admin Control
├── W/7 Identity & Access
├── W/8 Office ↔ Lawyer Revenue
└── W/9 Affiliate / Referral — DEFERRED
```

### W/2.1 — Smart Notifications & Alerts

- Booking Alerts
- Consultation Alerts
- Written Inquiry Alerts
- Push Notifications
- SMS
- WhatsApp Business API / supported channel

### W/5 — Cross-System Security

- IDOR Protection
- Ownership Checks
- Encryption at Rest
- Encryption in Transit
- Secure Document Access
- Dynamic Watermarking
- Immutable Financial Audit Log
- Financial Tamper Protection

---

# 6 — UX RESCUE / D02

## UX-A — Frontend IA & Role Alignment

Align navigation, terminology, role boundaries, and shared components across Client, Lawyer, Admin, and shared surfaces.

## UX-B — Client Journey

```text
UX-B-01 Client
UX-B-02 Services
UX-B-03 Consultations
UX-B-04 My Account
```

### Client Transparency

- Transparent Total Pricing
- Live Document Preview
- Live Request Tracking
- Secure Document Vault

## UX-C — Lawyer Journey

- Financial Transparency
- Scope Review
- Smart Alerts

---

# 7 — FUNCTIONAL LIFECYCLES

## T01 — CONSULTATION

```text
T01-01 Create Request
        ↓
T01-02 Lawyer Review & Proposal
        ↓
T01-03 Accept Proposal & Start Service
        ↓
T01-04 Documents & Reuse
        ↓
T01-05 Payment & Payment Proof 🔒
        ↓
T01-06 POA / Document Handover
        ↓
T01-07 Scope Review & Acceptance
        ↓
T01-08 Consultation Archive & Printing
        ↓
T01-09+ Recover Previous Scope
        ↓
T01 FINAL GATE
```

### T01-04 — Documents & Reuse

- Secure Document Vault
- Reuse Previously Verified Documents
- Secure Attachment Access
- Ownership / Authorization Check

### T01-05 — Payment & Payment Proof

Security Gate only until production payment integration is explicitly promoted.

```text
T01-05
├── T01-05-F1 Post-Consultation Hold
├── T01-05-F2 Commission & Tax Engine
├── T01-05-F3 Automated Invoicing
└── T01-05-F4 Payout Engine
```

#### T01-05-F1 — Post-Consultation Hold

- Hold Period: 24–48h
- Configurable
- Funds remain protected
- No active dispute → release
- Active dispute → T02
- Dispute → financial freeze

#### T01-05-F2 — Commission & Tax Engine

- Gross Amount
- Platform Commission
- Applicable Tax
- Lawyer Net Amount

#### T01-05-F3 — Automated Invoicing

- Tax / Jurisdiction Rules
- Electronic Tax Invoice
- National E-Invoicing API
- PDF Invoice

#### T01-05-F4 — Payout Engine

- Scheduled Payouts
- Weekly / Monthly
- Bank Transfer
- CliQ / supported rails
- Minimum Payout Threshold
- Payout Status Tracking
- Payout Audit Trail

### T01 Financial Gate

```text
FINANCIAL ISOLATION GATE
├── Idempotency
├── Atomic Financial Transaction
├── Duplicate Prevention
├── Retry Safety
└── Financial State Lock
        ↓
Financial Effect
        ↓
FINANCIAL AUDIT INTEGRITY
├── Immutable Event
├── Reconciliation
└── Audit Trail
```

### T01 FINAL GATE

- Integration Review
- Real Preview
- Typecheck
- Tests
- CI
- Security Review
- Final PR
- Close T01 only after verification

---

# 8 — S01 SMART SCHEDULING

```text
S01-01 Existing Scheduling Audit
        ↓
S01-02 Lawyer Availability Model
        ↓
S01-03 Lawyer Interactive Calendar
        ↓
S01-04 Client Booking Calendar
        ↓
S01-05 Booking Transaction
        ↓
S01-06 Real-Time Availability
        ↓
S01-07 Upcoming Consultations
        ↓
S01-08 Timezone & Localization
        ↓
S01-09 Calendar UX & D02
        ↓
S01-10 Security & Edge Cases
        ↓
S01-11 Tests & Typecheck
        ↓
S01-12 CI & Final QA
        ↓
S01 CLOSED
```

### Booking transaction controls

- Atomic Booking
- Server-Side Source of Truth
- Idempotency
- Double-Booking Protection
- Temporary Slot Lock
- Redis TTL / equivalent lock
- Lock expiration and recovery
- Concurrent booking protection
- Race-condition protection

### S01-10 edge cases

- Time Manipulation
- Expired Slot
- Failed Payment
- Cancellation
- Retry
- Race Conditions

---

# 9 — S02 LEGAL REPRESENTATION

```text
S02.1 Request Quote
        ↓
S02.2 Lawyer Proposal & 24h Expiry
        ↓
S02.3 Accept & Pay
        ↓
S02.4 Agreement & Electronic Confirmation
        ↓
S02.5 POA / Court Proof Upload
        ↓
S02.6 Active Case Workspace
        ↓
S02.7 Milestones & Escrow Release
        ↓
S02.8 Admin Monitoring & Intervention
```

---

# 10 — T02 DISPUTE & RESOLUTION

```text
T02-01 Architecture & Data Audit
        ↓
T02-02 Dispute Data Model
        ↓
T02-03 Dispute State Machine
        ↓
T02-04 Financial Transaction Safety
        ↓
T02-05 Admin Dispute API
        ↓
T02-06 Admin Resolution Controls
        ↓
T02-07 Security & Authorization
        ↓
T02-08 Admin Dashboard UI & Monitoring
        ↓
T02-09 Tests & Idempotency
        ↓
T02-10 Typecheck → CI → Security Review → Merge
        ↓
VERIFY MAIN
        ↓
T02 CLOSED
```

### T02-04 — Financial Transaction Safety

- Financial Freeze
- Payout / Release Blocking
- Idempotency
- Atomic Resolution

### T02-06 — Admin Resolution Controls

- Refund Evaluation
- Evidence Review
- Session Records
- Document Review
- Release
- Refund
- Partial Resolution

### T02-07 — Security

- Strict Privacy
- Ownership Checks
- Restricted Evidence Access

---

# 11 — D02 DESIGN SYSTEM

```text
D02-01 Visual Audit
D02-02 Brand Identity
D02-03 Tajawal
D02-04 Buttons / Actions
D02-05 Cards / Forms / Navigation
D02-06 Role UI Unification
D02-07 Print / PDF / Share / Documents
D02-08 i18n / RTL / Devices
D02-09 Visual QA
D02-10 Tests / CI / Final Review
```

D02 is the presentation/interaction layer and must remain aligned with role boundaries, accessibility, RTL/i18n, documents, printing, sharing, and responsive devices.

---

# 12 — ROADMAP-REGISTRY

Every roadmap item should be traceable through a registry record.

```text
Roadmap ID
Official Name
Legacy Name
Classification
Repository Files
Database Tables
API / Service
PR
Branch
Tests
Security Review
CI Status
Current State
Verification Evidence
```

### Classification vocabulary

- `KEEP`
- `RENAME / ALIGN`
- `ADD TO MAP`
- `DUPLICATE`
- `CONSOLIDATE`
- `NEEDS DECISION`
- `DEFERRED`
- `CLOSED / VERIFIED`

### Evidence rule

A roadmap item cannot be marked `CLOSED / VERIFIED` unless the registry points to sufficient implementation and verification evidence.

---

# 13 — ARCHITECTURE DECISION RECORDS

```text
ADR ID
Decision
Context
Alternatives
Consequences
Superseded / Active
```

ADRs are used for decisions that affect system architecture, security boundaries, financial behavior, data ownership, state machines, external integrations, or other long-lived design constraints.

---

# 14 — DOMAIN / DATA REGISTRY

```text
Domain
Entity
Table
Field
Owner
Relationships
Lifecycle
Data Classification
```

This registry connects business concepts to persistent data and ownership rules.

---

# 15 — STATE MACHINE REGISTRY

```text
Booking States
Consultation States
Payment States
Hold States
Payout States
Dispute States
Lawyer / Office States
Allowed Transitions
```

No state-changing endpoint should invent an undocumented transition. Allowed transitions should be explicit and testable.

---

# 16 — SECURITY CONTROL REGISTRY

```text
Authentication
Authorization
RBAC
Ownership / Scope
IDOR Protection
Encryption
Secrets
Rate Limiting
Idempotency
Atomic Transactions
Race Conditions
Financial Isolation Gate
```

Security controls are applied continuously through the lifecycle and validated before completion.

---

# 17 — OBSERVABILITY & OPERATIONS

```text
Application Logs
Metrics
Alerts
Health Checks
Error Tracking
Financial Monitoring
Admin Monitoring
Operational Runbooks
```

Production readiness requires visibility into application health, financial behavior, administrative activity, security events, and operational failures.

---

# 18 — RESILIENCE & RECOVERY

```text
Retry Strategy
Idempotent Recovery
Failure Handling
Backup
Restore
Disaster Recovery
Payment Recovery
Payout Recovery
Database Recovery
Data Recovery
```

Financial and operational recovery paths must preserve idempotency and auditability.

---

# 19 — COMPLIANCE & LEGAL

```text
Privacy
Legal Data Retention
Financial Records
Tax / E-Invoicing
Audit Requirements
Document Confidentiality
Regulatory Dependencies
```

Production integration details remain subject to applicable jurisdiction, provider, and regulatory validation.

---

# 20 — NOTIFICATION POLICY

```text
Push
SMS
WhatsApp Business
Email

Booking Alerts
Consultation Alerts
Payment Alerts
Dispute Alerts
Reminder Policy
```

Notifications are cross-system services and must respect role, ownership, privacy, consent, and delivery reliability requirements.

---

# 21 — FINANCIAL LEDGER ARCHITECTURE

```text
Gross Amount
Platform Commission
Applicable Tax
Lawyer Net
Hold
Release
Refund
Payout
Reconciliation
Immutable Financial Events
Financial Audit Integrity
Ledger Invariants
```

### Ledger invariants

1. Every financial effect has a controlled source operation.
2. Every financial effect passes the Financial Isolation Gate.
3. Every financial effect has immutable audit evidence.
4. Retries do not create duplicate financial effects.
5. Financial state transitions are validated.
6. Historical financial terms cannot be silently rewritten.
7. Reconciliation must be possible from recorded financial events.

---

# 22 — ROADMAP ↔ REPOSITORY VALIDATION

The roadmap and repository are validated in both directions.

```text
Roadmap → Code
Code → Roadmap
```

### Required classifications

```text
KEEP
RENAME / ALIGN
ADD TO MAP
DUPLICATE
CONSOLIDATE
NEEDS DECISION
```

### Detection goals

- Orphan Code Detection
- Unmapped Feature Detection
- Duplicate Feature Detection
- Roadmap items without repository evidence
- Repository functionality without a roadmap classification

---

# 23 — QA / TEST REGISTRY

```text
Unit Tests
Integration Tests
API Tests
Security Tests
Financial Tests
State Transition Tests
Race Condition Tests
Idempotency Tests
E2E Tests
Typecheck
CI
Real Preview
Final Verification
```

### Completion principle

A feature should pass the relevant tests and verification layers before it is declared complete. Financial features additionally require the Financial Isolation Gate and Financial Audit Integrity evidence.

---

# 24 — DEVELOPMENT PHASES

## Phase 2.5 — Case & Consultation Experience

```text
T01
S01
S02
```

## Phase 2.6 — Documents & Handover

```text
T01-04
T01-06
Secure Document Vault
Document Preview
Dynamic Watermarking
```

## Phase 2.7 — Financial & Payment Experience

```text
T01-05 Payment Foundation
T01-05-F1 Post-Consultation Hold
T01-05-F2 Commission & Tax Engine
T01-05-F3 Automated Invoicing
T01-05-F4 Payout Engine
Y/8.28 Financial Ledger UI
Financial Isolation Gate
Financial Audit Integrity
Financial Audit / Reconciliation
Payout Audit Trail
```

## Phase 2.8 — Security & Role Boundaries

```text
Continuous Security Gate
IDOR / Ownership Protection
Financial Authorization
Financial Isolation Gate
Payout Authorization
Invoice Integrity
Dispute / Refund Protection
AES-256 at Rest
TLS 1.3 in Transit
Immutable Financial Audit Log
Secure Document Access
WebRTC Secure Communications
```

## Phase 3 — Production Readiness

```text
Payment Provider Production Integration
Tax / E-Invoicing Production Integration
Payout Rails Production Integration

Operational Monitoring
├── API Health
├── Payment Monitoring
├── Booking Monitoring
├── Payout Monitoring
├── Queue / Job Monitoring
├── Error Tracking
├── Security Events
└── Financial Anomaly Detection

Resilience & Recovery
├── Retry Strategy
├── Failure Recovery
├── Financial Recovery
├── Payment Recovery
├── Payout Recovery
├── Database Recovery
└── Disaster Recovery

QA Performance Metrics
Security / Privacy Validation
Compliance Validation
Final Production QA
```

---

# 25 — MASTER COMPLETION PIPELINE

The governance map culminates in one implementation pipeline:

```text
IDENTITY
   ↓
NAVIGATION
   ↓
SERVICE
   ↓
ACTION
   ↓
PERMISSION
   ↓
RESOURCE / SCOPE
   ↓
DATA
   ↓
══════════════════════════════════
 FINANCIAL ISOLATION GATE
══════════════════════════════════
   ↓
FINANCIAL EFFECT
   ↓
══════════════════════════════════
 FINANCIAL AUDIT INTEGRITY
══════════════════════════════════
   ↓
ADMIN OVERSIGHT
   ↓
AUDIT LOG
   ↓
D02
   ↓
IMPLEMENTATION
   ↓
TESTS
   ↓
TYPECHECK
   ↓
SECURITY REVIEW
   ↓
CI
   ↓
PR
   ↓
MERGE
   ↓
VERIFY MAIN
   ↓
PRODUCTION
```

## Final governance rule

> **No Financial Effect before FINANCIAL ISOLATION GATE.**
>
> **No completed Financial Effect without FINANCIAL AUDIT INTEGRITY.**
>
> **No `CLOSED / VERIFIED` roadmap item without repository evidence, tests, security review, CI, and final verification.**

---

## Relationship to the repository

This document is a **governance specification**, not a claim that every listed capability is already implemented. Implementation status must be established through the Roadmap Registry and repository evidence.

Recommended evidence for each implemented item:

```text
Roadmap ID
    ↓
Repository Files
    ↓
Database / Migration Evidence
    ↓
API / Service Evidence
    ↓
UI Evidence
    ↓
Branch
    ↓
PR
    ↓
Tests
    ↓
Security Review
    ↓
CI
    ↓
Real Preview / Verification
    ↓
CLOSED / VERIFIED
```

**Document role:** authoritative governance baseline for future Mustasharek implementation and audit work.