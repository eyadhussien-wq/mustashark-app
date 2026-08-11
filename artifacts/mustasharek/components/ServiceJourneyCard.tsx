import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

type ServiceKind = "consultation" | "memo" | "representation";
const CONFIG: Record<ServiceKind, { icon: keyof typeof Feather.glyphMap; title: string; subtitle: string; accent: string; bg: string; steps: string[] }> = {
  consultation: { icon: "message-circle", title: "استشارة قانونية", subtitle: "استمع لرأي قانوني من محامٍ مختص", accent: C.primary, bg: "#EEF2F8", steps: ["طلب", "قبول", "موعد", "مكتملة"] },
  memo: { icon: "file-text", title: "مذكرة قانونية", subtitle: "اطلب إعداد مذكرة رسمية دون توكيل", accent: C.gold, bg: "#F8F1D9", steps: ["طلب", "عرض سعر", "دفع", "تسليم"] },
  representation: { icon: "briefcase", title: "توكيل وتمثيل قانوني", subtitle: "اتفاقية وتمثيل ومتابعة القضية", accent: "#7C5C13", bg: "#FBF7EA", steps: ["طلب عرض", "اتفاقية", "دفع", "قضية نشطة"] },
};

export function ServiceJourneyCard({ kind, onPress }: { kind: ServiceKind; onPress?: () => void }) {
  const item = CONFIG[kind];
  return <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.88}>
    <View style={[styles.iconBox, { backgroundColor: item.bg, borderColor: `${item.accent}35` }]}><Feather name={item.icon} size={21} color={item.accent} /></View>
    <View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.subtitle}>{item.subtitle}</Text><View style={styles.steps}>{item.steps.map((step, i) => <React.Fragment key={step}><View style={[styles.step, i === 0 && { borderColor: item.accent, backgroundColor: item.bg }]}><Text style={[styles.stepText, i === 0 && { color: item.accent }]}>{step}</Text></View>{i < item.steps.length - 1 && <Feather name="chevron-left" size={11} color={C.mutedForeground} />}</React.Fragment>)}</View></View>
    <Feather name="arrow-left" size={15} color={C.mutedForeground} />
  </TouchableOpacity>;
}

const styles = StyleSheet.create({ card: { flexDirection: "row", alignItems: "center", gap: 11, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 13, marginBottom: 10 }, iconBox: { width: 43, height: 43, borderRadius: 13, borderWidth: 1, alignItems: "center", justifyContent: "center" }, copy: { flex: 1, alignItems: "flex-end" }, title: { fontSize: 14, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" }, subtitle: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 3, textAlign: "right" }, steps: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 8 }, step: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 7, borderWidth: 1, borderColor: C.border }, stepText: { fontSize: 8, color: C.mutedForeground, fontFamily: "Inter_600SemiBold" } });
