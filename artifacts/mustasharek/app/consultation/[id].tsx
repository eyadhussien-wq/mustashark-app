import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { getCurrency } from "@/utils/currency";

const C = colors.light;

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  video: { label: "مكالمة فيديو",    icon: "video",          color: "#7C3AED" },
  phone: { label: "مكالمة هاتفية",   icon: "phone",          color: "#2563EB" },
  chat:  { label: "محادثة نصية",     icon: "message-square", color: "#059669" },
};

const STATUS_CONFIG = {
  pending:   { label: "معلّق",  color: C.warning,     bg: "#FEF3C7", icon: "clock" },
  accepted:  { label: "مقبول",  color: C.success,     bg: "#ECFDF5", icon: "check-circle" },
  rejected:  { label: "مرفوض", color: C.destructive,  bg: "#FEE2E2", icon: "x-circle" },
  completed: { label: "مكتمل", color: C.primary,      bg: "#EEF2F8", icon: "check" },
};

// ── File helpers ───────────────────────────────────────────────────────────────
function getFileExt(name: string) {
  return (name.split(".").pop() ?? "").toUpperCase();
}
function isImageFile(name: string) {
  return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(getFileExt(name));
}
function getFileColor(name: string) {
  const ext = getFileExt(name);
  if (["JPG", "JPEG", "PNG", "WEBP"].includes(ext)) return { bg: "rgba(201,160,53,0.12)", color: C.gold };
  if (ext === "PDF") return { bg: "rgba(220,38,38,0.1)",   color: "#DC2626" };
  return { bg: "#EEF2F8", color: C.navy };
}

