import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;
const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

type RepresentationRequest = {
  id: string;
  serialNumber: string;
  title: string;
  description: string | null;
  status: "submitted" | "under_review";
};

export function LawyerRepresentationRequests() {
  const { getAuthToken } = useAuth();
  const [requests, setRequests] = useState<RepresentationRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    if (!API_BASE) return;
    setLoading(true);
    try {
      const token = await getAuthToken();
      if (!token) return;
      const response = await fetch(`${API_BASE}/representation/quote-requests`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok) throw new Error(body?.error ?? "request_list_failed");
      setRequests(Array.isArray(body.requests) ? body.requests : []);
    } catch {
      // Keep the dashboard usable; the server remains authoritative.
    } finally {
      setLoading(false);
    }
  }, [getAuthToken]);

  useEffect(() => { void load(); }, [load]);

  async function submitProposal(request: RepresentationRequest) {
    const raw = (amounts[request.id] ?? "").trim();
    const amount = Number(raw);
    if (!Number.isFinite(amount) || amount <= 0) {
      Alert.alert("قيمة غير صالحة", "أدخل قيمة عرض موجبة قبل الإرسال.");
      return;
    }
    setSubmittingId(request.id);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("authentication_required");
      if (!API_BASE) throw new Error("api_unavailable");
      const response = await fetch(`${API_BASE}/representation-quote-requests/${encodeURIComponent(request.id)}/proposals`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "Idempotency-Key": `proposal-${request.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        },
        body: JSON.stringify({ amount: raw, currency: "QAR" }),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok || !body?.ok || !body?.proposal) throw new Error(body?.error ?? "proposal_failed");
      Alert.alert("تم إرسال العرض", `العرض للطلب ${request.serialNumber} أصبح مسجلاً على الخادم وصالحاً لمدة 24 ساعة.`);
      setRequests((current) => current.filter((item) => item.id !== request.id));
    } catch (error) {
      const code = error instanceof Error ? error.message : "proposal_failed";
      const message = code === "lawyer_role_required" || code === "authentication_required"
        ? "يجب تسجيل الدخول كمحامٍ معتمد لإرسال العرض."
        : code === "request_not_available" || code === "lawyer_not_authorized_for_request"
          ? "لم يعد هذا الطلب متاحاً لهذا المحامي."
          : code === "idempotency_key_required"
            ? "تعذر حماية العملية من التكرار. حاول مرة أخرى."
            : "تعذر إرسال العرض. لم يتم إنشاء عرض غير مكتمل.";
      Alert.alert("لم يُرسل العرض", message);
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <View style={styles.card} accessibilityLabel="طلبات التمثيل المتاحة للمحامي">
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={styles.title}>طلبات التمثيل</Text>
          <Text style={styles.subtitle}>طلبات حقيقية يمكن للمحامي مراجعتها وإرسال عرض أتعاب لها.</Text>
        </View>
        <TouchableOpacity onPress={() => void load()} disabled={loading} style={styles.refreshButton}>
          {loading ? <ActivityIndicator size="small" color={C.gold} /> : <Text style={styles.refreshText}>تحديث</Text>}
        </TouchableOpacity>
      </View>
      {requests.length === 0 ? (
        <Text style={styles.empty}>لا توجد طلبات تمثيل متاحة حالياً.</Text>
      ) : requests.map((request) => (
        <View key={request.id} style={styles.request}>
          <View style={styles.requestCopy}>
            <Text style={styles.serial}>{request.serialNumber}</Text>
            <Text style={styles.requestTitle}>{request.title}</Text>
            {!!request.description && <Text style={styles.description} numberOfLines={3}>{request.description}</Text>}
          </View>
          <View style={styles.proposalRow}>
            <TextInput
              value={amounts[request.id] ?? ""}
              onChangeText={(value) => setAmounts((current) => ({ ...current, [request.id]: value.replace(/[^0-9.]/g, "") }))}
              placeholder="الأتعاب"
              placeholderTextColor={C.mutedForeground}
              keyboardType="decimal-pad"
              style={styles.amountInput}
              accessibilityLabel={`أتعاب العرض ${request.serialNumber}`}
            />
            <TouchableOpacity style={styles.proposeButton} onPress={() => void submitProposal(request)} disabled={submittingId === request.id}>
              {submittingId === request.id ? <ActivityIndicator size="small" color={C.navy} /> : <Text style={styles.proposeText}>إرسال العرض</Text>}
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 16 },
  header: { flexDirection: "row-reverse", alignItems: "center", gap: 10, marginBottom: 10 },
  headerCopy: { flex: 1, alignItems: "flex-end" },
  title: { fontSize: 17, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  subtitle: { fontSize: 10, color: C.mutedForeground, lineHeight: 16, textAlign: "right", marginTop: 3 },
  refreshButton: { borderWidth: 1, borderColor: C.border, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7, minWidth: 52, alignItems: "center" },
  refreshText: { fontSize: 10, color: C.navy, fontFamily: "Inter_700Bold" },
  empty: { fontSize: 12, color: C.mutedForeground, textAlign: "right", paddingVertical: 8 },
  request: { borderTopWidth: 1, borderTopColor: C.border, paddingVertical: 12, gap: 10 },
  requestCopy: { alignItems: "flex-end" },
  serial: { fontSize: 9, color: C.gold, fontFamily: "Inter_700Bold" },
  requestTitle: { fontSize: 13, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 3 },
  description: { fontSize: 10, color: C.mutedForeground, lineHeight: 16, textAlign: "right", marginTop: 3 },
  proposalRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  amountInput: { flex: 1, minHeight: 42, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingHorizontal: 10, color: C.foreground, textAlign: "right", fontFamily: "Inter_500Medium", fontSize: 12 },
  proposeButton: { minHeight: 42, backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 13, alignItems: "center", justifyContent: "center" },
  proposeText: { color: C.navy, fontSize: 10, fontFamily: "Inter_700Bold" },
});
