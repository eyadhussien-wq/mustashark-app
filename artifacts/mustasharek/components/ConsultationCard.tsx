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
  cancelled_by_lawyer: { label: "ملغية (محامي)", color: C.destructive, bg: "#FEE2E2", icon: "x-octagon" },
  cancelled_by_client: { label: "ملغية (عميل)", color: C.destructive, bg: "#FEE2E2", icon: "x-octagon" },
  no_show_lawyer: { label: "تأخر المحامي", color: C.destructive, bg: "#FEE2E2", icon: "alert-triangle" },
  no_show_client: { label: "غياب العميل", color: C.warning, bg: "#FEF3C7", icon: "user-x" },
  disputed: { label: "نزاع", color: "#7C3AED", bg: "#EDE9FE", icon: "alert-circle" },
  refunded_absent: { label: "مسترد (غياب)", color: "#0369A1", bg: "#E0F2FE", icon: "shield" },
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

  const Wrapper = onPress ? TouchableOpacity : View;
  const wrapperProps = onPress ? { onPress, activeOpacity: 0.88 } : {};

  return (
    <Wrapper style={styles.card} {...wrapperProps}>
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
          <View style={styles.pricePill}>
            <Text style={styles.priceText}>{consultation.price} {rateLabel(consultation.lawyerCountry ?? "qatar")}</Text>
          </View>
          {consultation.paymentStatus === "paid" && (
            <View style={styles.paidDot} />
          )}
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

      {/* Refund / Payment status badge */}
      {(consultation.paymentStatus === "refunded" || consultation.paymentStatus === "forfeited") && (
        <View style={styles.refundRow}>
          <Feather
            name={consultation.paymentStatus === "refunded" ? "corner-up-left" : "alert-circle"}
            size={12}
            color={consultation.paymentStatus === "refunded" ? C.success : C.warning}
          />
          <Text style={[
            styles.refundText,
            { color: consultation.paymentStatus === "refunded" ? C.success : C.warning },
          ]}>
            {consultation.paymentStatus === "refunded"
              ? `مُعاد ${consultation.refundAmount ?? consultation.price}`
              : "مصادرة (غياب العميل)"}
          </Text>
        </View>
      )}
    </Wrapper>
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
  refundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  refundText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  pricePill: {
    backgroundColor: "#EEF2F8",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  priceText: {
    fontSize: 11,
    color: C.navy,
    fontFamily: "Inter_600SemiBold",
  },
  paidDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: C.success,
    marginLeft: 4,
  },
});