export default function ConsultationDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { consultations, updateConsultationStatus } = useData();
  const [loading, setLoading] = useState<"accept" | "reject" | "complete" | null>(null);

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
  const typeMeta = TYPE_META[consult.type] ?? TYPE_META.video;
  const currency = getCurrency(consult.lawyerCountry ?? "qatar");
  const attachments = consult.attachments ?? [];

  async function handleAccept() {
    setLoading("accept");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateConsultationStatus(consult!.id, "accepted");
    setLoading(null);
    Alert.alert("تم القبول ✓", "تم قبول طلب الاستشارة بنجاح. سيتم إبلاغ العميل.", [{ text: "حسناً" }]);
  }

  async function handleReject() {
    setLoading("reject");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateConsultationStatus(consult!.id, "rejected");
    setLoading(null);
    router.back();
  }

  async function handleComplete() {
    setLoading("complete");
    await updateConsultationStatus(consult!.id, "completed");
    setLoading(null);
    Alert.alert("تم الإكمال ✓", "تم تحديد الاستشارة كمكتملة.", [{ text: "حسناً" }]);
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 40 : 36),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>ملف الاستشارة</Text>
        <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
          <Feather name={statusCfg.icon as any} size={12} color={statusCfg.color} />
          <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
        </View>
      </View>

      {/* ── Client / Lawyer hero ─────────────────────────────────── */}
      <View style={styles.heroCard}>
        <View style={styles.heroAvatar}>
          <Text style={styles.heroAvatarText}>
            {(isLawyer ? consult.clientName : consult.lawyerName).charAt(0)}
          </Text>
        </View>
        <View style={{ flex: 1, gap: 3 }}>
          <Text style={styles.heroName}>
            {isLawyer ? consult.clientName : consult.lawyerName}
          </Text>
          <Text style={styles.heroRole}>
            {isLawyer ? "العميل" : consult.lawyerSpecialization}
          </Text>
          <Text style={styles.heroDate}>
            {consult.date} — {consult.time}
          </Text>
        </View>
        <View style={[styles.typeTagOuter, { backgroundColor: typeMeta.color + "18" }]}>
          <Feather name={typeMeta.icon as any} size={18} color={typeMeta.color} />
        </View>
      </View>

      {/* ── Section 1: نوع الاستشارة ────────────────────────────── */}
      <SectionCard title="نوع الاستشارة / القضية" icon="briefcase">
        <View style={styles.caseTypeRow}>
          <View style={[styles.caseTypeIcon, { backgroundColor: typeMeta.color + "15" }]}>
            <Feather name={typeMeta.icon as any} size={16} color={typeMeta.color} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.caseTypeLabel}>{typeMeta.label}</Text>
            <Text style={styles.caseTypeSpec}>{consult.lawyerSpecialization}</Text>
          </View>
          <View style={styles.countryTag}>
            <Text style={styles.countryFlag}>
              {consult.lawyerCountry === "qatar" ? "🇶🇦" : "🇯🇴"}
            </Text>
            <Text style={styles.countryLabel}>
              {consult.lawyerCountry === "qatar" ? "قطر" : "الأردن"}
            </Text>
          </View>
        </View>
      </SectionCard>

      {/* ── Section 2: الموضوع ──────────────────────────────────── */}
      <SectionCard title="الموضوع" icon="file-text">
        <Text style={styles.subjectText}>{consult.subject}</Text>
      </SectionCard>

      {/* ── Section 3: تفاصيل القضية ───────────────────────────── */}
      <SectionCard title="تفاصيل ومحتوى القضية" icon="align-right">
        <Text style={styles.descriptionText}>{consult.description}</Text>
      </SectionCard>

      {/* ── Section 4: المرفقات ─────────────────────────────────── */}
      <SectionCard
        title="المرفقات والمستندات"
        icon="paperclip"
        badge={attachments.length > 0 ? attachments.length.toString() : undefined}
      >
        {attachments.length === 0 ? (
          <View style={styles.noAttach}>
            <Feather name="paperclip" size={26} color={C.border} />
            <Text style={styles.noAttachText}>لم يرفق العميل أي مستندات</Text>
          </View>
        ) : (
          <View style={styles.attachGrid}>
            {attachments.map((name, i) => {
              const { bg, color } = getFileColor(name);
              const ext = getFileExt(name);
              const isImg = isImageFile(name);
              return (
                <TouchableOpacity
                  key={i}
                  style={styles.attachThumb}
                  onPress={() => {
                    Alert.alert(name, isImg ? "معاينة الصورة" : "فتح المستند", [
                      { text: "إلغاء", style: "cancel" },
                      { text: "فتح", onPress: () => {} },
                    ]);
                  }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.attachThumbIcon, { backgroundColor: bg }]}>
                    <Feather
                      name={isImg ? "image" : "file-text"}
                      size={22}
                      color={color}
                    />
                  </View>
                  <View style={[styles.attachExtPill, { backgroundColor: bg }]}>
                    <Text style={[styles.attachExtText, { color }]}>{ext}</Text>
                  </View>
                  <Text style={styles.attachThumbName} numberOfLines={2}>{name}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </SectionCard>

      {/* ── Section 5: حالة الدفع ───────────────────────────────── */}
      <SectionCard title="حالة الدفع" icon="credit-card">
        <View style={styles.paymentRow}>
          {/* Status badge */}
          <View style={[
            styles.paymentStatusBadge,
            {
              backgroundColor: consult.paymentStatus === "paid" ? "#ECFDF5" : "#FEF3C7",
              borderColor: consult.paymentStatus === "paid" ? "#A7F3D0" : "#FDE68A",
            },
          ]}>
            <Feather
              name={consult.paymentStatus === "paid" ? "check-circle" : "clock"}
              size={15}
              color={consult.paymentStatus === "paid" ? C.success : C.warning}
            />
            <Text style={[
              styles.paymentStatusLabel,
              { color: consult.paymentStatus === "paid" ? C.success : C.warning },
            ]}>
              {consult.paymentStatus === "paid" ? "مدفوع بالكامل" : "في انتظار الدفع"}
            </Text>
          </View>
          {/* Amount */}
          <View style={styles.paymentAmountBox}>
            <Text style={styles.paymentAmount}>{consult.price}</Text>
            <Text style={styles.paymentCurrency}>{currency}</Text>
          </View>
        </View>
      </SectionCard>

      {/* ── Actions (lawyer only) ────────────────────────────────── */}
      {isLawyer && consult.status === "pending" && (
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.rejectBtn, loading === "reject" && { opacity: 0.65 }]}
            onPress={handleReject}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === "reject"
              ? <ActivityIndicator color={C.destructive} size="small" />
              : <>
                  <Feather name="x-circle" size={17} color={C.destructive} />
                  <Text style={styles.rejectBtnText}>رفض</Text>
                </>
            }
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.acceptBtn, loading === "accept" && { opacity: 0.65 }]}
            onPress={handleAccept}
            disabled={!!loading}
            activeOpacity={0.85}
          >
            {loading === "accept"
              ? <ActivityIndicator color="#fff" size="small" />
              : <>
                  <Feather name="check-circle" size={17} color="#fff" />
                  <Text style={styles.acceptBtnText}>قبول الاستشارة</Text>
                </>
            }
          </TouchableOpacity>
        </View>
      )}

      {isLawyer && consult.status === "accepted" && (
        <TouchableOpacity
          style={[styles.completeBtn, loading === "complete" && { opacity: 0.65 }]}
          onPress={handleComplete}
          disabled={!!loading}
          activeOpacity={0.85}
        >
          {loading === "complete"
            ? <ActivityIndicator color="#fff" size="small" />
            : <>
                <Feather name="check-circle" size={18} color="#fff" />
                <Text style={styles.completeBtnText}>تحديد كمكتملة</Text>
              </>
          }
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

// ── Reusable section card ──────────────────────────────────────────────────────
function SectionCard({
  title, icon, badge, children,
}: {
  title: string; icon: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionCardHeaderLeft}>
          <View style={styles.sectionIconDot}>
            <Feather name={icon as any} size={13} color={C.gold} />
          </View>
          <Text style={styles.sectionCardTitle}>{title}</Text>
        </View>
        {badge && (
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionCardBody}>{children}</View>
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 18 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.foreground },
  backLink: { fontSize: 14, color: C.primary, fontFamily: "Inter_500Medium" },

  // Top bar
  topBar: {
    flexDirection: "row", alignItems: "center",
    gap: 10, marginBottom: 18,
  },
  backBtn: { padding: 4 },
  pageTitle: {
    flex: 1, fontSize: 18, fontFamily: "Inter_700Bold",
    color: C.foreground, textAlign: "right",
  },
  statusPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  // Hero card
  heroCard: {
    backgroundColor: C.navy, borderRadius: 20, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14,
  },
  heroAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(201,160,53,0.22)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.gold,
  },
  heroAvatarText: { fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "right" },
  heroRole: { fontSize: 12, color: C.gold, fontFamily: "Inter_500Medium", textAlign: "right" },
  heroDate: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", textAlign: "right" },
  typeTagOuter: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },

  // Section card
  sectionCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    marginBottom: 12, overflow: "hidden",
  },
  sectionCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.border,
    backgroundColor: "#F8FAFF",
  },
  sectionCardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIconDot: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "rgba(201,160,53,0.13)",
    alignItems: "center", justifyContent: "center",
  },
  sectionCardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.navy },
  sectionCardBody: { padding: 14 },
  badgeCircle: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
  },
  badgeText: { fontSize: 11, color: "#fff", fontFamily: "Inter_700Bold" },

  // Case type
  caseTypeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  caseTypeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  caseTypeLabel: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  caseTypeSpec: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  countryTag: { alignItems: "center", gap: 2 },
  countryFlag: { fontSize: 20 },
  countryLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Subject
  subjectText: {
    fontSize: 15, fontFamily: "Inter_700Bold", color: C.navy,
    textAlign: "right", lineHeight: 24,
  },

  // Description
  descriptionText: {
    fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular",
    lineHeight: 24, textAlign: "right",
  },

  // Attachments
  noAttach: { alignItems: "center", paddingVertical: 16, gap: 8 },
  noAttachText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  attachGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  attachThumb: {
    width: "47%", alignItems: "center", gap: 6,
    backgroundColor: C.background, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    paddingVertical: 14, paddingHorizontal: 10,
    position: "relative",
  },
  attachThumbIcon: {
    width: 52, height: 52, borderRadius: 14,
    alignItems: "center", justifyContent: "center",
  },
  attachExtPill: {
    position: "absolute", top: 8, left: 8,
    borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2,
  },
  attachExtText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  attachThumbName: {
    fontSize: 11, color: C.foreground, fontFamily: "Inter_500Medium",
    textAlign: "center", lineHeight: 16,
  },

  // Payment
  paymentRow: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
  },
  paymentStatusBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 20, borderWidth: 1,
  },
  paymentStatusLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  paymentAmountBox: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  paymentAmount: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.navy },
  paymentCurrency: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Actions
  actionRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: C.destructive,
    borderRadius: 14, paddingVertical: 14,
  },
  rejectBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.destructive },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.success, borderRadius: 14, paddingVertical: 14,
  },
  acceptBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  completeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14,
    marginBottom: 10,
  },
  completeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
