import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import type { Consultation, SlotInfo } from "@/contexts/DataContext";

const C = colors.light;
const QATAR_TZ = "Asia/Qatar";

type CalendarMode = "booking" | "agenda";

interface ProfessionalCalendarProps {
  lang: "ar" | "en";
  selectedDate: string;
  onDateChange: (date: string) => void;
  days: Array<{ date: string; dayNum: number; monthLabel: string; weekdayLabel: string; isToday?: boolean }>;
  mode: CalendarMode;
  slots?: SlotInfo[];
  selectedTime?: string;
  onTimeChange?: (time: string) => void;
  consultations?: Consultation[];
  title?: string;
}

function parseWallClockDate(date: string) {
  const [year, month, day] = date.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

function formatDateLabel(date: string, lang: "ar" | "en") {
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-QA" : "en-US", {
    timeZone: QATAR_TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(parseWallClockDate(date));
}

function timeLabel(time: string, lang: "ar" | "en" = "ar") {
  const [h, m] = time.split(":").map(Number);
  const hour = h % 12 || 12;
  if (lang === "ar") return `${hour}:${String(m).padStart(2, "0")} ${h >= 12 ? "م" : "ص"}`;
  return `${hour}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
}

export function ProfessionalCalendar({
  lang,
  selectedDate,
  onDateChange,
  days,
  mode,
  slots = [],
  selectedTime = "",
  onTimeChange,
  consultations = [],
  title,
}: ProfessionalCalendarProps) {
  const isArabic = lang === "ar";
  const dayEvents = useMemo(
    () => consultations.filter((c) => c.date === selectedDate).sort((a, b) => a.time.localeCompare(b.time)),
    [consultations, selectedDate],
  );
  const availableCount = slots.filter((s) => s.available).length;

  return (
    <View style={styles.shell}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Feather name="calendar" size={19} color={C.gold} />
        </View>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>{title ?? (isArabic ? "المواعيد" : "Schedule")}</Text>
          <Text style={styles.subtitle}>{formatDateLabel(selectedDate, lang)}</Text>
        </View>
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text style={styles.liveText}>{mode === "booking" ? (isArabic ? `${availableCount} متاح` : `${availableCount} open`) : (isArabic ? `${dayEvents.length} موعد` : `${dayEvents.length} events`)}</Text>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.daysContent}>
        {days.map((day) => {
          const active = day.date === selectedDate;
          return (
            <TouchableOpacity key={day.date} style={[styles.dayCard, active && styles.dayCardActive]} onPress={() => onDateChange(day.date)} activeOpacity={0.86}>
              {day.isToday && <Text style={[styles.todayLabel, active && styles.todayLabelActive]}>{isArabic ? "اليوم" : "Today"}</Text>}
              <Text style={[styles.weekday, active && styles.activeText]}>{day.weekdayLabel}</Text>
              <Text style={[styles.dayNum, active && styles.activeText]}>{day.dayNum}</Text>
              <Text style={[styles.month, active && styles.activeText]}>{day.monthLabel}</Text>
              {active && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.divider} />

      {mode === "booking" ? (
        <View>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{isArabic ? "الأوقات المتاحة" : "Available times"}</Text>
            <Text style={styles.sectionHint}>{isArabic ? "اختر وقتاً واحداً" : "Choose one time"}</Text>
          </View>
          {slots.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Feather name="clock" size={20} color={C.mutedForeground} /></View>
              <Text style={styles.emptyTitle}>{isArabic ? "لا توجد أوقات متاحة" : "No times available"}</Text>
              <Text style={styles.emptyText}>{isArabic ? "جرّب يوماً آخر من الشريط أعلاه." : "Try another day above."}</Text>
            </View>
          ) : (
            <View style={styles.timeGrid}>
              {slots.map((slot) => {
                const active = selectedTime === slot.time;
                return (
                  <TouchableOpacity
                    key={slot.time}
                    disabled={!slot.available}
                    onPress={() => onTimeChange?.(slot.time)}
                    style={[styles.timeCard, !slot.available && styles.timeCardDisabled, active && styles.timeCardActive]}
                    activeOpacity={0.82}
                  >
                    <Feather name="clock" size={15} color={active ? "#fff" : slot.available ? C.navy : C.mutedForeground} />
                    <Text style={[styles.timeText, !slot.available && styles.timeTextDisabled, active && styles.timeTextActive]}>{timeLabel(slot.time, lang)}</Text>
                    {!slot.available && <Text style={styles.busyText}>{isArabic ? "محجوز" : "Booked"}</Text>}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
      ) : (
        <View>
          <View style={styles.sectionHeading}>
            <Text style={styles.sectionTitle}>{isArabic ? "جدول اليوم" : "Day agenda"}</Text>
            <Text style={styles.sectionHint}>{isArabic ? "مواعيدك المؤكدة والطلبات" : "Confirmed appointments & requests"}</Text>
          </View>
          {dayEvents.length === 0 ? (
            <View style={styles.empty}>
              <View style={styles.emptyIcon}><Feather name="calendar" size={20} color={C.mutedForeground} /></View>
              <Text style={styles.emptyTitle}>{isArabic ? "اليوم خالٍ" : "Nothing scheduled"}</Text>
              <Text style={styles.emptyText}>{isArabic ? "لا توجد استشارات في هذا اليوم." : "No consultations are scheduled for this day."}</Text>
            </View>
          ) : dayEvents.map((event) => {
            const pending = event.status === "pending";
            return (
              <View key={event.id} style={styles.eventCard}>
                <View style={[styles.eventTime, pending && styles.eventTimePending]}>
                  <Text style={[styles.eventHour, pending && styles.eventPendingText]}>{timeLabel(event.time, lang)}</Text>
                  <Text style={[styles.eventType, pending && styles.eventPendingText]}>{event.type === "video" ? (isArabic ? "فيديو" : "Video") : event.type === "phone" ? (isArabic ? "هاتف" : "Phone") : (isArabic ? "محادثة" : "Chat")}</Text>
                </View>
                <View style={styles.eventCopy}>
                  <Text style={styles.eventName}>{event.clientName}</Text>
                  <Text style={styles.eventSubject} numberOfLines={1}>{event.subject}</Text>
                  <View style={styles.eventMeta}>
                    <View style={[styles.statusPill, pending ? styles.pendingPill : styles.acceptedPill]}>
                      <Text style={[styles.statusText, pending ? styles.pendingText : styles.acceptedText]}>{pending ? (isArabic ? "طلب جديد" : "New request") : (isArabic ? "مؤكد" : "Confirmed")}</Text>
                    </View>
                    <Text style={styles.eventDuration}>{event.price > 0 ? `${event.price} ${isArabic ? "ر.ق" : "QAR"}` : ""}</Text>
                  </View>
                </View>
                <View style={styles.eventIcon}><Feather name={event.type === "video" ? "video" : event.type === "phone" ? "phone" : "message-square"} size={17} color={C.navy} /></View>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

export function buildCalendarDays(workingDays: number[], lang: "ar" | "en", horizon = 21) {
  const result: Array<{ date: string; dayNum: number; monthLabel: string; weekdayLabel: string; isToday?: boolean }> = [];
  const qatarFormatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: QATAR_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const todayParts = qatarFormatter.formatToParts(new Date());
  const year = Number(todayParts.find((part) => part.type === "year")?.value);
  const month = Number(todayParts.find((part) => part.type === "month")?.value);
  const day = Number(todayParts.find((part) => part.type === "day")?.value);
  const now = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  const weekdayAR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const weekdayEN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const monthAR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
  const monthEN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  for (let i = 0; i < horizon; i++) {
    const d = new Date(now.getTime() + i * 86_400_000);
    const weekday = d.getUTCDay();
    if (!workingDays.includes(weekday)) continue;
    const date = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    result.push({ date, dayNum: d.getUTCDate(), monthLabel: lang === "ar" ? monthAR[d.getUTCMonth()] : monthEN[d.getUTCMonth()], weekdayLabel: lang === "ar" ? weekdayAR[weekday] : weekdayEN[weekday], isToday: i === 0 });
  }
  return result;
}

const styles = StyleSheet.create({
  shell: { backgroundColor: C.card, borderRadius: 22, borderWidth: 1, borderColor: C.border, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  header: { flexDirection: "row", alignItems: "center", padding: 16, gap: 11 },
  headerIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "rgba(201,160,53,0.13)", alignItems: "center", justifyContent: "center" },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  subtitle: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 3, textAlign: "right" },
  livePill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: "#ECFDF5" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  liveText: { fontSize: 9, color: C.success, fontFamily: "Inter_700Bold" },
  daysContent: { paddingHorizontal: 13, paddingBottom: 14, gap: 8 },
  dayCard: { width: 66, minHeight: 84, borderRadius: 16, backgroundColor: C.background, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center", paddingVertical: 8, position: "relative" },
  dayCardActive: { backgroundColor: C.navy, borderColor: C.navy },
  todayLabel: { fontSize: 8, color: C.gold, fontFamily: "Inter_700Bold", marginBottom: 3 },
  todayLabelActive: { color: C.gold },
  weekday: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_600SemiBold" },
  dayNum: { fontSize: 23, color: C.foreground, fontFamily: "Inter_700Bold", marginVertical: 1 },
  month: { fontSize: 8, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  activeText: { color: "#fff" },
  activeIndicator: { position: "absolute", bottom: 6, width: 18, height: 3, borderRadius: 2, backgroundColor: C.gold },
  divider: { height: 1, backgroundColor: C.border },
  sectionHeading: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: 16, paddingTop: 15, paddingBottom: 11 },
  sectionTitle: { fontSize: 13, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  sectionHint: { fontSize: 9, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "left" },
  timeGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, paddingHorizontal: 13, paddingBottom: 16 },
  timeCard: { minWidth: "30%", flexGrow: 1, flexBasis: "30%", minHeight: 52, borderRadius: 13, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.background, alignItems: "center", justifyContent: "center", gap: 3, paddingHorizontal: 6 },
  timeCardActive: { backgroundColor: C.navy, borderColor: C.navy },
  timeCardDisabled: { opacity: 0.48, backgroundColor: "#F3F4F6" },
  timeText: { fontSize: 11, color: C.navy, fontFamily: "Inter_700Bold" },
  timeTextActive: { color: "#fff" },
  timeTextDisabled: { color: C.mutedForeground, textDecorationLine: "line-through" },
  busyText: { fontSize: 7, color: C.mutedForeground, fontFamily: "Inter_500Medium" },
  empty: { alignItems: "center", paddingHorizontal: 24, paddingVertical: 26 },
  emptyIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.background, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  emptyTitle: { fontSize: 12, color: C.foreground, fontFamily: "Inter_700Bold" },
  emptyText: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
  eventCard: { flexDirection: "row", alignItems: "center", marginHorizontal: 13, marginBottom: 9, padding: 11, borderRadius: 15, borderWidth: 1, borderColor: C.border, backgroundColor: C.background, gap: 10 },
  eventTime: { width: 70, alignItems: "center", paddingVertical: 8, borderRadius: 11, backgroundColor: "#EEF2F8" },
  eventTimePending: { backgroundColor: "#FEF7E7" },
  eventHour: { fontSize: 11, color: C.navy, fontFamily: "Inter_700Bold" },
  eventType: { fontSize: 8, color: C.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 2 },
  eventPendingText: { color: C.warning },
  eventCopy: { flex: 1, alignItems: "flex-end" },
  eventName: { fontSize: 12, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  eventSubject: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "right", maxWidth: "100%" },
  eventMeta: { flexDirection: "row", alignItems: "center", gap: 7, marginTop: 6 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 7 },
  pendingPill: { backgroundColor: "#FEF3C7" },
  acceptedPill: { backgroundColor: "#ECFDF5" },
  statusText: { fontSize: 8, fontFamily: "Inter_700Bold" },
  pendingText: { color: C.warning },
  acceptedText: { color: C.success },
  eventDuration: { fontSize: 9, color: C.mutedForeground, fontFamily: "Inter_500Medium" },
  eventIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "rgba(26,42,74,0.08)", alignItems: "center", justifyContent: "center" },
});