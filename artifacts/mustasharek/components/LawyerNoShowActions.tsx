import React, { useState } from "react";
import { ActivityIndicator, Modal, Text, TouchableOpacity, View } from "react-native";

export type TransferLawyer = {
  id: string;
  name: string;
  specialization?: string | null;
  litigationTier?: string | null;
  hourlyRate?: string | number | null;
  rating?: string | number | null;
  reviewsCount?: number | null;
};

export function LawyerNoShowActions({
  visible,
  lawyers,
  loading,
  onRefund,
  onTransfer,
  onClose,
}: {
  visible: boolean;
  lawyers: TransferLawyer[];
  loading?: boolean;
  onRefund: () => void;
  onTransfer: (lawyerId: string) => void;
  onClose: () => void;
}) {
  const [mode, setMode] = useState<"choices" | "transfer">("choices");

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" }}>
        <View style={{ backgroundColor: "#fff", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, gap: 14 }}>
          {mode === "choices" ? (
            <>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#132B4F", textAlign: "right" }}>المحامي لم يحضر</Text>
              <Text style={{ fontSize: 13, lineHeight: 20, color: "#6B7280", textAlign: "right" }}>لم ينضم المحامي ضمن المهلة المحددة. اختر كيف تريد متابعة استشارتك.</Text>
              <TouchableOpacity onPress={onRefund} disabled={loading} style={{ padding: 16, borderRadius: 14, backgroundColor: "#132B4F", alignItems: "center" }}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "800" }}>استرداد كامل إلى المحفظة</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setMode("transfer")} disabled={loading} style={{ padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: "#C9A035", backgroundColor: "rgba(201,160,53,0.08)", alignItems: "center" }}>
                <Text style={{ color: "#132B4F", fontWeight: "800" }}>نقل ذكي مجاني إلى محامٍ آخر</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={onClose} style={{ padding: 10, alignItems: "center" }}><Text style={{ color: "#6B7280" }}>إغلاق</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={{ fontSize: 20, fontWeight: "800", color: "#132B4F", textAlign: "right" }}>اختر محاميًا بديلاً</Text>
              <Text style={{ fontSize: 12, color: "#6B7280", textAlign: "right" }}>تمت المطابقة حسب التخصص ودرجة التقاضي وشريحة السعر.</Text>
              {lawyers.length === 0 ? <Text style={{ paddingVertical: 20, color: "#6B7280", textAlign: "center" }}>لا يوجد محامٍ مطابق متاح حاليًا.</Text> : lawyers.map((lawyer) => (
                <TouchableOpacity key={lawyer.id} onPress={() => onTransfer(lawyer.id)} disabled={loading} style={{ padding: 14, borderRadius: 14, borderWidth: 1, borderColor: "#E5E7EB", flexDirection: "row-reverse", alignItems: "center", gap: 10 }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "800", color: "#132B4F", textAlign: "right" }}>{lawyer.name}</Text>
                    <Text style={{ fontSize: 12, color: "#6B7280", marginTop: 3, textAlign: "right" }}>{lawyer.specialization ?? ""} {lawyer.litigationTier ? `• ${lawyer.litigationTier}` : ""}</Text>
                  </View>
                  <Text style={{ color: "#C9A035", fontWeight: "800" }}>اختيار</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setMode("choices")} style={{ padding: 10, alignItems: "center" }}><Text style={{ color: "#6B7280" }}>رجوع</Text></TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}
