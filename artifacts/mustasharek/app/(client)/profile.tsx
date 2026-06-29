import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  I18nManager,
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
import { useLanguage } from "@/contexts/LanguageContext";

const C = colors.light;

export default function ClientProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  async function handleLogout() {
    await logout();
    router.replace("/onboarding");
  }

  function toggleLanguage() {
    const next = lang === "ar" ? "en" : "ar";
    setLang(next);
    if (next === "ar" && !I18nManager.isRTL) {
      I18nManager.forceRTL(true);
    } else if (next === "en" && I18nManager.isRTL) {
      I18nManager.forceRTL(false);
    }
  }

  const items = [
    { icon: "user", label: t("name"), value: user?.name },
    { icon: "mail", label: t("email"), value: user?.email },
    { icon: "phone", label: t("phone"), value: user?.phone },
    { icon: "map-pin", label: t("country"), value: user?.country === "qatar" ? "🇶🇦 " + t("qatar") : "🇯🇴 " + t("jordan") },
  ];

  const align = lang === "ar" ? "right" : "left";
  const rowDir = lang === "ar" ? "row-reverse" : "row";

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
          <Text style={styles.avatarText}>{user?.name?.charAt(0) ?? "?"}</Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <View style={styles.roleBadge}>
          <Feather name="user" size={12} color={C.primary} />
          <Text style={styles.roleText}>{t("client")}</Text>
        </View>
      </View>

      {/* Language toggle */}
      <TouchableOpacity
        style={[styles.langCard, { flexDirection: rowDir }]}
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <View style={[styles.langIcon, { backgroundColor: lang === "ar" ? "#006B3F20" : "#1a2a4a15" }]}>
          <Text style={{ fontSize: 20 }}>{lang === "ar" ? "🇸🇦" : "🇺🇸"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.langName, { textAlign: align }]}>{t("language")}</Text>
          <Text style={[styles.langCurrent, { textAlign: align }]}>
            {lang === "ar" ? t("arabic") : t("english")} • {t("tapToSwitch")}
          </Text>
        </View>
        <Feather name="globe" size={18} color={C.gold} />
      </TouchableOpacity>

      <View style={styles.card}>
        {items.map((item, i) => (
          <View key={item.label} style={[styles.item, i < items.length - 1 && styles.itemBorder]}>
            <Text style={[styles.itemValue, { textAlign: align }]}>{item.value ?? "—"}</Text>
            <View style={[styles.itemLeft, { flexDirection: rowDir }]}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Feather name={item.icon as any} size={16} color={C.primary} />
            </View>
          </View>
        ))}
      </View>

      <TouchableOpacity style={[styles.logoutBtn, { flexDirection: rowDir }]} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>{t("logout")}</Text>
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
  langCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 20,
  },
  langIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  langName: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground },
  langCurrent: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
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
