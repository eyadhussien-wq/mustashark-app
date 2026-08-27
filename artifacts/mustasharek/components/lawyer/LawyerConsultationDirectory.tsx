import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

type Consultation = {
  id: string;
  serialNumber: string;
  client: { id: string; name: string; email: string; country: string | null };
  subject: string;
  description: string | null;
  scheduledDate: string;
  scheduledTime: string;
  type: string;
  status: string;
};

type ResponseBody = { ok?: boolean; consultations?: Consultation[]; error?: string };

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

export function LawyerConsultationDirectory() {
  const { user, getAuthToken } = useAuth();
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        if (user?.role !== "lawyer") throw new Error("هذه القائمة متاحة للمحامي فقط.");
        if (!API_BASE) throw new Error("خدمة الاستشارات غير مهيأة. لا يمكن المتابعة بدون الخادم.");
        const token = await getAuthToken();
        if (!token) throw new Error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.");

        const response = await fetch(`${API_BASE}/lawyers/me/consultations`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = (await response.json().catch(() => ({}))) as ResponseBody;
        if (!response.ok || !data.ok) throw new Error(data.error ?? `Consultation request failed (${response.status})`);
        if (!cancelled) setConsultations(data.consultations ?? []);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Unable to load consultations");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [getAuthToken, user?.id, user?.role]);

  return (
    <View accessibilityLabel="استشارات المحامي" style={{ marginBottom: 16 }}>
      <Text style={{ fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "right", marginBottom: 10 }}>استشاراتي</Text>
      {loading ? <ActivityIndicator /> : null}
      {error ? <Text style={{ fontSize: 12, textAlign: "right" }}>{error}</Text> : null}
      {!loading && !error && consultations.length === 0 ? (
        <Text style={{ fontSize: 12, textAlign: "right" }}>لا توجد استشارات مرتبطة بك حالياً.</Text>
      ) : null}
      {!loading && !error
        ? consultations.map((consultation) => (
            <View key={consultation.id} style={{ paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#E5E7EB" }}>
              <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right" }}>
                {consultation.subject}
              </Text>
              <Text style={{ fontSize: 11, textAlign: "right" }}>
                {consultation.client.name} · {consultation.scheduledDate} · {consultation.scheduledTime}
              </Text>
              <Text style={{ fontSize: 11, textAlign: "right" }}>{consultation.status}</Text>
            </View>
          ))
        : null}
    </View>
  );
}
