/**
 * D02-01 — Mustasharek Design System Foundation (Web)
 *
 * Web/CSS-facing tokens intentionally keep CSS units as strings.
 * React Native consumes the sibling `tokens.native.ts` adapter, where
 * dimensions are numeric values as required by React Native styles.
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
    fontFamily: "'Tajawal', sans-serif",
    sizes: {
      display: { fontSize: '28px', lineHeight: '36px', fontWeight: '700' },
      h1: { fontSize: '22px', lineHeight: '30px', fontWeight: '700' },
      h2: { fontSize: '18px', lineHeight: '26px', fontWeight: '500' },
      body: { fontSize: '15px', lineHeight: '22px', fontWeight: '400' },
      caption: { fontSize: '13px', lineHeight: '18px', fontWeight: '400' },
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '6px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
  shadows: {
    card: '0px 2px 8px rgba(15, 23, 42, 0.06)',
    modal: '0px 12px 32px rgba(15, 23, 42, 0.16)',
  },
} as const;

export type MustasharekTokens = typeof mustasharekTokens;
