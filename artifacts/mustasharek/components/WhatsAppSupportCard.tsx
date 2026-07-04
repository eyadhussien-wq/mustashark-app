import { Feather } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";
import { SUPPORT_CONFIG, SUPPORT_MESSAGES, buildWhatsAppUrl } from "@/constants/support";
import type { UserRole } from "@/contexts/AuthContext";

interface Props {
  role: UserRole;
  /** Override the section title shown above the card. */
  title?: string;
}

const C = colors.light;
const WHATSAPP_GREEN = "#25D366";
const WHATSAPP_DARK = "#128C7E";

export function WhatsAppSupportCard({ role, title }: Props) {
  const [opening, setOpening] = useState(false);

  async function handleWhatsApp() {
    setOpening(true);
    try {
      const message = role === "lawyer" ? SUPPORT_MESSAGES.lawyer : SUPPORT_MESSAGES.client;
      const url = buildWhatsAppUrl(message);
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      } else {
        // Fallback: open web.whatsapp.com
        await Linking.openURL(
          `https://web.whatsapp.com/send?phone=${SUPPORT_CONFIG.whatsappNumber}&text=${encodeURIComponent(message)}`,
        );
      }
    } catch {
      // Silent fail — user may not have WhatsApp installed
    } finally {
      setOpening(false);
    }
  }

  async function handleEmail() {
    const subject = encodeURIComponent("طلب دعم فني — مستشارك");
    const body = encodeURIComponent(
      role === "lawyer" ? SUPPORT_MESSAGES.lawyer : SUPPORT_MESSAGES.client,
    );
    await Linking.openURL(
      `mailto:${SUPPORT_CONFIG.email}?subject=${subject}&body=${body}`,
    ).catch(() => {});
  }

  return (
    <View style={styles.wrapper}>
      {/* Section header */}
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIconWrap}>
          <Feather name="headphones" size={15} color={C.navy} />
        </View>
        <Text style={styles.sectionTitle}>
          {title ?? "الدعم الفني والشكاوى"}
        </Text>
      </View>

      <View style={styles.card}>
        {/* WhatsApp primary button */}
        <TouchableOpacity
          style={[styles.waBtn, opening && styles.waBtnLoading]}
          onPress={handleWhatsApp}
          disabled={opening}
          activeOpacity={0.85}
        >
          <View style={styles.waBtnLeft}>
            <View style={styles.waIconWrap}>
              {opening ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="message-circle" size={20} color="#fff" />
              )}
            </View>
            <View style={styles.waBtnTexts}>
              <Text style={styles.waBtnLabel}>التواصل الفوري عبر الواتساب</Text>
              <Text style={styles.waBtnHint}>رد سريع خلال دقائق</Text>
            </View>
          </View>
          <View style={styles.waBadge}>
            <Text style={styles.waBadgeText}>متاح</Text>
          </View>
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Email ticket secondary button */}
        <TouchableOpacity
          style={styles.emailRow}
          onPress={handleEmail}
          activeOpacity={0.7}
        >
          <View style={styles.emailLeft}>
            <View style={styles.emailIconWrap}>
              <Feather name="mail" size={16} color={C.navy} />
            </View>
            <View style={styles.emailTexts}>
              <Text style={styles.emailLabel}>إرسال تذكرة دعم بالبريد</Text>
              <Text style={styles.emailHint}>للمشكلات التقنية المعقدة</Text>
            </View>
          </View>
          <Feather name="chevron-left" size={16} color={C.mutedForeground} />
        </TouchableOpacity>
      </View>

      {/* Number hint (non-production indicator) */}
      {SUPPORT_CONFIG.whatsappNumber === "97455000000" && (
        <Text style={styles.configNote}>
          ⚙️ رقم الدعم لم يُضبط بعد — أضف EXPO_PUBLIC_SUPPORT_WHATSAPP في Secrets
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: 20 },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.navy + "15",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
  },

  card: {
    backgroundColor: C.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.06,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 2 },
      },
      android: { elevation: 2 },
    }),
  },

  // ── WhatsApp button ────────────────────────────────────────────────────────
  waBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: WHATSAPP_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  waBtnLoading: { opacity: 0.75 },
  waBtnLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  waIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  waBtnTexts: { flex: 1 },
  waBtnLabel: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    textAlign: "right",
  },
  waBtnHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.8)",
    textAlign: "right",
    marginTop: 2,
  },
  waBadge: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  waBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },

  // ── Divider ───────────────────────────────────────────────────────────────
  divider: { height: 1, backgroundColor: C.border },

  // ── Email row ─────────────────────────────────────────────────────────────
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emailLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  emailIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.navy + "12",
    alignItems: "center",
    justifyContent: "center",
  },
  emailTexts: { flex: 1 },
  emailLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: C.foreground,
    textAlign: "right",
  },
  emailHint: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: C.mutedForeground,
    textAlign: "right",
    marginTop: 2,
  },

  // ── Config note ───────────────────────────────────────────────────────────
  configNote: {
    marginTop: 8,
    fontSize: 11,
    color: C.mutedForeground,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
    lineHeight: 16,
  },
});
