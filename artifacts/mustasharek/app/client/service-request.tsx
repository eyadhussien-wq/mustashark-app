import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ActivityIndicator, Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";
type ServiceKey = "consultation" | "memorandum" | "representation";
const SERVICES = [
  { key: "consultation" as const, title: "استشارة قانونية", description: "تحدث مع المحامي لفهم وضعك القانوني.", icon: "message-circle" },
  { key: "memorandum" as const, title: "كتابة وصياغة مذكرة قانونية", description: "صياغة مذكرة دون توكيل أو حضور المحامي.", icon: "file-text" },
  { key: "representation" as const, title: "توكيل وتمثيل قانوني", description: "اطلب عرض أتعاب لتولي القضية وتمثيلك.", icon: "briefcase" },
];
const URGENCY = [
  { key: "normal", title: "عادي", description: "لا يوجد موعد قريب أو إجراء عاجل." },
  { key: "soon", title: "خلال أيام", description: "لدي موعد أو إجراء قريب." },
  { key: "urgent", title: "عاجل", description: "هناك مهلة أو جلسة قريبة جدًا." },
] as const;
type UrgencyKey = (typeof URGENCY)[number]["key"];
const INTAKE_DRAFT_KEY = "mustasharek_legal_intake_draft_v1";

export default function ClientServiceRequest() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { getAuthToken } = useAuth();
  const [service, setService] = useState<ServiceKey>("consultation");
  const [scope, setScope] = useState("");
  const [details, setDetails] = useState("");
  const [urgency, setUrgency] = useState<UrgencyKey>("normal");
  const [submitting, setSubmitting] = useState(false);
  const [submittedReference, setSubmittedReference] = useState<string | null>(null);
  const selectedService = SERVICES.find((item) => item.key === service)!;
  const canReview = scope.trim().length >= 3;
  const step = useMemo(() => (canReview ? 3 : 1), [canReview]);

  async function saveDraft() {
    await AsyncStorage.setItem(INTAKE_DRAFT_KEY, JSON.stringify({ service, scope: scope.trim(), details: details.trim(), urgency, savedAt: new Date().toISOString() }));
  }

  async function submitRepresentationRequest() {
    if (!canReview || submitting) return;
    setSubmitting(true);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("authentication_required");
      if (!API_BASE) throw new Error("api_unavailable");
      const idempotencyKey = `intake-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
      const response = await fetch(`${API_BASE}/representation/quote-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, "Idempotency-Key": idempotencyKey },
        body: JSON.stringify({ title: scope.trim(), description: [details.trim(), `الأولوية: ${urgency}`].filter(Boolean).join("\n") }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok || !body?.request) throw new Error(body?.error ?? "request_failed");
      await AsyncStorage.removeItem(INTAKE_DRAFT_KEY);
      setSubmittedReference(body.request.serialNumber ?? body.request.id);
    } catch (error) {
      const code = error instanceof Error ? error.message : "request_failed";
      const message = code === "authentication_required" ? "انتهت جلسة الدخول. يرجى تسجيل الدخول مرة أخرى." : code === "api_unavailable" ? "الخادم غير مهيأ لإرسال الطلب حالياً." : code === "idempotency_key_required" ? "تعذر حماية الطلب من التكرار. حاول مرة أخرى." : "تعذر إرسال الطلب الآن. لم يتم إنشاء طلب غير مكتمل.";
      Alert.alert("لم يُرسل الطلب", message);
    } finally {
      setSubmitting(false);
    }
  }

  async function continueFlow() {
    if (!canReview || submitting) return;
    if (service === "representation") return submitRepresentationRequest();
    await saveDraft();
    router.push(service === "memorandum" ? "/(client)/memo" : "/(client)/consultations");
  }

  if (submittedReference) {
    return (
      <View style={[styles.successScreen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
        <View style={styles.successIcon}><Feather name="check" size={30} color={C.gold} /></View>
        <Text style={styles.successTitle}>تم إرسال طلب التمثيل</Text>
        <Text style={styles.successText}>أصبح الطلب حقيقيًا على الخادم، ويمكن للمحامي مراجعته وإرسال العرض من مساره التشغيلي.</Text>
        <View style={styles.referenceCard}><Text style={styles.referenceLabel}>مرجع الطلب</Text><Text style={styles.referenceValue}>{submittedReference}</Text></View>
        <TouchableOpacity style={styles.primary} onPress={() => router.replace("/(client)/legal-hub")}><Text style={styles.primaryText}>العودة إلى مركزك القانوني</Text><Feather name="arrow-left" size={16} color="#fff" /></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), paddingBottom: insets.bottom + 40 }} keyboardShouldPersistTaps="handled">
      <View style={styles.header}><TouchableOpacity onPress={() => router.back()} accessibilityLabel="العودة"><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity><Text style={styles.title}>المساعد القانوني للطلب</Text><View style={{ width: 22 }} /></View>
      <View style={styles.progressRow}>{[1, 2, 3].map((item) => <View key={item} style={styles.progressItem}><View style={[styles.progressDot, step >= item && styles.progressDotActive]}>{step > item ? <Feather name="check" size={11} color="#fff" /> : <Text style={[styles.progressNumber, step >= item && styles.progressNumberActive]}>{item}</Text>}</View><Text style={[styles.progressLabel, step >= item && styles.progressLabelActive]}>{item === 1 ? "الخدمة" : item === 2 ? "السياق" : "المراجعة"}</Text></View>)}</View>
      <View style={styles.introCard}><View style={styles.introIcon}><Feather name="compass" size={20} color={C.gold} /></View><View style={styles.copy}><Text style={styles.introTitle}>لنبدأ من احتياجك الحقيقي</Text><Text style={styles.introText}>سنرتب المعلومات الأساسية حتى يصل طلبك للمسار الصحيح دون افتراضات أو قرارات قانونية آلية.</Text></View></View>
      <Text style={styles.sectionTitle}>1. ما الخدمة التي تحتاجها؟</Text>
      {SERVICES.map((item) => { const active = service === item.key; return <TouchableOpacity key={item.key} style={[styles.serviceCard, active && styles.serviceActive]} onPress={() => setService(item.key)} accessibilityRole="radio" accessibilityState={{ selected: active }}><View style={[styles.icon, active && styles.iconActive]}><Feather name={item.icon as any} size={20} color={active ? C.gold : C.mutedForeground} /></View><View style={styles.copy}><Text style={styles.serviceTitle}>{item.title}</Text><Text style={styles.serviceDesc}>{item.description}</Text></View><View style={[styles.radio, active && styles.radioActive]}>{active && <View style={styles.radioDot} />}</View></TouchableOpacity>; })}
      <View style={styles.section}><Text style={styles.sectionTitle}>2. ما الموضوع أو النطاق؟</Text><Text style={styles.helper}>اذكر النقطة التي تريد من المحامي فهمها أولًا، وليس كل تفاصيل القضية.</Text><TextInput value={scope} onChangeText={setScope} placeholder={service === "memorandum" ? "مثال: مذكرة دفاع لجلسة محددة" : service === "representation" ? "مثال: القضية كاملة / حضور جلسات" : "مثال: لدي نزاع حول عقد إيجار"} placeholderTextColor={C.mutedForeground} style={styles.input} textAlign="right" accessibilityLabel="موضوع أو نطاق الطلب" /></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>3. هل هناك موعد أو مهلة قريبة؟</Text><View style={styles.urgencyGrid}>{URGENCY.map((item) => { const active = urgency === item.key; return <TouchableOpacity key={item.key} style={[styles.urgencyCard, active && styles.urgencyActive]} onPress={() => setUrgency(item.key)}><Text style={[styles.urgencyTitle, active && styles.urgencyTitleActive]}>{item.title}</Text><Text style={styles.urgencyDesc}>{item.description}</Text></TouchableOpacity>; })}</View></View>
      <View style={styles.section}><Text style={styles.sectionTitle}>4. تفاصيل إضافية <Text style={styles.optional}>(اختياري)</Text></Text><TextInput value={details} onChangeText={setDetails} multiline placeholder="أضف معلومات تساعد المحامي على فهم السياق، مثل الطرف الآخر أو الموعد القريب." placeholderTextColor={C.mutedForeground} style={[styles.input, styles.textarea]} textAlign="right" textAlignVertical="top" accessibilityLabel="تفاصيل إضافية" /></View>
      <View style={styles.summaryCard}><View style={styles.summaryHeader}><Feather name="clipboard" size={17} color={C.gold} /><Text style={styles.summaryTitle}>ملخص الطلب</Text></View><View style={styles.summaryRow}><Text style={styles.summaryValue}>{selectedService.title}</Text><Text style={styles.summaryLabel}>الخدمة</Text></View><View style={styles.summaryRow}><Text style={styles.summaryValue}>{scope.trim() || "لم يُحدد بعد"}</Text><Text style={styles.summaryLabel}>الموضوع</Text></View><View style={styles.summaryRow}><Text style={styles.summaryValue}>{URGENCY.find((item) => item.key === urgency)?.title}</Text><Text style={styles.summaryLabel}>الأولوية</Text></View></View>
      <View style={styles.note}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.noteText}>{service === "representation" ? "سيُرسل هذا الطلب فعليًا إلى الخادم. لا يحتوي الطلب على سعر أو صلاحية؛ العرض المالي يظل من اختصاص مسار العرض على الخادم." : "هذه الخطوة لا تنشئ طلبًا مزيفًا. نحفظ مدخلاتك كمسودة ثم نكمل إلى المسار الذي يملك عقد الإنشاء الفعلي."}</Text></View>
      <TouchableOpacity style={[styles.primary, (!canReview || submitting) && styles.primaryDisabled]} onPress={continueFlow} disabled={!canReview || submitting} activeOpacity={0.85}>{submitting ? <ActivityIndicator size="small" color="#fff" /> : <><Text style={styles.primaryText}>{service === "representation" ? "إرسال الطلب فعليًا" : "متابعة إلى اختيار المسار"}</Text><Feather name="arrow-left" size={16} color={canReview ? "#fff" : C.mutedForeground} /></>}</TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({screen:{flex:1,backgroundColor:C.background,paddingHorizontal:20},header:{flexDirection:"row-reverse",alignItems:"center",justifyContent:"space-between",paddingVertical:16},title:{fontSize:20,fontFamily:"Inter_700Bold",color:C.foreground},progressRow:{flexDirection:"row-reverse",justifyContent:"space-between",marginBottom:16},progressItem:{alignItems:"center",gap:5,flex:1},progressDot:{width:28,height:28,borderRadius:14,backgroundColor:C.muted,alignItems:"center",justifyContent:"center"},progressDotActive:{backgroundColor:C.navy},progressNumber:{fontSize:11,fontFamily:"Inter_700Bold",color:C.mutedForeground},progressNumberActive:{color:"#fff"},progressLabel:{fontSize:10,color:C.mutedForeground},progressLabelActive:{color:C.foreground,fontFamily:"Inter_700Bold"},introCard:{flexDirection:"row-reverse",gap:10,backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:16,padding:14,marginBottom:20},introIcon:{width:40,height:40,borderRadius:12,backgroundColor:"rgba(201,160,53,0.12)",alignItems:"center",justifyContent:"center"},copy:{flex:1},introTitle:{color:C.foreground,fontSize:14,fontFamily:"Inter_700Bold",textAlign:"right"},introText:{color:C.mutedForeground,fontSize:11,lineHeight:18,textAlign:"right",marginTop:3},sectionTitle:{color:C.foreground,fontSize:13,fontFamily:"Inter_700Bold",textAlign:"right",marginBottom:8},helper:{color:C.mutedForeground,fontSize:11,lineHeight:17,textAlign:"right",marginBottom:8},serviceCard:{flexDirection:"row-reverse",alignItems:"center",gap:11,backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:16,padding:14,marginBottom:10},serviceActive:{borderColor:"rgba(201,160,53,0.55)"},icon:{width:44,height:44,borderRadius:13,backgroundColor:"#F3F4F6",alignItems:"center",justifyContent:"center"},iconActive:{backgroundColor:"rgba(201,160,53,0.12)"},serviceTitle:{color:C.foreground,fontSize:14,fontFamily:"Inter_700Bold",textAlign:"right"},serviceDesc:{color:C.mutedForeground,fontSize:11,lineHeight:17,textAlign:"right",marginTop:3},radio:{width:20,height:20,borderRadius:10,borderWidth:1.5,borderColor:C.border,alignItems:"center",justifyContent:"center"},radioActive:{borderColor:C.gold},radioDot:{width:10,height:10,borderRadius:5,backgroundColor:C.gold},section:{marginTop:18},input:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:13,paddingHorizontal:13,paddingVertical:12,minHeight:46,color:C.foreground,fontFamily:"Inter_400Regular",fontSize:13},textarea:{minHeight:120},urgencyGrid:{gap:8},urgencyCard:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:13,padding:12},urgencyActive:{borderColor:"rgba(201,160,53,0.55)",backgroundColor:"rgba(201,160,53,0.06)"},urgencyTitle:{color:C.foreground,fontSize:12,fontFamily:"Inter_700Bold",textAlign:"right"},urgencyTitleActive:{color:C.navy},urgencyDesc:{color:C.mutedForeground,fontSize:10,lineHeight:16,textAlign:"right",marginTop:2},optional:{color:C.mutedForeground,fontFamily:"Inter_400Regular"},summaryCard:{backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:16,padding:14,marginTop:20},summaryHeader:{flexDirection:"row-reverse",alignItems:"center",gap:7,marginBottom:8},summaryTitle:{color:C.foreground,fontSize:13,fontFamily:"Inter_700Bold"},summaryRow:{flexDirection:"row-reverse",justifyContent:"space-between",gap:12,paddingVertical:7,borderTopWidth:1,borderTopColor:C.border},summaryLabel:{color:C.mutedForeground,fontSize:10},summaryValue:{flex:1,color:C.foreground,fontSize:11,textAlign:"right"},note:{flexDirection:"row-reverse",alignItems:"flex-start",gap:8,backgroundColor:"rgba(201,160,53,0.08)",borderWidth:1,borderColor:"rgba(201,160,53,0.22)",borderRadius:14,padding:13,marginTop:14},noteText:{flex:1,color:C.mutedForeground,fontSize:11,lineHeight:18,textAlign:"right"},primary:{flexDirection:"row-reverse",justifyContent:"center",alignItems:"center",gap:8,backgroundColor:C.navy,borderRadius:14,padding:15,marginTop:14},primaryDisabled:{backgroundColor:C.muted},primaryText:{color:"#fff",fontSize:13,fontFamily:"Inter_700Bold"},successScreen:{flex:1,backgroundColor:C.background,paddingHorizontal:20,justifyContent:"center",alignItems:"center"},successIcon:{width:64,height:64,borderRadius:20,backgroundColor:"rgba(201,160,53,0.12)",alignItems:"center",justifyContent:"center",marginBottom:16},successTitle:{fontSize:22,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"center"},successText:{fontSize:12,lineHeight:20,color:C.mutedForeground,textAlign:"center",marginTop:8},referenceCard:{width:"100%",backgroundColor:C.card,borderWidth:1,borderColor:C.border,borderRadius:14,padding:14,marginTop:20},referenceLabel:{fontSize:10,color:C.mutedForeground,textAlign:"right"},referenceValue:{fontSize:15,fontFamily:"Inter_700Bold",color:C.foreground,textAlign:"right",marginTop:5}});
