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
  jwt: string;
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

/**
 * Production social authentication is fail-closed.
 * A provider token is never sufficient to create a local session: the API
 * must verify the provider identity and issue the canonical JWT first.
 */
async function callBackendAuth(
  provider: SocialProvider,
  token: string,
  opts?: { role?: PortalRole; displayName?: string; storedEmail?: string },
): Promise<{ jwt: string; user: Record<string, unknown> }> {
  if (!API_BASE) {
    throw new Error("تعذر تهيئة خدمة تسجيل الدخول الآمن. يرجى المحاولة مرة أخرى.");
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
        storedEmail: opts?.storedEmail,
      }),
    });
  } catch {
    throw new Error("تعذر الاتصال بخدمة تسجيل الدخول. لم يتم إنشاء جلسة دخول.");
  }

  const data = await res.json().catch(() => ({})) as {
    ok?: boolean;
    jwt?: string;
    user?: Record<string, unknown>;
    message?: string;
    error?: string;
  };

  if (!res.ok) {
    throw new Error(
      data.message ?? data.error ?? "فشل التحقق من الخادم. يرجى المحاولة مجدداً.",
    );
  }

  if (!data.ok || !data.jwt) {
    throw new Error("تعذر إنشاء جلسة دخول آمنة. لم يمنح الخادم رمز جلسة صالحاً.");
  }

  return { jwt: data.jwt, user: data.user ?? {} };
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
      const url =
        `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${OAUTH.google.clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent("openid profile email")}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");
      const params = parseFragment(result.url);
      const accessToken = params["access_token"];
      if (!accessToken) throw new Error("لم يتم استلام رمز الوصول من Google");

      const infoRes = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!infoRes.ok) throw new Error("تعذر التحقق من حساب Google");
      const info = await infoRes.json() as Record<string, string>;
      if (!info.sub || !info.email) throw new Error("تعذر قراءة هوية حساب Google");

      const backend = await callBackendAuth("google", accessToken, { role });
      return {
        provider: "google",
        id: info.sub,
        name: info.name ?? info.email,
        email: info.email,
        jwt: backend.jwt,
      };
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
      const url =
        `https://www.facebook.com/v18.0/dialog/oauth?` +
        `client_id=${OAUTH.facebook.appId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent("email,public_profile")}`;
      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");
      const params = parseFragment(result.url);
      const accessToken = params["access_token"];
      if (!accessToken) throw new Error("لم يتم استلام رمز الوصول من Facebook");

      const infoRes = await fetch(
        `https://graph.facebook.com/me?fields=id,name,email&access_token=${accessToken}`,
      );
      if (!infoRes.ok) throw new Error("تعذر التحقق من حساب Facebook");
      const info = await infoRes.json() as Record<string, string>;
      if (!info.id || !info.email) throw new Error("تعذر قراءة هوية حساب Facebook");

      const backend = await callBackendAuth("facebook", accessToken, { role });
      return {
        provider: "facebook",
        id: info.id,
        name: info.name ?? info.email,
        email: info.email,
        jwt: backend.jwt,
      };
    } finally {
      setLoading(null);
    }
  }, []);

  const loginWithApple = useCallback(async (role: PortalRole = "client"): Promise<SocialProfile> => {
    if (Platform.OS !== "ios") throw new Error("تسجيل الدخول بـ Apple متاح على أجهزة iOS فقط");
    if (!(await AppleAuthentication.isAvailableAsync())) {
      throw new Error("تسجيل الدخول بـ Apple غير متاح على هذا الجهاز (يتطلب iOS 13+)");
    }

    setLoading("apple");
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      const { user: appleUserId, identityToken, email, fullName } = credential;
      if (!identityToken) throw new Error("لم يتم استلام رمز التحقق من Apple");

      const displayName = [fullName?.givenName, fullName?.familyName]
        .filter(Boolean)
        .join(" ")
        .trim();
      let resolvedEmail = email ?? "";
      if (email) await saveAppleEmail(appleUserId, email);
      else resolvedEmail = await getAppleStoredEmail(appleUserId);

      const backend = await callBackendAuth("apple", identityToken, {
        role,
        displayName: displayName || undefined,
        storedEmail: resolvedEmail || undefined,
      });

      return {
        provider: "apple",
        id: appleUserId,
        name: displayName || resolvedEmail.split("@")[0] || "مستخدم Apple",
        email: resolvedEmail,
        jwt: backend.jwt,
      };
    } finally {
      setLoading(null);
    }
  }, []);

  return { loading, loginWithGoogle, loginWithFacebook, loginWithApple };
}
