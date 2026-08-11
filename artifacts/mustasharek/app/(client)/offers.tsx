import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";
import { UnifiedServiceOfferCard } from "@/components/UnifiedServiceOfferCard";
import type { ServiceKind } from "@/constants/serviceDesign";

const C = colors.light;
type Offer = { id: string; kind: ServiceKind; status: "draft" | "sent" | "accepted" | "rejected" | "expired"; amount: number; title: string; note: string };
const offers: Offer[] = [
  { id: "consult-1", kind: "consultation", status: "sent", amount: 350, title: "استشارة في نزاع تجاري", note: "جلسة استشارية واحدة بعد قبول العرض." },
  { id: "memo-1", kind: "memo", status: "sent", amount: 900, title: "مذكرة قانونية — عقد تجاري", note: "مذكرة مكتوبة وتسليم النسخة النهائية." },
  { id: "rep-1", kind: "representation", status: "accepted", amount: 4500, title: "توكيل وتمثيل — نزاع مدني", note: "العرض مقبول؛ مساحة القضية النشطة متاحة لمتابعة المراحل والدفعات والمستندات." },
];

export default function ClientOffers() {
  const router = useRouter();
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}>
      <View style={styles.headerIcon}><Feather name="file-text" size={22} color={C.gold} /></View>
      <View style={styles.headerCopy}><Text style={styles.eyebrow}>مستشارك</Text><Text style={styles.title}>العروض الموحدة</Text><Text style={styles.subtitle}>كل عرض مرتبط بخدمة واضحة، وقيمة محددة، ونطاق عمل قبل القبول.</Text></View>
    </View>
    <View style={styles.legend}>
      <Feather name="shield" size={15} color={C.gold} /><Text style={styles.legendText}>العرض المقبول يفتح مساحة القضية النشطة لمتابعة التنفيذ. القبول والدفع الحقيقيان سيُربطان بالـBackend لاحقًا.</Text>
    </View>
    {offers.map((offer) => <View key={offer.id}>
      <UnifiedServiceOfferCard kind={offer.kind} status={offer.status} amount={offer.amount} title={offer.title} onPress={() => {
        if (offer.status === "accepted" && offer.kind === "representation") {
          router.push("/(client)/active-case");
          return;
        }
        router.push({ pathname: "/(client)/offer", params: { id: offer.id, kind: offer.kind } });
      }} />
      <Text style={styles.note}>{offer.note}</Text>
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 120 },
  header: { backgroundColor: C.navy, borderRadius: 20, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(201,160,53,.35)", marginBottom: 14 },
  headerIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerCopy: { flex: 1, alignItems: "flex-end" }, eyebrow: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold" }, title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 3, textAlign: "right" }, subtitle: { color: "rgba(255,255,255,.72)", fontSize: 11, lineHeight: 18, marginTop: 4, textAlign: "right", fontFamily: "Inter_400Regular" },
  legend: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 14, backgroundColor: "#FFFCF3", borderWidth: 1, borderColor: "rgba(201,160,53,.3)", marginBottom: 14 }, legendText: { flex: 1, fontSize: 10, lineHeight: 17, color: C.foreground, textAlign: "right", fontFamily: "Inter_400Regular" },
  note: { fontSize: 10, color: C.mutedForeground, textAlign: "right", marginTop: -6, marginBottom: 12, paddingHorizontal: 4, fontFamily: "Inter_400Regular" },
});
