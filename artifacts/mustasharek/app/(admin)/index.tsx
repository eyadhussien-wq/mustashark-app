import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Platform,
  RefreshControl,
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

const C = colors.light;

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { lawyers, consultations, refreshData } = useData();
  const [refreshing, setRefreshing] = useState(false);

  const stats = useMemo(() => {
    const verified = lawyers.filter((l) => l.licenseVerified).length;
    const qatarLawyers = lawyers.filter((l) => l.country === "qatar").length;
    const jordanLawyers = lawyers.filter((l) => l.country === "jordan").length;
    const clientIds = new Set(consultations.map((c) => c.clientId));

    const byStatus = {
      pending: consultations.filter((c) => c.status === "pending").length,
      accepted: consultations.filter((c) => c.status === "accepted").length,
      completed: consultations.filter((c) => c.status === "completed").length,
      cancelled: consultations.filter(
        (c) =>
          c.status === "rejected" ||
          c.status === "cancelled_by_client" ||
          c.status === "cancelled_by_lawyer"
      ).length,
    };

    const completed = consultations.filter((c) => c.status === "completed");
    const revenueQatar = completed
      .filter((c) => c.lawyerCountry !== "jordan")
      .reduce((s, c) => s + c.price, 0);
    const revenueJordan = completed
      .filter((c) => c.lawyerCountry === "jordan")
      .reduce((s, c) => s + c.price, 0);

    return {
      totalLawyers: lawyers.length,
      verified,
      qatarLawyers,
      jordanLawyers,
      totalClients: clientIds.size,
      totalConsultations: consultations.length,
      byStatus,
      revenueQatar,
      revenueJordan,
    };
  }, [lawyers, consultations]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  }, [refreshData]);

  async function handleLogout() {
    await logout();
    router.replace("/");
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        },
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
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>لوحة تحكم الإدارة</Text>
          <Text style={styles.subtitle}>أهلاً، {user?.name}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
          <Feather name="log-out" size={16} color={C.destructive} />
        </TouchableOpacity>
      </View>

      <View style={styles.adminBadge}>
        <Feather name="shield" size={14} color={C.gold} />
        <Text style={styles.adminBadgeText}>صلاحية مدير النظام (ADMIN)</Text>
      </View>

      {/* KPI grid */}
      <View style={styles.grid}>
        <StatCard
          icon="users"
          label="إجمالي المحامين"
          value={String(stats.totalLawyers)}
          color={C.primary}
          bg="#EEF2F8"
        />
        <StatCard
          icon="shield"
          label="محامون موثّقون"
          value={String(stats.verified)}
          color={C.success}
          bg="#ECFDF5"
        />
        <StatCard
          icon="file-text"
          label="إجمالي الاستشارات"
          value={String(stats.totalConsultations)}
          color={C.gold}
          bg="#FBF5E3"
        />
        <StatCard
          icon="user-check"
          label="إجمالي العملاء"
          value={String(stats.totalClients)}
          color={C.navyLight}
          bg="#EEF2F8"
        />
      </View>

      {/* Revenue */}
      <Text style={styles.sectionTitle}>الإيرادات (استشارات مكتملة)</Text>
      <View style={styles.revenueCard}>
        <View style={styles.revenueRow}>
          <Text style={styles.revenueLabel}>قطر</Text>
          <Text style={styles.revenueValue}>{stats.revenueQatar.toLocaleString()} ر.ق</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.revenueRow}>
          <Text style={styles.revenueLabel}>الأردن</Text>
          <Text style={styles.revenueValue}>{stats.revenueJordan.toLocaleString()} د.أ</Text>
        </View>
      </View>

      {/* Consultation status */}
      <Text style={styles.sectionTitle}>حالة الاستشارات</Text>
      <View style={styles.statusWrap}>
        <StatusPill label="معلّقة" value={stats.byStatus.pending} color={C.warning} />
        <StatusPill label="مقبولة" value={stats.byStatus.accepted} color={C.success} />
        <StatusPill label="مكتملة" value={stats.byStatus.completed} color={C.primary} />
        <StatusPill label="ملغاة" value={stats.byStatus.cancelled} color={C.destructive} />
      </View>

      {/* Distribution by country */}
      <Text style={styles.sectionTitle}>توزيع المحامين حسب الدولة</Text>
      <View style={styles.countryCard}>
        <CountryRow label="قطر" value={stats.qatarLawyers} total={stats.totalLawyers} />
        <View style={styles.divider} />
        <CountryRow label="الأردن" value={stats.jordanLawyers} total={stats.totalLawyers} />
      </View>

      {/* Quick nav */}
      <Text style={styles.sectionTitle}>إدارة سريعة</Text>
      <View style={styles.quickWrap}>
        <QuickAction
          icon="users"
          label="إدارة المحامين"
          onPress={() => router.push("/(admin)/lawyers")}
        />
        <QuickAction
          icon="file-text"
          label="سجل الاستشارات"
          onPress={() => router.push("/(admin)/consultations")}
        />
      </View>
    </ScrollView>
  );
}

