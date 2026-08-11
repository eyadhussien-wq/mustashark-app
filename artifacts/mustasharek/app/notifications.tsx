import { Feather } from "@expo/vector-icons";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import colors from "@/constants/colors";

const C = colors.light;
type Severity = "info" | "action" | "deadline" | "critical";
type Notice = { id: string; title: string; body: string; time: string; severity: Severity; read: boolean; opened: boolean; actionLabel?: string; category: string };

const CLIENT_NOTICES: Notice[] = [
  { id: "c1", title: "عرض توكيل جديد", body: "أرسل المحامي عرض أتعاب للتوكيل. يرجى مراجعة النطاق والشروط.", time: "منذ 8 دقائق", severity: "action", read: false, opened: false, actionLabel: "مراجعة العرض", category: "العروض" },
  { id: "c2", title: "تذكير بدفعة المرحلة", body: "تبقى 12 ساعة لإيداع دفعة المرحلة الثانية لاستكمال الإجراءات.", time: "منذ ساعتين", severity: "deadline", read: true, opened: true, actionLabel: "عرض الدفعة", category: "المدفوعات" },
  { id: "c3", title: "مستند بانتظار المراجعة", body: "رفع المحامي مستندًا جديدًا ضمن ملف القضية.", time: "اليوم 10:42", severity: "action", read: false, opened: false, actionLabel: "مراجعة المستند", category: "المستندات" },
  { id: "c4", title: "تأكيد تسليم المستند", body: "تم تسجيل تسليم المستندات في سجل القضية.", time: "أمس", severity: "info", read: true, opened: true, category: "التسليم" },
  { id: "c5", title: "تنبيه حرج: اتفاقية بانتظار التأكيد", body: "يرجى تأكيد الاتفاقية قبل انتهاء المهلة المحددة.", time: "أمس", severity: "critical", read: false, opened: false, actionLabel: "مراجعة الاتفاقية", category: "الاتفاقية" },
];
const LAWYER_NOTICES: Notice[] = [
  { id: "l1", title: "طلب عرض توكيل جديد", body: "طلب عميل عرض سعر للتوكيل. تبدأ مهلة الرد من وقت إنشاء الطلب.", time: "منذ 5 دقائق", severity: "action", read: false, opened: false, actionLabel: "فتح الطلب", category: "طلبات التوكيل" },
  { id: "l2", title: "تذكير: تبقى 4 ساعات", body: "تبقى 4 ساعات على انتهاء مهلة تقديم عرض التوكيل.", time: "منذ ساعة", severity: "critical", read: false, opened: false, actionLabel: "تقديم العرض", category: "المواعيد" },
  { id: "l3", title: "تم قبول عرضك", body: "وافق العميل على العرض وانتقلت العملية إلى الدفع والاتفاقية.", time: "اليوم 09:30", severity: "info", read: true, opened: true, category: "العروض" },
  { id: "l4", title: "طلب إفراج دفعة مرحلة", body: "لديك مرحلة مكتملة تحتاج إلى رفع إثبات الإنجاز قبل طلب الإفراج.", time: "أمس", severity: "action", read: true, opened: true, actionLabel: "فتح المرحلة", category: "المراحل" },
  { id: "l5", title: "بيانات IBAN تحتاج مراجعة", body: "يوجد طلب مراجعة متعلق ببيانات الحساب البنكي.", time: "أمس", severity: "deadline", read: false, opened: false, actionLabel: "مراجعة البيانات", category: "الحساب البنكي" },
];
const ADMIN_NOTICES: Notice[] = [
  { id: "a1", title: "محامٍ بانتظار المراجعة", body: "تم رفع بيانات مهنية ومستندات جديدة وتحتاج إلى مراجعة الإدارة.", time: "منذ 12 دقيقة", severity: "action", read: false, opened: false, actionLabel: "مراجعة", category: "المحامون" },
  { id: "a2", title: "مستند بنكي جديد", body: "تم رفع شهادة حساب بنكي مرتبطة بطلب تحقق.", time: "منذ ساعة", severity: "action", read: false, opened: false, actionLabel: "فتح الطلب", category: "المستندات" },
  { id: "a3", title: "تنبيه تشغيلي", body: "هناك عملية تحتاج متابعة قبل اقتراب موعدها النهائي.", time: "اليوم 11:05", severity: "deadline", read: true, opened: true, category: "التشغيل" },
];
const ACTIVITY = [["14:03", "تم إنشاء طلب مراجعة المستند", "notification"], ["14:04", "تم إرسال إشعار داخل التطبيق", "delivery"], ["14:07", "تم فتح الإشعار", "opened"], ["14:08", "تم فتح المستند المرتبط", "read"], ["14:11", "تم اتخاذ إجراء من المستخدم", "action"]] as const;

