import * as AppleAuthentication from "expo-apple-authentication";
import * as WebBrowser from "expo-web-browser";
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

function parseFragment(url: string): Record<string, string> {
  const hash = url.split("#")[1] ?? url.split("?")[1] ?? "";
  return Object.fromEntries(
    hash.split("&").filter(Boolean).map((p) => {
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
  opts?: { role?: PortalRole; displayName?: string },
): Promise<{ jwt: string; user: Record<string, unknown> }> {
  if (!API_BASE) {
    throw new Error("خدمة المصادقة غير مهيأة. لا يمكن تسجيل الدخول بدون الخادم.");
  }

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
      }),
    });
  } catch {
    throw new Error("تعذر الاتصال بخدمة المصادقة. لا يمكن المتابعة بدون الخادم.");
  }

  const body = await res.json().catch(() => ({})) as {
    message?: string;
    error?: string;
    ok?: boolean;
    jwt?: string;
    user?: Record<string, unknown>;
  };

  if (!res.ok) {
    throw new Error(body.message ?? body.error ?? "فشل التحقق من الخادم. يرجى المحاولة مجدداً.");
  }
  if (!body.ok || !body.jwt) {
    throw new Error("لم يُصدر الخادم جلسة مصادقة صالحة.");
  }
  return { jwt: body.jwt, user: body.user ?? {} };
}

export function useSocialAuth() {
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  const loginWithGoogle = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (!OAUTH.google.clientId) {
      throw new Error("لم يتم ضبط Google Client ID بعد.\nأضف EXPO_PUBLIC_GOOGLE_CLIENT_ID في متغيرات البيئة.");
    }
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
      if (!infoRes.ok) throw new Error("تعذر الحصول على بيانات Google");
      const info = await infoRes.json() as Record<string, string>;
      const profile: SocialProfile = { provider: "google", id: info.sub ?? "", name: info.name ?? info.email ?? "", email: info.email ?? "" };
      const backend = await callBackendAuth("google", accessToken, { role });
      profile.jwt = backend.jwt;
      return profile;
    } finally {
      setLoading(null);
    }
  }, []);

  const loginWithFacebook = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (!OAUTH.facebook.appId) {
      throw new Error("لم يتم ضبط Facebook App ID بعد.\nأضف EXPO_PUBLIC_FACEBOOK_APP_ID في متغيرات البيئة.");
    }
    setLoading("facebook");
    try {
      const redirectUri = "mustasharek://auth/callback";
      const url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${OAUTH.facebook.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=token&scope=${encodeURIComponent("email,public_profile")}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");
      const params = parseFragment(result.url);
      const accessToken = params["access_token"];
      if (!accessToken) throw new Error("لم يتم استلام رمز الوصول من Facebook");
      const infoRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email&access_token=${encodeURIComponent(accessToken)}`);
      if (!infoRes.ok) throw new Error("تعذر الحصول على بيانات Facebook");
      const info = await infoRes.json() as Record<string, string>;
      const profile: SocialProfile = { provider: "facebook", id: info.id ?? "", name: info.name ?? "", email: info.email ?? "" };
      const backend = await callBackendAuth("facebook", accessToken, { role });
      profile.jwt = backend.jwt;
      return profile;
    } finally {
      setLoading(null);
    }
  }, []);

  const loginWithApple = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (Platform.OS !== "ios") throw new Error("تسجيل الدخول بـ Apple متاح على أجهزة iOS فقط");
    if (!(await AppleAuthentication.isAvailableAsync())) throw new Error("تسجيل الدخول بـ Apple غير متاح على هذا الجهاز (يتطلب iOS 13+)");
    setLoading("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({ requestedScopes: [AppleAuthentication.AppleAuthenticationScope.FULL_NAME, AppleAuthentication.AppleAuthenticationScope.EMAIL] });
      const { user: appleUserId, identityToken, email, fullName } = credential;
      if (!identityToken) throw new Error("لم يتم استلام رمز التحقق من Apple");
      const displayName = [fullName?.givenName, fullName?.familyName].filter(Boolean).join(" ").trim();
      const profile: SocialProfile = { provider: "apple", id: appleUserId, name: displayName || email?.split("@")[0] || "مستخدم Apple", email: email ?? "" };
      const backend = await callBackendAuth("apple", identityToken, { role, displayName: profile.name });
      profile.jwt = backend.jwt;
      return profile;
    } finally {
      setLoading(null);
    }
  }, []);

  return { loading, loginWithGoogle, loginWithFacebook, loginWithApple };
}
