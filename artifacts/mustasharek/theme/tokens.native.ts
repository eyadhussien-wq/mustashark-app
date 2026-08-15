/**
 * D02-01 — Mustasharek Design System Foundation (React Native)
 *
 * React Native-facing adapter for the same canonical D02 values.
 * Dimensions are numeric (no `px`) so they can be consumed directly by
 * React Native style objects. The visual contract remains aligned with the
 * web token set in `tokens.ts`.
 */

export const mustasharekTokens = {
  colors: {
    primary: {
      50: '#E6F2F2',
      100: '#CCE5E5',
      500: '#008080',
      700: '#005959',
      900: '#003333',
    },
    gold: {
      100: '#F9F3E5',
      500: '#D4AF37',
      700: '#997B1A',
    },
    semantic: {
      success: '#10B981',
      warning: '#F59E0B',
      danger: '#EF4444',
      info: '#0284C7',
    },
    neutral: {
      bgApp: '#F8FAFC',
      surface: '#FFFFFF',
      textMain: '#0F172A',
      textMuted: '#64748B',
      border: '#E2E8F0',
    },
  },
  typography: {
    fontFamily: 'Tajawal',
    sizes: {
      display: { fontSize: 28, lineHeight: 36, fontWeight: '700' as const },
      h1: { fontSize: 22, lineHeight: 30, fontWeight: '700' as const },
      h2: { fontSize: 18, lineHeight: 26, fontWeight: '500' as const },
      body: { fontSize: 15, lineHeight: 22, fontWeight: '400' as const },
      caption: { fontSize: 13, lineHeight: 18, fontWeight: '400' as const },
    },
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  radius: {
    sm: 6,
    md: 12,
    lg: 16,
    full: 9999,
  },
  shadows: {
    card: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 2,
    },
    modal: {
      shadowColor: '#0F172A',
      shadowOffset: { width: 0, height: 12 },
      shadowOpacity: 0.16,
      shadowRadius: 32,
      elevation: 12,
    },
  },
} as const;

export type MustasharekTokens = typeof mustasharekTokens;
