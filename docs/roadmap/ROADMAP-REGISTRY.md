# MUSTASHAREK — ROADMAP-REGISTRY

> **Authoritative roadmap and architecture registry**
>
> This document is the planning and governance reference for Mustasharek. It does not imply that every listed item is implemented. Implementation status must be verified against repository code, database, API/service, tests, security review, CI, PR and main-branch verification.

## 00 — REGISTRY GOVERNANCE

- No Implementation Before Architectural Classification
- KEEP
- RENAME / ALIGN
- ADD TO MAP
- DUPLICATE
- CONSOLIDATE
- NEEDS DECISION
- CLOSED / VERIFIED

## 01 — MASTER AUDIT ARCHITECTURE

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
**FINANCIAL ISOLATION GATE**
↓
Financial Effect
↓
**FINANCIAL AUDIT INTEGRITY**
↓
Admin Oversight
↓
Audit Log
↓
D02

### Financial Isolation Gate

- Atomic Transaction
- Idempotency Key
- Concurrency / Race Protection
- Locking
- State Validation
- Duplicate Financial Effect Prevention

### Financial Audit Integrity

- Immutable Financial Event
- Before / After
- Actor
- Timestamp
- Transaction / Idempotency Reference
- Reconciliation Integrity

> **Core rule:** No Financial Effect may occur before passing the **FINANCIAL ISOLATION GATE**, and no financial effect is considered complete without **FINANCIAL AUDIT INTEGRITY**.

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
- Z/5 Security
- Z/6 RBAC / Permissions
- Z/7 Super Admin

### W — CROSS-SYSTEM

- W/1 Shared Navigation
- W/2 Shared Services
  - W/2.1 Smart Notifications & Alerts
- W/3 Shared Actions
- W/4 D02
- W/5 Cross-System Security
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
- T01-05 Payment & Payment Proof 🔒
  - Security Gate
  - T01-05-F1 Post-Consultation Hold
  - T01-05-F2 Commission & Tax Engine
  - T01-05-F3 Automated Invoicing
  - T01-05-F4 Payout Engine
- T01-06 POA / Document Handover
- T01-07 Scope Review & Acceptance
- T01-08 Consultation Archive & Printing
- T01-09+ Recover Previous Scope
- T01 FINAL GATE

### S01 — SMART SCHEDULING

- S01-01 → S01-12
- Double Booking Protection
- TTL / Slot Lock
- Timezone / Localization
- Security / Edge Cases

### S02 — LEGAL REPRESENTATION

- S02.1 Request Quote
- S02.2 Lawyer Proposal & 24h Expiry
- S02.3 Accept & Pay
- S02.4 Agreement
- S02.5 POA / Court Proof
- S02.6 Active Case Workspace
- S02.7 Milestones & Escrow
- S02.8 Admin Monitoring

### T02 — DISPUTE & RESOLUTION

- T02-01 Architecture & Data Audit
- T02-02 Dispute Data Model
- T02-03 Dispute State Machine
- T02-04 Financial Transaction Safety
- T02-05 Admin Dispute API
- T02-06 Admin Resolution Controls
- T02-07 Security & Authorization
- T02-08 Admin Dashboard
- T02-09 Tests & Idempotency
- T02-10 Typecheck → CI → Security → Merge

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

### Phase 2.7 — Financial & Payment Experience

- T01-05 Payment Foundation
- T01-05-F1 Post-Consultation Hold
- T01-05-F2 Commission & Tax Engine
- T01-05-F3 Automated Invoicing
- T01-05-F4 Payout Engine
- Y/8.28 Financial Ledger UI
- Financial Audit / Reconciliation

### Phase 2.8 — Security & Role Boundaries

- Continuous Security Gate
- Financial Authorization
- Payout Authorization
- Invoice Integrity
- IDOR Protection
- Encryption / Privacy
- Dispute / Refund Protection

### Phase 3 — Production Readiness

- Production Payment Integration
- Tax / E-Invoicing Integration
- Payout Rails
- Monitoring
- Final Production QA

## 07 — REGISTRY RECORD

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
- E2E Tests
- Typecheck
- CI
- Real Preview
- Final Verification

---

## Governance rule

This registry is authoritative for roadmap classification, but it is **not an implementation-status claim**. Every implementation must be validated against the repository and pass the agreed delivery gate:

**Diff → Security Review → Typecheck → Tests → Migration rehearsal → CI → PR → Squash Merge → Verify main.**
