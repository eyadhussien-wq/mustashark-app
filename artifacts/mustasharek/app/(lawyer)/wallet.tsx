import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
import { useData, type LawyerWallet, type PayoutRecord } from "@/contexts/DataContext";
import { getCurrency } from "@/utils/currency";

const C = colors.light;
const COMMISSION_PCT = 15;

export default function LawyerWallet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuth();
  const { getLawyerWallet, recordPayout, getPayoutHistory, consultations } = useData();

  const [wallet, setWallet] = useState<LawyerWallet | null>(null);
  const [history, setHistory] = useState<PayoutRecord[]>([]);
  const [disputeCount, setDisputeCount] = useState(0);
  const [cancelledCount, setCancelledCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const w = await getLawyerWallet(user.id);
      const h = await getPayoutHistory(user.id);
      // Count disputes and cancelled consultations this month
      const now = new Date();
      const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
      const firstDay = `${monthKey}-01`;
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split("T")[0];
      const monthConsults = consultations.filter(
        (c) => c.lawyerId === user.id && c.createdAt >= firstDay && c.createdAt <= lastDay
      );
      const disputes = monthConsults.filter((c) => c.status === "disputed").length;
      const cancelled = monthConsults.filter(
        (c) => c.status === "cancelled_by_lawyer" || c.status === "cancelled_by_client"
      ).length;
      setDisputeCount(disputes);
      setCancelledCount(cancelled);
      setWallet(w);
      setHistory(h);
      setLoading(false);
    })();
  }, [user, getLawyerWallet, getPayoutHistory, consultations]);

  async function handlePayout() {
    if (!user) return;
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await recordPayout(user.id);
    const w = await getLawyerWallet(user.id);
    const h = await getPayoutHistory(user.id);
    setWallet(w);
    setHistory(h);
  }

  const currency = user?.country ? getCurrency(user.country) : "ر.ق";

  if (loading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 100, alignItems: "center" }]}>
        <ActivityIndicator color={C.gold} size="large" />
        <Text style={{ marginTop: 16, color: C.mutedForeground, fontFamily: "Inter_400Regular" }}>
          جارٍ تحميل المحفظة...
        </Text>
      </View>
    );
  }

  if (!wallet) return null;

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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={22} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>المحفظة المالية</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Balance card */}
      <View style={styles.balanceCard}>
        <View style={styles.balanceHeader}>
          <Feather name="credit-card" size={20} color={C.gold} />
          <Text style={styles.balanceLabel}>الرصيد المعلق</Text>
        </View>
        <Text style={styles.balanceAmount}>
          {wallet.pendingBalance.toLocaleString("ar-SA")} {currency}
        </Text>
        <Text style={styles.balanceSub}>
          استشارات مكتملة ومدفوعة هذا الشهر
        </Text>
      </View>

      {/* Monthly breakdown */}
      <Text style={styles.sectionTitle}>تفصيل الشهر • {wallet.monthKey}</Text>
      <View style={styles.breakdownCard}>
        <BreakdownRow
          icon="trending-up"
          iconColor={C.success}
          label="إجمالي الإيرادات"
          value={`${wallet.monthlyGross.toLocaleString("ar-SA")} ${currency}`}
        />
        <BreakdownRow
          icon="percent"
          iconColor="#DC2626"
          label={`عمولة المنصة (${COMMISSION_PCT}%)`}
          value={`-${wallet.platformFee.toLocaleString("ar-SA")} ${currency}`}
          valueColor="#DC2626"
        />
        <View style={styles.divider} />
        <BreakdownRow
          icon="download"
          iconColor={C.gold}
          label="صافي الربح لك"
          value={`${wallet.pendingBalance.toLocaleString("ar-SA")} ${currency}`}
          valueColor={C.navy}
          bold
        />
      </View>

      {/* Stats row */}
      <View style={styles.statsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{wallet.completedCount}</Text>
          <Text style={styles.statLabel}>استشارات مدفوعة</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: disputeCount > 0 ? "#7C3AED" : C.foreground }]}>
            {disputeCount}
          </Text>
          <Text style={styles.statLabel}>نزاعات عليقة</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={[styles.statValue, { color: cancelledCount > 0 ? C.destructive : C.foreground }]}>
            {cancelledCount}
          </Text>
          <Text style={styles.statLabel}>استشارات ملغية</Text>
        </View>
      </View>

      {/* Payout button */}
      {wallet.pendingBalance > 0 && (
        <TouchableOpacity style={styles.payoutBtn} onPress={handlePayout} activeOpacity={0.85}>
          <Feather name="download" size={18} color="#fff" />
          <Text style={styles.payoutBtnText}>طلب تسوية الرصيد</Text>
        </TouchableOpacity>
      )}

      {/* Commission note */}
      <View style={styles.noteBox}>
        <Feather name="info" size={14} color={C.primary} />
        <Text style={styles.noteText}>
          تم خصم {COMMISSION_PCT}% من كل استشارة مدفوعة كعمولة منصة. الاستشارات الملغية والنزاعات لا تُحتسب في الرصيد وتُراجع أولاً. التسويات في نهاية كل شهر.
        </Text>
      </View>

      {/* Payout history */}
      {history.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>سجل التسويات</Text>
          <View style={styles.historyCard}>
            {history.map((h, i) => (
              <View key={h.id} style={[styles.historyRow, i < history.length - 1 && styles.historyBorder]}>
                <View style={styles.historyLeft}>
                  <View style={[styles.historyDot, h.status === "paid" && { backgroundColor: C.success }]} />
                  <View>
                    <Text style={styles.historyMonth}>{h.monthKey}</Text>
                    <Text style={styles.historyStatus}>
                      {h.status === "paid" ? "تمت التسوية" : h.status === "processing" ? "قيد التنفيذ" : "قيد الانتظار"}
                    </Text>
                  </View>
                </View>
                <Text style={styles.historyNet}>
                  {h.net.toLocaleString("ar-SA")} {currency}
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );
}

function BreakdownRow({
  icon,
  iconColor,
  label,
  value,
  valueColor,
  bold,
}: {
  icon: string; iconColor: string; label: string; value: string;
  valueColor?: string; bold?: boolean;
}) {
  return (
    <View style={styles.breakdownRow}>
      <View style={styles.breakdownLeft}>
        <View style={[styles.breakdownIcon, { backgroundColor: iconColor + "18" }]}>
          <Feather name={icon as any} size={16} color={iconColor} />
        </View>
        <Text style={[styles.breakdownLabel, bold && { fontFamily: "Inter_700Bold" }]}>{label}</Text>
      </View>
      <Text style={[styles.breakdownValue, { color: valueColor ?? C.foreground }, bold && { fontFamily: "Inter_700Bold" }]}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingVertical: 16,
  },
  backBtn: { padding: 4, width: 40 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground, flex: 1, textAlign: "center" },

  balanceCard: {
    backgroundColor: C.navy, borderRadius: 24,
    padding: 24, alignItems: "center", gap: 8, marginBottom: 24,
    ...Platform.select({
      ios: { shadowColor: C.navy, shadowOpacity: 0.25, shadowRadius: 16, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 8 },
    }),
  },
  balanceHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  balanceLabel: { fontSize: 14, color: "rgba(255,255,255,0.7)", fontFamily: "Inter_500Medium" },
  balanceAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: C.gold },
  balanceSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", textAlign: "center" },

  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, marginBottom: 12, marginTop: 8 },
  breakdownCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, padding: 16, gap: 14, marginBottom: 16,
  },
  breakdownRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  breakdownLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  breakdownIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  breakdownLabel: { fontSize: 14, color: C.foreground, fontFamily: "Inter_500Medium" },
  breakdownValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, backgroundColor: C.border },

  statsRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  statBox: {
    flex: 1, backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, padding: 16, alignItems: "center", gap: 4,
  },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground },
  statLabel: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },

  payoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.success, borderRadius: 16, paddingVertical: 16, marginBottom: 14,
  },
  payoutBtnText: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },

  noteBox: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    backgroundColor: "#F0F4FF", borderRadius: 14,
    padding: 14, borderWidth: 1, borderColor: "#D1D8F0", marginBottom: 20,
  },
  noteText: { flex: 1, fontSize: 12, color: C.primary, fontFamily: "Inter_400Regular", lineHeight: 20 },

  historyCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, overflow: "hidden",
  },
  historyRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 14 },
  historyBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  historyLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  historyDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.warning },
  historyMonth: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground },
  historyStatus: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  historyNet: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.navy },
});
