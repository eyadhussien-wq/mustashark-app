# MUSTASHAREK — MASTER ROADMAP

**Canonical architectural reference**

> Governing rule: no implementation before architectural classification.
> Execution gate: Repository → Typecheck → Tests → Security Review → CI → PR → Review → Merge → Verify Main.

## 00 — MASTER SYSTEM

```text
MUSTASHAREK
├── MASTER AUDIT — X / Y / Z / W
├── MASTER AUDIT MAP
├── UX RESCUE
├── FUNCTIONAL LIFECYCLES
├── D02 — DESIGN SYSTEM
├── SUPPORTING ARCHITECTURE
├── QA / TEST REGISTRY
├── ROADMAP ↔ REPOSITORY VALIDATION
└── DEVELOPMENT PHASES
```

## 01 — MASTER AUDIT X / Y / Z / W

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
- W/3 Shared Actions
- W/4 D02
- W/5 Cross-System Security
- W/6 Admin Control
- W/7 Identity & Access
- W/8 Office ↔ Lawyer Revenue
- W/9 Affiliate / Referral — DEFERRED

## 02 — FUNCTIONAL LIFECYCLES

### T01 — Consultation

```text
T01-01 Create Request
→ T01-02 Lawyer Review & Proposal
→ T01-03 Accept Proposal & Start Service
→ T01-04 Documents & Reuse
→ T01-05 Payment & Payment Proof
→ FINANCIAL ISOLATION GATE
→ FINANCIAL AUDIT INTEGRITY
→ T01-06 POA / Document Handover
→ T01-07 Scope Review & Acceptance
→ T01-08 Consultation Archive & Printing
→ T01-09+ Recover Previous Scope
→ T01 FINAL GATE
```

T01-05 financial subcomponents:
- T01-05-F1 Post-Consultation Hold
- T01-05-F2 Commission & Tax Engine
- T01-05-F3 Automated Invoicing
- T01-05-F4 Payout Engine

### S01 — Smart Scheduling

```text
S01-01 Existing Scheduling Audit
→ S01-02 Lawyer Availability Model
→ S01-03 Lawyer Interactive Calendar
→ S01-04 Client Booking Calendar
→ S01-05 Booking Transaction
→ S01-06 Real-Time Availability
→ S01-07 Upcoming Consultations
→ S01-08 Timezone & Localization
→ S01-09 Calendar UX & D02
→ S01-10 Security & Edge Cases
→ S01-11 Tests & Typecheck
→ S01-12 CI & Final QA
→ S01 CLOSED
```

S01-05/S01-06 controls include server-side source of truth, idempotency, double-booking protection, optimistic/concurrent conflict protection, race protection, and lock recovery.

### S02 — Legal Representation
- S02.1 Request Quote
- S02.2 Lawyer Proposal & 24h Expiry
- S02.3 Accept & Pay
- S02.4 Agreement & Electronic Confirmation
- S02.5 POA / Court Proof Upload
- S02.6 Active Case Workspace — **CLOSED**
- S02.7 Milestones & Escrow Release
- S02.7.5 Active Case Final State & Notification Synchronization — **CLOSED / PR #80 merged**
- S02.7.6 Audit Trail / Activity Log — **TEMPORARILY BLOCKED**: no ready case-specific Backend Audit Trail API; no mocks or architectural bypass.
- S02.7.7 Investor Attachments Sync — **ALREADY SATISFIED** by existing document APIs/UI; no artificial change introduced.
- S02.8 Admin Monitoring & Intervention

### S03 — Real Estate Opportunities

#### S03.1 — Real Estate Opportunities Catalog UI — **CLOSED / PR #81 merged**

Frontend-only opportunity catalog for the Jordanian market presentation, including:
- Property details and location
- Property type
- Expected yield
- Profit margin
- Opportunity value

Future API/data integration is permitted only after verification of real authoritative APIs and data sources. No fabricated investment data is permitted.

