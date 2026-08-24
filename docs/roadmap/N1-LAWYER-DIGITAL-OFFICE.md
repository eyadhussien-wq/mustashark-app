# Mustashark — N1 LAWYER DIGITAL OFFICE

**Official product architecture namespace:** `N1`

> This namespace is intentionally independent from `C1/C2/C3/...` financial/legal foundation stages. `N1` describes the Lawyer Product / Dashboard architecture and must not be reused for another domain.

## 00 — Product Definition

**N1 — Mustashark Lawyer Digital Office**

**Purpose:** transform the lawyer dashboard from a conventional dashboard into a **Digital Law Office / Lawyer Command Center** that the lawyer can use in the office, during a client meeting, while travelling, and in the courtroom.

Mustashark is positioned as a technology platform connecting a client with a licensed lawyer. The lawyer may begin with a consultation and progressively expand the relationship into a memorandum, document service, formal engagement, power of attorney, representation, or other legally permitted professional service.

N1 is a product architecture map. It is **not evidence that all N1 capabilities are currently implemented**.

## 01 — Core Product Principle

```text
Client Discovery
→ Lawyer Profile
→ Consultation
→ Client Intake
→ Legal Workbench
→ Memorandum / Document
→ Matter / Case
→ Engagement / POA / Representation
→ Ongoing Client Relationship
→ Lawyer Office Operations
→ Financial Entitlements / Settlement
→ Professional Intelligence
```

The strategic objective is not merely to bring lawyers into Mustashark for leads. The objective is to make Mustashark useful enough that the lawyer wants to keep using it as a daily professional workspace.

## 02 — N1 Capability Register

| ID | Capability | Product scope | Primary build placement |
|---|---|---|---|
| N1.01 | Professional Identity & Command Center | lawyer identity, accreditation status, specialization, profile health, main operating dashboard | Phase 2.5 / N1 Core |
| N1.02 | Digital Law Office | daily workspace, recent matters, clients, tasks, alerts, quick actions | Phase 2.5 / N1 Core |
| N1.03 | Client Management | client directory, profiles, history, linked services | Phase 2.5–2.6 |
| N1.04 | Client Intake | structured intake, classification, initial facts, service routing | T01 / Phase 2.5 |
| N1.05 | Consultation Management | consultation lifecycle, scheduling, status, follow-up | T01 + S01 |
| N1.06 | Legal Consultation Marketplace | discovery, matching, request acceptance, response workflow | T01 / Phase 2.5 |
| N1.07 | Legal Workbench | notes, analysis workspace, action-oriented legal work | Phase 2.6 |
| N1.08 | Legal Memorandum Studio | draft, review, versions, approval, delivery | Phase 2.6 |
| N1.09 | Document & Evidence Management | secure documents, classification, access, audit trail | T01/S02 + D02 |
| N1.10 | Case / Matter Management | matters, cases, parties, stages, related work | S02 / Phase 2.6 |
| N1.11 | Courtroom / Hearing Mode | hearing-ready files, dates, documents, urgent actions | Phase 2.6 / future |
| N1.12 | Meetings & Appointments | client meetings, consultations, hearings, reminders | S01 |
| N1.13 | Secure Client Communication | scoped messaging, file exchange, communication history | Phase 2.6 |
| N1.14 | Legal Relationship Lifecycle | consultation → memorandum → service → POA → representation | T01/S02 |
| N1.15 | Legal Services Expansion | contracts, drafting, legal research, permitted professional services | Phase 3+ |
| N1.16 | Lawyer Financial Center | entitlements, fees, commissions, settlement status; no assumption of licensed e-money wallet | C3 + Phase 2.7 |
| N1.17 | Revenue & Business Intelligence | consultations, conversion, revenue/entitlements, demand metrics | Phase 3 |
| N1.18 | Lawyer Growth & Reputation | ratings, responsiveness, service quality, professional visibility | Phase 3 |
| N1.19 | Task & Workflow Engine | tasks, deadlines, priorities, matter workflows | Phase 2.6 |
| N1.20 | Notifications & Alerts | consultations, meetings, documents, messages, financial/reconciliation alerts | S01 + Phase 2.6/2.7 |
| N1.21 | Search & Legal Knowledge Workspace | scoped search across lawyer-owned workspace and documents | Phase 3+ |
| N1.22 | AI Legal Workspace | future assisted research/drafting with human lawyer authority preserved | Phase 3+ |
| N1.23 | Templates & Legal Automation | templates, recurring workflows, document generation | Phase 3 |
| N1.24 | Client Conversion Engine | consultation → memorandum → service → engagement/representation | T01/S02 + Phase 3 |
| N1.25 | Marketplace Lawyer Profile | public professional profile and service offerings | Phase 2.5 |
| N1.26 | Professional Availability | working hours, availability, capacity, blackout periods | S01 |
| N1.27 | Private Archive | lawyer-controlled archive with retention rules | Phase 2.6 |
| N1.28 | Audit & Professional Security | activity log, access events, security events, MFA readiness | X/Y/W + Security Gate |
| N1.29 | Confidentiality & Legal Privacy | least privilege, matter isolation, minimization, retention | Security / Compliance |
| N1.30 | Lawyer Mobile Command Mode | mobile-first daily operations | Phase 2.5–2.6 |
| N1.31 | Lawyer Desktop / Office Mode | dense workspace for documents, matters, research and operations | Phase 2.6 |
| N1.32 | Court / Client Meeting Quick Access | context-specific quick mode for courtroom/client meetings | Phase 2.6 |
| N1.33 | External Legal Service Integration | future verified integrations only | Phase 3+ |
| N1.34 | Investment & Business Services | future domain; separate classification from N1 core | Phase 3+ / separate map when mature |
| N1.35 | Lawyer Ecosystem / Partner Network | referrals, collaboration, professional network | Phase 3+ / W cross-system |
| N1.36 | Office-Level Settings | office services, pricing, hours, communication, staff settings | Phase 3 |
| N1.37 | Multi-User Law Firm Mode | partners, lawyers, assistants, scoped permissions | Phase 3+ |
| N1.38 | Lawyer Operating Intelligence | unified operational intelligence across office activity | Phase 3+ |
| N1.39 | Cross-Platform Continuity | same professional workspace across web/mobile/context modes | Phase 2.6–3 |
| N1.40 | Lawyer Digital Office Core | orchestration layer joining the N1 capabilities | N1 Core / continuous |

