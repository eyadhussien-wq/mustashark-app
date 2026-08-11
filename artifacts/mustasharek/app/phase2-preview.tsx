import { Feather } from "@expo/vector-icons";
import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

type Tone = "gold" | "navy" | "green" | "purple" | "blue" | "amber";

const tone = {
  gold: { bg: "#FBF5E3", border: "#D7B75B", icon: C.gold, text: "#765B13" },
  navy: { bg: "#EEF2F8", border: "#CBD5E1", icon: C.navy, text: C.navy },
  green: { bg: "#ECFDF5", border: "#A7E5C6", icon: C.success, text: "#126B46" },
  purple: { bg: "#F3EEFF", border: "#D7C7FF", icon: "#7255B8", text: "#563D91" },
  blue: { bg: "#EEF7FF", border: "#B9D9F7", icon: "#2876B8", text: "#205A8D" },
  amber: { bg: "#FFF7E6", border: "#F2D08A", icon: C.warning, text: "#805B13" },
} as const;

function DisabledAction({ icon, title, subtitle, toneName = "navy" as Tone }: { icon: string; title: string; subtitle?: string; toneName?: Tone }) {
  const p = tone[toneName];
  return (
    <TouchableOpacity disabled style={[styles.action, { backgroundColor: p.bg, borderColor: p.border }]} activeOpacity={1}>
      <View style={[styles.actionIcon, { backgroundColor: "rgba(255,255,255,0.72)" }]}>
        <Feather name={icon as any} size={18} color={p.icon} />
      </View>
      <View style={styles.actionCopy}>
        <Text style={[styles.actionTitle, { color: p.text }]}>{title}</Text>
        {subtitle ? <Text style={styles.actionSubtitle}>{subtitle}</Text> : null}
      </View>
      <View style={styles.comingSoon}><Text style={styles.comingSoonText}>قريباً</Text></View>
    </TouchableOpacity>
  );
}

function Status({ children, toneName = "navy" as Tone }: { children: string; toneName?: Tone }) {
  const p = tone[toneName];
  return <View style={[styles.status, { backgroundColor: p.bg, borderColor: p.border }]}><Text style={[styles.statusText, { color: p.text }]}>{children}</Text></View>;
}

function Section({ icon, title, subtitle, children }: { icon: string; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}><Feather name={icon as any} size={19} color={C.gold} /></View>
        <View style={styles.sectionHeadCopy}>
          <Text style={styles.sectionTitle}>{title}</Text>
          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
      {children}
    </View>
  );
}

