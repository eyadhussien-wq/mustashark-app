import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;
type HandoverMode = "local_dispatch" | "office_dropoff" | "international";
const OPTIONS: Record<HandoverMode, { icon: keyof typeof Feather.glyphMap; title: string; description: string }> = {
  local_dispatch: { icon: "truck", title: "إرسال مندوب من المكتب", description: "استلام المستندات محليًا مع رمز تحقق عند التسليم" },
  office_dropoff: { icon: "map-pin", title: "التسليم في مقر المكتب", description: "العنوان وساعات العمل وإثبات تسليم إلكتروني" },
  international: { icon: "globe", title: "الشحن الدولي الموثق", description: "شحن عابر للحدود مع تتبع وإثبات استلام" },
};
export function HandoverOptions({ sameCountry = true, selected, onSelect }: { sameCountry?: boolean; selected?: HandoverMode; onSelect?: (mode: HandoverMode) => void }) {
  const modes: HandoverMode[] = sameCountry ? ["local_dispatch", "office_dropoff"] : ["international"];
  return <View style={styles.wrap}>{modes.map(mode => { const item = OPTIONS[mode]; const active = selected === mode; return <TouchableOpacity key={mode} onPress={() => onSelect?.(mode)} activeOpacity={0.88} style={[styles.card, active && styles.active]}><View style={[styles.icon, active && styles.activeIcon]}><Feather name={item.icon} size={19} color={active ? "#fff" : C.gold} /></View><View style={styles.copy}><Text style={styles.title}>{item.title}</Text><Text style={styles.description}>{item.description}</Text></View><Feather name={active ? "check-circle" : "chevron-left"} size={17} color={active ? C.gold : C.mutedForeground} /></TouchableOpacity>; })}</View>;
}
const styles = StyleSheet.create({wrap:{gap:9},card:{flexDirection:"row",alignItems:"center",gap:11,borderWidth:1,borderColor:C.border,borderRadius:15,padding:13,backgroundColor:C.card},active:{borderColor:C.gold,backgroundColor:"#FBF7EA"},icon:{width:40,height:40,borderRadius:12,backgroundColor:"#F8F1D9",alignItems:"center",justifyContent:"center"},activeIcon:{backgroundColor:C.gold},copy:{flex:1,alignItems:"flex-end"},title:{fontSize:12,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"right"},description:{fontSize:9,color:C.mutedForeground,fontFamily:"Inter_400Regular",marginTop:3,textAlign:"right"}});
