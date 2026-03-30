import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable, Alert, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import Colors from '@/constants/colors';
import { useSubscription, SubscriptionPlan } from '@/lib/subscription-context';
import { useAuth } from '@/lib/auth-context';

const PLANS = [
  {
    id: 'yearly' as SubscriptionPlan,
    name: 'Annual',
    price: '₹99',
    period: '/year',
    perMonth: '₹8.25/month',
    badge: 'Best Value',
    color: Colors.light.tint,
    savings: 'Save 37%',
  },
  {
    id: 'monthly' as SubscriptionPlan,
    name: 'Monthly',
    price: '₹11',
    period: '/month',
    perMonth: 'Billed monthly',
    badge: null,
    color: '#3B82F6',
    savings: null,
  },
];

const FEATURES = [
  { icon: 'message-square', text: 'Unlimited SMS parsing' },
  { icon: 'bar-chart-2', text: 'Unlimited expense & income tracking' },
  { icon: 'pie-chart', text: 'Monthly balance dashboard' },
  { icon: 'clock', text: 'Full transaction history' },
  { icon: 'filter', text: 'Smart category filters' },
  { icon: 'shield', text: 'Your data stays on your device' },
];

export default function SubscriptionScreen() {
  const insets = useSafeAreaInsets();
  const { subscribe, trialDaysLeft, isSubscribed, isTrialActive } = useSubscription();
  const { user, signOut } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>('yearly');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubscribe = async () => {
    setIsLoading(true);
    try {
      await subscribe(selectedPlan);
      Alert.alert(
        'Subscribed!',
        `You're now subscribed to SpendWise ${selectedPlan === 'monthly' ? 'Monthly (₹11/month)' : 'Annual (₹99/year)'}. Thank you!`,
        [{ text: 'Start Tracking', onPress: () => router.replace('/(tabs)') }]
      );
    } catch {
      Alert.alert('Error', 'Subscription failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = () => {
    Alert.alert('Restore Purchase', 'No previous purchase found for this account.', [{ text: 'OK' }]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <LinearGradient
        colors={['#0D9373', '#087A60']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.heroCard}
      >
        <View style={styles.logoRow}>
          <View style={styles.logo}>
            <Feather name="trending-down" size={24} color="#fff" />
          </View>
          <Text style={styles.appName}>SpendWise</Text>
        </View>
        {isTrialActive ? (
          <>
            <Text style={styles.heroTitle}>
              {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left in your trial
            </Text>
            <Text style={styles.heroSubtitle}>Subscribe to keep full access after your trial ends</Text>
          </>
        ) : isSubscribed ? (
          <>
            <Text style={styles.heroTitle}>You're subscribed!</Text>
            <Text style={styles.heroSubtitle}>Thank you for supporting SpendWise</Text>
          </>
        ) : (
          <>
            <Text style={styles.heroTitle}>Your trial has ended</Text>
            <Text style={styles.heroSubtitle}>Subscribe to continue using SpendWise</Text>
          </>
        )}
      </LinearGradient>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Everything included</Text>
        <View style={styles.featureGrid}>
          {FEATURES.map(f => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureCheck}>
                <Feather name="check" size={14} color={Colors.light.tint} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Choose your plan</Text>
        {PLANS.map(plan => (
          <Pressable
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && { borderColor: plan.color, borderWidth: 2 },
            ]}
            onPress={() => setSelectedPlan(plan.id)}
          >
            {plan.badge && (
              <View style={[styles.planBadge, { backgroundColor: plan.color }]}>
                <Text style={styles.planBadgeText}>{plan.badge}</Text>
              </View>
            )}
            <View style={styles.planLeft}>
              <View style={[styles.radio, selectedPlan === plan.id && { borderColor: plan.color }]}>
                {selectedPlan === plan.id && <View style={[styles.radioDot, { backgroundColor: plan.color }]} />}
              </View>
              <View>
                <Text style={styles.planName}>{plan.name}</Text>
                <Text style={styles.planPerMonth}>{plan.perMonth}</Text>
              </View>
            </View>
            <View style={styles.planRight}>
              {plan.savings && (
                <Text style={[styles.planSavings, { color: plan.color }]}>{plan.savings}</Text>
              )}
              <Text style={styles.planPrice}>{plan.price}</Text>
              <Text style={styles.planPeriod}>{plan.period}</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {!isSubscribed && (
        <View style={styles.ctaSection}>
          <Pressable
            style={({ pressed }) => [styles.subscribeButton, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.6 }]}
            onPress={handleSubscribe}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Feather name="unlock" size={18} color="#fff" />
                <Text style={styles.subscribeButtonText}>
                  Subscribe {selectedPlan === 'yearly' ? '• ₹99/year' : '• ₹11/month'}
                </Text>
              </>
            )}
          </Pressable>

          <Pressable onPress={handleRestore}>
            <Text style={styles.restoreText}>Restore Purchase</Text>
          </Pressable>
        </View>
      )}

      {user && (
        <View style={styles.accountSection}>
          <View style={styles.accountRow}>
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>{user.name.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.accountName}>{user.name}</Text>
              <Text style={styles.accountEmail}>{user.email}</Text>
            </View>
            <Pressable style={styles.signOutButton} onPress={async () => { await signOut(); router.replace('/auth'); }}>
              <Feather name="log-out" size={16} color={Colors.light.danger} />
            </Pressable>
          </View>
        </View>
      )}

      <Text style={styles.footnote}>
        Prices are in Indian Rupees (INR). Subscriptions auto-renew unless cancelled.
        Cancel anytime from your account settings.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  heroCard: {
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  logo: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  appName: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: 20,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
    marginBottom: 12,
  },
  featureGrid: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.light.tintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.text,
  },
  planCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
    position: 'relative',
  },
  planBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  planBadgeText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: Colors.light.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  planName: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
  },
  planPerMonth: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  planRight: {
    alignItems: 'flex-end',
  },
  planSavings: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    marginBottom: 2,
  },
  planPrice: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
  },
  planPeriod: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
  },
  ctaSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
    gap: 12,
  },
  subscribeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  restoreText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  accountSection: {
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: Colors.light.card,
    borderRadius: 16,
    padding: 16,
  },
  accountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  accountName: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
  },
  accountEmail: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
  },
  signOutButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footnote: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textMuted,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 16,
    marginBottom: 8,
  },
});
