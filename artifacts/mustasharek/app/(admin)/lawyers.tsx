import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
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
import { useData } from "@/contexts/DataContext";

const C = colors.light;
type CountryFilter = "all" | "qatar" | "jordan";

export default function AdminLawyers() {
  const insets = useSafeAreaInsets();
  const { lawyers } = useData();
  const [filter, setFilter] = useState<CountryFilter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? lawyers : lawyers.filter((l) => l.country === filter)),
    [lawyers, filter]
  );

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16), paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90) }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.headingRow}>
        <View style={styles.headingIcon}><Feather name="shield" size={20} color={C.gold} /></View>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>إدارة المحامين</Text>
          <Text style={styles.subtitle}>{filtered.length} محامٍ · مراجعة مهنية ومالية</Text>
        </View>
      </View>

      <View style={styles.filterRow}>
        <FilterChip label="الكل" active={filter === "all"} onPress={() => setFilter("all")} />
        <FilterChip label="قطر" active={filter === "qatar"} onPress={() => setFilter("qatar")} />
        <FilterChip label="الأردن" active={filter === "jordan"} onPress={() => setFilter("jordan")} />
      </View>

      <View style={styles.reviewBanner}>
        <Feather name="info" size={15} color={C.navy} />
        <Text style={styles.reviewBannerText}>هذه الشاشة تعرض أساس دورة المراجعة فقط. أزرار الاعتماد والرفض وربط المستندات ستُفعل لاحقًا مع النظام الإداري.</Text>
      </View>

      {filtered.map((l) => (
        <View key={l.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{l.name.charAt(0)}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{l.name}</Text>
              <Text style={styles.spec}>{l.specialization}</Text>
            </View>
            {l.licenseVerified ? (
              <StatusBadge icon="shield" label="موثّق" tone="success" />
            ) : (
              <StatusBadge icon="clock" label="قيد المراجعة" tone="warning" />
            )}
          </View>

          <View style={styles.metaRow}>
            <Meta icon="map-pin" text={l.country === "qatar" ? "قطر" : "الأردن"} />
            <Meta icon="star" text={`${l.rating} (${l.reviewsCount})`} />
            <Meta icon={l.available ? "check-circle" : "x-circle"} text={l.available ? "متاح" : "مشغول"} color={l.available ? C.success : C.mutedForeground} />
          </View>

          {!!l.licenseNumber && <Text style={styles.license}>رقم الترخيص: {l.licenseNumber}</Text>}

          <View style={styles.reviewSection}>
            <Text style={styles.reviewTitle}>حالة المراجعة</Text>
            <View style={styles.reviewGrid}>
              <ReviewItem icon="award" title="الترخيص" status={l.licenseVerified ? "موثّق" : "بانتظار المراجعة"} tone={l.licenseVerified ? "success" : "warning"} />
              <ReviewItem icon="credit-card" title="الحساب البنكي / IBAN" status="قيد الربط" tone="neutral" />
              <ReviewItem icon="file-text" title="مستند إثبات البنك" status="قيد الربط" tone="neutral" />
            </View>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.disabledAction} disabled activeOpacity={0.8}>
                <Feather name="eye" size={14} color={C.mutedForeground} /><Text style={styles.disabledActionText}>مراجعة المستندات · قريبًا</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.disabledAction} disabled activeOpacity={0.8}>
                <Feather name="check-circle" size={14} color={C.mutedForeground} /><Text style={styles.disabledActionText}>اعتماد الحساب · قريبًا</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      ))}

      {filtered.length === 0 && <View style={styles.empty}><Feather name="users" size={32} color={C.mutedForeground} /><Text style={styles.emptyText}>لا يوجد محامون في هذه الفئة</Text></View>}
    </ScrollView>
  );
}

function FilterChip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <TouchableOpacity style={[styles.chip, active && styles.chipActive]} onPress={onPress} activeOpacity={0.85}><Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text></TouchableOpacity>;
}

function StatusBadge({ icon, label, tone }: { icon: keyof typeof Feather.glyphMap; label: string; tone: "success" | "warning" }) {
  const success = tone === "success";
  return <View style={[styles.badge, { backgroundColor: success ? "#ECFDF5" : "#FEF3C7" }]}><Feather name={icon} size={12} color={success ? C.success : C.warning} /><Text style={[styles.badgeText, { color: success ? C.success : C.warning }]}>{label}</Text></View>;
}

