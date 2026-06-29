import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  Platform,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { ConsultationCard } from "@/components/ConsultationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData, type ConsultationStatus } from "@/contexts/DataContext";

const C = colors.light;

const FILTERS: { label: string; value: ConsultationStatus | "all" }[] = [
  { label: "الكل",    value: "all" },
  { label: "معلّق",  value: "pending" },
  { label: "مقبول",  value: "accepted" },
  { label: "مكتمل",  value: "completed" },
  { label: "مرفوض", value: "rejected" },
];

export default function LawyerRequests() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { consultations, updateConsultationStatus, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const { initialFilter } = useLocalSearchParams<{ initialFilter?: string }>();
  const defaultFilter = (
    FILTERS.find((f) => f.value === initialFilter)?.value ?? "all"
  ) as ConsultationStatus | "all";
  const [filter, setFilter] = useState<ConsultationStatus | "all">(defaultFilter);

  const myConsults = useMemo(() => {
    const mine = consultations.filter((c) => c.lawyerId === user?.id);
    if (filter === "all") return mine;
    return mine.filter((c) => c.status === filter);
  }, [consultations, user, filter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  async function handleAccept(id: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await updateConsultationStatus(id, "accepted");
  }

  async function handleReject(id: string) {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateConsultationStatus(id, "rejected");
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>طلبات الاستشارة</Text>
        <Text style={styles.sub}>{myConsults.length} طلب</Text>
      </View>

      <View style={styles.filterBar}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.value}
            style={[styles.filterBtn, filter === f.value && styles.filterBtnActive]}
            onPress={() => setFilter(f.value)}
          >
            <Text style={[styles.filterText, filter === f.value && styles.filterTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={myConsults}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConsultationCard
            consultation={item}
            viewAs="lawyer"
            onPress={() => router.push(`/consultation/${item.id}`)}
            onAccept={() => handleAccept(item.id)}
            onReject={() => handleReject(item.id)}
          />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={C.gold}
            colors={[C.navy, C.gold]}
          />
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={44} color={C.border} />
            <Text style={styles.emptyTitle}>لا توجد طلبات</Text>
            <Text style={styles.emptyText}>اسحب للأسفل للتحديث والبحث عن طلبات جديدة</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20, paddingVertical: 16,
    borderBottomWidth: 1, borderBottomColor: C.border, gap: 2,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  sub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  filterBar: {
    flexDirection: "row", paddingHorizontal: 16, paddingVertical: 12,
    gap: 8, flexWrap: "wrap",
  },
  filterBtn: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card,
  },
  filterBtnActive: { backgroundColor: C.navy, borderColor: C.navy },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  filterTextActive: { color: "#fff" },
  list: { padding: 20 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.foreground },
  emptyText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
});
