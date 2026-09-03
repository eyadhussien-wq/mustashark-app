# MUSTASHAREK — MASTER ROADMAP

**Canonical architectural reference**

> Governing rule: no implementation before architectural classification.
> Execution gate: Repository → Typecheck → Tests → Security Review → CI → PR → Review → Merge → Verify Main.

## 00 — MASTER SYSTEM

```text
MUSTASHARK
├── MASTER AUDIT — X / Y / Z / W
├── MASTER AUDIT MAP
├── UX RESCUE
├── FUNCTIONAL LIFECYCLES
├── N1 — LAWYER DIGITAL OFFICE
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
- **N1 — Lawyer Digital Office overlays Y/1–Y/8 as the canonical lawyer product architecture.**

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
- **N1 cross-system capabilities map to W where they cross Client/Lawyer/Admin boundaries.**

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

**N1 placement:** N1.04 Client Intake, N1.05 Consultation Management, N1.06 Consultation Marketplace, N1.12 Meetings, N1.13 Secure Communication, N1.14 Relationship Lifecycle, N1.20 Notifications, N1.24 Client Conversion.

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

**N1 placement:** N1.12 Meetings & Appointments, N1.20 Notifications, N1.26 Professional Availability, N1.30 Mobile Command Mode, N1.32 Court/Meeting Quick Access, N1.39 Cross-Platform Continuity.

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

**N1 placement:** N1.09 Documents, N1.10 Matter/Case Management, N1.11 Courtroom Mode, N1.14 Relationship Lifecycle, N1.15 Legal Services Expansion, N1.19 Tasks, N1.27 Archive, N1.32 Court/Meeting Quick Access.

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

**N1 placement:** N1.09, N1.10, N1.13, N1.19, N1.20, N1.28, N1.29 wherever lawyer-visible dispute/matter data is legitimately exposed.

## 03 — N1 — MUSTASHARK LAWYER DIGITAL OFFICE

**Official product architecture namespace:** `N1`

N1 is independent from the `C1/C2/C3/...` financial/legal foundation sequence. It is the canonical architecture for the Lawyer Dashboard evolving into a **Digital Law Office / Lawyer Command Center**.

Core capability groups:

- N1.01–N1.02 Professional Identity / Command Center / Digital Law Office
- N1.03–N1.06 Clients, Intake, Consultation and Marketplace
- N1.07–N1.15 Legal Workbench, Memoranda, Documents, Matters, Court and Relationship Lifecycle
- N1.16–N1.18 Financial Center, Business Intelligence and Reputation
- N1.19–N1.20 Tasks and Notifications
- N1.21–N1.24 Search, AI Future, Templates and Client Conversion
- N1.25–N1.27 Marketplace Profile, Availability and Archive
- N1.28–N1.29 Audit/Security and Confidentiality/Privacy
- N1.30–N1.32 Mobile, Desktop and Court/Meeting modes
- N1.33–N1.35 External integrations, Investment/Business future domain, Ecosystem
- N1.36–N1.40 Office Settings, Law Firm Mode, Operating Intelligence, Continuity and Digital Office Core

### N1 build allocation

- **Phase 2.5 — Case & Consultation Experience:** N1.01–N1.06, N1.12, N1.20, N1.25, N1.26, N1.30
- **Phase 2.6 — Documents & Handover:** N1.07–N1.15, N1.19, N1.27, N1.31, N1.32, N1.39
- **Phase 2.7 — Financial & Payment Experience:** N1.16 plus financial visibility required by N1.18/N1.20; all governed by C3
- **Phase 2.8 — Security & Role Boundaries:** N1.28–N1.29 and cross-cutting authorization/privacy hardening
- **Phase 3 — Production Readiness:** N1.17, N1.18, N1.23, N1.24, N1.33, N1.36, N1.38
- **Phase 3+ — Strategic Expansion:** N1.15, N1.21–N1.22, N1.34–N1.35, N1.37, advanced N1.40

N1 product strategy:

```text
Lawyer joins Mustashark
→ Professional Profile
→ Client Discovery / Consultation
→ Client Intake
→ Legal Workbench
→ Memorandum / Document
→ Matter / Case
→ Engagement / POA / Representation where legally applicable
→ Client Communication
→ Tasks / Meetings / Court
→ Financial Entitlements / Settlement
→ Mustashark becomes the Lawyer's Digital Office
```

N1 does not change C3 regulatory meaning, custody, payout, escrow, provider authority, or professional legal responsibility.

## 04 — D02 DESIGN SYSTEM

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

**N1/D02 overlay:** lawyer office information architecture, role-specific navigation, matter/document cards, professional typography, court-ready document presentation, mobile/desktop continuity, RTL/i18n and visual QA.

## 05 — SUPPORTING ARCHITECTURE

- Domain / Data Registry
- State Machine Registry
- Security Control Registry
- Financial Ledger Architecture
- Notification Policy
- Compliance & Legal
- Observability & Operations
- Resilience & Recovery
- Architecture Decision Records
- **N1 Lawyer Domain/Data/State/Permission Registry**
- **N1 Client↔Lawyer Relationship Registry**
- **N1 Matter/Case State Registry**
- **N1 Document Scope/Confidentiality Registry**

## 06 — QA / TEST REGISTRY

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
- Visual QA
- Accessibility/RTL/i18n QA
- Final Verification

**N1-specific:** every capability must be traceable to its Y/X/Z/W placement, lifecycle impact, D02 impact, security/permission model, and repository evidence.

## 07 — ROADMAP ↔ REPOSITORY VALIDATION

Every roadmap item must map to repository reality:

`Roadmap ID → Feature → Database Tables → API/Service → UI → Repository Files → Branch → PR → Tests → CI → Production Status → Classification → Verification Evidence`

No unmapped feature is ready for implementation or merge.

## 08 — DEVELOPMENT PHASES

### Phase 2.5 — Case & Consultation Experience
T01 · S01 · S02 · **N1 Lawyer Digital Office Core (consultation/client/availability/profile surfaces)**

### Phase 2.6 — Documents & Handover
T01-04 · T01-06 · Secure Document Vault · Document Preview · Dynamic Watermarking · **N1 legal workbench/document/matter/court surfaces**

### Phase 2.7 — Financial & Payment Experience
T01-05 · Hold · Commission/Tax · Invoicing · Payout · Financial Isolation Gate · Financial Audit Integrity · Reconciliation · **N1.16 Financial Center visibility governed by C3**

### Phase 2.8 — Security & Role Boundaries
Continuous Security Gate · IDOR/Ownership · Financial Authorization · Dispute/Refund Protection · Encryption · Immutable Financial Audit Log · **N1.28–N1.29**

### Phase 3 — Production Readiness
Payment Provider Integration · Tax/E-Invoicing · Payout Rails · Monitoring · Resilience/Recovery · Performance QA · Security/Privacy · Compliance · Final Production QA · **N1 intelligence/business/office operations**

### Phase 3+ — Strategic Expansion
S03 Real Estate Opportunities · S04 Frozen / Near Future · S05 Lawyer Smart Safety Shield · **N1 advanced AI/search, law-firm mode, ecosystem, external integrations and future services**

## 09 — GLOBAL EXECUTION PROTOCOL

```text
MASTER ROADMAP
→ ROADMAP-REGISTRY
→ MASTER AUDIT MAP
→ N1 / DOMAIN / DATA / STATE / SECURITY CLASSIFICATION
→ FUNCTIONAL LIFECYCLE PLACEMENT
→ D02 PLACEMENT
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

