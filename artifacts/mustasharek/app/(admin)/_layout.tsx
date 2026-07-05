import { Feather } from "@expo/vector-icons";
import { Redirect, Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import colors from "@/constants/colors";
import { useAuth } from "@/contexts/AuthContext";

const C = colors.light;

export default function AdminTabLayout() {
  const isWeb = Platform.OS === "web";
  const { user, isLoading } = useAuth();

  // Access guard: only authenticated admins may view this group.
  if (isLoading) return null;
  if (!user) return <Redirect href="/auth/login" />;
  if (user.role !== "admin") return <Redirect href="/" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: C.primary,
        tabBarInactiveTintColor: C.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: C.background,
          borderTopWidth: 1,
          borderTopColor: C.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "لوحة التحكم",
          tabBarIcon: ({ color }) => <Feather name="grid" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="lawyers"
        options={{
          title: "المحامون",
          tabBarIcon: ({ color }) => <Feather name="users" size={22} color={color} />,
        }}
      />
      <Tabs.Screen
        name="consultations"
        options={{
          title: "الاستشارات",
          tabBarIcon: ({ color }) => <Feather name="file-text" size={22} color={color} />,
        }}
      />
    </Tabs>
  );
}
