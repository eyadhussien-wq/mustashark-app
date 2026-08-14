# ROADMAP-REGISTRY

> **Roadmap ID ↔ الاسم الرسمي ↔ الاسم القديم/Legacy ↔ الملفات ↔ PR ↔ الحالة**
>
> Registry target: `codex/audit-x-1-client-navigation` — **not `main`**.

## Rules

- Official IDs are stable.
- Same functional scope keeps the same roadmap symbol: **KEEP**.
- Different repository/legacy name for the same scope: **ALIGN** here; do not duplicate.
- Genuine work outside the map: **ADD** to the roadmap.
- Duplicate functionality: **CONSOLIDATE** around the strongest existing implementation.
- No rebuild of existing functionality unless audit proves a missing/security-critical gap.

---

## 1) Master Audit — X / Y / Z / W

| ID | Official name | Legacy/repo name | Branch evidence | PR | Status |
|---|---|---|---|---|---|
| X/1 | Client Navigation | `audit-x1`, `x1-client-navigation` | `scripts/audit/x1-client-navigation.mjs`, client layouts/routes | — | 🟡 Active |
| X/2 | Client Services | consultation / Active Case / Document Center | client service + case routes | T01/S02 | 🟡 Audit |
| X/3 | Client Actions | route actions | client/API actions | T01/S01/S02 | 🟡 Audit |
| X/4 | Client D02 / Design | D02 UI | `docs/design/*`, color tokens | — | 🟡 Align |
| X/5 | Client Security | `x1-document-security` | `scripts/audit/x1-document-security.mjs` | T01-08 / #25 lineage | 🟢 Gate defined |
| X/6 | Admin Relationship | admin visibility/control | admin dashboard/API | T02/S02 | 🟡 Audit |
| X/7 | Identity & Access Security | auth registration gate / password reset / portal-role enforcement | auth controllers/routes/context | #31 / #28 lineage | 🟡 Security gate |
| Y/1–Y/7 | Lawyer Navigation → I&A | lawyer portal/auth | lawyer routes + auth | existing security lineage | 🟡 Audit |
| Y/8 | Office / Staff / Revenue | office/revenue architecture | schema/admin/API areas | — | 🟡 Architecture |
| Z/1–Z/7 | Admin Navigation → Super Admin | Admin Dashboard | `artifacts/admin-dashboard/**` | #5 lineage | 🟡 Audit |
| W/1–W/7 | Cross-System | shared app/API/auth | shared components/services | multiple | 🟡 Audit |
| W/8 | Office ↔ Lawyer Revenue | Revenue Agreement | architecture-level | — | 🟢 Approved in principle |
| W/9 | Affiliate / Referral | Affiliate | none | — | ⏸️ Deferred / legal review |

---

## 2) UX Rescue — Phase 2

| ID | Official name | Legacy/repo name | Evidence | Status |
|---|---|---|---|---|
| UX-A | Frontend Information Architecture & Role Alignment | audit/foundation | X/1 + role gates | 🟢 Baseline |
| UX-B | Client Journey | client journey | client + T01/S01/S02 | 🟡 Active |
| UX-C | Lawyer Journey | lawyer portal journey | lawyer routes | 🟡 Audit |
| UX-D | Role & Permission Alignment | portal-role/auth guards | auth layer | 🟡 Security gate |
| UX-E | Visual UX & Design System | D02 | `docs/design/*` | 🟡 Active |
| UX-F | Implementation & Review | implementation gates | CI/tests/review | ⏸️ After audit |

---

## 3) T01 — Consultation Lifecycle

| ID | Official name | Legacy/repo name | Files / PR | Status |
|---|---|---|---|---|
| T01-01 | Create Request | booking/request flow | booking routes/screens; #17 lineage | ⏳ Integration |
| T01-02 | Lawyer Review & Proposal | offer/proposal | offer routes/API | ⏳ Integration |
| T01-03 | Accept Proposal & Start Service | acceptance / Active Case | consultation + active-case | ⏳ Integration |
| T01-04 | Documents & Reuse | document reuse | document routes | ⏳ Integration |
| T01-05 | Payment & Proof | payment proof | payment proof controller/schema/routes; #15 + #22 | 🔒 Preserve; no rebuild |
| T01-06 | Agency / Delivery / Document Handover | Document Handover | handover controller/routes/security docs; #24 lineage | 🔒 Foundation |
| T01-07 | Next T01 Stage | historical name unresolved | history audit required | 🟡 Needs Decision |
| T01-08 | Consultation Archive & Printing | Consultation Documentation, Archive & Printing | docs/screens/controller; #25 lineage | 🟡 Near closure |
| T01-09+ | Later T01 stages | historical names unknown | history audit required | 🔎 Needs Decision |

T01 final gate: **integration → Preview → Tests → Typecheck → CI → Security/Review → final PR → verify main**.

---

## 4) S01 — Smart Scheduling & Interactive Calendar

