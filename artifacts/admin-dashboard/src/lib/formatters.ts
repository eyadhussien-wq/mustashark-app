export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-QA', {
    style: 'currency',
    currency: 'QAR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function translateCountry(country?: string | null) {
  if (!country) return "غير محدد";
  if (country.toLowerCase() === "qatar") return "قطر";
  if (country.toLowerCase() === "jordan") return "الأردن";
  return country;
}

export function translateStatus(status: string) {
  const map: Record<string, string> = {
    pending: "قيد الانتظار",
    scheduled: "مجدولة",
    completed: "مكتملة",
    cancelled: "ملغاة",
    active: "نشطة",
    suspended: "موقوفة",
    paid: "مدفوعة",
    unpaid: "غير مدفوعة",
    refunded: "مستردة"
  };
  return map[status.toLowerCase()] || status;
}

export function translateConsultationType(type: string) {
  const map: Record<string, string> = {
    written: "كتابية",
    call: "مكالمة هاتفية",
    video: "مكالمة فيديو",
    meeting: "اجتماع حضوري"
  };
  return map[type.toLowerCase()] || type;
}
