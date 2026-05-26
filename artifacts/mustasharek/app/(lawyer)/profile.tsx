import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
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

const C = colors.light;

export default function LawyerProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  async function handleLogout() {
    await logout();
    router.replace("/onboarding");
  }

  const items = [
    { icon: "user", label: "الاسم", value: user?.name },
    { icon: "mail", label: "البريد الإلكتروني", value: user?.email },
    { icon: "phone", label: "رقم الجوال", value: user?.phone },
    { icon: "briefcase", label: "التخصص", value: user?.specialization },
    { icon: "file-text", label: "رقم الترخيص", value: user?.licenseNumber },
    { icon: "map-pin", label: "الدولة", value: user?.country === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن" },
    { icon: "clock", label: "سنوات الخبرة", value: user?.experience ? `${user.experience} سنوات` : "—" },
    { icon: "dollar-sign", label: "السعر بالساعة", value: user?.hourlyRate ? `${user.hourlyRate} ريال` : "—" },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80),
        },
      ]}
    >
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "؟"}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.spec}>{user?.specialization}</Text>
        {user?.licenseVerified && (
          <View style={styles.verifiedBadge}>
            <Feather name="shield" size={13} color={C.success} />
            <Text style={styles.verifiedText}>محامٍ موثّق ومرخّص</Text>
          </View>
        )}
        {user?.rating !== undefined && user.rating > 0 && (
          <View style={styles.ratingRow}>
            <Feather name="star" size={14} color={C.gold} />
            <Text style={styles.ratingText}>{user.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsText}>({user.reviewsCount} تقييم)</Text>
          </View>
        )}
      </View>

      {user?.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>نبذة تعريفية</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      <View style={styles.infoCard}>
        {items.map((item, i) => (
          <View key={item.label} style={[styles.item, i < items.length - 1 && styles.itemBorder]}>
            <Text style={styles.itemValue}>{item.value ?? "—"}</Text>
            <View style={styles.itemLeft}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Feather name={item.icon as any} size={15} color={C.primary} />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>تسجيل الخروج</Text>
        <Feather name="log-out" size={18} color={C.destructive} />
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 24 },
  avatarSection: { alignItems: "center", gap: 8, marginBottom: 20 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: C.gold,
  },
  avatarText: { fontSize: 36, color: "#fff", fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  spec: { fontSize: 14, color: C.primary, fontFamily: "Inter_500Medium" },
  verifiedBadge: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: "#ECFDF5", paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
    borderWidth: 1, borderColor: "#D1FAE5",
  },
  verifiedText: { fontSize: 12, color: C.success, fontFamily: "Inter_600SemiBold" },
  ratingRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  ratingText: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground },
  reviewsText: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  bioCard: {
    backgroundColor: C.card, borderRadius: colors.radius, padding: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 14, gap: 6,
  },
  bioTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.primary, textAlign: "right" },
  bioText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", lineHeight: 21, textAlign: "right" },
  infoCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, marginBottom: 20, overflow: "hidden",
  },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  itemValue: { fontSize: 14, color: C.foreground, fontFamily: "Inter_500Medium", textAlign: "right", flex: 1, marginLeft: 8 },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10,
    borderWidth: 1.5, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5",
    borderRadius: colors.radius, paddingVertical: 14, paddingHorizontal: 20,
  },
  logoutText: { fontSize: 15, color: C.destructive, fontFamily: "Inter_600SemiBold" },
});
