import { Feather } from "@expo/vector-icons";
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
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

const SPECIALIZATIONS = [
  "قانون تجاري",
  "قانون جنائي",
  "أحوال شخصية وأسرة",
  "قانون عقاري",
  "قانون عمالي",
  "قانون مدني",
  "قانون إداري",
  "ملكية فكرية",
];

function verifyLicense(number: string, country: "qatar" | "jordan"): boolean {
  const n = number.trim().toUpperCase();
  if (country === "qatar") {
    return /^QAT-\d{5}$/.test(n) || /^\d{5,8}$/.test(number.trim());
  }
  return /^JOR-\d{5}$/.test(n) || /^\d{5,8}$/.test(number.trim());
}

export default function RegisterLawyer() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerLawyer } = useAuth();
  const { prefillEmail } = useLocalSearchParams<{ prefillEmail?: string }>();

  const [form, setForm] = useState({
    name: "",
    email: prefillEmail ?? "",
    password: "",
    phone: "",
    country: "qatar" as "qatar" | "jordan",
    specialization: "",
    licenseNumber: "",
    bio: "",
    experience: "",
    hourlyRate: "",
  });
  const [licenseState, setLicenseState] = useState<"idle" | "checking" | "valid" | "invalid">("idle");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === "licenseNumber") setLicenseState("idle");
  }

  async function checkLicense() {
    if (!form.licenseNumber) {
      setError("يرجى إدخال رقم الترخيص");
      return;
    }
    setLicenseState("checking");
    await new Promise((r) => setTimeout(r, 1500));
    const valid = verifyLicense(form.licenseNumber, form.country);
    setLicenseState(valid ? "valid" : "invalid");
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password || !form.phone || !form.specialization || !form.licenseNumber || !form.bio) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    if (licenseState !== "valid") {
      setError("يرجى التحقق من رقم الترخيص أولاً");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await registerLawyer({
        ...form,
        experience: parseInt(form.experience) || 1,
        hourlyRate: parseInt(form.hourlyRate) || 150,
      });
      router.replace("/");
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
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
            paddingTop: insets.top + (Platform.OS === "web" ? 67 : 20),
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 20),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={C.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>تسجيل محامٍ جديد</Text>
          <Text style={styles.sub}>انضم إلى شبكة المحامين المعتمدين في مستشارك</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>المعلومات الشخصية</Text>
        </View>

        <View style={styles.form}>
          <Field label="الاسم الكامل" icon="user">
            <TextInput style={styles.input} placeholder="د. أحمد المحمود" value={form.name} onChangeText={(v) => set("name", v)} placeholderTextColor={C.mutedForeground} />
          </Field>
          <Field label="البريد الإلكتروني" icon="mail">
            <TextInput style={styles.input} placeholder="lawyer@example.com" value={form.email} onChangeText={(v) => set("email", v)} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={C.mutedForeground} />
          </Field>
          <Field label="كلمة المرور" icon="lock">
            <TextInput style={styles.input} placeholder="••••••••" value={form.password} onChangeText={(v) => set("password", v)} secureTextEntry placeholderTextColor={C.mutedForeground} />
          </Field>
          <Field label="رقم الجوال" icon="phone">
            <TextInput style={styles.input} placeholder="+974 55 000 000" value={form.phone} onChangeText={(v) => set("phone", v)} keyboardType="phone-pad" placeholderTextColor={C.mutedForeground} />
          </Field>

          <View style={styles.field}>
            <Text style={styles.label}>الدولة</Text>
            <View style={styles.countryRow}>
              {(["qatar", "jordan"] as const).map((c) => (
                <TouchableOpacity key={c} style={[styles.countryBtn, form.country === c && styles.countryBtnActive]} onPress={() => { set("country", c); setLicenseState("idle"); }}>
                  <Text style={styles.countryBtnText}>{c === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن"}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <View style={styles.sectionTitle}>
          <Text style={styles.sectionTitleText}>التخصص والترخيص</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.field}>
            <Text style={styles.label}>التخصص القانوني</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.specRow}>
                {SPECIALIZATIONS.map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.specChip, form.specialization === s && styles.specChipActive]}
                    onPress={() => set("specialization", s)}
                  >
                    <Text style={[styles.specChipText, form.specialization === s && styles.specChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>
              رقم الترخيص{" "}
              <Text style={styles.labelHint}>
                ({form.country === "qatar" ? "مثال: QAT-12345 أو 5 أرقام" : "مثال: JOR-12345 أو 5 أرقام"})
              </Text>
            </Text>
            <View style={styles.licenseRow}>
              <View style={[styles.inputRow, styles.licenseInput, licenseState === "valid" && styles.inputValid, licenseState === "invalid" && styles.inputInvalid]}>
                <Feather name="file-text" size={16} color={
                  licenseState === "valid" ? C.success
                  : licenseState === "invalid" ? C.destructive
                  : C.mutedForeground
                } />
                <TextInput
                  style={styles.input}
                  placeholder={form.country === "qatar" ? "QAT-12345" : "JOR-12345"}
                  value={form.licenseNumber}
                  onChangeText={(v) => set("licenseNumber", v)}
                  autoCapitalize="characters"
                  placeholderTextColor={C.mutedForeground}
                />
                {licenseState === "valid" && <Feather name="check-circle" size={18} color={C.success} />}
                {licenseState === "invalid" && <Feather name="x-circle" size={18} color={C.destructive} />}
              </View>
              <TouchableOpacity
                style={[styles.verifyBtn, licenseState === "checking" && { opacity: 0.7 }]}
                onPress={checkLicense}
                disabled={licenseState === "checking"}
              >
                {licenseState === "checking" ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.verifyText}>تحقق</Text>
                )}
              </TouchableOpacity>
            </View>
            {licenseState === "valid" && (
              <View style={styles.licenseSuccess}>
                <Feather name="check-circle" size={13} color={C.success} />
                <Text style={styles.licenseSuccessText}>تم التحقق من الترخيص بنجاح</Text>
              </View>
            )}
            {licenseState === "invalid" && (
              <View style={styles.licenseError}>
                <Feather name="alert-circle" size={13} color={C.destructive} />
                <Text style={styles.licenseErrorText}>رقم الترخيص غير صحيح. يرجى التحقق من الصيغة</Text>
              </View>
            )}
          </View>

          <Field label="سنوات الخبرة" icon="briefcase">
            <TextInput style={styles.input} placeholder="10" value={form.experience} onChangeText={(v) => set("experience", v)} keyboardType="number-pad" placeholderTextColor={C.mutedForeground} />
          </Field>

          <Field label="السعر بالساعة (ر)" icon="dollar-sign">
            <TextInput style={styles.input} placeholder="200" value={form.hourlyRate} onChangeText={(v) => set("hourlyRate", v)} keyboardType="number-pad" placeholderTextColor={C.mutedForeground} />
          </Field>

          <View style={styles.field}>
            <Text style={styles.label}>نبذة مختصرة</Text>
            <TextInput
              style={[styles.inputRow, styles.textArea]}
              placeholder="اكتب نبذة تعريفية عنك وعن خبراتك القانونية..."
              value={form.bio}
              onChangeText={(v) => set("bio", v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              placeholderTextColor={C.mutedForeground}
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, (loading || licenseState !== "valid") && { opacity: 0.6 }]}
          onPress={handleRegister}
          disabled={loading || licenseState !== "valid"}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>إنشاء حساب المحامي</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, icon, children }: { label: string; icon: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <View style={styles.inputRow}>
        <Feather name={icon as any} size={16} color={C.mutedForeground} />
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 20 },
  header: { gap: 6, marginBottom: 24 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "right" },
  sub: { fontSize: 13, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },
  errorBox: { backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 16 },
  errorText: { color: C.destructive, fontFamily: "Inter_500Medium", fontSize: 13, textAlign: "right" },
  sectionTitle: { borderLeftWidth: 3, borderLeftColor: C.navy, paddingLeft: 10, marginBottom: 16, marginTop: 8 },
  sectionTitleText: { fontSize: 15, fontFamily: "Inter_700Bold", color: C.navy, textAlign: "right" },
  form: { gap: 14, marginBottom: 20 },
  field: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  labelHint: { fontSize: 11, color: C.mutedForeground, fontFamily: "Inter_400Regular" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right" },
  inputValid: { borderColor: C.success, backgroundColor: "#F0FDF4" },
  inputInvalid: { borderColor: C.destructive, backgroundColor: "#FFF5F5" },
  textArea: { alignItems: "flex-start", paddingTop: 12, minHeight: 96 },
  countryRow: { flexDirection: "row", gap: 10 },
  countryBtn: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 10, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  countryBtnActive: { borderColor: C.navy, backgroundColor: "#EEF2F8" },
  countryBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: C.foreground },
  specRow: { flexDirection: "row", gap: 8, paddingVertical: 4 },
  specChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.card },
  specChipActive: { borderColor: C.navy, backgroundColor: C.navy },
  specChipText: { fontSize: 13, fontFamily: "Inter_500Medium", color: C.foreground },
  specChipTextActive: { color: "#fff" },
  licenseRow: { flexDirection: "row", gap: 10 },
  licenseInput: { flex: 1 },
  verifyBtn: { backgroundColor: C.navy, borderRadius: 10, paddingHorizontal: 16, alignItems: "center", justifyContent: "center", minWidth: 72 },
  verifyText: { color: "#fff", fontFamily: "Inter_700Bold", fontSize: 13 },
  licenseSuccess: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  licenseSuccessText: { fontSize: 12, color: C.success, fontFamily: "Inter_500Medium" },
  licenseError: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 4 },
  licenseErrorText: { fontSize: 12, color: C.destructive, fontFamily: "Inter_500Medium" },
  btn: { backgroundColor: C.navy, borderRadius: colors.radius, paddingVertical: 16, alignItems: "center", marginBottom: 8 },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
});
