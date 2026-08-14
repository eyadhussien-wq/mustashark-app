import { useRouter } from "expo-router";
import React from "react";
import { Feather } from "@expo/vector-icons";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { ActiveCaseWorkspace } from "@/components/ActiveCaseWorkspace";
import colors from "@/constants/colors";

const C = colors.light;

export default function ClientActiveCase() {
  const router = useRouter();
  return <View style={styles.screen}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} style={styles.back} accessibilityRole="button" accessibilityLabel="العودة">
        <Feather name="arrow-right" size={21} color={C.foreground} />
      </TouchableOpacity>
      <Text style={styles.title}>القضية النشطة</Text>
      <TouchableOpacity
        onPress={() => router.push("/(client)/document-center")}
        style={styles.documentsAction}
        accessibilityRole="button"
        accessibilityLabel="مركز المستندات"
      >
        <Feather name="folder" size={18} color={C.gold} />
        <Text style={styles.documentsActionText}>المستندات</Text>
      </TouchableOpacity>
    </View>
    <ActiveCaseWorkspace role="client" />
  </View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  header: { height: 58, paddingHorizontal: 20, flexDirection: "row-reverse", alignItems: "center", justifyContent: "space-between", borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: C.background },
  back: { padding: 4 },
  title: { color: C.foreground, fontSize: 18, fontFamily: "Inter_700Bold" },
  documentsAction: { flexDirection: "row-reverse", alignItems: "center", gap: 6, paddingHorizontal: 8, paddingVertical: 6, borderRadius: 10, backgroundColor: "rgba(201,160,53,.10)" },
  documentsActionText: { color: C.gold, fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
