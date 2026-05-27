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
import { SocialLoginButtons } from "@/components/SocialLoginButtons";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

export default function RegisterClient() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerClient } = useAuth();
  const { prefillEmail } = useLocalSearchParams<{ prefillEmail?: string }>();

  const [form, setForm] = useState({
    name: "",
    email: prefillEmail ?? "",
    password: "",
    confirmPassword: "",
    phone: "",
    country: "qatar" as "qatar" | "jordan",
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleRegister() {
    setError("");
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("كلمتا المرور غير متطابقتين");
      return;
    }
    setLoading(true);
    try {
      await registerClient({
        name: form.name,
        email: form.email,
        password: form.password,
        phone: form.phone,
        country: form.country,
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
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Feather name="arrow-right" size={22} color={C.foreground} />
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>إنشاء حساب عميل</Text>
          <Text style={styles.sub}>ابدأ رحلتك مع مستشارك</Text>
        </View>

        <SocialLoginButtons role="client" />

        <View style={styles.orRow}>
          <View style={styles.line} />
          <Text style={styles.orText}>أو بالبريد الإلكتروني</Text>
          <View style={styles.line} />
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.destructive} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <View style={styles.form}>
          <Field label="الاسم الكامل" icon="user">
            <TextInput
              style={styles.input}
              placeholder="محمد عبدالله"
              value={form.name}
              onChangeText={(v) => set("name", v)}
              placeholderTextColor={C.mutedForeground}
            />
          </Field>

          <Field label="البريد الإلكتروني" icon="mail">
            <TextInput
              style={styles.input}
              placeholder="email@example.com"
              value={form.email}
              onChangeText={(v) => set("email", v)}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={C.mutedForeground}
            />
          </Field>

          <Field label="كلمة المرور" icon="lock">
            <TextInput
              style={styles.input}
              placeholder="6 أحرف على الأقل"
              value={form.password}
              onChangeText={(v) => set("password", v)}
              secureTextEntry={!showPass}
              placeholderTextColor={C.mutedForeground}
            />
            <TouchableOpacity onPress={() => setShowPass(!showPass)}>
              <Feather
                name={showPass ? "eye-off" : "eye"}
                size={16}
                color={C.mutedForeground}
              />
            </TouchableOpacity>
          </Field>

          <Field label="تأكيد كلمة المرور" icon="lock">
            <TextInput
              style={styles.input}
              placeholder="أعد إدخال كلمة المرور"
              value={form.confirmPassword}
              onChangeText={(v) => set("confirmPassword", v)}
              secureTextEntry
              placeholderTextColor={C.mutedForeground}
            />
          </Field>

          <Field label="رقم الجوال" icon="phone">
            <TextInput
              style={styles.input}
              placeholder="+974 55 123 456"
              value={form.phone}
              onChangeText={(v) => set("phone", v)}
              keyboardType="phone-pad"
              placeholderTextColor={C.mutedForeground}
            />
          </Field>

          <View style={styles.field}>
            <Text style={styles.label}>الدولة</Text>
            <View style={styles.countryRow}>
              {(["qatar", "jordan"] as const).map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[
                    styles.countryBtn,
                    form.country === c && styles.countryBtnActive,
                  ]}
                  onPress={() => set("country", c)}
                >
                  <Text style={styles.countryText}>
                    {c === "qatar" ? "🇶🇦 قطر" : "🇯🇴 الأردن"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.btn, loading && { opacity: 0.7 }]}
          onPress={handleRegister}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.btnText}>إنشاء الحساب</Text>
          )}
        </TouchableOpacity>

        <View style={styles.loginRow}>
          <Text style={styles.loginLabel}>لديك حساب بالفعل؟</Text>
          <TouchableOpacity
            onPress={() => router.push("/auth/login?role=client")}
          >
            <Text style={styles.loginLink}>تسجيل الدخول</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({
  label,
  icon,
  children,
}: {
  label: string;
  icon: string;
  children: React.ReactNode;
}) {
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
  backBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 16 },
  header: { gap: 4, marginBottom: 20 },
  title: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
    textAlign: "right",
  },
  sub: {
    fontSize: 14,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  orRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  orText: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  errorText: {
    color: C.destructive,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  form: { gap: 12, marginBottom: 20 },
  field: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
    textAlign: "right",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: C.card,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: C.foreground,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  countryRow: { flexDirection: "row", gap: 10 },
  countryBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.card,
  },
  countryBtnActive: { borderColor: C.navy, backgroundColor: "#EEF2F8" },
  countryText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
  },
  btn: {
    backgroundColor: C.navy,
    borderRadius: colors.radius,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  btnText: { color: "#fff", fontSize: 16, fontFamily: "Inter_700Bold" },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  loginLabel: {
    fontSize: 13,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  loginLink: {
    fontSize: 13,
    color: C.navy,
    fontFamily: "Inter_700Bold",
  },
});
