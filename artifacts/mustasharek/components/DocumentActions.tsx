import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;
export type DocumentKind = "memo" | "quote" | "agreement" | "payment_receipt" | "milestone" | "case_summary" | "handover" | "international_handover" | "audit" | "bank_proof" | "identity";
export type DocumentRole = "client" | "lawyer" | "admin";
export type DocumentAction = "view" | "pdf" | "print" | "share" | "verify" | "archive";

const ACTION_LABELS: Record<DocumentAction, { label: string; icon: keyof typeof Feather.glyphMap }> = {
  view: { label: "عرض", icon: "eye" },
  pdf: { label: "حفظ PDF", icon: "file-text" },
  print: { label: "طباعة", icon: "printer" },
  share: { label: "مشاركة", icon: "share-2" },
  verify: { label: "تحقق", icon: "check-circle" },
  archive: { label: "أرشفة", icon: "archive" },
};

const ROLE_ACTIONS: Record<DocumentRole, Record<DocumentKind, DocumentAction[]>> = {
  client: {
    memo: ["view", "pdf", "print"], quote: ["view", "pdf", "share"], agreement: ["view", "pdf", "print"], payment_receipt: ["view", "pdf", "print", "share"], milestone: ["view", "pdf"], case_summary: ["view", "pdf", "print"], handover: ["view", "pdf"], international_handover: ["view", "pdf"], audit: ["view", "pdf"], bank_proof: ["view"], identity: ["view"],
  },
  lawyer: {
    memo: ["view", "pdf", "print", "share"], quote: ["view", "pdf", "print", "share"], agreement: ["view", "pdf", "print"], payment_receipt: ["view", "pdf", "print"], milestone: ["view", "pdf", "print"], case_summary: ["view", "pdf", "print"], handover: ["view", "pdf"], international_handover: ["view", "pdf"], audit: ["view", "pdf"], bank_proof: ["view"], identity: ["view"],
  },
  admin: {
    memo: ["view", "pdf", "print", "archive"], quote: ["view", "pdf", "print", "archive"], agreement: ["view", "pdf", "print", "archive"], payment_receipt: ["view", "pdf", "print", "archive"], milestone: ["view", "pdf", "print", "archive"], case_summary: ["view", "pdf", "print", "archive"], handover: ["view", "pdf", "print", "archive"], international_handover: ["view", "pdf", "print", "archive"], audit: ["view", "pdf", "print", "archive"], bank_proof: ["view", "verify", "archive"], identity: ["view", "verify", "archive"],
  },
};

export function getDocumentActions(role: DocumentRole, kind: DocumentKind): DocumentAction[] {
  return ROLE_ACTIONS[role][kind];
}

export function DocumentActions({ role, kind, compact = false, onAction }: { role: DocumentRole; kind: DocumentKind; compact?: boolean; onAction?: (action: DocumentAction) => void }) {
  const actions = getDocumentActions(role, kind);
  return <View style={[styles.row, compact && styles.compactRow]}>{actions.map((action) => { const meta = ACTION_LABELS[action]; return <TouchableOpacity key={action} activeOpacity={0.75} onPress={() => onAction?.(action)} style={[styles.action, compact && styles.compactAction, action === "pdf" && styles.pdfAction]}><Feather name={meta.icon} size={compact ? 14 : 15} color={action === "pdf" ? C.gold : C.primary} /><Text style={[styles.label, compact && styles.compactLabel, action === "pdf" && styles.pdfLabel]}>{meta.label}</Text></TouchableOpacity>; })}</View>;
}

export function DocumentRoleNotice({ role }: { role: DocumentRole }) {
  const text = role === "admin" ? "صلاحيات الإدارة: العرض والطباعة والأرشفة والتحقق حسب نوع المستند." : role === "lawyer" ? "صلاحيات المحامي: المستندات المرتبطة بعملك فقط، مع تنزيل وطباعة ما يلزم للتنفيذ." : "صلاحيات العميل: المستندات الخاصة بك فقط، مع حفظ وطباعة المستندات المسموح بها.";
  return <View style={styles.notice}><Feather name="shield" size={14} color={C.gold} /><Text style={styles.noticeText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 7, marginTop: 10 }, compactRow: { gap: 5, marginTop: 7 },
  action: { minHeight: 34, paddingHorizontal: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card, flexDirection: "row", alignItems: "center", gap: 5 }, compactAction: { minHeight: 29, paddingHorizontal: 8, borderRadius: 8 }, pdfAction: { borderColor: "rgba(201,160,53,0.45)", backgroundColor: "#FFFCF3" }, label: { color: C.primary, fontSize: 11, fontFamily: "Inter_600SemiBold" }, compactLabel: { fontSize: 10 }, pdfLabel: { color: "#8A6B12" },
  notice: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6, padding: 10, borderRadius: 12, backgroundColor: "#F8FAFC", borderWidth: 1, borderColor: C.border, marginTop: 10 }, noticeText: { flex: 1, color: C.mutedForeground, fontSize: 10, lineHeight: 16, fontFamily: "Inter_400Regular", textAlign: "right" },
});
