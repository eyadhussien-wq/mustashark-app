import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import type { Consultation, ConsultationStatus } from "@/contexts/DataContext";
import { rateLabel } from "@/utils/currency";

interface Props {
  consultation: Consultation;
  viewAs: "client" | "lawyer";
  onPress?: () => void;
  onAccept?: () => void;
  onReject?: () => void;
}

const C = colors.light;

const STATUS_CONFIG: Record<
  ConsultationStatus,
  { label: string; color: string; bg: string; icon: string }
> = {
  pending: { label: "قيد الانتظار", color: C.warning, bg: "#FEF3C7", icon: "clock" },
  accepted: { label: "مقبولة", color: C.success, bg: "#ECFDF5", icon: "check-circle" },
  rejected: { label: "مرفوضة", color: C.destructive, bg: "#FEE2E2", icon: "x-circle" },
  completed: { label: "مكتملة", color: C.mutedForeground, bg: C.muted, icon: "check" },
};

const TYPE_ICON: Record<string, string> = {
  video: "video",
  chat: "message-square",
  phone: "phone",
};

export function ConsultationCard({ consultation, viewAs, onPress, onAccept, onReject }: Props) {
  const status = STATUS_CONFIG[consultation.status];
  const typeIcon = TYPE_ICON[consultation.type] ?? "help-circle";
  const otherName = viewAs === "client" ? consultation.lawyerName : consultation.clientName;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
      <View style={styles.header}>
        <View style={styles.typeIcon}>
          <Feather name={typeIcon as any} size={16} color={C.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.subject} numberOfLines={1}>{consultation.subject}</Text>
          <Text style={styles.other}>{otherName}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
          <Feather name={status.icon as any} size={11} color={status.color} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>

      <Text style={styles.description} numberOfLines={2}>{consultation.description}</Text>

      <View style={styles.footer}>
        <View style={styles.footerItem}>
          <Feather name="calendar" size={12} color={C.mutedForeground} />
          <Text style={styles.footerText}>{consultation.date}</Text>
        </View>
        <View style={styles.footerItem}>
          <Feather name="clock" size={12} color={C.mutedForeground} />
          <Text style={styles.footerText}>{consultation.time}</Text>
        </View>
        <View style={styles.footerItem}>
          <Feather name="dollar-sign" size={12} color={C.mutedForeground} />
          <Text style={styles.footerText}>{consultation.price} {rateLabel(consultation.lawyerCountry ?? "qatar")}</Text>
        </View>
      </View>

      {viewAs === "lawyer" && consultation.status === "pending" && (
        <View style={styles.actions}>
          <TouchableOpacity style={styles.acceptBtn} onPress={onAccept}>
            <Feather name="check" size={14} color="#fff" />
            <Text style={styles.acceptText}>قبول</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectBtn} onPress={onReject}>
            <Feather name="x" size={14} color={C.destructive} />
            <Text style={styles.rejectText}>رفض</Text>
          </TouchableOpacity>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 8,
  },
  typeIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  subject: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
  },
  other: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  description: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
    marginBottom: 12,
    lineHeight: 20,
    textAlign: "right",
  },
  footer: {
    flexDirection: "row",
    gap: 14,
  },
  footerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  footerText: {
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  actions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  acceptBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: C.success,
    borderRadius: 8,
    paddingVertical: 9,
  },
  acceptText: {
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
  rejectBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FEE2E2",
    borderRadius: 8,
    paddingVertical: 9,
  },
  rejectText: {
    color: C.destructive,
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
  },
});
