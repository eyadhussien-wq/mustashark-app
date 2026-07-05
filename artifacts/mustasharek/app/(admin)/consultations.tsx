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
import { useData, type ConsultationStatus } from "@/contexts/DataContext";

const C = colors.light;

type StatusFilter = "all" | "pending" | "accepted" | "completed" | "cancelled";

const STATUS_META: Record<
  ConsultationStatus,
  { label: string; color: string; bg: string }
> = {
  pending: { label: "معلّقة", color: C.warning, bg: "#FEF3C7" },
  accepted: { label: "مقبولة", color: C.success, bg: "#ECFDF5" },
  rejected: { label: "مرفوضة", color: C.destructive, bg: "#FEECEC" },
  completed: { label: "مكتملة", color: C.primary, bg: "#EEF2F8" },
  cancelled_by_lawyer: { label: "ألغاها المحامي", color: C.destructive, bg: "#FEECEC" },
  cancelled_by_client: { label: "ألغاها العميل", color: C.destructive, bg: "#FEECEC" },
  no_show_lawyer: { label: "تغيّب المحامي", color: C.destructive, bg: "#FEECEC" },
  no_show_client: { label: "تغيّب العميل", color: C.destructive, bg: "#FEECEC" },
  disputed: { label: "نزاع", color: C.warning, bg: "#FEF3C7" },
  refunded_absent: { label: "مُسترد", color: C.mutedForeground, bg: "#F1F5F9" },
};

function matchesFilter(status: ConsultationStatus, filter: StatusFilter): boolean {
  if (filter === "all") return true;
  if (filter === "cancelled") {
    return (
      status === "rejected" ||
      status === "cancelled_by_client" ||
      status === "cancelled_by_lawyer"
    );
  }
  return status === filter;
}

export default function AdminConsultations() {
  const insets = useSafeAreaInsets();
  const { consultations } = useData();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filtered = useMemo(
    () =>
      [...consultations]
        .filter((c) => matchesFilter(c.status, filter))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [consultations, filter]
  );

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
    >
      <Text style={styles.title}>سجل الاستشارات</Text>
      <Text style={styles.subtitle}>{filtered.length} استشارة</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
      >
        <FilterChip label="الكل" active={filter === "all"} onPress={() => setFilter("all")} />
        <FilterChip label="معلّقة" active={filter === "pending"} onPress={() => setFilter("pending")} />
        <FilterChip label="مقبولة" active={filter === "accepted"} onPress={() => setFilter("accepted")} />
        <FilterChip label="مكتملة" active={filter === "completed"} onPress={() => setFilter("completed")} />
        <FilterChip label="ملغاة" active={filter === "cancelled"} onPress={() => setFilter("cancelled")} />
      </ScrollView>

      {filtered.map((c) => {
        const meta = STATUS_META[c.status];
        return (
          <View key={c.id} style={styles.card}>
            <View style={styles.cardTop}>
              <Text style={styles.serial}>{c.serialNumber}</Text>
              <View style={[styles.badge, { backgroundColor: meta.bg }]}>
                <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
              </View>
            </View>
            <Text style={styles.subject}>{c.subject}</Text>
            <View style={styles.metaRow}>
              <Meta icon="user" text={c.clientName} />
              <Meta icon="briefcase" text={c.lawyerName} />
            </View>
            <View style={styles.metaRow}>
              <Meta icon="calendar" text={`${c.date} · ${c.time}`} />
              <Meta icon="tag" text={`${c.price} ر.ق`} />
            </View>
          </View>
        );
      })}

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <Feather name="file-text" size={32} color={C.mutedForeground} />
          <Text style={styles.emptyText}>لا توجد استشارات في هذه الفئة</Text>
        </View>
      )}
    </ScrollView>
  );
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, active && styles.chipActive]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Meta({
  icon,
  text,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
}) {
  return (
    <View style={styles.meta}>
      <Feather name={icon} size={13} color={C.mutedForeground} />
      <Text style={styles.metaText}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 20,
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
    marginBottom: 16,
  },
  filterRow: {
    flexDirection: "row-reverse",
    gap: 10,
    paddingBottom: 4,
    marginBottom: 12,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: C.card,
    borderWidth: 1,
    borderColor: C.border,
  },
  chipActive: {
    backgroundColor: C.primary,
    borderColor: C.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: "600",
    color: C.foreground,
  },
  chipTextActive: {
    color: C.primaryForeground,
  },
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    borderWidth: 1,
    borderColor: C.border,
    padding: 16,
    marginBottom: 12,
  },
  cardTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  serial: {
    fontSize: 12,
    fontWeight: "600",
    color: C.mutedForeground,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  subject: {
    fontSize: 16,
    fontWeight: "700",
    color: C.foreground,
    textAlign: "right",
    marginTop: 10,
  },
  metaRow: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    marginTop: 12,
    gap: 12,
    flexWrap: "wrap",
  },
  meta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
    color: C.mutedForeground,
  },
  empty: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 14,
    color: C.mutedForeground,
  },
});
