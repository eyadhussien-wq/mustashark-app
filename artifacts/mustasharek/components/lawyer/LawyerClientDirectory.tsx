import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

type Client = { id: string; name: string; email: string; country: "qatar" | "jordan" | null };
type ResponseBody = { ok?: boolean; clients?: Client[]; error?: string };

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

export function LawyerClientDirectory() {
  const { user, getAuthToken } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (user?.role !== "lawyer") throw new Error("هذه القائمة متاحة للمحامي فقط.");
        if (!API_BASE) throw new Error("خدمة العملاء غير مهيأة. لا يمكن المتابعة بدون الخادم.");
        const token = await getAuthToken();
        if (!token) throw new Error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.");
        const response = await fetch(`${API_BASE}/lawyers/me/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json().catch(() => ({}))) as ResponseBody;
        if (!response.ok || !data.ok) throw new Error(data.error ?? `Client directory request failed (${response.status})`);
        if (!cancelled) setClients(data.clients ?? []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load clients");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [getAuthToken, user?.id, user?.role]);

  return (
    <View accessibilityLabel="دليل عملاء المحامي" style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 10 }}>عملائي</Text>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ fontSize: 12, textAlign: "right" }}>{error}</Text> : null}
      {!loading && !error && clients.length === 0 ? (
        <Text style={{ fontSize: 12, textAlign: "right" }}>لا يوجد عملاء مرتبطون باستشاراتك حالياً.</Text>
      ) : null}
      {!loading && !error ? clients.map((client) => (
        <View key={client.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
          <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" }}>{client.name}</Text>
          <Text style={{ fontSize: 11, textAlign: "right" }}>{client.email}</Text>
        </View>
      )) : null}
    </View>
  );
}
