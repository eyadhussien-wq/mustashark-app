# ROADMAP-REGISTRY

> **Roadmap ID ↔ Official Name ↔ Legacy / Repository Name ↔ Files ↔ PR ↔ Status**
>
> Audit basis: branch `codex/audit-x-1-client-navigation`, not `main`.

## Registry rules

1. Official roadmap IDs are stable.
2. Existing repository names are not deleted merely because they differ.
3. A legacy name is mapped to the official ID here.
4. A feature found outside the roadmap is added to the roadmap before implementation continues.
5. Duplicate functionality is consolidated; the strongest existing implementation becomes authoritative.
6. `KEEP` means the same roadmap symbol remains authoritative.
7. `ALIGN` means the repository/legacy name differs but belongs to an existing roadmap item.
8. `ADD` means the branch revealed a genuine cross-cutting stream not previously represented; it is now E.

---

# A. Master Audit Registry

| Roadmap ID | Official name | Legacy / repository name | Files / evidence on audited branch | PR | Status |
|---|---|---|---|---|---|
| X/1 | Client Navigation | `audit-x1`, `x1-client-navigation` | `scripts/audit/x1-client-navigation.mjs`, `artifacts/mustasharek/app/(client)/_layout.tsx`, dashboard/services/consultations/offers/memo/active-case/document-center routes | No PR found for current branch | 🟡 Audit active |
| X/2 | Client Services | consultation / active-case / document-center screens | `artifacts/mustasharek/app/(client)/active-case.tsx`, service/consultation routes | T01/S02 streams | 🟡 Audit |
| X/3 | Client Actions | action handlers across client routes | Client app + API routes | T01/S01/S02 | 🟡 Audit |
| X/4 | Client D02 / Design | D02 UI normalization | `docs/design/D02-DESIGN-SYSTEM.md`, `docs/design/D02-02-AUDIT.md` | No PR found for current branch | 🟡 Audit / alignment |
| X/5 | Client Security | `x1-document-security` | `scripts/audit/x1-document-security.mjs`; print-data/print-export authorization coverage | T01-08 PR #25 / security commit lineage | 🟢 Gate defined |
| X/6 | Admin Relationship | operational/admin visibility | Admin dashboard + API | T02/S02 | 🟡 Audit |
| X/7 | Identity & Access Security | auth registration gate / portal-role enforcement / password recovery | `artifacts/api-server/src/controllers/authRegistrationGate.ts`, `passwordReset.ts`, `routes/auth.ts`, `AuthContext.tsx` | PR #31; PR #28 lineage | 🟡 Security gate |
| Y/1–Y/7 | Lawyer navigation/services/actions/D02/security/admin/I&A | lawyer portal | `artifacts/mustasharek/app/(lawyer)` and API authorization | Existing auth/security PR lineage | 🟡 Audit |
| Y/8 | Office / Staff / Revenue | office/staff/revenue architecture | schema/admin/API areas; architecture is roadmap-level | No dedicated implementation PR identified | 🟡 Architecture audit |
| Z/1–Z/7 | Admin navigation/monitoring/actions/reports/security/RBAC/Super Admin | Admin Dashboard | `artifacts/admin-dashboard/**` | PR #5 lineage + current branch changes | 🟡 Audit |
| W/1–W/7 | Cross-system shared navigation/services/actions/D02/security/admin/I&A | shared app/API infrastructure | shared components, auth, notifications, documents | Multiple PRs | 🟡 Audit |
| W/8 | Office ↔ Lawyer Revenue | Revenue Agreement / sharing | architecture-level; no authoritative dedicated implementation found in audited branch | None identified | 🟢 Architecture approved / implementation pending |
| W/9 | Affiliate / Referral | Affiliate / Referral | none | None | ⏸️ Deferred / legal review |

---

# B. UX Rescue Registry

| Roadmap ID | Official name | Legacy / repository name | Evidence | Status |
|---|---|---|---|---|
| UX-A | Frontend Information Architecture & Role Alignment | audit/foundation work | X/1 and role-boundary tests | 🟢 Baseline established |
| UX-B | Client Journey | client journey | client routes + T01/S01/S02 | 🟡 Continuing |
| UX-C | Lawyer Journey | lawyer portal journey | lawyer routes | 🟡 Audit |
| UX-D | Role & Permission Alignment | portal-role/auth guards | auth and role checks | 🟡 Security gate |
| UX-E | Visual UX & Design System | D02 | `docs/design/*` | 🟡 D02 stream |
| UX-F | Implementation & Review | implementation gates | CI/tests/review | ⏸️ after audit closure |

