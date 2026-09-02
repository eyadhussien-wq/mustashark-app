import React from "react";
import { StyleSheet, Text, View, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import colors from "@/constants/colors";
import type { LawyerWorkQueueItem } from "@/lib/agenda/lawyerWorkQueue";
import { LawyerAvailabilitySettingsCard } from "@/components/lawyer/LawyerAvailabilitySettingsCard";
import { LawyerClientDirectory } from "@/components/lawyer/LawyerClientDirectory";
import { LawyerConsultationDirectory } from "@/components/lawyer/LawyerConsultationDirectory";

const C = colors.light;

type Props = {
  items: readonly LawyerWorkQueueItem[];
};

export function LawyerWorkQueue({ items }: Props) {
  const router = useRouter();
  const pending = items.filter((item) => item.status === "pending").length;
  const accepted = items.filter((item) => item.status === "accepted").length;
  const next = pending > 0
    ? { title: "لديك طلبات تحتاج مراجعة", detail: `${pending} طلب${pending === 1 ? "" : "ات"} بانتظار قرارك.`, label: "مراجعة الطلبات", onPress: () => router.push({ pathname: "/(lawyer)/requests", params: { initialFilter: "pending" } }) }
    : accepted > 0
      ? { title: "لديك أعمال قادمة", detail: `${accepted} استشارة مقبولة ضمن مساحة عملك.`, label: "فتح الاستشارات", onPress: () => router.push({ pathname: "/(lawyer)/requests", params: { initialFilter: "accepted" } }) }
      : null;

  return (
    <>
      {next && (
        <View style={styles.nextCard} accessibilityLabel="الإجراء التالي للمحامي">
          <View style={styles.nextIcon}><Text style={styles.nextIconText}>→</Text></View>
          <View style={styles.nextCopy}>
            <Text style={styles.nextEyebrow}>الإجراء التالي</Text>
            <Text style={styles.nextTitle}>{next.title}</Text>
            <Text style={styles.nextDetail}>{next.detail}</Text>
          </View>
          <TouchableOpacity style={styles.nextButton} onPress={next.onPress} activeOpacity={0.85}>
            <Text style={styles.nextButtonText}>{next.label}</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={styles.card} accessibilityLabel="طابور أعمال المحامي">
        <Text style={styles.title}>طابور العمل</Text>
        {items.length === 0 ? (
          <Text style={styles.empty}>لا توجد طلبات قيد العمل حالياً.</Text>
        ) : (
          items.map((item) => (
            <View key={item.id} style={styles.item}>
              <View style={styles.copy}>
                <Text style={styles.subject} numberOfLines={1}>{item.subject}</Text>
                <Text style={styles.meta} numberOfLines={1}>{item.clientName} · {item.date} · {item.time}</Text>
              </View>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.status === "pending" ? "جديد" : "مقبول"}</Text>
              </View>
            </View>
          ))
        )}
      </View>
      <LawyerAvailabilitySettingsCard />
      <LawyerClientDirectory />
      <LawyerConsultationDirectory />
    </>
  );
}

const styles = StyleSheet.create({
  nextCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.navy, borderRadius: 18, padding: 14, marginBottom: 16, gap: 10 },
  nextIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(201,160,53,0.15)", alignItems: "center", justifyContent: "center" },
  nextIconText: { color: C.gold, fontSize: 20, fontFamily: "Inter_700Bold" },
  nextCopy: { flex: 1, alignItems: "flex-end" },
  nextEyebrow: { fontSize: 10, color: C.gold, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  nextTitle: { fontSize: 13, color: "#fff", fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 2 },
  nextDetail: { fontSize: 10, color: "rgba(255,255,255,0.68)", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  nextButton: { backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 9, paddingVertical: 8 },
  nextButtonText: { fontSize: 10, color: C.navy, fontFamily: "Inter_700Bold" },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  title: { fontSize: 17, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 12 },
  empty: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_500Medium", textAlign: "right", paddingVertical: 8 },
  item: { flexDirection: "row-reverse", alignItems: "center", gap: 10, borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 11 },
  copy: { flex: 1, alignItems: "flex-end" },
  subject: { fontSize: 13, color: C.foreground, fontFamily: "Inter_600SemiBold" },
  meta: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_500Medium", marginTop: 3 },
  badge: { borderRadius: 999, backgroundColor: "rgba(26,42,74,0.07)", paddingHorizontal: 9, paddingVertical: 5 },
  badgeText: { fontSize: 10, color: C.navy, fontFamily: "Inter_600SemiBold" },
});