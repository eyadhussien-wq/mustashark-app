import AsyncStorage from "@react-native-async-storage/async-storage";
import type { User } from "@/contexts/AuthContext";

const JWT_KEY = "mustasharek_jwt_v1";
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

export async function getUsableAuthToken(user: User | null): Promise<string | null> {
  const stored = await AsyncStorage.getItem(JWT_KEY).catch(() => null);
  if (stored) return stored;

  const email = user?.email?.trim().toLowerCase();
  const role = user?.role === "lawyer" ? "lawyer" : user?.role === "client" ? "client" : null;
  if (!API_BASE || !email || !role || !["client@mustashark.com", "lawyer@mustashark.com"].includes(email)) return null;

  try {
    const response = await fetch(`${API_BASE}/auth/demo-auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: "test1234", role }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !body?.ok || typeof body.jwt !== "string") return null;
    await AsyncStorage.setItem(JWT_KEY, body.jwt);
    return body.jwt;
  } catch {
    return null;
  }
}
