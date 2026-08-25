# Mustashark — D02 Surface Master Map

## Purpose

This is the canonical surface-level companion to `D02-ROADMAP-CROSSWALK.md`.

**Rule:** every user-facing surface in Mustashark is a D02-governed surface from architecture through implementation and verification. D02 is not post-build decoration.

Canonical trace:

```text
Surface
→ Role
→ Roadmap / Lifecycle ID
→ N1 if Lawyer Product
→ C-stage dependency if financial/legal
→ D02-01…D02-10
→ UI states
→ RTL/LTR + i18n + device behavior
→ Accessibility
→ Security / privacy presentation
→ Visual QA
→ CI
→ Verify Main
```

---

## 01 — Client Surface Family

| Surface | Roadmap / Lifecycle | D02 |
|---|---|---|
| Login / Sign-in | X/7 + Auth | 01/02/03/04/05/06/08/09 |
| Registration / Onboarding | X/7 | 01/02/03/04/05/06/08/09 |
| Client Home / Command Center | X/1/X/2 | 01/02/03/05/06/08/09 |
| Profile / Account / Settings | X/7 | 01/03/05/06/08/09 |
| Lawyer discovery | X/2 + T01 | 01/02/03/05/06/08/09 |
| Lawyer public profile | X/2 + T01 | 01/02/03/05/06/07/08/09 |
| Consultation request | T01-01 | 03/04/05/08/09 |
| Proposal review | T01-02 | 03/04/05/08/09 |
| Proposal acceptance | T01-03 | 04/05/06/08/09 |
| Scheduling / booking | S01 | 01/03/04/05/08/09 |
| Payment presentation | T01-05 + C3 | 04/05/08/09 |
| Consultation workspace | T01 | 01/03/05/06/08/09 |
| Documents / upload / preview | T01-04/06 | 04/05/07/08/09 |
| Messages / communication | T01/X | 03/04/05/08/09 |
| Notifications | T01/S01/S02/T02 | 04/05/08/09 |
| History / archive | X/2 | 01/03/05/07/08/09 |
| Cancel states | C-stage + S01/T01 | 04/05/08/09 + C3 |
| Refund states | C-stage | 04/05/08/09 + C3 |
| Transfer / no-show states | C-stage + T01/S01 | 04/05/08/09 + C3 |
| Legal representation | S02.1–S02.8 | 03/04/05/06/07/08/09 |
| Dispute / resolution | T02 | 04/05/06/08/09/10 |
| Real-estate opportunities | S03 | 01/02/03/05/08/09 |
| Future investment / service discovery | S03/S04+ | 01/03/05/08/09 |

---

## 02 — Lawyer Product Family: N1 — Mustashark Lawyer Digital Office

**N1 is a complete product surface, not a single dashboard page.** Every N1 screen, drawer, modal, workspace, financial view, document view, court mode, mobile mode and future office capability is D02-bound.

