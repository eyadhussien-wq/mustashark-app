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

export default function ClientProfile() {
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
    { icon: "map-pin", label: "الدولة", value: user?.country === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن" },
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
        <View style={styles.roleBadge}>
          <Feather name="user" size={12} color={C.primary} />
          <Text style={styles.roleText}>عميل</Text>
        </View>
      </View>

      <View style={styles.card}>
        {items.map((item, i) => (
          <View key={item.label} style={[styles.item, i < items.length - 1 && styles.itemBorder]}>
            <Text style={styles.itemValue}>{item.value ?? "—"}</Text>
            <View style={styles.itemLeft}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Feather name={item.icon as any} size={16} color={C.primary} />
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
  avatarSection: { alignItems: "center", gap: 10, marginBottom: 28 },
  avatar: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
    borderWidth: 3, borderColor: C.gold,
  },
  avatarText: { fontSize: 36, color: "#fff", fontFamily: "Inter_700Bold" },
  name: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground },
  roleBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: C.secondary, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20,
  },
  roleText: { fontSize: 12, color: C.primary, fontFamily: "Inter_600SemiBold" },
  card: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border, marginBottom: 20,
    overflow: "hidden",
  },
  item: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 16,
  },
  itemBorder: { borderBottomWidth: 1, borderBottomColor: C.border },
  itemLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  itemLabel: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  itemValue: { fontSize: 14, color: C.foreground, fontFamily: "Inter_500Medium", textAlign: "right" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end",
    gap: 10, borderWidth: 1.5, borderColor: "#FEE2E2",
    backgroundColor: "#FFF5F5", borderRadius: colors.radius, paddingVertical: 14, paddingHorizontal: 20,
  },
  logoutText: { fontSize: 15, color: C.destructive, fontFamily: "Inter_600SemiBold" },
});
