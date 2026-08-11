import type { DocumentKind, DocumentRole } from "@/components/DocumentActions";

export type DocumentPresentation = {
  title: string;
  icon: string;
  description: string;
  sensitive?: boolean;
};

export const DOCUMENT_PRESENTATION: Record<DocumentKind, DocumentPresentation> = {
  memo: { title: "المذكرة القانونية", icon: "file-text", description: "مذكرة رسمية معدة من المحامي لتقديمها أو مراجعتها.", },
  quote: { title: "عرض السعر", icon: "tag", description: "عرض أتعاب وشروط الخدمة مع مدة الصلاحية.", },
  agreement: { title: "اتفاقية الخدمات القانونية", icon: "edit-3", description: "الاتفاقية التي تؤكد نطاق الخدمة والتزامات الطرفين.", },
  payment_receipt: { title: "إيصال الدفع", icon: "credit-card", description: "إثبات مالي مرتبط بعملية الدفع داخل المنصة.", },
  milestone: { title: "تقرير دفعة المرحلة", icon: "flag", description: "سجل المرحلة والإثبات وقرار الإفراج.", },
  case_summary: { title: "ملخص القضية", icon: "briefcase", description: "ملخص منظم لمسار القضية وحالتها الحالية.", },
  handover: { title: "إثبات تسليم المستند", icon: "package", description: "إثبات التسليم المحلي واستلام المستندات.", },
  international_handover: { title: "إثبات التسليم الدولي", icon: "globe", description: "سجل الشحن والتتبع وإثبات الاستلام عبر الحدود.", },
  audit: { title: "سجل الإخطار والنشاط", icon: "shield", description: "تسلسل زمني لأحداث الإخطار والفتح والقراءة والإجراء.", },
  bank_proof: { title: "إثبات الحساب البنكي", icon: "landmark", description: "مستند بنكي حساس للتحقق من بيانات المحامي.", sensitive: true },
  identity: { title: "إثبات الهوية", icon: "user-check", description: "مستند هوية حساس يخضع لصلاحيات وصول خاصة.", sensitive: true },
};

export const ROLE_DOCUMENT_COPY: Record<DocumentRole, string> = {
  client: "المستندات المتاحة لك مرتبطة بخدماتك وقضاياك فقط.",
  lawyer: "المستندات المتاحة لك مرتبطة بعملك وملفات عملائك فقط.",
  admin: "تظهر للمشرف المستندات اللازمة للمراجعة والتدقيق وفق صلاحيات الإدارة.",
};

export function getDocumentPresentation(kind: DocumentKind) {
  return DOCUMENT_PRESENTATION[kind];
}
