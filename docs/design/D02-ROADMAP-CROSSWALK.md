# Mustashark — D02 ↔ Build Roadmap Crosswalk

## Purpose

D02 is not a late visual-polish step. It is the **design foundation attached to every user-facing build stage**.

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

## 02 — Client surface family X

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

## 03 — Lawyer surface family Y / N1

All N1 capabilities are D02-bound. N1 defines **what the Lawyer Digital Office does**; D02 defines **how every visible surface behaves and looks**.

| N1 group | Build phase | D02 dependency |
|---|---|---|
| N1.01–N1.02 identity / command center / digital office | Phase 2.5 | D02-01,02,03,05,06,08,09 |
| N1.03–N1.06 clients / intake / consultation / marketplace | Phase 2.5 | D02-01,03,04,05,06,08,09 |
| N1.07–N1.15 workbench / memorandum / documents / matter / court | Phase 2.6 | D02-03,04,05,06,07,08,09 |
| N1.16–N1.18 financial center / BI / reputation | Phase 2.7/3 | D02-04,05,06,08,09; C3 governs financial semantics |
| N1.19–N1.20 tasks / notifications | Phase 2.6 | D02-04,05,06,08,09 |
| N1.21–N1.24 search / AI future / templates / conversion | Phase 3+ | D02-03,04,05,06,08,09 |
| N1.25–N1.27 profile / availability / archive | Phase 2.5–2.6 | D02-01,02,03,05,06,07,08,09 |
| N1.28–N1.29 audit/security/confidentiality | Phase 2.8 | D02-04,05,06,08,09; security messaging |
| N1.30–N1.32 mobile / desktop / courtroom / meeting modes | Phase 2.5–2.6 | D02-01,03,05,07,08,09,10 |
| N1.33–N1.40 future integrations / office / firm / intelligence | Phase 3+ | D02-01,03,05,06,08,09 |

## 04 — Functional lifecycle D02 mapping

### T01 — Consultation

Every visible T01 step is D02-bound:

`T01-01 → T01-02 → T01-03 → T01-04 → T01-05 → T01-06 → T01-07 → T01-08 → T01-09+`

Baseline: `D02-01/02/03/04/05/06/08/09`.

Additional:
- Documents / printing: D02-07
- Payment/security messaging: D02-04/05/09 with C3 semantics

### S01 — Smart Scheduling

`S01-03 → S01-04 → S01-05 → S01-06 → S01-07 → S01-08 → S01-09`

D02-09 is mandatory at S01-09 and D02-10 at closure.

### S02 — Legal Representation

`S02.1 → S02.2 → S02.3 → S02.4 → S02.5 → S02.6 → S02.7 → S02.8`

- Quote/proposal/acceptance: D02-04/05/08/09
- Agreement/consent: D02-03/04/05/08/09
- POA/court proof: D02-07/08/09
- Active case/matter: D02-05/06/07/08/09
- Financial visibility: D02-04/05/09 + C3

### T02 — Dispute / Resolution

Admin and lawyer/client visible states must use D02 semantic alerts, status indicators, destructive-action confirmation and deterministic state presentation.

Baseline: D02-04/05/06/08/09/10.

### S03 — Real Estate Opportunities

Catalog/detail UI: D02-01/02/03/05/08/09. No fabricated financial or investment claims are implied by D02.

### S04 / S05 / future services

Any future user-facing surface must declare D02 mapping before implementation. D02 does not authorize the underlying business, regulatory or data model.

## 05 — Cross-system X/Y/Z/W D02 rule

- **X/4 = Client D02 foundation**: every client-facing surface.
- **Y/4 = Lawyer D02 foundation**: every lawyer-facing surface and N1 mode.
- **Z/4 = Admin D02 foundation**: every admin-facing operational surface.
- **W/4 = Cross-system D02 foundation**: shared surfaces crossing Client/Lawyer/Admin.

D02-06 is mandatory whenever a surface is role-specific.

## 06 — State-specific design requirement

Every stateful UI must define visual treatment for at least:

`idle → loading → success → empty → error → disabled → pressed → pending → conflict → unauthorized`

Financial/legal/security-sensitive surfaces additionally define:

`held → released → refunded → disputed → cancelled → reconciliation mismatch`

The UI state is presentation only; the authoritative state remains the backend/data model and applicable C3 controls.

## 07 — Build closure rule

A user-facing roadmap item cannot be `CLOSED / VERIFIED` until:

1. functional evidence exists;
2. its D02 mapping is declared;
3. required D02 primitives are reused rather than duplicated;
4. RTL/LTR and device behavior are verified;
5. accessibility and security-sensitive messaging are reviewed;
6. visual regression/QA evidence exists;
7. CI and final verification pass.

## 08 — Traceability record

```text
Roadmap ID
→ X/Y/Z/W placement
→ N1 placement if applicable
→ T/S lifecycle placement
→ D02-01…D02-10 mapping
→ Domain/Data/State/Security
→ Repository files
→ UI components
→ Tests
→ CI
→ Visual QA
→ Verify Main
```

This crosswalk is the canonical bridge between **what Mustashark builds** and **how Mustashark presents it**.
