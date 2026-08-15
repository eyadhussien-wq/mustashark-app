# MUSTASHAREK — SYSTEM GOVERNANCE MAP

## Purpose

This document is the canonical governance map for Mustasharek. It defines where architecture, roadmap, audit, UX/D02, functional lifecycles, supporting architecture, repository validation, QA, CI/PR, and production readiness belong.

**Governance rule:** No implementation starts before architectural classification. Every new feature or expansion must be mapped before code is changed.

## 1. System Governance Hierarchy

```text
MUSTASHAREK
│
└── SYSTEM GOVERNANCE MAP
    │
    ├── MASTER ROADMAP
    │
    ├── MASTER AUDIT MAP
    │
    ├── ROADMAP-REGISTRY
    │
    ├── DOMAIN / DATA MODEL
    │
    ├── SECURITY CONTROLS
    │
    ├── UX / D02 DESIGN SYSTEM
    │
    ├── FUNCTIONAL LIFECYCLES
    │
    ├── SUPPORTING ARCHITECTURE
    │
    ├── QA / TEST REGISTRY
    │
    ├── ROADMAP ↔ REPOSITORY VALIDATION
    │
    ├── REPOSITORY
    │
    ├── TEST / CI / PR
    │
    └── PRODUCTION
```

## 2. Master Audit — X / Y / Z / W

```text
MASTER AUDIT — X / Y / Z / W
│
├── X — CLIENT
│   ├── X/1 Navigation
│   ├── X/2 Services
│   ├── X/3 Actions
│   ├── X/4 D02 / Design
│   ├── X/5 Security
│   ├── X/6 Admin Relationship
│   └── X/7 Identity & Access Security
│
├── Y — LAWYER
│   ├── Y/1 Navigation
│   ├── Y/2 Services
│   ├── Y/3 Actions
│   ├── Y/4 D02
│   ├── Y/5 Security
│   ├── Y/6 Admin Relationship
│   ├── Y/7 Identity & Access
│   └── Y/8 Office / Staff / Revenue
│       ├── Y/8.1 Office Entity
│       ├── Y/8.2 Office Staff
│       ├── Y/8.3 Office Permissions
│       ├── Y/8.4 Membership
│       ├── Y/8.5 Multiple Offices
│       ├── Y/8.6 Case Ownership
│       ├── Y/8.7 Staff Audit Log
│       ├── Y/8.8 Revenue Sharing
│       ├── Y/8.9 Revenue Agreement
│       ├── Y/8.10 Mutual Consent
│       ├── Y/8.11 Office Suspension
│       ├── Y/8.12 Reactivation
│       ├── Y/8.13 Historical Financial Terms
│       ├── Y/8.14 Settlement
│       ├── Y/8.15 Pending Settlement Protection
│       ├── Y/8.16 Instant Office Suspension
│       ├── Y/8.17 Dual-Consent Reactivation
│       ├── Y/8.18 New Agreement on Reactivation
│       ├── Y/8.19 Immutable Historical Financial Terms
│       ├── Y/8.20 Pending Settlement Protection
│       ├── Y/8.21 SUSPENDED vs FROZEN
│       ├── Y/8.22 Office Financial Permissions
│       ├── Y/8.23 Lawyer Financial Consent
│       ├── Y/8.24 Admin Financial Override Controls
│       ├── Y/8.25 Revenue Agreement State Machine
│       ├── Y/8.26 Financial Tamper Protection
│       ├── Y/8.27 Mandatory Financial Audit Events
│       └── Y/8.28 Financial Ledger UI
│
├── Z — ADMIN
│   ├── Z/1 Navigation
│   ├── Z/2 Monitoring
│   ├── Z/3 Administrative Actions
│   ├── Z/4 Reports / Analytics
│   │   └── QA Performance Metrics
│   │       ├── Cancellation Rate
│   │       ├── Lawyer Response Time
│   │       ├── Client Ratings
│   │       └── Service Quality Trends
│   ├── Z/5 Security
│   ├── Z/6 RBAC / Permissions
│   └── Z/7 Super Admin
│
└── W — CROSS-SYSTEM
    ├── W/1 Shared Navigation
    ├── W/2 Shared Services
    │   └── W/2.1 Smart Notifications & Alerts
    │       ├── Booking Alerts
    │       ├── Consultation Alerts
    │       ├── Written Inquiry Alerts
    │       ├── Push Notifications
    │       ├── SMS
    │       └── WhatsApp Business API / Supported Channel
    ├── W/3 Shared Actions
    ├── W/4 D02
    ├── W/5 Cross-System Security
    │   ├── IDOR Protection
    │   ├── Ownership Checks
    │   ├── Encryption at Rest — AES-256
    │   ├── Encryption in Transit — TLS 1.3
    │   ├── Secure Document Access
    │   ├── Dynamic Watermarking
    │   ├── Immutable Financial Audit Log
    │   └── Financial Tamper Protection
    ├── W/6 Admin Control
    ├── W/7 Identity & Access
    ├── W/8 Office ↔ Lawyer Revenue
    └── W/9 Affiliate / Referral — DEFERRED
```

