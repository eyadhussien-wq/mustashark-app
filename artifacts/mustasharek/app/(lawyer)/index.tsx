import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { rateLabel } from "@/utils/currency";
import { ProfessionalCalendar, buildCalendarDays } from "@/components/ProfessionalCalendar";

const C = colors.light;

export default function LawyerDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, updateUser } = useAuth();
  const { consultations, refreshData, getLawyerById } = useData();
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");

  const myConsults = useMemo(() => consultations.filter((c) => c.lawyerId === user?.id), [consultations, user?.id]);
  const pending = myConsults.filter((c) => c.status === "pending").length;
  const accepted = myConsults.filter((c) => c.status === "accepted").length;
  const completed = myConsults.filter((c) => c.status === "completed").length;
  const totalEarnings = myConsults.filter((c) => c.status === "completed").reduce((sum, c) => sum + c.price, 0);
  const upcoming = useMemo(() => myConsults.filter((c) => c.status === "accepted").sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)).slice(0, 5), [myConsults]);
  const lawyer = user?.id ? getLawyerById(user.id) : undefined;
  const workingDays = lawyer?.availability?.workingDays ?? [1, 2, 3, 4, 5];
  const calendarDays = useMemo(() => buildCalendarDays(workingDays, "ar", 21), [workingDays]);
  const activeDate = selectedDate || calendarDays[0]?.date || "";

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  async function toggleAvailability() { await updateUser({ available: !user?.available }); }
  function goFiltered(status: string) { router.push({ pathname: "/(lawyer)/requests", params: { initialFilter: status } }); }

  return (
    <ScrollView style={styles.page} contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) }]} showsVerticalScrollIndicator={false} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} colors={[C.navy, C.gold]} />}>
      <View style={styles.brandHeader}>
        <View style={styles.headerCopy}>
          <Text style={styles.brandEyebrow}>مستشارك</Text>
          <Text style={styles.greeting}>أهلاً، {user?.name?.split(" ").slice(0, 2).join(" ") || "بك"}</Text>
          <Text style={styles.spec}>{user?.specialization || "المحاماة"}</Text>
        </View>
        <TouchableOpacity style={styles.logoMark} onPress={() => router.push("/(lawyer)/profile")} activeOpacity={0.85}>
          <Feather name="briefcase" size={22} color={C.gold} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={[styles.availabilityCard, !user?.available && styles.availabilityCardOff]} onPress={toggleAvailability} activeOpacity={0.88}>
        <View style={[styles.availabilityIcon, !user?.available && styles.availabilityIconOff]}><View style={[styles.availDot, !user?.available && styles.availDotOff]} /></View>
        <View style={styles.availabilityCopy}>
          <Text style={[styles.availabilityTitle, !user?.available && styles.availabilityTitleOff]}>{user?.available ? "متاح لاستقبال الاستشارات" : "غير متاح لاستقبال الاستشارات"}</Text>
          <Text style={styles.availabilityText}>اضغط لتغيير حالة الظهور للعملاء</Text>
        </View>
        <Feather name="chevron-left" size={18} color={user?.available ? C.success : C.warning} />
      </TouchableOpacity>

      {user?.licenseVerified && (
        <View style={styles.licenseBadge}>
          <View style={styles.licenseIcon}><Feather name="shield" size={15} color={C.success} /></View>
          <View style={styles.licenseCopy}><Text style={styles.licenseTitle}>محامٍ موثّق</Text><Text style={styles.licenseText}>رخصة {user.licenseNumber}</Text></View>
          <Feather name="check-circle" size={18} color={C.success} />
        </View>
      )}

      <View style={styles.sectionHeader}><View><Text style={styles.sectionTitle}>لوحة العمل</Text><Text style={styles.sectionSubtitle}>أهم ما تحتاجه لإدارة يومك</Text></View></View>
      <View style={styles.statsGrid}>
        <StatCard icon="clock" label="طلبات جديدة" value={pending.toString()} tone="warning" onPress={() => goFiltered("pending")} />
        <StatCard icon="calendar" label="استشارات قادمة" value={accepted.toString()} tone="primary" onPress={() => goFiltered("accepted")} />
        <StatCard icon="check-circle" label="استشارات مكتملة" value={completed.toString()} tone="success" onPress={() => goFiltered("completed")} />
        <StatCard icon="trending-up" label={`الإيرادات (${user?.country ? rateLabel(user.country) : "ر.ق"})`} value={totalEarnings.toString()} tone="gold" onPress={() => goFiltered("completed")} />
      </View>

      <View style={styles.calendarSection}>
        <ProfessionalCalendar
          lang="ar"
          selectedDate={activeDate}
          onDateChange={setSelectedDate}
          days={calendarDays}
          mode="agenda"
          consultations={myConsults.filter((c) => c.status === "accepted" || c.status === "pending")}
          title="تقويم العمل"
        />
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <TouchableOpacity style={styles.linkButton} onPress={() => goFiltered("accepted")}><Text style={styles.sectionLink}>عرض الكل</Text><Feather name="arrow-left" size={13} color={C.primary} /></TouchableOpacity>
          <View><Text style={styles.sectionTitle}>الاستشارات القادمة</Text><Text style={styles.sectionSubtitle}>المواعيد التي تحتاج متابعتها</Text></View>
        </View>
        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}><View style={styles.emptyIcon}><Feather name="calendar" size={23} color={C.primary} /></View><Text style={styles.emptyTitle}>لا توجد استشارات قادمة</Text><Text style={styles.emptyText}>ستظهر مواعيدك المقبولة هنا تلقائيًا.</Text></View>
        ) : upcoming.map((c) => (
          <TouchableOpacity key={c.id} style={styles.upcomingCard} onPress={() => router.push(`/consultation/${c.id}`)} activeOpacity={0.82}>
            <View style={styles.cardMain}>
              <View style={styles.cardTitleRow}><Text style={styles.clientName}>{c.clientName}</Text><View style={styles.paymentBadge}><View style={[styles.paymentDot, c.paymentStatus !== "paid" && styles.paymentDotPending]} /><Text style={[styles.paymentText, c.paymentStatus !== "paid" && styles.paymentTextPending]}>{c.paymentStatus === "paid" ? "مدفوع" : "غير مدفوع"}</Text></View></View>
              <Text style={styles.subject} numberOfLines={1}>{c.subject}</Text>
              <View style={styles.metaRow}><Meta icon="calendar" text={c.date} /><Meta icon="clock" text={c.time} /><Meta icon={c.type === "video" ? "video" : c.type === "phone" ? "phone" : "message-square"} text={c.type === "video" ? "فيديو" : c.type === "phone" ? "هاتف" : "محادثة"} /></View>
            </View>
            <View style={styles.typeIcon}><Feather name={c.type === "video" ? "video" : c.type === "phone" ? "phone" : "message-square"} size={16} color={C.primary} /></View>
            <Feather name="chevron-left" size={15} color={C.mutedForeground} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) { return <View style={styles.meta}><Feather name={icon as any} size={12} color={C.mutedForeground} /><Text style={styles.metaText}>{text}</Text></View>; }

function StatCard({ icon, label, value, tone, onPress }: { icon: string; label: string; value: string; tone: "warning" | "success" | "primary" | "gold"; onPress: () => void }) {
  const palette = { warning: { color: C.warning, bg: "#FEF7E7" }, success: { color: C.success, bg: "#ECFDF5" }, primary: { color: C.primary, bg: "#EEF2F8" }, gold: { color: C.gold, bg: "#F8F1D9" } }[tone];
  return <TouchableOpacity style={[styles.statCard, { backgroundColor: palette.bg }]} onPress={onPress} activeOpacity={0.8}><View style={styles.statTop}><Feather name={icon as any} size={19} color={palette.color} /><Feather name="chevron-left" size={13} color={palette.color} style={{ opacity: 0.45 }} /></View><Text style={[styles.statValue, { color: palette.color }]}>{value}</Text><Text style={styles.statLabel}>{label}</Text></TouchableOpacity>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 20 },
  brandHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.navy, borderRadius: 20, padding: 18, marginTop: 8, marginBottom: 14, borderWidth: 1, borderColor: "rgba(201,160,53,0.32)" },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  brandEyebrow: { fontSize: 11, color: C.gold, fontFamily: "Inter_600SemiBold", textAlign: "right", marginBottom: 3 },
  greeting: { fontSize: 21, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "right" },
  spec: { fontSize: 12, color: "rgba(255,255,255,0.72)", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 },
  logoMark: { width: 54, height: 54, borderRadius: 27, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginLeft: 12 },
  availabilityCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#ECFDF5", borderRadius: 16, padding: 14, borderWidth: 1, borderColor: C.success, marginBottom: 14, gap: 11 },
  availabilityCardOff: { backgroundColor: "#FEF7E7", borderColor: C.warning },
  availabilityIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#D1FAE5", alignItems: "center", justifyContent: "center" },
  availabilityIconOff: { backgroundColor: "#FEF3C7" },
  availDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.success },
  availDotOff: { backgroundColor: C.warning },
  availabilityCopy: { flex: 1, alignItems: "flex-end" },
  availabilityTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.success, textAlign: "right" },
  availabilityTitleOff: { color: C.warning },
  availabilityText: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  licenseBadge: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 12, marginBottom: 22, gap: 10 },
  licenseIcon: { width: 34, height: 34, borderRadius: 10, backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center" },
  licenseCopy: { flex: 1, alignItems: "flex-end" },
  licenseTitle: { fontSize: 12, color: C.success, fontFamily: "Inter_600SemiBold" },
  licenseText: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  section: { marginBottom: 20 },
  calendarSection: { marginBottom: 22 },
  sectionHeader: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  sectionSubtitle: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "right" },
  linkButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 5 },
  sectionLink: { fontSize: 12, color: C.primary, fontFamily: "Inter_600SemiBold" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 24 },
  statCard: { width: "48%", minHeight: 106, borderRadius: 16, padding: 14, justifyContent: "space-between" },
  statTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  statValue: { fontSize: 25, fontFamily: "Inter_700Bold", textAlign: "right" },
  statLabel: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "right" },
  upcomingCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 15, padding: 13, marginBottom: 9, gap: 10 },
  cardMain: { flex: 1, alignItems: "flex-end" },
  cardTitleRow: { width: "100%", flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 8 },
  clientName: { fontSize: 14, color: C.foreground, fontFamily: "Inter_600SemiBold" },
  paymentBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 8, backgroundColor: "#ECFDF5" },
  paymentDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.success },
  paymentDotPending: { backgroundColor: C.warning },
  paymentText: { fontSize: 9, color: C.success, fontFamily: "Inter_700Bold" },
  paymentTextPending: { color: C.warning },
  subject: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 3, textAlign: "right", width: "100%" },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 8 },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  typeIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: C.secondary, alignItems: "center", justifyContent: "center" },
  emptyCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 28, alignItems: "center" },
  emptyIcon: { width: 48, height: 48, borderRadius: 15, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center", marginBottom: 9 },
  emptyTitle: { fontSize: 13, color: C.foreground, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 3, textAlign: "center" },
});
