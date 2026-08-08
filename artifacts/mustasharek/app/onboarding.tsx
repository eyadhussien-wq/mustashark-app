import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Image, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useLanguage } from "@/contexts/LanguageContext";

const LOGO = require("../assets/images/logo-transparent.png");
const C = colors.light;

export default function Onboarding() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t, lang } = useLanguage();
  const isRTL = lang === "ar";
  const fade = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.86)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 7, tension: 55, useNativeDriver: true }),
    ]).start();
  }, [fade, scale]);

  return (
    <LinearGradient colors={["#315C96", C.navy, "#1A315A"]} locations={[0, 0.48, 1]} style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} bounces={false} contentContainerStyle={[styles.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 18 }]}>
        <Animated.View style={[styles.brand, { opacity: fade, transform: [{ scale }] }]}>
          <View style={styles.logoHalo}><Image source={LOGO} style={styles.logo} resizeMode="contain" /></View>
          <Text style={styles.appName}>{t("appName")}</Text>
          <Text style={styles.tagline}>{t("tagline")}</Text>
          <Text style={styles.subtitle}>{t("subtitle")}</Text>
        </Animated.View>

        <Animated.View style={[styles.features, { opacity: fade }]}>
          {[
            { icon: "check-circle", text: t("feature1") },
            { icon: "lock", text: t("feature2") },
            { icon: "clock", text: t("feature3") },
          ].map((feature) => (
            <View key={feature.text} style={[styles.featureRow, { flexDirection: isRTL ? "row-reverse" : "row" }]}>
              <Feather name={feature.icon as any} size={21} color={C.gold} />
              <Text style={[styles.featureText, { textAlign: isRTL ? "right" : "left" }]}>{feature.text}</Text>
            </View>
          ))}
        </Animated.View>

        <Animated.View style={[styles.actions, { opacity: fade }]}>
          <TouchableOpacity style={styles.clientButton} onPress={() => router.push("/auth/login?role=client")} activeOpacity={0.86}>
            <Feather name="user" size={20} color="#182B4C" />
            <Text style={styles.clientButtonText}>{t("iAmClient")}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.lawyerButton} onPress={() => router.push("/auth/lawyer-auth")} activeOpacity={0.9}>
            <Feather name="briefcase" size={20} color={C.navy} />
            <Text style={styles.lawyerButtonText}>{t("iAmLawyer")}</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View style={[styles.countries, { opacity: fade }]}>
          <Text style={styles.countriesLabel}>{t("serveIn")}</Text>
          <View style={styles.countryRow}>
            <View style={styles.countryPill}><Text style={styles.countryText}>🇶🇦 {t("qatar")}</Text></View>
            <View style={styles.countryPill}><Text style={styles.countryText}>🇯🇴 {t("jordan")}</Text></View>
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 28, justifyContent: "space-between" },
  brand: { alignItems: "center", paddingTop: 8 },
  logoHalo: { width: 218, height: 218, borderRadius: 109, alignItems: "center", justifyContent: "center", marginBottom: 16, ...Platform.select({ ios: { shadowColor: C.gold, shadowOpacity: 0.55, shadowRadius: 28, shadowOffset: { width: 0, height: 10 } }, android: { elevation: 14 }, web: { boxShadow: "0px 12px 34px rgba(201,160,53,0.48), 0px 0px 55px rgba(201,160,53,0.22)" } as any }) },
  logo: { width: 218, height: 218 },
  appName: { fontSize: 39, lineHeight: 48, fontFamily: "Inter_700Bold", color: C.gold, textAlign: "center", letterSpacing: 0.5 },
  tagline: { marginTop: 12, fontSize: 16, lineHeight: 24, color: "#DCC889", fontFamily: "Inter_500Medium", textAlign: "center" },
  subtitle: { marginTop: 8, maxWidth: 360, fontSize: 14, lineHeight: 25, color: "rgba(255,255,255,0.78)", fontFamily: "Inter_400Regular", textAlign: "center" },
  features: { marginTop: 18, gap: 17, paddingHorizontal: 8 },
  featureRow: { alignItems: "center", gap: 12, minHeight: 27 },
  featureText: { flex: 1, fontSize: 15, lineHeight: 23, color: "#F8F9FC", fontFamily: "Inter_500Medium" },
  actions: { marginTop: 20, gap: 13 },
  clientButton: { minHeight: 60, borderRadius: 15, backgroundColor: C.gold, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 11, paddingHorizontal: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.16)", ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.18, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } }, android: { elevation: 5 } }) },
  clientButtonText: { color: "#182B4C", fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  lawyerButton: { minHeight: 60, borderRadius: 15, backgroundColor: "#FFFFFF", alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 11, paddingHorizontal: 18, borderWidth: 1, borderColor: "#E8EAF0", ...Platform.select({ ios: { shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 8, shadowOffset: { width: 0, height: 3 } }, android: { elevation: 3 } }) },
  lawyerButtonText: { color: C.navy, fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  countries: { alignItems: "center", marginTop: 16 },
  countriesLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", marginBottom: 8 },
  countryRow: { flexDirection: "row", gap: 10 },
  countryPill: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 18, borderWidth: 1, borderColor: "rgba(255,255,255,0.22)", backgroundColor: "rgba(255,255,255,0.06)" },
  countryText: { color: "rgba(255,255,255,0.78)", fontSize: 12, fontFamily: "Inter_500Medium" },
});
