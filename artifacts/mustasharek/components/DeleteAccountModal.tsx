import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

export type DeleteAccountRole = "client" | "lawyer";

interface DeleteAccountModalProps {
  visible: boolean;
  role: DeleteAccountRole;
  onClose: () => void;
  onConfirm: () => Promise<void>;
}

export function DeleteAccountModal({
  visible,
  role,
  onClose,
  onConfirm,
}: DeleteAccountModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleClose() {
    setStep(1);
    setError(null);
    onClose();
  }

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      await onConfirm();
      // Parent will handle navigation/state changes on success
      handleClose();
    } catch (e: any) {
      setError(e?.message ?? "حدث خطأ. يرجى المحاولة مجدداً.");
      setLoading(false);
    }
  }

  const isClient = role === "client";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* ── Step 1: Warning ── */}
          {step === 1 && (
            <>
              <View style={styles.iconWrap}>
                <Feather name="alert-triangle" size={32} color={C.gold} />
              </View>
              <Text style={styles.title}>
                {isClient ? "حذف الحساب" : "طلب حذف الحساب"}
              </Text>

              <View style={styles.warningBox}>
                {isClient ? (
                  <>
                    <Text style={styles.warningLine}>
                      • سيتم تعطيل حسابك فوراً وإيقاف جميع الخدمات.
                    </Text>
                    <Text style={styles.warningLine}>
                      • لديك <Text style={styles.bold}>30 يوماً</Text> للتراجع
                      عن القرار بتسجيل الدخول مجدداً.
                    </Text>
                    <Text style={styles.warningLine}>
                      • بعد 30 يوماً يُحذف الحساب نهائياً ولا يمكن
                      استعادته.
                    </Text>
                  </>
                ) : (
                  <>
                    <Text style={styles.warningLine}>
                      • سيُرسَل طلبك إلى الإدارة للمراجعة.
                    </Text>
                    <Text style={styles.warningLine}>
                      • لن يتم تنفيذ الحذف إلا بعد موافقة الإدارة والتأكد من
                      خلوّ حسابك من الالتزامات.
                    </Text>
                    <Text style={styles.warningLine}>
                      • ستُبلَّغ بقرار الإدارة في أقرب وقت.
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleClose}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>إلغاء</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.nextBtn}
                  onPress={() => setStep(2)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.nextBtnText}>متابعة</Text>
                  <Feather name="arrow-left" size={16} color="#fff" />
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* ── Step 2: Final confirm ── */}
          {step === 2 && (
            <>
              <View style={[styles.iconWrap, { backgroundColor: "#FEF2F2" }]}>
                <Feather name="trash-2" size={32} color={C.destructive} />
              </View>
              <Text style={styles.title}>تأكيد نهائي</Text>
              <Text style={styles.subtitle}>
                {isClient
                  ? "هل أنت متأكد من رغبتك في حذف حسابك؟ يمكنك التراجع خلال 30 يوماً."
                  : "هل تريد تقديم طلب حذف حسابك إلى الإدارة؟"}
              </Text>

              {error && (
                <View style={styles.errorBox}>
                  <Feather name="alert-circle" size={14} color={C.destructive} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setStep(1);
                    setError(null);
                  }}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  <Text style={styles.cancelBtnText}>رجوع</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.confirmBtn, loading && { opacity: 0.6 }]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Feather name="trash-2" size={16} color="#fff" />
                      <Text style={styles.confirmBtnText}>
                        {isClient ? "نعم، احذف حسابي" : "تقديم الطلب"}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(10,26,50,0.65)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  sheet: {
    width: "100%",
    backgroundColor: C.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: "center",
  },
  iconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(201,160,53,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(201,160,53,0.3)",
  },
  title: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: C.foreground,
    textAlign: "center",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: C.mutedForeground,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 20,
  },
  warningBox: {
    backgroundColor: "rgba(201,160,53,0.07)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(201,160,53,0.25)",
    padding: 16,
    width: "100%",
    marginBottom: 24,
    gap: 8,
  },
  warningLine: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: C.foreground,
    textAlign: "right",
    lineHeight: 22,
  },
  bold: { fontFamily: "Inter_700Bold", color: C.navy },
  btnRow: {
    flexDirection: "row-reverse",
    gap: 12,
    width: "100%",
  },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: C.border,
  },
  cancelBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: C.mutedForeground,
  },
  nextBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.navy,
    paddingVertical: 14,
    borderRadius: 12,
  },
  nextBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  confirmBtn: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: C.destructive,
    paddingVertical: 14,
    borderRadius: 12,
  },
  confirmBtnText: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  errorBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#FEE2E2",
    padding: 10,
    width: "100%",
    marginBottom: 16,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: C.destructive,
    textAlign: "right",
  },
});
