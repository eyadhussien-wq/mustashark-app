import type { Feather } from "@expo/vector-icons";

export type NotificationSeverity = "info" | "action" | "deadline" | "critical";
export type NotificationCategory =
  | "offers"
  | "payments"
  | "documents"
  | "handover"
  | "agreement"
  | "consultations"
  | "milestones"
  | "bank"
  | "system";

export const NOTIFICATION_SEVERITY = {
  info: { icon: "info" as keyof typeof Feather.glyphMap, label: "معلومة", background: "#EEF2F8", foreground: "#17365D" },
  action: { icon: "check-circle" as keyof typeof Feather.glyphMap, label: "إجراء مطلوب", background: "#F8F1D9", foreground: "#17365D" },
  deadline: { icon: "clock" as keyof typeof Feather.glyphMap, label: "موعد / مهلة", background: "#FFF4CE", foreground: "#9A6700" },
  critical: { icon: "alert-octagon" as keyof typeof Feather.glyphMap, label: "تنبيه حرج", background: "#FDECEC", foreground: "#B42318" },
} as const;

export const NOTIFICATION_CATEGORY = {
  offers: { icon: "file-text" as keyof typeof Feather.glyphMap, label: "العروض" },
  payments: { icon: "credit-card" as keyof typeof Feather.glyphMap, label: "المدفوعات" },
  documents: { icon: "file" as keyof typeof Feather.glyphMap, label: "المستندات" },
  handover: { icon: "package" as keyof typeof Feather.glyphMap, label: "تسليم المستندات" },
  agreement: { icon: "edit-3" as keyof typeof Feather.glyphMap, label: "الاتفاقيات" },
  consultations: { icon: "message-square" as keyof typeof Feather.glyphMap, label: "الاستشارات" },
  milestones: { icon: "flag" as keyof typeof Feather.glyphMap, label: "المراحل" },
  bank: { icon: "briefcase" as keyof typeof Feather.glyphMap, label: "الحساب البنكي" },
  system: { icon: "shield" as keyof typeof Feather.glyphMap, label: "النظام" },
} as const;

export const NOTIFICATION_BELL = {
  icon: "bell" as keyof typeof Feather.glyphMap,
  activeIcon: "bell" as keyof typeof Feather.glyphMap,
  badgeBackground: "#B42318",
  badgeForeground: "#FFFFFF",
  placement: "top-right-header",
  rule: "يبقى الجرس ثابتًا في رأس الشاشة، ويظهر عداد صغير فقط عند وجود تنبيهات غير مقروءة.",
} as const;
