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

export default function Login() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { login } = useAuth();
  const params = useLocalSearchParams<{ role: string }>();
  const role = params.role ?? "client";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLawyer = role === "lawyer";

  async function handleLogin() {
    if (!email || !password) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
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
          <View style={[styles.icon, isLawyer && styles.iconLawyer]}>
            <Feather
              name={isLawyer ? "briefcase" : "user"}
              size={28}
              color={isLawyer ? C.navy : C.gold}
            />
          </View>
          <Text style={styles.title}>
            {isLawyer ? "تسجيل دخول المحامي" : "تسجيل دخول العميل"}
          </Text>
          <Text style={styles.sub}>مرحباً بعودتك في مستشارك</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
            <Feather name="alert-circle" size={14} color={C.destructive} />
            <Text style={styles.errorText}>{error}</Text>
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
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color={C.mutedForeground} />
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

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.dividerText}>أو</Text>
          <View style={styles.line} />
        </View>

        <TouchableOpacity
          style={styles.registerBtn}
          onPress={() =>
            router.push(
              isLawyer ? "/auth/register-lawyer" : "/auth/register-client"
            )
          }
          activeOpacity={0.85}
        >
          <Text style={styles.registerText}>
            {isLawyer ? "تسجيل محامٍ جديد" : "إنشاء حساب عميل"}
          </Text>
        </TouchableOpacity>

        {!isLawyer && (
          <Text style={styles.hint}>
            للتجربة: email@example.com / كلمة المرور: 123456
          </Text>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: "flex-end",
    padding: 4,
    marginBottom: 24,
  },
  header: {
    alignItems: "center",
    gap: 10,
    marginBottom: 32,
  },
  icon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "#FEF9EC",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(201,160,53,0.2)",
  },
  iconLawyer: {
    backgroundColor: "#EEF2F8",
    borderColor: "rgba(27,58,107,0.15)",
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
  },
  sub: {
    fontSize: 14,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: C.destructive,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    flex: 1,
    textAlign: "right",
  },
  form: {
    gap: 16,
    marginBottom: 24,
  },
  field: {
    gap: 6,
  },
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
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 20,
  },
  loginText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  line: {
    flex: 1,
    height: 1,
    backgroundColor: C.border,
  },
  dividerText: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  registerBtn: {
    borderWidth: 1.5,
    borderColor: C.navy,
    borderRadius: colors.radius,
    paddingVertical: 14,
    alignItems: "center",
  },
  registerText: {
    color: C.navy,
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    textAlign: "center",
    marginTop: 16,
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
});
