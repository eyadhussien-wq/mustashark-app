import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useMemo, useEffect } from "react";
import { Alert, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { rateLabel } from "@/utils/currency";
import { WhatsAppSupportCard } from "@/components/WhatsAppSupportCard";

const C = colors.light;
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

interface ReviewItem { id: string; stars: number; comment: string | null; createdAt: string; clientName: string; }
interface LiveReviewsData { rating: string | null; reviewsCount: number; reviews: ReviewItem[]; }
const TYPES = [
  { id: "video" as const, labelAR: "مكالمة فيديو", labelEN: "Video Call", icon: "video" },
  { id: "phone" as const, labelAR: "مكالمة هاتفية", labelEN: "Phone Call", icon: "phone" },
  { id: "chat" as const, labelAR: "محادثة نصية", labelEN: "Chat", icon: "message-square" },
];
interface Attachment { name: string; uri: string; type: "image" | "file"; }

function getCalendarDays(workingDays: number[], lang: "ar" | "en") {
  const days: { date: string; dayOfWeek: number; dayNum: number; monthLabel: string; weekdayLabel: string }[] = [];
  const today = new Date();
  const dayLabelsAR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const dayLabelsEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthLabelsAR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthLabelsEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 0; i < 30; i++) {
    const d = new Date(today); d.setDate(today.getDate() + i);
    const dayOfWeek = d.getDay();
    if (workingDays.includes(dayOfWeek)) {
      const month = d.getMonth(); const dayNum = d.getDate(); const dateStr = d.toISOString().split("T")[0];
      days.push({ date: dateStr, dayOfWeek, dayNum, monthLabel: lang === "ar" ? monthLabelsAR[month] : monthLabelsEN[month], weekdayLabel: lang === "ar" ? dayLabelsAR[dayOfWeek] : dayLabelsEN[dayOfWeek] });
    }
  }
  return days;
}

