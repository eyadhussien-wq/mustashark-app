import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import { getReleaseRequestForMilestone, releaseMilestone } from "@/lib/releaseFinance";
import colors from "@/constants/colors";

const C = colors.light;

type Props = { milestoneId?: string };

export function ReleaseMilestoneButton({ milestoneId }: Props) {
  const { getAuthToken } = useAuth();
  const [releaseRequestId, setReleaseRequestId] = useState<string | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (!milestoneId) {
      setLoadingRequest(false);
      return () => { active = false; };
    }
    setLoadingRequest(true);
    getReleaseRequestForMilestone(getAuthToken, milestoneId)
      .then((result) => {
        if (!active) return;
        setReleaseRequestId(result.ok ? result.releaseRequest.id : null);
        if (!result.ok && result.error !== "release_request_not_found") setMessage(errorMessage(result.error));
      })
      .catch(() => {
        if (active) setMessage("تعذر التحقق من طلب الإفراج حالياً.");
      })
      .finally(() => active && setLoadingRequest(false));
    return () => { active = false; };
  }, [getAuthToken, milestoneId]);

  if (!milestoneId || loadingRequest || !releaseRequestId) return null;

  const handleRelease = async () => {
    if (isPending || !releaseRequestId) return;
    setIsPending(true);
    setMessage(null);
    try {
      const result = await releaseMilestone(getAuthToken, releaseRequestId);
      if (result.ok) setMessage("تم الإفراج عن المرحلة بنجاح.");
      else setMessage(errorMessage(result.error));
    } catch (error) {
      setMessage(error instanceof Error && error.message === "authentication_required"
        ? "انتهت جلسة الدخول. يرجى تسجيل الدخول مجدداً."
        : "تعذر تنفيذ الإفراج حالياً. حاول مرة أخرى.");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <View style={{ marginTop: 10 }}>
      <TouchableOpacity
        activeOpacity={0.82}
        disabled={isPending}
        onPress={handleRelease}
        style={{ minHeight: 46, borderRadius: 13, backgroundColor: isPending ? C.mutedForeground : C.navy, alignItems: "center", justifyContent: "center", flexDirection: "row-reverse", gap: 8, opacity: isPending ? 0.75 : 1 }}
      >
        {isPending ? <ActivityIndicator color="#fff" /> : <Feather name="check-circle" size={17} color={C.gold} />}
        <Text style={{ color: "#fff", fontSize: 12, fontFamily: "Inter_700Bold" }}>
          {isPending ? "جاري تنفيذ الإفراج..." : "الإفراج عن هذه المرحلة"}
        </Text>
      </TouchableOpacity>
      {message ? <Text style={{ marginTop: 7, textAlign: "right", color: C.mutedForeground, fontSize: 10, lineHeight: 16, fontFamily: "Inter_400Regular" }}>{message}</Text> : null}
    </View>
  );
}

function errorMessage(code: string): string {
  switch (code) {
    case "milestone_not_found": return "المرحلة غير موجودة.";
    case "release_request_not_found": return "لا يوجد طلب إفراج جاهز لهذه المرحلة.";
    case "forbidden": return "لا تملك صلاحية تنفيذ الإفراج.";
    case "milestone_not_releasable": return "هذه المرحلة ليست في حالة تسمح بالإفراج.";
    case "escrow_release_balance_failed": return "الرصيد المحتجز غير كافٍ للإفراج.";
    case "commission_tier_not_found": return "تعذر تحديد عمولة المنصة.";
    case "lawyer_wallet_not_found": return "محفظة المحامي غير متاحة حالياً.";
    case "idempotency_request_mismatch": return "يوجد تعارض مع عملية مالية سابقة.";
    default: return "تعذر تنفيذ الإفراج المالي حالياً.";
  }
}
