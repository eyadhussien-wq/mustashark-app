# Mustashark — D02 ↔ Build Roadmap Crosswalk

## Purpose

D02 is the mandatory design foundation attached to every user-facing build stage. The integration/control layer is now `docs/architecture/MAP-X-CROSS-MAP-INTEGRATION.md`.

Rule:

```text
Build Stage / Roadmap ID
→ MAP-X intersection
→ User Surface
→ D02 foundation
→ UI states
→ RTL/i18n/device behavior
→ Accessibility
→ Security/financial messaging presentation
→ Visual QA
→ Tests / CI
→ Verify Main
```

A functional roadmap item that exposes a user interface must declare its D02 dependency and MAP-X intersection before implementation closure.

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

D02 coverage is mandatory across Client, Lawyer/N1, Admin and Shared surfaces. The full row-by-row surface map is maintained in `docs/design/D02-SURFACE-MASTER-MAP.md`.

## 03 — MAP-X integration rule

D02 remains the design authority for visible behavior. `MAP-X-CROSS-MAP-INTEGRATION.md` is the control plane that connects D02 with role maps, lifecycle maps, N1, C3, domain/data/security and repository evidence.

No D02 item is considered closed until its MAP-X trace exists.

## 04 — Client surface family X

Every client-facing build item is D02-bound and MAP-X-bound: authentication, onboarding, home, profile, discovery, consultation, proposals, scheduling, payment presentation, consultation workspace, documents, messages, notifications, history, cancellation, refund, transfer, representation and disputes.

## 05 — Lawyer surface family Y / N1

All N1 capabilities are D02-bound. N1 defines **what the Lawyer Digital Office does**; D02 defines **how every visible surface behaves and looks**; MAP-X binds both to lifecycle, security, data and verification.

The complete N1.01–N1.40 mapping is maintained in `D02-SURFACE-MASTER-MAP.md` and `docs/roadmap/N1-LAWYER-DIGITAL-OFFICE.md`.

## 06 — Functional lifecycle D02 mapping

T01 Consultation, S01 Smart Scheduling, S02 Legal Representation, T02 Dispute/Resolution, S03 Real Estate Opportunities and future S04/S05 services are D02-bound. Financial/legal lifecycle behavior additionally requires C3 mapping.

## 07 — Cross-system X/Y/Z/W D02 rule

- X/4 = Client D02 foundation.
- Y/4 = Lawyer D02 foundation.
- Z/4 = Admin D02 foundation.
- W/4 = Cross-system D02 foundation.

D02-06 is mandatory whenever a surface is role-specific.

## 08 — State-specific design requirement

Every stateful UI must define visual treatment for:

`idle → loading → success → empty → error → disabled → pressed → pending → conflict → unauthorized`

Financial/legal/security-sensitive surfaces additionally define applicable domain states such as:

`held → released → refunded → disputed → cancelled → reconciliation mismatch → blocked → under review`

The UI state is presentation only; authoritative state remains the backend/data/state model and applicable C3 controls.

## 09 — Build closure rule

A user-facing roadmap item cannot be `CLOSED / VERIFIED` until:

1. functional evidence exists;
2. MAP-X intersection is registered;
3. D02 mapping is declared;
4. required D02 primitives are reused;
5. RTL/LTR and device behavior are verified;
6. accessibility and security-sensitive messaging are reviewed;
7. visual regression/QA evidence exists;
8. CI and final verification pass;
9. final diff audit and Verify Main are complete.

## 10 — Traceability record

```text
Roadmap ID
→ MAP-X ID
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

This crosswalk remains the canonical D02 bridge; MAP-X provides the cross-map control plane.