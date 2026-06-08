import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useData } from "@/contexts/DataContext";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

type PayMethod = "card" | "apple" | "google" | "himyan" | "cliq";

export default function Payment() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { bookConsultation } = useData();

  const params = useLocalSearchParams<{
    lawyerId: string;
    lawyerName: string;
    lawyerSpecialization: string;
    lawyerCountry: string;
    subject: string;
    description: string;
    date: string;
    time: string;
    type: string;
    price: string;
    attachments: string;
  }>();

  const country = (params.lawyerCountry ?? "qatar") as "qatar" | "jordan";
  const price = parseInt(params.price ?? "0");
  const currency = country === "qatar" ? "ر.ق" : "د.أ";
  const isQatar = country === "qatar";

  const [method, setMethod] = useState<PayMethod>("card");
  const [card, setCard] = useState({ number: "", expiry: "", cvv: "", name: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  function formatCardNumber(v: string) {
    return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  }
  function formatExpiry(v: string) {
    const d = v.replace(/\D/g, "").slice(0, 4);
    return d.length > 2 ? d.slice(0, 2) + "/" + d.slice(2) : d;
  }

  async function handlePay() {
    if (method === "card") {
      const rawNum = card.number.replace(/\s/g, "");
      if (rawNum.length < 16) { return; }
      if (card.expiry.length < 5) { return; }
      if (card.cvv.length < 3) { return; }
      if (!card.name.trim()) { return; }
    }
    if (!user) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1800));
      await bookConsultation({
        clientId: user.id,
        clientName: user.name,
        lawyerId: params.lawyerId ?? "",
        lawyerName: params.lawyerName ?? "",
        lawyerSpecialization: params.lawyerSpecialization ?? "",
        lawyerCountry: country,
        subject: params.subject ?? "",
        description: params.description ?? "",
        date: params.date ?? "",
        time: params.time ?? "",
        type: (params.type ?? "video") as "video" | "phone" | "chat",
        price,
      });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return <SuccessScreen price={price} currency={currency} method={method} onDone={() => router.replace("/(client)")} />;
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: C.background }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 12),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 32),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-right" size={22} color={C.foreground} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>إتمام الدفع</Text>
            <Text style={styles.headerSub}>استشارة آمنة ومشفرة</Text>
          </View>
          <View style={styles.secureIcon}>
            <Feather name="lock" size={16} color={C.gold} />
          </View>
        </View>

        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryTop}>
            <View style={styles.summaryAvatar}>
              <Text style={styles.summaryAvatarText}>
                {(params.lawyerName ?? "م").charAt(0)}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.summaryLawyerName}>{params.lawyerName}</Text>
              <Text style={styles.summarySpec}>{params.lawyerSpecialization}</Text>
              <Text style={styles.summaryCountry}>
                {isQatar ? "🇶🇦 قطر" : "🇯🇴 الأردن"}
              </Text>
            </View>
          </View>

          <View style={styles.summaryDivider} />

          <View style={styles.summaryRows}>
            <SummaryRow icon="file-text" label="الموضوع" value={params.subject ?? ""} />
            <SummaryRow icon="calendar" label="التاريخ" value={params.date ?? ""} />
            <SummaryRow icon="clock" label="الوقت" value={params.time ?? ""} />
            <SummaryRow
              icon="video"
              label="النوع"
              value={
                params.type === "video" ? "مكالمة فيديو"
                : params.type === "phone" ? "مكالمة هاتفية"
                : "محادثة نصية"
              }
            />
          </View>

          <View style={styles.totalBox}>
            <Text style={styles.totalLabel}>إجمالي المبلغ</Text>
            <View style={styles.totalRight}>
              <Text style={styles.totalAmount}>{price}</Text>
              <Text style={styles.totalCurrency}>{currency}</Text>
            </View>
          </View>
        </View>

        {/* Payment Methods */}
        <Text style={styles.sectionTitle}>طريقة الدفع</Text>

        <View style={styles.methodsGrid}>
          {/* Apple Pay */}
          <MethodCard
            id="apple"
            active={method === "apple"}
            onPress={() => setMethod("apple")}
            label="Apple Pay"
            sublabel="ادفع بلمسة"
            icon="smartphone"
            iconColor="#000"
            badge="سريع"
          />
          {/* Google Pay */}
          <MethodCard
            id="google"
            active={method === "google"}
            onPress={() => setMethod("google")}
            label="Google Pay"
            sublabel="ادفع بسرعة"
            icon="credit-card"
            iconColor="#4285F4"
            badge="سريع"
          />
          {/* Credit Card */}
          <MethodCard
            id="card"
            active={method === "card"}
            onPress={() => setMethod("card")}
            label="بطاقة ائتمانية"
            sublabel="Visa / Mastercard"
            icon="credit-card"
            iconColor={C.navy}
          />
          {/* Himyan or CliQ */}
          {isQatar ? (
            <MethodCard
              id="himyan"
              active={method === "himyan"}
              onPress={() => setMethod("himyan")}
              label="هميان"
              sublabel="المحفظة الوطنية"
              icon="shield"
              iconColor="#006B3F"
              badge="قطر"
            />
          ) : (
            <MethodCard
              id="cliq"
              active={method === "cliq"}
              onPress={() => setMethod("cliq")}
              label="CliQ"
              sublabel="الدفع الفوري"
              icon="zap"
              iconColor="#007DC5"
              badge="الأردن"
            />
          )}
        </View>

        {/* Credit Card Form */}
        {method === "card" && (
          <View style={styles.cardForm}>
            <View style={styles.cardFormHeader}>
              <Feather name="credit-card" size={16} color={C.navy} />
              <Text style={styles.cardFormTitle}>بيانات البطاقة</Text>
            </View>

            {/* Visual card preview */}
            <View style={styles.cardPreview}>
              <View style={styles.cardChip}>
                <View style={styles.cardChipInner} />
              </View>
              <Text style={styles.cardPreviewNumber}>
                {card.number || "•••• •••• •••• ••••"}
              </Text>
              <View style={styles.cardPreviewBottom}>
                <View>
                  <Text style={styles.cardPreviewLabel}>اسم حامل البطاقة</Text>
                  <Text style={styles.cardPreviewValue}>
                    {card.name || "الاسم الكامل"}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={styles.cardPreviewLabel}>تاريخ الانتهاء</Text>
                  <Text style={styles.cardPreviewValue}>
                    {card.expiry || "MM/YY"}
                  </Text>
                </View>
              </View>
              <View style={styles.cardNetworkBadge}>
                <View style={styles.visaCircle1} />
                <View style={styles.visaCircle2} />
              </View>
            </View>

            <View style={styles.cardFields}>
              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>رقم البطاقة</Text>
                <View style={styles.cardFieldInput}>
                  <Feather name="credit-card" size={14} color={C.mutedForeground} />
                  <TextInput
                    style={styles.cardInput}
                    placeholder="0000 0000 0000 0000"
                    value={card.number}
                    onChangeText={(v) => setCard({ ...card, number: formatCardNumber(v) })}
                    keyboardType="number-pad"
                    maxLength={19}
                    placeholderTextColor={C.mutedForeground}
                  />
                </View>
              </View>

              <View style={styles.cardRowFields}>
                <View style={[styles.cardField, { flex: 1 }]}>
                  <Text style={styles.cardFieldLabel}>تاريخ الانتهاء</Text>
                  <View style={styles.cardFieldInput}>
                    <Feather name="calendar" size={14} color={C.mutedForeground} />
                    <TextInput
                      style={styles.cardInput}
                      placeholder="MM/YY"
                      value={card.expiry}
                      onChangeText={(v) => setCard({ ...card, expiry: formatExpiry(v) })}
                      keyboardType="number-pad"
                      maxLength={5}
                      placeholderTextColor={C.mutedForeground}
                    />
                  </View>
                </View>
                <View style={[styles.cardField, { flex: 1 }]}>
                  <Text style={styles.cardFieldLabel}>CVV</Text>
                  <View style={styles.cardFieldInput}>
                    <Feather name="lock" size={14} color={C.mutedForeground} />
                    <TextInput
                      style={styles.cardInput}
                      placeholder="•••"
                      value={card.cvv}
                      onChangeText={(v) => setCard({ ...card, cvv: v.replace(/\D/g, "").slice(0, 4) })}
                      keyboardType="number-pad"
                      maxLength={4}
                      secureTextEntry
                      placeholderTextColor={C.mutedForeground}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.cardField}>
                <Text style={styles.cardFieldLabel}>اسم حامل البطاقة</Text>
                <View style={styles.cardFieldInput}>
                  <Feather name="user" size={14} color={C.mutedForeground} />
                  <TextInput
                    style={styles.cardInput}
                    placeholder="الاسم كما يظهر على البطاقة"
                    value={card.name}
                    onChangeText={(v) => setCard({ ...card, name: v })}
                    autoCapitalize="words"
                    placeholderTextColor={C.mutedForeground}
                  />
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Instant-pay info */}
        {(method === "apple" || method === "google") && (
          <View style={styles.instantPayInfo}>
            <Feather name="zap" size={20} color={C.gold} />
            <View style={{ flex: 1 }}>
              <Text style={styles.instantTitle}>
                {method === "apple" ? "Apple Pay جاهز" : "Google Pay جاهز"}
              </Text>
              <Text style={styles.instantSub}>
                سيتم تأكيد الدفع بصمة إصبعك أو رمز الجهاز
              </Text>
            </View>
          </View>
        )}

        {(method === "himyan") && (
          <View style={[styles.instantPayInfo, { borderColor: "#006B3F40" }]}>
            <View style={[styles.localPayIcon, { backgroundColor: "#006B3F20" }]}>
              <Text style={{ fontSize: 18 }}>🇶🇦</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instantTitle}>بطاقة هميان</Text>
              <Text style={styles.instantSub}>المحفظة الرقمية الوطنية القطرية — آمنة ومعتمدة</Text>
            </View>
          </View>
        )}

        {(method === "cliq") && (
          <View style={[styles.instantPayInfo, { borderColor: "#007DC540" }]}>
            <View style={[styles.localPayIcon, { backgroundColor: "#007DC520" }]}>
              <Text style={{ fontSize: 18 }}>🇯🇴</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.instantTitle}>CliQ — الدفع الفوري</Text>
              <Text style={styles.instantSub}>نظام الدفع الفوري التابع لبنك الأردن المركزي</Text>
            </View>
          </View>
        )}

        {/* Security strip */}
        <View style={styles.securityStrip}>
          <Feather name="shield" size={12} color={C.success} />
          <Text style={styles.securityText}>مدفوعاتك محمية بتشفير SSL 256-bit</Text>
          <Feather name="lock" size={12} color={C.success} />
        </View>

        {/* Pay Button */}
        <TouchableOpacity
          style={[styles.payBtn, loading && { opacity: 0.75 }]}
          onPress={handlePay}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <View style={styles.payBtnInner}>
              <ActivityIndicator color={C.navy} />
              <Text style={styles.payBtnText}>جارٍ تأكيد الدفع...</Text>
            </View>
          ) : (
            <View style={styles.payBtnInner}>
              <Feather name="lock" size={18} color={C.navy} />
              <Text style={styles.payBtnText}>
                ادفع الآن · {price} {currency}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <Text style={styles.termsNote}>
          بالدفع أنت توافق على شروط الخدمة وسياسة الاسترداد
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function SummaryRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryRowValue}>{value}</Text>
      <View style={styles.summaryRowLeft}>
        <Feather name={icon as any} size={13} color={C.mutedForeground} />
        <Text style={styles.summaryRowLabel}>{label}</Text>
      </View>
    </View>
  );
}

