import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Redirect, Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { NotificationBell } from "@/components/NotificationBell";
import { useAuth } from "@/contexts/AuthContext";

function NativeTabLayout() {
  return <NativeTabs>
    <NativeTabs.Trigger name="index"><Icon sf={{ default: "house", selected: "house.fill" }} /><Label>لوحة التحكم</Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="requests"><Icon sf={{ default: "tray", selected: "tray.fill" }} /><Label>الطلبات</Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="notifications"><Icon sf={{ default: "bell", selected: "bell.fill" }} /><Label>التنبيهات</Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="wallet"><Icon sf={{ default: "creditcard", selected: "creditcard.fill" }} /><Label>المحفظة</Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="settings"><Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} /><Label>إعداداتي</Label></NativeTabs.Trigger>
    <NativeTabs.Trigger name="profile"><Icon sf={{ default: "person", selected: "person.fill" }} /><Label>حسابي</Label></NativeTabs.Trigger>
  </NativeTabs>;
}
function ClassicTabLayout() {
  const colors = useColors(); const colorScheme = useColorScheme(); const isDark = colorScheme === "dark"; const isIOS = Platform.OS === "ios"; const isWeb = Platform.OS === "web";
  return <Tabs screenOptions={{ tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.mutedForeground, headerShown: true, headerTitle: "", headerShadowVisible: false, headerStyle: { backgroundColor: colors.background }, headerRight: () => <View style={{ marginRight: 14 }}><NotificationBell /></View>, tabBarStyle: { position: "absolute", backgroundColor: isIOS ? "transparent" : colors.background, borderTopWidth: isWeb ? 1 : 0, borderTopColor: colors.border, elevation: 0, ...(isWeb ? { height: 84 } : {}) }, tabBarBackground: () => isIOS ? <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} /> : isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]} /> : null }}>
    <Tabs.Screen name="index" options={{ title: "", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="house" tintColor={color} size={24} /> : <Feather name="home" size={22} color={color} /> }} />
    <Tabs.Screen name="requests" options={{ title: "", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="tray" tintColor={color} size={24} /> : <Feather name="inbox" size={22} color={color} /> }} />
    <Tabs.Screen name="notifications" options={{ title: "", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="bell" tintColor={color} size={24} /> : <Feather name="bell" size={22} color={color} /> }} />
    <Tabs.Screen name="wallet" options={{ title: "", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="creditcard" tintColor={color} size={24} /> : <Feather name="credit-card" size={22} color={color} /> }} />
    <Tabs.Screen name="settings" options={{ title: "", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="gear" tintColor={color} size={24} /> : <Feather name="settings" size={22} color={color} /> }} />
    <Tabs.Screen name="profile" options={{ title: "", tabBarIcon: ({ color }) => isIOS ? <SymbolView name="person" tintColor={color} size={24} /> : <Feather name="user" size={22} color={color} /> }} />
  </Tabs>;
}
export default function LawyerTabLayout() {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (!user) return <Redirect href="/auth/login?role=lawyer" />;
  if (user.role !== "lawyer") return <Redirect href="/" />;
  if (isLiquidGlassAvailable()) return <NativeTabLayout />;
  return <ClassicTabLayout />;
}
