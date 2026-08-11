import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";

const C = colors.light;
const SCOPES = ["القضية كاملة", "كتابة لائحة", "حضور جلسات", "مراجعة ملف القضية"];

export default function RepresentationQuotePreview() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [scope, setScope] = useState(SCOPES[0]);
  const [description, setDescription] = useState("");

  function comingSoon() {
    Alert.alert("قريبًا", "هذا الزر جزء من واجهة المرحلة الثانية. الربط الفعلي بطلبات المحامي والمؤقت 24 ساعة سيُفعل لاحقًا.");
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ paddingTop: insets.top + (Platform.OS === "web" ? 67 : 10), paddingBottom: insets.bottom + 40 }}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.back}><Feather name="arrow-right" size={21} color={C.foreground} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.kicker}>الخدمات القانونية</Text><Text style={styles.title}>طلب عرض سعر توكيل</Text></View>
      </View>

      <View style={styles.notice}>
        <Feather name="shield" size={18} color={C.gold} />
        <Text style={styles.noticeText}>طلب عرض السعر يتم داخل منصة مستشارك. لا حاجة لمشاركة روابط دفع أو بيانات اتصال خارجية.</Text>
      </View>

      <Text style={styles.sectionTitle}>نطاق التوكيل</Text>
      <View style={styles.scopeGrid}>
        {SCOPES.map((item) => {
          const active = scope === item;
          return <TouchableOpacity key={item} style={[styles.scope, active && styles.scopeActive]} onPress={() => setScope(item)} activeOpacity={0.85}><Feather name={active ? "check-circle" : "circle"} size={16} color={active ? C.gold : C.mutedForeground} /><Text style={[styles.scopeText, active && styles.scopeTextActive]}>{item}</Text></TouchableOpacity>;
        })}
      </View>

      <Text style={styles.sectionTitle}>وصف مختصر اختياري</Text>
      <TextInput value={description} onChangeText={setDescription} multiline numberOfLines={5} placeholder="اكتب ملخصًا يساعد المحامي على فهم نطاق التوكيل..." placeholderTextColor={C.mutedForeground} textAlign="right" style={styles.input} />

      <View style={styles.flowCard}>
        <Text style={styles.flowTitle}>ماذا يحدث لاحقًا؟</Text>
        {[
          ["1", "إرسال الطلب", "يصل الطلب إلى المحامي داخل التطبيق."],
          ["2", "24 ساعة", "مهلة للمحامي لإرسال عرض الأتعاب."],
          ["3", "بطاقة العرض", "تظهر الأتعاب ونطاق العمل وشروط العرض."],
          ["4", "قبول ودفع", "ينتقل العميل إلى Checkout الآمن."],
        ].map(([n, title, text]) => <View key={n} style={styles.flowRow}><View style={styles.step}><Text style={styles.stepText}>{n}</Text></View><View style={{ flex: 1 }}><Text style={styles.flowRowTitle}>{title}</Text><Text style={styles.flowRowText}>{text}</Text></View></View>)}
      </View>

      <View style={styles.escrowCard}>
        <View style={styles.escrowHeader}><Feather name="lock" size={16} color={C.gold} /><Text style={styles.escrowTitle}>حماية الدفع</Text></View>
        <Text style={styles.escrowText}>عند اكتمال الربط، ستخضع عروض التوكيل لمنظومة Escrow والتقسيط المرحلي الخاصة بالتوكيل فقط.</Text>
        <View style={styles.milestones}><Text>30% دفعة البدء</Text><Text>40% الجلسات والمذكرات</Text><Text>30% الحكم والختام</Text></View>
      </View>

      <TouchableOpacity style={styles.disabledAction} onPress={comingSoon} activeOpacity={0.85}><Feather name="send" size={17} color="#fff" /><Text style={styles.disabledActionText}>إرسال طلب عرض السعر · قريبًا</Text></TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background, paddingHorizontal: 20 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 12, paddingVertical: 16 },
  back: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, alignItems: "center", justifyContent: "center" },
  kicker: { fontSize: 11, color: C.gold, fontWeight: "700", textAlign: "right" },
  title: { fontSize: 22, color: C.foreground, fontWeight: "800", textAlign: "right", marginTop: 3 },
  notice: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, backgroundColor: "rgba(201,160,53,0.08)", borderWidth: 1, borderColor: "rgba(201,160,53,0.22)", borderRadius: 14, padding: 13, marginBottom: 22 },
  noticeText: { flex: 1, color: C.mutedForeground, fontSize: 11, lineHeight: 18, textAlign: "right" },
  sectionTitle: { fontSize: 14, fontWeight: "800", color: C.foreground, textAlign: "right", marginBottom: 10, marginTop: 4 },
  scopeGrid: { gap: 9, marginBottom: 20 },
  scope: { flexDirection: "row-reverse", alignItems: "center", gap: 9, padding: 13, borderRadius: 13, borderWidth: 1, borderColor: C.border, backgroundColor: C.card },
  scopeActive: { borderColor: "rgba(201,160,53,0.5)", backgroundColor: "rgba(201,160,53,0.07)" },
  scopeText: { flex: 1, fontSize: 13, color: C.foreground, textAlign: "right" },
  scopeTextActive: { fontWeight: "800", color: C.navy },
  input: { minHeight: 125, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 14, fontSize: 13, lineHeight: 20, color: C.foreground, marginBottom: 20 },
  flowCard: { backgroundColor: C.card, borderRadius: 16, borderWidth: 1, borderColor: C.border, padding: 15, marginBottom: 12 },
  flowTitle: { fontSize: 14, fontWeight: "800", color: C.navy, textAlign: "right", marginBottom: 12 },
  flowRow: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 10, paddingVertical: 9 },
  step: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  stepText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  flowRowTitle: { color: C.foreground, fontSize: 12, fontWeight: "800", textAlign: "right" },
  flowRowText: { color: C.mutedForeground, fontSize: 10, lineHeight: 16, textAlign: "right", marginTop: 2 },
  escrowCard: { backgroundColor: "rgba(10,34,64,0.06)", borderRadius: 15, borderWidth: 1, borderColor: "rgba(10,34,64,0.12)", padding: 14, marginBottom: 18 },
  escrowHeader: { flexDirection: "row-reverse", alignItems: "center", gap: 7 },
  escrowTitle: { color: C.navy, fontSize: 13, fontWeight: "800" },
  escrowText: { color: C.mutedForeground, fontSize: 11, lineHeight: 18, textAlign: "right", marginTop: 7 },
  milestones: { gap: 5, marginTop: 10, alignItems: "flex-end" },
  disabledAction: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: C.navy, borderRadius: 14, paddingVertical: 16 },
  disabledActionText: { color: "#fff", fontSize: 13, fontWeight: "800" },
});
