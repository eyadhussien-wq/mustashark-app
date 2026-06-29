import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
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
const C = colors.light;

export default function LanguageSplash() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { setLang, t } = useLanguage();

  function selectLanguage(lang: "ar" | "en") {
    setLang(lang);
    router.replace("/onboarding");
  }

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
          paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
        },
      ]}
    >
      <View style={styles.brand}>
        <Image source={LOGO} style={styles.logo} resizeMode="contain" />
        <Text style={styles.appName}>Mustasharek</Text>
        <Text style={styles.tagline}>مستشارك</Text>
        <Text style={styles.subtitle}>{t("chooseLanguage")}</Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity
          style={styles.langCard}
          onPress={() => selectLanguage("ar")}
          activeOpacity={0.85}
        >
          <View style={styles.langIcon}>
            <Text style={styles.langFlag}>🇸🇦</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.langName}>العربية</Text>
            <Text style={styles.langSub}>Arabic • الوجهة من اليمين إلى اليسار</Text>
          </View>
          <Feather name="arrow-left" size={20} color={C.gold} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.langCard}
          onPress={() => selectLanguage("en")}
          activeOpacity={0.85}
        >
          <View style={styles.langIcon}>
            <Text style={styles.langFlag}>🇺🇸</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.langName}>English</Text>
            <Text style={styles.langSub}>Left-to-Right • English Interface</Text>
          </View>
          <Feather name="arrow-right" size={20} color={C.gold} />
        </TouchableOpacity>
      </View>

      <Text style={styles.hint}>
        {t("chooseLanguage")} • You can change this anytime from Settings
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: C.navy,
    paddingHorizontal: 28, justifyContent: "space-between",
  },
  brand: { alignItems: "center", paddingTop: 48, gap: 10 },
  logo: { width: 120, height: 120, borderRadius: 60 },
  appName: { fontSize: 28, fontFamily: "Inter_700Bold", color: "#fff" },
  tagline: { fontSize: 18, color: C.gold, fontFamily: "Inter_500Medium" },
  subtitle: { fontSize: 14, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular", textAlign: "center" },

  options: { gap: 16 },
  langCard: {
    flexDirection: "row", alignItems: "center", gap: 14,
    backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)", borderRadius: 18,
    padding: 18,
  },
  langIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "rgba(201,160,53,0.15)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.3)",
  },
  langFlag: { fontSize: 22 },
  langName: { fontSize: 18, fontFamily: "Inter_700Bold", color: "#fff" },
  langSub: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },

  hint: { fontSize: 12, color: "rgba(255,255,255,0.3)", textAlign: "center", fontFamily: "Inter_400Regular", paddingBottom: 16 },
});
