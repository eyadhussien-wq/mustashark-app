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
import { formatPrice } from "@/utils/currency";
import { getUsableAuthToken } from "@/utils/authToken";
import { ProfessionalCalendar, buildCalendarDays } from "@/components/ProfessionalCalendar";

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

export default function LawyerDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getLawyerById, bookConsultation, consultations } = useData();
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
  const calendarDays = useMemo(() => buildCalendarDays(workingDays, lang, 21), [workingDays, lang]);
  const activeDate = selectedDate || calendarDays[0]?.date || "";
  const slots = useMemo(() => {
    if (!lawyer || !activeDate) return [];
    const availability = lawyer.availability ?? { workingDays: [1, 2, 3, 4, 5], startHour: "09:00", endHour: "17:00", slotDuration: 60 as const };
    const dayOfWeek = new Date(`${activeDate}T00:00:00`).getDay();
    if (!availability.workingDays.includes(dayOfWeek)) return [];
    const [startH, startM] = availability.startHour.split(":").map(Number);
    const [endH, endM] = availability.endHour.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    const generated = [] as Array<{ time: string; available: boolean }>;
    for (let minutes = startMinutes; minutes < endMinutes; minutes += availability.slotDuration) {
      const h = Math.floor(minutes / 60); const m = minutes % 60;
      const time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      const booked = consultations.some((c) => c.lawyerId === lawyer.id && c.date === activeDate && c.time === time && !["rejected", "cancelled_by_client", "cancelled_by_lawyer"].includes(c.status));
      generated.push({ time, available: !booked });
    }
    return generated;
  }, [activeDate, lawyer, consultations]);

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
    if (!subject.trim() || !description.trim() || !activeDate || !selectedTime) { setError(t("error")); return; }
    if (!user || !lawyer) return;
    if (!API_BASE) { setError("تعذر الاتصال بالخدمة حالياً. حاول مرة أخرى."); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSubmitting(true);
    try {
      const token = await getUsableAuthToken(user);
      if (!token) {
        setError("تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مرة أخرى ثم المحاولة.");
        return;
      }
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ lawyerId: lawyer.id, subject: subject.trim(), description: description.trim(), scheduledDate: activeDate, scheduledTime: selectedTime, type: selectedType }),
      });
      const body = await response.json().catch(() => ({}));
      if (response.status === 401) {
        setError("تعذر التحقق من جلسة الدخول. يرجى تسجيل الدخول مرة أخرى ثم المحاولة.");
        return;
      }
      if (!response.ok) throw new Error(body.message || body.error || "تعذر إرسال الطلب");
      const booking = body.booking;
      if (booking) {
        await bookConsultation({
          clientId: user.id, clientName: user.name,
          lawyerId: lawyer.id, lawyerName: lawyer.name, lawyerSpecialization: lawyer.specialization, lawyerCountry: lawyer.country,
          subject: booking.subject, description: booking.description ?? description.trim(),
          date: booking.scheduledDate, time: booking.scheduledTime,
          type: booking.type === "email" ? "chat" : booking.type, price: Number(booking.price ?? lawyer.hourlyRate),
          paymentStatus: booking.paymentStatus === "paid" ? "paid" : "unpaid", meetLink: booking.googleMeetLink ?? undefined,
        });
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم إرسال طلبك", "تم إرسال الطلب إلى المحامي بنجاح. سيقوم بمراجعته وإرسال العرض لك قبل بدء الخدمة.", [{ text: "حسناً", onPress: () => router.replace("/") }]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "تعذر إرسال الطلب. حاول مرة أخرى.");
    } finally { setSubmitting(false); }
  }

  const rowDir = lang === "ar" ? "row-reverse" : "row";
  const textAlign = lang === "ar" ? "right" : "left";

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}><Feather name={lang === "ar" ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} /></TouchableOpacity>
            <Text style={styles.topTitle}>{t("lawyerProfile")}</Text>
            <View style={{ width: 42 }} />
          </View>
          <View style={styles.profileCard}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{lawyer.name.charAt(0)}</Text></View>
            <Text style={styles.lawyerName}>{lawyer.name}</Text>
            <Text style={styles.specialization}>{lawyer.specialization}</Text>
            <Text style={styles.rate}>{formatPrice(lawyer.hourlyRate ?? 0, lawyer.country)}</Text>
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{lang === "ar" ? "اختر نوع الاستشارة" : "Choose consultation type"}</Text>
            <View style={[styles.typeRow, { flexDirection: rowDir }]}>
              {availableTypes.map((type) => (
                <TouchableOpacity key={type.id} style={[styles.typeBtn, selectedType === type.id && styles.typeBtnActive]} onPress={() => setSelectedType(type.id)}>
                  <Feather name={type.icon as any} size={18} color={selectedType === type.id ? C.navy : C.mutedForeground} />
                  <Text style={[styles.typeText, selectedType === type.id && styles.typeTextActive]}>{lang === "ar" ? type.labelAR : type.labelEN}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          <View style={styles.calendarSection}>
            <ProfessionalCalendar lang={lang} selectedDate={activeDate} onDateChange={(date) => { setSelectedDate(date); setSelectedTime(""); }} days={calendarDays} mode="booking" slots={slots} selectedTime={selectedTime} onTimeChange={setSelectedTime} title={lang === "ar" ? "حجز موعد مع المحامي" : "Book an appointment"} />
          </View>
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { textAlign }]}>{lang === "ar" ? "موضوع الاستشارة" : "Consultation subject"}</Text>
            <TextInput value={subject} onChangeText={setSubject} placeholder={lang === "ar" ? "مثال: عقد تجاري" : "e.g. Commercial contract"} placeholderTextColor={C.mutedForeground} style={[styles.input, { textAlign }]} />
            <Text style={[styles.sectionTitle, { textAlign, marginTop: 16 }]}>{lang === "ar" ? "وصف المشكلة" : "Problem description"}</Text>
            <TextInput value={description} onChangeText={setDescription} placeholder={lang === "ar" ? "اشرح مشكلتك بالتفصيل..." : "Describe your issue in detail..."} placeholderTextColor={C.mutedForeground} multiline numberOfLines={5} style={[styles.input, styles.textArea, { textAlign }]} />
          </View>
          <View style={styles.section}>
            <View style={[styles.attachmentHeader, { flexDirection: rowDir }]}>
              <Text style={[styles.sectionTitle, { textAlign }]}>{lang === "ar" ? "المرفقات" : "Attachments"}</Text>
              <TouchableOpacity style={styles.attachBtn} onPress={pickAttachment}><Feather name="paperclip" size={18} color={C.navy} /><Text style={styles.attachText}>{lang === "ar" ? "إضافة" : "Add"}</Text></TouchableOpacity>
            </View>
            {attachments.length > 0 && <View style={styles.attachmentsList}>{attachments.map((a, i) => <View key={`${a.uri}-${i}`} style={[styles.attachmentItem, { flexDirection: rowDir }]}><Text style={styles.attachmentName} numberOfLines={1}>{a.name}</Text><TouchableOpacity onPress={() => removeAttachment(i)}><Feather name="x" size={16} color={C.mutedForeground} /></TouchableOpacity></View>)}</View>}
          </View>
          {error ? <View style={styles.errorBox}><Text style={styles.errorText}>{error}</Text></View> : null}
          <TouchableOpacity style={[styles.submitBtn, submitting && styles.submitBtnDisabled]} disabled={submitting} onPress={handleProceed}>
            <Text style={styles.submitText}>{submitting ? (lang === "ar" ? "جارٍ الإرسال..." : "Sending...") : (lang === "ar" ? "إرسال الطلب إلى المحامي" : "Send request to lawyer")}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: C.background },
  topBar: { height: 60, paddingHorizontal: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border },
  backBtn: { width: 42, height: 42, alignItems: "center", justifyContent: "center" },
  topTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground },
  profileCard: { alignItems: "center", paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: C.border },
  avatar: { width: 82, height: 82, borderRadius: 41, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginBottom: 12 },
  avatarText: { fontSize: 30, fontFamily: "Inter_700Bold", color: C.gold },
  lawyerName: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  specialization: { marginTop: 4, fontSize: 14, color: C.mutedForeground, fontFamily: "Inter_500Medium" },
  rate: { marginTop: 8, fontSize: 15, color: C.gold, fontFamily: "Inter_700Bold" },
  section: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: C.border },
  calendarSection: { padding: 20, borderBottomWidth: 1, borderBottomColor: C.border },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, marginBottom: 10 },
  typeRow: { gap: 10 },
  typeBtn: { flex: 1, minHeight: 64, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, backgroundColor: C.card, alignItems: "center", justifyContent: "center", gap: 6 },
  typeBtnActive: { borderColor: C.gold, backgroundColor: "#F7F4EA" },
  typeText: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_500Medium" },
  typeTextActive: { color: C.navy, fontFamily: "Inter_700Bold" },
  input: { minHeight: 48, borderWidth: 1.5, borderColor: C.border, borderRadius: 12, backgroundColor: C.card, paddingHorizontal: 14, color: C.foreground, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 120, paddingTop: 12, textAlignVertical: "top" },
  attachmentHeader: { justifyContent: "space-between", alignItems: "center" },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 6, borderWidth: 1, borderColor: C.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 7 },
  attachText: { color: C.navy, fontFamily: "Inter_600SemiBold", fontSize: 12 },
  attachmentsList: { gap: 8, marginTop: 10 },
  attachmentItem: { justifyContent: "space-between", alignItems: "center", padding: 10, borderRadius: 10, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  attachmentName: { flex: 1, marginHorizontal: 8, color: C.foreground, fontFamily: "Inter_400Regular", fontSize: 12 },
  errorBox: { marginHorizontal: 20, marginTop: 16, padding: 12, borderRadius: 10, backgroundColor: "#FEE2E2" },
  errorText: { color: "#B91C1C", textAlign: "right", fontFamily: "Inter_500Medium", fontSize: 13 },
  submitBtn: { marginHorizontal: 20, marginTop: 16, minHeight: 54, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.background, padding: 20 },
  notFoundText: { fontSize: 16, color: C.foreground, fontFamily: "Inter_600SemiBold", marginBottom: 16 },
  backLink: { color: C.navy, fontFamily: "Inter_600SemiBold" },
});
