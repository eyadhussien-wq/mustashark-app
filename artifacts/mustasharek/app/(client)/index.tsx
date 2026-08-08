import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { LawyerCard } from "@/components/LawyerCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

const LOGO = require("../../assets/images/logo-transparent.png");
const C = colors.light;
const COUNTRIES = ["الكل", "قطر", "الأردن"] as const;
const SPECS = ["الكل", "تجاري", "جنائي", "أسرة", "عقاري", "عمالي", "مدني"];

export default function ClientHome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { lawyers, consultations, refreshData } = useData();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState<(typeof COUNTRIES)[number]>("الكل");
  const [spec, setSpec] = useState("الكل");
  const [refreshing, setRefreshing] = useState(false);

  const myConsultations = useMemo(() => consultations.filter((c) => c.clientId === user?.id), [consultations, user?.id]);
  const upcoming = useMemo(
    () => myConsultations
      .filter((c) => c.status === "accepted" || c.status === "pending")
      .sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`)),
    [myConsultations]
  );
  const nextConsultation = upcoming[0];

  const filtered = useMemo(() => lawyers.filter((l) => {
    const q = search.trim();
    const matchSearch = !q || l.name.includes(q) || l.specialization.includes(q);
    const matchCountry = country === "الكل" ||
      (country === "قطر" && l.country === "qatar") ||
      (country === "الأردن" && l.country === "jordan");
    const matchSpec = spec === "الكل" || l.specialization.includes(spec);
    return matchSearch && matchCountry && matchSpec;
  }), [lawyers, search, country, spec]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => <LawyerCard lawyer={item} onPress={() => router.push(`/lawyer/${item.id}`)} />}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.gold} colors={[C.navy, C.gold]} />}
        ListHeaderComponent={
          <>
            <View style={styles.brandHeader}>
              <View style={styles.brandCopy}>
                <Text style={styles.brandEyebrow}>مستشارك</Text>
                <Text style={styles.greeting}>أهلاً، {user?.name?.split(" ")[0] || "بك"}</Text>
                <Text style={styles.greetingSub}>كل ما تحتاجه لاستشارتك القانونية</Text>
              </View>
              <View style={styles.logoBadge}>
                <Image source={LOGO} style={styles.logoMini} resizeMode="contain" />
              </View>
            </View>

            {nextConsultation ? (
              <TouchableOpacity style={styles.nextCard} activeOpacity={0.9} onPress={() => router.push(`/consultation/${nextConsultation.id}`)}>
                <View style={styles.nextTop}>
                  <View style={styles.nextLabelRow}><View style={styles.liveDot} /><Text style={styles.nextLabel}>الاستشارة القادمة</Text></View>
                  <Text style={styles.nextStatus}>{nextConsultation.status === "accepted" ? "مؤكدة" : "بانتظار القبول"}</Text>
                </View>
                <Text style={styles.nextLawyer}>{nextConsultation.lawyerName}</Text>
                <Text style={styles.nextSpecialization}>{nextConsultation.lawyerSpecialization}</Text>
                <View style={styles.nextMetaRow}>
                  <Meta icon="calendar" text={nextConsultation.date} />
                  <Meta icon="clock" text={nextConsultation.time} />
                  <Meta icon={nextConsultation.type === "video" ? "video" : nextConsultation.type === "phone" ? "phone" : "message-square"} text={nextConsultation.type === "video" ? "فيديو" : nextConsultation.type === "phone" ? "هاتف" : "محادثة"} />
                </View>
                <View style={styles.nextAction}><Text style={styles.nextActionText}>عرض تفاصيل الاستشارة</Text><Feather name="arrow-left" size={16} color="#fff" /></View>
              </TouchableOpacity>
            ) : (
              <View style={styles.noBookingCard}>
                <View style={styles.noBookingIcon}><Feather name="calendar" size={20} color={C.primary} /></View>
                <View style={styles.noBookingCopy}><Text style={styles.noBookingTitle}>لا توجد استشارة قادمة</Text><Text style={styles.noBookingText}>اختر محاميًا مناسبًا وابدأ حجز استشارتك.</Text></View>
              </View>
            )}

            <View style={styles.sectionHeader}>
              <View><Text style={styles.sectionTitle}>ابحث عن محامٍ</Text><Text style={styles.sectionSubtitle}>اختر المختص المناسب لاحتياجك</Text></View>
              <View style={styles.resultCount}><Text style={styles.resultCountText}>{filtered.length}</Text></View>
            </View>

            <View style={styles.searchBar}>
              <Feather name="search" size={17} color={C.mutedForeground} />
              <TextInput style={styles.searchInput} placeholder="اسم المحامي أو التخصص" value={search} onChangeText={setSearch} placeholderTextColor={C.mutedForeground} returnKeyType="search" />
              {!!search && <TouchableOpacity onPress={() => setSearch("")}><Feather name="x-circle" size={17} color={C.mutedForeground} /></TouchableOpacity>}
            </View>

            <View style={styles.filtersBlock}>
              <FlatList horizontal inverted showsHorizontalScrollIndicator={false} data={COUNTRIES} keyExtractor={(i) => i} renderItem={({ item }) => (
                <TouchableOpacity style={[styles.chip, country === item && styles.chipActive]} onPress={() => setCountry(item)}><Text style={[styles.chipText, country === item && styles.chipTextActive]}>{item}</Text></TouchableOpacity>
              )} contentContainerStyle={styles.chipRow} />
              <FlatList horizontal inverted showsHorizontalScrollIndicator={false} data={SPECS} keyExtractor={(i) => i} renderItem={({ item }) => (
                <TouchableOpacity style={[styles.specChip, spec === item && styles.specChipActive]} onPress={() => setSpec(item)}><Text style={[styles.specText, spec === item && styles.specTextActive]}>{item}</Text></TouchableOpacity>
              )} contentContainerStyle={styles.chipRow} />
            </View>
          </>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={styles.emptyIcon}><Feather name="search" size={24} color={C.primary} /></View>
            <Text style={styles.emptyTitle}>لم نجد محاميًا مطابقًا</Text>
            <Text style={styles.emptyText}>جرّب تغيير التخصص أو الدولة أو عبارة البحث.</Text>
            {(search || country !== "الكل" || spec !== "الكل") && <TouchableOpacity style={styles.resetButton} onPress={() => { setSearch(""); setCountry("الكل"); setSpec("الكل"); }}><Text style={styles.resetButtonText}>مسح الفلاتر</Text></TouchableOpacity>}
          </View>
        }
      />
    </View>
  );
}

function Meta({ icon, text }: { icon: string; text: string }) {
  return <View style={styles.meta}><Feather name={icon as any} size={13} color="rgba(255,255,255,0.75)" /><Text style={styles.metaText}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  list: { paddingHorizontal: 20 },
  brandHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.navy, borderRadius: 20, padding: 18, marginTop: 8, marginBottom: 16, borderWidth: 1, borderColor: "rgba(201,160,53,0.28)" },
  brandCopy: { flex: 1, alignItems: "flex-end" },
  brandEyebrow: { fontSize: 11, color: C.gold, fontFamily: "Inter_600SemiBold", textAlign: "right", marginBottom: 3 },
  greeting: { fontSize: 21, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "right" },
  greetingSub: { fontSize: 12, color: "rgba(255,255,255,0.72)", fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  logoBadge: { width: 58, height: 58, borderRadius: 29, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1.5, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginLeft: 12 },
  logoMini: { width: 43, height: 43, borderRadius: 22 },
  nextCard: { backgroundColor: C.navy, borderRadius: 18, padding: 18, marginBottom: 24, borderWidth: 1, borderColor: "rgba(201,160,53,0.42)" },
  nextTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  nextLabelRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  liveDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold },
  nextLabel: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontFamily: "Inter_500Medium" },
  nextStatus: { color: C.gold, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  nextLawyer: { color: "#fff", fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "right" },
  nextSpecialization: { color: "rgba(255,255,255,0.72)", fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  nextMetaRow: { flexDirection: "row", justifyContent: "flex-end", flexWrap: "wrap", gap: 14, marginTop: 16 },
  meta: { flexDirection: "row", alignItems: "center", gap: 5 },
  metaText: { color: "rgba(255,255,255,0.78)", fontSize: 11, fontFamily: "Inter_400Regular" },
  nextAction: { marginTop: 16, paddingTop: 13, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.12)", flexDirection: "row", justifyContent: "flex-end", alignItems: "center", gap: 8 },
  nextActionText: { color: "#fff", fontSize: 12, fontFamily: "Inter_600SemiBold" },
  noBookingCard: { flexDirection: "row", alignItems: "center", backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 15, marginBottom: 24, gap: 12 },
  noBookingIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center" },
  noBookingCopy: { flex: 1, alignItems: "flex-end" },
  noBookingTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  noBookingText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "right" },
  sectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  sectionSubtitle: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 2 },
  resultCount: { minWidth: 30, height: 30, borderRadius: 15, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  resultCountText: { color: C.gold, fontSize: 12, fontFamily: "Inter_700Bold" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: C.card, borderRadius: 13, borderWidth: 1, borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 12 },
  searchInput: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right", minHeight: 20 },
  filtersBlock: { marginBottom: 14, gap: 8 },
  chipRow: { gap: 8, paddingVertical: 1 },
  chip: { paddingHorizontal: 15, paddingVertical: 7, borderRadius: 18, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  chipActive: { backgroundColor: C.navy, borderColor: C.navy },
  chipText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  chipTextActive: { color: "#fff" },
  specChip: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  specChipActive: { backgroundColor: "#F8F1D9", borderColor: C.gold },
  specText: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  specTextActive: { color: C.navy },
  empty: { alignItems: "center", paddingTop: 34, paddingBottom: 30 },
  emptyIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center", marginBottom: 10 },
  emptyTitle: { fontSize: 14, color: C.foreground, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "center" },
  resetButton: { marginTop: 14, paddingHorizontal: 15, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  resetButtonText: { fontSize: 12, color: C.primary, fontFamily: "Inter_600SemiBold" },
});
