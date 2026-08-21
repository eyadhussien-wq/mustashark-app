import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

export type RealEstateOpportunity = {
  id: string;
  title: string;
  location: string;
  propertyType: string;
  expectedYield: number;
  profitMargin: number;
  price: number;
  currency?: string;
  summary?: string;
};

export function RealEstateOpportunityCard({ opportunity }: { opportunity: RealEstateOpportunity }) {
  const currency = opportunity.currency ?? "JOD";

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.icon}><Feather name="home" size={20} color={C.gold} /></View>
        <View style={styles.titleCopy}>
          <Text style={styles.title}>{opportunity.title}</Text>
          <View style={styles.locationRow}>
            <Feather name="map-pin" size={12} color={C.mutedForeground} />
            <Text style={styles.location}>{opportunity.location}</Text>
          </View>
        </View>
      </View>

      <View style={styles.typePill}><Text style={styles.typeText}>{opportunity.propertyType}</Text></View>
      {opportunity.summary ? <Text style={styles.summary}>{opportunity.summary}</Text> : null}

      <View style={styles.metrics}>
        <Metric icon="trending-up" label="العائد المتوقع" value={`${opportunity.expectedYield}%`} />
        <Metric icon="percent" label="هامش الربح" value={`${opportunity.profitMargin}%`} />
        <Metric icon="tag" label="قيمة الفرصة" value={`${opportunity.price.toLocaleString()} ${currency}`} />
      </View>
    </View>
  );
}

function Metric({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Feather name={icon} size={15} color={C.gold} />
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.navy, borderRadius: 18, padding: 17, borderWidth: 1, borderColor: "rgba(201,160,53,.28)", gap: 12 },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  icon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(201,160,53,.12)" },
  titleCopy: { flex: 1, gap: 4 },
  title: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "right" },
  locationRow: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4 },
  location: { color: "rgba(255,255,255,.68)", fontSize: 10, fontFamily: "Inter_400Regular" },
  typePill: { alignSelf: "flex-end", paddingHorizontal: 9, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(255,255,255,.08)" },
  typeText: { color: C.gold, fontSize: 9, fontFamily: "Inter_700Bold" },
  summary: { color: "rgba(255,255,255,.72)", fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right" },
  metrics: { flexDirection: "row", gap: 8 },
  metric: { flex: 1, minHeight: 72, borderRadius: 12, padding: 9, backgroundColor: "rgba(255,255,255,.055)", alignItems: "flex-end", justifyContent: "space-between" },
  metricLabel: { color: "rgba(255,255,255,.55)", fontSize: 8, fontFamily: "Inter_400Regular", textAlign: "right" },
  metricValue: { color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" },
});
