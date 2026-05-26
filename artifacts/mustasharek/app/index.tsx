import { Redirect } from "expo-router";
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

  if (!user) return <Redirect href="/onboarding" />;
  if (user.role === "lawyer") return <Redirect href="/(lawyer)" />;
  return <Redirect href="/(client)" />;
}
