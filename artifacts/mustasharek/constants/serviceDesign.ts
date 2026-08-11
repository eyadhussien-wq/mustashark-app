export type ServiceKind = "consultation" | "memo" | "representation";

export const SERVICE_DESIGN: Record<ServiceKind, {
  label: string;
  shortLabel: string;
  icon: "message-circle" | "file-text" | "briefcase";
  description: string;
  accent: string;
  light: string;
}> = {
  consultation: {
    label: "استشارة قانونية",
    shortLabel: "استشارة",
    icon: "message-circle",
    description: "تواصل مباشر مع محامٍ متخصص للحصول على رأي قانوني.",
    accent: "#1B3A6B",
    light: "#EEF2F8",
  },
  memo: {
    label: "كتابة مذكرة قانونية",
    shortLabel: "مذكرة",
    icon: "file-text",
    description: "صياغة مذكرة قانونية رسمية دون توكيل أو حضور المحامي.",
    accent: "#9A6700",
    light: "#FFF4CE",
  },
  representation: {
    label: "توكيل وتمثيل قانوني",
    shortLabel: "توكيل",
    icon: "briefcase",
    description: "طلب عرض أتعاب للتوكيل والتمثيل القانوني وإدارة مراحل القضية.",
    accent: "#6B3F8F",
    light: "#F3EAF8",
  },
};

export const DOCUMENT_ACTIONS_BY_ROLE = {
  client: { view: true, pdf: true, print: true, share: true, verify: true, archive: false },
  lawyer: { view: true, pdf: true, print: true, share: true, verify: true, archive: true },
  admin: { view: true, pdf: true, print: true, share: false, verify: true, archive: true },
} as const;