export default function Phase2Preview() {
  return (
    <ScrollView style={styles.page} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Feather name="shield" size={25} color={C.gold} /></View>
        <Text style={styles.eyebrow}>مستشارك · FRONT PHASE 2</Text>
        <Text style={styles.heroTitle}>منظومة التوكيل والدفع الآمن</Text>
        <Text style={styles.heroText}>واجهة تأسيسية لصقل تجربة العميل والمحامي والإدارة قبل تفعيل الربط والاختبارات العملية.</Text>
        <View style={styles.heroTags}>
          <Status toneName="green">الأساس المالي مثبت</Status>
          <Status toneName="gold">الواجهة قيد الصقل</Status>
        </View>
      </View>

      <Section icon="briefcase" title="⚖️ مساحة المحامي" subtitle="إعدادات وبيانات ستظهر في المرحلة الثانية">
        <DisabledAction icon="shield" title="حالة التحقق المهني" subtitle="الرخصة والمستندات وحالة الاعتماد" toneName="green" />
        <DisabledAction icon="credit-card" title="الحساب البنكي و IBAN" subtitle="إضافة الحساب ورفع شهادة البنك" toneName="blue" />
        <DisabledAction icon="file-text" title="عروض أتعاب التوكيل" subtitle="إنشاء وإدارة عروض التوكيل" toneName="gold" />
        <DisabledAction icon="layers" title="تفعيل التقسيط" subtitle="التقسيط لعروض التوكيل فقط" toneName="purple" />
      </Section>

      <Section icon="user" title="👤 مساحة العميل" subtitle="تدفق طلب عرض التوكيل والدفع">
        <DisabledAction icon="send" title="طلب عرض سعر توكيل" subtitle="من الاستشارة المكتملة أو المحادثة" toneName="gold" />
        <DisabledAction icon="clock" title="مهلة رد المحامي · 24 ساعة" subtitle="عداد انتهاء الطلب والتنبيهات" toneName="amber" />
        <DisabledAction icon="file-text" title="بطاقة عرض الأتعاب" subtitle="الأتعاب والنطاق والجدول المقترح" toneName="navy" />
        <DisabledAction icon="check-circle" title="قبول ودفع الأتعاب" subtitle="الانتقال إلى Checkout الآمن" toneName="green" />
      </Section>

      <Section icon="lock" title="💳 Checkout & Escrow" subtitle="الواجهة المالية قبل تفعيل بوابة الدفع الحقيقية">
        <View style={styles.choiceRow}>
          <View style={styles.choiceCard}><Text style={styles.choiceTitle}>A</Text><Text style={styles.choiceName}>تجميد كامل المبلغ</Text><Text style={styles.choiceText}>إيداع 100% في Escrow</Text></View>
          <View style={styles.choiceCard}><Text style={styles.choiceTitle}>B</Text><Text style={styles.choiceName}>الدفع مرحلة بمرحلة</Text><Text style={styles.choiceText}>إيداع 30% لبدء القضية</Text></View>
        </View>
        <DisabledAction icon="shield" title="بياناتك المالية محمية" subtitle="واجهة الثقة والحماية في شاشة الدفع" toneName="green" />
        <View style={styles.securityNote}><Feather name="lock" size={15} color={C.navy} /><Text style={styles.securityText}>لن نستخدم ادعاء PCI-DSS معتمد قبل اختيار بوابة دفع حقيقية والتحقق من اعتمادها.</Text></View>
      </Section>

      <Section icon="edit-3" title="📄 الاتفاقية وبداية القضية" subtitle="الانتقال من الدفع إلى Active Case">
        <DisabledAction icon="file-text" title="Pending Agreement" subtitle="توليد اتفاقية الخدمات القانونية" toneName="gold" />
        <DisabledAction icon="edit-3" title="تأكيد العميل والمحامي" subtitle="تأكيد/توقيع الاتفاقية داخل التطبيق" toneName="navy" />
        <DisabledAction icon="folder" title="Active Case Workspace" subtitle="مساحة القضية مع خط زمني واضح" toneName="blue" />
      </Section>

      <Section icon="trending-up" title="💰 مراحل الأتعاب" subtitle="الأساس المعتمد لعروض التوكيل">
        <View style={styles.milestones}>
          <Milestone number="01" percent="30%" title="تأسيس الدعوى" />
          <Milestone number="02" percent="40%" title="الجلسات والمذكرات" />
          <Milestone number="03" percent="30%" title="الحكم والإغلاق" />
        </View>
        <DisabledAction icon="upload" title="طلب إفراج دفعة المرحلة" subtitle="إثبات الإنجاز + نافذة مراجعة 72 ساعة" toneName="amber" />
      </Section>

      <Section icon="message-square" title="🔒 خصوصية المحادثة" subtitle="لمسة ثقة ثابتة أعلى المحادثة">
        <View style={styles.privacyBanner}>
          <Feather name="shield" size={18} color={C.gold} />
          <Text style={styles.privacyText}>هذه المحادثة آمنة وسرية ومحمية بموجب سياسة الخصوصية لمنصة مستشارك.</Text>
        </View>
      </Section>

      <Section icon="package" title="📦 تسليم المستندات" subtitle="أساس Local / Cross-Border للمرحلة اللاحقة">
        <View style={styles.deliveryGrid}>
          <View style={styles.deliveryCard}><Text style={styles.deliveryCode}>A</Text><Text style={styles.deliveryTitle}>مندوب المكتب</Text><Text style={styles.deliveryText}>OTP عند التسليم</Text></View>
          <View style={styles.deliveryCard}><Text style={styles.deliveryCode}>B</Text><Text style={styles.deliveryTitle}>مقر المكتب</Text><Text style={styles.deliveryText}>عنوان + ساعات + خريطة</Text></View>
          <View style={[styles.deliveryCard, styles.deliveryInternational]}><Text style={styles.deliveryCode}>C</Text><Text style={styles.deliveryTitle}>شحن دولي</Text><Text style={styles.deliveryText}>Tracking + إثبات استلام</Text></View>
        </View>
      </Section>

      <View style={styles.footer}><Feather name="info" size={15} color={C.mutedForeground} /><Text style={styles.footerText}>هذه واجهة Front تأسيسية فقط. الأزرار غير مفعلة، ولا توجد اختبارات أو عمليات دفع أو ربط خارجي في هذه المرحلة.</Text></View>
    </ScrollView>
  );
}

