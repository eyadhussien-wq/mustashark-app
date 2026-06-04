import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

const LOGO = require("../assets/images/logo-transparent.png");

const { width, height } = Dimensions.get("window");
const C = colors.light;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0), paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) }]}>
      <View style={styles.brandSection}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>مستشارك</Text>
        <Text style={styles.tagline}>استشاراتك القانونية بين يديك</Text>
        <Text style={styles.subtitle}>
          منصة تربط العملاء بأفضل المحامين المرخصين{"\n"}في قطر والأردن
        </Text>
      </View>

      <View style={styles.features}>
        {[
          { icon: "check-circle", text: "محامون معتمدون وموثّقون" },
          { icon: "lock", text: "استشارة آمنة وسرية تامة" },
          { icon: "clock", text: "متاح على مدار الساعة" },
        ].map((f) => (
          <View style={styles.featureRow} key={f.text}>
            <Feather name={f.icon as any} size={18} color={C.gold} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.clientBtn}
          onPress={() => router.push("/auth/login?role=client")}
          activeOpacity={0.85}
        >
          <Feather name="user" size={18} color="#fff" />
          <Text style={styles.clientBtnText}>أنا عميل — أبحث عن محامٍ</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.lawyerBtn}
          onPress={() => router.push("/auth/login?role=lawyer")}
          activeOpacity={0.85}
        >
          <Feather name="briefcase" size={18} color={C.navy} />
          <Text style={styles.lawyerBtnText}>أنا محامٍ — أقدم استشارة</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.countries}>
        <Text style={styles.countriesLabel}>نخدمك في</Text>
        <View style={styles.countriesRow}>
          <Text style={styles.countryTag}>🇶🇦 قطر</Text>
          <Text style={styles.countryTag}>🇯🇴 الأردن</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.navy,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  brandSection: {
    alignItems: "center",
    paddingTop: 48,
    gap: 12,
  },
  logo: {
    width: 140,
    height: 140,
    marginBottom: 4,
  },
  appName: {
    fontSize: 40,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 16,
    color: C.gold,
    fontFamily: "Inter_500Medium",
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255,255,255,0.6)",
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginTop: 4,
  },
  features: {
    gap: 14,
    paddingVertical: 24,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    color: "rgba(255,255,255,0.85)",
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  actions: {
    gap: 12,
  },
  clientBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.gold,
    borderRadius: colors.radius,
    paddingVertical: 16,
  },
  clientBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  lawyerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#fff",
    borderRadius: colors.radius,
    paddingVertical: 16,
  },
  lawyerBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: C.navy,
  },
  countries: {
    alignItems: "center",
    paddingBottom: 16,
    gap: 8,
  },
  countriesLabel: {
    fontSize: 12,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "Inter_400Regular",
  },
  countriesRow: {
    flexDirection: "row",
    gap: 16,
  },
  countryTag: {
    fontSize: 13,
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Inter_500Medium",
  },
});
