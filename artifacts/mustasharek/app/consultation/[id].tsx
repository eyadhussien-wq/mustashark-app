import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";
import { getCurrency } from "@/utils/currency";

const C = colors.light;

const TYPE_LABELS = { video: "مكالمة فيديو", phone: "مكالمة هاتفية", chat: "محادثة نصية" };
const TYPE_ICONS = { video: "video", phone: "phone", chat: "message-square" };
const STATUS_CONFIG = {
  pending:   { label: "معلّق",   color: C.warning,     bg: "#FEF3C7", icon: "clock" },
  accepted:  { label: "مقبول",   color: C.success,     bg: "#ECFDF5", icon: "check-circle" },
  rejected:  { label: "مرفوض",  color: C.destructive, bg: "#FEE2E2", icon: "x-circle" },
  completed: { label: "مكتمل",  color: C.primary,     bg: "#EEF2F8", icon: "check" },
};

export default function ConsultationDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { consultations, updateConsultationStatus } = useData();
  const [loading, setLoading] = useState<"accept" | "reject" | null>(null);

  const consult = useMemo(
    () => consultations.find((c) => c.id === id),
    [consultations, id]
  );

  if (!consult) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={40} color={C.border} />
        <Text style={styles.notFoundText}>الاستشارة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLawyer = user?.role === "lawyer";
  const statusCfg = STATUS_CONFIG[consult.status];
  const currency = getCurrency(consult.lawyerCountry ?? "qatar");

  async function handleAccept() {
    setLoading("accept");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateConsultationStatus(consult!.id, "accepted");
    setLoading(null);
    Alert.alert("تم القبول", "تم قبول طلب الاستشارة بنجاح.", [{ text: "حسناً" }]);
  }

  async function handleReject() {
    setLoading("reject");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateConsultationStatus(consult!.id, "rejected");
    setLoading(null);
    router.back();
  }

  async function handleComplete() {
    await updateConsultationStatus(consult!.id, "completed");
    Alert.alert("تم الإكمال", "تم تحديد الاستشارة كمكتملة.", [{ text: "حسناً" }]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>تفاصيل الاستشارة</Text>
        <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
          <Feather name={statusCfg.icon as any} size={12} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* Client / Lawyer header card */}
      <View style={styles.heroCard}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>
            {(isLawyer ? consult.clientName : consult.lawyerName).charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1, alignItems: "flex-end" }}>
          <Text style={styles.heroName}>
            {isLawyer ? consult.clientName : consult.lawyerName}
          </Text>
          <Text style={styles.heroRole}>
            {isLawyer ? "العميل" : consult.lawyerSpecialization}
          </Text>
          {isLawyer && (
            <View style={styles.paidBadge}>
              <Feather name="check-circle" size={12} color={C.success} />
              <Text style={styles.paidBadgeText}>مدفوع</Text>
            </View>
          )}
        </View>
        <View style={styles.typeTag}>
          <Feather
            name={(TYPE_ICONS[consult.type] ?? "video") as any}
            size={16} color={C.primary}
          />
        </View>
      </View>

      {/* Consultation details */}
      <View style={styles.detailCard}>
        <Text style={styles.cardTitle}>بيانات الاستشارة</Text>
        <View style={styles.detailRows}>
          <DetailRow icon="file-text"  label="الموضوع"      value={consult.subject} />
          <DetailRow icon="calendar"   label="التاريخ"      value={consult.date} />
          <DetailRow icon="clock"      label="الوقت"        value={consult.time} />
          <DetailRow icon="video"      label="نوع الجلسة"   value={TYPE_LABELS[consult.type] ?? consult.type} />
          <DetailRow icon="map-pin"    label="البلد"        value={consult.lawyerCountry === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن"} />
        </View>
      </View>

      {/* Description */}
      <View style={styles.descCard}>
        <Text style={styles.cardTitle}>وصف القضية</Text>
        <Text style={styles.descText}>{consult.description}</Text>
      </View>

      {/* Payment box */}
      <View style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          <View style={[
            styles.paymentStatusTag,
            { backgroundColor: consult.paymentStatus === "paid" ? "#ECFDF5" : "#FEF3C7" },
          ]}>
            <Feather
              name={consult.paymentStatus === "paid" ? "check-circle" : "clock"}
              size={13}
              color={consult.paymentStatus === "paid" ? C.success : C.warning}
            />
            <Text style={[
              styles.paymentStatusText,
              { color: consult.paymentStatus === "paid" ? C.success : C.warning },
            ]}>
              {consult.paymentStatus === "paid" ? "مدفوع" : "في انتظار الدفع"}
            </Text>
          </View>
          <Text style={styles.paymentLabel}>حالة الدفع</Text>
        </View>
        <View style={styles.paymentDivider} />
        <View style={styles.paymentAmountRow}>
          <View style={styles.paymentAmountRight}>
            <Text style={styles.paymentAmount}>{consult.price}</Text>
            <Text style={styles.paymentCurrency}>{currency}</Text>
          </View>
          <Text style={styles.paymentLabel}>إجمالي الرسوم</Text>
        </View>
      </View>

      {/* Attachments */}
      <View style={styles.attachCard}>
        <View style={styles.attachCardHeader}>
          <View style={styles.attachCountBadge}>
            <Text style={styles.attachCountText}>
              {(consult.attachments ?? []).length}
            </Text>
          </View>
          <Text style={styles.cardTitle}>مرفقات العميل</Text>
        </View>

        {(!consult.attachments || consult.attachments.length === 0) ? (
          <View style={styles.noAttach}>
            <Feather name="paperclip" size={28} color={C.border} />
            <Text style={styles.noAttachText}>لم يرفق العميل أي وثائق</Text>
          </View>
        ) : (
          <View style={styles.attachList}>
            {consult.attachments.map((name, i) => {
              const ext = name.split(".").pop()?.toUpperCase() ?? "FILE";
              const isImage = ["JPG", "JPEG", "PNG", "WEBP"].includes(ext);
              return (
                <View key={i} style={styles.attachItem}>
                  <View style={[
                    styles.attachItemIcon,
                    { backgroundColor: isImage ? "rgba(201,160,53,0.12)" : "rgba(27,58,107,0.1)" },
                  ]}>
                    <Feather
                      name={isImage ? "image" : "file-text"}
                      size={18}
                      color={isImage ? C.gold : C.navy}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.attachItemName} numberOfLines={1}>{name}</Text>
                    <Text style={styles.attachItemType}>{isImage ? "صورة" : "مستند"} · {ext}</Text>
                  </View>
                  <View style={[
                    styles.attachTypePill,
                    { backgroundColor: isImage ? "rgba(201,160,53,0.12)" : "#EEF2F8" },
                  ]}>
                    <Text style={[
                      styles.attachTypePillText,
                      { color: isImage ? C.gold : C.navy },
                    ]}>{ext}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </View>

      {/* Action buttons (lawyer only, pending) */}
      {isLawyer && consult.status === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, loading === "reject" && { opacity: 0.7 }]}
            onPress={handleReject}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === "reject"
              ? <ActivityIndicator color={C.destructive} />
              : <>
                  <Feather name="x" size={18} color={C.destructive} />
                  <Text style={styles.rejectBtnText}>رفض</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, loading === "accept" && { opacity: 0.7 }]}
            onPress={handleAccept}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === "accept"
              ? <ActivityIndicator color="#fff" />
              : <>
                  <Feather name="check" size={18} color="#fff" />
                  <Text style={styles.acceptBtnText}>قبول الاستشارة</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {/* Mark complete (accepted only) */}
      {isLawyer && consult.status === "accepted" && (
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
          <Feather name="check-circle" size={18} color="#fff" />
          <Text style={styles.completeBtnText}>تحديد كمكتملة</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailValue}>{value}</Text>
      <View style={styles.detailLeft}>
        <Feather name={icon as any} size={13} color={C.mutedForeground} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.foreground },
  backLink: { fontSize: 14, color: C.primary, fontFamily: "Inter_500Medium" },

  // Top
  topBar: {
    flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 20,
  },
  backBtn: { padding: 4 },
  pageTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  // Hero
  heroCard: {
    backgroundColor: C.navy, borderRadius: 20, padding: 20,
    flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16,
  },
  heroAvatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "rgba(201,160,53,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.gold,
  },
  heroAvatarText: { fontSize: 22, color: "#fff", fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#fff" },
  heroRole: { fontSize: 12, color: C.gold, fontFamily: "Inter_500Medium" },
  paidBadge: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: "rgba(16,185,129,0.2)", borderRadius: 10,
    paddingHorizontal: 8, paddingVertical: 3, marginTop: 4,
  },
  paidBadgeText: { fontSize: 11, color: C.success, fontFamily: "Inter_600SemiBold" },
  typeTag: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center", justifyContent: "center",
  },

  // Detail card
  detailCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14, gap: 12,
  },
  cardTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.navy, textAlign: "right" },
  detailRows: { gap: 10 },
  detailRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  detailLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  detailValue: { fontSize: 13, color: C.foreground, fontFamily: "Inter_500Medium", flex: 1, textAlign: "right", marginLeft: 16 },

  // Description
  descCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14, gap: 8,
  },
  descText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "right" },

  // Payment
  paymentCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 14,
  },
  paymentRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentStatusTag: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  paymentStatusText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  paymentLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  paymentDivider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  paymentAmountRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  paymentAmountRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  paymentAmount: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.navy },
  paymentCurrency: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Attachments
  attachCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16, gap: 12,
  },
  attachCardHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  attachCountBadge: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
  },
  attachCountText: { fontSize: 11, color: "#fff", fontFamily: "Inter_700Bold" },
  noAttach: { alignItems: "center", paddingVertical: 20, gap: 8 },
  noAttachText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  attachList: { gap: 10 },
  attachItem: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.background, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 11,
    borderWidth: 1, borderColor: C.border,
  },
  attachItemIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  attachItemName: { fontSize: 13, color: C.foreground, fontFamily: "Inter_500Medium", textAlign: "right" },
  attachItemType: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  attachTypePill: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3 },
  attachTypePillText: { fontSize: 10, fontFamily: "Inter_700Bold" },

  // Actions
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 8 },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: C.destructive,
    borderRadius: colors.radius, paddingVertical: 14,
  },
  rejectBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.destructive },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.success, borderRadius: colors.radius, paddingVertical: 14,
  },
  acceptBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  completeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.primary, borderRadius: colors.radius, paddingVertical: 14,
    marginBottom: 8,
  },
  completeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
