import {
  Tajawal_400Regular,
  Tajawal_500Medium,
  Tajawal_700Bold,
  Tajawal_800ExtraBold,
} from "@expo-google-fonts/tajawal";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Font from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { DataProvider } from "@/contexts/DataContext";
import { LanguageProvider } from "@/contexts/LanguageContext";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="auth/login" />
      <Stack.Screen name="auth/register-client" />
      <Stack.Screen name="auth/register-lawyer" />
      <Stack.Screen name="auth/forgot-password" />
      <Stack.Screen name="(client)" />
      <Stack.Screen name="(lawyer)" />
      <Stack.Screen name="(admin)" />
      <Stack.Screen
        name="lawyer/[id]"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="consultation/[id]"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="payment"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="language-splash"
        options={{ headerShown: false, presentation: "fullScreenModal" }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{ headerShown: false, presentation: "card" }}
      />
      <Stack.Screen
        name="(client)/legal-hub"
        options={{ headerShown: false, presentation: "card" }}
      />
    </Stack>
  );
}

export default function RootLayout() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    Font.loadAsync({
      Tajawal_400Regular,
      Tajawal_500Medium,
      Tajawal_700Bold,
      Tajawal_800ExtraBold,
      // Compatibility aliases for existing Inter_* consumers during migration.
      Inter_400Regular: Tajawal_400Regular,
      Inter_500Medium: Tajawal_500Medium,
      Inter_600SemiBold: Tajawal_700Bold,
      Inter_700Bold: Tajawal_700Bold,
    })
      .catch(() => {
        // Font loading failed (e.g. timeout or offline) — continue with system fonts
      })
      .finally(() => {
        setReady(true);
        SplashScreen.hideAsync().catch(() => {});
      });
  }, []);

  if (!ready) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <DataProvider>
              <LanguageProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </LanguageProvider>
            </DataProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