## 10 — E01 SECURITY FOUNDATION

E01 is now part of the canonical Master Roadmap as a cross-cutting security foundation. It overlays existing architecture; it does not create a competing namespace for X/Y/Z/W, N1, C-stage, T/S or D02.

### E01 execution package

`E01-A → E01-B → E01-C → E01-D → E01-E`

One branch only:

`main → security/e01-foundation-2026-09-03 → one final PR → main`

### E01-B — Professional Trust

**Purpose:** establish a secure, auditable professional-trust boundary for lawyer accreditation and entitlement without making the administrator the normal source of professional authority.

**Canonical trace:**

`E01-B → Professional Trust → Y/7 + Y/5 → N1.01–N1.02 → S05 → D02-01/02/03/05/06/08/09 → ProfessionalVerificationProvider → verification lifecycle/state → repository → tests → Security Gate`

Approved direction:

`lawyer registration → professional/bar number + practice card → automated evidence extraction/matching → permitted public/official source verification → automated decision → professional entitlement`

Security constraints:

- only technically and legally permitted public sources may be automated;
- no private portal, credentialed service, bypass, rate-limit evasion or undocumented privileged endpoint;
- provider boundary is explicit and fail-closed;
- missing/unavailable source evidence cannot grant professional access;
- professional entitlement is derived from authoritative DB state, not a stale JWT;
- practice-card SHA-256 is derived server-side from actual submitted bytes;
- verification and lawyer-account activation are atomic;
- administrator intervention is restricted to unresolved exception cases and is audit logged.

Lifecycle:

`pending → verifying → approved | rejected | exception`

Security states:

`expired | suspended | revoked`

**Current status:** `CLOSED / VERIFIED`

**Closure evidence:**
- Implementation/evidence package is present on the same E01 branch.
- Security Auth Verification Gate: **SUCCESS**
- Workflow run: **#766**
- Run ID: `33705013677`
- Verified head: `65fefb4273ca1e484d7d0657531835b6cd54da57`
- Closure record: `docs/security/E01-B-CLOSURE-EVIDENCE-2026-09-03.md`

### E01-A / C / D / E

- **E01-A:** Authentication & Authorization — CLOSED on the E01 branch.
- **E01-C:** Legal Data Isolation — open; overlays C12/C13 and X/Y/Z/W security boundaries.
- **E01-D:** Terms / Privacy — open; overlays C30/C31 and X/Y/Z/W privacy boundaries.
- **E01-E:** Final Security Gate — closes E01 only after A–D evidence, final diff audit, Security Gate and target-branch verification are complete.

### Governance boundary

E01 does not authorize changes to S02, Financial, Production DB, or other unrelated work merely by being present in the Master Roadmap. Any such work must retain its own roadmap identity and security/financial gates.

## Canonical lineage

This document consolidates the canonical roadmap material established by the historical governance work in PRs #32, #35, and the consolidation in #47, with the current S02/S03 status, strategic S04/S05 tracks, N1 Lawyer Digital Office architecture, and the E01 Security Foundation overlay. It is a governance specification, not proof that every listed item is implemented.
