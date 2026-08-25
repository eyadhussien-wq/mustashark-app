# N1 — LAWYER DIGITAL OFFICE BUILD-PHASE MAP

Canonical implementation decomposition for `N1.01–N1.40`.

## Phase 2.5 — Lawyer Entry & Consultation Office

**Goal:** make the lawyer dashboard immediately useful as a professional command center.

- N1.01 Professional Identity & Command Center
- N1.02 Digital Law Office
- N1.03 Client Management foundation
- N1.04 Client Intake
- N1.05 Consultation Management
- N1.06 Legal Consultation Marketplace
- N1.12 Meetings & Appointments foundation
- N1.20 Notifications foundation
- N1.25 Marketplace Lawyer Profile
- N1.26 Professional Availability
- N1.30 Lawyer Mobile Command Mode foundation

Dependencies: `T01`, `S01`, `Y/1–Y/8`, `D02`.

## Phase 2.6 — Legal Workbench, Documents & Matters

**Goal:** move from lead/consultation dashboard to actual daily legal work.

- N1.07 Legal Workbench
- N1.08 Legal Memorandum Studio
- N1.09 Document & Evidence Management
- N1.10 Case / Matter Management
- N1.11 Courtroom / Hearing Mode
- N1.13 Secure Client Communication
- N1.14 Legal Relationship Lifecycle
- N1.15 initial Legal Services Expansion capabilities
- N1.19 Task & Workflow Engine
- N1.27 Private Archive
- N1.31 Desktop / Office Mode
- N1.32 Court / Client Meeting Quick Access
- N1.39 Cross-Platform Continuity

Dependencies: `T01`, `S02`, `D02`, security/privacy, document ownership/scope.

## Phase 2.7 — Financial Experience

**Goal:** expose financial information safely without changing the C3 legal/regulatory model.

- N1.16 Lawyer Financial Center
- N1.18 financial portions of Reputation/Growth metrics
- N1.20 financial/reconciliation notifications

Mandatory dependencies:

`C3 → Provider Boundary → Financial Semantics → Reconciliation → Financial Isolation Gate → Financial Audit Integrity → N1 UI`

No N1 language may imply that a lawyer/client wallet is licensed e-money merely because the UI calls it a wallet.

## Phase 2.8 — Security & Role Boundaries

**Goal:** protect the digital office as a confidential professional environment.

- N1.28 Audit & Professional Security
- N1.29 Confidentiality & Legal Privacy

Cross-cutting controls:

- authentication
- RBAC
- ownership/scope
- IDOR prevention
- matter isolation
- document authorization
- staff permissions
- audit trail
- encryption
- retention
- secure sharing

## Phase 3 — Production Readiness & Office Intelligence

- N1.17 Revenue & Business Intelligence
- N1.18 Lawyer Growth & Reputation
- N1.23 Templates & Legal Automation
- N1.24 Client Conversion Engine
- N1.33 External Legal Service Integration
- N1.36 Office-Level Settings
- N1.38 Lawyer Operating Intelligence

These require production-grade monitoring, privacy/compliance review, E2E coverage and verified external integrations.

## Phase 3+ — Strategic Expansion

- N1.15 advanced Legal Services Expansion
- N1.21 Search & Legal Knowledge Workspace
- N1.22 AI Legal Workspace
- N1.34 Investment & Business Services
- N1.35 Lawyer Ecosystem / Partner Network
- N1.37 Multi-User Law Firm Mode
- N1.40 advanced Lawyer Digital Office Core capabilities

Investment and external-service domains must receive their own regulatory/domain classification before implementation.

## Build Rule

N1 is a product architecture, not a permission to implement everything at once.

```text
N1 classification
→ existing C/T/S/Y/W/D02 dependency check
→ repository reality audit
→ domain/data/state/security classification
→ implementation
→ tests
→ security review
→ CI
→ verify main
```
