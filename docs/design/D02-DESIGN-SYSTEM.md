# D02 — Mustashark Design System Foundation

## Purpose

Establish a shared visual foundation for the existing Mustashark application without rebuilding completed screens. Existing flows and functionality remain authoritative; D02 standardizes presentation and shared UI primitives.

## Brand

- Primary brand identity: turquoise + gold, derived from the Mustashark logo.
- Navy and neutral tones may support hierarchy, contrast, surfaces, and readable content, but must not replace the core turquoise/gold identity.
- Semantic colors (success, warning, error, info) are reserved for meaning and must not be treated as brand colors.

## Typography

- Primary Arabic typeface: Tajawal.
- Use a robust system fallback chain on platforms where Tajawal is unavailable.
- Typography must remain legible at medium and large sizes and preserve hierarchy across mobile, web, and supported device platforms.
- Do not introduce a second Arabic display font without design-system approval.

## Direction and localization

- Arabic UI is RTL.
- English UI is LTR.
- Layout components must not depend on hard-coded left/right assumptions where logical start/end properties are available.
- Language switching must preserve the same visual system while changing content direction and alignment.

## Shared visual primitives

D02 will standardize these primitives before broad screen-by-screen polish:

1. Color tokens
2. Typography scale and weights
3. Spacing scale
4. Corner radius
5. Elevation/shadows
6. Buttons and touch targets
7. Inputs and form controls
8. Cards and list rows
9. Headers and navigation
10. Dropdowns and menus
11. Badges and status indicators
12. Icons
13. Alerts, security notices, and notifications
14. Modal/bottom-sheet surfaces
15. Empty/loading/error states

## Interaction rules

- Primary actions must be visually discoverable and have comfortable touch targets.
- Interactive elements must have clear enabled, disabled, pressed, loading, and error states where applicable.
- Static-looking controls must not hide important actions.
- Destructive or security-sensitive actions require clear semantic treatment and confirmation where appropriate.

## Security and system messaging

Security, payment, authorization, and operational alerts must define both:

- the end-user presentation and timing; and
- the corresponding Admin monitoring/control surface when applicable.

Technical secrets, environment-variable names, stack traces, and developer diagnostics must never be exposed to end users.

## Admin parity

Admin Dashboard keeps its operational information architecture, but shared brand tokens and common interaction patterns should remain compatible with the main application. Any monitoring or control introduced for a client/lawyer feature must be evaluated for an appropriate Admin view.

## Scope rule

D02 modifies presentation and shared UI foundations. It does not recreate completed business flows. Functional gaps discovered during the audit are recorded separately and routed to the appropriate S-series or T-series workstream.