---

# C. T01 Registry — Consultation Lifecycle

| Roadmap ID | Official name | Legacy / repository name | Files / PR | Status |
|---|---|---|---|---|
| T01-01 | Create Request | booking/request flow | booking screens/API; PR #17 lineage | ⏳ Review/integration |
| T01-02 | Lawyer Review & Proposal | offer/proposal flow | offer routes/API | ⏳ Review/integration |
| T01-03 | Accept Proposal & Start Service | acceptance/active consultation | `active-case` and consultation routes | ⏳ Review/integration |
| T01-04 | Documents & Reuse | document reuse / consultation docs | document routes/components | ⏳ Review/integration |
| T01-05 | Payment & Proof | payment proof workflow | payment proof schema/controller/routes; PR #15 + security PR #22 | 🔒 Preserved; no rebuild |
| T01-06 | Agency / Delivery / Document Handover | Document Handover | handover controller/routes/schema/security docs | 🔒 Foundation; PR #24 lineage |
| T01-07 | Next T01 stage | historical stage name not yet recovered | must be recovered before advancing | 🟡 Needs Decision |
| T01-08 | Consultation Archive & Printing | Consultation Documentation, Archive & Printing | T01-08 controller/routes/screens/docs; PR #25 / security lineage | 🟡 Near closure |
| T01-09+ | Historical later T01 stages | unknown legacy names | repository/history audit required | 🔎 Needs Decision |

**T01 closure:** integrate T01-01→T01-08, preview, tests, typecheck, CI, security review, final PR, then verify `main`.

---

# D. S01 Registry — Smart Scheduling & Interactive Calendar

| Roadmap ID | Official name | Legacy / repository name | Files / evidence | Status |
|---|---|---|---|---|
| S01-01 | Existing Booking & Scheduling Audit | existing booking/calendar | booking/calendar implementation; PR #17 lineage | 🟡 Audit first |
| S01-02 | Lawyer Availability Model | availability / متاح-مشغول | lawyer availability UI/API | 🟡 Planned |
| S01-03 | Lawyer Interactive Calendar | lawyer agenda/calendar | calendar components | 🟡 Planned |
| S01-04 | Client Booking Calendar | modern booking calendar | client calendar; PR #17 lineage | 🟡 Existing + gap audit |
| S01-05 | Booking Transaction & Double-Booking Protection | booking transaction/security | booking controller + transaction guards | 🟡 Security gate |
| S01-06 | Real-Time Availability | slot state / availability | booking/calendar API | 🟡 Planned |
| S01-07 | Upcoming Consultations | Active/Upcoming | consultation lists/dashboard | 🟡 Planned |
| S01-08 | Timezone & Localization | RTL/LTR/time display | language context + calendar | 🟡 Planned |
| S01-09 | Calendar UX & D02 Integration | modern calendar + D02 | calendar UI + D02 tokens | 🟡 Planned |
| S01-10 | Security & Edge Cases | race/time/payment/cancel guards | booking security tests | 🟡 Planned |
| S01-11 | Tests & Typecheck | booking tests/typecheck | CI/test infrastructure | 🟡 Planned |
| S01-12 | CI & Final QA | CI/final QA | `.github/workflows/*` | 🟡 Planned |
| S01-DATA | Consultation ordering / Active-Upcoming / `scheduled_at` / `created_at` / totals | existing consultation data logic | API/Data layer | 🟡 Must be included in S01 audit |

---

# E. S02 Registry — Legal Representation Lifecycle

| Roadmap ID | Official name | Legacy / repository name | Evidence | Status |
|---|---|---|---|---|
| S02.1 | Request Quote | request/quote | consultation/request flows | 🟡 Planned |
| S02.2 | Lawyer Proposal & 24h Expiry | offer/proposal | offer flow | 🟡 Planned |
| S02.3 | Accept & Pay | acceptance/payment boundary | T01-05 + representation flow | 🟡 Planned; reuse payment |
| S02.4 | Agreement & Electronic Confirmation | agreement/confirmation | no authoritative dedicated implementation identified | 🟡 Planned |
| S02.5 | POA / Court Proof Upload | agency / proof upload | T01-06/document work may overlap | 🟡 Audit before build |
| S02.6 | Active Case Workspace | Active Case | `artifacts/mustasharek/app/(client)/active-case.tsx` and corresponding API | 🟡 Existing; consolidate |
| S02.7 | Milestones & Escrow Release | milestones/escrow | payment/case architecture | 🟡 Planned |
| S02.8 | Admin Monitoring & Intervention | admin monitoring | `artifacts/admin-dashboard/**` | 🟡 Planned |

