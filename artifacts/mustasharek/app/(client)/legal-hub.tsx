import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

type HubItem = {
  icon: React.ComponentProps<typeof Feather>["name"];
  title: string;
  description: string;
  status?: string;
  route?: string;
};

const journey = [
  { label: "الاكتشاف", route: "/(client)" },
  { label: "طلب الخدمة", route: "/client/service-request" },
  { label: "ملف القضية", route: "/(client)/active-case" },
  { label: "مركزك", route: "/(client)/legal-hub" },
];

const items: HubItem[] = [
  {
    icon: "briefcase",
    title: "قضيتي الحالية",
    description: "عند وجود ملف نشط، تنتقل منه مباشرة إلى مساحة القضية ومتابعة الحالة.",
    status: "فتح مساحة القضية",
    route: "/(client)/active-case",
  },
  {
    icon: "file-text",
    title: "المستندات",
    description: "مساحة المستندات تبقى مرتبطة بملف الخدمة الفعلي؛ لن نعرض Route غير مؤكد.",
    status: "مرتبطة بالملف",
  },
  {
    icon: "clock",
    title: "الخط الزمني",
    description: "سيظهر هنا تسلسل الأحداث والخطوة القادمة عندما يتوفر مصدر حالة فعلي.",
    status: "قريبًا",
  },
  {
    icon: "message-circle",
    title: "التواصل",
    description: "قناة التواصل ستُربط بالخدمة أو القضية نفسها، وليس بحساب عام منفصل.",
    status: "قريبًا",
  },
];

