import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
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

type Step = "email" | "otp";

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestPasswordReset, resetPassword } = useAuth();

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpCode, setOtpCode] = useState(""); // the generated code shown to user
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const otpRefs = useRef<Array<TextInput | null>>([]);

  async function handleRequestOtp() {
    if (!email.trim()) {
      setError("يرجى إدخال البريد الإلكتروني");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const code = await requestPasswordReset(email.trim());
      setOtpCode(code);
      setStep("otp");
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  function handleOtpChange(val: string, idx: number) {
    const cleaned = val.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp];
    next[idx] = cleaned;
    setOtp(next);
    if (cleaned && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  }

  function handleOtpKeyPress(key: string, idx: number) {
    if (key === "Backspace" && !otp[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  }

  async function handleResetPassword() {
    const enteredOtp = otp.join("");
    if (enteredOtp.length < 6) {
      setError("يرجى إدخال رمز التحقق المكوّن من 6 أرقام");
      return;
    }
    if (!newPassword) {
      setError("يرجى إدخال كلمة المرور الجديدة");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await resetPassword(email.trim(), enteredOtp, newPassword);
      setSuccess(true);
    } catch (e: any) {
      setError(e.message ?? "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <View style={[styles.successContainer, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 40) }]}>
        <View style={styles.successIcon}>
          <Feather name="check-circle" size={52} color={C.success} />
        </View>
        <Text style={styles.successTitle}>تم تغيير كلمة المرور</Text>
        <Text style={styles.successSub}>
          يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة
        </Text>
        <TouchableOpacity
          style={styles.successBtn}
          onPress={() => router.replace("/auth/login")}
          activeOpacity={0.85}
        >
          <Text style={styles.successBtnText}>الذهاب إلى تسجيل الدخول</Text>
        </TouchableOpacity>
      </View>
    );
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
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => (step === "otp" ? setStep("email") : router.back())}
        >
          <Feather name="arrow-right" size={22} color={C.foreground} />
        </TouchableOpacity>

        {/* Progress steps */}
        <View style={styles.steps}>
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, styles.stepDotActive]}>
              <Text style={styles.stepNum}>١</Text>
            </View>
            <Text style={[styles.stepLabel, styles.stepLabelActive]}>البريد</Text>
          </View>
          <View style={[styles.stepLine, step === "otp" && styles.stepLineActive]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepDot, step === "otp" && styles.stepDotActive]}>
              <Text style={[styles.stepNum, step === "otp" && styles.stepNumActive]}>٢</Text>
            </View>
            <Text style={[styles.stepLabel, step === "otp" && styles.stepLabelActive]}>
              التحقق
            </Text>
          </View>
        </View>

        {step === "email" ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconWrap}>
                <Feather name="lock" size={28} color={C.navy} />
              </View>
              <Text style={styles.title}>نسيت كلمة المرور؟</Text>
              <Text style={styles.sub}>
                أدخل بريدك الإلكتروني وسنُرسل لك رمز التحقق لاستعادة حسابك
              </Text>
            </View>

            {!!error && <ErrorBox message={error} />}

            <View style={styles.field}>
              <Text style={styles.label}>البريد الإلكتروني</Text>
              <View style={styles.inputRow}>
                <Feather name="mail" size={16} color={C.mutedForeground} />
                <TextInput
                  style={styles.input}
                  placeholder="email@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  placeholderTextColor={C.mutedForeground}
                  autoFocus
                />
              </View>
            </View>

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleRequestOtp}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>إرسال رمز التحقق</Text>
              )}
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <View style={[styles.iconWrap, styles.iconWrapOtp]}>
                <Feather name="message-square" size={28} color={C.gold} />
              </View>
              <Text style={styles.title}>أدخل رمز التحقق</Text>
              <Text style={styles.sub}>
                تم إرسال رمز التحقق إلى{"\n"}
                <Text style={styles.emailHighlight}>{email}</Text>
              </Text>
            </View>

            {/* Demo OTP display */}
            <View style={styles.demoOtpBox}>
              <Feather name="info" size={14} color={C.primary} />
              <View style={styles.demoOtpContent}>
                <Text style={styles.demoOtpTitle}>رمز التحقق التجريبي</Text>
                <Text style={styles.demoOtpCode}>{otpCode}</Text>
                <Text style={styles.demoOtpNote}>
                  (في النسخة الحقيقية سيُرسَل عبر البريد الإلكتروني)
                </Text>
              </View>
            </View>

            {!!error && <ErrorBox message={error} />}

            <View style={styles.otpSection}>
              <Text style={styles.label}>رمز التحقق (6 أرقام)</Text>
              <View style={styles.otpRow}>
                {otp.map((digit, idx) => (
                  <TextInput
                    key={idx}
                    ref={(r) => { otpRefs.current[idx] = r; }}
                    style={[styles.otpBox, digit ? styles.otpBoxFilled : null]}
                    value={digit}
                    onChangeText={(v) => handleOtpChange(v, idx)}
                    onKeyPress={({ nativeEvent }) => handleOtpKeyPress(nativeEvent.key, idx)}
                    keyboardType="number-pad"
                    maxLength={1}
                    selectTextOnFocus
                    textAlign="center"
                  />
                ))}
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>كلمة المرور الجديدة</Text>
              <View style={styles.inputRow}>
                <Feather name="lock" size={16} color={C.mutedForeground} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showPass}
                  placeholderTextColor={C.mutedForeground}
                />
                <TouchableOpacity onPress={() => setShowPass(!showPass)}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.field}>
              <Text style={styles.label}>تأكيد كلمة المرور</Text>
              <View style={styles.inputRow}>
                <Feather name="lock" size={16} color={C.mutedForeground} />
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirm}
                  placeholderTextColor={C.mutedForeground}
                />
                <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={16} color={C.mutedForeground} />
                </TouchableOpacity>
              </View>
            </View>

            {newPassword.length > 0 && (
              <PasswordStrength password={newPassword} />
            )}

            <TouchableOpacity
              style={[styles.btn, loading && { opacity: 0.7 }]}
              onPress={handleResetPassword}
              disabled={loading}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.btnText}>تغيير كلمة المرور</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.resendBtn}
              onPress={() => { setStep("email"); setOtp(["", "", "", "", "", ""]); setError(""); }}
            >
              <Text style={styles.resendText}>إعادة إرسال الرمز</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function ErrorBox({ message }: { message: string }) {
  return (
    <View style={styles.errorBox}>
      <Feather name="alert-circle" size={14} color={C.destructive} />
      <Text style={styles.errorText}>{message}</Text>
    </View>
  );
}

