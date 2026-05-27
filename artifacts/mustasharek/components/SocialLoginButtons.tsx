import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";
import OAUTH from "@/constants/oauth";
import { useAuth } from "@/contexts/AuthContext";
import type { UserRole } from "@/contexts/AuthContext";
import { type SocialProvider, useSocialAuth } from "@/hooks/useSocialAuth";

interface Props {
  role: UserRole;
  onSuccess?: () => void;
}

const C = colors.light;

const PROVIDERS: {
  id: SocialProvider;
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
  configKey: string;
  setupUrl: string;
  steps: string[];
}[] = [
  {
    id: "google",
    label: "Google",
    color: "#3C4043",
    bg: "#FFFFFF",
    border: "#DADCE0",
    icon: "google",
    configKey: "EXPO_PUBLIC_GOOGLE_CLIENT_ID",
    setupUrl: "console.cloud.google.com",
    steps: [
      "افتح Google Cloud Console",
      'أنشئ مشروعاً جديداً أو اختر مشروعاً موجوداً',
      'اذهب إلى "APIs & Services" → "Credentials"',
      'اضغط "Create Credentials" → "OAuth 2.0 Client ID"',
      "اختر نوع التطبيق: Android / iOS / Web",
      "أضف Client ID في متغير EXPO_PUBLIC_GOOGLE_CLIENT_ID",
    ],
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#FFFFFF",
    bg: "#1877F2",
    border: "#1877F2",
    icon: "facebook",
    configKey: "EXPO_PUBLIC_FACEBOOK_APP_ID",
    setupUrl: "developers.facebook.com",
    steps: [
      "افتح Facebook Developers Portal",
      'اضغط "Create App" واختر نوع "Consumer"',
      'أضف منتج "Facebook Login"',
      "من لوحة التحكم انسخ App ID",
      "أضفه في متغير EXPO_PUBLIC_FACEBOOK_APP_ID",
    ],
  },
  {
    id: "microsoft",
    label: "Microsoft",
    color: "#FFFFFF",
    bg: "#2F2F2F",
    border: "#2F2F2F",
    icon: "microsoft",
    configKey: "EXPO_PUBLIC_MICROSOFT_CLIENT_ID",
    setupUrl: "portal.azure.com",
    steps: [
      "افتح Azure Portal",
      'اذهب إلى "Azure Active Directory"',
      '"App registrations" → "New registration"',
      "أدخل اسم التطبيق واختر نوع الحساب",
      "من نظرة عامة انسخ Application (client) ID",
      "أضفه في متغير EXPO_PUBLIC_MICROSOFT_CLIENT_ID",
    ],
  },
];

function isConfigured(provider: SocialProvider): boolean {
  if (provider === "google") return !!OAUTH.google.clientId;
  if (provider === "facebook") return !!OAUTH.facebook.appId;
  if (provider === "microsoft") return !!OAUTH.microsoft.clientId;
  return false;
}

export function SocialLoginButtons({ role, onSuccess }: Props) {
  const { loginWithSocial } = useAuth();
  const { loading, loginWithGoogle, loginWithFacebook, loginWithMicrosoft } =
    useSocialAuth();
  const [guide, setGuide] = useState<(typeof PROVIDERS)[0] | null>(null);

  async function handle(p: (typeof PROVIDERS)[0]) {
    if (!isConfigured(p.id)) {
      setGuide(p);
      return;
    }
    try {
      let profile;
      if (p.id === "google") profile = await loginWithGoogle();
      else if (p.id === "facebook") profile = await loginWithFacebook();
      else profile = await loginWithMicrosoft();
      await loginWithSocial(profile, role);
      onSuccess?.();
    } catch (e: any) {
      setGuide(null);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>أو تابع بـ</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.btns}>
        {PROVIDERS.map((p) => {
          const busy = loading === p.id;
          const configured = isConfigured(p.id);
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.btn,
                { backgroundColor: p.bg, borderColor: p.border },
                !configured && styles.btnUnconfigured,
              ]}
              onPress={() => handle(p)}
              disabled={loading !== null}
              activeOpacity={0.8}
            >
              {busy ? (
                <ActivityIndicator
                  size="small"
                  color={p.id === "google" ? C.navy : "#fff"}
                />
              ) : (
                <MaterialCommunityIcons
                  name={p.icon as any}
                  size={16}
                  color={configured ? p.color : C.mutedForeground}
                />
              )}
              <Text
                style={[
                  styles.btnLabel,
                  { color: configured ? p.color : C.mutedForeground },
                ]}
              >
                {p.label}
              </Text>
              {!configured && (
                <Text style={styles.soonBadge}>قريباً</Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Setup guide modal */}
      <Modal
        visible={!!guide}
        transparent
        animationType="slide"
        onRequestClose={() => setGuide(null)}
      >
        <View style={styles.overlay}>
          <View style={styles.sheet}>
            <View style={styles.sheetHandle} />

            <View style={styles.sheetHeader}>
              <MaterialCommunityIcons
                name={guide?.icon as any}
                size={28}
                color={C.navy}
              />
              <View style={styles.sheetTitleWrap}>
                <Text style={styles.sheetTitle}>
                  تفعيل الدخول بـ {guide?.label}
                </Text>
                <Text style={styles.sheetSub}>
                  يتطلب تسجيل التطبيق في {guide?.setupUrl}
                </Text>
              </View>
            </View>

            <View style={styles.stepsCard}>
              <Text style={styles.stepsTitle}>خطوات الإعداد</Text>
              <ScrollView
                style={{ maxHeight: 200 }}
                showsVerticalScrollIndicator={false}
              >
                {guide?.steps.map((step, i) => (
                  <View key={i} style={styles.step}>
                    <View style={styles.stepNum}>
                      <Text style={styles.stepNumText}>{i + 1}</Text>
                    </View>
                    <Text style={styles.stepText}>{step}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.envBox}>
              <Text style={styles.envLabel}>متغير البيئة المطلوب</Text>
              <Text style={styles.envKey}>{guide?.configKey}</Text>
            </View>

            <Text style={styles.envNote}>
              بعد الحصول على المفتاح، أضفه في إعدادات المشروع ← Secrets
            </Text>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={() => setGuide(null)}
            >
              <Text style={styles.closeBtnText}>حسناً، فهمت</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 14,
  },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  btns: { flexDirection: "row", gap: 8 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  btnUnconfigured: {
    backgroundColor: C.secondary,
    borderColor: C.border,
    opacity: 0.75,
  },
  btnLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  soonBadge: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: C.mutedForeground,
    backgroundColor: C.border,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  sheetHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: C.border,
    alignSelf: "center",
    marginBottom: 20,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 20,
  },
  sheetTitleWrap: { flex: 1 },
  sheetTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
    textAlign: "right",
  },
  sheetSub: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    marginTop: 2,
  },
  stepsCard: {
    backgroundColor: "#F8FAFF",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#E5EBF5",
    marginBottom: 14,
    gap: 10,
  },
  stepsTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    color: C.navy,
    textAlign: "right",
  },
  step: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginTop: 8,
  },
  stepNum: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: C.navy,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Inter_700Bold",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    color: C.foreground,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 20,
  },
  envBox: {
    backgroundColor: "#1B3A6B",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  envLabel: {
    fontSize: 11,
    color: "rgba(255,255,255,0.65)",
    fontFamily: "Inter_400Regular",
  },
  envKey: {
    fontSize: 12,
    color: "#C9A035",
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  envNote: {
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    marginBottom: 16,
    lineHeight: 17,
  },
  closeBtn: {
    backgroundColor: C.navy,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  closeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
