import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

type PaymentProof = {
  id: string;
  amount: string;
  currency: string;
  method: "bank_transfer" | "western_union" | "other";
  proofUri: string;
  reference?: string | null;
  note?: string | null;
  status: "submitted" | "confirmed" | "rejected";
  rejectionReason?: string | null;
  submittedAt: string;
  reviewedAt?: string | null;
};

type BookingSummary = {
  id: string;
  price: string;
  paymentStatus: "pending" | "paid" | "refunded" | "forfeited" | "disputed";
  clientId?: string | null;
};

const METHOD_LABELS: Record<PaymentProof["method"], string> = {
  bank_transfer: "تحويل بنكي",
  western_union: "Western Union",
  other: "طريقة أخرى متفق عليها",
};

const STATUS_META: Record<PaymentProof["status"], { label: string; color: string; bg: string }> = {
  submitted: { label: "بانتظار تأكيد المحامي", color: C.warning, bg: "#FEF3C7" },
  confirmed: { label: "تم تأكيد الدفعة", color: C.success, bg: "#ECFDF5" },
  rejected: { label: "تم رفض الإثبات", color: C.destructive, bg: "#FEE2E2" },
};

function normalizeAmount(value: string) {
  return value
    .replace(/[\u0660-\u0669]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/[\u06F0-\u06F9]/g, (digit) => String(digit.charCodeAt(0) - 0x06F0))
    .replace(/,/g, ".");
}

