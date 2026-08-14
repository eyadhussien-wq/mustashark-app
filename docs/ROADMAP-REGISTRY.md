# MUSTASHAREK — ROADMAP REGISTRY

> Governance document. **No implementation before architectural classification.**

## 00 — Registry Governance

- KEEP
- RENAME / ALIGN
- ADD TO MAP
- DUPLICATE
- CONSOLIDATE
- NEEDS DECISION
- CLOSED / VERIFIED

## 01 — Master Audit Architecture

**Identity → Navigation → Service → Action → Permission → Resource / Scope → Data → FINANCIAL ISOLATION GATE → Financial Effect → FINANCIAL AUDIT INTEGRITY → Admin Oversight → Audit Log → D02**

### FINANCIAL ISOLATION GATE

No financial effect may occur before this gate passes:

- Atomic Transaction
- Idempotency Key
- Concurrency / Race Protection
- Locking
- State Validation
- Duplicate Financial Effect Prevention

### FINANCIAL AUDIT INTEGRITY

A financial effect is not complete without an auditable, integrity-preserving event containing:

- Immutable Financial Event
- Before / After
- Actor
- Timestamp
- Transaction / Idempotency Reference
- Reconciliation Integrity

### Core Rule

> **No Financial Effect occurs unless it passes FINANCIAL ISOLATION GATE, and no Financial Effect is considered complete without FINANCIAL AUDIT INTEGRITY.**

## 02 — MASTER AUDIT: X / Y / Z / W

### X — CLIENT

- X/1 Navigation
- X/2 Services
- X/3 Actions
- X/4 D02 / Design
- X/5 Security
- X/6 Admin Relationship
- X/7 Identity & Access Security

### Y — LAWYER

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

### Z — ADMIN

- Z/1 Navigation
- Z/2 Monitoring
- Z/3 Administrative Actions
- Z/4 Reports / Analytics
  - QA Performance Metrics
  - Cancellation Rate
  - Lawyer Response Time
  - Client Ratings
  - Service Quality Trends
- Z/5 Security
- Z/6 RBAC / Permissions
- Z/7 Super Admin

### W — CROSS-SYSTEM

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

## 03 — UX RESCUE

### 2 UX-A — Frontend IA & Role Alignment

### 2 UX-B — Client Journey

- UX-B-01 Client
- UX-B-02 Services
- UX-B-03 Consultations
- UX-B-04 My Account
- Client Transparency
  - Transparent Total Pricing
  - Live Document Preview
  - Live Request Tracking
  - Secure Document Vault

### 2 UX-C — Lawyer Journey

- Financial Transparency
- Scope Review
- Smart Alerts

## 04 — FUNCTIONAL LIFECYCLES

### T01 — CONSULTATION

- T01-01 Create Request
- T01-02 Lawyer Review & Proposal
- T01-03 Accept Proposal & Start Service
- T01-04 Documents & Reuse
  - Secure Document Vault
  - Reuse Previously Verified Documents
  - Secure Attachment Access
  - Ownership / Authorization Check
- T01-05 Payment & Payment Proof 🔒
  - Security Gate
  - T01-05-F1 Post-Consultation Hold
    - Hold Period: 24–48h
    - Configurable
    - Funds Remain Protected
    - No Active Dispute → Release
    - Active Dispute → T02
    - Dispute → Financial Freeze
  - T01-05-F2 Commission & Tax Engine
    - Gross Amount
    - Platform Commission
    - Applicable Tax
    - Lawyer Net Amount
  - T01-05-F3 Automated Invoicing
    - Tax / Jurisdiction Rules
    - Electronic Tax Invoice
    - National E-Invoicing API
    - PDF Invoice
  - T01-05-F4 Payout Engine
    - Scheduled Payouts
    - Weekly / Monthly
    - Bank Transfer
    - CliQ / Supported Rails
    - Minimum Payout Threshold
    - Payout Status Tracking
    - Payout Audit Trail
- T01-06 POA / Document Handover
- T01-07 Scope Review & Acceptance
  - Lawyer Reviews Scope
  - Reviews Submitted Documents
  - Accept / Reject
  - Scope Locked Before Session
- T01-08 Consultation Archive & Printing
  - Secure Archive
  - Printing
  - PDF
  - Share Controls
  - Dynamic Watermarking
  - Access Authorization
  - Document Access Audit
- T01-09+ Recover Previous Scope
- T01 FINAL GATE
  - Integration Review
  - Real Preview
  - Typecheck
  - Tests
  - CI
  - Security Review
  - Final PR → CLOSE T01

### S01 — SMART SCHEDULING

- S01-01 Existing Scheduling Audit
- S01-02 Lawyer Availability Model
  - Working Days
  - Available Hours
  - Session Duration
  - Exceptions / Holidays
- S01-03 Lawyer Interactive Calendar
- S01-04 Client Booking Calendar
- S01-05 Booking Transaction
  - Atomic Booking
  - Server-Side Source of Truth
  - Idempotency
  - Double-Booking Protection
  - Temporary Slot Lock
    - Redis TTL / Equivalent Lock
- S01-06 Real-Time Availability
  - Slot Lock / Close
  - Concurrent Booking Protection
  - Race Condition Protection
  - Lock Expiration / Recovery
- S01-07 Upcoming Consultations
  - Client
  - Lawyer
  - Dashboard Integration
  - Smart Notification Trigger
