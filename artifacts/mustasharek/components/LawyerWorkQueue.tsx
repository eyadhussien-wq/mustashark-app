import React from "react";
import { StyleSheet, Text, View } from "react-native";
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
  return (
    <>
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