---

# F. T02 Registry — Dispute & Resolution System

| Roadmap ID | Official name | Legacy / repository name | Evidence | Status |
|---|---|---|---|---|
| T02-01 | Architecture & Data Audit | dispute audit | no dedicated T02 implementation found | ⏳ Not started |
| T02-02 | Dispute Data Model | dispute schema/model | no dedicated T02 implementation found | ⏳ Not started |
| T02-03 | Dispute State Machine | resolution states | no dedicated T02 implementation found | ⏳ Not started |
| T02-04 | Financial Transaction Safety | dispute financial safety | use existing financial security rules; do not duplicate | ⏳ Not started |
| T02-05 | Admin Dispute API | admin dispute API | admin/API foundation exists; dispute endpoints not identified | ⏳ Not started |
| T02-06 | Admin Resolution Controls | admin resolution actions | admin dashboard foundation exists | ⏳ Not started |
| T02-07 | Security & Authorization | RBAC/ownership | existing security layer provides reusable primitives | ⏳ Audit when T02 starts |
| T02-08 | Admin Dashboard UI & Monitoring | Admin Dashboard | `artifacts/admin-dashboard/**` | ⏳ Not started for disputes |
| T02-09 | Tests & Idempotency | security/idempotency tests | existing test infrastructure | ⏳ Not started for T02 |
| T02-10 | Typecheck → CI → Security Review → Merge | standard final gate | `.github/workflows/*` | ⏳ Gate when T02 implemented |

---

# G. D02 Registry — Design System

| Official ID | Official name | Legacy / repository name | Files / evidence | Status |
|---|---|---|---|---|
| D02-01 | Visual Audit & Design Foundation | existing UI audit / D02 foundation | `docs/design/D02-02-AUDIT.md`, `D02-DESIGN-SYSTEM.md` | 🟢 Started; legacy name aligned |
| D02-02 | Turquoise + Gold Brand Identity | brand tokens / existing navy-gold language | `artifacts/mustasharek/constants/colors.ts` | 🟡 Foundation present |
| D02-03 | Tajawal Typography System | Inter/root font legacy | D02 audit documents + app font layer | 🟡 Planned |
| D02-04 | Buttons, Actions & Dropdowns | shared controls | D02 design-system primitives | 🟡 Planned |
| D02.4 | Interactive Controls & Touch Targets | touch-target rules | D02 design-system rules | 🟡 Planned |
| D02-05 | Cards, Forms, Modals & Navigation | shared UI primitives | design system | 🟡 Planned |
| D02.5 | Authentication & Role Selection UX | auth/portal selection UI | auth screens + AuthContext | 🟡 Planned |
| D02-06 | Client / Lawyer / Admin UI Unification | Admin parity / shared tokens | app + admin dashboard | 🟡 Planned |
| D02.6 | Interactive Consultation Controls | consultation controls | consultation screens | 🟡 Planned |
| D02-07 | Print / PDF / Share / Document Actions | T01-08 document UI | document screens + D02 audit | 🟡 Existing + normalize |
| D02.7 | Interactive Status & Availability Controls | متاح/مشغول/status controls | lawyer availability UI | 🟡 Planned |
| D02-08 | RTL, Responsive & Device Compatibility | Internationalization / RTL/LTR | `LanguageContext`, app layouts | 🟡 Planned |
| D02.8 | Consultation Lists, Tabs & Empty States | consultation presentation | client/lawyer consultation screens | 🟡 Planned |
| D02.9 | Consultation Documents & PDF/Print Design | document design layer | T01-08 docs/screens | 🟡 Existing + normalize |
| D02-09 | Full Visual QA | cross-screen visual QA | final D02 validation | ⏳ Pending |
| D02-10 | Typecheck / Tests / CI / Final Review | final D02 gate | CI workflows | ⏳ Pending |
| D02.10 | Home Screen & Lawyer Card UX | client home / LawyerCard | client home + LawyerCard | 🟡 Planned |
| D02.11 | Consultation Counters & List Headers | tabs/counters/headers | consultation screens | 🟡 Planned |
| D02.12 | Support, Alerts & Profile Actions | profile/support/alerts | profile + notification surfaces | 🟡 Planned |
| D02.13 | Trust, Security & Payment Assurance UI | payment/security trust UI | payment screens + D02 audit | 🟡 Planned |

