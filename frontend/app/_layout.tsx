import {
  CormorantGaramond_300Light,
  CormorantGaramond_400Regular,
  CormorantGaramond_500Medium,
} from "@expo-google-fonts/cormorant-garamond";
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from "@expo-google-fonts/inter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { ActivityIndicator, View } from "react-native";
import { StripeProvider } from "@stripe/stripe-react-native";
import { AuthProvider } from "../src/auth";
import { PaymentProvider } from "../src/payments/PaymentProvider";
import { colors } from "../src/theme";

const STRIPE_PUBLISHABLE_KEY = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    CormorantGaramond_300Light,
    CormorantGaramond_400Regular,
    CormorantGaramond_500Medium,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  if (!fontsLoaded) {
    return (
      <View
        testID="root-loading"
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY} merchantIdentifier="merchant.com.lumina.app">
        <AuthProvider>
          <PaymentProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: colors.bg },
                animation: "fade",
              }}
            />
          </PaymentProvider>
        </AuthProvider>
      </StripeProvider>
    </QueryClientProvider>
  );
}