| ID | Official name | Legacy/repo name | Evidence | Status |
|---|---|---|---|---|
| S01-01 | Existing Booking & Scheduling Audit | existing booking/calendar | booking/calendar + #17 lineage | 🟡 Audit first |
| S01-02 | Lawyer Availability Model | availability / متاح-مشغول | lawyer availability | 🟡 Planned |
| S01-03 | Lawyer Interactive Calendar | lawyer agenda | calendar components | 🟡 Planned |
| S01-04 | Client Booking Calendar | modern booking calendar | client calendar | 🟡 Existing + audit |
| S01-05 | Booking Transaction & Double-Booking Protection | booking transaction/security | booking API/transaction guards | 🟡 Security gate |
| S01-06 | Real-Time Availability | slot state | booking/calendar API | 🟡 Planned |
| S01-07 | Upcoming Consultations | Active/Upcoming | consultation lists/dashboard | 🟡 Planned |
| S01-08 | Timezone & Localization | RTL/LTR/time display | LanguageContext/calendar | 🟡 Planned |
| S01-09 | Calendar UX & D02 Integration | modern calendar + D02 | calendar + D02 tokens | 🟡 Planned |
| S01-10 | Security & Edge Cases | race/time/payment/cancel | booking security tests | 🟡 Planned |
| S01-11 | Tests & Typecheck | booking tests | CI/test layer | 🟡 Planned |
| S01-12 | CI & Final QA | final booking QA | `.github/workflows/*` | 🟡 Planned |
| S01-DATA | ordering / Active-Upcoming / `scheduled_at` / `created_at` / totals | consultation data logic | API/Data | 🟡 Included in S01 |

---

## 5) S02 — Legal Representation Lifecycle

| ID | Official name | Legacy/repo name | Evidence | Status |
|---|---|---|---|---|
| S02.1 | Request Quote | request/quote | request flow | 🟡 Planned |
| S02.2 | Lawyer Proposal & 24h Expiry | offer/proposal | offer flow | 🟡 Planned |
| S02.3 | Accept & Pay | acceptance/payment | reuse T01-05 | 🟡 Planned |
| S02.4 | Agreement & Electronic Confirmation | agreement/confirmation | no dedicated authoritative implementation found | 🟡 Planned |
| S02.5 | POA / Court Proof Upload | agency/proof | T01-06 overlap | 🟡 Audit first |
| S02.6 | Active Case Workspace | Active Case | `artifacts/mustasharek/app/(client)/active-case.tsx` | 🟡 Existing; consolidate |
| S02.7 | Milestones & Escrow Release | milestones/escrow | case/payment architecture | 🟡 Planned |
| S02.8 | Admin Monitoring & Intervention | admin monitoring | Admin Dashboard | 🟡 Planned |

---

## 6) T02 — Dispute & Resolution System

| ID | Official name | Legacy/repo name | Evidence | Status |
|---|---|---|---|---|
| T02-01 | Architecture & Data Audit | dispute audit | no dedicated T02 implementation found | ⏳ Not started |
| T02-02 | Dispute Data Model | dispute schema | none found | ⏳ Not started |
| T02-03 | Dispute State Machine | resolution states | none found | ⏳ Not started |
| T02-04 | Financial Transaction Safety | dispute financial safety | reuse financial security rules | ⏳ Not started |
| T02-05 | Admin Dispute API | dispute API | admin/API foundation only | ⏳ Not started |
| T02-06 | Admin Resolution Controls | resolution actions | Admin Dashboard foundation | ⏳ Not started |
| T02-07 | Security & Authorization | RBAC/ownership | existing security primitives | ⏳ Not started |
| T02-08 | Admin Dashboard UI & Monitoring | Admin Dashboard | `artifacts/admin-dashboard/**` | ⏳ Not started |
| T02-09 | Tests & Idempotency | security/idempotency tests | test infrastructure | ⏳ Not started |
| T02-10 | Typecheck → CI → Security Review → Merge | final gate | workflows | ⏳ Not started |

Rule: **T02 adds missing capability only; it does not rebuild existing functionality.**

---

## 7) D02 — Design System & Visual Identity

