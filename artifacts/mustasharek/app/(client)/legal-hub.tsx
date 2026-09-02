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

const items: HubItem[] = [
  {
    icon: "briefcase",
    title: "قضيتي الحالية",
    description: "تابع آخر حالة، الخطوة التالية، والمواعيد المرتبطة بملفك.",
    status: "قيد المتابعة",
    route: "/active-case-preview",
  },
  {
    icon: "file-text",
    title: "المستندات",
    description: "مساحة منظمة للمستندات التي تمت مشاركتها ضمن رحلتك القانونية.",
    status: "مستنداتك",
    route: "/client/document-handover",
  },
  {
    icon: "clock",
    title: "الخط الزمني",
    description: "اعرف ماذا حدث، وما الذي ينتظر منك، وما هي الخطوة القادمة.",
    status: "قريبًا",
  },
  {
    icon: "message-circle",
    title: "التواصل",
    description: "الوصول إلى قنوات التواصل المرتبطة بخدمتك القانونية دون خلطها مع حالة الحساب.",
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
          <Text style={styles.title}>كل ما يخص رحلتك القانونية في مكان واحد</Text>
          <Text style={styles.subtitle}>
            هذا هو المحور الذي سنبني حوله تجربة العميل: حالة واضحة، خطوة تالية واضحة، ومستندات ومواعيد وتواصل منظم.
          </Text>
        </View>
      </View>

      <View style={styles.nextCard}>
        <View style={styles.nextIcon}>
          <Feather name="arrow-left" size={19} color={C.primary} />
        </View>
        <View style={styles.nextCopy}>
          <Text style={styles.nextLabel}>الخطوة التالية</Text>
          <Text style={styles.nextTitle}>ابدأ بطلب استشارة إذا لم يكن لديك ملف نشط</Text>
          <Text style={styles.nextText}>لا نعرض قرارًا ماليًا أو صلاحية تنفيذية من الواجهة؛ الواجهة تقدم الحالة والانتقال فقط.</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>مساحتك القانونية</Text>

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
          مبدأ البناء: الواجهة لا تمنح صلاحيات مالية أو قانونية. كل حالة حساسة ستصل لاحقًا عبر عقد API واضح وسلطة خادمية مستقلة.
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
  nextCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 17, padding: 15, flexDirection: "row", alignItems: "center" },
  nextIcon: { width: 42, height: 42, borderRadius: 13, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center", marginRight: 12 },
  nextCopy: { flex: 1, alignItems: "flex-end" },
  nextLabel: { color: C.gold, fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "right" },
  nextTitle: { color: C.foreground, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 3 },
  nextText: { color: C.mutedForeground, fontSize: 10, lineHeight: 16, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  sectionTitle: { color: C.foreground, fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 7 },
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