## 3. Master Audit Security / Financial Flow

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
  ├── Idempotency Key
  ├── Atomic Transaction
  ├── Duplicate Financial Effect Prevention
  ├── Concurrent Request Protection
  ├── Retry Safety
  ├── Network Failure Recovery
  └── Financial State Lock
  ↓
Financial Effect
  ↓
FINANCIAL AUDIT INTEGRITY
  ├── Immutable Financial Events
  ├── Financial Event Sequencing
  ├── Before / After
  ├── Actor
  ├── Timestamp
  ├── Transaction / Idempotency Reference
  ├── Event Integrity
  ├── No Silent Mutation
  ├── Reconciliation
  ├── Duplicate Detection
  └── Audit Trail Consistency
  ↓
Admin Oversight
  ↓
Audit Log
  ↓
D02
```

**Core rule:** No Financial Effect occurs before the Financial Isolation Gate passes, and no financial effect is considered complete without Financial Audit Integrity.

## 4. UX Rescue

```text
UX RESCUE
├── UX-A — Frontend IA & Role Alignment
├── UX-B — Client Journey
│   ├── UX-B-01 Client
│   ├── UX-B-02 Services
│   ├── UX-B-03 Consultations
│   ├── UX-B-04 My Account
│   └── Client Transparency
│       ├── Transparent Total Pricing
│       ├── Live Document Preview
│       ├── Live Request Tracking
│       └── Secure Document Vault
└── UX-C — Lawyer Journey
    ├── Financial Transparency
    ├── Scope Review
    └── Smart Alerts
```

## 5. Functional Lifecycles

### T01 — Consultation

```text
T01-01 Create Request
  ↓
T01-02 Lawyer Review & Proposal
  ↓
T01-03 Accept Proposal & Start Service
  ↓
T01-04 Documents & Reuse
  ├── Secure Document Vault
  ├── Reuse Previously Verified Documents
  ├── Secure Attachment Access
  └── Ownership / Authorization Check
  ↓
T01-05 Payment & Payment Proof 🔒
  ├── Security Gate
  ├── T01-05-F1 Post-Consultation Hold
  ├── T01-05-F2 Commission & Tax Engine
  ├── T01-05-F3 Automated Invoicing
  └── T01-05-F4 Payout Engine
  ↓
FINANCIAL ISOLATION GATE
  ↓
FINANCIAL AUDIT INTEGRITY
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

**T01-05 Financial components:**
- Post-consultation hold: configurable 24–48h; release when no active dispute; freeze on dispute.
- Commission & tax: gross amount, platform commission, applicable tax, lawyer net.
- Invoicing: jurisdiction rules, electronic tax invoice, supported national e-invoicing integration, PDF invoice.
- Payout: scheduled payouts, supported rails, minimum threshold, status tracking, audit trail.

**T01 Final Gate:** Integration Review → Real Preview → Typecheck → Tests → CI → Security Review → Final PR → Verify Main → Close T01.

### S01 — Smart Scheduling

