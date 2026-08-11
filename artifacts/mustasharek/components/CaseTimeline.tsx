import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;
export type CaseStage = "agreement" | "poa" | "progress" | "completed";
const STAGES: { id: CaseStage; title: string; subtitle: string; icon: keyof typeof Feather.glyphMap }[] = [
  { id: "agreement", title: "الاتفاقية", subtitle: "تم تأكيد الاتفاقية", icon: "edit-3" },
  { id: "poa", title: "الوكالة والتحقق", subtitle: "رفع ومراجعة المستندات", icon: "file-text" },
  { id: "progress", title: "قيد التنفيذ", subtitle: "متابعة مراحل القضية", icon: "briefcase" },
  { id: "completed", title: "مكتملة", subtitle: "إغلاق القضية وتسليم الملفات", icon: "check-circle" },
];
export function CaseTimeline({ current = "agreement" }: { current?: CaseStage }) {
  const index = STAGES.findIndex(s => s.id === current);
  return <View style={styles.wrap}>{STAGES.map((s, i) => { const done = i < index; const active = i === index; return <View key={s.id} style={styles.row}><View style={styles.lineBox}>{i < STAGES.length - 1 && <View style={[styles.line, (done || active) && { backgroundColor: C.gold }]} />}<View style={[styles.dot, (done || active) && { backgroundColor: C.gold, borderColor: C.gold }]}><Feather name={done ? "check" : s.icon} size={14} color={(done || active) ? "#fff" : C.mutedForeground} /></View></View><View style={styles.copy}><Text style={[styles.title, active && { color: C.gold }]}>{s.title}</Text><Text style={styles.subtitle}>{s.subtitle}</Text></View></View>; })}</View>;
}
const styles = StyleSheet.create({wrap:{paddingVertical:5},row:{flexDirection:"row",minHeight:69},lineBox:{width:35,alignItems:"center"},line:{position:"absolute",top:30,bottom:0,width:2,backgroundColor:C.border},dot:{width:31,height:31,borderRadius:16,borderWidth:1,borderColor:C.border,backgroundColor:C.card,alignItems:"center",justifyContent:"center",zIndex:1},copy:{flex:1,alignItems:"flex-end",paddingTop:1},title:{fontSize:13,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"right"},subtitle:{fontSize:10,color:C.mutedForeground,fontFamily:"Inter_400Regular",marginTop:4,textAlign:"right"}});
