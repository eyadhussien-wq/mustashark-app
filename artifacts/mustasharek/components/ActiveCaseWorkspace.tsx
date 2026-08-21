import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { FundMilestoneButton } from "@/components/FundMilestoneButton";
import { ReleaseMilestoneButton } from "@/components/ReleaseMilestoneButton";

const C = colors.light;

export type ActiveCaseRole = "client" | "lawyer";
type CaseStatus = "active" | "completed" | "closed" | string;
type MilestoneStatus = "awaiting_deposit" | "funded" | "in_progress" | "proof_submitted" | "under_review" | "released" | "disputed" | "paused" | "cancelled" | string;
type CaseMilestone = {
  id: string;
  title: string;
  stage: "stage_1" | "stage_2" | "stage_3" | string;
  percentage: string | number;
  amount: string | number;
  status: MilestoneStatus;
};
type CaseRecord = {
  id: string;
  agreementId: string;
  clientId: string;
  lawyerId: string;
  status: CaseStatus;
  completedAt?: string | null;
  closedAt?: string | null;
  updatedAt?: string | null;
  agreement?: {
    id: string;
    status: string;
    quote: {
      id: string;
      title: string;
      description?: string | null;
      totalAmount: string | number;
      currency: string;
      status: string;
      fundingMode?: string | null;
    };
    milestones: CaseMilestone[];
  };
  milestones: CaseMilestone[];
};

type TimelineItem = {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail: string;
  status: "done" | "current" | "upcoming";
};

const timeline: TimelineItem[] = [
  { icon: "file-text", title: "العرض والاتفاقية", detail: "تم قبول نطاق العمل والأتعاب.", status: "done" },
  { icon: "shield", title: "الوكالة والمستندات", detail: "المستندات الأساسية مكتملة وتحت المراجعة.", status: "done" },
  { icon: "briefcase", title: "تنفيذ القضية", detail: "المرحلة الحالية: إعداد ومتابعة الإجراءات القانونية.", status: "current" },
  { icon: "flag", title: "الإغلاق والتسوية", detail: "تُفعل عند اكتمال جميع مراحل العمل.", status: "upcoming" },
];

type LegalRepresentationDocumentStatus =
  | "uploaded"
  | "submitted"
  | "under_review"
  | "verified"
  | "rejected"
  | "superseded"
  | string;

type LegalRepresentationDocument = {
  id: string;
  documentType: "poa" | "court_proof" | "expert_report" | string;
  status: LegalRepresentationDocumentStatus;
  fileName: string;
  title: string;
  mimeType?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
};

const API_BASE = process.env.EXPO_PUBLIC_DOMAIN ? `https://${process.env.EXPO_PUBLIC_DOMAIN}/api` : "";

