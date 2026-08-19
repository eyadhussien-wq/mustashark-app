# D02-02 — Existing UI Audit

## Scope

This audit reviews the existing Mustasharek UI on the D02 branch and separates existing work that should be preserved from visual normalization and functional work that belongs to S/T streams.

**Rule:** do not rebuild completed flows. D02 is a controlled normalization pass.

## Findings

### Brand
- Existing centralized color tokens are already in place.
- Current visual language leans navy/gold.
- D02 should promote **turquoise + gold** as the primary brand identity derived from the logo, with navy retained as a supporting surface/depth color.
- Semantic success/warning/error colors remain semantic and are not replaced by brand colors.

### Typography
- The app currently uses Inter in the root/font layer and several screens.
- Approved D02 direction is **Tajawal** as the primary Arabic typeface, with platform-safe fallbacks.
- Change the shared typography/font-loading layer first, then migrate screens without changing business behavior.

### RTL / LTR
- `LanguageContext` already provides language state, RTL/LTR direction, alignment, opposite alignment, row direction, and persistence.
- Preserve it; harden component usage toward logical start/end positioning rather than rebuilding the language workflow.

### Login
- Existing login flow and the approved placement of sign-up/forgot-password actions should be preserved.
- D02 scope is typography, touch targets, spacing, icon alignment, and turquoise/gold treatment only.

### Client home / lawyer discovery
- Existing client home already contains discovery/search/filter structure and consultation-oriented cards.
- `LawyerCard` is already clickable and exposes availability, verification, rating, experience, and price.
- D02 scope is hierarchy, CTA discoverability, avatar treatment, typography, spacing, and status styling—not rebuilding discovery.

### Lawyer availability
- `متاح / مشغول` already exists visually.
- D02 should make the control visually discoverable where functionality exists.
- Authoritative availability state, persistence, search visibility, concurrency, and live behavior belong to S/T.
- Any operational monitoring/override belongs in Admin Dashboard.

### Consultations
- Client and lawyer consultation surfaces already exist.
- D02 should normalize tabs, counters, badges, dates, empty states, spacing, and status colors.
- Date-based active/archive filtering and authoritative server-time behavior belong to S/T, not visual-only D02 work.

### Profile / support
- Profile already contains profile access, language switching, support entry, account deletion, and logout.
- D02 should normalize section cards, typography, icons, spacing, and destructive-action treatment.
- Technical secrets, environment variables, stack traces, and developer diagnostics must never appear in end-user UI.
- Support configuration/health requiring operational monitoring should have an Admin surface.

### Payment / security trust UI
- Existing payment UI already contains payment methods, card fields, escrow explanation, security messaging, and a payment CTA.
- D02 should unify the trust/security presentation visually.
- Claims such as PCI-DSS certification or tokenized card storage must only be shown when the real production architecture supports them; real payment/security behavior belongs to S/T.

### Documents / PDF
- A document design layer already exists.
- D02 should align its visual tokens with the shared brand/typography system.
- Page-break correctness, A4 generation, attachment rendering, and PDF behavior belong to the relevant technical stream.

### Alerts / notifications / security states
Establish one visual language for:
- informational notices
- warnings
- security alerts
- payment trust notices
- authorization errors
- safe user-facing errors
- success confirmations
- loading/empty states

Operational/security events that require investigation, override, audit, or monitoring must have an Admin Dashboard surface.

## Implementation order after D02-02

1. D02-03 — Brand tokens: turquoise/gold foundation
2. D02-04 — Tajawal typography system
3. D02-05 — Shared buttons, inputs, cards, spacing, radius, elevation, touch targets
4. D02-06 — Headers, navigation, dropdowns and menus
5. D02-07 — Cards, status controls and consultation presentation
6. D02-08 — Alerts, security and payment-trust presentation
7. D02-09 — Profile, support and settings
8. D02-10 — Admin visual parity
9. D02-11 — Cross-screen consistency audit
10. D02-12 — Final D02 validation

## D02-02 conclusion

The application has a substantial existing UI foundation. The correct strategy is to **normalize and unify what exists**, not rebuild it. Functional gaps discovered during visual work must be routed to the appropriate S/T workstream, and every operationally controllable feature must be considered for Admin Dashboard monitoring/control.