## 03 — Master Audit X/Y/Z/W Placement

### Y — Lawyer is the primary audit home

- `Y/1` Navigation → N1.01, N1.02, N1.30, N1.31, N1.32
- `Y/2` Services → N1.05, N1.06, N1.14, N1.15, N1.24, N1.25
- `Y/3` Actions → N1.04, N1.07, N1.08, N1.10, N1.19, N1.20
- `Y/4` D02 → all N1 user-facing surfaces; especially N1.02, N1.08, N1.30–N1.32
- `Y/5` Security → N1.13, N1.28, N1.29, N1.09
- `Y/6` Admin Relationship → N1.18, N1.25, N1.36, N1.37 and admin intervention boundaries
- `Y/7` Identity & Access → N1.01, N1.03, N1.09, N1.10, N1.28, N1.29
- `Y/8` Office / Staff / Revenue → N1.16–N1.18, N1.36–N1.40

### X — Client cross-impact

N1.03–N1.06, N1.13–N1.15, N1.24–N1.25 affect the client journey and must map back to client ownership, consent, communication and service scope.

### Z — Admin cross-impact

N1.18, N1.20, N1.28, N1.36–N1.38 require controlled admin visibility/intervention without creating unauthorized access to privileged lawyer/client content.

### W — Cross-System

N1.06, N1.13, N1.14, N1.16, N1.20, N1.24, N1.28, N1.29, N1.35, N1.39–N1.40 cross the Client/Lawyer/Admin boundaries and therefore require W mapping.

## 04 — Functional Lifecycle Placement

### T01 — Consultation

N1.04 → N1.05 → N1.06 → N1.12 → N1.13 → N1.14 → N1.20 → N1.24

### S01 — Smart Scheduling

N1.12, N1.20, N1.26, N1.30, N1.32, N1.39

### S02 — Legal Representation

N1.09, N1.10, N1.11, N1.14, N1.15, N1.19, N1.27, N1.32

### T02 — Dispute / Resolution

N1.09, N1.10, N1.13, N1.19, N1.20, N1.28, N1.29 and any matter/financial transition exposed to dispute handling.

### C3 — Financial & Legal Operating Foundation dependency

N1.16 must not define custody, payout, escrow or payment-provider authority by product language alone. Its semantics remain subordinate to the C3 regulatory, contractual, financial, reconciliation and provider-boundary decisions.