export function ActiveCaseWorkspace({ role, caseId, milestoneId }: { role: ActiveCaseRole; caseId?: string; milestoneId?: string }) {
  const isClient = role === "client";
  const { getAuthToken } = useAuth();
  const [caseRecord, setCaseRecord] = useState<CaseRecord | null>(null);
  const [documents, setDocuments] = useState<LegalRepresentationDocument[]>([]);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [documentError, setDocumentError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(caseId));
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDocuments = useCallback(async (agreementId: string) => {
    setDocumentsLoading(true);
    setDocumentError(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("جلسة الدخول غير متاحة");
      if (!API_BASE) throw new Error("خدمة المستندات غير مهيأة في هذه البيئة");

      const response = await fetch(
        `${API_BASE}/agreements/${encodeURIComponent(agreementId)}/legal-representation-documents`,
        {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        },
      );
      const payload = await response.json().catch(() => null) as {
        ok?: boolean;
        documents?: LegalRepresentationDocument[];
        error?: string;
      } | null;

      if (!response.ok || !payload?.ok || !Array.isArray(payload.documents)) {
        if (response.status === 403) throw new Error("ليس لديك صلاحية للوصول إلى مستندات هذه القضية");
        if (response.status === 404) throw new Error("الاتفاقية غير موجودة");
        throw new Error(payload?.error ?? "تعذر تحميل مستندات التمثيل القانوني");
      }

      setDocuments(payload.documents);
    } catch (loadError) {
      setDocumentError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      setDocumentsLoading(false);
    }
  }, [getAuthToken]);

  const loadCase = useCallback(async (showLoading: boolean) => {
    if (!caseId) {
      setCaseRecord(null);
      setDocuments([]);
      setIsLoading(false);
      setError("معرّف القضية غير موجود");
      return;
    }

    if (showLoading) {
      setIsLoading(true);
    } else {
      setIsRefreshing(true);
    }

    try {
      const token = await getAuthToken();
      if (!token) throw new Error("جلسة الدخول غير متاحة");
      if (!API_BASE) throw new Error("خدمة القضايا غير مهيأة في هذه البيئة");

      const response = await fetch(`${API_BASE}/cases/${encodeURIComponent(caseId)}`, {
        headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      });
      const payload = await response.json().catch(() => null) as { ok?: boolean; case?: CaseRecord; error?: string } | null;
      if (!response.ok || !payload?.ok || !payload.case) {
        if (response.status === 403) throw new Error("ليس لديك صلاحية للوصول إلى هذه القضية");
        if (response.status === 404) throw new Error("القضية غير موجودة");
        throw new Error(payload?.error ?? "تعذر تحميل بيانات القضية");
      }

      setCaseRecord(payload.case);
      void loadDocuments(payload.case.agreementId);
      setError(null);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : String(loadError));
    } finally {
      if (showLoading) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, [caseId, getAuthToken, loadDocuments]);

  useEffect(() => {
    void loadCase(true);
  }, [loadCase]);

  useFocusEffect(
    useCallback(() => {
      void loadCase(false);
      const refreshInterval = setInterval(() => {
        void loadCase(false);
      }, 15000);

      return () => clearInterval(refreshInterval);
    }, [loadCase]),
  );

  const statusLabel = caseRecord?.status === "active" ? "نشطة" : caseRecord?.status === "completed" ? "مكتملة" : caseRecord?.status === "closed" ? "مغلقة" : caseRecord?.status ?? "—";
  const milestones = caseRecord?.milestones ?? caseRecord?.agreement?.milestones ?? [];
  const quote = caseRecord?.agreement?.quote;
  const totalAmount = quote?.totalAmount ?? "—";
  const currency = quote?.currency ?? "QAR";
  const selectedMilestone = milestoneId ? milestones.find((milestone) => milestone.id === milestoneId) : null;

  if (isLoading) {
    return <View style={styles.centerState}><ActivityIndicator size="large" color={C.gold} /><Text style={styles.stateText}>جاري تحميل بيانات القضية…</Text></View>;
  }

  if (error || !caseRecord) {
    return <View style={styles.centerState}><Feather name="alert-circle" size={28} color={C.gold} /><Text style={styles.stateTitle}>تعذر تحميل القضية</Text><Text style={styles.stateText}>{error ?? "بيانات القضية غير متاحة"}</Text></View>;
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.caseBadge}><Feather name="briefcase" size={15} color={C.gold} /><Text style={styles.caseBadgeText}>قضية {statusLabel}</Text></View>
          <View style={styles.liveState}><View style={styles.liveDot} /><Text style={styles.liveText}>{isRefreshing ? "جاري المزامنة" : "مزامنة تلقائية"}</Text></View>
          <Text style={styles.kicker}>{isClient ? "مساحة العميل" : "مساحة المحامي"}</Text>
        </View>
        <Text style={styles.heroTitle}>القضية #{caseRecord.id}</Text>
        <Text style={styles.heroMeta}>{isClient ? `المحامي: ${caseRecord.lawyerId}` : `العميل: ${caseRecord.clientId}`} · الحالة: {statusLabel}</Text>
        <View style={styles.progressTrack}><View style={[styles.progressFill, caseRecord.status === "closed" && styles.closedProgress]} /></View>
        <Text style={styles.progressText}>الحالة التشغيلية: {statusLabel}</Text>
        {caseRecord.updatedAt ? <Text style={styles.updatedText}>آخر تحديث من الخادم: {new Date(caseRecord.updatedAt).toLocaleString()}</Text> : null}
      </View>

      <SectionTitle icon="activity" title="Timeline القضية" />
      <View style={styles.card}>
        {timeline.map((item, index) => (
          <View key={item.title} style={styles.timelineRow}>
            <View style={styles.timelineRail}>
              <View style={[styles.timelineIcon, item.status === "done" && styles.doneIcon, item.status === "current" && styles.currentIcon]}>
                <Feather name={item.icon} size={15} color={item.status === "upcoming" ? C.mutedForeground : item.status === "done" ? C.success : C.gold} />
              </View>
              {index < timeline.length - 1 && <View style={[styles.connector, item.status === "done" && styles.connectorDone]} />}
            </View>
            <View style={styles.timelineCopy}>
              <View style={styles.rowBetween}><Text style={styles.itemTitle}>{item.title}</Text><StatusPill status={item.status} /></View>
              <Text style={styles.itemText}>{item.detail}</Text>
            </View>
          </View>
        ))}
      </View>

      <SectionTitle icon="layers" title="Milestones ومراحل الأتعاب" />
      <View style={styles.card}>
        {milestones.map((item) => {
          const percent = Number(item.percentage);
          const amount = Number(item.amount);
          const isSelected = selectedMilestone?.id === item.id;
          return (
            <View key={item.id} style={styles.milestoneRow}>
              <View style={styles.rowBetween}><Text style={styles.amount}>{Number.isFinite(amount) ? `${amount.toLocaleString()} ${currency === "QAR" ? "ر.ق" : currency}` : `${item.amount} ${currency}`}</Text><Text style={styles.itemTitle}>{item.title}</Text></View>
              <View style={styles.milestoneTrack}><View style={[styles.milestoneFill, { width: `${Math.max(0, Math.min(100, percent || 0))}%` }, item.status !== "released" && item.status !== "cancelled" && styles.currentFill]} /></View>
              <View style={styles.rowBetween}><Text style={styles.itemText}>{Number.isFinite(percent) ? `${percent}% من الأتعاب` : `${item.percentage}% من الأتعاب`}</Text><Text style={styles.itemText}>{milestoneStatusLabel(item.status)}</Text></View>
              {isClient && (!milestoneId || isSelected) && item.status === "awaiting_deposit" ? <FundMilestoneButton milestoneId={item.id} /> : null}
              {isClient && (!milestoneId || isSelected) ? <ReleaseMilestoneButton milestoneId={item.id} /> : null}
            </View>
          );
        })}
        {milestones.length === 0 ? <Text style={styles.itemText}>لا توجد مراحل مالية مرتبطة بهذه القضية.</Text> : null}
      </View>

      <SectionTitle icon="credit-card" title="Payments" />
      <View style={styles.card}>
        <View style={styles.rowBetween}><Text style={styles.totalAmount}>{Number.isFinite(Number(totalAmount)) ? `${Number(totalAmount).toLocaleString()} ${currency === "QAR" ? "ر.ق" : currency}` : `${totalAmount} ${currency}`}</Text><Text style={styles.itemTitle}>إجمالي الأتعاب</Text></View>
        {milestones.map((item) => {
          const amount = Number(item.amount);
          return (
            <View key={`payment-${item.id}`} style={styles.paymentRow}>
              <Feather name={item.status === "released" ? "check-circle" : item.status === "awaiting_deposit" ? "lock" : "clock"} size={17} color={item.status === "released" ? C.success : item.status === "awaiting_deposit" ? C.mutedForeground : C.gold} />
              <Text style={styles.paymentText}>{Number.isFinite(amount) ? `${amount.toLocaleString()}` : item.amount} {currency === "QAR" ? "ر.ق" : currency} · {item.title} · {milestoneStatusLabel(item.status)}</Text>
            </View>
          );
        })}
      </View>

      <SectionTitle icon="folder" title="مستندات التمثيل القانوني" />
      <View style={styles.card}>
        {documentsLoading ? (
          <View style={styles.documentLoading}>
            <ActivityIndicator size="small" color={C.gold} />
            <Text style={styles.itemText}>جاري تحديث حالة المستندات…</Text>
          </View>
        ) : null}
        {documents.map((doc) => (
          <TouchableOpacity key={doc.id} style={styles.documentRow} activeOpacity={0.8}>
            <Feather name="chevron-left" size={17} color={C.mutedForeground} />
            <View style={styles.documentCopy}>
              <Text style={styles.itemTitle}>{doc.title}</Text>
              <Text style={styles.itemText}>{doc.fileName} · {legalDocumentStatusLabel(doc.status)}</Text>
            </View>
            <View style={styles.documentIcon}>
              <Feather name={legalDocumentIcon(doc.documentType)} size={16} color={C.gold} />
            </View>
          </TouchableOpacity>
        ))}
        {!documentsLoading && documents.length === 0 ? (
          <Text style={styles.itemText}>لا توجد مستندات تمثيل قانوني مرتبطة بهذه الاتفاقية.</Text>
        ) : null}
        {documentError ? <Text style={styles.documentError}>{documentError}</Text> : null}
      </View>

      <View style={styles.notice}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.noticeText}>بيانات القضية وQuote وMilestones تُعاد مزامنتها من Backend عبر GET /api/cases/:id عند فتح الشاشة وكل 15 ثانية، ومستندات التمثيل القانوني تُحدّث عبر الـ API المخصص مع JWT الحالي. لا يوجد منطق مالي أو Schema أو Migration جديد في الواجهة.</Text></View>
    </ScrollView>
  );
}

