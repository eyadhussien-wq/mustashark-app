import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Linking,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { useData } from "@/contexts/DataContext";
import { getCurrency } from "@/utils/currency";

const C = colors.light;
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get("window");

const TYPE_META: Record<string, { label: string; icon: string; color: string }> = {
  video: { label: "مكالمة فيديو",   icon: "video",          color: "#7C3AED" },
  phone: { label: "مكالمة هاتفية",  icon: "phone",          color: "#2563EB" },
  chat:  { label: "محادثة نصية",    icon: "message-square", color: "#059669" },
};

const STATUS_CONFIG = {
  pending:   { label: "معلّق",  color: C.warning,     bg: "#FEF3C7", icon: "clock" },
  accepted:  { label: "مقبول",  color: C.success,     bg: "#ECFDF5", icon: "check-circle" },
  rejected:  { label: "مرفوض", color: C.destructive,  bg: "#FEE2E2", icon: "x-circle" },
  completed: { label: "مكتمل", color: C.primary,      bg: "#EEF2F8", icon: "check" },
  cancelled_by_lawyer: { label: "ملغية (محامي)", color: C.destructive, bg: "#FEE2E2", icon: "x-octagon" },
  cancelled_by_client: { label: "ملغية (عميل)", color: C.destructive, bg: "#FEE2E2", icon: "x-octagon" },
  no_show_lawyer: { label: "تأخر المحامي", color: C.destructive, bg: "#FEE2E2", icon: "alert-triangle" },
  no_show_client: { label: "غياب العميل", color: C.warning, bg: "#FEF3C7", icon: "user-x" },
  disputed: { label: "نزاع", color: "#7C3AED", bg: "#EDE9FE", icon: "alert-circle" },
  refunded_absent: { label: "مسترد (غياب)", color: "#0369A1", bg: "#E0F2FE", icon: "shield" },
};

function getFileExt(name: string) {
  return (name.split(".").pop() ?? "").toUpperCase();
}
function isImageFile(name: string) {
  return ["JPG", "JPEG", "PNG", "WEBP", "GIF"].includes(getFileExt(name));
}
function getFileColor(name: string) {
  const ext = getFileExt(name);
  if (["JPG", "JPEG", "PNG", "WEBP"].includes(ext)) return { bg: "rgba(201,160,53,0.12)", color: C.gold };
  if (ext === "PDF") return { bg: "rgba(220,38,38,0.1)", color: "#DC2626" };
  return { bg: "#EEF2F8", color: C.navy };
}

// ── PDF HTML builder ──────────────────────────────────────────────────────────
function buildPdfHtml(consult: ReturnType<typeof useData>["consultations"][0]) {
  const typeLabels: Record<string, string> = { video: "مكالمة فيديو", phone: "مكالمة هاتفية", chat: "محادثة نصية" };
  const statusLabels: Record<string, string> = { pending: "معلّق", accepted: "مقبول", rejected: "مرفوض", completed: "مكتمل" };
  const country = consult.lawyerCountry === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن";
  const currency = consult.lawyerCountry === "qatar" ? "ريال قطري" : "دينار أردني";
  const attachmentRows = (consult.attachments ?? [])
    .map((a) => `<tr><td style="padding:6px 12px;border-bottom:1px solid #eee;direction:rtl">${a.name}</td></tr>`)
    .join("") || `<tr><td style="padding:6px 12px;color:#888;direction:rtl">لا توجد مرفقات</td></tr>`;

  return `<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700&display=swap');
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Tajawal',Arial,sans-serif;background:#f9fafb;color:#1a2a4a;direction:rtl}
  .page{max-width:760px;margin:0 auto;background:#fff;padding:40px;border-radius:12px}
  .header{background:#1a2a4a;color:#fff;padding:28px 32px;border-radius:10px;margin-bottom:28px;display:flex;justify-content:space-between;align-items:center}
  .header-left h1{font-size:26px;font-weight:700;margin-bottom:4px}
  .header-left p{font-size:13px;opacity:0.7}
  .serial{background:rgba(201,160,53,0.2);border:1px solid rgba(201,160,53,0.5);color:#c9a035;padding:8px 16px;border-radius:20px;font-size:14px;font-weight:700;text-align:center}
  .section{margin-bottom:22px;border:1px solid #e5e7eb;border-radius:10px;overflow:hidden}
  .section-title{background:#f8f9fc;padding:10px 16px;font-weight:700;font-size:13px;color:#1a2a4a;border-bottom:1px solid #e5e7eb}
  .section-body{padding:16px}
  .row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #f3f4f6}
  .row:last-child{border-bottom:none}
  .label{color:#6b7280;font-size:13px}
  .value{font-weight:600;font-size:13px;color:#1a2a4a}
  .status-badge{display:inline-block;padding:4px 14px;border-radius:20px;font-size:12px;font-weight:700}
  .desc{font-size:14px;line-height:1.8;color:#374151}
  .footer{margin-top:32px;text-align:center;color:#9ca3af;font-size:11px;border-top:1px solid #e5e7eb;padding-top:16px}
  table{width:100%;border-collapse:collapse}
  .paid{background:#ecfdf5;color:#059669}
  .unpaid{background:#fef3c7;color:#d97706}
</style>
</head>
<body>
<div class="page">
  <div class="header">
    <div class="header-left">
      <h1>مستشارك — وثيقة الاستشارة</h1>
      <p>منصة الاستشارات القانونية في قطر والأردن</p>
    </div>
    <div class="serial">${consult.serialNumber ?? consult.id}</div>
  </div>

  <div class="section">
    <div class="section-title">بيانات الاستشارة</div>
    <div class="section-body">
      <div class="row"><span class="label">الرقم التسلسلي</span><span class="value">${consult.serialNumber ?? consult.id}</span></div>
      <div class="row"><span class="label">العميل</span><span class="value">${consult.clientName}</span></div>
      <div class="row"><span class="label">المحامي</span><span class="value">${consult.lawyerName}</span></div>
      <div class="row"><span class="label">التخصص</span><span class="value">${consult.lawyerSpecialization}</span></div>
      <div class="row"><span class="label">الدولة</span><span class="value">${country}</span></div>
      <div class="row"><span class="label">نوع الاستشارة</span><span class="value">${typeLabels[consult.type] ?? consult.type}</span></div>
      <div class="row"><span class="label">التاريخ والوقت</span><span class="value">${consult.date} — ${consult.time}</span></div>
      <div class="row">
        <span class="label">الحالة</span>
        <span class="status-badge" style="background:#ecfdf5;color:#059669">${statusLabels[consult.status] ?? consult.status}</span>
      </div>
    </div>
  </div>

  <div class="section">
    <div class="section-title">موضوع القضية</div>
    <div class="section-body"><p class="desc" style="font-weight:700">${consult.subject}</p></div>
  </div>

  <div class="section">
    <div class="section-title">تفاصيل القضية</div>
    <div class="section-body"><p class="desc">${consult.description}</p></div>
  </div>

  <div class="section">
    <div class="section-title">المرفقات والمستندات</div>
    <table>${attachmentRows}</table>
  </div>

  <div class="section">
    <div class="section-title">حالة الدفع</div>
    <div class="section-body">
      <div class="row">
        <span class="label">الحالة</span>
        <span class="status-badge ${consult.paymentStatus === "paid" ? "paid" : "unpaid"}">
          ${consult.paymentStatus === "paid" ? "✓ مدفوع بالكامل" : "في انتظار الدفع"}
        </span>
      </div>
      <div class="row">
        <span class="label">المبلغ</span>
        <span class="value" style="font-size:18px;color:#1a2a4a">${consult.price} ${currency}</span>
      </div>
    </div>
  </div>

  ${consult.rating ? `
  <div class="section">
    <div class="section-title">تقييم العميل</div>
    <div class="section-body">
      <div class="row"><span class="label">التقييم</span><span class="value">${"⭐".repeat(consult.rating.stars)} (${consult.rating.stars}/5)</span></div>
      ${consult.rating.comment ? `<div class="row"><span class="label">التعليق</span><span class="value">${consult.rating.comment}</span></div>` : ""}
    </div>
  </div>` : ""}

  <div class="footer">
    تم توليد هذه الوثيقة تلقائياً من منصة مستشارك • ${new Date().toLocaleDateString("ar-QA")}
  </div>
</div>
</body>
</html>`;
}