```text
S01-01 Existing Scheduling Audit
  ↓
S01-02 Lawyer Availability Model
  ├── Working Days
  ├── Available Hours
  ├── Session Duration
  └── Exceptions / Holidays
  ↓
S01-03 Lawyer Interactive Calendar
  ↓
S01-04 Client Booking Calendar
  ↓
S01-05 Booking Transaction
  ├── Atomic Booking
  ├── Server-Side Source of Truth
  ├── Idempotency
  ├── Double-Booking Protection
  └── Temporary Slot Lock
      └── Redis TTL / Equivalent Lock
  ↓
S01-06 Real-Time Availability
  ├── Slot Lock / Close
  ├── Concurrent Booking Protection
  ├── Race Condition Protection
  └── Lock Expiration / Recovery
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
S01-12 CI & Final QA → S01 CLOSED
```

### S02 — Legal Representation

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

### T02 — Dispute & Resolution

```text
T02-01 Architecture & Data Audit
  ↓
T02-02 Dispute Data Model
  ↓
T02-03 Dispute State Machine
  ↓
T02-04 Financial Transaction Safety
  ├── Financial Freeze
  ├── Payout / Release Blocking
  ├── Idempotency
  └── Atomic Resolution
  ↓
T02-05 Admin Dispute API
  ↓
T02-06 Admin Resolution Controls
  ├── Refund Evaluation
  ├── Evidence Review
  ├── Session Records
  ├── Document Review
  ├── Release
  ├── Refund
  └── Partial Resolution
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

## 6. D02 — Unified Design System

**D02 is the single official design-system map. The Visual Design Foundation is merged into D02-01; it is not a separate design map.**

```text
D02 — MUSTASHAREK DESIGN SYSTEM
│
├── D02-01 — Visual Design Audit & Design System Foundation
│   ├── Brand Identity
│   ├── Color Tokens
│   │   ├── brand-primary-50  #E6F2F2
│   │   ├── brand-primary-500 #008080
│   │   ├── brand-primary-700 #005959
│   │   ├── brand-gold-100    #F9F3E5
│   │   ├── brand-gold-500    #D4AF37
│   │   ├── brand-gold-700    #997B1A
│   │   ├── bg-app            #F8FAFC
│   │   ├── bg-surface        #FFFFFF
│   │   ├── text-main         #0F172A
│   │   ├── text-muted        #64748B
│   │   └── border-subtle     #E2E8F0
│   ├── Typography
│   │   ├── Font Family: Tajawal, sans-serif
│   │   ├── display: 28px / 700
│   │   ├── h1: 22px / 700
│   │   ├── h2: 18px / 500
│   │   ├── body: 15px / 400
│   │   └── caption: 13px / 400
│   ├── Spacing: xs 4px / sm 8px / md 16px / lg 24px / xl 32px
│   ├── Radius: sm 6px / md 12px / full 9999px
│   ├── Shadows
│   ├── Borders
│   ├── Icons
│   ├── UI States
│   ├── RTL
│   ├── Accessibility
│   ├── Responsive Devices
│   └── design-tokens.ts / CSS variables as implementation source
│
├── D02-02 — Brand Identity
├── D02-03 — Typography / Tajawal
├── D02-04 — Buttons / Actions
├── D02-05 — Cards / Forms / Navigation
├── D02-06 — Role UI Unification
│   ├── Client
│   ├── Lawyer
│   ├── Office
│   └── Admin
├── D02-07 — Print / PDF / Share / Documents
├── D02-08 — i18n / RTL / Devices
├── D02-09 — Visual QA
└── D02-10 — Tests / CI / Final Review
```

**D02 design contract:** new UI must consume the D02 tokens and shared components rather than introducing ad-hoc colors, typography, spacing, or interaction states.

## 7. Supporting Architecture

```text
SUPPORTING ARCHITECTURE
├── Domain / Data Registry
├── State Machine Registry
├── Security Control Registry
├── Financial Ledger Architecture
├── Notification Policy
├── Compliance & Legal
├── Observability & Operations
└── Resilience & Recovery
```

### Financial Ledger Architecture

Gross Amount → Platform Commission → Applicable Tax → Lawyer Net → Hold → Release → Refund → Payout → Reconciliation → Immutable Financial Events → Financial Audit Integrity → Ledger Invariants.

### Security Control Registry

Authentication, Authorization, RBAC, Ownership / Scope, IDOR Protection, Encryption, Secrets, Rate Limiting, Idempotency, Atomic Transactions, Race Conditions, Financial Isolation Gate.

## 8. QA / Test Registry

```text
QA / TEST REGISTRY
├── Unit Tests
├── Integration Tests
├── API Tests
├── Security Tests
├── Financial Tests
├── State Transition Tests
├── Race Condition Tests
├── Idempotency Tests
├── Permission Tests
├── E2E Tests
├── Regression Tests
├── Typecheck
├── CI
├── Real Preview
└── Final Verification
```

## 9. Roadmap ↔ Repository Validation

```text
ROADMAP ↔ REPOSITORY VALIDATION
├── Roadmap ID
├── Feature
├── Repository Files
├── Database Tables
├── API Endpoints
├── UI Components
├── Branch
├── PR
├── Tests
├── CI Status
└── Classification
    ├── KEEP
    ├── RENAME / ALIGN
    ├── ADD TO MAP
    ├── DUPLICATE
    ├── CONSOLIDATE
    ├── NEEDS DECISION
    └── DEFERRED
