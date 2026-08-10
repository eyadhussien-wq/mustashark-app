export const ROLE_UI = {
  client: {
    label: "عميل",
    icon: "👤",
    color: "#2563EB",
    background: "#EFF6FF",
  },
  lawyer: {
    label: "محامٍ",
    icon: "⚖️",
    color: "#059669",
    background: "#ECFDF5",
  },
  admin: {
    label: "إدارة",
    icon: "🛡️",
    color: "#7C3AED",
    background: "#F5F3FF",
  },
} as const;

export type SupportedRole = keyof typeof ROLE_UI;