export default function ConsultationDetail() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const {
    consultations,
    updateConsultationStatus,
    cancelConsultation,
    markNoShow,
    raiseDispute,
    recordAttendance,
    checkLawyerAbsence,
  } = useData();
  const [loading, setLoading] = useState<"accept" | "reject" | "complete" | "pdf" | "cancel" | "noShow" | "dispute" | "join" | "absenceCheck" | null>(null);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewName, setPreviewName] = useState<string>("");
  const [disputeModal, setDisputeModal] = useState(false);
  const [disputeReason, setDisputeReason] = useState("");
  const [joinCountdown, setJoinCountdown] = useState("");
  const [absenceSecondsLeft, setAbsenceSecondsLeft] = useState<number | null>(null);

  const consult = useMemo(
    () => consultations.find((c) => c.id === id),
    [consultations, id]
  );

  if (!consult) {
    return (
      <View style={styles.notFound}>
        <Feather name="alert-circle" size={40} color={C.border} />
        <Text style={styles.notFoundText}>الاستشارة غير موجودة</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>العودة</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isLawyer = user?.role === "lawyer";
  const statusCfg = STATUS_CONFIG[consult.status];
  const typeMeta = TYPE_META[consult.type] ?? TYPE_META.video;
  const currency = getCurrency(consult.lawyerCountry ?? "qatar");
  const attachments = consult.attachments ?? [];

  // ── Meeting window logic ──
  const meetingWindow = useMemo(() => {
    const appt = new Date(`${consult.date}T${consult.time}`);
    const now = new Date();
    const slotDuration = 30; // minutes
    const earlyOpen = 5 * 60 * 1000; // 5 min before
    const openAt = new Date(appt.getTime() - earlyOpen);
    const closeAt = new Date(appt.getTime() + slotDuration * 60 * 1000);
    const canJoin = now >= openAt && now <= closeAt;
    const minsUntil = Math.max(0, Math.ceil((openAt.getTime() - now.getTime()) / (60 * 1000)));
    const minsRemaining = Math.max(0, Math.ceil((closeAt.getTime() - now.getTime()) / (60 * 1000)));
    return { canJoin, openAt, closeAt, minsUntil, minsRemaining, slotDuration };
  }, [consult.date, consult.time]);

  // Countdown tick — every second for precision
  useEffect(() => {
    if (consult.status !== "accepted" || !consult.meetLink) return;

    const ABSENCE_WINDOW_MS = 15 * 60 * 1000;

    const tick = () => {
      const appt = new Date(`${consult.date}T${consult.time}`);
      const now = new Date();
      const earlyOpen = 5 * 60 * 1000;
      const openAt = new Date(appt.getTime() - earlyOpen);
      const closeAt = new Date(appt.getTime() + 30 * 60 * 1000);

      const canJoinNow = now >= openAt && now <= closeAt;
      const secsUntilOpen = Math.max(0, Math.ceil((openAt.getTime() - now.getTime()) / 1000));
      const minsRemaining = Math.max(0, Math.ceil((closeAt.getTime() - now.getTime()) / (60 * 1000)));

      if (canJoinNow) {
        setJoinCountdown(`ينتهي بعد ${minsRemaining} دقيقة`);
      } else if (secsUntilOpen > 0) {
        const m = Math.floor(secsUntilOpen / 60);
        const s = secsUntilOpen % 60;
        setJoinCountdown(m > 0 ? `تفتح بعد ${m}:${String(s).padStart(2, "0")}` : `تفتح بعد ${s} ثانية`);
      } else {
        setJoinCountdown("");
      }

      // 15-min absence countdown (shown to client when lawyer hasn't joined)
      if (consult.clientJoinedAt && !consult.lawyerJoinedAt) {
        const elapsed = now.getTime() - appt.getTime();
        const secsLeft = Math.max(0, Math.ceil((ABSENCE_WINDOW_MS - elapsed) / 1000));
        setAbsenceSecondsLeft(secsLeft);
      } else {
        setAbsenceSecondsLeft(null);
      }
    };

    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [consult.status, consult.meetLink, consult.clientJoinedAt, consult.lawyerJoinedAt, consult.date, consult.time]);

  // ── Join Meeting ──
  async function handleJoinMeeting() {
    if (!consult || !consult.meetLink) return;
    setLoading("join");
    const role = isLawyer ? "lawyer" : "client";
    await recordAttendance(consult.id, user.id, role);
    setLoading(null);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const supported = await Linking.canOpenURL(consult.meetLink);
    if (supported) {
      await Linking.openURL(consult.meetLink);
    } else {
      Alert.alert("لا يمكن فتح الرابط", `الرابط: ${consult.meetLink}`);
    }
  }

  // ── Auto-absence check (15-min rule) ──
  async function handleCheckAbsence() {
    if (!consult) return;
    setLoading("absenceCheck");
    try {
      const result = await checkLawyerAbsence(consult.id);
      if (result.refunded) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        Alert.alert(
          "تم الاسترداد التلقائي",
          `لم يحضر المحامي خلال 15 دقيقة من الموعد.\n\nتم استرداد ${result.refundAmount} ${currency} بالكامل إلى محفظتك.\n\nسيتم إخطار الإدارة بهذا الحادث.`,
          [{ text: "حسناً" }],
        );
      } else {
        Alert.alert(
          "لم تنتهِ مهلة الانتظار بعد",
          "لا يزال بإمكان المحامي الانضمام ضمن النافذة الزمنية المسموحة (15 دقيقة).",
        );
      }
    } finally {
      setLoading(null);
    }
  }

  function openPreview(item: { name: string; uri: string }) {
    setPreviewName(item.name);
    setPreviewUri(item.uri);
  }

  async function handleExportPdf() {
    setLoading("pdf");
    try {
      const html = buildPdfHtml(consult!);
      if (Platform.OS === "web") {
        // Open print dialog in browser
        const win = window.open("", "_blank");
        if (win) {
          win.document.write(html);
          win.document.close();
          win.focus();
          win.print();
        }
      } else {
        const { uri } = await Print.printToFileAsync({ html, base64: false });
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/pdf",
            dialogTitle: `استشارة ${consult!.serialNumber ?? consult!.id}`,
          });
        } else {
          Alert.alert("تصدير PDF", `تم حفظ الملف في:\n${uri}`);
        }
      }
    } catch {
      Alert.alert("خطأ", "تعذّر تصدير ملف PDF. حاول مجدداً.");
    } finally {
      setLoading(null);
    }
  }

  async function handleAccept() {
    setLoading("accept");
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await updateConsultationStatus(consult!.id, "accepted");
    setLoading(null);
    Alert.alert("تم القبول ✓", "تم قبول طلب الاستشارة.", [{ text: "حسناً" }]);
  }

  async function handleReject() {
    setLoading("reject");
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await updateConsultationStatus(consult!.id, "rejected");
    setLoading(null);
    router.back();
  }

  async function handleComplete() {
    setLoading("complete");
    await updateConsultationStatus(consult!.id, "completed");
    setLoading(null);
    Alert.alert("تم الإكمال ✓", "تم تحديد الاستشارة كمكتملة.", [{ text: "حسناً" }]);
  }

  // ── Cancel ──
  async function handleCancel() {
    if (!user) return;
    const role = user.role === "lawyer" ? "lawyer" : "client";
    const apptDate = new Date(`${consult!.date}T${consult!.time}`);
    const hoursUntil = (apptDate.getTime() - Date.now()) / (1000 * 60 * 60);

    if (role === "client" && hoursUntil < 24) {
      Alert.alert(
        "إلغاء الاستشارة",
        "أنت على وشك إلغاء الاستشارة قبل أقل من 24 ساعة. سيتم مصادرة المبلغ بالكامل دون استرجاع. هل أنت متأكد؟",
        [
          { text: "لا", style: "cancel" },
          {
            text: "نعم، إلغاء",
            style: "destructive",
            onPress: async () => {
              setLoading("cancel");
              const result = await cancelConsultation(consult!.id, "client");
              setLoading(null);
              Alert.alert(
                result.refundedToClient ? "تم الإلغاء والاسترجاع" : "تم الإلغاء",
                result.refundedToClient
                  ? `تم إلغاء الاستشارة واسترجاع ${result.refundAmount} ${currency} إلى محفظتك.`
                  : "تم إلغاء الاستشارة. لقد تجاوزت المدة المسموحة للاسترجاع (24 ساعة)."
              );
            },
          },
        ]
      );
      return;
    }

    setLoading("cancel");
    const result = await cancelConsultation(consult!.id, role);
    setLoading(null);
    Alert.alert(
      result.refundedToClient ? "تم الإلغاء والاسترجاع" : "تم الإلغاء",
      result.refundedToClient
        ? `تم إلغاء الاستشارة واسترجاع ${result.refundAmount} ${currency} إلى محفظتك.`
        : "تم إلغاء الاستشارة."
    );
  }

  // ── No-Show ──
  async function handleNoShow() {
    if (!user) return;
    const role = user.role === "lawyer" ? "lawyer" : "client";
    const otherRole = role === "lawyer" ? "العميل" : "المحامي";

    Alert.alert(
      `تأخر ${otherRole} عن الموعد`,
      `هل تريد الإبلاغ عن ${otherRole} بأنه لم يحضر الموعد؟`,
      [
        { text: "لا", style: "cancel" },
        {
          text: "نعم، الإبلاغ",
          style: "destructive",
          onPress: async () => {
            setLoading("noShow");
            await markNoShow(consult!.id, role === "lawyer" ? "lawyer" : "client");
            setLoading(null);
            if (role === "client") {
              Alert.alert("تم الإبلاغ", "تم الإبلاغ عن تأخر المحامي. سيتم استرجاع المبلغ لمحفظتك.");
            } else {
              Alert.alert("تم الإبلاغ", "تم الإبلاغ عن غياب العميل. المبلغ سيتم إضافته لرصيدك.");
            }
          },
        },
      ]
    );
  }

  // ── Dispute ──
  async function handleRaiseDispute() {
    if (!disputeReason.trim()) {
      Alert.alert("السبب مطلوب", "يرجى كتابة سبب النزاع.");
      return;
    }
    setLoading("dispute");
    await raiseDispute(consult!.id, disputeReason.trim());
    setLoading(null);
    setDisputeModal(false);
    setDisputeReason("");
    Alert.alert("تم رفع النزاع", "سيتم مراجعة النزاع من قبل فريق المنصة خلال 48 ساعة.");
  }

  return (
    <>
      <ScrollView
        style={{ flex: 1, backgroundColor: C.background }}
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 0),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 40 : 36),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={C.foreground} />
          </TouchableOpacity>
          <Text style={styles.pageTitle}>ملف الاستشارة</Text>
          <View style={styles.topBarRight}>
            <View style={[styles.statusPill, { backgroundColor: statusCfg.bg }]}>
              <Feather name={statusCfg.icon as any} size={12} color={statusCfg.color} />
              <Text style={[styles.statusText, { color: statusCfg.color }]}>{statusCfg.label}</Text>
            </View>
          </View>
        </View>

        {/* Serial number banner */}
        <View style={styles.serialBanner}>
          <View style={styles.serialLeft}>
            <Feather name="hash" size={13} color={C.gold} />
            <Text style={styles.serialNumber}>{consult.serialNumber ?? consult.id}</Text>
          </View>
          <TouchableOpacity
            style={[styles.pdfBtn, loading === "pdf" && { opacity: 0.65 }]}
            onPress={handleExportPdf}
            disabled={loading === "pdf"}
            activeOpacity={0.8}
          >
            {loading === "pdf"
              ? <ActivityIndicator size="small" color={C.navy} />
              : <>
                  <Feather name="download" size={13} color={C.navy} />
                  <Text style={styles.pdfBtnText}>تصدير PDF</Text>
                </>
            }
          </TouchableOpacity>
        </View>

        {/* Hero */}
        <View style={styles.heroCard}>
          <View style={styles.heroAvatar}>
            <Text style={styles.heroAvatarText}>
              {(isLawyer ? consult.clientName : consult.lawyerName).charAt(0)}
            </Text>
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.heroName}>
              {isLawyer ? consult.clientName : consult.lawyerName}
            </Text>
            <Text style={styles.heroRole}>
              {isLawyer ? "العميل" : consult.lawyerSpecialization}
            </Text>
            <Text style={styles.heroDate}>{consult.date} — {consult.time}</Text>
          </View>
          <View style={[styles.typeTagOuter, { backgroundColor: typeMeta.color + "18" }]}>
            <Feather name={typeMeta.icon as any} size={18} color={typeMeta.color} />
          </View>
        </View>

        {/* Meeting Card (video/phone only) */}
        {(consult.type === "video" || consult.type === "phone") && consult.meetLink && (
          <View style={styles.meetCard}>
            <View style={styles.meetHeader}>
              <Feather name="video" size={18} color="#7C3AED" />
              <Text style={styles.meetTitle}>
                {consult.type === "video" ? "مكالمة فيديو (Google Meet)" : "مكالمة صوتية (Google Meet)"}
              </Text>
            </View>
            <Text style={styles.meetLink}>{consult.meetLink}</Text>
            {consult.status === "accepted" && (
              <>
                {meetingWindow.canJoin ? (
                  <TouchableOpacity
                    style={[styles.joinBtn, loading === "join" && { opacity: 0.65 }]}
                    onPress={handleJoinMeeting}
                    disabled={!!loading}
                    activeOpacity={0.85}
                  >
                    {loading === "join" ? (
                      <ActivityIndicator color="#fff" size="small" />
                    ) : (
                      <>
                        <Feather name="log-in" size={18} color="#fff" />
                        <Text style={styles.joinBtnText}>الدخول للمكالمة الآن</Text>
                      </>
                    )}
                  </TouchableOpacity>
                ) : (
                  <View style={styles.joinDisabled}>
                    <Feather name="clock" size={16} color={C.mutedForeground} />
                    <Text style={styles.joinDisabledText}>
                      {joinCountdown || "يتم تفعيل الرابط قبيل 5 دقائق من الموعد"}
                    </Text>
                  </View>
                )}
              </>
            )}
            {/* Attendance badges */}
            <View style={styles.attendanceRow}>
              {consult.lawyerJoinedAt && (
                <View style={[styles.attBadge, { backgroundColor: "#ECFDF5" }]}>
                  <Feather name="check-circle" size={12} color={C.success} />
                  <Text style={[styles.attText, { color: C.success }]}>
                    المحامي داخل {new Date(consult.lawyerJoinedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              )}
              {consult.clientJoinedAt && (
                <View style={[styles.attBadge, { backgroundColor: "#ECFDF5" }]}>
                  <Feather name="check-circle" size={12} color={C.success} />
                  <Text style={[styles.attText, { color: C.success }]}>
                    العميل داخل {new Date(consult.clientJoinedAt).toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                  </Text>
                </View>
              )}
              {!consult.lawyerJoinedAt && !consult.clientJoinedAt && consult.status === "accepted" && (
                <View style={[styles.attBadge, { backgroundColor: "#FEF3C7" }]}>
                  <Feather name="clock" size={12} color={C.warning} />
                  <Text style={[styles.attText, { color: C.warning }]}>لم يبدأ الحضور بعد</Text>
                </View>
              )}
            </View>

            {/* 15-min absence alert — shown to client when they've joined but lawyer hasn't */}
            {!isLawyer && consult.clientJoinedAt && !consult.lawyerJoinedAt && consult.status === "accepted" && (
              <View style={styles.absencePanel}>
                <View style={styles.absencePanelHeader}>
                  <Feather name="alert-triangle" size={15} color="#B45309" />
                  <Text style={styles.absencePanelTitle}>المحامي لم يصل بعد</Text>
                </View>
                {absenceSecondsLeft !== null && absenceSecondsLeft > 0 ? (
                  <Text style={styles.absenceCountdown}>
                    {`سيتم الاسترداد التلقائي خلال ${Math.floor(absenceSecondsLeft / 60)}:${String(absenceSecondsLeft % 60).padStart(2, "0")}`}
                  </Text>
                ) : (
                  <Text style={styles.absenceCountdownReady}>
                    انتهت مهلة الانتظار — يمكنك المطالبة بالاسترداد الآن
                  </Text>
                )}
                <TouchableOpacity
                  style={[
                    styles.absenceBtn,
                    (loading === "absenceCheck" || (absenceSecondsLeft ?? 1) > 0) && { opacity: 0.55 },
                  ]}
                  onPress={handleCheckAbsence}
                  disabled={!!loading || (absenceSecondsLeft ?? 1) > 0}
                  activeOpacity={0.8}
                >
                  {loading === "absenceCheck" ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <>
                      <Feather name="shield" size={15} color="#fff" />
                      <Text style={styles.absenceBtnText}>استرداد تلقائي — غياب المحامي</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* Section 1 */}
        <SectionCard title="نوع الاستشارة / القضية" icon="briefcase">
          <View style={styles.caseTypeRow}>
            <View style={[styles.caseTypeIcon, { backgroundColor: typeMeta.color + "15" }]}>
              <Feather name={typeMeta.icon as any} size={16} color={typeMeta.color} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.caseTypeLabel}>{typeMeta.label}</Text>
              <Text style={styles.caseTypeSpec}>{consult.lawyerSpecialization}</Text>
            </View>
            <View style={styles.countryTag}>
              <Text style={styles.countryFlag}>
                {consult.lawyerCountry === "qatar" ? "🇶🇦" : "🇯🇴"}
              </Text>
              <Text style={styles.countryLabel}>
                {consult.lawyerCountry === "qatar" ? "قطر" : "الأردن"}
              </Text>
            </View>
          </View>
        </SectionCard>

        {/* Section 2 */}
        <SectionCard title="الموضوع" icon="file-text">
          <Text style={styles.subjectText}>{consult.subject}</Text>
        </SectionCard>

        {/* Section 3 */}
        <SectionCard title="تفاصيل ومحتوى القضية" icon="align-right">
          <Text style={styles.descriptionText}>{consult.description}</Text>
        </SectionCard>

        {/* Section 4 */}
        <SectionCard
          title="المرفقات والمستندات"
          icon="paperclip"
          badge={attachments.length > 0 ? attachments.length.toString() : undefined}
        >
          {attachments.length === 0 ? (
            <View style={styles.noAttach}>
              <Feather name="paperclip" size={26} color={C.border} />
              <Text style={styles.noAttachText}>لم يرفق العميل أي مستندات</Text>
            </View>
          ) : (
            <View style={styles.attachGrid}>
              {attachments.map((item, i) => {
                const { bg, color } = getFileColor(item.name);
                const ext = getFileExt(item.name);
                const isImg = isImageFile(item.name);
                return (
                  <TouchableOpacity
                    key={i}
                    style={styles.attachThumb}
                    onPress={() => openPreview(item)}
                    activeOpacity={0.75}
                  >
                    {isImg && item.uri ? (
                      <View style={styles.attachImgWrap}>
                        <Image source={{ uri: item.uri }} style={styles.attachImgThumb} resizeMode="cover" />
                        <View style={styles.attachImgOverlay}>
                          <Feather name="zoom-in" size={16} color="#fff" />
                        </View>
                      </View>
                    ) : (
                      <View style={[styles.attachThumbIcon, { backgroundColor: bg }]}>
                        <Feather name="file-text" size={22} color={color} />
                      </View>
                    )}
                    <View style={[styles.attachExtPill, { backgroundColor: bg }]}>
                      <Text style={[styles.attachExtText, { color }]}>{ext}</Text>
                    </View>
                    <Text style={styles.attachThumbName} numberOfLines={2}>{item.name}</Text>
                    <Text style={styles.attachHint}>{isImg ? "اضغط للمعاينة" : "اضغط للفتح"}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </SectionCard>

        {/* Section 5 */}
        <SectionCard title="حالة الدفع" icon="credit-card">
          <View style={styles.paymentRow}>
            <View style={[
              styles.paymentStatusBadge,
              {
                backgroundColor: consult.paymentStatus === "paid" ? "#ECFDF5" : "#FEF3C7",
                borderColor: consult.paymentStatus === "paid" ? "#A7F3D0" : "#FDE68A",
              },
            ]}>
              <Feather
                name={consult.paymentStatus === "paid" ? "check-circle" : "clock"}
                size={15}
                color={consult.paymentStatus === "paid" ? C.success : C.warning}
              />
              <Text style={[
                styles.paymentStatusLabel,
                { color: consult.paymentStatus === "paid" ? C.success : C.warning },
              ]}>
                {consult.paymentStatus === "paid" ? "مدفوع بالكامل" : "في انتظار الدفع"}
              </Text>
            </View>
            <View style={styles.paymentAmountBox}>
              <Text style={styles.paymentAmount}>{consult.price}</Text>
              <Text style={styles.paymentCurrency}>{currency}</Text>
            </View>
          </View>
          {consult.paymentStatus === "paid" && (
            <View style={styles.commissionNote}>
              <Feather name="percent" size={12} color={C.primary} />
              <Text style={styles.commissionNoteText}>
                عمولة المنصة 15% • صافي المحامي {(consult.price * 0.85).toFixed(1)} {currency} • تسوية شهرية
              </Text>
            </View>
          )}
        </SectionCard>

        {/* Rating display (if rated) */}
        {consult.rating && (
          <SectionCard title="تقييم العميل" icon="star">
            <View style={styles.ratingRow}>
              <View style={styles.ratingStars}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Feather key={s} name="star" size={18}
                    color={s <= consult.rating!.stars ? C.gold : C.border} />
                ))}
              </View>
              <Text style={styles.ratingNum}>{consult.rating.stars}/5</Text>
            </View>
            {consult.rating.comment && (
              <Text style={styles.ratingComment}>"{consult.rating.comment}"</Text>
            )}
          </SectionCard>
        )}

        {/* Refund / Dispute / Cancel badges */}
        {consult.paymentStatus === "refunded" && (
          <View style={styles.refundBadge}>
            <Feather name="corner-up-left" size={14} color={C.success} />
            <Text style={styles.refundBadgeText}>
              مُعاد: {consult.refundAmount ?? consult.price} {currency} • {consult.refundReason || "استرجاع أموال"}
            </Text>
          </View>
        )}
        {consult.paymentStatus === "forfeited" && (
          <View style={[styles.refundBadge, { backgroundColor: "#FEF3C7", borderColor: "#FDE68A" }]}>
            <Feather name="alert-circle" size={14} color={C.warning} />
            <Text style={[styles.refundBadgeText, { color: C.warning }]}>
              مصادرة: {consult.price} {currency} (غياب العميل عن الموعد)
            </Text>
          </View>
        )}
        {consult.status === "disputed" && (
          <View style={[styles.refundBadge, { backgroundColor: "#EDE9FE", borderColor: "#DDD6FE" }]}>
            <Feather name="alert-circle" size={14} color="#7C3AED" />
            <Text style={[styles.refundBadgeText, { color: "#7C3AED" }]}>
              نزاع قيد المراجعة: {consult.disputeReason}
            </Text>
          </View>
        )}

        {/* Actions — Lawyer */}
        {isLawyer && consult.status === "pending" && (
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.rejectBtn, loading === "reject" && { opacity: 0.65 }]}
              onPress={handleReject} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "reject"
                ? <ActivityIndicator color={C.destructive} size="small" />
                : <><Feather name="x-circle" size={17} color={C.destructive} /><Text style={styles.rejectBtnText}>رفض</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.acceptBtn, loading === "accept" && { opacity: 0.65 }]}
              onPress={handleAccept} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "accept"
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Feather name="check-circle" size={17} color="#fff" /><Text style={styles.acceptBtnText}>قبول الاستشارة</Text></>
              }
            </TouchableOpacity>
          </View>
        )}

        {isLawyer && consult.status === "accepted" && (
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.completeBtn, loading === "complete" && { opacity: 0.65 }]}
              onPress={handleComplete} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "complete"
                ? <ActivityIndicator color="#fff" size="small" />
                : <><Feather name="check-circle" size={18} color="#fff" /><Text style={styles.completeBtnText}>تحديد كمكتملة</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.cancelBtn, loading === "cancel" && { opacity: 0.65 }]}
              onPress={handleCancel} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "cancel"
                ? <ActivityIndicator color={C.destructive} size="small" />
                : <><Feather name="x-octagon" size={16} color={C.destructive} /><Text style={styles.cancelBtnText}>إلغاء الاستشارة (استرجاع كامل للعميل)</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.noShowBtn, loading === "noShow" && { opacity: 0.65 }]}
              onPress={handleNoShow} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "noShow"
                ? <ActivityIndicator color={C.warning} size="small" />
                : <><Feather name="user-x" size={16} color={C.warning} /><Text style={styles.noShowBtnText}>العميل لم يحضر • إبلاغ غياب</Text></>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Actions — Client */}
        {!isLawyer && consult.status === "accepted" && (
          <View style={styles.actionCol}>
            <TouchableOpacity
              style={[styles.cancelBtn, loading === "cancel" && { opacity: 0.65 }]}
              onPress={handleCancel} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "cancel"
                ? <ActivityIndicator color={C.destructive} size="small" />
                : <><Feather name="x-octagon" size={16} color={C.destructive} /><Text style={styles.cancelBtnText}>إلغاء الاستشارة</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.noShowBtn, loading === "noShow" && { opacity: 0.65 }]}
              onPress={handleNoShow} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "noShow"
                ? <ActivityIndicator color={C.warning} size="small" />
                : <><Feather name="alert-triangle" size={16} color={C.warning} /><Text style={styles.noShowBtnText}>المحامي لم يحضر • إبلاغ تأخر</Text></>
              }
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.disputeBtn, loading === "dispute" && { opacity: 0.65 }]}
              onPress={() => setDisputeModal(true)} disabled={!!loading} activeOpacity={0.85}
            >
              {loading === "dispute"
                ? <ActivityIndicator color="#7C3AED" size="small" />
                : <><Feather name="alert-circle" size={16} color="#7C3AED" /><Text style={styles.disputeBtnText}>رفع نزاع على الاستشارة</Text></>
              }
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Dispute Modal */}
      <Modal
        visible={disputeModal}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => { setDisputeModal(false); setDisputeReason(""); }}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.disputeBox, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.disputeHeader}>
              <Feather name="alert-circle" size={22} color="#7C3AED" />
              <Text style={styles.disputeTitle}>رفع نزاع على الاستشارة</Text>
            </View>
            <Text style={styles.disputeHint}>
              اشرح السبب وسنراجع فريق المنصة في غضون 48 ساعة.
            </Text>
            <TextInput
              style={styles.disputeInput}
              multiline
              numberOfLines={4}
              placeholder="مثال: لم يُتم توصيل الخدمة بالجودة المعمولة..."
              placeholderTextColor={C.mutedForeground}
              value={disputeReason}
              onChangeText={setDisputeReason}
              textAlign="right"
            />
            <View style={styles.disputeActions}>
              <TouchableOpacity
                style={styles.disputeCancelBtn}
                onPress={() => { setDisputeModal(false); setDisputeReason(""); }}
              >
                <Text style={styles.disputeCancelText}>إلغاء</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.disputeSubmitBtn, !disputeReason.trim() && { opacity: 0.5 }]}
                onPress={handleRaiseDispute}
                disabled={!disputeReason.trim() || !!loading}
              >
                {loading === "dispute"
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={styles.disputeSubmitText}>تقديم النزاع</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Full-screen image preview modal */}
      <Modal
        visible={previewUri !== null}
        transparent animationType="fade"
        statusBarTranslucent onRequestClose={() => setPreviewUri(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalHeader, { paddingTop: insets.top + 10 }]}>
            <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setPreviewUri(null)} activeOpacity={0.8}>
              <Feather name="x" size={20} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.modalTitle} numberOfLines={1}>{previewName}</Text>
            <View style={styles.modalBadge}>
              <Feather name="image" size={13} color={C.gold} />
              <Text style={styles.modalBadgeText}>مستند العميل</Text>
            </View>
          </View>
          <View style={styles.modalImageWrap}>
            {previewUri && isImageFile(previewName) ? (
              <Image source={{ uri: previewUri }} style={styles.modalImage} resizeMode="contain" />
            ) : (
              <View style={styles.filePreviewBox}>
                <View style={styles.filePreviewIcon}>
                  <Feather name="file-text" size={48} color={C.gold} />
                </View>
                <Text style={styles.filePreviewName}>{previewName}</Text>
                <Text style={styles.filePreviewSub}>لا يمكن معاينة هذا النوع مباشرةً</Text>
              </View>
            )}
          </View>
          <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
            <View style={styles.modalFooterInfo}>
              <Feather name="shield" size={13} color={C.success} />
              <Text style={styles.modalFooterText}>المستند مرفوع من العميل بشكل آمن</Text>
            </View>
            <TouchableOpacity style={styles.modalCloseFullBtn} onPress={() => setPreviewUri(null)} activeOpacity={0.85}>
              <Text style={styles.modalCloseBtnText}>إغلاق المعاينة</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

