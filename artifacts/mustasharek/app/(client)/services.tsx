import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { SERVICE_DESIGN, ServiceKind } from "@/constants/serviceDesign";

const C = colors.light;
const services: ServiceKind[] = ["consultation", "memo", "representation"];

export default function ClientServices() {
  const router = useRouter();
  return <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
    <View style={styles.header}><View style={styles.headerIcon}><Feather name="briefcase" size={23} color={C.gold} /></View><View style={styles.headerCopy}><Text style={styles.eyebrow}>خدمات مستشارك</Text><Text style={styles.title}>اختر الخدمة القانونية</Text><Text style={styles.subtitle}>ثلاث خدمات واضحة، ولكل خدمة رحلة وسعر ومستندات مختلفة.</Text></View></View>
    {services.map((kind) => { const s = SERVICE_DESIGN[kind]; return <TouchableOpacity key={kind} activeOpacity={0.82} style={styles.card} onPress={() => kind === "representation" ? router.push("/(client)/consultations") : undefined}>
      <View style={[styles.icon, { backgroundColor: s.light }]}><Feather name={s.icon} size={22} color={s.accent} /></View>
      <View style={styles.copy}><View style={styles.titleRow}><Text style={styles.cardTitle}>{s.label}</Text><View style={[styles.pill, { backgroundColor: s.light }]}><Text style={[styles.pillText, { color: s.accent }]}>{s.shortLabel}</Text></View></View><Text style={styles.desc}>{s.description}</Text><View style={styles.meta}><Feather name="file-text" size={13} color={C.mutedForeground} /><Text style={styles.metaText}>{kind === "memo" ? "عرض سعر مستقل + تسليم مستند" : kind === "representation" ? "عرض أتعاب + اتفاقية + مراحل" : "حجز + دفع + جلسة"}</Text></View></View><Feather name="chevron-left" size={19} color={C.mutedForeground} />
    </TouchableOpacity>; })}
    <View style={styles.note}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.noteText}>ستظهر لك لاحقًا الإجراءات والمستندات المتاحة حسب الخدمة وحسب صلاحيتك كمستخدم.</Text></View>
  </ScrollView>;
}
const styles = StyleSheet.create({ container:{flex:1,backgroundColor:C.background}, content:{padding:20,paddingTop:60,paddingBottom:120,gap:12}, header:{backgroundColor:C.navy,borderRadius:20,padding:18,flexDirection:"row",alignItems:"center",borderWidth:1,borderColor:"rgba(201,160,53,.35)"},headerIcon:{width:52,height:52,borderRadius:17,backgroundColor:"rgba(255,255,255,.08)",alignItems:"center",justifyContent:"center",marginRight:13},headerCopy:{flex:1,alignItems:"flex-end"},eyebrow:{color:C.gold,fontSize:10,fontFamily:"Inter_600SemiBold"},title:{color:"#fff",fontSize:22,fontFamily:"Inter_700Bold",marginTop:3,textAlign:"right"},subtitle:{color:"rgba(255,255,255,.72)",fontSize:11,lineHeight:18,textAlign:"right",marginTop:4,fontFamily:"Inter_400Regular"},card:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:18,padding:15,flexDirection:"row",alignItems:"center",gap:12},icon:{width:46,height:46,borderRadius:14,alignItems:"center",justifyContent:"center"},copy:{flex:1,alignItems:"flex-end"},titleRow:{flexDirection:"row",alignItems:"center",gap:7},cardTitle:{fontSize:14,color:C.foreground,fontFamily:"Inter_700Bold",textAlign:"right"},pill:{paddingHorizontal:8,paddingVertical:3,borderRadius:9},pillText:{fontSize:9,fontFamily:"Inter_700Bold"},desc:{fontSize:11,color:C.mutedForeground,lineHeight:18,textAlign:"right",marginTop:5,fontFamily:"Inter_400Regular"},meta:{flexDirection:"row",alignItems:"center",gap:5,marginTop:7},metaText:{fontSize:10,color:C.mutedForeground,fontFamily:"Inter_500Medium"},note:{padding:13,borderRadius:14,backgroundColor:"#FFFCF3",borderWidth:1,borderColor:"rgba(201,160,53,.35)",flexDirection:"row",alignItems:"center",gap:8},noteText:{flex:1,fontSize:10,color:C.foreground,lineHeight:17,textAlign:"right",fontFamily:"Inter_400Regular"} });
