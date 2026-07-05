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
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 90),
        },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.title}>إدارة المحامين</Text>
      <Text style={styles.subtitle}>{filtered.length} محامٍ</Text>

      <View style={styles.filterRow}>
        <FilterChip label="الكل" active={filter === "all"} onPress={() => setFilter("all")} />
        <FilterChip label="قطر" active={filter === "qatar"} onPress={() => setFilter("qatar")} />
        <FilterChip label="الأردن" active={filter === "jordan"} onPress={() => setFilter("jordan")} />
      </View>

      {filtered.map((l) => (
        <View key={l.id} style={styles.card}>
          <View style={styles.cardTop}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{l.name.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{l.name}</Text>
              <Text style={styles.spec}>{l.specialization}</Text>
            </View>
            {l.licenseVerified ? (
              <View style={[styles.badge, { backgroundColor: "#ECFDF5" }]}>
                <Feather name="shield" size={12} color={C.success} />
                <Text style={[styles.badgeText, { color: C.success }]}>موثّق</Text>
              </View>
            ) : (
              <View style={[styles.badge, { backgroundColor: "#FEF3C7" }]}>
                <Feather name="clock" size={12} color={C.warning} />
                <Text style={[styles.badgeText, { color: C.warning }]}>قيد المراجعة</Text>
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <Meta icon="map-pin" text={l.country === "qatar" ? "قطر" : "الأردن"} />
            <Meta icon="star" text={`${l.rating} (${l.reviewsCount})`} />
            <Meta
              icon={l.available ? "check-circle" : "x-circle"}
              text={l.available ? "متاح" : "مشغول"}
              color={l.available ? C.success : C.mutedForeground}
            />
          </View>

          {!!l.licenseNumber && (
            <Text style={styles.license}>رقم الترخيص: {l.licenseNumber}</Text>
          )}
        </View>
      ))}

      {filtered.length === 0 && (
        <View style={styles.empty}>
          <Feather name="users" size={32} color={C.mutedForeground} />
          <Text style={styles.emptyText}>لا يوجد محامون في هذه الفئة</Text>
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
  color = C.mutedForeground,
}: {
  icon: keyof typeof Feather.glyphMap;
  text: string;
  color?: string;
}) {
  return (
    <View style={styles.meta}>
      <Feather name={icon} size={13} color={color} />
      <Text style={[styles.metaText, { color }]}>{text}</Text>
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
    marginBottom: 16,
  },
  chip: {
    paddingHorizontal: 18,
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
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700",
    color: C.primary,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: C.foreground,
    textAlign: "right",
  },
  spec: {
    fontSize: 13,
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 2,
  },
  badge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
  },
  metaRow: {
    flexDirection: "row-reverse",
    gap: 16,
    marginTop: 14,
    flexWrap: "wrap",
  },
  meta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 5,
  },
  metaText: {
    fontSize: 13,
  },
  license: {
    fontSize: 12,
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
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
