import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";
import type { LawyerIdentityReadDto } from "@/hooks/useLawyerIdentity";

const C = colors.light;

type Props = {
  identity: LawyerIdentityReadDto;
};

export function getLawyerCommandHeaderState(identity: LawyerIdentityReadDto) {
  const verificationStatus = identity.verification?.status ?? null;
  const verificationLabel = verificationStatus === "approved" ? "موثّق" : verificationStatus === "pending" ? "قيد المراجعة" : verificationStatus === "rejected" ? "مرفوض" : "غير متاح";
  const accountLabel = {
    pending: "الحساب قيد المراجعة",
    active: "الحساب نشط",
    suspended: "الحساب موقوف",
    terminated: "الحساب منتهٍ",
    rejected: "الحساب مرفوض",
    blocked: "الحساب محظور",
  }[identity.accountStatus];

  return {
    name: identity.name,
    specialization: identity.specialization || "المحاماة",
    verificationLabel,
    accountLabel,
  };
}

export function LawyerCommandHeader({ identity }: Props) {
  const state = getLawyerCommandHeaderState(identity);
  const verificationStatus = identity.verification?.status ?? null;
  const verificationIcon = verificationStatus === "approved" ? "check-circle" : verificationStatus === "rejected" ? "x-circle" : "clock";

  return (
    <View style={styles.card} accessibilityRole="header">
      <View style={styles.identityRow}>
        <View style={styles.avatar} accessibilityLabel={state.name}>
          <Text style={styles.avatarText}>{state.name.charAt(0) || "؟"}</Text>
        </View>
        <View style={styles.copy}>
          <Text style={styles.eyebrow}>مركز عمل المحامي</Text>
          <Text style={styles.name} numberOfLines={1}>{state.name}</Text>
          <Text style={styles.specialization} numberOfLines={1}>{state.specialization}</Text>
        </View>
      </View>

      <View style={styles.statusRow}>
        <View style={[styles.statusPill, verificationStatus === "approved" ? styles.statusGood : undefined]}>
          <Feather name={verificationIcon as any} size={14} color={verificationStatus === "approved" ? C.success : C.navy} />
          <Text style={styles.statusText}>التحقق: {state.verificationLabel}</Text>
        </View>
        <View style={[styles.statusPill, identity.accountStatus === "active" ? styles.statusGood : undefined]}>
          <Feather name={identity.accountStatus === "active" ? "check" : "alert-circle"} size={14} color={identity.accountStatus === "active" ? C.success : C.warning} />
          <Text style={styles.statusText}>{state.accountLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  identityRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: C.navy, borderWidth: 2, borderColor: C.gold, alignItems: "center", justifyContent: "center" },
  avatarText: { color: "#fff", fontSize: 21, fontFamily: "Inter_700Bold" },
  copy: { flex: 1, alignItems: "flex-end" },
  eyebrow: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_500Medium", marginBottom: 2 },
  name: { fontSize: 19, color: C.foreground, fontFamily: "Inter_700Bold" },
  specialization: { fontSize: 12, color: C.primary, fontFamily: "Inter_500Medium", marginTop: 2 },
  statusRow: { flexDirection: "row-reverse", flexWrap: "wrap", gap: 8, marginTop: 14 },
  statusPill: { flexDirection: "row-reverse", alignItems: "center", gap: 6, backgroundColor: "rgba(26,42,74,0.07)", borderRadius: 999, paddingHorizontal: 10, paddingVertical: 7 },
  statusGood: { backgroundColor: "#ECFDF5" },
  statusText: { fontSize: 11, color: C.foreground, fontFamily: "Inter_600SemiBold" },
});
