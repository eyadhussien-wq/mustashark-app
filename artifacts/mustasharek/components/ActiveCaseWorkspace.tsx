import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";
import { FundMilestoneButton } from "@/components/FundMilestoneButton";

const C = colors.light;

export type ActiveCaseRole = "client" | "lawyer";

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

const milestones = [
  { title: "البدء", percent: 30, amount: "1,350 ر.ق", state: "مكتملة" },
  { title: "الجلسات والإجراءات", percent: 40, amount: "1,800 ر.ق", state: "الحالية" },
  { title: "الحكم والختام", percent: 30, amount: "1,350 ر.ق", state: "قادمة" },
];

const documents = [
  { icon: "file-text" as const, title: "اتفاقية التوكيل", meta: "PDF · موقعة" },
  { icon: "briefcase" as const, title: "ملخص القضية", meta: "آخر تحديث اليوم" },
  { icon: "paperclip" as const, title: "مستندات القضية", meta: "4 ملفات" },
];

export function ActiveCaseWorkspace({ role, milestoneId }: { role: ActiveCaseRole; milestoneId?: string }) {
  const isClient = role === "client";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={styles.caseBadge}><Feather name="briefcase" size={15} color={C.gold} /><Text style={styles.caseBadgeText}>قضية نشطة</Text></View>
          <Text style={styles.kicker}>{isClient ? "مساحة العميل" : "مساحة المحامي"}</Text>
        </View>
        <Text style={styles.heroTitle}>توكيل وتمثيل — نزاع مدني</Text>
        <Text style={styles.heroMeta}>{isClient ? "المحامي: أحمد القانوني" : "العميل: محمد العميل"} · رقم القضية #MS-2048</Text>
        <View style={styles.progressTrack}><View style={styles.progressFill} /></View>
        <Text style={styles.progressText}>التقدم الإجمالي 60%</Text>
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
        {milestones.map((item) => (
          <View key={item.title} style={styles.milestoneRow}>
            <View style={styles.rowBetween}><Text style={styles.amount}>{item.amount}</Text><Text style={styles.itemTitle}>{item.title}</Text></View>
            <View style={styles.milestoneTrack}><View style={[styles.milestoneFill, { width: `${item.percent}%` }, item.state === "الحالية" && styles.currentFill]} /></View>
            <View style={styles.rowBetween}><Text style={styles.itemText}>{item.percent}% من الأتعاب</Text><Text style={styles.itemText}>{item.state}</Text></View>
          </View>
        ))}
        {isClient && milestoneId ? <FundMilestoneButton milestoneId={milestoneId} /> : null}
      </View>

      <SectionTitle icon="credit-card" title="Payments" />
      <View style={styles.card}>
        <View style={styles.rowBetween}><Text style={styles.totalAmount}>4,500 ر.ق</Text><Text style={styles.itemTitle}>إجمالي الأتعاب</Text></View>
        <View style={styles.paymentRow}><Feather name="check-circle" size={17} color={C.success} /><Text style={styles.paymentText}>1,350 ر.ق · دفعة البدء · مدفوعة</Text></View>
        <View style={styles.paymentRow}><Feather name="clock" size={17} color={C.gold} /><Text style={styles.paymentText}>1,800 ر.ق · المرحلة الحالية · بانتظار الاستحقاق</Text></View>
        <View style={styles.paymentRow}><Feather name="lock" size={17} color={C.mutedForeground} /><Text style={styles.paymentText}>1,350 ر.ق · المرحلة الختامية · محجوزة</Text></View>
      </View>

      <SectionTitle icon="folder" title="Documents" />
      <View style={styles.card}>
        {documents.map((doc) => (
          <TouchableOpacity key={doc.title} style={styles.documentRow} activeOpacity={0.8}>
            <Feather name="chevron-left" size={17} color={C.mutedForeground} />
            <View style={styles.documentCopy}><Text style={styles.itemTitle}>{doc.title}</Text><Text style={styles.itemText}>{doc.meta}</Text></View>
            <View style={styles.documentIcon}><Feather name={doc.icon} size={16} color={C.gold} /></View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.notice}><Feather name="shield" size={16} color={C.gold} /><Text style={styles.noticeText}>التمويل الحقيقي لا يحدد المبلغ من الواجهة؛ الـBackend يقرأ المبلغ والعملة من قاعدة البيانات، ويحمي العملية بـIdempotency ومعاملة ذرية.</Text></View>
    </ScrollView>
  );
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
  hero: { backgroundColor: C.navy, borderRadius: 20, padding: 19, borderWidth: 1, borderColor: "rgba(201,160,53,.35)" },
  heroTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  caseBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "rgba(201,160,53,.12)", paddingHorizontal: 9, paddingVertical: 6, borderRadius: 10 },
  caseBadgeText: { color: C.gold, fontSize: 10, fontFamily: "Inter_700Bold" },
  kicker: { color: "rgba(255,255,255,.65)", fontSize: 10, fontFamily: "Inter_600SemiBold" },
  heroTitle: { color: "#fff", fontSize: 19, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 13 },
  heroMeta: { color: "rgba(255,255,255,.68)", fontSize: 10, textAlign: "right", marginTop: 5, fontFamily: "Inter_400Regular" },
  progressTrack: { height: 8, backgroundColor: "rgba(255,255,255,.12)", borderRadius: 8, marginTop: 16, overflow: "hidden" },
  progressFill: { width: "60%", height: "100%", backgroundColor: C.gold, borderRadius: 8 },
  progressText: { color: C.gold, fontSize: 10, textAlign: "right", marginTop: 7, fontFamily: "Inter_600SemiBold" },
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
  documentIcon: { width: 35, height: 35, borderRadius: 10, backgroundColor: "rgba(201,160,53,.1)", alignItems: "center", justifyContent: "center" },
  notice: { flexDirection: "row-reverse", alignItems: "flex-start", gap: 8, padding: 12, marginTop: 14, borderRadius: 13, backgroundColor: "#FFFCF3", borderWidth: 1, borderColor: "rgba(201,160,53,.25)" },
  noticeText: { flex: 1, color: C.mutedForeground, fontSize: 10, lineHeight: 17, textAlign: "right", fontFamily: "Inter_400Regular" },
});
