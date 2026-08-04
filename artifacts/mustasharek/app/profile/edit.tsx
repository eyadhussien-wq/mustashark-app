import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
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
import { type User, useAuth } from "@/contexts/AuthContext";

const C = colors.light;

export default function EditProfile() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuth();

  const [name, setName] = useState(user?.name ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [country, setCountry] = useState<"qatar" | "jordan">(
    user?.country ?? "qatar",
  );

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSave() {
    if (!name.trim()) {
      setError("الاسم مطلوب ولا يمكن أن يكون فارغاً");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const updates: Partial<User> = {
        name: name.trim(),
        phone: phone.trim() || undefined,
        country,
      };

      await updateUser(updates);
      setSuccess(true);
      setTimeout(() => router.back(), 1000);
    } catch (e: any) {
      setError(e?.message ?? "حدث خطأ أثناء حفظ البيانات");
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.background }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: insets.top + (Platform.OS === "web" ? 20 : 16),
          paddingBottom: insets.bottom + 80,
        },
      ]}
      keyboardShouldPersistTaps="handled"
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="chevron-right" size={24} color={C.foreground} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تعديل الملف الشخصي</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Success banner */}
      {success && (
        <View style={styles.successBanner}>
          <Feather name="check-circle" size={16} color={C.success} />
          <Text style={styles.successText}>تم حفظ التعديلات بنجاح ✓</Text>
        </View>
      )}

      {/* Error banner */}
      {error && (
        <View style={styles.errorBanner}>
          <Feather name="alert-circle" size={16} color={C.destructive} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Name ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>الاسم الكامل *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="أدخل اسمك الكامل"
          placeholderTextColor={C.mutedForeground}
          textAlign="right"
          editable={!loading}
        />
      </View>

      {/* ── Phone ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>رقم الهاتف</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="+966 5X XXX XXXX"
          placeholderTextColor={C.mutedForeground}
          keyboardType="phone-pad"
          textAlign="right"
          editable={!loading}
        />
      </View>

      {/* ── Country ── */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>الدولة</Text>
        <View style={styles.countryRow}>
          <TouchableOpacity
            style={[
              styles.countryOption,
              country === "qatar" && styles.countryOptionActive,
            ]}
            onPress={() => setCountry("qatar")}
            activeOpacity={0.8}
          >
            <Text style={styles.countryFlag}>🇶🇦</Text>
            <Text
              style={[
                styles.countryLabel,
                country === "qatar" && styles.countryLabelActive,
              ]}
            >
              قطر
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.countryOption,
              country === "jordan" && styles.countryOptionActive,
            ]}
            onPress={() => setCountry("jordan")}
            activeOpacity={0.8}
          >
            <Text style={styles.countryFlag}>🇯🇴</Text>
            <Text
              style={[
                styles.countryLabel,
                country === "jordan" && styles.countryLabelActive,
              ]}
            >
              الأردن
            </Text>
          </TouchableOpacity>
        </View>
      </View>


      {/* Save button */}
      <TouchableOpacity
        style={[styles.saveBtn, loading && styles.saveBtnDisabled]}
        onPress={handleSave}
        activeOpacity={0.85}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <>
            <Feather name="check" size={18} color="#fff" />
            <Text style={styles.saveBtnText}>حفظ التعديلات</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingHorizontal: 20 },
  header: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: C.secondary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
  },
  successBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#ECFDF5",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#D1FAE5",
    padding: 12,
    marginBottom: 16,
  },
  successText: {
    color: C.success,
    fontFamily: "Inter_600SemiBold",
    fontSize: 14,
  },
  errorBanner: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: C.destructive,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
    flex: 1,
    textAlign: "right",
  },
  fieldGroup: { marginBottom: 18 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.primary,
    textAlign: "right",
    marginBottom: 8,
  },
  input: {
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: C.foreground,
  },
  countryRow: {
    flexDirection: "row-reverse",
    gap: 12,
  },
  countryOption: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.card,
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    paddingVertical: 12,
  },
  countryOptionActive: {
    borderColor: C.gold,
    backgroundColor: "rgba(201,160,53,0.08)",
  },
  countryFlag: { fontSize: 20 },
  countryLabel: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.mutedForeground,
  },
  countryLabelActive: { color: C.navy },
  saveBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
