import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function LawyerWallet() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>المحفظة المالية غير متاحة</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>هذه الوظيفة معزولة حالياً عن Mustasharek Lawyer OS v1 ولا تنفذ أي تحصيل أو تسوية أو عمولة أو تحويل أموال.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24, textAlign: "center", maxWidth: 520 },
});
