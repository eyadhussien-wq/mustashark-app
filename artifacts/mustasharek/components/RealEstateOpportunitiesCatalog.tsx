import React from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { RealEstateOpportunity, RealEstateOpportunityCard } from "@/components/RealEstateOpportunityCard";
import colors from "@/constants/colors";

const C = colors.light;

export function RealEstateOpportunitiesCatalog({ opportunities }: { opportunities: RealEstateOpportunity[] }) {
  return (
    <View style={styles.container}>
      <View style={styles.heading}>
        <Text style={styles.kicker}>سوق الأردن</Text>
        <Text style={styles.title}>الفرص العقارية الاستثمارية</Text>
        <Text style={styles.subtitle}>تصفح الفرص ومؤشرات العائد والربحية قبل الانتقال إلى التفاصيل.</Text>
      </View>

      <FlatList
        data={opportunities}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RealEstateOpportunityCard opportunity={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
        ListEmptyComponent={<Text style={styles.empty}>لا توجد فرص عقارية متاحة حاليًا.</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 16 },
  heading: { gap: 5 },
  kicker: { color: C.gold, fontSize: 10, fontFamily: "Inter_700Bold", textAlign: "right" },
  title: { color: C.foreground, fontSize: 21, fontFamily: "Inter_700Bold", textAlign: "right" },
  subtitle: { color: C.mutedForeground, fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right" },
  separator: { height: 12 },
  empty: { color: C.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", paddingVertical: 20 },
});
