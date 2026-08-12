import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

const C = colors.light;
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";
type ArchiveItem = { id: string; serialNumber: string; subject: string; scheduledDate: string; scheduledTime: string; status: string };

export default function ConsultationArchive() {
  const router = useRouter();
  const { getAuthToken } = useAuth();
  const { refreshData } = useData();
  const [serverArchive, setServerArchive] = useState<ArchiveItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadArchive = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!API_BASE || !token) {
        setServerArchive([]);
        return;
      }
      const response = await fetch(`${API_BASE}/consultations/archive`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) {
        setServerArchive([]);
        return;
      }
      const data = await response.json() as { ok: boolean; archive?: ArchiveItem[] };
      setServerArchive(data.ok ? (data.archive ?? []) : []);
    } catch {
      setServerArchive([]);
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => { void loadArchive(); }, [loadArchive]);

  async function handleRefresh() {
    setRefreshing(true);
    await Promise.all([loadArchive(), refreshData()]);
    setRefreshing(false);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={20} color="#fff" /></TouchableOpacity>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>التوثيق والسجل</Text><Text style={styles.title}>أرشيف الاستشارات</Text><Text style={styles.subtitle}>السجلات المؤرشفة محفوظة للرجوع والطباعة وفق صلاحيات الحساب.</Text></View>
        <View style={styles.icon}><Feather name="archive" size={21} color={C.gold} /></View>
      </View>
      {loading ? <ActivityIndicator size="large" color={C.primary} style={{ marginTop: 40 }} /> : serverArchive.length === 0 ? (
        <View style={styles.empty}><Feather name="archive" size={42} color={C.border} /><Text style={styles.emptyTitle}>لا توجد استشارات مؤرشفة</Text><Text style={styles.emptyText}>ستظهر هنا الاستشارات بعد أن يؤكد الخادم أرشفتها.</Text></View>
      ) : serverArchive.map((item) => (
        <TouchableOpacity key={item.id} style={styles.card} onPress={() => router.push(`/consultation/${item.id}`)} activeOpacity={0.85}>
          <View style={styles.cardTop}><View style={styles.badge}><Text style={styles.badgeText}>{item.serialNumber}</Text></View><View style={styles.cardIcon}><Feather name="file-text" size={17} color={C.primary} /></View></View>
          <Text style={styles.subject}>{item.subject}</Text><Text style={styles.meta}>{item.scheduledDate} • {item.scheduledTime}</Text>
          <View style={styles.footerRow}><Text style={styles.status}>{item.status}</Text><Text style={styles.open}>فتح التفاصيل ←</Text></View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background }, content: { padding: 18, paddingTop: 52, paddingBottom: 100 },
  header: { backgroundColor: C.navy, borderRadius: 20, padding: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(201,160,53,0.35)", marginBottom: 16 },
  headerCopy: { flex: 1, alignItems: "flex-end", marginHorizontal: 10 }, eyebrow: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold" }, title: { color: "#fff", fontSize: 22, fontFamily: "Inter_700Bold", marginTop: 3 }, subtitle: { color: "rgba(255,255,255,0.72)", fontSize: 10, lineHeight: 16, textAlign: "right", marginTop: 4, fontFamily: "Inter_400Regular" },
  back: { width: 40, height: 40, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" }, icon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 15, marginBottom: 10 }, cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }, badge: { backgroundColor: "rgba(201,160,53,0.12)", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 5 }, badgeText: { color: C.gold, fontSize: 10, fontFamily: "Inter_700Bold" }, cardIcon: { width: 36, height: 36, borderRadius: 11, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center" },
  subject: { color: C.foreground, fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 12 }, meta: { color: C.mutedForeground, fontSize: 10, textAlign: "right", marginTop: 5 }, footerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12 }, status: { color: C.mutedForeground, fontSize: 10 }, open: { color: C.primary, fontSize: 10, fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingTop: 70 }, emptyTitle: { color: C.foreground, fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 12 }, emptyText: { color: C.mutedForeground, fontSize: 11, marginTop: 5, textAlign: "center" },
});
