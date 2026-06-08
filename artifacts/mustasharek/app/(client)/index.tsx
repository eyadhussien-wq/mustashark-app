import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
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
  const { lawyers } = useData();
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("الكل");
  const [spec, setSpec] = useState("الكل");

  const filtered = useMemo(() => {
    return lawyers.filter((l) => {
      const matchSearch =
        !search ||
        l.name.includes(search) ||
        l.specialization.includes(search);
      const matchCountry =
        country === "الكل" ||
        (country === "قطر" && l.country === "qatar") ||
        (country === "الأردن" && l.country === "jordan");
      const matchSpec =
        spec === "الكل" || l.specialization.includes(spec);
      return matchSearch && matchCountry && matchSpec;
    });
  }, [lawyers, search, country, spec]);

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { paddingTop: topPad }]}>
      {/* ── Header ── */}
      <View style={styles.headerBar}>
        <View>
          <Text style={styles.greeting}>أهلاً، {user?.name?.split(" ")[0]}</Text>
          <Text style={styles.greetingSub}>ابحث عن مستشارك القانوني</Text>
        </View>
        {/* Premium logo badge */}
        <View style={styles.logoBadge}>
          <View style={styles.logoGlowDot} />
          <Image source={LOGO} style={styles.logoMini} resizeMode="contain" />
        </View>
      </View>

      <View style={styles.searchBar}>
        <Feather name="search" size={16} color={C.mutedForeground} />
        <TextInput
          style={styles.searchInput}
          placeholder="ابحث عن محامٍ أو تخصص..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor={C.mutedForeground}
        />
        {!!search && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <Feather name="x" size={16} color={C.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={COUNTRIES}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, country === item && styles.filterChipActive]}
              onPress={() => setCountry(item)}
            >
              <Text style={[styles.filterChipText, country === item && styles.filterChipTextActive]}>
                {item}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        />
      </View>

      <View style={styles.specFilters}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={SPECS}
          keyExtractor={(i) => i}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.specChip, spec === item && styles.specChipActive]}
              onPress={() => setSpec(item)}
            >
              <Text style={[styles.specText, spec === item && styles.specTextActive]}>{item}</Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={{ gap: 8, paddingRight: 8 }}
        />
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(l) => l.id}
        renderItem={({ item }) => (
          <LawyerCard
            lawyer={item}
            onPress={() => router.push(`/lawyer/${item.id}`)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="search" size={40} color={C.border} />
            <Text style={styles.emptyText}>لا يوجد محامون بهذه المعايير</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  greetingSub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },

  // ── Premium logo badge ────────────────────────────────────────────────────
  logoBadge: {
    position: "relative",
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: C.gold,
    ...Platform.select({
      ios: {
        shadowColor: C.gold,
        shadowOpacity: 0.55,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 8 },
      web: { boxShadow: `0 0 14px rgba(201,160,53,0.5)` } as any,
    }),
  },
  logoGlowDot: {
    position: "absolute",
    top: -1,
    right: -1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: C.gold,
    borderWidth: 2,
    borderColor: C.background,
    zIndex: 1,
  },
  logoMini: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },

  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 20, marginBottom: 12,
    backgroundColor: C.card, borderRadius: 12, borderWidth: 1,
    borderColor: C.border, paddingHorizontal: 14, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right" },
  filters: { paddingHorizontal: 20, marginBottom: 8 },
  filterChip: {
    paddingHorizontal: 16, paddingVertical: 7, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  filterChipActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  filterChipTextActive: { color: "#fff" },
  specFilters: { paddingHorizontal: 20, marginBottom: 12 },
  specChip: {
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, backgroundColor: C.card,
  },
  specChipActive: { backgroundColor: "#EEF2F8", borderColor: C.primary },
  specText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  specTextActive: { color: C.primary },
  list: { paddingHorizontal: 20 },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyText: { fontSize: 14, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
});