function Milestone({ number, percent, title }: { number: string; percent: string; title: string }) {
  return <View style={styles.milestone}><Text style={styles.milestoneNumber}>{number}</Text><Text style={styles.milestonePercent}>{percent}</Text><Text style={styles.milestoneTitle}>{title}</Text></View>;
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: C.background },
  container: { padding: 18, paddingTop: 55, paddingBottom: 80 },
  hero: { backgroundColor: C.navy, borderRadius: 24, padding: 22, marginBottom: 16, borderWidth: 1, borderColor: "rgba(201,160,53,0.34)", alignItems: "flex-end" },
  heroIcon: { width: 52, height: 52, borderRadius: 17, backgroundColor: "rgba(255,255,255,0.08)", borderWidth: 1, borderColor: C.gold, alignItems: "center", justifyContent: "center", marginBottom: 15 },
  eyebrow: { fontSize: 10, color: C.gold, fontFamily: "Inter_600SemiBold", marginBottom: 6 },
  heroTitle: { fontSize: 23, lineHeight: 31, color: "#fff", fontFamily: "Inter_700Bold", textAlign: "right" },
  heroText: { fontSize: 12, lineHeight: 20, color: "rgba(255,255,255,0.72)", fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 8 },
  heroTags: { flexDirection: "row", gap: 7, marginTop: 14 },
  status: { borderRadius: 10, borderWidth: 1, paddingHorizontal: 9, paddingVertical: 5 },
  statusText: { fontSize: 9, fontFamily: "Inter_700Bold" },
  section: { backgroundColor: C.card, borderRadius: 20, padding: 15, borderWidth: 1, borderColor: C.border, marginBottom: 14 },
  sectionHeader: { flexDirection: "row", alignItems: "center", marginBottom: 13 },
  sectionIcon: { width: 42, height: 42, borderRadius: 14, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  sectionHeadCopy: { flex: 1, alignItems: "flex-end" },
  sectionTitle: { fontSize: 16, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right" },
  sectionSubtitle: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  action: { minHeight: 68, borderRadius: 15, borderWidth: 1, flexDirection: "row", alignItems: "center", padding: 10, marginBottom: 8, opacity: 0.94 },
  actionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginLeft: 10 },
  actionCopy: { flex: 1, alignItems: "flex-end" },
  actionTitle: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "right" },
  actionSubtitle: { fontSize: 9, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 3 },
  comingSoon: { backgroundColor: "rgba(15,35,63,0.07)", borderRadius: 8, paddingHorizontal: 7, paddingVertical: 4 },
  comingSoonText: { fontSize: 8, color: C.mutedForeground, fontFamily: "Inter_600SemiBold" },
  choiceRow: { flexDirection: "row", gap: 9, marginBottom: 9 },
  choiceCard: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 14, padding: 13, alignItems: "flex-end", backgroundColor: "#FAFBFD" },
  choiceTitle: { fontSize: 18, color: C.gold, fontFamily: "Inter_700Bold" },
  choiceName: { fontSize: 11, color: C.foreground, fontFamily: "Inter_700Bold", textAlign: "right", marginTop: 3 },
  choiceText: { fontSize: 9, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: 4 },
  securityNote: { flexDirection: "row", alignItems: "center", gap: 7, backgroundColor: "#F5F7FA", borderRadius: 12, padding: 10 },
  securityText: { flex: 1, fontSize: 9, lineHeight: 16, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  milestones: { flexDirection: "row", gap: 8, marginBottom: 9 },
  milestone: { flex: 1, backgroundColor: "#FAFBFD", borderRadius: 14, borderWidth: 1, borderColor: C.border, padding: 10, alignItems: "flex-end" },
  milestoneNumber: { fontSize: 8, color: C.mutedForeground, fontFamily: "Inter_600SemiBold" },
  milestonePercent: { fontSize: 20, color: C.gold, fontFamily: "Inter_700Bold", marginTop: 4 },
  milestoneTitle: { fontSize: 9, lineHeight: 14, color: C.foreground, fontFamily: "Inter_600SemiBold", textAlign: "right", marginTop: 2 },
  privacyBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#F1F5FA", borderWidth: 1, borderColor: "#CBD5E1", borderRadius: 13, padding: 11 },
  privacyText: { flex: 1, fontSize: 10, lineHeight: 17, color: C.navy, fontFamily: "Inter_500Medium", textAlign: "right" },
  deliveryGrid: { gap: 8 },
  deliveryCard: { borderRadius: 14, borderWidth: 1, borderColor: C.border, backgroundColor: "#FAFBFD", padding: 12, alignItems: "flex-end" },
  deliveryInternational: { backgroundColor: "#F7F2FF", borderColor: "#D7C7FF" },
  deliveryCode: { fontSize: 17, color: C.gold, fontFamily: "Inter_700Bold" },
  deliveryTitle: { fontSize: 11, color: C.foreground, fontFamily: "Inter_700Bold", marginTop: 2 },
  deliveryText: { fontSize: 9, color: C.mutedForeground, fontFamily: "Inter_400Regular", marginTop: 2 },
  footer: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, marginTop: 2 },
  footerText: { flex: 1, fontSize: 9, lineHeight: 16, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
});
