import * as AppleAuthentication from "expo-apple-authentication";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import OAUTH from "@/constants/oauth";
import { useAuth } from "@/contexts/AuthContext";
import { type SocialProvider, type PortalRole, useSocialAuth } from "@/hooks/useSocialAuth";

interface Props {
  role: PortalRole;
  onSuccess?: () => void;
  requireTermsConsent?: boolean;
}

const C = colors.light;

interface ProviderConfig { id: SocialProvider; label: string; color: string; bg: string; border: string; icon: string; }
const PROVIDERS: ProviderConfig[] = [
  { id: "google", label: "Google", color: "#3C4043", bg: "#FFFFFF", border: "#DADCE0", icon: "google" },
  { id: "facebook", label: "Facebook", color: "#FFFFFF", bg: "#1877F2", border: "#1877F2", icon: "facebook" },
];

function isConfigured(provider: SocialProvider): boolean {
  if (provider === "google") return !!OAUTH.google.clientId;
  if (provider === "facebook") return !!OAUTH.facebook.appId;
  if (provider === "apple") return Platform.OS === "ios";
  return false;
}

export function SocialLoginButtons({ role, onSuccess, requireTermsConsent = false }: Props) {
  const { loginWithSocial } = useAuth();
  const { loading, loginWithGoogle, loginWithFacebook, loginWithApple } = useSocialAuth();
  const [error, setError] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  function consentForRequest() {
    if (!requireTermsConsent) return undefined;
    if (!termsAccepted) {
      setError("يجب الموافقة على الشروط والأحكام قبل إنشاء الحساب.");
      return null;
    }
    return { termsAccepted: true, termsAcceptedAt: new Date().toISOString() } as const;
  }

  async function handle(p: ProviderConfig) {
    if (!isConfigured(p.id)) return;
    const consent = consentForRequest();
    if (consent === null) return;
    setError(null);
    try {
      let profile;
      if (p.id === "google") profile = await loginWithGoogle(role, consent);
      else profile = await loginWithFacebook(role, consent);
      await loginWithSocial(profile, role);
      onSuccess?.();
    } catch (e: any) {
      const msg: string = e?.message ?? "حدث خطأ أثناء تسجيل الدخول";
      if (!msg.includes("إلغاء") && !msg.includes("cancel")) setError(msg);
    }
  }

  async function handleAppleNative() {
    const consent = consentForRequest();
    if (consent === null) return;
    setError(null);
    try {
      const profile = await loginWithApple(role, consent);
      await loginWithSocial(profile, role);
      onSuccess?.();
    } catch (e: any) {
      const msg: string = e?.message ?? "حدث خطأ أثناء تسجيل الدخول بـ Apple";
      if (!msg.includes("إلغاء") && !msg.includes("cancel") && !msg.includes("ERR_CANCELED")) setError(msg);
    }
  }

  const isBusy = loading !== null;

  return (
    <View style={styles.container}>
      {requireTermsConsent && (
        <TouchableOpacity style={styles.termsRow} onPress={() => setTermsAccepted((v) => !v)} activeOpacity={0.8}>
          <View style={[styles.checkbox, termsAccepted && styles.checkboxChecked]}>
            {termsAccepted && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
          </View>
          <Text style={styles.termsText}>أوافق على الشروط والأحكام وسياسة الخصوصية</Text>
        </TouchableOpacity>
      )}
      <View style={styles.dividerRow}><View style={styles.line} /><Text style={styles.dividerText}>أو تابع بـ</Text><View style={styles.line} /></View>
      <View style={styles.btns}>
        {PROVIDERS.map((p) => {
          const busy = loading === p.id;
          const configured = isConfigured(p.id);
          return (
            <TouchableOpacity key={p.id} style={[styles.btn, { backgroundColor: configured ? p.bg : C.secondary, borderColor: configured ? p.border : C.border }, (!configured || isBusy) && styles.btnDisabled]} onPress={() => handle(p)} disabled={!configured || isBusy} activeOpacity={0.8}>
              {busy ? <ActivityIndicator size="small" color={p.id === "google" ? C.navy : "#fff"} /> : <MaterialCommunityIcons name={p.icon as any} size={16} color={configured ? p.color : C.mutedForeground} />}
              <Text style={[styles.btnLabel, { color: configured ? p.color : C.mutedForeground }]}>{p.label}</Text>
              {!configured && <Text style={styles.soonBadge}>قريباً</Text>}
            </TouchableOpacity>
          );
        })}
      </View>
      {Platform.OS === "ios" ? (
        <View style={styles.appleWrapper}>
          <AppleAuthentication.AppleAuthenticationButton buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN} buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK} cornerRadius={10} style={styles.appleBtn} onPress={handleAppleNative} />
          {loading === "apple" && <View style={styles.appleOverlay}><ActivityIndicator size="small" color="#fff" /></View>}
        </View>
      ) : (
        <View style={[styles.btn, styles.appleBtnFallback]}><MaterialCommunityIcons name="apple" size={16} color={C.mutedForeground} /><Text style={[styles.btnLabel, { color: C.mutedForeground }]}>Apple</Text><Text style={styles.soonBadge}>iOS فقط</Text></View>
      )}
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  termsRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14, paddingHorizontal: 2 },
  checkbox: { width: 22, height: 22, borderRadius: 5, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: C.navy, borderColor: C.navy },
  termsText: { flex: 1, fontSize: 12, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  btns: { flexDirection: "row", gap: 8, marginBottom: 8 },
  btn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 12, borderRadius: 10, borderWidth: 1.5 },
  btnDisabled: { opacity: 0.6 },
  btnLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  soonBadge: { fontSize: 9, fontFamily: "Inter_500Medium", color: C.mutedForeground, backgroundColor: C.border, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  appleWrapper: { marginBottom: 4, position: "relative" },
  appleBtn: { width: "100%", height: 48 },
  appleOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.4)", borderRadius: 10, alignItems: "center", justifyContent: "center" },
  appleBtnFallback: { flex: 0, width: "100%", backgroundColor: C.secondary, borderColor: C.border, opacity: 0.65, marginBottom: 4 },
  errorText: { marginTop: 8, fontSize: 12, color: "#DC2626", fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});