function SectionCard({ title, icon, badge, children }: {
  title: string; icon: string; badge?: string; children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionCardHeader}>
        <View style={styles.sectionCardHeaderLeft}>
          <View style={styles.sectionIconDot}>
            <Feather name={icon as any} size={13} color={C.gold} />
          </View>
          <Text style={styles.sectionCardTitle}>{title}</Text>
        </View>
        {badge && (
          <View style={styles.badgeCircle}>
            <Text style={styles.badgeText}>{badge}</Text>
          </View>
        )}
      </View>
      <View style={styles.sectionCardBody}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 18 },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: C.foreground },
  backLink: { fontSize: 14, color: C.primary, fontFamily: "Inter_500Medium" },

  topBar: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  backBtn: { padding: 4 },
  pageTitle: { flex: 1, fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  topBarRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusPill: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold" },

  // Serial number banner
  serialBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: C.navy, borderRadius: 14, paddingHorizontal: 16, paddingVertical: 10, marginBottom: 14,
  },
  serialLeft: { flexDirection: "row", alignItems: "center", gap: 6 },
  serialNumber: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.gold, letterSpacing: 0.5 },
  pdfBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    backgroundColor: C.gold, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 7,
  },
  pdfBtnText: { fontSize: 12, fontFamily: "Inter_700Bold", color: C.navy },

  heroCard: {
    backgroundColor: C.navy, borderRadius: 20, padding: 18,
    flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14,
  },
  heroAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(201,160,53,0.22)", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.gold,
  },
  heroAvatarText: { fontSize: 20, color: "#fff", fontFamily: "Inter_700Bold" },
  heroName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "right" },
  heroRole: { fontSize: 12, color: C.gold, fontFamily: "Inter_500Medium", textAlign: "right" },
  heroDate: { fontSize: 11, color: "rgba(255,255,255,0.45)", fontFamily: "Inter_400Regular", textAlign: "right" },
  typeTagOuter: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },

  sectionCard: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border, marginBottom: 12, overflow: "hidden",
  },
  sectionCardHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 14, paddingVertical: 11,
    borderBottomWidth: 1, borderBottomColor: C.border, backgroundColor: "#F8FAFF",
  },
  sectionCardHeaderLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  sectionIconDot: {
    width: 26, height: 26, borderRadius: 8,
    backgroundColor: "rgba(201,160,53,0.13)", alignItems: "center", justifyContent: "center",
  },
  sectionCardTitle: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.navy },
  sectionCardBody: { padding: 14 },
  badgeCircle: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" },
  badgeText: { fontSize: 11, color: "#fff", fontFamily: "Inter_700Bold" },

  caseTypeRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  caseTypeIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  caseTypeLabel: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  caseTypeSpec: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  countryTag: { alignItems: "center", gap: 2 },
  countryFlag: { fontSize: 20 },
  countryLabel: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  subjectText: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.navy, textAlign: "right", lineHeight: 24 },
  descriptionText: { fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular", lineHeight: 24, textAlign: "right" },

  noAttach: { alignItems: "center", paddingVertical: 16, gap: 8 },
  noAttachText: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  attachGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  attachThumb: {
    width: "47%", alignItems: "center", gap: 6,
    backgroundColor: C.background, borderRadius: 14,
    borderWidth: 1, borderColor: C.border, paddingBottom: 12, overflow: "hidden", position: "relative",
  },
  attachImgWrap: { width: "100%", height: 110, position: "relative" },
  attachImgThumb: { width: "100%", height: 110 },
  attachImgOverlay: {
    position: "absolute", inset: 0,
    backgroundColor: "rgba(0,0,0,0.18)", alignItems: "center", justifyContent: "center",
  },
  attachThumbIcon: { width: "100%", height: 100, alignItems: "center", justifyContent: "center" },
  attachExtPill: { position: "absolute", top: 8, right: 8, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  attachExtText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  attachThumbName: { fontSize: 11, color: C.foreground, fontFamily: "Inter_500Medium", textAlign: "center", lineHeight: 16, paddingHorizontal: 8 },
  attachHint: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  paymentRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  paymentStatusBadge: {
    flexDirection: "row", alignItems: "center", gap: 7,
    paddingHorizontal: 14, paddingVertical: 9, borderRadius: 20, borderWidth: 1,
  },
  paymentStatusLabel: { fontSize: 14, fontFamily: "Inter_700Bold" },
  paymentAmountBox: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  paymentAmount: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.navy },
  paymentCurrency: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  ratingRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  ratingStars: { flexDirection: "row", gap: 4 },
  ratingNum: { fontSize: 16, fontFamily: "Inter_700Bold", color: C.gold },
  ratingComment: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", fontStyle: "italic", textAlign: "right", lineHeight: 20 },

  actionRow: { flexDirection: "row", gap: 12, marginBottom: 10 },
  rejectBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, borderWidth: 1.5, borderColor: C.destructive, borderRadius: 14, paddingVertical: 14,
  },
  rejectBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: C.destructive },
  acceptBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.success, borderRadius: 14, paddingVertical: 14,
  },
  acceptBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  completeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: C.primary, borderRadius: 14, paddingVertical: 14, marginBottom: 10,
  },
  completeBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  actionCol: { gap: 10, marginTop: 6 },
  cancelBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: "#FECACA",
  },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.destructive },
  noShowBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#FEF3C7", borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: "#FDE68A",
  },
  noShowBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.warning },
  disputeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8,
    backgroundColor: "#EDE9FE", borderRadius: 14, paddingVertical: 14,
    borderWidth: 1.5, borderColor: "#DDD6FE",
  },
  disputeBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#7C3AED" },

  // Refund / Dispute badges
  refundBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#ECFDF5", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#A7F3D0", marginTop: 4,
  },
  refundBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.success, textAlign: "right", flex: 1 },

  // Dispute Modal
  disputeBox: {
    backgroundColor: C.card, borderRadius: 24,
    paddingHorizontal: 20, margin: 20,
    shadowColor: "#000", shadowOpacity: 0.25, shadowOffset: { width: 0, height: 8 }, shadowRadius: 24,
    elevation: 24,
  },
  disputeHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 10 },
  disputeTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: C.foreground },
  disputeHint: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginBottom: 14, textAlign: "right" },
  disputeInput: {
    backgroundColor: C.background, borderRadius: 14, borderWidth: 1, borderColor: C.border,
    padding: 14, fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular",
    minHeight: 100, textAlignVertical: "top", textAlign: "right",
  },
  disputeActions: { flexDirection: "row", gap: 10, marginTop: 16 },
  disputeCancelBtn: { flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: C.muted },
  disputeCancelText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground },
  disputeSubmitBtn: { flex: 1.5, alignItems: "center", justifyContent: "center", paddingVertical: 14, borderRadius: 14, backgroundColor: "#7C3AED" },
  disputeSubmitText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", justifyContent: "space-between" },
  modalHeader: {
    flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12, gap: 10,
    borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.08)",
  },
  modalCloseBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center" },
  modalTitle: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff", textAlign: "right" },
  modalBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    backgroundColor: "rgba(201,160,53,0.15)", borderWidth: 1, borderColor: "rgba(201,160,53,0.3)",
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20,
  },
  modalBadgeText: { fontSize: 11, color: C.gold, fontFamily: "Inter_600SemiBold" },
  modalImageWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 8, paddingVertical: 16 },
  modalImage: { width: SCREEN_W - 16, height: SCREEN_H * 0.62, borderRadius: 12 },
  filePreviewBox: {
    alignItems: "center", gap: 16, padding: 40,
    backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)",
  },
  filePreviewIcon: { width: 88, height: 88, borderRadius: 22, backgroundColor: "rgba(201,160,53,0.15)", alignItems: "center", justifyContent: "center" },
  filePreviewName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff", textAlign: "center" },
  filePreviewSub: { fontSize: 13, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular", textAlign: "center" },
  modalFooter: { paddingHorizontal: 16, paddingTop: 12, gap: 12, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.08)" },
  modalFooterInfo: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  modalFooterText: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  modalCloseFullBtn: { backgroundColor: "#fff", borderRadius: 14, paddingVertical: 14, alignItems: "center" },
  modalCloseBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.navy },
  commissionNote: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 10, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border },
  commissionNoteText: { fontSize: 12, color: C.primary, fontFamily: "Inter_400Regular" },

  // ── Meeting card ──
  meetCard: {
    backgroundColor: C.card, borderRadius: colors.radius,
    borderWidth: 1, borderColor: C.border,
    padding: 18, gap: 10, marginBottom: 16,
  },
  meetHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  meetTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.foreground },
  meetLink: { fontSize: 12, color: C.primary, fontFamily: "Inter_400Regular", textAlign: "center" },
  joinBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#7C3AED", borderRadius: 14,
    paddingVertical: 14, marginTop: 4,
  },
  joinBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
  joinDisabled: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, backgroundColor: C.border, borderRadius: 14,
    paddingVertical: 12, marginTop: 4,
  },
  joinDisabledText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  attendanceRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  attBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10,
  },
  attText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  absencePanel: {
    marginTop: 12,
    backgroundColor: "#FFF7ED",
    borderWidth: 1,
    borderColor: "#FED7AA",
    borderRadius: 12,
    padding: 14,
    gap: 8,
  },
  absencePanelHeader: {
    flexDirection: "row", alignItems: "center", gap: 7,
  },
  absencePanelTitle: {
    fontSize: 13, fontFamily: "Inter_700Bold", color: "#92400E",
  },
  absenceCountdown: {
    fontSize: 14, fontFamily: "Inter_700Bold", color: "#B45309",
    textAlign: "center", letterSpacing: 0.5,
  },
  absenceCountdownReady: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: "#B45309",
    textAlign: "center",
  },
  absenceBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, backgroundColor: "#B45309", borderRadius: 12,
    paddingVertical: 12, marginTop: 4,
  },
  absenceBtnText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#fff" },
});