## 05 — D02 Placement

N1 is a major role-specific D02 consumer and must receive a coherent visual system rather than a generic dashboard treatment.

- D02-01 → Lawyer Office information architecture
- D02-02 → Mustashark professional brand application
- D02-03 → Arabic/English professional typography
- D02-04 → lawyer actions / quick actions / state actions
- D02-05 → office cards, matter views, client views, document views, command navigation
- D02-06 → role-specific Lawyer UI unification
- D02-07 → memorandum/document print, PDF, share, court-ready presentation
- D02-08 → RTL, mobile, tablet, desktop, courtroom readability
- D02-09 → visual QA across N1 modes
- D02-10 → UI regression / CI / final review

## 06 — Supporting Architecture Placement

N1 requires explicit registry entries for:

- Lawyer domain/data model
- Client ↔ lawyer relationship model
- Matter/case state machine
- Consultation state machine
- Document ownership and scope
- Permission/RBAC matrix
- Notification policy
- Audit events
- Confidentiality and retention rules
- Financial entitlement semantics
- Reconciliation boundaries
- Architecture Decision Records

## 07 — QA / Verification Placement

Every implemented N1 capability is subject to the applicable evidence classes:

- Unit
- Integration
- API/contract
- Permission/ownership
- Security/IDOR
- Confidentiality/privacy
- State transition
- Concurrency/idempotency for stateful operations
- Financial integrity for N1.16 and related flows
- E2E user journey
- Mobile/desktop visual QA
- Accessibility/RTL/i18n
- Typecheck
- CI
- Final diff audit
- Verify Main

## 08 — Development Phase Allocation

| Build phase | N1 scope |
|---|---|
| Phase 2.5 — Case & Consultation Experience | N1.01–N1.06, N1.12, N1.20, N1.25, N1.26, N1.30 |
| Phase 2.6 — Documents & Handover | N1.07–N1.15, N1.19, N1.27, N1.31, N1.32, N1.39 |
| Phase 2.7 — Financial & Payment Experience | N1.16 plus financial visibility required by N1.18/N1.20; governed by C3 |
| Phase 2.8 — Security & Role Boundaries | N1.28–N1.29 plus authorization/privacy hardening across all N1 surfaces |
| Phase 3 — Production Readiness | N1.17, N1.18, N1.23, N1.24, N1.33, N1.36, N1.38 |
| Phase 3+ — Strategic Expansion | N1.15, N1.21–N1.22, N1.34–N1.35, N1.37 and advanced N1.40 capabilities |

## 09 — Roadmap ↔ Repository Traceability

For every N1 implementation task:

```text
N1.xx
→ Y/X/Z/W placement
→ T01/S01/S02/T02 impact
→ C3 dependency if financial/legal
→ D02 impact
→ Domain/Data/State/Security classification
→ Repository files
→ DB tables
→ API/service
→ UI components
→ Tests
→ Security review
→ CI
→ PR
→ Verify Main
```

No N1 capability is considered implemented merely because the dashboard displays a UI placeholder.

## 10 — Product Strategy

The intended commercial/service journey is:

```text
Lawyer joins Mustashark
→ builds professional profile
→ receives client discovery / consultation requests
→ conducts consultation
→ produces memorandum / document
→ continues the legal relationship
→ creates/handles a matter
→ progresses to formal engagement / POA / representation where legally applicable
→ manages client communication, documents, tasks and meetings
→ uses Mustashark as the lawyer's daily digital office
```

The consultation marketplace is therefore an **entry point into the lawyer's professional workspace**, not the final product boundary.

## 11 — Non-Goals / Guardrails

- N1 does not itself decide the regulatory classification of Mustashark.
- N1 does not make a `Wallet` a licensed money/e-money product.
- N1 does not authorize custody, payout or refund behavior outside the C3 model.
- N1 does not replace a licensed lawyer's professional judgment.
- N1 does not expose one client's confidential matter to another client or lawyer.
- N1 does not imply implementation completion.
- Investment, external legal data services and advanced AI remain separate/future tracks until independently classified.

## 12 — Current Status

`N1 — OPEN / PRODUCT ARCHITECTURE`

This document records the approved product direction and mapping only. Implementation status must be proven separately through the canonical roadmap/registry and repository evidence.

**Project identity:** `Mustashark`.