function StatCard({
  icon,
  label,
  value,
  color,
  bg,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  value: string;
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.statCard}>
      <View style={[styles.statIcon, { backgroundColor: bg }]}>
        <Feather name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <View style={styles.pill}>
      <View style={[styles.pillDot, { backgroundColor: color }]} />
      <Text style={styles.pillValue}>{value}</Text>
      <Text style={styles.pillLabel}>{label}</Text>
    </View>
  );
}

function CountryRow({ label, value, total }: { label: string; value: number; total: number }) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <View style={styles.countryRow}>
      <View style={{ flex: 1 }}>
        <View style={styles.countryHead}>
          <Text style={styles.countryLabel}>{label}</Text>
          <Text style={styles.countryValue}>
            {value} ({pct}%)
          </Text>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${pct}%` }]} />
        </View>
      </View>
    </View>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.quickBtn} onPress={onPress} activeOpacity={0.85}>
      <Feather name={icon} size={20} color={C.primary} />
      <Text style={styles.quickLabel}>{label}</Text>
      <Feather name="chevron-left" size={18} color={C.mutedForeground} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: C.navy,
    textAlign: "right",
  },
  subtitle: {
    fontSize: 14,
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 2,
  },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FEECEC",
    alignItems: "center",
    justifyContent: "center",
  },
  adminBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    alignSelf: "flex-end",
    gap: 6,
    backgroundColor: "#FBF5E3",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  adminBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#8A6D1B",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 8,
  },
  statCard: {
    width: "47%",
    flexGrow: 1,
    backgroundColor: C.card,
    borderRadius: colors.radius,
    padding: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: "flex-end",
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  statValue: {
    fontSize: 26,
    fontWeight: "700",
    color: C.navy,
    textAlign: "right",
  },
  statLabel: {
    fontSize: 13,
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: C.navy,
    textAlign: "right",
    marginTop: 24,
    marginBottom: 12,
  },
  revenueCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
  },
  revenueRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 16,
  },
  revenueLabel: {
    fontSize: 15,
    color: C.foreground,
    fontWeight: "500",
  },
  revenueValue: {
    fontSize: 17,
    fontWeight: "700",
    color: C.gold,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
  },
  statusWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  pill: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexGrow: 1,
    justifyContent: "center",
  },
  pillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  pillValue: {
    fontSize: 15,
    fontWeight: "700",
    color: C.navy,
  },
  pillLabel: {
    fontSize: 13,
    color: C.mutedForeground,
  },
  countryCard: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
  },
  countryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  countryHead: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  countryLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: C.foreground,
  },
  countryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: C.mutedForeground,
  },
  barTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C.muted,
    overflow: "hidden",
  },
  barFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: C.primary,
  },
  quickWrap: {
    gap: 12,
  },
  quickBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 12,
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  quickLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: C.foreground,
    textAlign: "right",
  },
});
