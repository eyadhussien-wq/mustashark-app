import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActiveCaseWorkspace } from "@/components/ActiveCaseWorkspace";
import colors from "@/constants/colors";

const C = colors.light;

export default function ClientActiveCase() {
  const router = useRouter();
  const { caseId, milestoneId } = useLocalSearchParams<{ caseId?: string; milestoneId?: string }>();
  const normalizedCaseId = typeof caseId === "string" ? caseId.trim() : undefined;
  const normalizedMilestoneId = typeof milestoneId === "string" ? milestoneId.trim() : undefined;

  return <View style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={21} color={C.foreground} /></TouchableOpacity>
      <Text style={styles.title}>القضية النشطة</Text>
      <View style={{ width: 29 }} />
    </View>
    <ActiveCaseWorkspace role="client" caseId={normalizedCaseId} milestoneId={normalizedMilestoneId} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: { height: 58, paddingHorizontal: 20, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.background },
  back: { padding: 4 },
  title: { color: C.foreground, fontSize: 18, fontFamily: "Inter_700Bold" },
});