function PasswordStrength({ password }: { password: string }) {
  const len = password.length;
  const hasNum = /\d/.test(password);
  const hasMix = /[a-zA-Z]/.test(password) && hasNum;
  const score = len >= 8 ? (hasMix ? 3 : 2) : len >= 6 ? 1 : 0;
  const labels = ["ضعيفة", "مقبولة", "جيدة", "قوية"];
  const barColors = [C.destructive, C.warning, "#22C55E", C.success];

  return (
    <View style={styles.strengthWrap}>
      <View style={styles.strengthBars}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.strengthBar,
              { backgroundColor: i <= score - 1 ? barColors[score - 1] : C.border },
            ]}
          />
        ))}
      </View>
      <Text style={[styles.strengthLabel, { color: score > 0 ? barColors[score - 1] : C.mutedForeground }]}>
        {score > 0 ? `قوة كلمة المرور: ${labels[score - 1]}` : ""}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 20 },

  steps: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
    gap: 0,
  },
  stepItem: { alignItems: "center", gap: 4 },
  stepDot: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.muted, alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: C.border,
  },
  stepDotActive: { backgroundColor: C.navy, borderColor: C.navy },
  stepNum: { fontSize: 13, fontFamily: "Inter_700Bold", color: C.mutedForeground },
  stepNumActive: { color: "#fff" },
  stepLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: C.mutedForeground },
  stepLabelActive: { color: C.navy },
  stepLine: { width: 48, height: 2, backgroundColor: C.border, marginHorizontal: 8, marginBottom: 14 },
  stepLineActive: { backgroundColor: C.navy },

  header: { alignItems: "center", gap: 10, marginBottom: 28 },
  iconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "rgba(27,58,107,0.12)",
  },
  iconWrapOtp: { backgroundColor: "#FEF9EC", borderColor: "rgba(201,160,53,0.2)" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.foreground },
  sub: {
    fontSize: 14, color: C.mutedForeground, fontFamily: "Inter_400Regular",
    textAlign: "center", lineHeight: 22,
  },
  emailHighlight: { color: C.navy, fontFamily: "Inter_600SemiBold" },

  demoOtpBox: {
    flexDirection: "row", gap: 10, alignItems: "flex-start",
    backgroundColor: "#EEF2F8", borderRadius: 12, padding: 14,
    borderWidth: 1, borderColor: "#D6E0F0", marginBottom: 20,
  },
  demoOtpContent: { flex: 1, gap: 2 },
  demoOtpTitle: { fontSize: 12, color: C.primary, fontFamily: "Inter_600SemiBold", textAlign: "right" },
  demoOtpCode: { fontSize: 26, fontFamily: "Inter_700Bold", color: C.navy, letterSpacing: 6, textAlign: "right" },
  demoOtpNote: { fontSize: 10, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "right" },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 16,
  },
  errorText: { color: C.destructive, fontFamily: "Inter_500Medium", fontSize: 13, flex: 1, textAlign: "right" },

  field: { gap: 6, marginBottom: 14 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: C.foreground, textAlign: "right" },
  inputRow: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: C.card, borderRadius: 10, borderWidth: 1, borderColor: C.border,
    paddingHorizontal: 14, paddingVertical: 14,
  },
  input: { flex: 1, fontSize: 15, color: C.foreground, fontFamily: "Inter_400Regular", textAlign: "right" },

  otpSection: { gap: 10, marginBottom: 20 },
  otpRow: { flexDirection: "row", gap: 10, justifyContent: "center" },
  otpBox: {
    width: 46, height: 56, borderRadius: 12, borderWidth: 2, borderColor: C.border,
    backgroundColor: C.card, fontSize: 22, fontFamily: "Inter_700Bold", color: C.foreground,
    textAlign: "center",
  },
  otpBoxFilled: { borderColor: C.navy, backgroundColor: "#EEF2F8" },

  strengthWrap: { marginBottom: 14, gap: 6 },
  strengthBars: { flexDirection: "row", gap: 4 },
  strengthBar: { flex: 1, height: 4, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "right" },

  btn: {
    backgroundColor: C.navy, borderRadius: colors.radius,
    paddingVertical: 16, alignItems: "center", marginBottom: 12,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },

  resendBtn: { alignItems: "center", paddingVertical: 10 },
  resendText: { fontSize: 14, color: C.primary, fontFamily: "Inter_500Medium" },

  successContainer: {
    flex: 1, backgroundColor: C.background,
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 32, gap: 16,
  },
  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: "#ECFDF5", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#D1FAE5",
  },
  successTitle: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.foreground },
  successSub: { fontSize: 14, color: C.mutedForeground, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 22 },
  successBtn: {
    backgroundColor: C.navy, borderRadius: colors.radius,
    paddingVertical: 16, paddingHorizontal: 32, marginTop: 8,
  },
  successBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
