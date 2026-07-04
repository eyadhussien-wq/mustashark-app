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
import { useData } from "@/contexts/DataContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { WhatsAppSupportCard } from "@/components/WhatsAppSupportCard";
import { formatPrice } from "@/utils/currency";

const C = colors.light;

export default function LawyerProfile() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { getLawyerById, consultations } = useData();
  const { lang, setLang, t } = useLanguage();

  // Get live rating data from DataContext (updated by client reviews)
  const liveProfile = user?.id ? getLawyerById(user.id) : undefined;
  const displayRating = liveProfile?.rating ?? (user as any)?.rating;
  const displayReviews = liveProfile?.reviewsCount ?? (user as any)?.reviewsCount;

  // Count completed consultations
  const completedCount = consultations.filter(
    (c) => c.lawyerId === user?.id && c.status === "completed"
  ).length;
  const ratedCount = consultations.filter(
    (c) => c.lawyerId === user?.id && c.status === "completed" && c.rating
  ).length;

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

  const align = lang === "ar" ? "right" : "left";
  const rowDir = lang === "ar" ? "row-reverse" : "row";

  const items = [
    { icon: "user", label: t("name"), value: user?.name },
    { icon: "mail", label: t("email"), value: user?.email },
    { icon: "phone", label: t("phone"), value: user?.phone },
    { icon: "briefcase", label: t("specialization"), value: user?.specialization },
    { icon: "file-text", label: t("licenseNumber"), value: user?.licenseNumber },
    { icon: "map-pin", label: t("country"), value: user?.country === "qatar" ? "🇶🇦 " + t("qatar") : "🇯🇴 " + t("jordan") },
    { icon: "clock", label: t("experience"), value: user?.experience ? `${user.experience} سنوات` : "—" },
    { icon: "dollar-sign", label: t("hourlyRate"), value: user?.hourlyRate && user?.country ? formatPrice(user.hourlyRate, user.country) : "—" },
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
            <Text style={styles.verifiedText}>{t("verifiedLawyer")}</Text>
          </View>
        )}

        {/* ── Live Star Rating display ── */}
        {displayRating !== undefined && displayRating > 0 && (
          <View style={styles.ratingCard}>
            {/* Stars row */}
            <View style={styles.ratingStarsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Feather
                  key={s}
                  name="star"
                  size={18}
                  color={s <= Math.round(displayRating) ? C.gold : "rgba(201,160,53,0.25)"}
                />
              ))}
            </View>
            {/* Number + reviews */}
            <View style={styles.ratingNumRow}>
              <Text style={styles.ratingNum}>{displayRating.toFixed(1)}</Text>
              <View style={styles.ratingDivider} />
              <View style={styles.reviewsBox}>
                <Text style={styles.reviewsCount}>{displayReviews}</Text>
                <Text style={styles.reviewsLabel}>تقييم</Text>
              </View>
              {ratedCount > 0 && (
                <>
                  <View style={styles.ratingDivider} />
                  <View style={styles.reviewsBox}>
                    <Text style={styles.reviewsCount}>{completedCount}</Text>
                    <Text style={styles.reviewsLabel}>مكتملة</Text>
                  </View>
                </>
              )}
            </View>
          </View>
        )}
      </View>

      {user?.bio && (
        <View style={styles.bioCard}>
          <Text style={styles.bioTitle}>نبذة تعريفية</Text>
          <Text style={styles.bioText}>{user.bio}</Text>
        </View>
      )}

      {/* Availability & language */}
      <TouchableOpacity
        style={[styles.settingsCard, { flexDirection: rowDir }]}
        onPress={() => router.push("/(lawyer)/settings")}
        activeOpacity={0.8}
      >
        <View style={[styles.settingsIcon, { backgroundColor: "rgba(26,42,74,0.1)" }]}>
          <Feather name="calendar" size={18} color={C.navy} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingsName, { textAlign: align }]}>{t("availability")}</Text>
          <Text style={[styles.settingsHint, { textAlign: align }]}>{t("tapToEditSchedule")}</Text>
        </View>
        <Feather name={lang === "ar" ? "chevron-left" : "chevron-right"} size={18} color={C.mutedForeground} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.settingsCard, { flexDirection: rowDir }]}
        onPress={toggleLanguage}
        activeOpacity={0.8}
      >
        <View style={[styles.settingsIcon, { backgroundColor: lang === "ar" ? "#006B3F20" : "#1a2a4a15" }]}>
          <Text style={{ fontSize: 20 }}>{lang === "ar" ? "🇸🇦" : "🇺🇸"}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingsName, { textAlign: align }]}>{t("language")}</Text>
          <Text style={[styles.settingsHint, { textAlign: align }]}>
            {lang === "ar" ? t("arabic") : t("english")} • {t("tapToSwitch")}
          </Text>
        </View>
        <Feather name="globe" size={18} color={C.gold} />
      </TouchableOpacity>

      <View style={styles.infoCard}>
        {items.map((item, i) => (
          <View key={item.label} style={[styles.item, i < items.length - 1 && styles.itemBorder]}>
            <Text style={[styles.itemValue, { textAlign: align }]}>{item.value ?? "—"}</Text>
            <View style={[styles.itemLeft, { flexDirection: rowDir }]}>
              <Text style={styles.itemLabel}>{item.label}</Text>
              <Feather name={item.icon as any} size={15} color={C.primary} />
            </View>
          </View>
        ))}
      </View>

      <WhatsAppSupportCard role="lawyer" title={t("supportTitle")} />

      <TouchableOpacity style={[styles.logoutBtn, { flexDirection: rowDir }]} onPress={handleLogout} activeOpacity={0.85}>
        <Text style={styles.logoutText}>{t("logout")}</Text>
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

  // ── Live rating card ──────────────────────────────────────────────────────
  ratingCard: {
    backgroundColor: C.navy,
    borderRadius: 18,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    gap: 10,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(201,160,53,0.25)",
    ...Platform.select({
      ios: {
        shadowColor: C.navy,
        shadowOpacity: 0.2,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 6 },
    }),
  },
  ratingStarsRow: {
    flexDirection: "row",
    gap: 6,
  },
  ratingNumRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  ratingNum: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: C.gold,
  },
  ratingDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  reviewsBox: { alignItems: "center", gap: 2 },
  reviewsCount: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  reviewsLabel: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },

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
  settingsCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border,
    padding: 14, marginBottom: 14,
  },
  settingsIcon: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  settingsName: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground },
  settingsHint: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  logoutBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 10,
    borderWidth: 1.5, borderColor: "#FEE2E2", backgroundColor: "#FFF5F5",
    borderRadius: colors.radius, paddingVertical: 14, paddingHorizontal: 20,
  },
  logoutText: { fontSize: 15, color: C.destructive, fontFamily: "Inter_600SemiBold" },
});
