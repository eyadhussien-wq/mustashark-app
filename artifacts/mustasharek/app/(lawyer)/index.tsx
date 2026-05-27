import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { rateLabel } from "@/utils/currency";

const C = colors.light;

export default function LawyerDashboard() {
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();
  const { consultations } = useData();

  const myConsults = useMemo(
    () => consultations.filter((c) => c.lawyerId === user?.id),
    [consultations, user]
  );

  const pending = myConsults.filter((c) => c.status === "pending").length;
  const accepted = myConsults.filter((c) => c.status === "accepted").length;
  const completed = myConsults.filter((c) => c.status === "completed").length;
  const totalEarnings = myConsults
    .filter((c) => c.status === "completed")
    .reduce((sum, c) => sum + c.price, 0);

  const upcomingConsults = myConsults
    .filter((c) => c.status === "accepted")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 3);

  async function toggleAvailability() {
    await updateUser({ available: !user?.available });
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>أهلاً، {user?.name?.split(" ").slice(0, 2).join(" ")}</Text>
          <Text style={styles.spec}>{user?.specialization}</Text>
        </View>
        <TouchableOpacity
          style={[styles.availBtn, !user?.available && styles.availBtnOff]}
          onPress={toggleAvailability}
          activeOpacity={0.85}
        >
          <View style={[styles.availDot, !user?.available && styles.availDotOff]} />
          <Text style={[styles.availText, !user?.available && styles.availTextOff]}>
            {user?.available ? "متاح" : "مشغول"}
          </Text>
        </TouchableOpacity>
      </View>

      {user?.licenseVerified && (
        <View style={styles.licenseBadge}>
          <Feather name="shield" size={14} color={C.success} />
          <Text style={styles.licenseBadgeText}>
            محامٍ موثّق · {user.licenseNumber}
          </Text>
        </View>
      )}

      <View style={styles.statsGrid}>
        <StatCard icon="clock" label="طلبات معلّقة" value={pending.toString()} color={C.warning} bg="#FEF3C7" />
        <StatCard icon="check-circle" label="استشارات مقبولة" value={accepted.toString()} color={C.success} bg="#ECFDF5" />
        <StatCard icon="check" label="مكتملة" value={completed.toString()} color={C.primary} bg="#EEF2F8" />
        <StatCard icon="dollar-sign" label={`الأرباح (${user?.country ? rateLabel(user.country) : "ر.ق"})`} value={totalEarnings.toString()} color={C.gold} bg="#FEF9EC" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>الاستشارات القادمة</Text>
        {upcomingConsults.length === 0 ? (
          <View style={styles.emptyCard}>
            <Feather name="calendar" size={28} color={C.border} />
            <Text style={styles.emptyText}>لا توجد استشارات قادمة</Text>
          </View>
        ) : (
          upcomingConsults.map((c) => (
            <View key={c.id} style={styles.upcomingCard}>
              <View style={styles.upcomingLeft}>
                <Text style={styles.upcomingClient}>{c.clientName}</Text>
                <Text style={styles.upcomingSubject} numberOfLines={1}>{c.subject}</Text>
                <View style={styles.upcomingMeta}>
                  <Feather name="calendar" size={11} color={C.mutedForeground} />
                  <Text style={styles.upcomingMetaText}>{c.date}</Text>
                  <Feather name="clock" size={11} color={C.mutedForeground} />
                  <Text style={styles.upcomingMetaText}>{c.time}</Text>
                </View>
              </View>
              <View style={styles.typeIcon}>
                <Feather
                  name={c.type === "video" ? "video" : c.type === "phone" ? "phone" : "message-square"}
                  size={18} color={C.primary}
                />
              </View>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}

function StatCard({ icon, label, value, color, bg }: {
  icon: string; label: string; value: string; color: string; bg: string;
}) {
  return (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Feather name={icon as any} size={20} color={color} />
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row", alignItems: "flex-start",
    justifyContent: "space-between", paddingVertical: 16,
  },
  greeting: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  spec: { fontSize: 13, color: C.primary, fontFamily: "Inter_500Medium", textAlign: "right" },
  availBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ECFDF5", paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 20, borderWidth: 1, borderColor: C.success,
  },
  availBtnOff: { backgroundColor: "#FEF3C7", borderColor: C.warning },
  availDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.success },
  availDotOff: { backgroundColor: C.warning },
  availText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.success },
  availTextOff: { color: C.warning },
  licenseBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#ECFDF5", borderRadius: 10, padding: 12,
    marginBottom: 20, borderWidth: 1, borderColor: "#D1FAE5",
  },
  licenseBadgeText: { fontSize: 13, color: C.success, fontFamily: "Inter_500Medium" },
  statsGrid: {
    flexDirection: "row", flexWrap: "wrap", gap: 12, marginBottom: 24,
  },
  statCard: {
    width: "47%", borderRadius: colors.radius, padding: 16,
    alignItems: "flex-end", gap: 6,
  },
  statValue: { fontSize: 26, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.foreground, marginBottom: 12, textAlign: "right" },
  emptyCard: {
    backgroundColor: C.card, borderRadius: colors.radius, borderWidth: 1,
    borderColor: C.border, padding: 32, alignItems: "center", gap: 10,
  },
  emptyText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  upcomingCard: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: C.card, borderRadius: colors.radius, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 10,
  },
  upcomingLeft: { flex: 1, gap: 3, alignItems: "flex-end" },
  upcomingClient: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground },
  upcomingSubject: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  upcomingMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  upcomingMetaText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  typeIcon: {
    width: 40, height: 40, borderRadius: 10,
    backgroundColor: C.secondary, alignItems: "center", justifyContent: "center", marginLeft: 12,
  },
});
