import AsyncStorage from "@react-native-async-storage/async-storage";
import { Redirect } from "expo-router";
import React, { useState, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/contexts/AuthContext";
import colors from "@/constants/colors";

export default function Root() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.light.background }}>
        <ActivityIndicator color={colors.light.primary} size="large" />
      </View>
    );
  }

  if (!user) {
    // Check if language was already selected
    return <LanguageCheckRedirect />;
  }

  if (user.role === "lawyer") return <Redirect href="/(lawyer)" />;
  return <Redirect href="/(client)" />;
}

function LanguageCheckRedirect() {
  const [checked, setChecked] = useState(false);
  const [hasLang, setHasLang] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem("mustasharek_language").then((val) => {
      setHasLang(!!val);
      setChecked(true);
    });
  }, []);

  if (!checked) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.light.background }}>
        <ActivityIndicator color={colors.light.primary} size="large" />
      </View>
    );
  }

  if (!hasLang) return <Redirect href="/language-splash" />;
  return <Redirect href="/onboarding" />;
}
