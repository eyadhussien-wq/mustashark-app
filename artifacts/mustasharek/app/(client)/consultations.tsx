import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { ConsultationCard } from "@/components/ConsultationCard";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";

const C = colors.light;

export default function ClientConsultations() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { consultations } = useData();

  const myConsultations = useMemo(
    () => consultations.filter((c) => c.clientId === user?.id),
    [consultations, user]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0) }]}>
      <View style={styles.header}>
        <Text style={styles.title}>استشاراتي</Text>
        <Text style={styles.sub}>{myConsultations.length} استشارة</Text>
      </View>

      <FlatList
        data={myConsultations}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => (
          <ConsultationCard consultation={item} viewAs="client" />
        )}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 100 : 80) },
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="calendar" size={44} color={C.border} />
            <Text style={styles.emptyTitle}>لا توجد استشارات بعد</Text>
            <Text style={styles.emptyText}>
              ابحث عن محامٍ واحجز استشارتك الأولى
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    gap: 2,
  },
  title: { fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  sub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  list: { padding: 20 },
  empty: { alignItems: "center", paddingTop: 80, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.foreground },
  emptyText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
});