function MethodCard({
  id, active, onPress, label, sublabel, icon, iconColor, badge,
}: {
  id: PayMethod; active: boolean; onPress: () => void;
  label: string; sublabel: string; icon: string; iconColor: string; badge?: string;
}) {
  return (
    <TouchableOpacity
      style={[styles.methodCard, active && styles.methodCardActive]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {active && (
        <View style={styles.methodCheck}>
          <Feather name="check" size={10} color="#fff" />
        </View>
      )}
      <View style={[styles.methodIconWrap, { backgroundColor: iconColor + "18" }]}>
        <Feather name={icon as any} size={20} color={iconColor} />
      </View>
      <Text style={[styles.methodLabel, active && styles.methodLabelActive]}>{label}</Text>
      <Text style={styles.methodSub}>{sublabel}</Text>
      {badge && (
        <View style={styles.methodBadge}>
          <Text style={styles.methodBadgeText}>{badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

function SuccessScreen({ price, currency, method, onDone }: {
  price: number; currency: string; method: PayMethod; onDone: () => void;
}) {
  const insets = useSafeAreaInsets();
  const methodLabel =
    method === "apple" ? "Apple Pay" :
    method === "google" ? "Google Pay" :
    method === "card" ? "بطاقة ائتمانية" :
    method === "himyan" ? "هميان" : "CliQ";

  return (
    <View style={[styles.successWrap, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 32 }]}>
      <View style={styles.successIconWrap}>
        <View style={styles.successIconOuter}>
          <View style={styles.successIconInner}>
            <Feather name="check" size={36} color="#fff" />
          </View>
        </View>
      </View>
      <Text style={styles.successTitle}>تم الدفع بنجاح! 🎉</Text>
      <Text style={styles.successSub}>
        تم إرسال طلب الاستشارة إلى المحامي{"\n"}سيتم إبلاغك فور الموافقة
      </Text>
      <View style={styles.successAmountBox}>
        <Text style={styles.successAmountLabel}>المبلغ المدفوع</Text>
        <Text style={styles.successAmount}>{price} {currency}</Text>
        <Text style={styles.successMethod}>عبر {methodLabel}</Text>
      </View>
      <View style={styles.successDetails}>
        {[
          { icon: "shield", text: "الدفع آمن ومشفر" },
          { icon: "bell", text: "ستصلك إشعار بالموافقة" },
          { icon: "message-circle", text: "يمكنك التواصل مع المحامي قريباً" },
        ].map((item) => (
          <View key={item.text} style={styles.successDetailRow}>
            <Feather name={item.icon as any} size={14} color={C.success} />
            <Text style={styles.successDetailText}>{item.text}</Text>
          </View>
        ))}
      </View>
      <TouchableOpacity style={styles.successBtn} onPress={onDone} activeOpacity={0.85}>
        <Text style={styles.successBtnText}>العودة إلى الرئيسية</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 20 },

  // Header
  header: { flexDirection: "row", alignItems: "center", marginBottom: 20, gap: 12 },
  backBtn: { padding: 4 },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold", color: C.foreground },
  headerSub: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  secureIcon: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(201,160,53,0.1)",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.25)",
    alignItems: "center", justifyContent: "center",
  },

  // Summary
  summaryCard: {
    backgroundColor: C.navy, borderRadius: 20, padding: 20,
    marginBottom: 24, gap: 0,
  },
  summaryTop: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },
  summaryAvatar: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: "rgba(201,160,53,0.2)",
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.gold,
  },
  summaryAvatarText: { fontSize: 22, color: "#fff", fontFamily: "Inter_700Bold" },
  summaryLawyerName: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff" },
  summarySpec: { fontSize: 12, color: C.gold, fontFamily: "Inter_500Medium" },
  summaryCountry: { fontSize: 11, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  summaryDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.1)", marginBottom: 14 },
  summaryRows: { gap: 8, marginBottom: 16 },
  summaryRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  summaryRowLeft: { flexDirection: "row", alignItems: "center", gap: 5 },
  summaryRowLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  summaryRowValue: { fontSize: 13, color: "#fff", fontFamily: "Inter_500Medium", textAlign: "right", flex: 1, marginLeft: 20 },
  totalBox: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    backgroundColor: "rgba(201,160,53,0.15)",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.3)",
    borderRadius: 14, paddingHorizontal: 16, paddingVertical: 12,
  },
  totalLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "rgba(255,255,255,0.8)" },
  totalRight: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  totalAmount: { fontSize: 28, fontFamily: "Inter_700Bold", color: C.gold },
  totalCurrency: { fontSize: 14, color: C.gold, fontFamily: "Inter_500Medium" },

  // Methods
  sectionTitle: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right", marginBottom: 12 },
  methodsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 20 },
  methodCard: {
    width: "47.5%", alignItems: "center", gap: 6, paddingVertical: 16, paddingHorizontal: 12,
    borderRadius: 14, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.card, position: "relative",
  },
  methodCardActive: { borderColor: C.navy, backgroundColor: "#EEF2F8" },
  methodCheck: {
    position: "absolute", top: 8, left: 8,
    width: 18, height: 18, borderRadius: 9,
    backgroundColor: C.navy, alignItems: "center", justifyContent: "center",
  },
  methodIconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  methodLabel: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.foreground },
  methodLabelActive: { color: C.navy },
  methodSub: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center" },
  methodBadge: {
    backgroundColor: "rgba(201,160,53,0.15)", borderRadius: 8,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  methodBadgeText: { fontSize: 9, color: C.gold, fontFamily: "Inter_700Bold" },

  // Card Form
  cardForm: {
    backgroundColor: C.card, borderRadius: 16,
    borderWidth: 1, borderColor: C.border,
    padding: 16, marginBottom: 16, gap: 14,
  },
  cardFormHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardFormTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.navy },
  cardPreview: {
    backgroundColor: C.navy, borderRadius: 16, padding: 20,
    height: 160, justifyContent: "space-between",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.3)",
  },
  cardChip: {
    width: 36, height: 28, borderRadius: 6,
    backgroundColor: C.gold, overflow: "hidden", alignSelf: "flex-end",
    alignItems: "center", justifyContent: "center",
  },
  cardChipInner: {
    width: 20, height: 16, borderRadius: 3,
    borderWidth: 1.5, borderColor: "rgba(0,0,0,0.3)",
  },
  cardPreviewNumber: { fontSize: 16, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 2, textAlign: "center" },
  cardPreviewBottom: { flexDirection: "row", justifyContent: "space-between" },
  cardPreviewLabel: { fontSize: 9, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  cardPreviewValue: { fontSize: 13, color: "#fff", fontFamily: "Inter_600SemiBold" },
  cardNetworkBadge: { position: "absolute", top: 16, left: 16, flexDirection: "row" },
  visaCircle1: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#EB001B", opacity: 0.9 },
  visaCircle2: { width: 24, height: 24, borderRadius: 12, backgroundColor: "#F79E1B", opacity: 0.9, marginLeft: -8 },
  cardFields: { gap: 12 },
  cardRowFields: { flexDirection: "row", gap: 12 },
  cardField: { gap: 5 },
  cardFieldLabel: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  cardFieldInput: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: C.background, borderRadius: 10,
    borderWidth: 1.5, borderColor: C.border,
    paddingHorizontal: 12, paddingVertical: 11,
  },
  cardInput: { flex: 1, fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right" },

  // Instant pay
  instantPayInfo: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "rgba(201,160,53,0.07)",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.25)",
    borderRadius: 14, padding: 14, marginBottom: 16,
  },
  localPayIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  instantTitle: { fontSize: 14, fontFamily: "Inter_700Bold", color: C.foreground },
  instantSub: { fontSize: 12, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Security
  securityStrip: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, marginBottom: 16,
  },
  securityText: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },

  // Pay Button
  payBtn: {
    backgroundColor: C.gold, borderRadius: 16,
    paddingVertical: 17, marginBottom: 12,
  },
  payBtnInner: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10 },
  payBtnText: { color: C.navy, fontSize: 17, fontFamily: "Inter_700Bold" },
  termsNote: { fontSize: 11, color: C.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular" },

  // Success
  successWrap: { flex: 1, backgroundColor: C.background, alignItems: "center", paddingHorizontal: 28, gap: 0 },
  successIconWrap: { marginBottom: 24 },
  successIconOuter: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "rgba(16,185,129,0.12)",
    alignItems: "center", justifyContent: "center",
  },
  successIconInner: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: C.success,
    alignItems: "center", justifyContent: "center",
  },
  successTitle: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "center" },
  successSub: { fontSize: 14, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22, marginTop: 8, marginBottom: 24 },
  successAmountBox: {
    width: "100%", backgroundColor: C.navy, borderRadius: 20,
    padding: 20, alignItems: "center", marginBottom: 24,
    gap: 4,
  },
  successAmountLabel: { fontSize: 12, color: "rgba(255,255,255,0.5)", fontFamily: "Inter_400Regular" },
  successAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: C.gold },
  successMethod: { fontSize: 12, color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" },
  successDetails: { width: "100%", gap: 12, marginBottom: 32 },
  successDetailRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  successDetailText: { fontSize: 14, color: C.foreground, fontFamily: "Inter_400Regular" },
  successBtn: {
    width: "100%", backgroundColor: C.navy,
    borderRadius: 16, paddingVertical: 16, alignItems: "center",
    borderWidth: 1, borderColor: "rgba(201,160,53,0.3)",
  },
  successBtnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
