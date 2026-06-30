import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData, type Availability, type CommunicationChannels } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";

const C = colors.light;
const DAYS = [
  { idx: 1, ar: "الإثنين", en: "Mon" },
  { idx: 2, ar: "الثلاثاء", en: "Tue" },
  { idx: 3, ar: "الأربعاء", en: "Wed" },
  { idx: 4, ar: "الخميس", en: "Thu" },
  { idx: 5, ar: "الجمعة", en: "Fri" },
  { idx: 6, ar: "السبت", en: "Sat" },
  { idx: 0, ar: "الأحد", en: "Sun" },
];
const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

export default function LawyerSettings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { lawyers, updateLawyerAvailability, updateLawyerChannels } = useData();
  const { t, lang } = useLanguage();

  const lawyer = lawyers.find((l) => l.id === user?.id);
  const currentAvail = lawyer?.availability;

  const [workingDays, setWorkingDays] = useState<number[]>(
    currentAvail?.workingDays ?? [1, 2, 3, 4, 5]
  );
  const [startHour, setStartHour] = useState(currentAvail?.startHour ?? "09:00");
  const [endHour, setEndHour] = useState(currentAvail?.endHour ?? "17:00");
  const [slotDuration, setSlotDuration] = useState<30 | 60>(
    currentAvail?.slotDuration ?? 60
  );
  const [saving, setSaving] = useState(false);

  // Communication channels state
  const defaultChannels: CommunicationChannels = { chat: true, phone: true, video: true };
  const currentChannels = lawyer?.channels ?? defaultChannels;
  const [channels, setChannels] = useState<CommunicationChannels>(currentChannels);

  function toggleDay(day: number) {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  }

  async function handleSave() {
    if (!user) return;
    const start = parseInt(startHour.split(":")[0], 10);
    const end = parseInt(endHour.split(":")[0], 10);
    if (start >= end) {
      Alert.alert(t("error"), t("tryAgain"));
      return;
    }
    if (workingDays.length === 0) {
      Alert.alert(t("error"), t("tryAgain"));
      return;
    }

    setSaving(true);
    const availability: Availability = { workingDays, startHour, endHour, slotDuration };
    await updateLawyerAvailability(user.id, availability);
    await updateLawyerChannels(user.id, channels);
    setSaving(false);
    Alert.alert(t("done"), t("consultationSent"), [{ text: t("back"), onPress: () => router.back() }]);
  }

  const labelAlign = lang === "ar" ? "right" : "left";
  const rowDir = lang === "ar" ? "row-reverse" : "row";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={{
        paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
    >
      {/* Header */}
      <View style={[styles.header, { flexDirection: rowDir }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name={lang === "ar" ? "arrow-right" : "arrow-left"} size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.title}>{t("availability")}</Text>
        <View style={{ width: 30 }} />
      </View>

      {/* Working Days */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: labelAlign }]}>{t("workingDays")}</Text>
        <View style={styles.daysRow}>
          {DAYS.map((d) => {
            const active = workingDays.includes(d.idx);
            return (
              <TouchableOpacity
                key={d.idx}
                style={[styles.dayChip, active && styles.dayChipActive]}
                onPress={() => toggleDay(d.idx)}
                activeOpacity={0.8}
              >
                <Text style={[styles.dayText, active && styles.dayTextActive]}>
                  {lang === "ar" ? d.ar : d.en}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Hours */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: labelAlign }]}>
          {t("startHour")} — {t("endHour")}
        </Text>
        <View style={[styles.hoursRow, { flexDirection: rowDir }]}>
          <View style={styles.hourBox}>
            <Text style={[styles.hourLabel, { textAlign: labelAlign }]}>{t("startHour")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.hourChips}>
                {HOURS.slice(0, 18).map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourChip, startHour === h && styles.hourChipActive]}
                    onPress={() => setStartHour(h)}
                  >
                    <Text style={[styles.hourChipText, startHour === h && styles.hourChipTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
          <View style={styles.hourBox}>
            <Text style={[styles.hourLabel, { textAlign: labelAlign }]}>{t("endHour")}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.hourChips}>
                {HOURS.slice(12, 24).map((h) => (
                  <TouchableOpacity
                    key={h}
                    style={[styles.hourChip, endHour === h && styles.hourChipActive]}
                    onPress={() => setEndHour(h)}
                  >
                    <Text style={[styles.hourChipText, endHour === h && styles.hourChipTextActive]}>{h}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>
      </View>

      {/* Slot Duration */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: labelAlign }]}>{t("slotDuration")}</Text>
        <View style={[styles.durationRow, { flexDirection: rowDir }]}>
          <TouchableOpacity
            style={[styles.durationChip, slotDuration === 30 && styles.durationChipActive]}
            onPress={() => setSlotDuration(30)}
          >
            <Text style={[styles.durationText, slotDuration === 30 && styles.durationTextActive]}>
              30 {t("minutes")}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.durationChip, slotDuration === 60 && styles.durationChipActive]}
            onPress={() => setSlotDuration(60)}
          >
            <Text style={[styles.durationText, slotDuration === 60 && styles.durationTextActive]}>
              1 {t("hours")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Preview */}
      <View style={styles.previewBox}>
        <Feather name="calendar" size={16} color={C.gold} />
        <Text style={styles.previewText}>
          {workingDays.length} {t("workingDays")} · {startHour}–{endHour} · {slotDuration} {t("minutes")}
        </Text>
      </View>

      {/* Communication Channels */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { textAlign: labelAlign }]}>قنوات التواصل</Text>
        <Text style={[styles.sectionHint, { textAlign: labelAlign }]}>
          اختر القنوات المتاحة للعملاء لحجز استشاراتك
        </Text>
        {[
          { key: "chat" as const, label: "محادثة نصية", icon: "message-square" },
          { key: "phone" as const, label: "مكالمة صوتية", icon: "phone" },
          { key: "video" as const, label: "مكالمة فيديو", icon: "video" },
        ].map((ch) => (
          <View key={ch.key} style={[styles.channelRow, { flexDirection: rowDir }]}>
            <View style={[styles.channelLeft, { flexDirection: rowDir }]}>
              <View style={[styles.channelIcon, { backgroundColor: channels[ch.key] ? C.navy + "18" : C.border + "30" }]}>
                <Feather name={ch.icon as any} size={16} color={channels[ch.key] ? C.navy : C.mutedForeground} />
              </View>
              <Text style={[styles.channelLabel, channels[ch.key] ? styles.channelLabelActive : styles.channelLabelInactive]}>
                {ch.label}
              </Text>
            </View>
            <Switch
              value={channels[ch.key]}
              onValueChange={(v) => setChannels((prev) => ({ ...prev, [ch.key]: v }))}
              trackColor={{ false: C.border, true: C.navy }}
              thumbColor={"#fff"}
              ios_backgroundColor={C.border}
            />
          </View>
        ))}
      </View>

      {/* Save */}
      <TouchableOpacity
        style={[styles.saveBtn, saving && { opacity: 0.65 }]}
        onPress={handleSave}
        disabled={saving}
        activeOpacity={0.85}
      >
        <Feather name="save" size={16} color="#fff" />
        <Text style={styles.saveBtnText}>{saving ? t("loading") : t("save")}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingVertical: 16, gap: 10 },
  backBtn: { padding: 4 },
  title: { flex: 1, fontSize: 20, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "center" },

  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, marginBottom: 12 },

  daysRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dayChip: {
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  dayChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  dayText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  dayTextActive: { color: "#fff", fontFamily: "Inter_700Bold" },

  hoursRow: { gap: 12 },
  hourBox: { flex: 1, gap: 6 },
  hourLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  hourChips: { flexDirection: "row", gap: 6 },
  hourChip: {
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  hourChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  hourChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.foreground },
  hourChipTextActive: { color: "#fff", fontFamily: "Inter_700Bold" },

  durationRow: { gap: 10 },
  durationChip: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  durationChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  durationText: { fontSize: 14, fontFamily: "Inter_500Medium", color: C.foreground },
  durationTextActive: { color: "#fff", fontFamily: "Inter_700Bold" },

  previewBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "rgba(201,160,53,0.1)", borderWidth: 1,
    borderColor: "rgba(201,160,53,0.25)", borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 20,
  },
  previewText: { fontSize: 13, color: C.gold, fontFamily: "Inter_600SemiBold" },

  saveBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: C.navy, borderRadius: 14, paddingVertical: 16,
  },
  saveBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  // ── Communication Channels ──
  sectionHint: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 12, marginTop: -4 },
  channelRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: C.border,
  },
  channelLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  channelIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  channelLabel: { fontSize: 14, fontFamily: "Inter_500Medium" },
  channelLabelActive: { color: C.foreground },
  channelLabelInactive: { color: C.mutedForeground },
});
