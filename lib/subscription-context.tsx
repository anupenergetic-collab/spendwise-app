import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SUB_KEY = '@spendwise_subscription';
const TRIAL_DAYS = 30;

export type SubscriptionPlan = 'monthly' | 'yearly';

export interface Subscription {
  trialStartDate: string;
  isSubscribed: boolean;
  plan?: SubscriptionPlan;
  subscribedAt?: string;
  expiresAt?: string;
}

interface SubscriptionContextValue {
  subscription: Subscription | null;
  isLoading: boolean;
  trialDaysLeft: number;
  isTrialActive: boolean;
  isSubscribed: boolean;
  hasAccess: boolean;
  subscribe: (plan: SubscriptionPlan) => Promise<void>;
  initTrial: () => Promise<void>;
}

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SUB_KEY).then(data => {
      if (data) setSubscription(JSON.parse(data));
      setIsLoading(false);
    });
  }, []);

  const initTrial = useCallback(async () => {
    if (subscription) return;
    const sub: Subscription = {
      trialStartDate: new Date().toISOString(),
      isSubscribed: false,
    };
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify(sub));
    setSubscription(sub);
  }, [subscription]);

  const subscribe = useCallback(async (plan: SubscriptionPlan) => {
    const now = new Date();
    const expires = new Date(now);
    if (plan === 'monthly') {
      expires.setMonth(expires.getMonth() + 1);
    } else {
      expires.setFullYear(expires.getFullYear() + 1);
    }
    const sub: Subscription = {
      trialStartDate: subscription?.trialStartDate ?? now.toISOString(),
      isSubscribed: true,
      plan,
      subscribedAt: now.toISOString(),
      expiresAt: expires.toISOString(),
    };
    await AsyncStorage.setItem(SUB_KEY, JSON.stringify(sub));
    setSubscription(sub);
  }, [subscription]);

  const trialDaysLeft = (() => {
    if (!subscription?.trialStartDate) return TRIAL_DAYS;
    const start = new Date(subscription.trialStartDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, TRIAL_DAYS - elapsed);
  })();

  const isTrialActive = trialDaysLeft > 0;
  const isSubscribed = !!subscription?.isSubscribed;
  const hasAccess = isTrialActive || isSubscribed;

  return (
    <SubscriptionContext.Provider value={{
      subscription,
      isLoading,
      trialDaysLeft,
      isTrialActive,
      isSubscribed,
      hasAccess,
      subscribe,
      initTrial,
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const ctx = useContext(SubscriptionContext);
  if (!ctx) throw new Error('useSubscription must be used within SubscriptionProvider');
  return ctx;
}
