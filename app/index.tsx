import { Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { useAuth } from "@/lib/auth-context";
import { useSubscription } from "@/lib/subscription-context";
import Colors from "@/constants/colors";

export default function Index() {
  const { user, isLoading: authLoading } = useAuth();
  const { hasAccess, isLoading: subLoading } = useSubscription();

  if (authLoading || subLoading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.tint} />
      </View>
    );
  }

  if (!user) return <Redirect href="/auth" />;
  if (!hasAccess) return <Redirect href="/subscription" />;
  return <Redirect href="/(tabs)" />;
}
