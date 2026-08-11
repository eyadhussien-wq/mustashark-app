import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

type Step = 1 | 2 | 3;

const DOCUMENTS = [
  { id: "facts", title: "ملخص الوقائع", hint: "اكتب الوقائع المهمة والتواريخ والأطراف" },
  { id: "supporting", title: "المستندات المؤيدة", hint: "يمكنك إضافة العقود أو القرارات أو المراسلات" },
  { id: "questions", title: "النقاط المطلوب بحثها", hint: "اذكر الأسئلة القانونية التي تريد أن تجيب عنها المذكرة" },
];

export default function ClientMemo() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [question, setQuestion] = useState("");
  const [attachments, setAttachments] = useState<string[]>([]);

  const progress = useMemo(() => `${step}/3`, [step]);

  function next() {
    if (step === 1 && (!title.trim() || !details.trim())) {
      Alert.alert("أكمل البيانات", "أدخل عنوان المذكرة وملخص الوقائع قبل المتابعة.");
      return;
    }
    if (step === 2 && !question.trim()) {
      Alert.alert("أكمل البيانات", "اكتب النقاط أو الأسئلة القانونية المطلوب بحثها.");
      return;
    }
    setStep((value) => Math.min(3, value + 1) as Step);
  }

  function submitRequest() {
    Alert.alert(
      "تم تجهيز الطلب",
      "تمت مراجعة بيانات المذكرة. عند ربط الـBackend سيُرسل الطلب للمحامين وتبدأ مرحلة العرض والسداد.",
      [{ text: "موافق", onPress: () => router.back() }],
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-right" size={21} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerIcon}><Feather name="file-text" size={23} color={C.gold} /></View>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>خدمة المذكرات</Text>
          <Text style={styles.title}>طلب مذكرة قانونية</Text>
          <Text style={styles.subtitle}>جهّز طلبك، أرفق مستنداتك، ثم استقبل عرض الأتعاب قبل البدء.</Text>
        </View>
      </View>

      <View style={styles.steps}>
        {["تفاصيل الطلب", "المرفقات", "المراجعة"].map((label, index) => {
          const item = index + 1;
          const active = item <= step;
          return (
            <View key={label} style={styles.stepItem}>
              <View style={[styles.stepCircle, active && styles.stepCircleActive]}><Text style={[styles.stepNumber, active && styles.stepNumberActive]}>{item}</Text></View>
              <Text style={[styles.stepLabel, active && styles.stepLabelActive]}>{label}</Text>
            </View>
          );
        })}
      </View>

      {step === 1 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>عن المذكرة</Text>
          <Text style={styles.cardHint}>كلما كانت الوقائع واضحة، كان تقييم الطلب أسرع.</Text>
          <Text style={styles.label}>عنوان المذكرة</Text>
          <TextInput value={title} onChangeText={setTitle} placeholder="مثال: مذكرة حول نزاع عقد تجاري" placeholderTextColor={C.mutedForeground} style={styles.input} textAlign="right" />
          <Text style={styles.label}>ملخص الوقائع</Text>
          <TextInput value={details} onChangeText={setDetails} multiline numberOfLines={6} placeholder="اشرح الوقائع والتواريخ والأطراف باختصار..." placeholderTextColor={C.mutedForeground} style={[styles.input, styles.textArea]} textAlign="right" textAlignVertical="top" />
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>المستندات والنقاط القانونية</Text>
          <Text style={styles.cardHint}>لا حاجة لإرسال مستند لا يرتبط مباشرة بالطلب.</Text>
          {DOCUMENTS.map((doc) => (
            <View key={doc.id} style={styles.documentRow}>
              <View style={styles.docIcon}><Feather name="file" size={17} color={C.gold} /></View>
              <View style={styles.docCopy}><Text style={styles.docTitle}>{doc.title}</Text><Text style={styles.docHint}>{doc.hint}</Text></View>
              <TouchableOpacity style={styles.attachBtn} onPress={() => setAttachments((prev) => prev.includes(doc.id) ? prev : [...prev, doc.id])}>
                <Feather name={attachments.includes(doc.id) ? "check" : "plus"} size={16} color={attachments.includes(doc.id) ? C.navy : C.gold} />
                <Text style={styles.attachText}>{attachments.includes(doc.id) ? "تمت الإضافة" : "إضافة"}</Text>
              </TouchableOpacity>
            </View>
          ))}
          <Text style={styles.label}>النقاط أو الأسئلة المطلوب بحثها</Text>
          <TextInput value={question} onChangeText={setQuestion} multiline numberOfLines={5} placeholder="ما الرأي القانوني أو النتيجة التي تريد الوصول إليها؟" placeholderTextColor={C.mutedForeground} style={[styles.input, styles.textArea]} textAlign="right" textAlignVertical="top" />
        </View>
      )}

      {step === 3 && (
        <View style={styles.card}>
          <View style={styles.reviewHeader}><Feather name="check-circle" size={22} color={C.gold} /><Text style={styles.cardTitle}>مراجعة الطلب</Text></View>
          <View style={styles.reviewRow}><Text style={styles.reviewValue}>{title}</Text><Text style={styles.reviewLabel}>الخدمة</Text></View>
          <View style={styles.reviewRow}><Text style={styles.reviewValue}>مذكرة قانونية</Text><Text style={styles.reviewLabel}>النوع</Text></View>
          <View style={styles.reviewRow}><Text style={styles.reviewValue}>{attachments.length} مرفقات/عناصر مضافة</Text><Text style={styles.reviewLabel}>المستندات</Text></View>
          <View style={styles.offerBox}>
            <Feather name="dollar-sign" size={18} color={C.gold} />
            <View style={{ flex: 1 }}><Text style={styles.offerTitle}>العرض المالي يأتي قبل التنفيذ</Text><Text style={styles.offerHint}>سيتم عرض أتعاب المحامي وشروط التسليم عليك للموافقة قبل بدء إعداد المذكرة.</Text></View>
          </View>
          <View style={styles.notice}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.noticeText}>لا يوجد دفع فعلي في هذه المرحلة؛ هذه واجهة الرحلة الأمامية حتى ربط خدمات الطلب والدفع.</Text></View>
        </View>
      )}

      <View style={styles.actions}>
        {step > 1 && <TouchableOpacity style={styles.secondaryBtn} onPress={() => setStep((value) => Math.max(1, value - 1) as Step)}><Text style={styles.secondaryText}>السابق</Text></TouchableOpacity>}
        <TouchableOpacity style={styles.primaryBtn} onPress={step === 3 ? submitRequest : next}>
          <Text style={styles.primaryText}>{step === 3 ? "إرسال طلب المذكرة" : "متابعة"}</Text>
          <Feather name={step === 3 ? "send" : "arrow-left"} size={17} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.footerNote}><Feather name="info" size={15} color={C.gold} /><Text style={styles.footerText}>بعد الإرسال: مراجعة الطلب ← عروض الأتعاب ← اختيار العرض ← بدء العمل ← تسليم المذكرة.</Text></View>
      <Text style={styles.progress}>{progress}</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingTop: 55, paddingBottom: 120, gap: 14 },
  header: { backgroundColor: C.navy, borderRadius: 20, padding: 17, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(201,160,53,.35)" },
  backBtn: { padding: 6, marginRight: 6 },
  headerIcon: { width: 50, height: 50, borderRadius: 16, backgroundColor: "rgba(255,255,255,.08)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  eyebrow: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold" },
  title: { color: "#fff", fontSize: 21, fontFamily: "Inter_700Bold", marginTop: 3, textAlign: "right" },
  subtitle: { color: "rgba(255,255,255,.72)", fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 4, fontFamily: "Inter_400Regular" },
  steps: { flexDirection: "row-reverse", justifyContent: "space-between", paddingHorizontal: 8, paddingVertical: 5 },
  stepItem: { alignItems: "center", gap: 5, flex: 1 },
  stepCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card, alignItems: "center", justifyContent: "center" },
  stepCircleActive: { backgroundColor: C.navy, borderColor: C.navy },
  stepNumber: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_700Bold" },
  stepNumberActive: { color: "#fff" },
  stepLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_500Medium" },
  stepLabelActive: { color: C.foreground, fontFamily: "Inter_700Bold" },
  card: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 18, padding: 16, gap: 10 },
  cardTitle: { fontSize: 16, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  cardHint: { fontSize: 11, color: C.mutedForeground, lineHeight: 18, textAlign: "right", fontFamily: "Inter_400Regular", marginBottom: 4 },
  label: { fontSize: 12, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 4 },
  input: { borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.background, paddingHorizontal: 12, paddingVertical: 11, color: C.foreground, fontSize: 13, fontFamily: "Inter_400Regular" },
  textArea: { minHeight: 115 },
  documentRow: { flexDirection: "row-reverse", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  docIcon: { width: 38, height: 38, borderRadius: 11, backgroundColor: "rgba(201,160,53,.1)", alignItems: "center", justifyContent: "center" },
  docCopy: { flex: 1, alignItems: "flex-end" },
  docTitle: { fontSize: 12, color: C.foreground, fontFamily: "Inter_700Bold" },
  docHint: { fontSize: 9, color: C.mutedForeground, marginTop: 3, textAlign: "right" },
  attachBtn: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 9, paddingVertical: 7, borderRadius: 9, borderWidth: 1, borderColor: C.border },
  attachText: { fontSize: 9, color: C.foreground, fontFamily: "Inter_600SemiBold" },
  reviewHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 8, marginBottom: 2 },
  reviewRow: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: C.border },
  reviewLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_500Medium" },
  reviewValue: { flex: 1, fontSize: 12, color: C.foreground, fontFamily: "Inter_600SemiBold", textAlign: "left" },
  offerBox: { flexDirection: "row-reverse", alignItems: "center", gap: 9, padding: 12, borderRadius: 13, backgroundColor: "#FFFCF3", borderWidth: 1, borderColor: "rgba(201,160,53,.35)", marginTop: 5 },
  offerTitle: { fontSize: 12, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  offerHint: { fontSize: 10, color: C.mutedForeground, lineHeight: 17, textAlign: "right", marginTop: 2 },
  notice: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, padding: 11, borderRadius: 12, backgroundColor: "rgba(27,58,107,.06)" },
  noticeText: { flex: 1, fontSize: 9, lineHeight: 16, color: C.mutedForeground, textAlign: "right" },
  actions: { flexDirection: "row-reverse", gap: 9 },
  primaryBtn: { flex: 1, flexDirection: "row-reverse", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.navy, borderRadius: 13, paddingVertical: 15 },
  primaryText: { color: "#fff", fontSize: 14, fontFamily: "Inter_700Bold" },
  secondaryBtn: { paddingHorizontal: 20, alignItems: "center", justifyContent: "center", borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  secondaryText: { color: C.foreground, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footerNote: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 7, padding: 12, borderRadius: 13, backgroundColor: "rgba(201,160,53,.07)" },
  footerText: { flex: 1, fontSize: 9, lineHeight: 16, color: C.mutedForeground, textAlign: "right" },
  progress: { textAlign: "center", fontSize: 9, color: C.mutedForeground },
});
