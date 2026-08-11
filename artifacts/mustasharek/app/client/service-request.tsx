import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

const C = colors.light;
type ServiceKey = "consultation" | "memorandum" | "representation";
const SERVICES = [
  { key: "consultation" as const, title: "استشارة قانونية", description: "تحدث مع المحامي لفهم وضعك القانوني.", icon: "message-circle" },
  { key: "memorandum" as const, title: "كتابة وصياغة مذكرة قانونية", description: "صياغة مذكرة دون توكيل أو حضور المحامي.", icon: "file-text" },
  { key: "representation" as const, title: "توكيل وتمثيل قانوني", description: "اطلب عرض أتعاب لتولي القضية وتمثيلك.", icon: "briefcase" },
];

export default function ClientServiceRequest() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [service, setService] = useState<ServiceKey>("consultation");
  const [scope, setScope] = useState("");
  const [details, setDetails] = useState("");
  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}><TouchableOpacity onPress={() => router.back()}><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity><Text style={styles.title}>طلب خدمة قانونية</Text><View style={{ width: 22 }} /></View>
    <Text style={styles.subtitle}>اختر الخدمة التي تحتاجها من المحامي. الربط والدفع سيُفعّلان لاحقًا.</Text>
    {SERVICES.map((item) => { const active = service === item.key; return <TouchableOpacity key={item.key} style={[styles.serviceCard, active && styles.serviceActive]} onPress={() => setService(item.key)}>
      <View style={[styles.icon, active && styles.iconActive]}><Feather name={item.icon as any} size={20} color={active ? C.gold : C.mutedForeground} /></View>
      <View style={styles.copy}><Text style={styles.serviceTitle}>{item.title}</Text><Text style={styles.serviceDesc}>{item.description}</Text></View>
      <View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View>
    </TouchableOpacity>; })}
    <View style={styles.section}><Text style={styles.label}>{service === "representation" ? "نطاق التوكيل" : service === "memorandum" ? "نطاق المذكرة" : "موضوع الاستشارة"}</Text><TextInput value={scope} onChangeText={setScope} placeholder={service === "memorandum" ? "مثال: مذكرة دفاع لجلسة محددة" : service === "representation" ? "مثال: القضية كاملة / حضور جلسات" : "اكتب موضوعك القانوني باختصار"} placeholderTextColor={C.mutedForeground} style={styles.input} textAlign="right" /></View>
    <View style={styles.section}><Text style={styles.label}>تفاصيل إضافية</Text><TextInput value={details} onChangeText={setDetails} multiline placeholder="أضف أي معلومات تساعد المحامي على فهم الطلب" placeholderTextColor={C.mutedForeground} style={[styles.input, styles.textarea]} textAlign="right" textAlignVertical="top" /></View>
    <View style={styles.note}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.noteText}>هذه الشاشة تثبت رحلة العميل فقط. لا يوجد دفع أو إرسال فعلي حاليًا.</Text></View>
    <TouchableOpacity style={styles.primary} onPress={() => router.back()}><Text style={styles.primaryText}>متابعة — قريبًا</Text><Feather name="arrow-left" size={16} color="#fff" /></TouchableOpacity>
  </ScrollView>;
}
const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:C.background,paddingHorizontal:20}, header:{flexDirection:"row-reverse",alignItems:"center",justifyContent:"space-between",paddingVertical:16}, title:{fontSize:20,fontFamily:"Inter_700Bold",color:C.foreground}, subtitle:{color:C.mutedForeground,fontSize:12,lineHeight:19,textAlign:"right",marginBottom:18},
  serviceCard:{flexDirection:"row-reverse",alignItems:"center",gap:11,backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:16,padding:14,marginBottom:10}, serviceActive:{borderColor:"rgba(201,160,53,0.55)"}, icon:{width:44,height:44,borderRadius:13,backgroundColor:"#F3F4F6",alignItems:"center",justifyContent:"center"}, iconActive:{backgroundColor:"rgba(201,160,53,0.12)"}, copy:{flex:1}, serviceTitle:{color:C.foreground,fontSize:14,fontFamily:"Inter_700Bold",textAlign:"right"}, serviceDesc:{color:C.mutedForeground,fontSize:11,lineHeight:17,textAlign:"right",marginTop:3}, radio:{width:20,height:20,borderRadius:10,borderWidth:1.5,borderColor:C.border,alignItems:"center",justifyContent:"center"},radioActive:{borderColor:C.gold},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:C.gold},
  section:{marginTop:18},label:{color:C.foreground,fontSize:13,fontFamily:"Inter_700Bold",textAlign:"right",marginBottom:8},input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:13,paddingHorizontal:13,paddingVertical:12,minHeight:46,color:C.foreground,fontFamily:"Inter_400Regular",fontSize:13},textarea:{minHeight:120},note:{flexDirection:"row-reverse",alignItems:"flex-start",gap:8,backgroundColor:"rgba(201,160,53,0.08)",borderWidth:1,borderColor:"rgba(201,160,53,0.22)",borderRadius:14,padding:13,marginTop:18},noteText:{flex:1,color:C.mutedForeground,fontSize:11,lineHeight:18,textAlign:"right"},primary:{flexDirection:"row-reverse",justifyContent:"center",alignItems:"center",gap:8,backgroundColor:C.navy,borderRadius:14,paddingVertical:16,marginTop:18},primaryText:{color:"#fff",fontSize:14,fontFamily:"Inter_700Bold"}
});