function ReviewItem({ icon, title, status, tone }: { icon: keyof typeof Feather.glyphMap; title: string; status: string; tone: "success" | "warning" | "neutral" }) {
  const color = tone === "success" ? C.success : tone === "warning" ? C.warning : C.mutedForeground;
  return <View style={styles.reviewItem}><View style={[styles.reviewIcon, { backgroundColor: tone === "success" ? "#ECFDF5" : tone === "warning" ? "#FEF3C7" : "#F3F4F6" }]}><Feather name={icon} size={14} color={color} /></View><Text style={styles.reviewLabel}>{title}</Text><Text style={[styles.reviewStatus, { color }]}>{status}</Text></View>;
}

function Meta({ icon, text, color = C.mutedForeground }: { icon: keyof typeof Feather.glyphMap; text: string; color?: string }) {
  return <View style={styles.meta}><Feather name={icon} size={13} color={color} /><Text style={[styles.metaText, { color }]}>{text}</Text></View>;
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  headingRow: { flexDirection: "row-reverse", alignItems: "center", gap: 12, marginBottom: 4 },
  headingIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: "rgba(201,160,53,0.12)", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "700", color: C.navy, textAlign: "right" },
  subtitle: { fontSize: 13, color: C.mutedForeground, textAlign: "right", marginTop: 2, marginBottom: 16 },
  filterRow: { flexDirection: "row-reverse", gap: 10, marginBottom: 14 },
  chip: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 20, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: 14, fontWeight: "600", color: C.foreground },
  chipTextActive: { color: C.primaryForeground },
  reviewBanner: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(10,34,64,0.06)", borderWidth: 1, borderColor: "rgba(10,34,64,0.12)", borderRadius: 13, padding: 12, marginBottom: 16 },
  reviewBannerText: { flex: 1, fontSize: 11, lineHeight: 17, color: C.mutedForeground, textAlign: "right" },
  card: { backgroundColor: C.card, borderRadius: colors.radius, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 },
  cardTop: { flexDirection: "row-reverse", alignItems: "center", gap: 12 },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.secondary, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18, fontWeight: "700", color: C.primary },
  name: { fontSize: 16, fontWeight: "700", color: C.foreground, textAlign: "right" },
  spec: { fontSize: 13, color: C.mutedForeground, textAlign: "right", marginTop: 2 },
  badge: { flexDirection: "row-reverse", alignItems: "center", gap: 4, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14 },
  badgeText: { fontSize: 11, fontWeight: "700" },
  metaRow: { flexDirection: "row-reverse", gap: 16, marginTop: 14, flexWrap: "wrap" },
  meta: { flexDirection: "row-reverse", alignItems: "center", gap: 5 },
  metaText: { fontSize: 13 },
  license: { fontSize: 12, color: C.mutedForeground, textAlign: "right", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.border },
  reviewSection: { marginTop: 14, paddingTop: 14, borderTopWidth: 1, borderTopColor: C.border },
  reviewTitle: { fontSize: 13, fontWeight: "800", color: C.navy, textAlign: "right", marginBottom: 10 },
  reviewGrid: { gap: 8 },
  reviewItem: { flexDirection: "row-reverse", alignItems: "center", gap: 8, backgroundColor: C.background, borderRadius: 11, padding: 9 },
  reviewIcon: { width: 30, height: 30, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  reviewLabel: { flex: 1, fontSize: 11, color: C.foreground, textAlign: "right", fontWeight: "600" },
  reviewStatus: { fontSize: 10, fontWeight: "700" },
  actionRow: { flexDirection: "row-reverse", gap: 8, marginTop: 10 },
  disabledAction: { flex: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.border, backgroundColor: C.background, opacity: 0.75 },
  disabledActionText: { fontSize: 10, color: C.mutedForeground, fontWeight: "700" },
  empty: { alignItems: "center", gap: 10, paddingVertical: 48 },
  emptyText: { fontSize: 14, color: C.mutedForeground },
});
