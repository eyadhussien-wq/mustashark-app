import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import colors from "@/constants/colors";

const C = colors.light;

export function NotificationBell({ unreadCount = 0 }: { unreadCount?: number }) {
  const router = useRouter();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={unreadCount ? `التنبيهات، ${unreadCount} غير مقروء` : "التنبيهات"}
      activeOpacity={0.8}
      onPress={() => router.push("/notifications")}
      style={styles.button}
    >
      <Feather name="bell" size={21} color={C.gold} />
      {unreadCount > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{unreadCount > 99 ? "99+" : unreadCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(201,160,53,0.45)",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -4,
    minWidth: 19,
    height: 19,
    paddingHorizontal: 4,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: C.destructive,
    borderWidth: 2,
    borderColor: C.navy,
  },
  badgeText: { color: C.destructiveForeground, fontSize: 9, fontFamily: "Inter_700Bold" },
});
