import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
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

export default function RegisterClient() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { registerClient } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    country: "qatar" as "qatar" | "jordan",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function set(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleRegister() {
    if (!form.name || !form.email || !form.password || !form.phone) {
      setError("يرجى تعبئة جميع الحقول");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await registerClient(form);
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
          <Text style={styles.title}>إنشاء حساب عميل</Text>
          <Text style={styles.sub}>ابدأ رحلتك مع مستشارك</Text>
        </View>

        {!!error && (
          <View style={styles.errorBox}>
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
              placeholderTextColor={C.mutedForeground}
            />
          </Field>
          <Field label="كلمة المرور" icon="lock">
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChangeText={(v) => set("password", v)}
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
                  <Text style={styles.countryBtnText}>
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
  backBtn: { alignSelf: "flex-end", padding: 4, marginBottom: 20 },
  header: { gap: 6, marginBottom: 28 },
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
  errorBox: {
    backgroundColor: "#FEE2E2",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: C.destructive,
    fontFamily: "Inter_500Medium",
    fontSize: 13,
    textAlign: "right",
  },
  form: { gap: 14, marginBottom: 24 },
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
  countryBtnActive: {
    borderColor: C.navy,
    backgroundColor: "#EEF2F8",
  },
  countryBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
  },
  btn: {
    backgroundColor: C.navy,
    borderRadius: colors.radius,
    paddingVertical: 16,
    alignItems: "center",
  },
  btnText: {
    color: "#fff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
});