export default function NotificationsScreen() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"all" | "action" | "unread" | "critical">("all");
  const notices = user?.role === "lawyer" ? LAWYER_NOTICES : user?.role === "admin" ? ADMIN_NOTICES : CLIENT_NOTICES;
  const visible = useMemo(() => notices.filter((n) => filter === "unread" ? !n.read : filter === "action" ? n.severity === "action" || n.severity === "deadline" : filter === "critical" ? n.severity === "critical" : true), [filter, notices]);
  const unreadCount = notices.filter((n) => !n.read).length;
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={styles.headerCopy}><Text style={styles.eyebrow}>مركز الإخطارات والسجل</Text><Text style={styles.title}>التنبيهات</Text><Text style={styles.subtitle}>كل إخطار مرتبط بعملية أو معاملة ويمكن تتبعه لاحقًا.</Text></View>
        <View style={styles.bell}><Feather name="bell" size={23} color={C.gold} /><View style={styles.badge}><Text style={styles.badgeText}>{unreadCount}</Text></View></View>
      </View>
      <View style={styles.filters}>{([["all", "الكل"], ["action", "إجراء مطلوب"], ["unread", "غير مقروء"], ["critical", "حرج"]] as const).map(([key, label]) => <TouchableOpacity key={key} style={[styles.filter, filter === key && styles.filterActive]} onPress={() => setFilter(key)}><Text style={[styles.filterText, filter === key && styles.filterTextActive]}>{label}</Text></TouchableOpacity>)}</View>
      <View style={styles.noticeList}>{visible.map((notice) => <NoticeCard key={notice.id} notice={notice} />)}</View>
      <View style={styles.auditCard}>
        <View style={styles.auditHeader}><View style={styles.auditIcon}><Feather name="shield" size={18} color={C.gold} /></View><View style={styles.auditCopy}><Text style={styles.auditTitle}>سجل النشاط والتبليغ</Text><Text style={styles.auditSub}>واجهة تمهيدية لسجل تدقيق قابل للتتبع في الـBackend لاحقًا.</Text></View></View>
        {ACTIVITY.map(([time, label, type], index) => <View key={time} style={styles.activityRow}><View style={styles.activityDot} /><View style={styles.activityText}><Text style={styles.activityLabel}>{label}</Text><Text style={styles.activityMeta}>{time} • {type === "notification" ? "تم الإنشاء" : type === "delivery" ? "تم الإرسال" : type === "opened" ? "تم الفتح" : type === "read" ? "تمت القراءة" : "إجراء مسجل"}</Text></View>{index < ACTIVITY.length - 1 && <View style={styles.connector} />}</View>)}
        <View style={styles.auditNote}><Feather name="info" size={14} color={C.primary} /><Text style={styles.auditNoteText}>سيتم لاحقًا حفظ وقت الإنشاء والإرسال والتسليم والفتح والقراءة والإجراء والتذكيرات لكل معاملة.</Text></View>
      </View>
    </ScrollView>
  );
}
function NoticeCard({ notice }: { notice: Notice }) {
  const icon = notice.severity === "critical" ? "alert-octagon" : notice.severity === "deadline" ? "clock" : notice.severity === "action" ? "check-circle" : "info";
  return <View style={[styles.noticeCard, !notice.read && styles.unreadCard, notice.severity === "critical" && styles.criticalCard]}><View style={styles.noticeTop}><View style={[styles.severityIcon, notice.severity === "critical" ? styles.criticalIcon : notice.severity === "deadline" ? styles.deadlineIcon : styles.normalIcon]}><Feather name={icon as any} size={17} color={notice.severity === "critical" ? "#B42318" : notice.severity === "deadline" ? "#9A6700" : C.primary} /></View><View style={styles.noticeCopy}><View style={styles.titleRow}><Text style={styles.noticeTitle}>{notice.title}</Text>{!notice.read && <View style={styles.unreadDot} />}</View><Text style={styles.noticeBody}>{notice.body}</Text></View></View><View style={styles.noticeBottom}><Text style={styles.time}>{notice.time} • {notice.opened ? "تم الفتح" : notice.read ? "مقروء" : "غير مقروء"}</Text>{notice.actionLabel && <TouchableOpacity style={styles.actionButton} activeOpacity={0.7}><Text style={styles.actionText}>{notice.actionLabel}</Text><Feather name="arrow-left" size={14} color={C.primary} /></TouchableOpacity>}</View></View>;
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.background }, content: { padding: 20, paddingTop: 58, paddingBottom: 120 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: C.navy, borderRadius: 20, padding: 18, borderWidth: 1, borderColor: "rgba(201,160,53,0.35)", marginBottom: 14 }, headerCopy: { flex: 1, alignItems: "flex-end" }, eyebrow: { color: C.gold, fontSize: 10, fontFamily: "Inter_600SemiBold" }, title: { color: "#fff", fontSize: 23, fontFamily: "Inter_700Bold", marginTop: 3 }, subtitle: { color: "rgba(255,255,255,0.72)", fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 4, textAlign: "right" },
  bell: { width: 52, height: 52, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center", marginRight: 12 }, badge: { position: "absolute", top: -3, right: -3, minWidth: 20, height: 20, borderRadius: 10, backgroundColor: "#B42318", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: C.navy }, badgeText: { color: "#fff", fontSize: 10, fontFamily: "Inter_700Bold" },
  filters: { flexDirection: "row", justifyContent: "flex-end", gap: 7, marginBottom: 12, flexWrap: "wrap" }, filter: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: C.card, borderWidth: 1, borderColor: C.border }, filterActive: { backgroundColor: C.navy, borderColor: C.navy }, filterText: { color: C.mutedForeground, fontSize: 11, fontFamily: "Inter_500Medium" }, filterTextActive: { color: "#fff" }, noticeList: { gap: 9 },
  noticeCard: { backgroundColor: C.card, borderWidth: 1, borderColor: C.border, borderRadius: 16, padding: 14 }, unreadCard: { borderColor: "rgba(201,160,53,0.5)", backgroundColor: "#FFFCF3" }, criticalCard: { borderColor: "rgba(180,35,24,0.35)", backgroundColor: "#FFF8F7" }, noticeTop: { flexDirection: "row", alignItems: "flex-start", gap: 11 }, severityIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center" }, normalIcon: { backgroundColor: "#EEF2F8" }, deadlineIcon: { backgroundColor: "#FFF4CE" }, criticalIcon: { backgroundColor: "#FDECEC" }, noticeCopy: { flex: 1, alignItems: "flex-end" }, titleRow: { flexDirection: "row", alignItems: "center", gap: 6 }, noticeTitle: { color: C.foreground, fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "right" }, unreadDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: C.gold }, noticeBody: { color: C.mutedForeground, fontSize: 11, lineHeight: 18, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 }, noticeBottom: { marginTop: 11, paddingTop: 10, borderTopWidth: 1, borderTopColor: C.border, flexDirection: "row", alignItems: "center", justifyContent: "space-between" }, time: { color: C.mutedForeground, fontSize: 9, fontFamily: "Inter_400Regular" }, actionButton: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 9, backgroundColor: "#EEF2F8" }, actionText: { color: C.primary, fontSize: 10, fontFamily: "Inter_600SemiBold" },
  auditCard: { marginTop: 16, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, padding: 16 }, auditHeader: { flexDirection: "row", alignItems: "center", gap: 10, paddingBottom: 13, borderBottomWidth: 1, borderBottomColor: C.border }, auditIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: C.navy, alignItems: "center", justifyContent: "center" }, auditCopy: { flex: 1, alignItems: "flex-end" }, auditTitle: { color: C.foreground, fontSize: 14, fontFamily: "Inter_700Bold" }, auditSub: { color: C.mutedForeground, fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, textAlign: "right" }, activityRow: { minHeight: 58, flexDirection: "row", alignItems: "flex-start", position: "relative", gap: 10, paddingTop: 12 }, activityDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: C.gold, marginTop: 4, marginLeft: 2 }, activityText: { flex: 1, alignItems: "flex-end" }, activityLabel: { color: C.foreground, fontSize: 11, fontFamily: "Inter_600SemiBold", textAlign: "right" }, activityMeta: { color: C.mutedForeground, fontSize: 9, fontFamily: "Inter_400Regular", marginTop: 3 }, connector: { position: "absolute", left: 6, top: 25, width: 1, height: 45, backgroundColor: C.border }, auditNote: { marginTop: 10, padding: 10, borderRadius: 11, backgroundColor: "#EEF2F8", flexDirection: "row", alignItems: "flex-start", gap: 7 }, auditNoteText: { flex: 1, color: C.primary, fontSize: 9, lineHeight: 15, fontFamily: "Inter_500Medium", textAlign: "right" },
});