export default function PaymentProofScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getAuthToken } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [booking, setBooking] = useState<BookingSummary | null>(null);
  const [proofs, setProofs] = useState<PaymentProof[]>([]);
  const [currency, setCurrency] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentProof["method"]>("bank_transfer");
  const [proofUri, setProofUri] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  const confirmedTotal = proofs.filter((p) => p.status === "confirmed").reduce((sum, p) => sum + Number(p.amount), 0);
  const pendingTotal = proofs.filter((p) => p.status === "submitted").reduce((sum, p) => sum + Number(p.amount), 0);
  const totalDue = Number(booking?.price ?? 0);
  const remaining = Math.max(0, totalDue - confirmedTotal - pendingTotal);

  const load = useCallback(async () => {
    if (!bookingId || !API_BASE) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const token = await getAuthToken();
      const headers: HeadersInit = token ? { Authorization: `Bearer ${token}` } : {};
      const [bookingRes, proofsRes] = await Promise.all([
        fetch(`${API_BASE}/bookings/${bookingId}`, { headers }),
        fetch(`${API_BASE}/bookings/${bookingId}/payment-proofs`, { headers }),
      ]);
      if (!bookingRes.ok || !proofsRes.ok) throw new Error("تعذر تحميل بيانات الدفع");
      const bookingBody = await bookingRes.json() as { booking: BookingSummary };
      const proofsBody = await proofsRes.json() as { proofs: PaymentProof[]; currency: string };
      setBooking(bookingBody.booking);
      setProofs(proofsBody.proofs ?? []);
      setCurrency(proofsBody.currency ?? proofsBody.proofs?.[0]?.currency ?? "");
    } catch (error) {
      Alert.alert("تعذر تحميل الدفعات", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, getAuthToken]);

  useEffect(() => { void load(); }, [load]);

  async function pickProof() {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("السماح بالصور مطلوب", "اسمح للتطبيق بالوصول إلى الصور لإرفاق إيصال التحويل.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.85, allowsEditing: false });
    if (!result.canceled && result.assets[0]?.uri) setProofUri(result.assets[0].uri);
  }

  async function submitProof() {
    const parsedAmount = Number(normalizeAmount(amount));
    if (!bookingId || !amount || !Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("المبلغ مطلوب", "أدخل قيمة الدفعة التي قمت بتحويلها.");
      return;
    }
    if (!proofUri) {
      Alert.alert("الإيصال مطلوب", "ارفع صورة أو ملف إثبات الدفع قبل الإرسال.");
      return;
    }
    if (parsedAmount > remaining + 0.0001) {
      Alert.alert("المبلغ يتجاوز المتبقي", `المتبقي المسجل حاليًا ${remaining.toFixed(2)} ${currency}.`);
      return;
    }

    setSubmitting(true);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/payment-proofs`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ amount: parsedAmount, method, proofUri, reference: reference.trim() || undefined, note: note.trim() || undefined }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || "تعذر إرسال إثبات الدفع");
      setCurrency(body.currency ?? currency);
      setAmount("");
      setProofUri("");
      setReference("");
      setNote("");
      await load();
      Alert.alert("تم إرسال الإثبات", "تم إرسال إثبات الدفع وبانتظار تأكيد المحامي. لم تُعتبر الدفعة مؤكدة بعد.");
    } catch (error) {
      Alert.alert("تعذر إرسال الإثبات", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setSubmitting(false);
    }
  }

  if (user?.role !== "client") {
    return <View style={styles.centered}><Feather name="shield" size={36} color={C.destructive} /><Text style={styles.centeredTitle}>هذه الشاشة مخصصة للعميل</Text><TouchableOpacity onPress={() => router.back()}><Text style={styles.link}>العودة</Text></TouchableOpacity></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity>
        <View style={styles.headerText}><Text style={styles.title}>المدفوعات</Text><Text style={styles.subtitle}>ادفع من خلال مستشارك أولًا، أو سجّل دفعة خارجية عند الحاجة</Text></View>
      </View>

      <View style={styles.primaryCard}>
        <View style={styles.primaryIcon}><Feather name="shield" size={22} color={C.gold} /></View>
        <View style={styles.primaryCopy}><Text style={styles.primaryTitle}>الدفع عبر مستشارك هو الخيار الأساسي</Text><Text style={styles.primaryText}>Visa وMastercard ووسائل الدفع المحلية المتاحة في بلدك تُعالج عبر المنصة عند تفعيل بوابة الدفع.</Text></View>
        <TouchableOpacity style={styles.primaryButton} onPress={() => Alert.alert("الدفع الآمن", "سيتم فتح بوابة الدفع الآمنة من مستشارك عند تفعيل بوابة الدفع الإنتاجية. لم يتم تغيير Mock Payment في هذه المرحلة.")}><Feather name="credit-card" size={16} color="#fff" /><Text style={styles.primaryButtonText}>الدفع عبر مستشارك</Text></TouchableOpacity>
      </View>

      <View style={styles.secondaryCard}>
        <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Feather name="upload" size={15} color={C.gold} /></View><View style={{ flex: 1 }}><Text style={styles.sectionTitle}>الدفع خارج التطبيق</Text><Text style={styles.sectionHint}>مسار بديل لمن لا يستطيع استخدام الدفع الإلكتروني</Text></View></View>
        <Text style={styles.helper}>يمكن استخدامه للتحويل البنكي أو Western Union أو أي طريقة اتفق عليها الطرفان. رفع الإيصال لا يعني أن المبلغ تم تأكيده.</Text>
        <View style={styles.balanceRow}><View><Text style={styles.balanceLabel}>إجمالي الخدمة</Text><Text style={styles.balanceValue}>{totalDue.toFixed(2)} {currency}</Text></View><View><Text style={styles.balanceLabel}>بانتظار المراجعة</Text><Text style={styles.balanceValue}>{pendingTotal.toFixed(2)} {currency}</Text></View><View><Text style={styles.balanceLabel}>المتبقي</Text><Text style={styles.balanceValue}>{remaining.toFixed(2)} {currency}</Text></View></View>
        <Text style={styles.fieldLabel}>المبلغ المدفوع</Text>
        <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" placeholder="مثال: 500" placeholderTextColor={C.mutedForeground} style={styles.input} textAlign="right" />
        <Text style={styles.fieldLabel}>طريقة الدفع</Text>
        <View style={styles.methodRow}>{(Object.keys(METHOD_LABELS) as PaymentProof["method"][]).map((item) => <TouchableOpacity key={item} onPress={() => setMethod(item)} style={[styles.methodButton, method === item && styles.methodButtonActive]}><Text style={[styles.methodText, method === item && styles.methodTextActive]}>{METHOD_LABELS[item]}</Text></TouchableOpacity>)}</View>
        <TouchableOpacity style={styles.uploadButton} onPress={pickProof}><Feather name={proofUri ? "check-circle" : "paperclip"} size={18} color={proofUri ? C.success : C.navy} /><Text style={styles.uploadText}>{proofUri ? "تم إرفاق إثبات الدفع" : "رفع إثبات الدفع"}</Text></TouchableOpacity>
        {proofUri && proofUri.match(/\.(jpg|jpeg|png|webp)$/i) && <Image source={{ uri: proofUri }} style={styles.preview} resizeMode="cover" />}
        <Text style={styles.fieldLabel}>رقم التحويل / المرجع (اختياري)</Text>
        <TextInput value={reference} onChangeText={setReference} placeholder="رقم العملية أو الحوالة" placeholderTextColor={C.mutedForeground} style={styles.input} textAlign="right" />
        <Text style={styles.fieldLabel}>ملاحظة (اختياري)</Text>
        <TextInput value={note} onChangeText={setNote} placeholder="أي معلومة تساعد المحامي في التحقق" placeholderTextColor={C.mutedForeground} style={[styles.input, styles.noteInput]} multiline textAlign="right" />
        <TouchableOpacity style={[styles.submitButton, submitting && { opacity: 0.6 }]} onPress={submitProof} disabled={submitting}>{submitting ? <ActivityIndicator color="#fff" size="small" /> : <><Feather name="send" size={17} color="#fff" /><Text style={styles.submitText}>إرسال إثبات الدفع</Text></>}</TouchableOpacity>
      </View>

      <View style={styles.historyCard}>
        <View style={styles.sectionHeader}><View style={styles.sectionIcon}><Feather name="list" size={15} color={C.gold} /></View><Text style={styles.sectionTitle}>سجل الدفعات</Text></View>
        {loading ? <ActivityIndicator color={C.primary} /> : proofs.length === 0 ? <Text style={styles.emptyText}>لا توجد دفعات خارجية مسجلة.</Text> : proofs.map((proof) => { const meta = STATUS_META[proof.status]; return <View key={proof.id} style={styles.proofRow}><View style={{ flex: 1 }}><Text style={styles.proofAmount}>{Number(proof.amount).toFixed(2)} {proof.currency}</Text><Text style={styles.proofMethod}>{METHOD_LABELS[proof.method]} • {new Date(proof.submittedAt).toLocaleDateString("ar-SA")}</Text>{proof.rejectionReason && <Text style={styles.rejection}>{proof.rejectionReason}</Text>}</View><View style={[styles.statusBadge, { backgroundColor: meta.bg }]}><Text style={[styles.statusText, { color: meta.color }]}>{meta.label}</Text></View></View>; })}
      </View>

      <View style={styles.notice}><Feather name="info" size={15} color={C.primary} /><Text style={styles.noticeText}>لأسباب الأمان، مستشارك لا تعتبر إيصال العميل دليلًا نهائيًا على استلام المال. التأكيد يتم من المحامي، أما الدفع الإلكتروني فيعتمد على تأكيد بوابة الدفع.</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 18, gap: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: C.background },
  centeredTitle: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.foreground },
  link: { color: C.primary, fontFamily: "Inter_600SemiBold" },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  backButton: { padding: 5 },
  headerText: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 20, fontFamily: "Inter_700Bold", color: C.foreground },
  subtitle: { marginTop: 3, fontSize: 12, lineHeight: 18, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  primaryCard: { backgroundColor: C.navy, borderRadius: 18, padding: 16, gap: 12 },
  primaryIcon: { width: 42, height: 42, borderRadius: 12, backgroundColor: "rgba(201,160,53,0.18)", alignItems: "center", justifyContent: "center" },
  primaryCopy: { gap: 5 },
  primaryTitle: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold", textAlign: "right" },
  primaryText: { color: "rgba(255,255,255,0.72)", fontSize: 12, lineHeight: 19, fontFamily: "Inter_400Regular", textAlign: "right" },
  primaryButton: { backgroundColor: C.gold, borderRadius: 12, paddingVertical: 13, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  primaryButtonText: { color: C.navy, fontFamily: "Inter_700Bold", fontSize: 14 },
  secondaryCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, gap: 10 },
  historyCard: { backgroundColor: C.card, borderRadius: 18, padding: 16, borderWidth: 1, borderColor: C.border, gap: 12 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 9 },
  sectionIcon: { width: 28, height: 28, borderRadius: 8, backgroundColor: "rgba(201,160,53,0.13)", alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.navy },
  sectionHint: { marginTop: 2, fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  helper: { backgroundColor: "#F8FAFF", borderRadius: 12, padding: 12, color: C.mutedForeground, fontSize: 12, lineHeight: 19, fontFamily: "Inter_400Regular", textAlign: "right" },
  balanceRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, backgroundColor: "#F8FAFF", borderRadius: 12, padding: 12 },
  balanceLabel: { color: C.mutedForeground, fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "right" },
  balanceValue: { color: C.navy, fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 3, textAlign: "right" },
  fieldLabel: { fontSize: 12, color: C.navy, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 2 },
  input: { backgroundColor: C.background, borderWidth: 1, borderColor: C.border, borderRadius: 11, paddingHorizontal: 12, paddingVertical: 11, color: C.foreground, fontFamily: "Inter_400Regular", fontSize: 14 },
  noteInput: { minHeight: 80, textAlignVertical: "top" },
  methodRow: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  methodButton: { borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 9, backgroundColor: C.background },
  methodButtonActive: { borderColor: C.gold, backgroundColor: "rgba(201,160,53,0.10)" },
  methodText: { color: C.mutedForeground, fontSize: 11, fontFamily: "Inter_600SemiBold" },
  methodTextActive: { color: C.navy },
  uploadButton: { borderWidth: 1.2, borderStyle: "dashed", borderColor: C.gold, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, backgroundColor: "rgba(201,160,53,0.05)" },
  uploadText: { color: C.navy, fontFamily: "Inter_700Bold", fontSize: 13 },
  preview: { width: "100%", height: 170, borderRadius: 12 },
  submitButton: { backgroundColor: C.primary, borderRadius: 12, paddingVertical: 14, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8, marginTop: 3 },
  submitText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 14 },
  emptyText: { color: C.mutedForeground, fontSize: 12, textAlign: "right", fontFamily: "Inter_400Regular" },
  proofRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.border },
  proofAmount: { color: C.navy, fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  proofMethod: { color: C.mutedForeground, fontSize: 11, marginTop: 3, fontFamily: "Inter_400Regular", textAlign: "right" },
  rejection: { color: C.destructive, fontSize: 11, marginTop: 3, fontFamily: "Inter_500Medium", textAlign: "right" },
  statusBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 6 },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  notice: { flexDirection: "row", alignItems: "flex-start", gap: 8, backgroundColor: "#EEF2FF", borderRadius: 12, padding: 12 },
  noticeText: { flex: 1, color: C.primary, fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right" },
});