- S01-08 Timezone & Localization
- S01-09 Calendar UX & D02
- S01-10 Security & Edge Cases
  - Time Manipulation
  - Expired Slot
  - Failed Payment
  - Cancellation
  - Retry
  - Race Conditions
- S01-11 Tests & Typecheck
- S01-12 CI & Final QA → S01 CLOSED

### S02 — LEGAL REPRESENTATION

- S02.1 Request Quote
- S02.2 Lawyer Proposal & 24h Expiry
- S02.3 Accept & Pay
- S02.4 Agreement & Electronic Confirmation
- S02.5 POA / Court Proof Upload
- S02.6 Active Case Workspace
- S02.7 Milestones & Escrow Release
- S02.8 Admin Monitoring & Intervention

### T02 — DISPUTE & RESOLUTION

- T02-01 Architecture & Data Audit
- T02-02 Dispute Data Model
- T02-03 Dispute State Machine
- T02-04 Financial Transaction Safety
  - Financial Freeze
  - Payout / Release Blocking
  - Idempotency
  - Atomic Resolution
- T02-05 Admin Dispute API
- T02-06 Admin Resolution Controls
  - Refund Evaluation
  - Evidence Review
  - Session Records
  - Document Review
  - Release
  - Refund
  - Partial Resolution
- T02-07 Security & Authorization
  - Strict Privacy
  - Ownership Checks
  - Restricted Evidence Access
- T02-08 Admin Dashboard UI & Monitoring
  - Dispute Dashboard
  - Case Evidence
  - Intervention Controls
- T02-09 Tests & Idempotency
- T02-10 Typecheck → CI → Security Review → Merge
- VERIFY MAIN
- T02 CLOSED

## 05 — D02 DESIGN SYSTEM

- D02-01 Visual Audit
- D02-02 Brand Identity
- D02-03 Tajawal
- D02-04 Buttons / Actions
- D02-05 Cards / Forms / Navigation
- D02-06 Role UI Unification
- D02-07 Print / PDF / Share / Documents
- D02-08 i18n / RTL / Devices
- D02-09 Visual QA
- D02-10 Tests / CI / Final Review

## 06 — DEVELOPMENT PHASES

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
  - API Health
  - Payment Monitoring
  - Booking Monitoring
  - Payout Monitoring
  - Queue / Job Monitoring
  - Error Tracking
  - Security Events
  - Financial Anomaly Detection
- Resilience & Recovery
  - Retry Strategy
  - Failure Recovery
  - Financial Recovery
  - Payment Recovery
  - Payout Recovery
  - Database Recovery
  - Disaster Recovery
- QA Performance Metrics
- Security / Privacy Validation
- Compliance Validation
- Final Production QA

## 07 — REGISTRY RECORD

Each roadmap item should be traceable through:

- Roadmap ID
- Official Name
- Legacy Name
- Classification
- Repository Files
- Database Tables
- API / Service
- PR
- Branch
- Tests
- Security Review
- CI Status
- Current State
- Verification Evidence

## 08 — ARCHITECTURE DECISION RECORDS

- ADR ID
- Decision
- Context
- Alternatives
- Consequences
- Superseded / Active

## 09 — DOMAIN / DATA REGISTRY

- Domain
- Entity
- Table
- Field
- Owner
- Relationships
- Lifecycle
- Data Classification

## 10 — STATE MACHINE REGISTRY

- Booking States
- Consultation States
- Payment States
- Hold States
- Payout States
- Dispute States
- Lawyer / Office States
- Allowed Transitions

## 11 — SECURITY CONTROL REGISTRY

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

## 12 — OBSERVABILITY & OPERATIONS

- Application Logs
- Metrics
- Alerts
- Health Checks
- Error Tracking
- Financial Monitoring
- Admin Monitoring
- Operational Runbooks

## 13 — RESILIENCE & RECOVERY

- Retry Strategy
- Idempotent Recovery
- Failure Handling
- Backup
- Restore
- Disaster Recovery
- Payment Recovery
- Data Recovery

## 14 — COMPLIANCE & LEGAL

- Privacy
- Legal Data Retention
- Financial Records
- Tax / E-Invoicing
- Audit Requirements
- Document Confidentiality
- Regulatory Dependencies

## 15 — NOTIFICATION POLICY

- Push
- SMS
- WhatsApp Business
- Email
- Booking Alerts
- Consultation Alerts
- Payment Alerts
- Dispute Alerts
- Reminder Policy

## 16 — FINANCIAL LEDGER ARCHITECTURE

- Gross Amount
- Platform Commission
- Applicable Tax
- Lawyer Net
- Hold
- Release
- Refund
- Payout
- Reconciliation
- Immutable Financial Events
- Financial Audit Integrity
- Ledger Invariants

### Ledger Invariant

**Financial state transitions must be atomic, idempotent, concurrency-safe, auditable, and reconcilable.**

## 17 — ROADMAP ↔ REPOSITORY VALIDATION

- Roadmap → Code
- Code → Roadmap
- KEEP
- RENAME / ALIGN
- ADD TO MAP
- DUPLICATE
- CONSOLIDATE
- NEEDS DECISION
- Orphan Code Detection
- Unmapped Feature Detection

## 18 — QA / TEST REGISTRY

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

## Governance Rule

This registry is the architectural source of truth for planning and validation. It does **not** imply that every listed capability is already implemented. Implementation status must be established through the Registry Record and ROADMAP ↔ REPOSITORY VALIDATION evidence.
