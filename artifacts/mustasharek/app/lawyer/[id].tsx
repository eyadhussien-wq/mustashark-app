import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { getCurrency, rateLabel } from "@/utils/currency";

const C = colors.light;

const TIMES = ["09:00", "10:00", "11:00", "12:00", "14:00", "15:00", "16:00", "17:00"];
const TYPES = [
  { id: "video" as const, label: "مكالمة فيديو", icon: "video" },
  { id: "phone" as const, label: "مكالمة هاتفية", icon: "phone" },
  { id: "chat" as const, label: "محادثة نصية", icon: "message-square" },
];

interface Attachment {
  name: string;
  uri: string;
  type: "image" | "file";
}

function getAvailableDates() {
  const dates: string[] = [];
  const today = new Date();
  for (let i = 1; i <= 14; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    if (d.getDay() !== 5 && d.getDay() !== 6) {
      dates.push(d.toISOString().split("T")[0]);
    }
  }
  return dates;
}

export default function LawyerDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const { getLawyerById } = useData();
  const lawyer = getLawyerById(id ?? "");

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedType, setSelectedType] = useState<"video" | "phone" | "chat">("video");
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [error, setError] = useState("");

  const dates = getAvailableDates();

  if (!lawyer) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>المحامي غير موجود</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  async function pickAttachment() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
      allowsMultipleSelection: true,
    });
    if (!result.canceled) {
      const newFiles: Attachment[] = result.assets.map((a) => ({
        name: a.fileName ?? `مرفق_${Date.now()}.jpg`,
        uri: a.uri,
        type: "image",
      }));
      setAttachments((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  }

  function removeAttachment(index: number) {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  }

  function handleProceed() {
    setError("");
    if (!subject.trim()) { setError("يرجى إدخال موضوع الاستشارة"); return; }
    if (!description.trim()) { setError("يرجى إدخال وصف المشكلة"); return; }
    if (!selectedDate) { setError("يرجى اختيار التاريخ"); return; }
    if (!selectedTime) { setError("يرجى اختيار الوقت"); return; }
    if (!user) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    router.push({
      pathname: "/payment",
      params: {
        lawyerId: lawyer!.id,
        lawyerName: lawyer!.name,
        lawyerSpecialization: lawyer!.specialization,
        lawyerCountry: lawyer!.country,
        subject,
        description,
        date: selectedDate,
        time: selectedTime,
        type: selectedType,
        price: String(lawyer!.hourlyRate),
        attachments: JSON.stringify(attachments.map((a) => a.name)),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={C.foreground} />
          </TouchableOpacity>
        </View>

        {/* Profile card */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{lawyer.name.charAt(0)}</Text>
          </View>
          <Text style={styles.lawyerName}>{lawyer.name}</Text>
          <Text style={styles.lawyerSpec}>{lawyer.specialization}</Text>
          <Text style={styles.lawyerCountry}>
            {lawyer.country === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن"}
          </Text>

          {lawyer.licenseVerified && (
            <View style={styles.verifiedBadge}>
              <Feather name="check-circle" size={13} color={C.success} />
              <Text style={styles.verifiedText}>محامٍ موثّق ومرخّص</Text>
              <Text style={styles.licenseNum}>{lawyer.licenseNumber}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Text style={styles.statVal}>{lawyer.rating > 0 ? lawyer.rating.toFixed(1) : "جديد"}</Text>
              <Feather name="star" size={14} color={C.gold} />
              <Text style={styles.statLabel}>التقييم</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{lawyer.experience}</Text>
              <Text style={styles.statLabel}>سنة خبرة</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statVal}>{lawyer.hourlyRate}</Text>
              <Text style={styles.statLabel}>{rateLabel(lawyer.country)}</Text>
            </View>
          </View>
        </View>

        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>نبذة عن المحامي</Text>
          <Text style={styles.bioText}>{lawyer.bio}</Text>
        </View>

        {!lawyer.available && (
          <View style={styles.unavailableBanner}>
            <Feather name="clock" size={16} color={C.warning} />
            <Text style={styles.unavailableText}>المحامي غير متاح حالياً للاستشارات الجديدة</Text>
          </View>
        )}

        {lawyer.available && (
          <>
            {/* Consultation type */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>نوع الاستشارة</Text>
              <View style={styles.typeRow}>
                {TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.typeBtn, selectedType === t.id && styles.typeBtnActive]}
                    onPress={() => setSelectedType(t.id)}
                  >
                    <Feather name={t.icon as any} size={18} color={selectedType === t.id ? "#fff" : C.mutedForeground} />
                    <Text style={[styles.typeText, selectedType === t.id && styles.typeTextActive]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Subject */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>موضوع الاستشارة</Text>
              <TextInput
                style={styles.fieldInput}
                placeholder="مثال: مراجعة عقد إيجار"
                value={subject}
                onChangeText={setSubject}
                placeholderTextColor={C.mutedForeground}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>وصف المشكلة</Text>
              <TextInput
                style={[styles.fieldInput, styles.textArea]}
                placeholder="اشرح وضعك القانوني بالتفصيل..."
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                placeholderTextColor={C.mutedForeground}
              />
            </View>

            {/* Date */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>اختر التاريخ</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={styles.dateRow}>
                  {dates.slice(0, 8).map((d) => {
                    const date = new Date(d);
                    const day = date.toLocaleDateString("ar-SA", { weekday: "short" });
                    const num = date.getDate();
                    return (
                      <TouchableOpacity
                        key={d}
                        style={[styles.dateCard, selectedDate === d && styles.dateCardActive]}
                        onPress={() => setSelectedDate(d)}
                      >
                        <Text style={[styles.dayText, selectedDate === d && styles.dateTextActive]}>{day}</Text>
                        <Text style={[styles.dateNum, selectedDate === d && styles.dateTextActive]}>{num}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </ScrollView>
            </View>

            {/* Time */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>اختر الوقت</Text>
              <View style={styles.timesGrid}>
                {TIMES.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                    onPress={() => setSelectedTime(t)}
                  >
                    <Text style={[styles.timeText, selectedTime === t && styles.timeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* ── Attachments section ───────────────────────────────────── */}
            <View style={styles.section}>
              <View style={styles.attachHeader}>
                <View style={styles.attachBadge}>
                  <Text style={styles.attachBadgeText}>اختياري</Text>
                </View>
                <Text style={styles.sectionTitle}>إرفاق وثائق أو صور القضية</Text>
              </View>
              <Text style={styles.attachSub}>
                أرفق عقوداً أو صوراً أو وثائق تساعد المحامي في فهم قضيتك (PDF، JPG، PNG)
              </Text>

              {/* Uploaded list */}
              {attachments.length > 0 && (
                <View style={styles.attachList}>
                  {attachments.map((file, i) => (
                    <View key={i} style={styles.attachItem}>
                      <View style={styles.attachItemIcon}>
                        <Feather name="file" size={16} color={C.navy} />
                      </View>
                      <Text style={styles.attachItemName} numberOfLines={1}>{file.name}</Text>
                      <TouchableOpacity onPress={() => removeAttachment(i)} style={styles.attachRemove}>
                        <Feather name="x" size={14} color={C.destructive} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[styles.attachBtn, attachments.length >= 5 && { opacity: 0.5 }]}
                onPress={pickAttachment}
                disabled={attachments.length >= 5}
                activeOpacity={0.8}
              >
                <View style={styles.attachBtnIcon}>
                  <Feather name="upload-cloud" size={22} color={C.gold} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.attachBtnTitle}>إرفاق وثائق أو صور القضية</Text>
                  <Text style={styles.attachBtnSub}>
                    {attachments.length === 0
                      ? "اضغط لاختيار ملفات · حتى 5 مرفقات"
                      : `${attachments.length} مرفق · اضغط لإضافة المزيد`}
                  </Text>
                </View>
                <View style={styles.attachBtnFormats}>
                  {["PDF", "JPG", "PNG"].map((f) => (
                    <View key={f} style={styles.formatPill}>
                      <Text style={styles.formatPillText}>{f}</Text>
                    </View>
                  ))}
                </View>
              </TouchableOpacity>
            </View>

            {/* Error */}
            {!!error && (
              <View style={styles.errorBox}>
                <Feather name="alert-circle" size={14} color={C.destructive} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Price row */}
            <View style={styles.priceRow}>
              <View>
                <Text style={styles.priceLabel}>رسوم الاستشارة</Text>
                <Text style={styles.priceSub}>ساعة واحدة</Text>
              </View>
              <View style={styles.priceRight}>
                <Text style={styles.priceAmount}>{lawyer.hourlyRate}</Text>
                <Text style={styles.priceCurrency}>{getCurrency(lawyer.country)}</Text>
              </View>
            </View>

            {/* CTA → Payment */}
            <TouchableOpacity
              style={styles.bookBtn}
              onPress={handleProceed}
              activeOpacity={0.85}
            >
              <Feather name="credit-card" size={18} color={C.navy} />
              <Text style={styles.bookText}>متابعة للدفع</Text>
              <Feather name="arrow-left" size={16} color={C.navy} />
            </TouchableOpacity>

            <Text style={styles.bookNote}>
              ستنتقل لشاشة الدفع الآمن لإتمام الحجز
            </Text>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20 },
  topBar: { marginBottom: 16 },
  backBtn: { alignSelf: "flex-end", padding: 4 },

  // Profile
  profileCard: {
    backgroundColor: C.navy, borderRadius: 20, padding: 24,
    alignItems: "center", gap: 8, marginBottom: 16,
  },
  avatar: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: "rgba(201,160,53,0.2)", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.gold,
  },
  avatarText: { fontSize: 32, color: "#fff", fontFamily: "Inter_700Bold" },
  lawyerName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  lawyerSpec: { fontSize: 14, color: C.gold, fontFamily: "Inter_500Medium" },
  lawyerCountry: { fontSize: 13, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "rgba(16,185,129,0.15)", paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 20, marginTop: 4,
  },
  verifiedText: { fontSize: 12, color: C.success, fontFamily: "Inter_500Medium" },
  licenseNum: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  statsRow: {
    flexDirection: "row", alignItems: "center",
    borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.1)",
    marginTop: 12, paddingTop: 14, width: "100%",
  },
  stat: { flex: 1, alignItems: "center", gap: 2 },
  statVal: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  statLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, height: 30, backgroundColor: "rgba(255,255,255,0.1)" },

  // Bio
  bioCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    padding: 16, marginBottom: 16, borderWidth: 1, borderColor: C.border, gap: 8,
  },
  bioTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.primary, textAlign: "right" },
  bioText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 22, textAlign: "right" },

  unavailableBanner: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#FEF3C7", borderRadius: colors.radius, padding: 14, marginBottom: 16,
  },
  unavailableText: { fontSize: 13, color: C.warning, fontFamily: "Inter_500Medium", flex: 1, textAlign: "right" },

  // Form sections
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, marginBottom: 10, textAlign: "right" },
  typeRow: { flexDirection: "row", gap: 8 },
  typeBtn: {
    flex: 1, alignItems: "center", gap: 6, paddingVertical: 12,
    borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  typeBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
  typeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  typeTextActive: { color: "#fff" },
  fieldInput: {
    backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right",
  },
  textArea: { minHeight: 96, paddingTop: 12, textAlignVertical: "top" },
  dateRow: { flexDirection: "row", gap: 10, paddingVertical: 4 },
  dateCard: {
    width: 56, alignItems: "center", paddingVertical: 12, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, gap: 4,
  },
  dateCardActive: { backgroundColor: C.navy, borderColor: C.navy },
  dayText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  dateNum: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground },
  dateTextActive: { color: "#fff" },
  timesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  timeChip: {
    paddingHorizontal: 18, paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  timeChipActive: { backgroundColor: C.primary, borderColor: C.primary },
  timeText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.foreground },
  timeTextActive: { color: "#fff" },

  // Attachments
  attachHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  attachBadge: {
    backgroundColor: "rgba(201,160,53,0.15)", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: "rgba(201,160,53,0.25)",
  },
  attachBadgeText: { fontSize: 10, color: C.gold, fontFamily: "Inter_700Bold" },
  attachSub: {
    fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular",
    textAlign: "right", lineHeight: 18, marginBottom: 12,
  },
  attachList: { gap: 8, marginBottom: 10 },
  attachItem: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "#EEF2F8", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    borderWidth: 1, borderColor: "rgba(27,58,107,0.1)",
  },
  attachItemIcon: {
    width: 32, height: 32, borderRadius: 8,
    backgroundColor: "rgba(27,58,107,0.1)",
    alignItems: "center", justifyContent: "center",
  },
  attachItemName: { flex: 1, fontSize: 13, color: C.foreground, fontFamily: "Inter_500Medium", textAlign: "right" },
  attachRemove: { padding: 4 },
  attachBtn: {
    flexDirection: "row", alignItems: "center", gap: 12,
    borderWidth: 2, borderStyle: "dashed", borderColor: "rgba(201,160,53,0.4)",
    borderRadius: 14, padding: 16, backgroundColor: "#FFFCF3",
  },
  attachBtnIcon: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: "rgba(201,160,53,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  attachBtnTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  attachBtnSub: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  attachBtnFormats: { gap: 3 },
  formatPill: {
    backgroundColor: "rgba(201,160,53,0.15)", borderRadius: 5,
    paddingHorizontal: 5, paddingVertical: 2,
  },
  formatPillText: { fontSize: 9, color: C.gold, fontFamily: "Inter_700Bold" },

  // Error
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 12,
  },
  errorText: { flex: 1, fontSize: 13, color: C.destructive, fontFamily: "Inter_500Medium", textAlign: "right" },

  // Price
  priceRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "#EEF2F8", borderRadius: colors.radius, padding: 16, marginBottom: 16,
    borderWidth: 1, borderColor: C.secondary,
  },
  priceLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.navy, textAlign: "right" },
  priceSub: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  priceRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  priceAmount: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.navy },
  priceCurrency: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Book button → Payment
  bookBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, backgroundColor: C.gold, borderRadius: colors.radius, paddingVertical: 16,
    marginBottom: 8,
  },
  bookText: { color: C.navy, fontSize: 17, fontFamily: "Inter_700Bold", flex: 1, textAlign: "center" },
  bookNote: { fontSize: 11, color: C.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular", marginBottom: 8 },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.foreground },
  backLink: { fontSize: 14, color: C.primary, fontFamily: "Inter_500Medium" },
});
