import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform, View } from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";
import { NotificationBell } from "@/components/NotificationBell";

const C = colors.light;
export default function AdminTabLayout() {
  const isWeb = Platform.OS === "web";
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/auth/login" />;
  if (user.role !== "admin") return <Redirect href="/" />;
  return <Tabs screenOptions={{ tabBarActiveTintColor: C.primary, tabBarInactiveTintColor: C.mutedForeground, headerShown: true, headerTitle: "", headerShadowVisible: false, headerStyle: { backgroundColor: C.background }, headerRight: () => <View style={{ marginRight: 14 }}><NotificationBell /></View>, tabBarStyle: { position: "absolute", backgroundColor: C.background, borderTopWidth: 1, borderTopColor: C.border, elevation: 0, ...(isWeb ? { height: 84 } : {}) } }}>
    <Tabs.Screen name="index" options={{ title: "", tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} /> }} />
    <Tabs.Screen name="lawyers" options={{ title: "", tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} /> }} />
    <Tabs.Screen name="consultations" options={{ title: "", tabBarIcon: ({ color }) => <Feather name="file-text" size={22} color={color} /> }} />
    <Tabs.Screen name="notifications" options={{ title: "", tabBarIcon: ({ color }) => <Feather name="bell" size={22} color={color} /> }} />
  </Tabs>;
}