function milestoneStatusLabel(status: MilestoneStatus): string {
  switch (status) {
    case "awaiting_deposit": return "بانتظار الإيداع";
    case "funded": return "مموّلة";
    case "in_progress": return "قيد التنفيذ";
    case "proof_submitted": return "تم تقديم الإثبات";
    case "under_review": return "قيد المراجعة";
    case "released": return "مُفرج عنها";
    case "disputed": return "متنازع عليها";
    case "paused": return "متوقفة";
    case "cancelled": return "ملغاة";
    default: return status;
  }
}

function legalDocumentStatusLabel(status: LegalRepresentationDocumentStatus): string {
  switch (status) {
    case "uploaded": return "مرفوع";
    case "submitted": return "مُقدّم";
    case "under_review": return "قيد المراجعة";
    case "verified": return "معتمد";
    case "rejected": return "مرفوض";
    case "superseded": return "مستبدل";
    default: return status;
  }
}

function legalDocumentIcon(documentType: string): keyof typeof Feather.glyphMap {
  switch (documentType) {
    case "poa": return "file-text";
    case "court_proof": return "briefcase";
    case "expert_report": return "clipboard";
    default: return "paperclip";
  }
}

function SectionTitle({ icon, title }: { icon: keyof typeof Feather.glyphMap; title: string }) {
  return <View style={styles.sectionTitle}><Feather name={icon} size={16} color={C.gold} /><Text style={styles.sectionTitleText}>{title}</Text></View>;
}

