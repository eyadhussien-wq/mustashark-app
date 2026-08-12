import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

type Proof = {
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
};

const METHOD_LABELS: Record<Proof["method"], string> = {
  bank_transfer: "تحويل بنكي",
  western_union: "Western Union",
  other: "طريقة أخرى",
};

export default function PaymentProofReviewScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, getAuthToken } = useAuth();
  const { bookingId } = useLocalSearchParams<{ bookingId: string }>();
  const [proofs, setProofs] = useState<Proof[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [rejectionFor, setRejectionFor] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  const load = useCallback(async () => {
    if (!bookingId || !API_BASE) { setLoading(false); return; }
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/payment-proofs`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!response.ok) throw new Error("تعذر تحميل إثباتات الدفع");
      const body = await response.json() as { proofs: Proof[] };
      setProofs(body.proofs ?? []);
    } catch (error) {
      Alert.alert("تعذر التحميل", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setLoading(false);
    }
  }, [bookingId, getAuthToken]);

  useEffect(() => { void load(); }, [load]);

  async function review(proofId: string, action: "confirm" | "reject") {
    if (action === "reject" && (rejectionFor !== proofId || !reason.trim())) {
      if (rejectionFor !== proofId) setReason("");
      setRejectionFor(proofId);
      Alert.alert("سبب الرفض مطلوب", "اكتب سببًا واضحًا حتى يعرف العميل ما الذي يحتاج إلى تصحيحه.");
      return;
    }
    setBusy(proofId);
    try {
      const token = await getAuthToken();
      const response = await fetch(`${API_BASE}/bookings/${bookingId}/payment-proofs/${proofId}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: action === "reject" ? JSON.stringify({ reason: reason.trim() }) : undefined,
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || body.error || "تعذر تحديث الدفعة");
      setReason("");
      setRejectionFor(null);
      await load();
      Alert.alert(action === "confirm" ? "تم تأكيد الدفعة" : "تم رفض الإثبات", action === "confirm" ? "سُجلت الدفعة، وسيتم اعتبار الخدمة مدفوعة بالكامل عند اكتمال قيمة الاتفاق." : "تم تسجيل سبب الرفض وإبلاغ العميل.");
    } catch (error) {
      Alert.alert("تعذر تنفيذ العملية", error instanceof Error ? error.message : "حاول مجدداً.");
    } finally {
      setBusy(null);
    }
  }

  if (user?.role !== "lawyer" && user?.role !== "admin") {
    return <View style={styles.centered}><Feather name="shield" size={36} color={C.destructive} /><Text style={styles.title}>هذه الشاشة للمحامي أو الإدارة</Text></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={[styles.container, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 30 }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity>
        <View style={{ flex: 1 }}><Text style={styles.title}>مراجعة الدفعات</Text><Text style={styles.subtitle}>لا تؤكد إلا بعد التحقق الفعلي من استلام المبلغ</Text></View>
      </View>

      {loading ? <ActivityIndicator color={C.primary} /> : proofs.length === 0 ? (
        <View style={styles.empty}><Feather name="inbox" size={32} color={C.border} /><Text style={styles.emptyText}>لا توجد إثباتات دفع لهذه الاستشارة.</Text></View>
      ) : proofs.map((proof) => (
        <View key={proof.id} style={styles.card}>
          <View style={styles.amountRow}>
            <View><Text style={styles.amount}>{Number(proof.amount).toFixed(2)} {proof.currency}</Text><Text style={styles.method}>{METHOD_LABELS[proof.method]}</Text></View>
            <View style={styles.pendingBadge}><Text style={styles.pendingText}>{proof.status === "submitted" ? "بانتظار المراجعة" : proof.status === "confirmed" ? "مؤكد" : "مرفوض"}</Text></View>
          </View>
          {proof.proofUri && /^https?:|^file:|^content:/.test(proof.proofUri) && /\.(jpg|jpeg|png|webp)(\?.*)?$/i.test(proof.proofUri) && <Image source={{ uri: proof.proofUri }} style={styles.proofImage} resizeMode="cover" />}
          {proof.reference && <Text style={styles.meta}>المرجع: {proof.reference}</Text>}
          {proof.note && <Text style={styles.note}>{proof.note}</Text>}
          {proof.status === "submitted" && (
            <>
              {rejectionFor === proof.id && <TextInput value={reason} onChangeText={setReason} placeholder="سبب رفض الإثبات" placeholderTextColor={C.mutedForeground} style={styles.input} textAlign="right" multiline />}
              <View style={styles.actions}>
                <TouchableOpacity style={styles.rejectButton} disabled={!!busy} onPress={() => review(proof.id, "reject")}><Feather name="x-circle" size={16} color={C.destructive} /><Text style={styles.rejectText}>رفض</Text></TouchableOpacity>
                <TouchableOpacity style={styles.confirmButton} disabled={!!busy} onPress={() => review(proof.id, "confirm")}>
                  {busy === proof.id ? <ActivityIndicator color="#fff" size="small" /> : <><Feather name="check-circle" size={16} color="#fff" /><Text style={styles.confirmText}>تأكيد استلام المبلغ</Text></>}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  container: { paddingHorizontal: 18, gap: 14 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: C.background },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 20, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  subtitle: { marginTop: 3, color: C.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 15, gap: 10 },
  amountRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  amount: { fontSize: 20, color: C.navy, fontFamily: "Inter_700Bold", textAlign: "right" },
  method: { marginTop: 3, fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  pendingBadge: { backgroundColor: "#FEF3C7", borderRadius: 10, paddingHorizontal: 9, paddingVertical: 6 },
  pendingText: { color: C.warning, fontSize: 10, fontFamily: "Inter_700Bold" },
  proofImage: { width: "100%", height: 220, borderRadius: 12 },
  meta: { color: C.mutedForeground, fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  note: { color: C.foreground, fontSize: 13, lineHeight: 20, fontFamily: "Inter_400Regular", textAlign: "right" },
  input: { minHeight: 80, borderWidth: 1, borderColor: C.border, borderRadius: 10, padding: 10, color: C.foreground, backgroundColor: C.background, fontFamily: "Inter_400Regular" },
  actions: { flexDirection: "row", gap: 9 },
  rejectButton: { flex: 1, borderWidth: 1, borderColor: C.destructive, borderRadius: 11, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  rejectText: { color: C.destructive, fontFamily: "Inter_700Bold" },
  confirmButton: { flex: 2, backgroundColor: C.success, borderRadius: 11, paddingVertical: 12, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6 },
  confirmText: { color: "#fff", fontFamily: "Inter_700Bold" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 10 },
  emptyText: { color: C.mutedForeground, fontFamily: "Inter_400Regular" },
});
