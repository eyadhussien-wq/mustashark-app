import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { usePathname, useRouter } from "expo-router";
import { useAuth } from "@/contexts/AuthContext";
import { fundMilestone } from "@/lib/finance";
import colors from "@/constants/colors";

const C = colors.light;

type Props = {
  milestoneId?: string;
};

export function FundMilestoneButton({ milestoneId }: Props) {
  const { getAuthToken } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!milestoneId) return null;

  const handleFund = async () => {
    if (isPending) return;
    setIsPending(true);
    setMessage(null);
    try {
      const result = await fundMilestone(getAuthToken, milestoneId);
      if (result.ok) {
        setMessage("تم تسجيل تمويل المرحلة بنجاح.");
        router.replace(pathname);
      } else {
        setMessage(errorMessage(result.error));
      }
    } catch (error) {
      setMessage(error instanceof Error && error.message === "authentication_required"
        ? "انتهت جلسة الدخول. يرجى تسجيل الدخول مجدداً."
        : "تعذر تنفيذ التمويل حالياً. حاول مرة أخرى.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      <TouchableOpacity
        activeOpacity={0.82}
        disabled={isPending}
        onPress={handleFund}
        style={{
          minHeight: 46,
          borderRadius: 13,
          backgroundColor: isPending ? C.mutedForeground : C.navy,
          alignItems: "center",
          justifyContent: "center",
          flexDirection: "row-reverse",
          gap: 8,
          opacity: isPending ? 0.75 : 1,
        }}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Feather name="lock" size={17} color={C.gold} />}
        <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" }}>
          {isPending ? "جاري تأمين الدفعة..." : "تمويل هذه المرحلة"}
        </Text>
      </TouchableOpacity>
      {message ? (
        <Text style={{ marginTop: 7, textAlign: "right", color: C.mutedForeground, fontSize: 10, lineHeight: 16, fontFamily: "Inter_400Regular" }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "milestone_not_found": return "المرحلة غير موجودة.";
    case "forbidden": return "لا تملك صلاحية تمويل هذه المرحلة.";
    case "milestone_not_fundable": return "هذه المرحلة ليست في حالة تسمح بالتمويل.";
    case "idempotency_key_required": return "تعذر إنشاء مفتاح العملية الآمن.";
    case "idempotency_request_mismatch": return "يوجد تعارض مع عملية سابقة.";
    case "idempotency_request_in_progress": return "العملية السابقة ما زالت قيد المعالجة.";
    default: return "تعذر تنفيذ التمويل. لم يتم تعديل المبلغ من الواجهة.";
  }
}
