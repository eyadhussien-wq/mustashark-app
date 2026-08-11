import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { SERVICE_DESIGN, type ServiceKind } from "@/constants/serviceDesign";

const C = colors.light;
export type OfferStatus = "draft" | "sent" | "accepted" | "rejected" | "expired";

const statusLabel: Record<OfferStatus, string> = {
  draft: "مسودة",
  sent: "مرسل",
  accepted: "مقبول",
  rejected: "مرفوض",
  expired: "منتهي",
};

export function UnifiedServiceOfferCard({
  kind,
  status,
  amount,
  currency = "QAR",
  title,
  onPress,
}: {
  kind: ServiceKind;
  status: OfferStatus;
  amount: number;
  currency?: string;
  title?: string;
  onPress?: () => void;
}) {
  const service = SERVICE_DESIGN[kind];
  const body = (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.icon, { backgroundColor: service.light }]}>
          <Feather name={service.icon} size={19} color={service.accent} />
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>{service.shortLabel}</Text>
          <Text style={styles.title}>{title ?? service.label}</Text>
        </View>
        <View style={[styles.status, { backgroundColor: status === "accepted" ? "#E8F5EC" : service.light }]}>
          <Text style={[styles.statusText, { color: status === "accepted" ? "#287A43" : service.accent }]}>{statusLabel[status]}</Text>
        </View>
      </View>
      <View style={styles.divider} />
      <View style={styles.bottom}>
        <View>
          <Text style={styles.amountLabel}>قيمة العرض</Text>
          <Text style={styles.amount}>{amount.toLocaleString()} <Text style={styles.currency}>{currency}</Text></Text>
        </View>
        <View style={styles.scope}>
          <Feather name="check-circle" size={14} color={C.gold} />
          <Text style={styles.scopeText}>{kind === "representation" ? "أتعاب + مراحل القضية" : kind === "memo" ? "سعر مستقل + تسليم" : "أتعاب الاستشارة"}</Text>
        </View>
      </View>
      {onPress && <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.82}><Text style={styles.actionText}>عرض التفاصيل</Text><Feather name="chevron-left" size={16} color={C.navy} /></TouchableOpacity>}
    </View>
  );
  return onPress ? <TouchableOpacity activeOpacity={0.96} onPress={onPress}>{body}</TouchableOpacity> : body;
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  top: { flexDirection: "row", alignItems: "center", gap: 10 },
  icon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  copy: { flex: 1, alignItems: "flex-end" },
  eyebrow: { fontSize: 9, color: C.mutedForeground, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  title: { fontSize: 14, color: C.foreground, fontFamily: "Inter_700Bold", marginTop: 2, textAlign: "right" },
  status: { borderRadius: 9, paddingHorizontal: 8, paddingVertical: 5 },
  statusText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 13 },
  bottom: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  amountLabel: { fontSize: 9, color: C.mutedForeground, textAlign: "right", fontFamily: "Inter_400Regular" },
  amount: { fontSize: 18, color: C.navy, fontFamily: "Inter_700Bold", marginTop: 2 },
  currency: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  scope: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  scopeText: { fontSize: 10, color: C.foreground, fontFamily: "Inter_500Medium", textAlign: "right" },
  action: { marginTop: 12, borderTopWidth: 1, borderTopColor: C.border, paddingTop: 11, flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 5 },
  actionText: { fontSize: 11, color: C.navy, fontFamily: "Inter_700Bold" },
});