export default function ClientLegalHub() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}>
          <Feather name="shield" size={24} color={C.gold} />
        </View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>مستشارك · مركزك القانوني</Text>
          <Text style={styles.title}>محور واحد لرحلتك القانونية</Text>
          <Text style={styles.subtitle}>
            من اكتشاف الخدمة إلى ملف القضية، يبقى العميل داخل رحلة واحدة واضحة بدل التنقل بين مسارات منفصلة.
          </Text>
        </View>
      </View>

      <View style={styles.journeyCard}>
        <Text style={styles.journeyTitle}>رحلتك داخل مستشارك</Text>
        <View style={styles.journeyRow}>
          {journey.map((step, index) => (
            <React.Fragment key={step.label}>
              <TouchableOpacity
                disabled={step.label === "مركزك"}
                activeOpacity={0.8}
                onPress={() => router.push(step.route as never)}
                style={[styles.step, step.label === "مركزك" && styles.stepActive]}
              >
                <Text style={[styles.stepText, step.label === "مركزك" && styles.stepTextActive]}>{step.label}</Text>
              </TouchableOpacity>
              {index < journey.length - 1 && <Feather name="chevron-left" size={13} color={C.mutedForeground} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.nextCard}>
        <View style={styles.nextIcon}>
          <Feather name="arrow-left" size={19} color={C.primary} />
        </View>
        <View style={styles.nextCopy}>
          <Text style={styles.nextLabel}>الحالة الحالية</Text>
          <Text style={styles.nextTitle}>لا يوجد ملف نشط معروض في هذه المرحلة</Text>
          <Text style={styles.nextText}>
            الخطوة التالية للعميل هي اكتشاف الخدمة المناسبة وبدء طلب قانوني. أي حالة حساسة ستأتي لاحقًا من المصدر الخادمي المعتمد.
          </Text>
          <TouchableOpacity style={styles.discoveryButton} activeOpacity={0.84} onPress={() => router.push("/(client)")}>
            <Text style={styles.discoveryButtonText}>استكشف الخدمات والمحامين</Text>
            <Feather name="arrow-left" size={15} color={C.navy} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>مساحتك القانونية</Text>
        <Text style={styles.sectionSubtitle}>اختصارات إلى الشاشات الموجودة فعلًا فقط</Text>
      </View>

      {items.map((item) => {
        const disabled = !item.route;
        return (
          <TouchableOpacity
            key={item.title}
            activeOpacity={disabled ? 1 : 0.82}
            disabled={disabled}
            style={[styles.item, disabled && styles.itemDisabled]}
            onPress={() => item.route && router.push(item.route as never)}
          >
            <View style={styles.chevron}>
              <Feather name={disabled ? "lock" : "chevron-left"} size={17} color={C.mutedForeground} />
            </View>
            <View style={styles.itemCopy}>
              <View style={styles.itemTitleRow}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <View style={styles.itemIcon}>
                  <Feather name={item.icon} size={19} color={C.primary} />
                </View>
              </View>
              <Text style={styles.itemDescription}>{item.description}</Text>
              {item.status && <Text style={styles.itemStatus}>{item.status}</Text>}
            </View>
          </TouchableOpacity>
        );
      })}

      <View style={styles.principle}>
        <Feather name="lock" size={16} color={C.gold} />
        <Text style={styles.principleText}>
          حدود الصلاحيات: العميل يرى رحلته وبياناته المسموح بها فقط. المحامي يعمل داخل مساحة عمله وملفات عملائه. الأدمن يدير التشغيل والرقابة دون أن يتحول إلى طرف في العلاقة القانونية. الواجهة لا تمنح أي صلاحية مالية أو قانونية.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingTop: 60, paddingBottom: 120, gap: 12 },
  hero: { backgroundColor: C.navy, borderRadius: 22, padding: 18, flexDirection: "row", alignItems: "flex-start", borderWidth: 1, borderColor: "rgba(201,160,53,.35)" },
  heroIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center", marginRight: 13 },
  heroCopy: { flex: 1, alignItems: "flex-end" },
  eyebrow: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  title: { color: "#fff", fontSize: 22, lineHeight: 29, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 4 },
  subtitle: { color: "rgba(255,255,255,.74)", fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 7 },
  journeyCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 14 },
  journeyTitle: { color: C.foreground, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 10 },
  journeyRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  step: { paddingHorizontal: 8, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F5F6F8" },
  stepActive: { backgroundColor: "rgba(201,160,53,.14)", borderWidth: 1, borderColor: "rgba(201,160,53,.4)" },
  stepText: { color: C.mutedForeground, fontSize: 9.5, fontFamily: "Inter_600SemiBold" },
  stepTextActive: { color: C.navy },
  nextCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center" },
  nextIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center", marginRight: 12 },
  nextCopy: { flex: 1, alignItems: "flex-end" },
  nextLabel: { color: C.gold, fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "right" },
  nextTitle: { color: C.foreground, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 3 },
  nextText: { color: C.mutedForeground, fontSize: 10, lineHeight: 16, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  discoveryButton: { marginTop: 10, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  discoveryButtonText: { color: C.navy, fontSize: 10.5, fontFamily: "Inter_700Bold" },
  sectionHeader: { alignItems: "flex-end", marginTop: 7 },
  sectionTitle: { color: C.foreground, fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  sectionSubtitle: { color: C.mutedForeground, fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  item: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 15, flexDirection: "row", alignItems: "center" },
  itemDisabled: { opacity: 0.72 },
  chevron: { width: 34, height: 34, borderRadius: 11, backgroundColor: "#F5F6F8", alignItems: "center", justifyContent: "center", marginRight: 11 },
  itemCopy: { flex: 1, alignItems: "flex-end" },
  itemTitleRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  itemIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center" },
  itemTitle: { color: C.foreground, fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  itemDescription: { color: C.mutedForeground, fontSize: 10.5, lineHeight: 17, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 5 },
  itemStatus: { color: C.primary, fontSize: 9.5, fontFamily: "Inter_600SemiBold", textAlign: "right", marginTop: 5 },
  principle: { marginTop: 4, padding: 13, borderRadius: 15, backgroundColor: "#FFFCF3", borderWidth: 1, borderColor: "rgba(201,160,53,.35)", flexDirection: "row", alignItems: "center", gap: 8 },
  principleText: { flex: 1, color: C.foreground, fontSize: 10, lineHeight: 17, fontFamily: "Inter_400Regular", textAlign: "right" },
});
