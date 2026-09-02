import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

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

export default function ClientLegalHub() {
  const router = useRouter();
  const { user } = useAuth();
  const { consultations } = useData();

  const myConsultations = useMemo(
    () => consultations.filter((consultation) => consultation.clientId === user?.id),
    [consultations, user?.id],
  );

  const currentConsultation = useMemo(() => [...myConsultations]
    .filter((consultation) => consultation.status === "accepted" || consultation.status === "pending")
    .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`))[0], [myConsultations]);

  const currentState = currentConsultation
    ? currentConsultation.status === "accepted" ? "استشارة مؤكدة" : "بانتظار رد المحامي"
    : "لا يوجد ملف نشط";
  const nextAction = currentConsultation
    ? currentConsultation.status === "accepted" ? "راجع تفاصيل استشارتك واستعد للموعد" : "تابع حالة طلبك حتى وصول رد المحامي"
    : "ابدأ بطلب استشارة للعثور على المحامي المناسب";
  const nextRoute = currentConsultation ? `/consultation/${currentConsultation.id}` : "/(client)/services";

  const items: HubItem[] = [
    {
      icon: "briefcase",
      title: "قضيتي الحالية",
      description: currentConsultation ? `${currentConsultation.lawyerName} · ${currentConsultation.lawyerSpecialization}` : "عندما يبدأ ملفك القانوني سيظهر هنا مساره وحالته الحالية.",
      status: currentState,
      route: "/(client)/active-case",
    },
    { icon: "file-text", title: "المستندات", description: "مساحة المستندات تبقى مرتبطة بملف الخدمة الفعلي؛ لن نعرض Route غير مؤكد.", status: "مرتبطة بالملف" },
    { icon: "clock", title: "الخط الزمني", description: "سيظهر هنا تسلسل الأحداث والخطوة القادمة عندما يتوفر مصدر حالة فعلي.", status: "قريبًا" },
    { icon: "message-circle", title: "التواصل", description: "قناة التواصل ستُربط بالخدمة أو القضية نفسها، وليس بحساب عام منفصل.", status: "قريبًا" },
  ];

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Feather name="shield" size={24} color={C.gold} /></View>
        <View style={styles.heroCopy}>
          <Text style={styles.eyebrow}>مستشارك · مركزك القانوني</Text>
          <Text style={styles.title}>محور واحد لرحلتك القانونية</Text>
          <Text style={styles.subtitle}>من اكتشاف الخدمة إلى ملف القضية، يبقى العميل داخل رحلة واحدة واضحة بدل التنقل بين مسارات منفصلة.</Text>
        </View>
      </View>

      <View style={styles.stateCard}>
        <View style={styles.stateHeader}>
          <View style={styles.stateBadge}><View style={[styles.stateDot, currentConsultation?.status === "accepted" && styles.stateDotActive]} /><Text style={styles.stateBadgeText}>{currentState}</Text></View>
          <Text style={styles.stateLabel}>الحالة الحالية</Text>
        </View>
        <Text style={styles.stateTitle}>{currentConsultation ? currentConsultation.subject : "ابدأ رحلتك القانونية من Discovery"}</Text>
        <Text style={styles.stateText}>{nextAction}</Text>
        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.84} onPress={() => router.push(nextRoute as never)}>
          <Text style={styles.primaryButtonText}>{currentConsultation ? "عرض الحالة الحالية" : "ابدأ من الخدمات"}</Text>
          <Feather name="arrow-left" size={15} color={C.navy} />
        </TouchableOpacity>
      </View>

      <View style={styles.journeyCard}>
        <Text style={styles.journeyTitle}>رحلتك داخل مستشارك</Text>
        <View style={styles.journeyRow}>
          {journey.map((step, index) => (
            <React.Fragment key={step.label}>
              <TouchableOpacity disabled={step.label === "مركزك"} activeOpacity={0.8} onPress={() => router.push(step.route as never)} style={[styles.step, step.label === "مركزك" && styles.stepActive]}>
                <Text style={[styles.stepText, step.label === "مركزك" && styles.stepTextActive]}>{step.label}</Text>
              </TouchableOpacity>
              {index < journey.length - 1 && <Feather name="chevron-left" size={13} color={C.mutedForeground} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>مساحتك القانونية</Text>
        <Text style={styles.sectionSubtitle}>اختصارات إلى الشاشات الموجودة فعلًا فقط</Text>
      </View>
      {items.map((item) => {
        const disabled = !item.route;
        return <TouchableOpacity key={item.title} activeOpacity={disabled ? 1 : 0.82} disabled={disabled} style={[styles.item, disabled && styles.itemDisabled]} onPress={() => item.route && router.push(item.route as never)}>
          <View style={styles.chevron}><Feather name={disabled ? "lock" : "chevron-left"} size={17} color={C.mutedForeground} /></View>
          <View style={styles.itemCopy}>
            <View style={styles.itemTitleRow}><Text style={styles.itemTitle}>{item.title}</Text><View style={styles.itemIcon}><Feather name={item.icon} size={19} color={C.primary} /></View></View>
            <Text style={styles.itemDescription}>{item.description}</Text>
            {item.status && <Text style={styles.itemStatus}>{item.status}</Text>}
          </View>
        </TouchableOpacity>;
      })}

      <View style={styles.roleCard}>
        <View style={styles.roleIcon}><Feather name="users" size={17} color={C.gold} /></View>
        <View style={styles.roleCopy}>
          <Text style={styles.roleTitle}>ثلاثة أدوار · رحلة واحدة</Text>
          <Text style={styles.roleText}>أنت ترى ما يخصك كعميل. المحامي يرى ما يحتاجه للعمل على الملفات الموكلة إليه. والأدمن يرى ما يدخل ضمن الرقابة والتشغيل المصرح به.</Text>
        </View>
      </View>

      <View style={styles.principle}>
        <Feather name="lock" size={16} color={C.gold} />
        <Text style={styles.principleText}>الأزرار والحالات هنا للعرض والانتقال فقط. الصلاحيات القانونية والمالية وبيانات المستخدمين تبقى خاضعة للتحقق الخادمي وعقود API المعتمدة.</Text>
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
  stateCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16 },
  stateHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  stateLabel: { color: C.mutedForeground, fontSize: 10, fontFamily: "Inter_500Medium" },
  stateBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 9, backgroundColor: "#EEF2F8" },
  stateDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.warning },
  stateDotActive: { backgroundColor: C.success },
  stateBadgeText: { color: C.primary, fontSize: 9.5, fontFamily: "Inter_700Bold" },
  stateTitle: { color: C.foreground, fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 12 },
  stateText: { color: C.mutedForeground, fontSize: 10.5, lineHeight: 17, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 },
  primaryButton: { alignSelf: "flex-end", marginTop: 11, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  primaryButtonText: { color: C.navy, fontSize: 10.5, fontFamily: "Inter_700Bold" },
  journeyCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 14 },
  journeyTitle: { color: C.foreground, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 10 },
  journeyRow: { flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between" },
  step: { paddingHorizontal: 8, paddingVertical: 7, borderRadius: 10, backgroundColor: "#F5F6F8" },
  stepActive: { backgroundColor: "rgba(201,160,53,.14)", borderWidth: 1, borderColor: "rgba(201,160,53,.4)" },
  stepText: { color: C.mutedForeground, fontSize: 9.5, fontFamily: "Inter_600SemiBold" },
  stepTextActive: { color: C.navy },
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
  roleCard: { backgroundColor: C.navy, borderRadius: 17, padding: 14, flexDirection: "row", alignItems: "center", gap: 10 },
  roleIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center" },
  roleCopy: { flex: 1, alignItems: "flex-end" },
  roleTitle: { color: C.gold, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" },
  roleText: { color: "rgba(255,255,255,.74)", fontSize: 9.5, lineHeight: 16, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  principle: { marginTop: 4, padding: 13, borderRadius: 15, backgroundColor: "#FFFCF3", borderWidth: 1, borderColor: "rgba(201,160,53,.35)", flexDirection: "row", alignItems: "center", gap: 8 },
  principleText: { flex: 1, color: C.foreground, fontSize: 10, lineHeight: 17, fontFamily: "Inter_400Regular", textAlign: "right" },
});
