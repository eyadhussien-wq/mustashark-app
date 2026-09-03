import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

export default function Payment() {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.foreground }]}>الدفع غير متاح في الإصدار الحالي</Text>
      <Text style={[styles.body, { color: colors.mutedForeground }]}>مسار تحصيل الأتعاب المهنية والـ Escrow والتسوية والعمولة معزول حالياً. هذا الإصدار من مستشارك مخصص لبناء نواة Lawyer OS ولا ينفذ أي تحصيل لأموال العميل.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  title: { fontSize: 20, fontWeight: "700", textAlign: "center", marginBottom: 12 },
  body: { fontSize: 15, lineHeight: 24, textAlign: "center", maxWidth: 560 },
});