### S04 — **NEAR FUTURE / FROZEN**

S04 is temporarily frozen. No implementation branch or production work begins until the freeze is explicitly lifted and the architecture/API contract is approved.

### S05 — Lawyer Smart Safety Shield

Strategic future track for intelligent lawyer safety and verification:
- Lawyer identity and accreditation verification
- Account and document safety indicators
- Detection of abnormal or conflicting states before sensitive actions
- Clear user/admin warnings when intervention is required
- **Future API integration:** connect only to approved, authoritative APIs after availability and source-of-truth contracts are verified

No Backend, Schema, Migration, or financial-core change is implied by the roadmap item.

### T02 — Dispute & Resolution

```text
T02-01 Architecture & Data Audit
→ T02-02 Dispute Data Model
→ T02-03 Dispute State Machine
→ T02-04 Financial Transaction Safety
→ T02-05 Admin Dispute API
→ T02-06 Admin Resolution Controls
→ T02-07 Security & Authorization
→ T02-08 Admin Dashboard UI & Monitoring
→ T02-09 Tests & Idempotency
→ T02-10 Typecheck → CI → Security Review
→ VERIFY MAIN
→ T02 CLOSED
```

## 03 — D02 DESIGN SYSTEM

D02 is the single official design-system map.

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

## 04 — SUPPORTING ARCHITECTURE

- Domain / Data Registry
- State Machine Registry
- Security Control Registry
- Financial Ledger Architecture
- Notification Policy
- Compliance & Legal
- Observability & Operations
- Resilience & Recovery
- Architecture Decision Records

## 05 — QA / TEST REGISTRY

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

## 06 — ROADMAP ↔ REPOSITORY VALIDATION

Every roadmap item must map to repository reality:

`Roadmap ID → Feature → Repository Files → Database Tables → API/Service → UI → Branch → PR → Tests → CI → Production Status → Classification → Verification Evidence`

No unmapped feature is ready for implementation or merge.

## 07 — DEVELOPMENT PHASES

### Phase 2.5 — Case & Consultation Experience
T01 · S01 · S02

### Phase 2.6 — Documents & Handover
T01-04 · T01-06 · Secure Document Vault · Document Preview · Dynamic Watermarking

### Phase 2.7 — Financial & Payment Experience
T01-05 · Hold · Commission/Tax · Invoicing · Payout · Financial Isolation Gate · Financial Audit Integrity · Reconciliation

### Phase 2.8 — Security & Role Boundaries
Continuous Security Gate · IDOR/Ownership · Financial Authorization · Dispute/Refund Protection · Encryption · Immutable Financial Audit Log

### Phase 3 — Production Readiness
Payment Provider Integration · Tax/E-Invoicing · Payout Rails · Monitoring · Resilience/Recovery · Performance QA · Security/Privacy · Compliance · Final Production QA

### Phase 3+ — Strategic Expansion
S03 Real Estate Opportunities · S04 Frozen / Near Future · S05 Lawyer Smart Safety Shield with future verified API integrations.

## 08 — GLOBAL EXECUTION PROTOCOL

```text
MASTER ROADMAP
→ ROADMAP-REGISTRY
→ MASTER AUDIT MAP
→ DOMAIN / DATA / STATE / SECURITY CLASSIFICATION
→ FUNCTIONAL LIFECYCLE PLACEMENT
→ REPOSITORY AUDIT
→ IMPLEMENTATION
→ TYPECHECK
→ TESTS
→ SECURITY REVIEW
→ CI
→ PR
→ REVIEW
→ MERGE
→ VERIFY MAIN
→ CLOSED / VERIFIED
```

## Canonical lineage

This document consolidates the canonical roadmap material established by the historical governance work in PRs #32, #35, and the consolidation in #47, with the current S02/S03 status and strategic S04/S05 tracks. It is a governance specification, not proof that every listed item is implemented.