**Legacy alignment note:** the repository's current `D02-02-AUDIT.md` calls itself "Existing UI Audit" and uses a local sequence beginning with brand tokens. The official roadmap keeps `D02-01` as the foundation and uses this registry to reconcile the legacy label without deleting the repository evidence.

---

# H. Upper Phase Registry

| Phase | Official name | Main streams | Status |
|---|---|---|---|
| Phase 2 | UX Rescue & Re-Architecture | UX-A→F, X/Y/Z/W, D02 | 🟡 Active |
| Phase 2.5 | Case & Consultation Experience | T01/S01/S02 | 🟡 Next/active integration |
| Phase 2.6 | Documents & Handover Experience | T01-04/T01-06/T01-08 + D02 | 🟡 Active foundation |
| Phase 2.7 | Financial & Payment Experience | T01-05 + S02 + financial security | 🔒 Payment preserved; security gate continues |
| Phase 2.8 | Security & Role Boundaries | X/5, X/7, Y/5, Y/7, Z/5-7, W/5-7, T02 security | 🟢/🟡 Continuous security gate |
| Phase 3 | Production Readiness | E + all final gates | ⏸️ Later |

---

# I. E Registry — Engineering / Delivery (newly added from audit)

| Roadmap ID | Official name | Legacy / repository name | Files | PR | Status |
|---|---|---|---|---|---|
| E/1 | CI / Workflow Infrastructure | GitHub Actions workflows | `.github/workflows/ci.yml`, `audit-x1.yml`, T01 security workflows | multiple | 🟡 Active |
| E/2 | Test & Audit Harnesses | X1 audit scripts / smoke tests | `scripts/audit/*`, test scripts | no dedicated current PR | 🟡 Active |
| E/3 | Development Environment | Codespaces / Replit integration | `docker-compose.codespaces.yml`, `scripts/codespaces-*`, artifact metadata | no dedicated current PR | 🟡 Added to map |
| E/4 | Production Database Safety | production DB guard / lockdown | security guard scripts/docs from audit lineage | PR #20 / #21 / #29 lineage | 🟢 Security foundation |
| E/5 | Dependency / Build / Runtime Safety | Expo/Node/dependency CI hardening | CI/build scripts, package/lock changes | security/CI lineage | 🟡 Active |
| E/6 | Release Gates & Verification | typecheck/tests/CI/review/verify-main | workflow + gate docs | all functional PRs | 🟡 Continuous |

---

# J. Branch audit findings — `codex/audit-x-1-client-navigation`

### Confirmed in-map work

1. **X/1** route inventory, dashboard, bottom navigation, notification Bell, Document Center decision, and route-entry tests.
2. **X/5** cross-client document print security test coverage for `print-data` and `print-export`.
3. **X/7 / W/7** authentication and portal-role security hardening.
4. **D02** visual foundation, turquoise/gold direction, Tajawal direction, RTL/LTR, shared interaction primitives, and admin parity.
5. **T01-06** Document Handover security lineage.
6. **T01-08** Consultation Archive & Printing security lineage.
7. **T01-05** payment security lineage remains protected and is not rebuilt.
8. **Active Case** belongs to X/2 and S02.6/Phase 2.5 rather than becoming a separate untracked feature.

### Genuine out-of-map work added as E

1. Codespaces development environment files.
2. CI/audit workflow infrastructure as a cross-cutting delivery stream.
3. Production DB mutation guards / lockdown safety.
4. Build/dependency/runtime safety checks.
5. Release/test harness infrastructure.

### Items explicitly **not** treated as new product streams

- Authentication/password recovery: mapped to X/7/Y/7/W/7 and Phase 2.8.
- Active Case: mapped to X/2 + S02.6 + Phase 2.5.
- Print/PDF/export: mapped to X/3/X/5 + T01-08 + D02-07/D02.9.
- Calendar: mapped to S01, not a new standalone stream.
- Admin monitoring: mapped to Z + T02/S02.8, not a new Admin product.

---

# K. Final authority

When a repository name conflicts with this registry:

```text
Official Roadmap ID
        ↓
ROADMAP-REGISTRY alignment
        ↓
Repository / Legacy name
        ↓
Actual files + PR evidence
        ↓
Status / gate
```

The roadmap is the planning authority; the repository and PR history remain the implementation evidence.
