import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";

type AvailabilitySlot = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  slotDurationMinutes: number;
};

type AvailabilityResponse = { availability?: AvailabilitySlot[] };

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

export function LawyerAvailabilitySettingsCard() {
  const { user, getAuthToken } = useAuth();
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAvailability() {
    setLoading(true); setError(null);
    try {
      if (user?.role !== "lawyer") throw new Error("هذه الإعدادات متاحة للمحامي فقط.");
      if (!API_BASE) throw new Error("خدمة الإتاحة غير مهيأة. لا يمكن المتابعة بدون الخادم.");
      const token = await getAuthToken();
      if (!token) throw new Error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.");
      const response = await fetch(`${API_BASE}/availability/lawyers/me`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) throw new Error(`Availability request failed (${response.status})`);
      const data = (await response.json()) as AvailabilityResponse;
      setSlots(data.availability ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load availability");
    } finally { setLoading(false); }
  }

  async function saveAvailability() {
    setSaving(true); setError(null);
    try {
      if (user?.role !== "lawyer") throw new Error("هذه الإعدادات متاحة للمحامي فقط.");
      if (!API_BASE) throw new Error("خدمة الإتاحة غير مهيأة. لا يمكن المتابعة بدون الخادم.");
      const token = await getAuthToken();
      if (!token) throw new Error("انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى.");
      const response = await fetch(`${API_BASE}/availability/lawyers/me`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ slots }),
      });
      if (!response.ok) throw new Error(`Availability save failed (${response.status})`);
      await loadAvailability();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save availability");
    } finally { setSaving(false); }
  }

  useEffect(() => { void loadAvailability(); }, [user?.id]);

  return (
    <View>
      <Text>Availability Settings</Text>
      {loading ? <ActivityIndicator /> : <Text>{slots.length} availability windows</Text>}
      {error ? <Text>{error}</Text> : null}
      <Button title={saving ? "Saving…" : "Save availability"} onPress={() => void saveAvailability()} disabled={loading || saving} />
    </View>
  );
}