| ID | Official name | Legacy/repo name | Evidence | Status |
|---|---|---|---|---|
| D02-01 | Visual Audit & Design Foundation | `D02-02-AUDIT.md` = Existing UI Audit | `docs/design/D02-02-AUDIT.md` | 🟢 Started / aligned |
| D02-02 | Turquoise + Gold Brand Identity | brand tokens / navy-gold legacy | `constants/colors.ts` | 🟡 Foundation |
| D02-03 | Tajawal Typography System | Inter/root font legacy | D02 audit + font layer | 🟡 Planned |
| D02-04 | Buttons, Actions & Dropdowns | shared controls | D02 primitives | 🟡 Planned |
| D02.4 | Interactive Controls & Touch Targets | touch targets | D02 rules | 🟡 Planned |
| D02-05 | Cards, Forms, Modals & Navigation | shared UI | D02 primitives | 🟡 Planned |
| D02.5 | Authentication & Role Selection UX | auth/portal UX | auth screens/context | 🟡 Planned |
| D02-06 | Client / Lawyer / Admin UI Unification | Admin parity/shared tokens | app + admin | 🟡 Planned |
| D02.6 | Interactive Consultation Controls | consultation controls | consultation screens | 🟡 Planned |
| D02-07 | Print / PDF / Share / Document Actions | T01-08 document UI | document screens | 🟡 Existing + normalize |
| D02.7 | Interactive Status & Availability Controls | متاح/مشغول | lawyer availability | 🟡 Planned |
| D02-08 | RTL, Responsive & Device Compatibility | i18n/RTL-LTR | `LanguageContext` | 🟡 Planned |
| D02.8 | Consultation Lists, Tabs & Empty States | consultation presentation | consultation screens | 🟡 Planned |
| D02.9 | Consultation Documents & PDF/Print Design | document design layer | T01-08 docs/screens | 🟡 Existing + normalize |
| D02-09 | Full Visual QA | final visual QA | final validation | ⏳ Pending |
| D02-10 | Typecheck / Tests / CI / Final Review | final D02 gate | CI | ⏳ Pending |
| D02.10 | Home Screen & Lawyer Card UX | client home/LawyerCard | client home | 🟡 Planned |
| D02.11 | Consultation Counters & List Headers | counters/headers | consultation screens | 🟡 Planned |
| D02.12 | Support, Alerts & Profile Actions | profile/support/alerts | profile/notifications | 🟡 Planned |
| D02.13 | Trust, Security & Payment Assurance UI | payment/security trust | payment + D02 audit | 🟡 Planned |

**Legacy alignment:** repository `D02-02-AUDIT.md` is evidence for the official `D02-01` foundation; its local implementation sequence is not allowed to renumber the official roadmap.

---

## 8) Upper Development Phases

| Phase | Official name | Streams | Status |
|---|---|---|---|
| Phase 2 | UX Rescue & Re-Architecture | UX-A→F + X/Y/Z/W + D02 | 🟡 Active |
| Phase 2.5 | Case & Consultation Experience | T01/S01/S02 | 🟡 Integration |
| Phase 2.6 | Documents & Handover Experience | T01-04/T01-06/T01-08 + D02 | 🟡 Foundation |
| Phase 2.7 | Financial & Payment Experience | T01-05/S02 + financial security | 🔒 Preserved + gated |
| Phase 2.8 | Security & Role Boundaries | X/Y/Z/W security + T02 | 🟢/🟡 Continuous gate |
| Phase 3 | Production Readiness | E + final gates | ⏸️ Later |

---

## 9) E — Engineering / Delivery (ADDED FROM BRANCH AUDIT)

| ID | Official name | Legacy/repo name | Files | PR | Status |
|---|---|---|---|---|---|
| E/1 | CI / Workflow Infrastructure | GitHub Actions workflows | `.github/workflows/ci.yml`, `audit-x1.yml`, T01 workflows | multiple | 🟡 Active |
| E/2 | Test & Audit Harnesses | X1 audit scripts / smoke tests | `scripts/audit/*`, test harnesses | — | 🟡 Active |
| E/3 | Development Environment | Codespaces / Replit integration | `docker-compose.codespaces.yml`, `scripts/codespaces-*`, artifact metadata | — | 🟢 Added |
| E/4 | Production Database Safety | DB lockdown / mutation guard | security guard/docs lineage | #20/#21/#29 lineage | 🟢 Foundation |
| E/5 | Dependency / Build / Runtime Safety | Expo/Node/dependency CI hardening | CI/package/lock/build checks | CI/security lineage | 🟡 Active |
| E/6 | Release Gates & Verification | typecheck/tests/CI/review/verify-main | workflows | all functional PRs | 🟡 Continuous |

**Why E was added:** these are genuine cross-cutting engineering/delivery capabilities found on the audited branch that are not Client, Lawyer, Admin, or Cross-System product functionality. They are now explicitly mapped instead of being treated as unexplained drift.

---

## 10) Branch audit conclusion

### Inside the roadmap — KEEP / ALIGN

- X/1 route inventory and navigation tests.
- X/5 document print security tests.
- X/7/W/7 authentication, registration, password recovery and portal-role security.
- D02 visual foundation and token work.
- T01-06 Document Handover.
- T01-08 Archive & Printing.
- T01-05 payment security (preserved, no rebuild).
- Active Case → X/2 + S02.6 + Phase 2.5.
- Calendar → S01, not a new standalone stream.
- Admin monitoring → Z + S02.8/T02, not a separate product stream.

### Outside the previous map — ADD as E

- CI/workflow infrastructure.
- X1/test/audit harness infrastructure.
- Codespaces/development-environment support.
- Production DB mutation/lockdown guards.
- Dependency/build/runtime safety.
- Release/verification infrastructure.

### Final rule

```text
X / Y / Z / W = Master Audit
T01 / S01 / S02 / T02 = Functional Lifecycles
D02 = Design System & Visual Identity
E = Engineering / Delivery
Phase 2.5 → 2.6 → 2.7 → 2.8 → Phase 3 = Upper Development Phases
```
