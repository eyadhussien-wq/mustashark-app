/**
 * Support configuration — single source of truth.
 *
 * To change the WhatsApp support number without touching any screen code:
 *   1. Set EXPO_PUBLIC_SUPPORT_WHATSAPP env var (e.g. "97455000000" — no + or spaces).
 *   2. Or edit FALLBACK_WHATSAPP below and redeploy.
 *
 * Format: country code + number with NO leading + and NO spaces.
 *   Qatar example : "97455123456"
 *   Jordan example: "96279123456"
 *
 * Admin dashboard tip: Expose this as a runtime env var so the number can be
 * rotated without a code release — just update the secret and restart the server.
 */

const FALLBACK_WHATSAPP = "97455000000"; // ← replace with real support number

export const SUPPORT_CONFIG = {
  /** WhatsApp phone number (digits only, with country code, no +). */
  whatsappNumber:
    process.env.EXPO_PUBLIC_SUPPORT_WHATSAPP?.trim() || FALLBACK_WHATSAPP,

  /** Fallback support e-mail address for ticket submissions. */
  email: process.env.EXPO_PUBLIC_SUPPORT_EMAIL?.trim() || "support@mustasharek.com",
} as const;

/**
 * Build a deep-link URL that opens WhatsApp with a pre-filled message.
 * Works on iOS, Android, and falls back to web.whatsapp.com on desktop.
 */
export function buildWhatsAppUrl(message: string): string {
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${SUPPORT_CONFIG.whatsappNumber}?text=${encoded}`;
}

/** Pre-filled messages indexed by user role. */
export const SUPPORT_MESSAGES = {
  client:
    "مرحباً دعم مستشارك، أنا عميل في التطبيق وأحتاج إلى مساعدة بخصوص...",
  lawyer:
    "مرحباً دعم مستشارك، أنا محامٍ مسجل في المنصة وأحتاج إلى دعم بخصوص...",
  admin:
    "مرحباً دعم مستشارك، أنا من فريق الإدارة وأحتاج إلى مساعدة بخصوص...",
} as const;