function StatusPill({ status }: { status: TimelineItem["status"] }) {
  const label = status === "done" ? "مكتملة" : status === "current" ? "الحالية" : "قادمة";
  return <View style={[styles.pill, status === "done" && styles.donePill, status === "current" && styles.currentPill]}><Text style={styles.pillText}>{label}</Text></View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  content: { padding: 20, paddingTop: 58, paddingBottom: 110 },
  centerState: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: C.background, gap: 10 },
  stateTitle: { color: C.foreground, fontSize: 16, fontFamily: "Inter_700Bold", textAlign: "center" },
  stateText: { color: C.mutedForeground, fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "center" },
  hero: { backgroundColor: C.navy, borderRadius: 20, padding: 19, borderWidth: 1, borderColor: "rgba(201,160,53,.35)" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  caseBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(201,160,53,.12)", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  caseBadgeText: { color: C.gold, fontSize: 10, fontFamily: "Inter_700Bold" },
  liveState: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 7, paddingVertical: 5, borderRadius: 8, backgroundColor: "rgba(255,255,255,.08)" },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.success },
  liveText: { color: "rgba(255,255,255,.72)", fontSize: 8, fontFamily: "Inter_600SemiBold" },
  kicker: { color: "rgba(255,255,255,.65)", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  heroTitle: { color: "#fff", fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 13 },
  heroMeta: { color: "rgba(255,255,255,.68)", fontSize: 10, textAlign: "right", marginTop: 5, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,.12)", borderRadius: 8, marginTop: 16, overflow: "hidden" },
  progressFill: { width: "100%", height: "100%", backgroundColor: C.gold, borderRadius: 8 },
  closedProgress: { backgroundColor: C.success },
  progressText: { color: C.gold, fontSize: 10, textAlign: "right", marginTop: 7, fontFamily: "Inter_600SemiBold" },
  updatedText: { color: "rgba(255,255,255,.5)", fontSize: 8, textAlign: "right", marginTop: 4, fontFamily: "Inter_400Regular" },
  sectionTitle: { flexDirection: "row-reverse", alignItems: "center", gap: 7, marginTop: 20, marginBottom: 9 },
  sectionTitleText: { color: C.foreground, fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "right" },
  card: { backgroundColor: C.card, borderRadius: 15, borderWidth: 1, borderColor: C.border, padding: 14 },
  timelineRow: { flexDirection: "row-reverse", minHeight: 74 },
  timelineRail: { width: 38, alignItems: "center" },
  timelineIcon: { width: 31, height: 31, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.border + "40", borderWidth: 1, borderColor: C.border },
  doneIcon: { backgroundColor: "#ECFDF5", borderColor: "#BBF7D0" },
  currentIcon: { backgroundColor: "rgba(201,160,53,.12)", borderColor: "rgba(201,160,53,.35)" },
  connector: { flex: 1, width: 1, backgroundColor: C.border, marginVertical: 4 },
  connectorDone: { backgroundColor: C.gold },
  timelineCopy: { flex: 1, paddingBottom: 12, paddingRight: 7 },
  rowBetween: { flexDirection: "row-reverse", justifyContent: "space-between", alignItems: "center", gap: 8 },
  itemTitle: { color: C.foreground, fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right", flex: 1 },
  itemText: { color: C.mutedForeground, fontSize: 10, lineHeight: 17, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  pill: { paddingHorizontal: 7, paddingVertical: 4, borderRadius: 8, backgroundColor: C.border + "50" },
  donePill: { backgroundColor: "#ECFDF5" },
  currentPill: { backgroundColor: "rgba(201,160,53,.12)" },
  pillText: { color: C.mutedForeground, fontSize: 9, fontFamily: "Inter_600SemiBold" },
  milestoneRow: { paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  amount: { color: C.navy, fontSize: 11, fontFamily: "Inter_700Bold" },
  milestoneTrack: { height: 7, backgroundColor: C.border + "60", borderRadius: 8, overflow: "hidden", marginTop: 9 },
  milestoneFill: { height: "100%", backgroundColor: C.success, borderRadius: 8 },
  currentFill: { backgroundColor: C.gold },
  totalAmount: { color: C.navy, fontSize: 17, fontFamily: "Inter_700Bold" },
  paymentRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8, paddingTop: 12 },
  paymentText: { flex: 1, color: C.foreground, fontSize: 10, textAlign: "right", fontFamily: "Inter_500Medium" },
  documentRow: { flexDirection: "row", alignItems: "center", gap: 9, paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: C.border },
  documentCopy: { flex: 1 },
  documentLoading: { alignItems: "center", paddingVertical: 8, gap: 4 },
  documentError: { color: "#B91C1C", fontSize: 10, lineHeight: 17, textAlign: "right", fontFamily: "Inter_400Regular", marginTop: 8 },
  documentIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: "rgba(201,160,53,.1)", alignItems: "center", justifyContent: "center" },
  notice: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, padding: 12, marginTop: 14, borderRadius: 13, backgroundColor: "#FFFCF3", borderWidth: 1, borderColor: "rgba(201,160,53,.25)" },
  noticeText: { flex: 1, color: C.mutedForeground, fontSize: 10, lineHeight: 17, textAlign: "right", fontFamily: "Inter_400Regular" },
});
