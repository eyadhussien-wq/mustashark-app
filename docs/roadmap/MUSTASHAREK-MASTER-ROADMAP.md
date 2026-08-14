# 🗺️ MUSTASHAREK — MASTER ROADMAP

> **Authoritative roadmap for the Mustasharek rescue, audit, architecture, functional lifecycles, design system, security gates, and production readiness.**
>
> Repository audit target for this revision: `codex/audit-x-1-client-navigation` (not `main`).
>
> Core rule: **do not delete work because its name differs from the roadmap.** Keep it when it is functionally in-scope, align its legacy name through `ROADMAP-REGISTRY`, and add genuinely out-of-map work to the roadmap.

## 0. Roadmap governance

```text
                    🗺️ MUSTASHAREK — MASTER ROADMAP
                                  │
                                  ▼
                           Repository Audit
                                  │
                   ┌──────────────┼──────────────┐
                   │              │              │
                داخلها         اسم مختلف       خارجها
                   │              │              │
                   ▼              ▼              ▼
                 KEEP        RENAME / ALIGN   ADD TO MAP
                   │              │              │
                   └──────────────┼──────────────┘
                                  ▼
                           Duplicate Check
                                  │
                         ┌────────┴────────┐
                         │                 │
                       Unique          Duplicate
                         │                 │
                         │            Consolidate
                         │                 │
                         └────────┬────────┘
                                  ▼
                              UNMAPPED?
                                  │
                           ┌──────┴──────┐
                           │             │
                          NO            YES
                           │             │
                           ▼             ▼
                       Roadmap      NEEDS DECISION
                           │
                           ▼
                     Implementation
```

### Mandatory execution gate

```text
Audit
 → Design / Data
 → Implementation
 → Security
 → Tests
 → Typecheck
 → CI
 → Review
 → Merge
 → Verify main
```

No production database execution is implied by roadmap registration. Existing functionality is not rebuilt unless the audit proves it is missing or insecure.

---

# 1. MASTER AUDIT — X / Y / Z / W

```text
MASTER AUDIT
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
│   ├── Y/7 Identity & Access Security
│   └── Y/8 Office / Staff / Revenue
│
├── Z — ADMIN
│   ├── Z/1 Navigation
│   ├── Z/2 Monitoring
│   ├── Z/3 Administrative Actions
│   ├── Z/4 Reports / Analytics
│   ├── Z/5 Security
│   ├── Z/6 RBAC / Permissions
│   └── Z/7 Super Admin
│
└── W — CROSS-SYSTEM
    ├── W/1 Shared Navigation
    ├── W/2 Shared Services
    ├── W/3 Shared Actions
    ├── W/4 D02
    ├── W/5 Cross-System Security
    ├── W/6 Admin Control
    ├── W/7 Identity & Access
    ├── W/8 Office ↔ Lawyer Revenue
    └── W/9 Affiliate / Referral — DEFERRED
```

### X/1 locked navigation decisions

- X/1.1 Dashboard is the protected client entry point.
- X/1.2 Bottom navigation is reserved for primary recurring functions.
- X/1.3 Notifications use the top Bell, not a primary bottom tab unless a later audit changes the decision.
- X/1.4 every route receives an explicit navigation/ownership/service decision.
- Document Center is contextual/shared, not a primary bottom tab.
- X/1 route inventory is coupled to D02 semantics and security tests.

### Cross-cutting security model

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
Resource Scope / Ownership
  ↓
Data
  ↓
Financial Effect
  ↓
Admin Oversight
  ↓
Audit Log
  ↓
