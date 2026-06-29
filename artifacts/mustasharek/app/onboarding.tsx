import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
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
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO = require("../assets/images/logo-transparent.png");

const { width } = Dimensions.get("window");
const C = colors.light;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const isRTL = lang === "ar";

  // ── Fade + scale animation on mount ──────────────────────────────────────
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.72)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      // Brief pause so SplashScreen has fully hidden
      Animated.delay(80),
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5.5,
          tension: 55,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [fadeAnim, scaleAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.55],
  });

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0),
        },
      ]}
    >
      <Animated.View
        style={[styles.brandSection, { opacity: fadeAnim }]}
      >
        {/* Golden glow ring behind logo */}
        <Animated.View
          style={[styles.logoGlowRing, { opacity: glowOpacity }]}
        />

        {/* Logo with scale animation */}
        <Animated.View
          style={[
            styles.logoWrap,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        </Animated.View>

        <Text style={styles.appName}>{t("appName")}</Text>
        <Text style={styles.tagline}>{t("tagline")}</Text>
        <Text style={styles.subtitle}>{t("subtitle")}</Text>
      </Animated.View>

      <Animated.View style={[styles.features, { opacity: fadeAnim }]}>
        {[
          { icon: "check-circle", text: t("feature1") },
          { icon: "lock", text: t("feature2") },
          { icon: "clock", text: t("feature3") },
        ].map((f) => (
          <View style={[styles.featureRow, { flexDirection: isRTL ? "row-reverse" : "row" }]} key={f.text}>
            <Feather name={f.icon as any} size={18} color={C.gold} />
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>

      <Animated.View style={[styles.actions, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={[styles.clientBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={() => router.push("/auth/login?role=client")}
          activeOpacity={0.85}
        >
          <Feather name="user" size={18} color="#fff" />
          <Text style={styles.clientBtnText}>{t("iAmClient")}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.lawyerBtn, { flexDirection: isRTL ? "row-reverse" : "row" }]}
          onPress={() => router.push("/auth/lawyer-auth")}
          activeOpacity={0.85}
        >
          <Feather name="briefcase" size={18} color={C.navy} />
          <Text style={styles.lawyerBtnText}>{t("iAmLawyer")}</Text>
        </TouchableOpacity>
      </Animated.View>

      <Animated.View style={[styles.countries, { opacity: fadeAnim }]}>
        <Text style={styles.countriesLabel}>{t("serveIn")}</Text>
        <View style={styles.countriesRow}>
          <Text style={styles.countryTag}>🇶🇦 {t("qatar")}</Text>
          <Text style={styles.countryTag}>🇯🇴 {t("jordan")}</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const LOGO_SIZE = 168; // 20% larger than original 140

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: C.navy,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  brandSection: {
    alignItems: "center",
    paddingTop: 40,
    gap: 12,
  },
  logoGlowRing: {
    position: "absolute",
    top: 28,
    width: LOGO_SIZE + 60,
    height: LOGO_SIZE + 60,
    borderRadius: (LOGO_SIZE + 60) / 2,
    backgroundColor: C.gold,
    ...(Platform.OS === "ios"
      ? {
          shadowColor: C.gold,
          shadowOpacity: 0.9,
          shadowRadius: 40,
          shadowOffset: { width: 0, height: 0 },
        }
      : {}),
  },
  logoWrap: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: LOGO_SIZE / 2,
    // 3D drop shadow
    ...Platform.select({
      ios: {
        shadowColor: C.gold,
        shadowOpacity: 0.75,
        shadowRadius: 22,
        shadowOffset: { width: 0, height: 8 },
      },
      android: {
        elevation: 18,
      },
      web: {
        boxShadow: `0px 8px 32px rgba(201,160,53,0.7), 0px 0px 60px rgba(201,160,53,0.35)`,
      } as any,
    }),
  },
  logo: {
    width: LOGO_SIZE,
    height: LOGO_SIZE,
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
