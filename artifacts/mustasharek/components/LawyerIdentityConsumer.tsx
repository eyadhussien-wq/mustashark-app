import React from "react";
import { Text, View } from "react-native";
import { useLawyerIdentity } from "@/hooks/useLawyerIdentity";

/** Small presentation consumer for N1.01-C. It deliberately renders no financial or bank data. */
export function LawyerIdentityConsumer() {
  const { identity, isLoading, error } = useLawyerIdentity();

  if (isLoading && !identity) return <Text>جارٍ تحميل الهوية المهنية…</Text>;
  if (error) return <Text accessibilityRole="alert">تعذر تحميل الهوية المهنية.</Text>;
  if (!identity) return null;

  return (
    <View accessibilityLabel="هوية المحامي المهنية">
      <Text>{identity.name}</Text>
      <Text>{identity.specialization ?? "المحاماة"}</Text>
      <Text>{identity.verification?.status === "approved" ? "محامٍ موثّق" : "حالة التحقق قيد المراجعة"}</Text>
    </View>
  );
}
