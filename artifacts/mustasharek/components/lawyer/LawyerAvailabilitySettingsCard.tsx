import React, { useEffect, useState } from "react";
import { ActivityIndicator, Button, Text, View } from "react-native";

type AvailabilityWindow = {
  dayOfWeek: number;
  startTime: string;
  endTime: string;
};

type AvailabilityResponse = {
  availability?: AvailabilityWindow[];
};

export function LawyerAvailabilitySettingsCard() {
  const [availability, setAvailability] = useState<AvailabilityWindow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAvailability() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/availability/lawyers/me", {
        credentials: "include",
      });
      if (!response.ok) throw new Error(`Availability request failed (${response.status})`);
      const data = (await response.json()) as AvailabilityResponse;
      setAvailability(data.availability ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to load availability");
    } finally {
      setLoading(false);
    }
  }

  async function saveAvailability() {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/availability/lawyers/me", {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability }),
      });
      if (!response.ok) throw new Error(`Availability save failed (${response.status})`);
      await loadAvailability();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Unable to save availability");
    } finally {
      setSaving(false);
    }
  }

  useEffect(() => {
    void loadAvailability();
  }, []);

  return (
    <View>
      <Text>Availability Settings</Text>
      {loading ? <ActivityIndicator /> : <Text>{availability.length} availability windows</Text>}
      {error ? <Text>{error}</Text> : null}
      <Button title={saving ? "Saving…" : "Save availability"} onPress={() => void saveAvailability()} disabled={loading || saving} />
    </View>
  );
}