export default function LawyerDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user, getAuthToken } = useAuth();
  const { getLawyerById, getAvailableSlots } = useData();
  const { t, lang } = useLanguage();
  const lawyer = getLawyerById(id ?? "");
  const channels = lawyer?.channels ?? { chat: true, phone: true, video: true };
  const availableTypes = TYPES.filter((t) => channels[t.id]);
  const defaultType = availableTypes[0]?.id ?? "chat";
  const [liveReviews, setLiveReviews] = useState<LiveReviewsData | null>(null);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState<"video" | "phone" | "chat">(defaultType);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!id || !API_BASE) return;
    let cancelled = false;
    fetch(`${API_BASE}/lawyers/${id}/reviews`).then((r) => (r.ok ? r.json() : null)).then((data) => {
      if (!cancelled && data?.ok) setLiveReviews({ rating: data.rating, reviewsCount: data.reviewsCount, reviews: data.reviews ?? [] });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [id]);

  const workingDays = lawyer?.availability?.workingDays ?? [1, 2, 3, 4, 5];
  const calendarDays = useMemo(() => getCalendarDays(workingDays, lang), [workingDays, lang]);
  const slots = useMemo(() => (selectedDate ? getAvailableSlots(lawyer!.id, selectedDate) : []), [selectedDate, lawyer, getAvailableSlots]);

  if (!lawyer) return <View style={styles.notFound}><Text style={styles.notFoundText}>{t("noLawyersFound")}</Text><TouchableOpacity onPress={() => router.back()}><Text style={styles.backLink}>{t("back")}</Text></TouchableOpacity></View>;

  async function pickAttachment() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8, allowsMultipleSelection: true });
    if (!result.canceled) {
      const newFiles: Attachment[] = result.assets.map((a) => ({ name: a.fileName ?? `attachment_${Date.now()}.jpg`, uri: a.uri, type: "image" }));
      setAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  }
  function removeAttachment(index: number) { setAttachments((prev) => prev.filter((_, i) => i !== index)); }

  async function handleProceed() {
    setError("");
    if (!subject.trim() || !description.trim() || !selectedDate || !selectedTime) { setError(t("error")); return; }
    if (!user || !lawyer) return;
    if (!API_BASE) { setError("تعذر الاتصال بالخدمة حالياً. حاول مرة أخرى."); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) { setError("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى."); return; }
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lawyerId: lawyer.id, subject: subject.trim(), description: description.trim(), scheduledDate: selectedDate, scheduledTime: selectedTime, type: selectedType }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || "تعذر إرسال الطلب");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم إرسال طلبك", "تم إرسال الطلب إلى المحامي بنجاح. سيقوم بمراجعته وإرسال العرض لك قبل بدء الخدمة.", [{ text: "حسناً", onPress: () => router.replace("/") }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إرسال الطلب. حاول مرة أخرى.");
    } finally { setSubmitting(false); }
  }

  const rowDir = lang === "ar" ? "row-reverse" : "row";
  const textAlign = lang === "ar" ? "right" : "left";
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.background }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32) }]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.topBar, { flexDirection: rowDir }]}><TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Feather name={lang === "ar" ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} /></TouchableOpacity></View>
        <View style={styles.profileCard}>
          <View style={[styles.profileHeader, { flexDirection: rowDir }]}><View style={styles.avatar}><Text style={styles.avatarText}>{lawyer.name.charAt(0)}</Text></View><View style={{ flex: 1 }}><Text style={styles.lawyerName}>{lawyer.name}</Text><Text style={styles.lawyerSpec}>{lawyer.specialization}</Text><View style={[styles.lawyerMeta, { flexDirection: rowDir }]}><View style={styles.ratingBadge}><Feather name="star" size={12} color={C.gold} /><Text style={styles.ratingText}>{liveReviews?.rating ?? lawyer.rating ?? "—"}</Text>{(liveReviews?.reviewsCount ?? 0) > 0 && <Text style={styles.reviewCountText}>({liveReviews!.reviewsCount})</Text>}</View><Text style={styles.lawyerCountry}>{lawyer.country === "qatar" ? "🇶🇦 " + t("qatar") : "🇯🇴 " + t("jordan")}</Text></View></View></View>
          <View style={styles.priceRow}><Text style={styles.price}>{lawyer.hourlyRate} {rateLabel(lawyer.country)}</Text><Text style={styles.priceSub}>{t("hourlyRate")}</Text></View>
          {!!lawyer.bio && <View style={styles.bioBox}><Text style={styles.bioText}>{lawyer.bio}</Text></View>}
        </View>
        {(liveReviews?.reviewsCount ?? 0) > 0 && <View style={styles.reviewsSection}><View style={styles.reviewsHeader}><Feather name="star" size={15} color={C.gold} /><Text style={styles.reviewsTitle}>تقييمات العملاء ({liveReviews!.reviewsCount})</Text><View style={styles.ratingPill}><Text style={styles.ratingPillText}>{liveReviews!.rating}</Text><Text style={styles.ratingPillSub}>/5</Text></View></View>{liveReviews!.reviews.map((r) => <View key={r.id} style={styles.reviewCard}><View style={styles.reviewStars}>{[1,2,3,4,5].map((s) => <Feather key={s} name="star" size={11} color={s <= r.stars ? C.gold : C.border} />)}</View>{!!r.comment && <Text style={styles.reviewComment}>{r.comment}</Text>}<Text style={styles.reviewMeta}>{r.clientName} • {new Date(r.createdAt).toLocaleDateString("ar-EG", { month: "short", year: "numeric" })}</Text></View>)}</View>}
        <WhatsAppSupportCard role="client" title="الشكاوى الرسمية ضد المحامي" />
        <View style={styles.section}><Text style={[styles.sectionTitle, { textAlign }]}>{t("availability")}</Text><ScrollView horizontal showsHorizontalScrollIndicator={false}><View style={styles.daysRow}>{calendarDays.map((day) => { const active = selectedDate === day.date; return <TouchableOpacity key={day.date} style={[styles.dayCard, active && styles.dayCardActive]} onPress={() => { setSelectedDate(day.date); setSelectedTime(""); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.8}><Text style={[styles.dayMonth, active && styles.dayCardTextActive]}>{day.monthLabel}</Text><Text style={[styles.dayNum, active && styles.dayCardNumActive]}>{day.dayNum}</Text><Text style={[styles.dayLabel, active && styles.dayCardTextActive]}>{day.weekdayLabel}</Text></TouchableOpacity>; })}</View></ScrollView></View>
        {selectedDate && <View style={styles.section}><Text style={[styles.sectionTitle, { textAlign }]}>{t("startHour")} — {t("endHour")} ({lawyer.availability?.slotDuration ?? 60} {t("minutes")})</Text>{slots.length === 0 ? <Text style={[styles.emptyText, { textAlign }]}>{t("noLawyersFound")}</Text> : <View style={styles.slotsGrid}>{slots.map((slot) => <TouchableOpacity key={slot.time} style={[styles.slotChip, !slot.available && styles.slotChipDisabled, selectedTime === slot.time && styles.slotChipActive]} onPress={() => slot.available && setSelectedTime(slot.time)} disabled={!slot.available} activeOpacity={0.8}><Text style={[styles.slotText, !slot.available && styles.slotTextDisabled, selectedTime === slot.time && styles.slotTextActive]}>{slot.time}</Text>{!slot.available && <Text style={styles.slotBookedLabel}>{t("notAvailable")}</Text>}</TouchableOpacity>)}</View>}</View>}
        <View style={styles.section}><Text style={[styles.sectionTitle, { textAlign }]}>{t("consultationType")}</Text>{availableTypes.length === 0 ? <View style={styles.noChannelBox}><Feather name="alert-circle" size={20} color={C.warning} /><Text style={styles.noChannelText}>المحامي غير متاح حالياً للاستشارات</Text></View> : <View style={styles.typesRow}>{availableTypes.map((type) => { const active = selectedType === type.id; return <TouchableOpacity key={type.id} style={[styles.typeCard, active && styles.typeCardActive]} onPress={() => { setSelectedType(type.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }} activeOpacity={0.8}><View style={[styles.typeIcon, active && styles.typeIconActive]}><Feather name={type.icon as any} size={18} color={active ? "#fff" : C.primary} /></View><Text style={[styles.typeLabel, active && styles.typeLabelActive]}>{lang === "ar" ? type.labelAR : type.labelEN}</Text></TouchableOpacity>; })}</View>}</View>
        <View style={styles.field}><Text style={[styles.label, { textAlign }]}>{t("subject")}</Text><TextInput style={[styles.input, { textAlign }]} value={subject} onChangeText={setSubject} placeholder={lang === "ar" ? "موضوع الاستشارة" : "Consultation subject"} placeholderTextColor={C.mutedForeground} /></View>
        <View style={styles.field}><Text style={[styles.label, { textAlign }]}>{t("description")}</Text><TextInput style={[styles.input, styles.textarea, { textAlign }]} value={description} onChangeText={setDescription} placeholder={lang === "ar" ? "وصف المشكلة باختصار" : "Brief problem description"} placeholderTextColor={C.mutedForeground} multiline numberOfLines={4} textAlignVertical="top" /></View>
        <View style={styles.field}><View style={[styles.labelRow, { flexDirection: rowDir }]}><Text style={[styles.label, { textAlign }]}>{t("attachments")}</Text>{attachments.length < 5 && <TouchableOpacity onPress={pickAttachment} style={styles.attachBtn}><Feather name="paperclip" size={14} color={C.primary} /><Text style={styles.attachText}>{t("add")}</Text></TouchableOpacity>}</View>{attachments.map((a, i) => <View key={i} style={[styles.attachRow, { flexDirection: rowDir }]}><TouchableOpacity onPress={() => removeAttachment(i)}><Feather name="x" size={14} color={C.destructive} /></TouchableOpacity><Text style={styles.attachName}>{a.name}</Text><Feather name="file" size={14} color={C.primary} /></View>)}</View>
        {!!error && <View style={styles.errorBox}><Feather name="alert-circle" size={14} color={C.destructive} /><Text style={styles.errorText}>{error}</Text></View>}
        <TouchableOpacity style={[styles.proceedBtn, submitting && styles.proceedBtnDisabled]} onPress={() => void handleProceed()} disabled={submitting} activeOpacity={0.85}>{submitting ? <Text style={styles.proceedText}>جارٍ إرسال الطلب...</Text> : <Text style={styles.proceedText}>إرسال الطلب للمحامي</Text>}{!submitting && <Feather name={lang === "ar" ? "arrow-left" : "arrow-right"} size={16} color="#fff" />}</TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 }, topBar: { flexDirection: "row", alignItems: "center", paddingVertical: 10 }, backBtn: { padding: 4 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 }, notFoundText: { fontSize: 18, color: C.foreground, fontFamily: "Inter_600SemiBold" }, backLink: { fontSize: 15, color: C.primary, fontFamily: "Inter_500Medium" },
  profileCard: { backgroundColor: C.card, borderRadius: colors.radius, borderWidth: 1, borderColor: C.border, padding: 18, marginBottom: 20, gap: 14 }, profileHeader: { flexDirection: "row", alignItems: "center", gap: 14 }, avatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" }, avatarText: { fontSize: 22, color: "#fff", fontFamily: "Inter_700Bold" }, lawyerName: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground }, lawyerSpec: { fontSize: 13, color: C.primary, fontFamily: "Inter_500Medium" }, lawyerMeta: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4 }, ratingBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#FEF9EC", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 }, ratingText: { fontSize: 12, color: C.gold, fontFamily: "Inter_700Bold" }, reviewCountText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, lawyerCountry: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, priceRow: { flexDirection: "row", alignItems: "center", gap: 8 }, price: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.navy }, priceSub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, bioBox: { backgroundColor: C.secondary, borderRadius: 10, padding: 12 }, bioText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "right" },
  reviewsSection: { backgroundColor: C.card, borderRadius: colors.radius, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16, gap: 12 }, reviewsHeader: { flexDirection: "row", alignItems: "center", gap: 8 }, reviewsTitle: { flex: 1, fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground }, ratingPill: { flexDirection: "row", alignItems: "baseline", gap: 2, backgroundColor: "#FEF9EC", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1, borderColor: "rgba(201,160,53,0.25)" }, ratingPillText: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.gold }, ratingPillSub: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, reviewCard: { backgroundColor: C.background, borderRadius: 10, borderWidth: 1, borderColor: C.border, padding: 12, gap: 6 }, reviewStars: { flexDirection: "row", gap: 3 }, reviewComment: { fontSize: 13, color: C.foreground, fontFamily: "Inter_400Regular", lineHeight: 20, textAlign: "right" }, reviewMeta: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  section: { marginBottom: 22 }, sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, marginBottom: 12 }, daysRow: { flexDirection: "row", gap: 8, paddingRight: 4 }, dayCard: { alignItems: "center", justifyContent: "center", width: 64, height: 76, borderRadius: 14, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, gap: 2 }, dayCardActive: { backgroundColor: C.navy, borderColor: C.navy }, dayMonth: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, dayNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground }, dayLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, dayCardTextActive: { color: "rgba(255,255,255,0.65)", fontFamily: "Inter_500Medium" }, dayCardNumActive: { color: "#fff", fontFamily: "Inter_700Bold" }, slotsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 }, slotChip: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border, alignItems: "center", justifyContent: "center", minWidth: 70 }, slotChipActive: { backgroundColor: C.navy, borderColor: C.navy }, slotChipDisabled: { backgroundColor: "#F9FAFB", borderColor: C.border, opacity: 0.5 }, slotText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground }, slotTextActive: { color: "#fff" }, slotTextDisabled: { color: C.mutedForeground, fontFamily: "Inter_400Regular" }, slotBookedLabel: { fontSize: 9, color: C.destructive, fontFamily: "Inter_400Regular", marginTop: 2 },
  typesRow: { flexDirection: "row", gap: 10 }, typeCard: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 16, borderRadius: 14, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.border }, typeCardActive: { backgroundColor: C.navy, borderColor: C.navy }, typeIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: C.secondary, alignItems: "center", justifyContent: "center" }, typeIconActive: { backgroundColor: "rgba(255,255,255,0.15)" }, typeLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.foreground, textAlign: "center" }, typeLabelActive: { color: "#fff", fontFamily: "Inter_600SemiBold" },
  field: { marginBottom: 18 }, label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.foreground, marginBottom: 8 }, labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }, input: { backgroundColor: C.card, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular" }, textarea: { height: 96, paddingTop: 12, textAlignVertical: "top" }, attachBtn: { flexDirection: "row", alignItems: "center", gap: 4 }, attachText: { fontSize: 13, color: C.primary, fontFamily: "Inter_500Medium" }, attachRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 6 }, attachName: { flex: 1, fontSize: 13, color: C.foreground, fontFamily: "Inter_400Regular" }, errorBox: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FFF5F5", borderWidth: 1, borderColor: "#FEE2E2", borderRadius: 10, padding: 10, marginBottom: 14 }, errorText: { fontSize: 13, color: C.destructive, fontFamily: "Inter_400Regular" }, emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: "Inter_400Regular" }, proceedBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.navy, borderRadius: 14, paddingVertical: 16, marginBottom: 24 }, proceedBtnDisabled: { opacity: 0.6 }, proceedText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" }, noChannelBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FEF3C7", borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, marginTop: 4 }, noChannelText: { fontSize: 13, fontFamily: "Inter_500Medium", color: "#92400E" },
});