| N1 | Lawyer surface | Lifecycle / system | D02 |
|---|---|---|---|
| N1.01 | Lawyer identity, authentication and professional entry | Y/1/Y/7 | 01/02/03/05/06/08/09 |
| N1.02 | Digital Office / Command Center / Dashboard | Y/1/Y/7 | 01/02/03/04/05/06/08/09 |
| N1.03 | Client list / client 360 | Y/2/Y/7 | 01/03/05/06/08/09 |
| N1.04 | Client intake / new matter intake | Y/2 | 01/03/04/05/06/08/09 |
| N1.05 | Consultation inbox / requests | Y/2 + T01 | 01/03/04/05/06/08/09 |
| N1.06 | Marketplace / service opportunities | Y/2 + T01 | 01/02/03/05/06/08/09 |
| N1.07 | Lawyer workbench | Y/3 | 01/03/04/05/06/08/09 |
| N1.08 | Consultation workspace | T01 | 01/03/04/05/06/08/09 |
| N1.09 | Memorandum workspace | Y/3 + S02 | 03/04/05/06/07/08/09 |
| N1.10 | Document center | Y/3/Y/4 | 03/04/05/07/08/09 |
| N1.11 | PDF preview / print / share | Y/4 + court/meeting | 03/05/07/08/09/10 |
| N1.12 | Matter / case workspace | S02 | 03/04/05/06/07/08/09 |
| N1.13 | Court preparation / courtroom mode | S02 | 03/05/07/08/09/10 |
| N1.14 | Client-meeting mode | T01/S02 | 01/03/05/07/08/09 |
| N1.15 | Lawyer-client relationship workspace | T01/S02 | 03/04/05/06/07/08/09 |
| N1.16 | Financial center / entitlement ledger | C3 + Y/8 | 04/05/06/08/09/10 |
| N1.17 | Earnings / settlement / reconciliation view | C3 + W/8 | 04/05/06/08/09/10 |
| N1.18 | Reputation / performance / BI | Y/8 | 01/03/05/06/08/09 |
| N1.19 | Tasks / workflow queue | Y/3 | 03/04/05/06/08/09 |
| N1.20 | Notifications / alerts | W + T/S | 04/05/06/08/09 |
| N1.21 | Global lawyer search | Y/2/Y/3 | 01/03/05/06/08/09 |
| N1.22 | AI-assisted future workspace | Y/3/W | 03/04/05/06/08/09/10 |
| N1.23 | Templates library | Y/3/Y/4 | 03/05/07/08/09 |
| N1.24 | Client conversion / consultation-to-representation flow | T01/S02 | 03/04/05/06/08/09 |
| N1.25 | Public lawyer profile | Y/1/Y/2 | 01/02/03/05/06/07/08/09 |
| N1.26 | Availability / calendar | S01 | 01/03/04/05/08/09 |
| N1.27 | Archive / closed matters | Y/7 | 01/03/05/07/08/09 |
| N1.28 | Audit / activity history | Y/5/Y/7 | 04/05/06/08/09/10 |
| N1.29 | Security / confidentiality / privacy center | Y/5/Y/7 | 04/05/06/08/09/10 |
| N1.30 | Mobile Lawyer Office | Y/1/Y/4 | 01/03/05/07/08/09/10 |
| N1.31 | Desktop Lawyer Office | Y/1/Y/4 | 01/03/05/07/08/09/10 |
| N1.32 | Court + client meeting presentation modes | Y/4 + S02 | 03/05/07/08/09/10 |
| N1.33 | External integrations | W/Y/2 | 01/03/05/06/08/09 |
| N1.34 | Investment future surface | W + S03+ | 01/03/05/08/09 |
| N1.35 | Ecosystem / partner integrations | W | 01/03/05/06/08/09 |
| N1.36 | Office settings | Y/8 | 01/03/04/05/06/08/09 |
| N1.37 | Law-firm / team workspace | Y/8/W | 01/03/04/05/06/08/09/10 |
| N1.38 | Intelligence / analytics center | Y/8/W | 01/03/05/06/08/09/10 |
| N1.39 | Business continuity / recovery surface | W/8 | 04/05/06/08/09/10 |
| N1.40 | Lawyer Digital Office core / platform settings | Y/8/W/8 | 01/03/04/05/06/08/09/10 |

### N1 mandatory design principle

The Lawyer Dashboard (`N1.02`) is the command center, but **not the whole Lawyer Office**. Every linked destination must retain the same D02 design language, navigation hierarchy, permissions presentation, state semantics and responsive behavior.

---

## 03 — Admin Surface Family

Every administrative screen is D02-bound even where it is not customer-facing.

