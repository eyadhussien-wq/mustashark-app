import * as WebBrowser from "expo-web-browser";
import { useCallback, useState } from "react";
import OAUTH from "@/constants/oauth";

WebBrowser.maybeCompleteAuthSession();

export type SocialProvider = "google" | "facebook" | "microsoft";

export interface SocialProfile {
  provider: SocialProvider;
  id: string;
  name: string;
  email: string;
}

function parseFragment(url: string): Record<string, string> {
  const hash = url.split("#")[1] ?? url.split("?")[1] ?? "";
  return Object.fromEntries(
    hash.split("&").map((p) => {
      const [k, ...v] = p.split("=");
      return [decodeURIComponent(k ?? ""), decodeURIComponent(v.join("="))];
    })
  );
}

async function fetchGoogleProfile(token: string): Promise<SocialProfile> {
  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return {
    provider: "google",
    id: data.sub,
    name: data.name,
    email: data.email,
  };
}

async function fetchFacebookProfile(token: string): Promise<SocialProfile> {
  const res = await fetch(
    `https://graph.facebook.com/me?fields=id,name,email&access_token=${token}`
  );
  const data = await res.json();
  return {
    provider: "facebook",
    id: data.id,
    name: data.name,
    email: data.email ?? "",
  };
}

async function fetchMicrosoftProfile(token: string): Promise<SocialProfile> {
  const res = await fetch("https://graph.microsoft.com/v1.0/me", {
    headers: { Authorization: `Bearer ${token}` },
  });
  const data = await res.json();
  return {
    provider: "microsoft",
    id: data.id,
    name: data.displayName,
    email: data.mail ?? data.userPrincipalName ?? "",
  };
}

export function useSocialAuth() {
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  const loginWithGoogle = useCallback(async (): Promise<SocialProfile> => {
    if (!OAUTH.google.clientId) {
      throw new Error(
        "لم يتم ضبط Google Client ID بعد.\nأضف EXPO_PUBLIC_GOOGLE_CLIENT_ID في متغيرات البيئة."
      );
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
      const token = params["access_token"];
      if (!token) throw new Error("لم يتم استلام رمز الوصول من Google");

      return await fetchGoogleProfile(token);
    } finally {
      setLoading(null);
    }
  }, []);

  const loginWithFacebook = useCallback(async (): Promise<SocialProfile> => {
    if (!OAUTH.facebook.appId) {
      throw new Error(
        "لم يتم ضبط Facebook App ID بعد.\nأضف EXPO_PUBLIC_FACEBOOK_APP_ID في متغيرات البيئة."
      );
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
      const token = params["access_token"];
      if (!token) throw new Error("لم يتم استلام رمز الوصول من Facebook");

      return await fetchFacebookProfile(token);
    } finally {
      setLoading(null);
    }
  }, []);

  const loginWithMicrosoft = useCallback(async (): Promise<SocialProfile> => {
    if (!OAUTH.microsoft.clientId) {
      throw new Error(
        "لم يتم ضبط Microsoft Client ID بعد.\nأضف EXPO_PUBLIC_MICROSOFT_CLIENT_ID في متغيرات البيئة."
      );
    }
    setLoading("microsoft");
    try {
      const redirectUri = "mustasharek://auth/callback";
      const url =
        `https://login.microsoftonline.com/${OAUTH.microsoft.tenantId}/oauth2/v2.0/authorize?` +
        `client_id=${OAUTH.microsoft.clientId}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&response_type=token` +
        `&scope=${encodeURIComponent("openid profile email User.Read")}`;

      const result = await WebBrowser.openAuthSessionAsync(url, redirectUri);
      if (result.type !== "success") throw new Error("تم إلغاء تسجيل الدخول");

      const params = parseFragment(result.url);
      const token = params["access_token"];
      if (!token) throw new Error("لم يتم استلام رمز الوصول من Microsoft");

      return await fetchMicrosoftProfile(token);
    } finally {
      setLoading(null);
    }
  }, []);

  return { loading, loginWithGoogle, loginWithFacebook, loginWithMicrosoft };
}