D02 presentation
```

---

# 2. UX RESCUE & RE-ARCHITECTURE — PHASE 2

```text
Phase 2 — UX Rescue & Re-Architecture
│
├── 2 UX-A — Frontend Information Architecture & Role Alignment ✅
│   └── UX-A-01 — findings fixed without duplication
│
├── 2 UX-B — Client Journey
│   ├── UX-B-01 — Client
│   ├── UX-B-02-A
│   ├── UX-B-02-01
│   ├── UX-B-02-02
│   ├── UX-B-02-03
│   ├── UX-B-02 — Services
│   ├── UX-B-02-A — Current UI Audit
│   ├── UX-B-03 — Consultations
│   └── UX-B-04 — My Account
│
├── 2 UX-C — Lawyer Journey
├── 2 UX-D — Role & Permission Alignment
├── 2 UX-E — Visual UX & Design System
└── 2 UX-F — Implementation & Review
```

## T01 — Consultation Lifecycle

```text
T01
├── T01-01 — Create Request
├── T01-02 — Lawyer Review & Proposal
├── T01-03 — Accept Proposal & Start Service
├── T01-04 — Documents & Reuse
├── T01-05 — Payment & Proof
│   └── existing PR #15 / security PR #22 — do not rebuild; continue security review only
├── T01-06 — Agency / Delivery / Document Handover
├── T01-07 — next T01 stage — recover exact historical scope before advancing
├── T01-08 — Consultation Archive & Printing
├── T01-09+ — recover and audit any historical stages before closing T01
│
└── T01 final integration gate
    ├── Preview
    ├── Typecheck
    ├── Tests
    ├── CI
    ├── Security review
    ├── CodeRabbit / review
    └── Final PR + verify main
```

Current repository evidence includes T01-06 security hardening and T01-08 archive/printing work. T01-05 remains protected from rebuild.

---

# 3. FUNCTIONAL LIFECYCLE — S01

## 📅 S01 — Smart Scheduling & Interactive Calendar

```text
S01
├── S01-01 Existing Booking & Scheduling Audit
├── S01-02 Lawyer Availability Model
├── S01-03 Lawyer Interactive Calendar
├── S01-04 Client Booking Calendar
├── S01-05 Booking Transaction & Double-Booking Protection
├── S01-06 Real-Time Availability
├── S01-07 Upcoming Consultations
├── S01-08 Timezone & Localization
├── S01-09 Calendar UX & D02 Integration
├── S01-10 Security & Edge Cases
├── S01-11 Tests & Typecheck
└── S01-12 CI & Final QA
```

S01 owns consultation ordering, Active/Upcoming logic, `scheduled_at` / `created_at` semantics, and consultation totals at API/Data level. Existing booking functionality is audited first; only gaps are implemented.

---

# 4. FUNCTIONAL LIFECYCLE — S02

## S02 — Legal Representation Lifecycle

```text
S02
├── S02.1 Request Quote
├── S02.2 Lawyer Proposal & 24h Expiry
├── S02.3 Accept & Pay
├── S02.4 Agreement & Electronic Confirmation
├── S02.5 POA / Court Proof Upload
├── S02.6 Active Case Workspace
├── S02.7 Milestones & Escrow Release
└── S02.8 Admin Monitoring & Intervention
```

S02 is distinct from T01: T01 covers the consultation lifecycle already in progress; S02 covers the broader legal-representation lifecycle.

---

# 5. FUNCTIONAL LIFECYCLE — T02

## T02 — Dispute & Resolution System

```text
T02
├── T02-01 Architecture & Data Audit
├── T02-02 Dispute Data Model
├── T02-03 Dispute State Machine
├── T02-04 Financial Transaction Safety
├── T02-05 Admin Dispute API
├── T02-06 Admin Resolution Controls
├── T02-07 Security & Authorization
├── T02-08 Admin Dashboard UI & Monitoring
├── T02-09 Tests & Idempotency
└── T02-10 Typecheck → CI → Security Review → Merge
```

Rule: **T02 adds only what is missing. It does not rebuild an existing dispute/resolution capability.**

---

# 6. D02 — DESIGN SYSTEM & VISUAL IDENTITY

```text
D02
├── D02-01 Visual Audit & Design Foundation
├── D02-02 Turquoise + Gold Brand Identity
├── D02-03 Tajawal Typography System
├── D02-04 Buttons, Actions & Dropdowns
├── D02.4 Interactive Controls & Touch Targets
├── D02-05 Cards, Forms, Modals & Navigation
├── D02.5 Authentication & Role Selection UX
├── D02-06 Client / Lawyer / Admin UI Unification
├── D02.6 Interactive Consultation Controls
├── D02-07 Print / PDF / Share / Document Actions
├── D02.7 Interactive Status & Availability Controls
├── D02-08 RTL, Responsive & Device Compatibility
├── D02.8 Consultation Lists, Tabs & Empty States
├── D02.9 Consultation Documents & PDF/Print Design
├── D02.10 Home Screen & Lawyer Card UX
├── D02.11 Consultation Counters & List Headers
├── D02.12 Support, Alerts & Profile Actions
├── D02.13 Trust, Security & Payment Assurance UI
├── D02-09 Full Visual QA
└── D02-10 Typecheck / Tests / CI / Final Review
```

### D02 naming alignment

The repository currently contains a legacy execution sequence in `docs/design/D02-02-AUDIT.md` and `D02-DESIGN-SYSTEM.md`. It is retained as evidence and aligned through `ROADMAP-REGISTRY`; it does not replace the official roadmap numbering.

First official execution path:

> **D02-01 — Establish Mustasharek visual design audit and design system foundation**

D02 is presentation/shared UI architecture. Functional gaps discovered by D02 are routed to S01/S02/T01/T02 or the appropriate X/Y/Z/W audit stream rather than rebuilt inside D02.

---

# 7. UPPER DEVELOPMENT PHASES

```text
Phase 2 — UX Rescue & Re-Architecture
        │
        ▼
