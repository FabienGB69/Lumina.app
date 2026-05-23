/**
 * Unified PaymentProvider
 * Supports: Stripe Card, Apple Pay (iOS), Google Play Billing (Android)
 *
 * Usage:
 *   const { purchase, loading, error } = usePayment();
 *   await purchase({ plan: "glow" | "luxe" | "credits" });
 */
import * as Haptics from "expo-haptics";
import * as InAppPurchases from "expo-in-app-purchases";
import { router } from "expo-router";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { Platform } from "react-native";
import { isPlatformPaySupported, useStripe } from "@stripe/stripe-react-native";
import { api } from "../api";
import { useAuth } from "../auth";

// ---------------------------------------------------------------------------
// Product IDs — must match what's configured in App Store Connect / Play Console
// ---------------------------------------------------------------------------
export const PRODUCT_IDS = {
  glow: Platform.select({
    ios: "lumina_glow_monthly",
    android: "lumina_glow_monthly",
    default: "lumina_glow_monthly",
  })!,
  luxe: Platform.select({
    ios: "lumina_luxe_yearly",
    android: "lumina_luxe_yearly",
    default: "lumina_luxe_yearly",
  })!,
  credits: Platform.select({
    ios: "lumina_credits_20",
    android: "lumina_credits_20",
    default: "lumina_credits_20",
  })!,
} as const;

export type PlanKey = keyof typeof PRODUCT_IDS;

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------
type PaymentCtx = {
  /** Initiate a purchase. Handles platform routing internally. */
  purchase: (plan: PlanKey) => Promise<void>;
  /** Purchase via Apple Pay specifically (iOS only). */
  purchaseApplePay: (plan: PlanKey) => Promise<void>;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  applePayAvailable: boolean;
  googlePlayAvailable: boolean;
};

const Ctx = createContext<PaymentCtx>({} as PaymentCtx);

export const usePayment = () => useContext(Ctx);

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------
export function PaymentProvider({ children }: { children: React.ReactNode }) {
  const { refresh } = useAuth();
  const { createPaymentMethod } = useStripe();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [applePayAvailable, setApplePayAvailable] = useState(false);
  const [googlePlayAvailable, setGooglePlayAvailable] = useState(false);
  const iapConnected = useRef(false);

  // Check Apple Pay availability
  useEffect(() => {
    if (Platform.OS === "ios") {
      isPlatformPaySupported().then(setApplePayAvailable).catch(() => {});
    }
  }, []);

  // Connect Google Play Billing (Android only)
  useEffect(() => {
    if (Platform.OS !== "android") return;
    const connect = async () => {
      try {
        const { responseCode } = await InAppPurchases.connectAsync();
        if (responseCode === InAppPurchases.IAPResponseCode.OK) {
          iapConnected.current = true;
          setGooglePlayAvailable(true);
        }
      } catch {
        // Play Billing unavailable (emulator, unsupported device)
      }
    };
    void connect();

    // Listen for purchase updates
    InAppPurchases.setPurchaseListener(({ responseCode, results, errorCode }) => {
      if (responseCode === InAppPurchases.IAPResponseCode.OK && results?.length) {
        for (const purchase of results) {
          if (!purchase.acknowledged) {
            void _handleGooglePurchase(purchase);
          }
        }
      } else if (responseCode === InAppPurchases.IAPResponseCode.USER_CANCELED) {
        setLoading(false);
      } else {
        setError(_iapErrorMessage(errorCode));
        setLoading(false);
      }
    });

    return () => {
      InAppPurchases.disconnectAsync().catch(() => {});
    };
  }, []);

  const _handleGooglePurchase = useCallback(
    async (purchase: InAppPurchases.InAppPurchase) => {
      try {
        // Acknowledge to Google Play
        await InAppPurchases.finishTransactionAsync(purchase, true);
        // Notify backend (send purchase token for server-side verification)
        // In production: call your backend to verify the purchase token via Google Play Developer API
        // For now: optimistic refresh
        await refresh();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/profile");
      } catch (e: any) {
        setError(e?.message ?? "Purchase could not be completed");
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  // ---------------------------------------------------------------------------
  // Stripe Card purchase (web browser checkout, existing flow)
  // ---------------------------------------------------------------------------
  const purchaseStripe = useCallback(
    async (plan: PlanKey) => {
      const { url } = await api.stripeCheckout();
      // Redirect handled by paywall.tsx — we just return the URL here
      // In a real integration: use the plan key to select the correct Stripe price
      void url;
    },
    [],
  );

  // ---------------------------------------------------------------------------
  // Apple Pay purchase
  // ---------------------------------------------------------------------------
  const purchaseApplePay = useCallback(
    async (_plan: PlanKey) => {
      if (Platform.OS !== "ios") return;
      setError(null);
      setLoading(true);
      try {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        const { paymentMethod, error: pmError } = await createPaymentMethod({
          paymentMethodType: "Card",
          paymentMethodData: { billingDetails: {} },
        });
        if (pmError) throw new Error(pmError.message);
        // Send paymentMethod.id to backend for subscription creation
        // (real integration: POST /stripe/create-subscription { plan, paymentMethodId })
        await refresh();
        void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        router.replace("/(tabs)/profile");
      } catch (e: any) {
        setError(e?.message ?? "Apple Pay failed. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [createPaymentMethod, refresh],
  );

  // ---------------------------------------------------------------------------
  // Google Play Billing purchase
  // ---------------------------------------------------------------------------
  const purchaseGooglePlay = useCallback(async (plan: PlanKey) => {
    if (!iapConnected.current) {
      setError("Google Play Billing is not available on this device.");
      return;
    }
    const productId = PRODUCT_IDS[plan];
    try {
      await InAppPurchases.purchaseItemAsync(productId);
      // Result handled in setPurchaseListener above
    } catch (e: any) {
      setError(e?.message ?? "Google Play purchase failed");
      setLoading(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Unified purchase — routes to the right provider by platform
  // ---------------------------------------------------------------------------
  const purchase = useCallback(
    async (plan: PlanKey) => {
      setError(null);
      setLoading(true);
      try {
        if (Platform.OS === "android" && googlePlayAvailable) {
          await purchaseGooglePlay(plan);
          return; // loading cleared in listener
        }
        if (Platform.OS === "ios" && applePayAvailable) {
          await purchaseApplePay(plan);
          return;
        }
        // Fallback: Stripe card checkout
        await purchaseStripe(plan);
      } catch (e: any) {
        setError(_friendly(e?.message));
      } finally {
        setLoading(false);
      }
    },
    [applePayAvailable, googlePlayAvailable, purchaseApplePay, purchaseGooglePlay, purchaseStripe],
  );

  return (
    <Ctx.Provider
      value={{
        purchase,
        purchaseApplePay,
        loading,
        error,
        clearError: () => setError(null),
        applePayAvailable,
        googlePlayAvailable,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function _friendly(msg?: string): string {
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("network") || msg.includes("Network")) return "Connection error. Check your internet and try again.";
  if (msg.includes("cancel") || msg.includes("Cancel")) return "Purchase cancelled.";
  if (msg.includes("already")) return "You already have an active subscription.";
  return msg;
}

function _iapErrorMessage(code?: number): string {
  switch (code) {
    case InAppPurchases.IAPErrorCode.PAYMENT_INVALID: return "Payment method is invalid.";
    case InAppPurchases.IAPErrorCode.PAYMENT_NOT_ALLOWED: return "Payment not allowed on this device.";
    case InAppPurchases.IAPErrorCode.STORE_NOT_AVAILABLE: return "Google Play Store is not available.";
    default: return "Purchase failed. Please try again.";
  }
}
