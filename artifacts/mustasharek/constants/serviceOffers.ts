import type { ServiceKind } from "./serviceDesign";

export type UnifiedOfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

export type UnifiedOffer = {
  id: string;
  service: ServiceKind;
  status: UnifiedOfferStatus;
  currency: string;
  totalAmount: number;
  title: string;
  scope: string[];
  stages?: Array<{ title: string; amount: number }>;
};

export const OFFER_STATUS_LABELS: Record<UnifiedOfferStatus, string> = {
  draft: "مسودة",
  sent: "مرسل",
  accepted: "مقبول",
  rejected: "مرفوض",
  expired: "منتهي",
};

export const OFFER_LIFECYCLE: UnifiedOfferStatus[] = ["draft", "sent", "accepted", "rejected", "expired"];