| Admin surface | Placement | D02 |
|---|---|---|
| Admin authentication | Z/7 | 01/02/03/04/05/06/08/09 |
| Admin command center | Z/1 | 01/02/03/05/06/08/09 |
| User management | Z/2 | 03/04/05/06/08/09 |
| Lawyer verification / moderation | Z/2/Z/5 + S05 | 03/04/05/06/08/09/10 |
| Consultation operations | Z/3 + T01 | 03/04/05/06/08/09 |
| Scheduling operations | Z/3 + S01 | 03/04/05/06/08/09 |
| Dispute / resolution operations | Z/5 + T02 | 04/05/06/08/09/10 |
| Financial operations / reconciliation | Z/5/W/8 + C3 | 04/05/06/08/09/10 |
| Documents / moderation | Z/4/Z/5 | 03/05/07/08/09 |
| Audit / security operations | Z/5/Z/7 | 04/05/06/08/09/10 |
| Reports / BI | Z/6 | 01/03/05/06/08/09 |
| System settings | Z/7 | 01/03/04/05/06/08/09 |

---

## 04 — Shared / Cross-System Surfaces

| Shared surface | Cross-system | D02 |
|---|---|---|
| Global navigation | W/4 | 01/02/03/05/06/08/09 |
| Notifications | W | 04/05/06/08/09 |
| Search | W | 01/03/05/06/08/09 |
| Documents | W + T/S | 03/05/07/08/09 |
| Payments / financial status presentation | W + C3 | 04/05/06/08/09/10 |
| Consent / contractual confirmation | W + C3 | 03/04/05/08/09 |
| Error / conflict / unauthorized states | W | 04/05/06/08/09/10 |
| Help / support | W | 01/03/04/05/08/09 |
| Accessibility / RTL / localization | W | 03/08/09/10 |

---

## 05 — Lifecycle Crosswalk

### T01 — Consultation

Every visible step from discovery/request through completion is D02-bound.

### S01 — Smart Scheduling

Calendar, availability, booking, upcoming consultations, timezone and conflict states are D02-bound.

### S02 — Legal Representation

Quote → proposal → acceptance → agreement/consent → POA/court proof → active matter → closure is D02-bound, with D02-07 mandatory for legal documents and court presentation.

### T02 — Dispute / Resolution

All client/lawyer/admin dispute states use D02 semantic states and deterministic presentation.

### S03 — Real Estate Opportunities

Catalog/detail surfaces use D02; investment claims remain governed by their own business/regulatory model.

### S04/S05/Future

No future user-facing feature is exempt: it must declare its D02 mapping before implementation acceptance.

---

## 06 — C3 Financial / Legal Presentation Boundary

D02 controls **presentation**, not financial authority.

Any surface touching Deposit, Fund, Escrow, Release, Refund, Cancel, Transfer, Settlement, Reconciliation, Commission or entitlement ledgers must map to C3 before implementation closure.

Required visual states include, where applicable:

`pending → confirmed → held → released → refunded → cancelled → disputed → reconciliation mismatch → blocked → under review`

The UI must never imply that a database state itself proves legal ownership, custody or external settlement.

---

## 07 — Universal UI State Matrix

Every stateful surface must define:

`idle / loading / success / empty / error / disabled / pressed / pending / conflict / unauthorized`

Legal/financial/security surfaces additionally define the domain states required by their authoritative backend state machine.

---

## 08 — Universal D02 Closure Gate

A user-facing surface cannot be marked `CLOSED / VERIFIED` until:

1. roadmap/lifecycle classification exists;
2. D02 mapping exists;
3. shared D02 primitives are reused;
4. responsive/mobile/tablet/desktop behavior is checked;
5. Arabic RTL and English LTR behavior is checked;
6. accessibility is reviewed;
7. security/privacy-sensitive messaging is reviewed;
8. visual regression evidence exists;
9. tests/typecheck/CI evidence exists;
10. final diff audit and Verify Main are complete.

---

## 09 — Canonical Relationship

```text
MASTER ROADMAP
→ X/Y/Z/W
→ T/S lifecycle
→ N1 Lawyer Product where applicable
→ C3 Financial/Legal Foundation where applicable
→ D02 Design Foundation
→ Repository implementation
→ UI states
→ RTL/i18n/device
→ Accessibility
→ Security/Privacy presentation
→ Visual QA
→ Tests/CI
→ Verify Main
```

This document expands the D02 crosswalk; it does not replace the canonical roadmap or C3 financial/legal authority.
