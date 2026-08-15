# D02-01 — Visual Design Audit & Design System Foundation

## Status

Canonical implementation for the Mustasharek D02 design-token foundation.

## Purpose

D02-01 centralizes the Mustasharek visual language so new UI does not introduce ad-hoc colors, typography, spacing, radii, shadows, or semantic states.

## Platform rule

The design contract is shared, but the representation is platform-specific:

- **Web:** CSS-compatible dimensions are strings such as `28px`, `16px`, and `12px`.
- **React Native:** dimensions are numeric values such as `28`, `16`, and `12`; shadows use React Native shadow properties.

This prevents CSS units from leaking into React Native while keeping the visual values aligned.

## Canonical implementation

```text
artifacts/mustasharek/theme/tokens.ts
artifacts/mustasharek/theme/tokens.native.ts
```

Expo/Metro platform resolution can consume `tokens.ts` for web and `tokens.native.ts` for native from the same logical import path.

## Token contract

### Brand colors

- Primary 50: `#E6F2F2`
- Primary 100: `#CCE5E5`
- Primary 500: `#008080`
- Primary 700: `#005959`
- Primary 900: `#003333`
- Gold 100: `#F9F3E5`
- Gold 500: `#D4AF37`
- Gold 700: `#997B1A`

### Semantic colors

- Success: `#10B981`
- Warning: `#F59E0B`
- Danger: `#EF4444`
- Info: `#0284C7`

### Neutral colors

- App background: `#F8FAFC`
- Surface: `#FFFFFF`
- Main text: `#0F172A`
- Muted text: `#64748B`
- Border: `#E2E8F0`

### Typography

- Font family: Tajawal
- Display: 28 / 36 / 700
- H1: 22 / 30 / 700
- H2: 18 / 26 / 500
- Body: 15 / 22 / 400
- Caption: 13 / 18 / 400

### Spacing

- xs: 4
- sm: 8
- md: 16
- lg: 24
- xl: 32

### Radius

- sm: 6
- md: 12
- lg: 16
- full: 9999

### Shadows

Web uses CSS box-shadow strings; React Native uses native shadow properties with equivalent intent.

## D02 governance rule

All new Mustasharek UI should consume these D02 tokens or an approved D02 shared component. Direct hard-coded brand values in feature code should be treated as a design-system deviation during visual review.

## Validation path

```text
D02-01
  ↓
Platform token adapters
  ↓
Web / React Native UI
  ↓
Typecheck
  ↓
Tests
  ↓
CI
  ↓
Visual QA
  ↓
PR Review
```
