import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActiveCaseWorkspace } from "@/components/ActiveCaseWorkspace";
import colors from "@/constants/colors";

const C = colors.light;

export default function LawyerActiveCase() {
  const router = useRouter();
  const { caseId } = useLocalSearchParams<{ caseId?: string }>();
  const normalizedCaseId = typeof caseId === "string" ? caseId.trim() : undefined;

  return <View style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={21} color={C.foreground} /></TouchableOpacity>
      <Text style={styles.title}>القضية النشطة</Text>
      <View style={{ width: 29 }} />
    </View>
    <ActiveCaseWorkspace role="lawyer" caseId={normalizedCaseId} />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: { height: 58, paddingHorizontal: 20, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.background },
  back: { padding: 4 },
  title: { color: C.foreground, fontSize: 18, fontFamily: "Inter_700Bold" },
});
