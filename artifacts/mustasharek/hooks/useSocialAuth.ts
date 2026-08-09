import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import { useCallback, useState } from "react";
import OAUTH from "@/constants/oauth";

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = "google" | "facebook" | "apple";
export type PortalRole = "client" | "lawyer";

export interface SocialProfile {
  provider: SocialProvider;
  id: string;
  name: string;
  email: string;
  jwt?: string;
}

const APPLE_EMAILS_KEY = "mustasharek_apple_emails_v1";

async function getAppleStoredEmail(appleUserId: string): Promise<string> {
  try {
    const raw = await AsyncStorage.getItem(APPLE_EMAILS_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    return map[appleUserId] ?? "";
  } catch {
    return "";
  }
}

async function saveAppleEmail(appleUserId: string, email: string) {
  try {
    const raw = await AsyncStorage.getItem(APPLE_EMAILS_KEY);
    const map: Record<string, string> = raw ? JSON.parse(raw) : {};
    map[appleUserId] = email;
    await AsyncStorage.setItem(APPLE_EMAILS_KEY, JSON.stringify(map));
  } catch {}
}

function parseFragment(url: string): Record<string, string> {
  const hash = url.split("#")[1] ?? url.split("?")[1] ?? "";
  return Object.fromEntries(
    hash.split("&").map((p) => {
      const [k, ...v] = p.split("=");
      return [decodeURIComponent(k ?? ""), decodeURIComponent(v.join("="))];
    }),
  );
}

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN
  ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`
  : "";

async function callBackendAuth(
  provider: SocialProvider,
  token: string,
  opts?: { role?: PortalRole; displayName?: string; storedEmail?: string },
): Promise<{ jwt: string; user: Record<string, unknown> } | null> {
  if (!API_BASE) return null;
  let res: Response;
  try {
    res = await fetch(`${API_BASE}/auth/social`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        provider,
        token,
        role: opts?.role ?? "client",
        displayName: opts?.displayName,
        storedEmail: opts?.storedEmail,
      }),
    });
  } catch {
    return null;
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { message?: string; error?: string };
    throw new Error(body.message ?? body.error ?? "فشل التحقق من الخادم. يرجى المحاولة مجدداً.");
  }

  const data = await res.json() as { ok: boolean; jwt?: string; user?: Record<string, unknown> };
  if (!data.ok || !data.jwt) return null;
  return { jwt: data.jwt, user: data.user ?? {} };
}

export function useSocialAuth() {
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  const loginWithGoogle = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (!OAUTH.google.clientId) throw new Error("لم يتم ضبط Google Client ID بعد.\nأضف EXPO_PUBLIC_GOOGLE_CLIENT_ID في متغيرات البيئة.");
    setLoading("google");
    try {
      const redirectUri = "mustasharek://auth/callback";
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${OAUTH.google.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent("openid profile email")}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");
      const params = parseFragment(result.url);
      const accessToken = params["access_token"];
      if (!accessToken) throw new Error("لم يتم استلام رمز الوصول من Google");
      const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", { headers: { Authorization: `Bearer ${accessToken}` } });
      const info = await infoRes.json() as Record<string, string>;
      const profile: SocialProfile = { provider: "google", id: info.sub ?? "", name: info.name ?? info.email ?? "", email: info.email ?? "" };
      const backend = await callBackendAuth("google", accessToken, { role });
      if (backend?.jwt) profile.jwt = backend.jwt;
      return profile;
    } finally { setLoading(null); }
  }, []);

  const loginWithFacebook = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (!OAUTH.facebook.appId) throw new Error("لم يتم ضبط Facebook App ID بعد.\nأضف EXPO_PUBLIC_FACEBOOK_APP_ID في متغيرات البيئة.");
    setLoading("facebook");
    try {
      const redirectUri = "mustasharek://auth/callback";
      const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${OAUTH.facebook.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent("email,public_profile")}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");
      const params = parseFragment(result.url);
      const accessToken = params["access_token"];
      if (!accessToken) throw new Error("لم يتم استلام رمز الوصول من Facebook");
      const infoRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`);
      const info = await infoRes.json() as Record<string, string>;
      const profile: SocialProfile = { provider: "facebook", id: info.id ?? "", name: info.name ?? "", email: info.email ?? "" };
      const backend = await callBackendAuth("facebook", accessToken, { role });
      if (backend?.jwt) profile.jwt = backend.jwt;
      return profile;
    } finally { setLoading(null); }
  }, []);

  const loginWithApple = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (Platform.OS !== "ios") throw new Error("تسجيل الدخول بـ Apple متاح على أجهزة iOS فقط");
    const isAvailable = await AppleAuthentication.isAvailableAsync();
    if (!isAvailable) throw new Error("تسجيل الدخول بـ Apple غير متاح على هذا الجهاز (يتطلب iOS 13+)");
    setLoading("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
      const { user: appleUserId, identityToken, email, fullName } = credential;
      if (!identityToken) throw new Error("لم يتم استلام رمز التحقق من Apple");
      const displayName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(" ").trim();
      let resolvedEmail = email ?? "";
      if (email) await saveAppleEmail(appleUserId, email); else resolvedEmail = await getAppleStoredEmail(appleUserId);
      const profile: SocialProfile = { provider: "apple", id: appleUserId, name: displayName || resolvedEmail.split("@")[0] || "مستخدم Apple", email: resolvedEmail };
      const backend = await callBackendAuth("apple", identityToken, { role, displayName: profile.name, storedEmail: resolvedEmail });
      if (backend?.jwt) profile.jwt = backend.jwt;
      return profile;
    } finally { setLoading(null); }
  }, []);

  return { loading, loginWithGoogle, loginWithFacebook, loginWithApple };
}
