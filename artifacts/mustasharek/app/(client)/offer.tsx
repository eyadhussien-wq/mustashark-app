import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { SERVICE_DESIGN, type ServiceKind } from "@/constants/serviceDesign";

const C = colors.light;
const data: Record<string, { kind: ServiceKind; title: string; amount: number; status: string; scope: string[] }> = {
  "consult-1": { kind: "consultation", title: "استشارة في نزاع تجاري", amount: 350, status: "مرسل", scope: ["جلسة استشارية واحدة", "مدة الجلسة حسب القناة المختارة", "ملخص بعد الاستشارة"] },
  "memo-1": { kind: "memo", title: "مذكرة قانونية — عقد تجاري", amount: 900, status: "مرسل", scope: ["دراسة المستندات المقدمة", "صياغة مذكرة قانونية", "تسليم النسخة النهائية"] },
  "rep-1": { kind: "representation", title: "توكيل وتمثيل — نزاع مدني", amount: 4500, status: "مسودة", scope: ["مرحلة دراسة الملف", "مرحلة التفاوض أو الإجراءات", "أتعاب منفصلة لأي مرحلة إضافية يوافق عليها العميل"] },
};

export default function ClientOfferDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const offer = data[id ?? "consult-1"];
  const service = SERVICE_DESIGN[offer.kind];
  return <ScrollView style={styles.container} contentContainerStyle={styles.content}>
    <TouchableOpacity style={styles.back} onPress={() => router.back()}><Feather name="arrow-right" size={20} color={C.foreground} /><Text style={styles.backText}>العودة إلى العروض</Text></TouchableOpacity>
    <View style={styles.hero}><View style={[styles.icon, { backgroundColor: service.light }]}><Feather name={service.icon} size={23} color={service.accent} /></View><Text style={styles.kind}>{service.label}</Text><Text style={styles.title}>{offer.title}</Text><View style={styles.status}><Text style={styles.statusText}>{offer.status}</Text></View></View>
    <View style={styles.price}><Text style={styles.priceLabel}>إجمالي العرض</Text><Text style={styles.amount}>{offer.amount.toLocaleString()} <Text style={styles.currency}>QAR</Text></Text><Text style={styles.priceHint}>القيمة المعروضة قبل بدء التنفيذ</Text></View>
    <View style={styles.section}><Text style={styles.sectionTitle}>نطاق العمل</Text>{offer.scope.map((item) => <View style={styles.row} key={item}><Feather name="check-circle" size={16} color={C.gold} /><Text style={styles.rowText}>{item}</Text></View>)}</View>
    <View style={styles.section}><Text style={styles.sectionTitle}>حالة العرض</Text><View style={styles.timeline}><View style={styles.dotActive} /><View style={styles.line} /><View style={styles.dot} /><Text style={styles.timelineText}>أُنشئ العرض</Text><Text style={styles.timelineTextMuted}>بانتظار الإجراء</Text></View></View>
    <View style={styles.notice}><Feather name="info" size={16} color={C.navy} /><Text style={styles.noticeText}>هذه واجهة Front فقط. زر القبول لا ينفذ دفعًا حقيقيًا حتى يتم ربط نظام العروض والـPayment بالـBackend.</Text></View>
    <TouchableOpacity style={styles.accept} onPress={() => Alert.alert("تمهيد للقبول", "سيتم ربط القبول والدفع الحقيقيين في مرحلة Backend.")}><Feather name="check" size={17} color="#fff" /><Text style={styles.acceptText}>مراجعة وقبول العرض</Text></TouchableOpacity>
  </ScrollView>;
}
const styles = StyleSheet.create({ container:{flex:1,backgroundColor:C.background}, content:{padding:20,paddingTop:58,paddingBottom:80}, back:{flexDirection:"row",alignItems:"center",gap:6,marginBottom:16}, backText:{fontSize:12,color:C.foreground,fontFamily:"Inter_600SemiBold"}, hero:{backgroundColor:C.navy,borderRadius:20,padding:20,alignItems:"flex-end",borderWidth:1,borderColor:"rgba(201,160,53,.35)"}, icon:{width:50,height:50,borderRadius:16,alignItems:"center",justifyContent:"center",marginBottom:12}, kind:{fontSize:10,color:C.gold,fontFamily:"Inter_600SemiBold"}, title:{fontSize:21,color:"#fff",fontFamily:"Inter_700Bold",textAlign:"right",marginTop:4}, status:{marginTop:10,paddingHorizontal:9,paddingVertical:5,borderRadius:9,backgroundColor:"rgba(255,255,255,.1)"}, statusText:{fontSize:9,color:"#fff",fontFamily:"Inter_700Bold"}, price:{backgroundColor:C.card,borderRadius:18,borderWidth:1,borderColor:C.border,padding:17,marginTop:12,alignItems:"flex-end"}, priceLabel:{fontSize:10,color:C.mutedForeground,fontFamily:"Inter_400Regular"}, amount:{fontSize:27,color:C.navy,fontFamily:"Inter_700Bold",marginTop:2}, currency:{fontSize:12}, priceHint:{fontSize:10,color:C.mutedForeground,fontFamily:"Inter_400Regular",marginTop:3}, section:{backgroundColor:C.card,borderRadius:18,borderWidth:1,borderColor:C.border,padding:16,marginTop:12}, sectionTitle:{fontSize:14,color:C.foreground,fontFamily:"Inter_700Bold",textAlign:"right",marginBottom:12}, row:{flexDirection:"row",alignItems:"flex-start",gap:8,marginBottom:10}, rowText:{flex:1,fontSize:11,color:C.foreground,lineHeight:18,textAlign:"right",fontFamily:"Inter_400Regular"}, timeline:{minHeight:60,flexDirection:"row",alignItems:"center",gap:8}, dotActive:{width:12,height:12,borderRadius:6,backgroundColor:C.gold}, dot:{width:12,height:12,borderRadius:6,backgroundColor:C.border}, line:{height:1,flex:1,backgroundColor:C.border}, timelineText:{fontSize:10,color:C.foreground,fontFamily:"Inter_600SemiBold"}, timelineTextMuted:{fontSize:10,color:C.mutedForeground,fontFamily:"Inter_400Regular"}, notice:{flexDirection:"row",alignItems:"flex-start",gap:8,padding:13,borderRadius:14,backgroundColor:"#F2F5FA",marginTop:12}, noticeText:{flex:1,fontSize:10,lineHeight:17,color:C.foreground,textAlign:"right",fontFamily:"Inter_400Regular"}, accept:{flexDirection:"row",alignItems:"center",justifyContent:"center",gap:8,backgroundColor:C.navy,borderRadius:14,paddingVertical:15,marginTop:14}, acceptText:{fontSize:14,color:"#fff",fontFamily:"Inter_700Bold"} });
