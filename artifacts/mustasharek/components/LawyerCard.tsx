import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";
import type { Lawyer } from "@/contexts/DataContext";

interface Props {
  lawyer: Lawyer;
  onPress: () => void;
}

const C = colors.light;

export function LawyerCard({ lawyer, onPress }: Props) {
  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.row}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {lawyer.name.charAt(0)}
          </Text>
        </View>
        <View style={styles.info}>
          <View style={styles.nameRow}>
            <Text style={styles.name} numberOfLines={1}>{lawyer.name}</Text>
            {lawyer.licenseVerified && (
              <View style={styles.verified}>
                <Feather name="check-circle" size={12} color={C.success} />
                <Text style={styles.verifiedText}>موثّق</Text>
              </View>
            )}
          </View>
          <Text style={styles.spec}>{lawyer.specialization}</Text>
          <Text style={styles.country}>
            {lawyer.country === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن"}
          </Text>
        </View>
        <View style={styles.right}>
          <View style={[styles.badge, !lawyer.available && styles.badgeUnavailable]}>
            <Text style={[styles.badgeText, !lawyer.available && styles.badgeTextUnavailable]}>
              {lawyer.available ? "متاح" : "مشغول"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.footer}>
        <View style={styles.stat}>
          <Feather name="star" size={13} color={C.gold} />
          <Text style={styles.statText}>
            {lawyer.rating > 0 ? lawyer.rating.toFixed(1) : "جديد"}
          </Text>
          {lawyer.reviewsCount > 0 && (
            <Text style={styles.statSub}>({lawyer.reviewsCount})</Text>
          )}
        </View>
        <View style={styles.stat}>
          <Feather name="briefcase" size={13} color={C.mutedForeground} />
          <Text style={styles.statText}>{lawyer.experience} سنة خبرة</Text>
        </View>
        <View style={styles.priceRow}>
          <Text style={styles.price}>{lawyer.hourlyRate}</Text>
          <Text style={styles.currency}> ر / ساعة</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: C.card,
    borderRadius: colors.radius,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: C.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#fff",
    fontSize: 22,
    fontFamily: "Inter_600SemiBold",
  },
  info: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
  },
  name: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
  },
  verified: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: C.success,
    fontFamily: "Inter_500Medium",
  },
  spec: {
    fontSize: 13,
    color: C.primary,
    fontFamily: "Inter_500Medium",
  },
  country: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  right: {
    alignItems: "flex-end",
  },
  badge: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeUnavailable: {
    backgroundColor: "#FEF3C7",
  },
  badgeText: {
    fontSize: 11,
    color: C.success,
    fontFamily: "Inter_600SemiBold",
  },
  badgeTextUnavailable: {
    color: C.warning,
  },
  divider: {
    height: 1,
    backgroundColor: C.border,
    marginVertical: 12,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  stat: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: C.foreground,
    fontFamily: "Inter_500Medium",
  },
  statSub: {
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
    marginLeft: "auto",
  },
  price: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.navy,
  },
  currency: {
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
});
