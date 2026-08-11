import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

const C = colors.light;

type Service = {
  key: "consultation" | "memorandum" | "representation";
  title: string;
  description: string;
  icon: string;
  note: string;
};

const SERVICES: Service[] = [
  { key: "consultation", title: "استشارة قانونية", description: "جلسة قانونية عبر المحادثة أو الهاتف أو الفيديو.", icon: "message-circle", note: "التسعير والمدة يحددهما المحامي ضمن إعدادات الاستشارات." },
  { key: "memorandum", title: "كتابة وصياغة مذكرات قانونية", description: "إعداد مذكرة قانونية دون توكيل أو حضور أمام المحكمة.", icon: "file-text", note: "يمكن أن تشمل صياغة مذكرة لجلسة محددة أو مراجعة مستندات مرتبطة بها." },
  { key: "representation", title: "توكيل وتمثيل قانوني", description: "تولي القضية وتمثيل العميل وفق اتفاق أتعاب مستقل.", icon: "briefcase", note: "التقسيط والمراحل المالية 30% / 40% / 30% مخصصان لمسار التوكيل فقط." },
];

export default function LawyerServices() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [enabled, setEnabled] = useState<Record<Service["key"], boolean>>({
    consultation: true,
    memorandum: true,
    representation: true,
  });

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity>
        <Text style={styles.title}>الخدمات التي أقدمها</Text>
        <View style={{ width: 30 }} />
      </View>

      <View style={styles.intro}>
        <View style={styles.introIcon}><Feather name="briefcase" size={20} color={C.gold} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.introTitle}>حدد خدماتك للعملاء</Text>
          <Text style={styles.introText}>يمكنك تقديم خدمة واحدة أو أكثر. إيقاف الخدمة هنا هو إعداد للواجهة، وسيتم ربطه لاحقًا بنظام الخدمات والعروض.</Text>
        </View>
      </View>

      {SERVICES.map((service) => {
        const active = enabled[service.key];
        return (
          <View key={service.key} style={[styles.card, active && styles.cardActive]}>
            <View style={styles.cardTop}>
              <View style={[styles.serviceIcon, active && styles.serviceIconActive]}><Feather name={service.icon as any} size={20} color={active ? C.gold : C.mutedForeground} /></View>
              <View style={styles.copy}>
                <Text style={styles.serviceTitle}>{service.title}</Text>
                <Text style={styles.serviceDescription}>{service.description}</Text>
              </View>
              <Switch value={active} onValueChange={(value) => setEnabled((prev) => ({ ...prev, [service.key]: value }))} trackColor={{ false: C.border, true: C.navy }} thumbColor="#fff" ios_backgroundColor={C.border} />
            </View>
            <View style={styles.divider} />
            <Text style={styles.note}>{service.note}</Text>
            {service.key === "memorandum" && active && (
              <View style={styles.memoBadge}><Feather name="edit-3" size={13} color={C.navy} /><Text style={styles.memoBadgeText}>خدمة مستقلة عن الاستشارة والتوكيل</Text></View>
            )}
            {service.key === "representation" && active && (
              <View style={styles.representationBadge}><Feather name="shield" size={13} color={C.gold} /><Text style={styles.representationBadgeText}>Escrow والتقسيط يطبقان على التوكيل فقط</Text></View>
            )}
          </View>
        );
      })}

      <View style={styles.futureBox}>
        <Feather name="clock" size={16} color={C.gold} />
        <Text style={styles.futureText}>لاحقًا سنضيف لكل خدمة إعداد السعر، نطاق العمل، مدة التسليم، العملة، وشروط العرض وربطها بطلبات العملاء.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
  header: { flexDirection: "row-reverse", alignItems: "center", paddingVertical: 16, gap: 10 },
  back: { padding: 4 },
  title: { flex: 1, textAlign: "center", fontSize: 20, fontFamily: "Inter_700Bold", color: C.foreground },
  intro: { flexDirection: "row-reverse", alignItems: "center", gap: 12, backgroundColor: C.navy, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: "rgba(201,160,53,0.3)", marginBottom: 18 },
  introIcon: { width: 42, height: 42, borderRadius: 13, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: "rgba(201,160,53,0.35)" },
  introTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  introText: { color: "rgba(255,255,255,0.72)", fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 },
  card: { backgroundColor: C.card, borderRadius: 17, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 12 },
  cardActive: { borderColor: "rgba(201,160,53,0.45)" },
  cardTop: { flexDirection: "row-reverse", alignItems: "center", gap: 11 },
  serviceIcon: { width: 43, height: 43, borderRadius: 13, backgroundColor: "#F3F4F6", alignItems: "center", justifyContent: "center" },
  serviceIconActive: { backgroundColor: "rgba(201,160,53,0.12)" },
  copy: { flex: 1 },
  serviceTitle: { color: C.foreground, fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  serviceDescription: { color: C.mutedForeground, fontSize: 11, lineHeight: 17, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  divider: { height: 1, backgroundColor: C.border, marginVertical: 12 },
  note: { color: C.mutedForeground, fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right" },
  memoBadge: { flexDirection: "row-reverse", alignItems: "center", alignSelf: "flex-end", gap: 6, backgroundColor: "#EEF2F8", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, marginTop: 10 },
  memoBadgeText: { color: C.navy, fontSize: 10, fontFamily: "Inter_600SemiBold" },
  representationBadge: { flexDirection: "row-reverse", alignItems: "center", alignSelf: "flex-end", gap: 6, backgroundColor: "rgba(201,160,53,0.09)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6, marginTop: 10 },
  representationBadgeText: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold" },
  futureBox: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(201,160,53,0.08)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(201,160,53,0.2)", padding: 13, marginTop: 4 },
  futureText: { flex: 1, color: C.mutedForeground, fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right" },
});