```

## 10. Development Phases

```text
Phase 2.5 — Case & Consultation Experience
├── T01
├── S01
└── S02

Phase 2.6 — Documents & Handover
├── T01-04
├── T01-06
├── Secure Document Vault
├── Document Preview
└── Dynamic Watermarking

Phase 2.7 — Financial & Payment Experience
├── T01-05 Payment Foundation
├── T01-05-F1 Post-Consultation Hold
├── T01-05-F2 Commission & Tax Engine
├── T01-05-F3 Automated Invoicing
├── T01-05-F4 Payout Engine
├── Y/8.28 Financial Ledger UI
├── Financial Isolation Gate
├── Financial Audit Integrity
├── Financial Audit / Reconciliation
└── Payout Audit Trail

Phase 2.8 — Security & Role Boundaries
├── Continuous Security Gate
├── IDOR / Ownership Protection
├── Financial Authorization
├── Financial Isolation Gate
├── Payout Authorization
├── Invoice Integrity
├── Dispute / Refund Protection
├── AES-256 at Rest
├── TLS 1.3 in Transit
├── Immutable Financial Audit Log
├── Secure Document Access
└── WebRTC Secure Communications

Phase 3 — Production Readiness
├── Payment Provider Production Integration
├── Tax / E-Invoicing Production Integration
├── Payout Rails Production Integration
├── Operational Monitoring
│   ├── API Health
│   ├── Payment Monitoring
│   ├── Booking Monitoring
│   ├── Payout Monitoring
│   ├── Queue / Job Monitoring
│   ├── Error Tracking
│   ├── Security Events
│   └── Financial Anomaly Detection
├── Resilience & Recovery
│   ├── Retry Strategy
│   ├── Failure Recovery
│   ├── Financial Recovery
│   ├── Payment Recovery
│   ├── Payout Recovery
│   ├── Database Recovery
│   └── Disaster Recovery
├── QA Performance Metrics
├── Security / Privacy Validation
├── Compliance Validation
└── Final Production QA
```

## 11. Governance Registry Record

Every roadmap item should be traceable through:

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

## 12. Change Governance Rule

For every new feature, expansion, refactor, or security/financial change:

```text
REQUEST
  ↓
ARCHITECTURAL CLASSIFICATION
  ↓
MASTER AUDIT / X-Y-Z-W PLACEMENT
  ↓
DOMAIN + SECURITY + UX/D02 IMPACT
  ↓
FUNCTIONAL LIFECYCLE PLACEMENT
  ↓
ROADMAP-REGISTRY UPDATE
  ↓
IMPLEMENTATION
  ↓
TYPECHECK
  ↓
TESTS
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
```

This sequence is the operational meaning of the Mustasharek System Governance Map.