Phase 2.5 — Case & Consultation Experience
        │
        ▼
Phase 2.6 — Documents & Handover Experience
        │
        ▼
Phase 2.7 — Financial & Payment Experience
        │
        ▼
Phase 2.8 — Security & Role Boundaries
        │
        ▼
Phase 3 — Production Readiness
```

Phase 2.8 remains a continuous **security gate** informed by the security work already completed; it is not a reason to duplicate T01-05 or other completed flows.

---

# 8. E — ENGINEERING / DELIVERY (ADDED FROM BRANCH AUDIT)

The branch contains genuine work that is not a Client/Lawyer/Admin/Cross-System product feature and therefore should not be forced into X/Y/Z/W. It is registered here rather than discarded.

```text
E — ENGINEERING / DELIVERY
├── E/1 CI / Workflow Infrastructure
├── E/2 Test & Audit Harnesses
├── E/3 Development Environment / Codespaces / Replit Integration
├── E/4 Production Database Safety / Mutation Guards
├── E/5 Dependency / Build / Runtime Safety
└── E/6 Release Gates & Verification
```

Examples found on the audited branch:

- `audit-x1.yml`
- `scripts/audit/x1-client-navigation.mjs`
- `scripts/audit/x1-document-security.mjs`
- `scripts/codespaces-bootstrap.sh`
- `scripts/codespaces-dev-env.sh`
- `docker-compose.codespaces.yml`
- production DB guard / audit security work inherited by the branch
- CI/build/dependency safety checks

E is cross-cutting delivery infrastructure and does not alter the product role hierarchy.

---

# 9. PHASE 3 — PRODUCTION READINESS

Phase 3 is the final production gate and includes, at minimum:

- production configuration and secrets review
- database migration rehearsal and explicit production migration approval
- authentication/recovery production validation
- RBAC / ownership / IDOR validation
- payment and financial reconciliation validation
- document/PDF validation
- CI/CD green
- dependency/build/runtime validation
- observability and audit logging
- preview/device validation
- final security review
- verify `main` after merge

---

# 10. MASTER RELATIONSHIP MODEL

```text
                         🗺️ MASTER ROADMAP
                                  │
            ┌─────────────────────┼─────────────────────┐
            │                     │                     │
     MASTER AUDIT          FUNCTIONAL LIFECYCLES   DESIGN SYSTEM
      X / Y / Z / W        T01 / S01 / S02 / T02       D02
            │                     │                     │
            └─────────────────────┼─────────────────────┘
                                  │
                       Architecture Decisions
                                  │
                                  ▼
                       Phase 2 → 2.5 → 2.6
                                  │
                                  ▼
                         2.7 → 2.8 → Phase 3
                                  │
                                  ▼
                   Tests + Security + Typecheck + CI
                                  │
                                  ▼
                       Review → Merge → Verify main
```

### Fixed taxonomy

- **X / Y / Z / W = Master Audit.**
- **T01 / S01 / S02 / T02 = Functional Lifecycles.**
- **D02 = Design System & Visual Identity.**
- **E = Engineering / Delivery cross-cutting work added by repository audit.**
- **Phase 2.5 → 2.6 → 2.7 → 2.8 → Phase 3 = upper development phases.**

This taxonomy is the reference used by `ROADMAP-REGISTRY`.
