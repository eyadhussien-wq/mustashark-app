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

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ role?: string }>();
  const role = (params.role ?? "client") as "client" | "lawyer";
  const isLawyer = role === "lawyer";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notRegistered, setNotRegistered] = useState(false);

  async function handleLogin() {
    setError("");
    setNotRegistered(false);
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/");
    } catch (e: any) {
      const msg: string = e.message ?? "حدث خطأ";
      setError(msg);
      if (msg.includes("غير مسجّل")) setNotRegistered(true);
    } finally {
      setLoading(false);
    }
  }

  function goRegister() {
    const target = isLawyer ? "/auth/register-lawyer" : "/auth/register-client";
    router.push({ pathname: target as any, params: { prefillEmail: email } });
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
          <View style={[styles.iconWrap, isLawyer && styles.iconWrapLawyer]}>
            <Feather
              name={isLawyer ? "briefcase" : "user"}
              size={28}
              color={isLawyer ? C.navy : C.gold}
            />
          </View>
          <Text style={styles.title}>
            {isLawyer ? "دخول المحامي" : "دخول العميل"}
          </Text>
          <Text style={styles.sub}>مرحباً بعودتك في مستشارك</Text>
        </View>

        {!!error && (
          <View style={[styles.errorBox, notRegistered && styles.errorBoxWide]}>
            <View style={styles.errorTop}>
              <Feather name="alert-circle" size={14} color={C.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
            {notRegistered && (
              <TouchableOpacity style={styles.registerNowBtn} onPress={goRegister}>
                <Text style={styles.registerNowText}>
                  {isLawyer ? "تسجيل محامٍ جديد ←" : "إنشاء حساب الآن ←"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        <View style={styles.form}>
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
                autoCorrect={false}
                placeholderTextColor={C.mutedForeground}
              />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>كلمة المرور</Text>
            <View style={styles.inputRow}>
              <Feather name="lock" size={16} color={C.mutedForeground} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={setPassword}
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
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.loginBtn, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.loginText}>دخول</Text>
          )}
        </TouchableOpacity>

        {/* Inline row: Forgot Password + Sign Up */}
        <View style={styles.actionLinksRow}>
          <TouchableOpacity
            onPress={() =>
              router.push(
                isLawyer ? "/auth/register-lawyer" : "/auth/register-client"
              )
            }
          >
            <Text style={styles.registerLink}>
              {isLawyer ? "تسجيل محامٍ جديد" : "إنشاء حساب"}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push("/auth/forgot-password")}
          >
            <Text style={styles.forgotText}>نسيت كلمة المرور؟</Text>
          </TouchableOpacity>
        </View>

        <SocialLoginButtons role={role} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, paddingHorizontal: 24 },
  backBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 20 },
  header: { alignItems: "center", gap: 10, marginBottom: 28 },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF9EC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(201,160,53,0.2)",
  },
  iconWrapLawyer: {
    backgroundColor: "#EEF2F8",
    borderColor: "rgba(27,58,107,0.15)",
  },
  title: { fontSize: 24, fontFamily: "Inter_700Bold", color: C.foreground },
  sub: {
    fontSize: 14,
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
    marginBottom: 16,
  },
  errorBoxWide: {
    flexDirection: "column",
    gap: 10,
  },
  errorTop: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },
  errorText: {
    color: C.destructive,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
    lineHeight: 20,
  },
  registerNowBtn: {
    backgroundColor: C.navy,
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: "center",
  },
  registerNowText: {
    color: "#fff",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  form: { gap: 14, marginBottom: 20 },
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
  loginBtn: {
    backgroundColor: C.navy,
    borderRadius: colors.radius,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  loginText: { color: "#fff", fontSize: 18, fontFamily: "Inter_700Bold" },
  actionLinksRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 4,
    marginBottom: 16,
  },
  forgotText: {
    fontSize: 13,
    color: C.primary,
    fontFamily: "Inter_500Medium",
  },
  registerLink: {
    fontSize: 13,
    color: C.navy,
    fontFamily: "Inter_700Bold",
  },
});
