import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { HandoverMode, HandoverOptions } from "@/components/HandoverOptions";

const C = colors.light;
const TRACKING = [
  ["requested", "تم طلب التسليم"],
  ["approved", "تم اعتماد الطلب"],
  ["preparing", "جاري تجهيز المستند"],
  ["dispatched", "تم الإرسال"],
  ["in_transit", "في الطريق"],
  ["customs", "إجراءات الجمارك"],
  ["ready_for_delivery", "جاهز للتسليم"],
  ["delivered", "تم التسليم"],
] as const;

export default function DocumentHandover() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams();
  const [selected, setSelected] = useState<HandoverMode>("office");
  const currentIndex = selected === "international" ? 4 : 2;

  return <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), paddingBottom: insets.bottom + 40 }}>
    <View style={styles.header}>
      <TouchableOpacity onPress={() => router.back()} accessibilityLabel="رجوع"><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity>
      <Text style={styles.title}>تسليم المستندات</Text><View style={{ width: 22 }} />
    </View>

    <View style={styles.case}><Feather name="folder" size={18} color={C.gold} /><Text style={styles.caseText}>القضية {String(id ?? "CASE-001")}</Text></View>
    <View style={styles.document}><View style={styles.documentIcon}><Feather name="file-text" size={21} color={C.navy} /></View><View style={{ flex: 1 }}><Text style={styles.documentTitle}>المستند القانوني</Text><Text style={styles.documentMeta}>مرتبط بالقضية • جاهز للتسليم</Text></View><View style={styles.ready}><Text style={styles.readyText}>جاهز</Text></View></View>

    <Text style={styles.sectionTitle}>طريقة التسليم</Text>
    <Text style={styles.intro}>يختار النظام الخيارات المناسبة حسب موقع العميل ومكتب المحامي، ويمكن إظهار الشحن الدولي عند اختلاف البلد.</Text>
    <HandoverOptions availableModes={["local", "office", "courier", "international"]} selected={selected} onSelect={setSelected} />

    <View style={styles.trackingHeader}><View><Text style={styles.trackTitle}>Tracking</Text><Text style={styles.trackSub}>حالة التسليم وسجل الأحداث</Text></View><Feather name="truck" size={19} color={C.navy} /></View>
    <View style={styles.timeline}>{TRACKING.map(([status, label], index) => { const done = index <= currentIndex; return <View key={status} style={styles.timelineRow}><View style={[styles.dot, done && styles.dotDone]}>{done && <Feather name="check" size={10} color="#fff" />}</View><View style={styles.timelineCopy}><Text style={[styles.timelineLabel, done && styles.timelineDone]}>{label}</Text><Text style={styles.timelineStatus}>{status}</Text></View>{index < TRACKING.length - 1 && <View style={[styles.line, index < currentIndex && styles.lineDone]} />}</View>; })}</View>

    <View style={styles.guidance}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.guidanceText}>التسليم النهائي لا يُعتبر مكتملًا إلا بعد تسجيل إثبات التسليم والتحقق من رمز OTP عند الحاجة.</Text></View>
    <View style={styles.international}><Feather name="globe" size={16} color={C.gold} /><Text style={styles.internationalText}>للشحن الدولي قد تُطلب مستندات تصديق أو إجراءات جمركية إضافية بحسب الدولة.</Text></View>

    <TouchableOpacity style={styles.primary} onPress={() => router.back()}><Text style={styles.primaryText}>بدء طلب التسليم</Text><Feather name="arrow-left" size={16} color="#fff" /></TouchableOpacity>
  </ScrollView>;
}

const styles = StyleSheet.create({
  screen:{flex:1,backgroundColor:C.background,paddingHorizontal:20}, header:{flexDirection:"row-reverse",alignItems:"center",justifyContent:"space-between",paddingVertical:16}, title:{fontSize:20,fontFamily:"Inter_700Bold",color:C.foreground},
  case:{flexDirection:"row-reverse",alignItems:"center",gap:8,backgroundColor:C.navy,borderRadius:14,padding:13,marginBottom:10}, caseText:{color:"#fff",fontSize:12,fontFamily:"Inter_600SemiBold"},
  document:{flexDirection:"row-reverse",alignItems:"center",gap:10,backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:16,padding:13,marginBottom:18}, documentIcon:{width:42,height:42,borderRadius:12,backgroundColor:"#EEF2F8",alignItems:"center",justifyContent:"center"}, documentTitle:{fontSize:13,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"right"}, documentMeta:{fontSize:9.5,color:C.mutedForeground,textAlign:"right",marginTop:3}, ready:{backgroundColor:"#EAF7EF",borderRadius:10,paddingHorizontal:8,paddingVertical:5}, readyText:{fontSize:9,color:"#26734D",fontFamily:"Inter_700Bold"},
  sectionTitle:{fontSize:15,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"right"}, intro:{color:C.mutedForeground,fontSize:10.5,lineHeight:18,textAlign:"right",marginTop:5,marginBottom:12},
  trackingHeader:{marginTop:20,backgroundColor:"#EEF2F8",borderRadius:15,padding:13,flexDirection:"row-reverse",alignItems:"center",justifyContent:"space-between"}, trackTitle:{fontSize:13,fontFamily:"Inter_700Bold",color:C.navy,textAlign:"right"}, trackSub:{fontSize:9.5,color:C.mutedForeground,textAlign:"right",marginTop:2},
  timeline:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:15,padding:15,marginTop:8}, timelineRow:{minHeight:45,flexDirection:"row-reverse",alignItems:"flex-start",position:"relative"}, dot:{width:20,height:20,borderRadius:10,borderWidth:1.5,borderColor:C.border,backgroundColor:C.card,alignItems:"center",justifyContent:"center",zIndex:2}, dotDone:{backgroundColor:C.gold,borderColor:C.gold}, timelineCopy:{flex:1,alignItems:"flex-end",paddingRight:10}, timelineLabel:{fontSize:11,color:C.mutedForeground,fontFamily:"Inter_600SemiBold",textAlign:"right"}, timelineDone:{color:C.foreground}, timelineStatus:{fontSize:8.5,color:C.mutedForeground,marginTop:2}, line:{position:"absolute",right:9,top:20,width:1,height:30,backgroundColor:C.border}, lineDone:{backgroundColor:C.gold},
  guidance:{flexDirection:"row-reverse",gap:8,alignItems:"flex-start",backgroundColor:"rgba(201,160,53,.08)",borderWidth:1,borderColor:"rgba(201,160,53,.2)",borderRadius:14,padding:13,marginTop:12}, guidanceText:{flex:1,color:C.mutedForeground,fontSize:10.5,lineHeight:18,textAlign:"right"}, international:{flexDirection:"row-reverse",gap:8,alignItems:"flex-start",backgroundColor:"#F7F8FA",borderRadius:14,padding:13,marginTop:8}, internationalText:{flex:1,color:C.mutedForeground,fontSize:10.5,lineHeight:18,textAlign:"right"},
  primary:{flexDirection:"row-reverse",justifyContent:"center",alignItems:"center",gap:8,backgroundColor:C.navy,borderRadius:14,paddingVertical:16,marginTop:18}, primaryText:{color:"#fff",fontSize:14,fontFamily:"Inter_700Bold"},
});
