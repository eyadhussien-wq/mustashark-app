# Mustashark — D02 ↔ Build Roadmap Crosswalk

## Purpose

D02 is not a late visual-polish step. It is the **design foundation attached to every user-facing build stage**.

The complete surface-level inventory is maintained in:

`docs/design/D02-SURFACE-MASTER-MAP.md`

That document is the canonical screen/surface expansion for Client, Lawyer/N1, Admin, Shared surfaces and all current/future lifecycle families.

Rule:

```text
Build Stage / Roadmap ID
→ User Surface
→ D02 foundation
→ UI states
→ RTL/i18n/device behavior
→ Accessibility
→ Security/financial messaging presentation
→ Visual QA
```

A functional roadmap item that exposes a user interface must declare its D02 dependency before implementation closure.

## 01 — Canonical D02 foundation

| D02 ID | Design responsibility |
|---|---|
| D02-01 | Visual audit, information architecture and screen/surface inventory |
| D02-02 | Mustashark brand identity, logo, color tokens and semantic colors |
| D02-03 | Typography, Tajawal, hierarchy and Arabic/English text behavior |
| D02-04 | Buttons, primary/secondary/destructive actions and interaction states |
| D02-05 | Cards, forms, inputs, navigation, lists, menus and common surfaces |
| D02-06 | Role-based UI unification: Client / Lawyer / Admin |
| D02-07 | Documents, PDF, print, share and court/client-meeting presentation |
| D02-08 | RTL/LTR, localization, responsive behavior and mobile/tablet/desktop |
| D02-09 | Visual QA, interaction QA, accessibility and regression review |
| D02-10 | Design-system tests, CI and final design verification |

## 02 — Canonical surface coverage

D02 coverage is now mandatory across the complete application surface inventory:

- Client surfaces: authentication, onboarding, home, profile, discovery, consultation, proposal, scheduling, payment presentation, workspace, documents, messages, notifications, history, cancellation, refund, transfer, representation and disputes.
- Lawyer/N1 surfaces: the complete `N1.01–N1.40 Mustashark Lawyer Digital Office`, including dashboard/command center, clients, intake, consultations, workbench, memoranda, documents, matters, courtroom mode, meeting mode, financial center, reconciliation, BI, tasks, notifications, search, templates, profile, availability, archive, security, mobile/desktop modes, office/firma settings and future integrations.
- Admin surfaces: authentication, command center, users, lawyer verification, consultation operations, scheduling, disputes, financial/reconciliation, documents, audit/security, reports and settings.
- Shared surfaces: navigation, search, notifications, documents, payments/status presentation, consent, conflict/error/unauthorized states, support, RTL/i18n/accessibility.

For the full row-by-row mapping use `docs/design/D02-SURFACE-MASTER-MAP.md`.

## 03 — Client surface family X

Every client-facing build item is D02-bound. The detailed baseline remains:

| Build surface | Roadmap/lifecycle | Required D02 mapping |
|---|---|---|
| Client login / sign-in | X/7 + Auth foundation | D02-01,02,03,04,05,06,08,09 |
| Client registration / onboarding | X/7 | D02-01,02,03,04,05,06,08,09 |
| Client home / command surface | X/1, X/2 | D02-01,02,03,05,06,08,09 |
| Client profile / account | X/7 | D02-01,03,05,06,08,09 |
| Lawyer discovery / profile | X/2 + T01 | D02-01,02,03,05,06,08,09 |
| Consultation request | X/2, X/3 + T01-01 | D02-03,04,05,08,09 |
| Proposal review / acceptance | X/2, X/3 + T01-02/03 | D02-04,05,06,08,09 |
| Scheduling / calendar / booking | S01 | D02-01,03,04,05,08,09 |
| Payment / payment proof presentation | T01-05 | D02-04,05,08,09; financial/security messaging must follow C3 |
| Consultation workspace | T01 | D02-01,03,05,06,08,09 |
| Documents / upload / preview | T01-04/06 + D02-07 | D02-04,05,07,08,09 |
| Client messages / communication | X/2/X/3 + T01 | D02-03,04,05,08,09 |
| Client history / archive | X/2 | D02-01,03,05,07,08,09 |
| Refund / cancellation / transfer presentation | C-stage + T01/S01 | D02-04,05,08,09; semantics governed by C3 |

## 04 — Lawyer surface family Y / N1

All N1 capabilities are D02-bound. N1 defines **what the Lawyer Digital Office does**; D02 defines **how every visible surface behaves and looks**.

The complete N1.01–N1.40 surface-by-surface mapping is maintained in `D02-SURFACE-MASTER-MAP.md`.

## 05 — Functional lifecycle D02 mapping

### T01 — Consultation
Every visible T01 step is D02-bound.

### S01 — Smart Scheduling
Calendar, availability, booking, upcoming consultations, timezone and conflict states are D02-bound.

### S02 — Legal Representation
Quote → proposal → acceptance → agreement/consent → POA/court proof → active matter → closure is D02-bound; legal documents and court presentation use D02-07.

### T02 — Dispute / Resolution
All visible dispute states use D02 semantic alerts, status indicators, destructive-action confirmation and deterministic presentation.

### S03 — Real Estate Opportunities
Catalog/detail UI is D02-bound; D02 does not authorize or imply investment claims.

### S04/S05/Future services
Any future user-facing surface must declare D02 mapping before implementation.

## 06 — Cross-system X/Y/Z/W D02 rule

- **X/4 = Client D02 foundation**: every client-facing surface.
- **Y/4 = Lawyer D02 foundation**: every lawyer-facing surface and N1 mode.
- **Z/4 = Admin D02 foundation**: every admin-facing operational surface.
- **W/4 = Cross-system D02 foundation**: shared surfaces crossing Client/Lawyer/Admin.

D02-06 is mandatory whenever a surface is role-specific.

## 07 — State-specific design requirement

Every stateful UI must define visual treatment for at least:

`idle → loading → success → empty → error → disabled → pressed → pending → conflict → unauthorized`

Financial/legal/security-sensitive surfaces additionally define:

`held → released → refunded → disputed → cancelled → reconciliation mismatch`

The UI state is presentation only; authoritative state remains the backend/data model and applicable C3 controls.

## 08 — Build closure rule

A user-facing roadmap item cannot be `CLOSED / VERIFIED` until:

1. functional evidence exists;
2. its D02 mapping is declared;
3. required D02 primitives are reused rather than duplicated;
4. RTL/LTR and device behavior are verified;
5. accessibility and security-sensitive messaging are reviewed;
6. visual regression/QA evidence exists;
7. CI and final verification pass.

## 09 — Traceability record

```text
Roadmap ID
→ X/Y/Z/W placement
→ N1 placement if applicable
→ T/S lifecycle placement
→ C3 dependency if financial/legal
→ D02-01…D02-10 mapping
→ Domain/Data/State/Security
→ Repository files
→ UI components
→ Tests
→ CI
→ Visual QA
→ Verify Main
```

This crosswalk and `D02-SURFACE-MASTER-MAP.md` together form the canonical bridge between **what Mustashark builds** and **how every surface presents and behaves**.
