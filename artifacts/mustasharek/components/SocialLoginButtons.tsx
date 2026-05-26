import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { type SocialProvider, useSocialAuth } from "@/hooks/useSocialAuth";
import type { UserRole } from "@/contexts/AuthContext";

interface Props {
  role: UserRole;
  onSuccess?: () => void;
}

const C = colors.light;

const PROVIDERS: {
  id: SocialProvider;
  label: string;
  color: string;
  bg: string;
  border: string;
  icon: string;
}[] = [
  {
    id: "google",
    label: "Google",
    color: "#3C4043",
    bg: "#FFFFFF",
    border: "#DADCE0",
    icon: "google",
  },
  {
    id: "facebook",
    label: "Facebook",
    color: "#FFFFFF",
    bg: "#1877F2",
    border: "#1877F2",
    icon: "facebook",
  },
  {
    id: "microsoft",
    label: "Microsoft",
    color: "#FFFFFF",
    bg: "#2F2F2F",
    border: "#2F2F2F",
    icon: "microsoft",
  },
];

export function SocialLoginButtons({ role, onSuccess }: Props) {
  const { loginWithSocial } = useAuth();
  const { loading, loginWithGoogle, loginWithFacebook, loginWithMicrosoft } =
    useSocialAuth();

  async function handle(provider: SocialProvider) {
    try {
      let profile;
      if (provider === "google") profile = await loginWithGoogle();
      else if (provider === "facebook") profile = await loginWithFacebook();
      else profile = await loginWithMicrosoft();

      await loginWithSocial(profile, role);
      onSuccess?.();
    } catch (e: any) {
      Alert.alert("تنبيه", e.message ?? "حدث خطأ أثناء تسجيل الدخول");
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text style={styles.dividerText}>أو تابع بـ</Text>
        <View style={styles.line} />
      </View>

      <View style={styles.btns}>
        {PROVIDERS.map((p) => {
          const isLoading = loading === p.id;
          return (
            <TouchableOpacity
              key={p.id}
              style={[
                styles.btn,
                {
                  backgroundColor: p.bg,
                  borderColor: p.border,
                },
              ]}
              onPress={() => handle(p.id)}
              disabled={loading !== null}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator
                  size="small"
                  color={p.id === "google" ? C.navy : "#fff"}
                />
              ) : (
                <MaterialCommunityIcons
                  name={p.icon as any}
                  size={18}
                  color={p.color}
                />
              )}
              <Text style={[styles.btnLabel, { color: p.color }]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  line: { flex: 1, height: 1, backgroundColor: C.border },
  dividerText: {
    fontSize: 12,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
  },
  btns: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  btnLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
});
