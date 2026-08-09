import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useRef, useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "@/constants/colors";
import { type RecoveryChannel, useAuth } from "@/contexts/AuthContext";

const C = colors.light;
type Step = "request" | "otp";

export default function ForgotPassword() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { requestPasswordReset, resetPassword } = useAuth();
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState("");
  const [channel, setChannel] = useState<RecoveryChannel>("email");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [success, setSuccess] = useState(false);
  const otpRefs = useRef<Array<TextInput | null>>([]);

  async function handleRequestOtp() {
    if (!email.trim()) return setError("يرجى إدخال البريد الإلكتروني");
    setError(""); setNotice(""); setLoading(true);
    try {
      const result = await requestPasswordReset(email.trim(), channel);
      setNotice(result.developmentOtp ? `رمز الاختبار: ${result.developmentOtp}` : result.message);
      setStep("otp");
    } catch (e: any) { setError(e?.message ?? "تعذر إرسال رمز الاستعادة"); }
    finally { setLoading(false); }
  }

  function handleOtpChange(value: string, index: number) {
    const digit = value.replace(/[^0-9]/g, "").slice(-1);
    const next = [...otp]; next[index] = digit; setOtp(next);
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  }

  async function handleReset() {
    const code = otp.join("");
    if (code.length !== 6) return setError("يرجى إدخال رمز التحقق المكوّن من 6 أرقام");
    if (newPassword.length < 6) return setError("كلمة المرور يجب أن تكون 6 أحرف على الأقل");
    if (newPassword !== confirmPassword) return setError("كلمتا المرور غير متطابقتين");
    setError(""); setLoading(true);
    try { await resetPassword(email.trim(), code, newPassword); setSuccess(true); }
    catch (e: any) { setError(e?.message ?? "تعذر تغيير كلمة المرور"); }
    finally { setLoading(false); }
  }

  if (success) return (
    <View style={[styles.success, { paddingTop: insets.top + 60 }]}>
      <Feather name="check-circle" size={56} color={C.success} />
      <Text style={styles.title}>تم تغيير كلمة المرور</Text>
      <Text style={styles.sub}>يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة.</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace("/auth/login")}><Text style={styles.buttonText}>الذهاب إلى تسجيل الدخول</Text></TouchableOpacity>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 30 }]} keyboardShouldPersistTaps="handled">
        <TouchableOpacity style={styles.back} onPress={() => step === "otp" ? setStep("request") : router.back()}><Feather name="arrow-right" size={22} color={C.foreground} /></TouchableOpacity>
        <View style={styles.header}><View style={styles.icon}><Feather name={step === "otp" ? "message-square" : "lock"} size={28} color={C.navy} /></View><Text style={styles.title}>نسيت كلمة المرور؟</Text><Text style={styles.sub}>{step === "request" ? "اختر طريقة استلام رمز التحقق لاستعادة حسابك." : `أدخل الرمز المرسل إلى ${channel === "email" ? "بريدك الإلكتروني" : "رقم WhatsApp المرتبط بحسابك"}.`}</Text></View>
        {!!error && <View style={styles.error}><Feather name="alert-circle" size={15} color={C.destructive} /><Text style={styles.errorText}>{error}</Text></View>}
        {!!notice && <View style={styles.notice}><Feather name="info" size={15} color={C.navy} /><Text style={styles.noticeText}>{notice}</Text></View>}

        {step === "request" ? <>
          <Text style={styles.label}>البريد الإلكتروني</Text>
          <View style={styles.inputRow}><Feather name="mail" size={16} color={C.mutedForeground} /><TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email@example.com" placeholderTextColor={C.mutedForeground} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} /></View>
          <Text style={[styles.label, { marginTop: 18 }]}>طريقة استلام الرمز</Text>
          <View style={styles.channels}>
            <TouchableOpacity style={[styles.channel, channel === "email" && styles.channelActive]} onPress={() => setChannel("email")}><Feather name="mail" size={18} color={channel === "email" ? C.navy : C.mutedForeground} /><Text style={styles.channelText}>البريد الإلكتروني</Text></TouchableOpacity>
            <TouchableOpacity style={[styles.channel, channel === "whatsapp" && styles.channelActive]} onPress={() => setChannel("whatsapp")}><Feather name="message-circle" size={18} color={channel === "whatsapp" ? C.navy : C.mutedForeground} /><Text style={styles.channelText}>WhatsApp</Text></TouchableOpacity>
          </View>
          <TouchableOpacity style={styles.button} onPress={handleRequestOtp} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>إرسال رمز التحقق</Text>}</TouchableOpacity>
        </> : <>
          <Text style={styles.label}>رمز التحقق</Text>
          <View style={styles.otpRow}>{otp.map((digit, index) => <TextInput key={index} ref={(ref) => { otpRefs.current[index] = ref; }} style={[styles.otp, digit && styles.otpFilled]} value={digit} onChangeText={(v) => handleOtpChange(v, index)} keyboardType="number-pad" maxLength={1} textAlign="center" selectTextOnFocus />)}</View>
          <Text style={styles.label}>كلمة المرور الجديدة</Text>
          <View style={styles.inputRow}><Feather name="lock" size={16} color={C.mutedForeground} /><TextInput style={styles.input} value={newPassword} onChangeText={setNewPassword} secureTextEntry={!showPass} placeholder="••••••••" placeholderTextColor={C.mutedForeground} /><TouchableOpacity onPress={() => setShowPass(!showPass)}><Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.mutedForeground} /></TouchableOpacity></View>
          <Text style={styles.label}>تأكيد كلمة المرور</Text>
          <View style={styles.inputRow}><Feather name="lock" size={16} color={C.mutedForeground} /><TextInput style={styles.input} value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry={!showConfirm} placeholder="••••••••" placeholderTextColor={C.mutedForeground} /><TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}><Feather name={showConfirm ? "eye-off" : "eye"} size={16} color={C.mutedForeground} /></TouchableOpacity></View>
          <TouchableOpacity style={styles.button} onPress={handleReset} disabled={loading}>{loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>تغيير كلمة المرور</Text>}</TouchableOpacity>
          <TouchableOpacity onPress={() => { setStep("request"); setOtp(["", "", "", "", "", ""]); setNotice(""); setError(""); }}><Text style={styles.resend}>إعادة إرسال الرمز</Text></TouchableOpacity>
        </>}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.background }, container: { flexGrow: 1, paddingHorizontal: 24 }, back: { alignSelf: "flex-end", padding: 4, marginBottom: 25 },
  header: { alignItems: "center", gap: 10, marginBottom: 26 }, icon: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#EEF2F8", alignItems: "center", justifyContent: "center" },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.foreground, textAlign: "center" }, sub: { fontSize: 14, lineHeight: 22, color: C.mutedForeground, textAlign: "center", fontFamily: "Inter_400Regular" },
  label: { fontSize: 13, color: C.foreground, fontFamily: "Inter_600SemiBold", textAlign: "right", marginBottom: 7, marginTop: 10 },
  inputRow: { minHeight: 50, borderWidth: 1, borderColor: C.border, borderRadius: 12, backgroundColor: C.card, paddingHorizontal: 14, flexDirection: "row", alignItems: "center", gap: 10 }, input: { flex: 1, color: C.foreground, fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "right" },
  channels: { flexDirection: "row", gap: 10, marginBottom: 22 }, channel: { flex: 1, minHeight: 54, borderWidth: 1, borderColor: C.border, borderRadius: 12, alignItems: "center", justifyContent: "center", gap: 5 }, channelActive: { borderColor: C.navy, backgroundColor: "#EEF2F8" }, channelText: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: C.foreground },
  button: { height: 52, borderRadius: 12, backgroundColor: C.navy, alignItems: "center", justifyContent: "center", marginTop: 22 }, buttonText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  otpRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 }, otp: { width: 44, height: 52, borderWidth: 1, borderColor: C.border, borderRadius: 10, backgroundColor: C.card, fontSize: 20, color: C.foreground }, otpFilled: { borderColor: C.navy },
  error: { flexDirection: "row", gap: 8, alignItems: "flex-start", backgroundColor: "#FEE2E2", borderRadius: 10, padding: 12, marginBottom: 12 }, errorText: { flex: 1, color: C.destructive, fontSize: 13, lineHeight: 20, textAlign: "right" },
  notice: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "#EEF2F8", borderRadius: 10, padding: 12, marginBottom: 12 }, noticeText: { flex: 1, color: C.navy, fontSize: 12, textAlign: "right" }, resend: { textAlign: "center", color: C.navy, fontFamily: "Inter_600SemiBold", fontSize: 13, marginTop: 18 },
  success: { flex: 1, backgroundColor: C.background, alignItems: "center", paddingHorizontal: 24, gap: 14 },
});
