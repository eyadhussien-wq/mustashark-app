import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;
type OfferKind = "consultation" | "memo" | "representation";
const CONFIG = {
  consultation: { icon: "message-circle" as const, label: "عرض استشارة", accent: C.primary },
  memo: { icon: "file-text" as const, label: "عرض مذكرة", accent: C.gold },
  representation: { icon: "briefcase" as const, label: "عرض توكيل", accent: "#7C5C13" },
};
export function OfferCard({ kind, lawyerName = "المحامي", amount = "—", currency = "QAR", expires = "صالح لمدة 24 ساعة", terms = "يشمل نطاق الخدمة والشروط الموضحة من المحامي", onAccept, onReject }: { kind: OfferKind; lawyerName?: string; amount?: string; currency?: string; expires?: string; terms?: string; onAccept?: () => void; onReject?: () => void }) {
  const c = CONFIG[kind];
  return <View style={styles.card}>
    <View style={styles.header}><View style={[styles.icon, { borderColor: `${c.accent}45`, backgroundColor: `${c.accent}12` }]}><Feather name={c.icon} size={19} color={c.accent} /></View><View style={styles.headerText}><Text style={styles.label}>{c.label}</Text><Text style={styles.lawyer}>{lawyerName}</Text></View></View>
    <View style={styles.amountBox}><Text style={styles.amount}>{amount} <Text style={styles.currency}>{currency}</Text></Text><Text style={styles.amountLabel}>الأتعاب المقترحة</Text></View>
    <Text style={styles.terms}>{terms}</Text>
    <View style={styles.meta}><View style={styles.metaItem}><Feather name="clock" size={13} color={C.mutedForeground} /><Text style={styles.metaText}>{expires}</Text></View><View style={styles.metaItem}><Feather name="shield" size={13} color={C.mutedForeground} /><Text style={styles.metaText}>الدفع عبر مستشارك</Text></View></View>
    <View style={styles.actions}><TouchableOpacity style={[styles.primary, { backgroundColor: c.accent }]} onPress={onAccept}><Text style={styles.primaryText}>قبول والمتابعة</Text></TouchableOpacity><TouchableOpacity style={styles.secondary} onPress={onReject}><Text style={styles.secondaryText}>رفض</Text></TouchableOpacity></View>
  </View>;
}
const styles = StyleSheet.create({ card:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:18,padding:15,marginVertical:8},header:{flexDirection:"row",alignItems:"center",gap:10},icon:{width:42,height:42,borderRadius:12,borderWidth:1,alignItems:"center",justifyContent:"center"},headerText:{flex:1,alignItems:"flex-end"},label:{fontSize:14,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"right"},lawyer:{fontSize:10,color:C.mutedForeground,fontFamily:"Inter_400Regular",marginTop:2,textAlign:"right"},amountBox:{marginTop:13,padding:12,borderRadius:12,backgroundColor:C.muted,alignItems:"flex-end"},amount:{fontSize:22,fontFamily:"Inter_700Bold",color:C.foreground},currency:{fontSize:11},amountLabel:{fontSize:9,color:C.mutedForeground,marginTop:2},terms:{fontSize:11,lineHeight:19,color:C.foreground,textAlign:"right",marginTop:12},meta:{flexDirection:"row",justifyContent:"space-between",marginTop:12},metaItem:{flexDirection:"row",alignItems:"center",gap:5},metaText:{fontSize:9,color:C.mutedForeground},actions:{flexDirection:"row",gap:8,marginTop:14},primary:{flex:1,borderRadius:11,paddingVertical:11,alignItems:"center"},primaryText:{color:"#fff",fontSize:11,fontFamily:"Inter_700Bold"},secondary:{paddingHorizontal:18,borderRadius:11,borderWidth:1,borderColor:C.border,justifyContent:"center"},secondaryText:{color:C.mutedForeground,fontSize:11,fontFamily:"Inter_600SemiBold"}});
