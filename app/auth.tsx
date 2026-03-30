import React, { useState } from 'react';
import {
  StyleSheet, Text, View, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert, ActivityIndicator,
  ScrollView, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather, Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import Colors from '@/constants/colors';
import { useAuth } from '@/lib/auth-context';
import { useSubscription } from '@/lib/subscription-context';

type Screen = 'welcome' | 'email-signin' | 'email-signup';

function GoogleSheet({
  visible,
  onClose,
  onSuccess,
}: {
  visible: boolean;
  onClose: () => void;
  onSuccess: (name: string, email: string) => void;
}) {
  const [step, setStep] = useState<'email' | 'name'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleEmailNext = () => {
    if (!email.trim() || !email.includes('@')) {
      Alert.alert('Invalid email', 'Please enter a valid email address.');
      return;
    }
    const guessedName = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    setName(guessedName);
    setStep('name');
  };

  const handleSignIn = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter your name.');
      return;
    }
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLoading(false);
    onSuccess(name.trim(), email.trim().toLowerCase());
    setStep('email');
    setEmail('');
    setName('');
  };

  const handleClose = () => {
    onClose();
    setStep('email');
    setEmail('');
    setName('');
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={handleClose}>
      <KeyboardAvoidingView
        style={styles.sheetBackdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.sheetHandle} />

          <View style={styles.googleHeaderRow}>
            <View style={styles.googleLogoCircle}>
              <Text style={styles.googleLogoG}>G</Text>
            </View>
            <View>
              <Text style={styles.googleHeaderTitle}>Sign in with Google</Text>
              <Text style={styles.googleHeaderSub}>Use your Google Account</Text>
            </View>
          </View>

          {step === 'email' ? (
            <>
              <Text style={styles.sheetLabel}>Email or phone</Text>
              <View style={styles.sheetInputRow}>
                <Feather name="at-sign" size={16} color={Colors.light.textMuted} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Enter your Gmail address"
                  placeholderTextColor={Colors.light.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                  returnKeyType="next"
                  onSubmitEditing={handleEmailNext}
                />
              </View>
              <Text style={styles.sheetHint}>
                Not your computer? Use a private browsing window to sign in.
              </Text>
              <View style={styles.sheetButtonRow}>
                <Pressable style={styles.sheetSecondaryButton} onPress={handleClose}>
                  <Text style={styles.sheetSecondaryText}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.sheetPrimaryButton, !email.trim() && { opacity: 0.4 }]}
                  onPress={handleEmailNext}
                  disabled={!email.trim()}
                >
                  <Text style={styles.sheetPrimaryText}>Next</Text>
                </Pressable>
              </View>
            </>
          ) : (
            <>
              <View style={styles.emailChip}>
                <Feather name="user" size={14} color={Colors.light.tint} />
                <Text style={styles.emailChipText}>{email}</Text>
              </View>
              <Text style={styles.sheetLabel}>Your name</Text>
              <View style={styles.sheetInputRow}>
                <Feather name="user" size={16} color={Colors.light.textMuted} />
                <TextInput
                  style={styles.sheetInput}
                  placeholder="Full name"
                  placeholderTextColor={Colors.light.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                  autoFocus
                  returnKeyType="done"
                  onSubmitEditing={handleSignIn}
                />
              </View>
              <View style={styles.sheetButtonRow}>
                <Pressable style={styles.sheetSecondaryButton} onPress={() => setStep('email')}>
                  <Text style={styles.sheetSecondaryText}>Back</Text>
                </Pressable>
                <Pressable
                  style={[styles.sheetPrimaryButton, (!name.trim() || loading) && { opacity: 0.6 }]}
                  onPress={handleSignIn}
                  disabled={!name.trim() || loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" size="small" />
                  ) : (
                    <Text style={styles.sheetPrimaryText}>Sign in</Text>
                  )}
                </Pressable>
              </View>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export default function AuthScreen() {
  const insets = useSafeAreaInsets();
  const { user, signInWithEmail, signUpWithEmail, signInWithGoogle } = useAuth();
  const { hasAccess, initTrial } = useSubscription();
  const [screen, setScreen] = useState<Screen>('welcome');
  const [googleSheetVisible, setGoogleSheetVisible] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (user && hasAccess) return <Redirect href="/(tabs)" />;
  if (user && !hasAccess) return <Redirect href="/subscription" />;

  const handleGoogleSuccess = async (googleName: string, googleEmail: string) => {
    setGoogleSheetVisible(false);
    try {
      await signInWithGoogle({ name: googleName, email: googleEmail });
      await initTrial();
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Error', 'Sign-in failed. Please try again.');
    }
  };

  const handleEmailSubmit = async () => {
    const trimmedEmail = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail || !emailRegex.test(trimmedEmail)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (screen === 'email-signup' && !name.trim()) {
      Alert.alert('Name Required', 'Please enter your name to create an account.');
      return;
    }
    setIsLoading(true);
    try {
      if (screen === 'email-signup') {
        await signUpWithEmail(name.trim(), trimmedEmail);
      } else {
        await signInWithEmail(trimmedEmail);
      }
      await initTrial();
      router.replace('/(tabs)');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      Alert.alert(screen === 'email-signup' ? 'Sign Up Failed' : 'Sign In Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  if (screen === 'email-signin' || screen === 'email-signup') {
    return (
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={[styles.emailScreen, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backButton} onPress={() => setScreen('welcome')}>
            <Ionicons name="arrow-back" size={22} color={Colors.light.text} />
          </Pressable>

          <View style={styles.emailHeader}>
            <View style={styles.emailIconWrap}>
              <Feather name="mail" size={28} color={Colors.light.tint} />
            </View>
            <Text style={styles.emailTitle}>
              {screen === 'email-signup' ? 'Create Account' : 'Welcome Back'}
            </Text>
            <Text style={styles.emailSubtitle}>
              {screen === 'email-signup' ? 'Start your free 30-day trial' : 'Sign in to continue'}
            </Text>
          </View>

          <View style={styles.form}>
            {screen === 'email-signup' && (
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <View style={styles.inputRow}>
                  <Feather name="user" size={16} color={Colors.light.textMuted} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Your name"
                    placeholderTextColor={Colors.light.textMuted}
                    value={name}
                    onChangeText={setName}
                    autoCapitalize="words"
                    returnKeyType="next"
                  />
                </View>
              </View>
            )}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email Address</Text>
              <View style={styles.inputRow}>
                <Feather name="at-sign" size={16} color={Colors.light.textMuted} />
                <TextInput
                  style={styles.textInput}
                  placeholder="you@example.com"
                  placeholderTextColor={Colors.light.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  returnKeyType="done"
                  onSubmitEditing={handleEmailSubmit}
                />
              </View>
            </View>

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && { opacity: 0.85 }, isLoading && { opacity: 0.6 }]}
              onPress={handleEmailSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>
                    {screen === 'email-signup' ? 'Start Free Trial' : 'Sign In'}
                  </Text>
                  <Feather name="arrow-right" size={18} color="#fff" />
                </>
              )}
            </Pressable>

            <Pressable onPress={() => setScreen(screen === 'email-signup' ? 'email-signin' : 'email-signup')}>
              <Text style={styles.switchText}>
                {screen === 'email-signup'
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 40 }]}>
      <GoogleSheet
        visible={googleSheetVisible}
        onClose={() => setGoogleSheetVisible(false)}
        onSuccess={handleGoogleSuccess}
      />

      <View style={styles.heroSection}>
        <View style={styles.logoWrap}>
          <Feather name="trending-down" size={36} color="#fff" />
        </View>
        <Text style={styles.appName}>SpendWise</Text>
        <Text style={styles.tagline}>Smart spending tracker</Text>

        <View style={styles.featureList}>
          {[
            { icon: 'message-square', text: 'Parse expenses from bank SMS' },
            { icon: 'bar-chart-2', text: 'Track income & expenses' },
            { icon: 'pie-chart', text: 'Monthly balance dashboard' },
          ].map(f => (
            <View key={f.icon} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Feather name={f.icon as any} size={16} color={Colors.light.tint} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.authSection}>
        <View style={styles.trialBadge}>
          <Feather name="gift" size={14} color={Colors.light.tint} />
          <Text style={styles.trialText}>30-day free trial • No credit card needed</Text>
        </View>

        <Pressable
          style={({ pressed }) => [styles.googleButton, pressed && { opacity: 0.85 }]}
          onPress={() => setGoogleSheetVisible(true)}
        >
          <View style={styles.googleIcon}>
            <Text style={styles.googleG}>G</Text>
          </View>
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </Pressable>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <Pressable
          style={({ pressed }) => [styles.emailButton, pressed && { opacity: 0.85 }]}
          onPress={() => setScreen('email-signup')}
        >
          <Feather name="mail" size={18} color={Colors.light.text} />
          <Text style={styles.emailButtonText}>Continue with Email</Text>
        </Pressable>

        <Pressable onPress={() => setScreen('email-signin')}>
          <Text style={styles.signinLink}>Already have an account? Sign in</Text>
        </Pressable>

        <Text style={styles.terms}>
          By continuing, you agree to our Terms of Service and Privacy Policy
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
    justifyContent: 'space-between',
  },
  heroSection: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingTop: 20,
  },
  logoWrap: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: Colors.light.tint,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    shadowColor: Colors.light.tint,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  appName: {
    fontSize: 32,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
    marginBottom: 6,
  },
  tagline: {
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
    marginBottom: 32,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.light.tintLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  featureText: {
    fontSize: 14,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.text,
  },
  authSection: {
    paddingHorizontal: 24,
    gap: 12,
  },
  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tintLight,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 6,
    alignSelf: 'center',
    marginBottom: 4,
  },
  trialText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.tint,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  googleIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleG: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  googleButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.gray200,
  },
  dividerText: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textMuted,
  },
  emailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 14,
    paddingVertical: 14,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
  },
  emailButtonText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.text,
  },
  signinLink: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.tint,
    textAlign: 'center',
  },
  terms: {
    fontSize: 11,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textMuted,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 4,
  },
  emailScreen: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emailHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  emailIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: Colors.light.tintLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emailTitle: {
    fontSize: 26,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
    marginBottom: 6,
  },
  emailSubtitle: {
    fontSize: 14,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.text,
    paddingVertical: 0,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.tint,
    borderRadius: 14,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  switchText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.tint,
    textAlign: 'center',
    marginTop: 4,
  },
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 12,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.light.gray300,
    alignSelf: 'center',
    marginBottom: 20,
  },
  googleHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.gray200,
  },
  googleLogoCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4285F4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleLogoG: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: '#fff',
  },
  googleHeaderTitle: {
    fontSize: 17,
    fontFamily: 'DMSans_700Bold',
    color: Colors.light.text,
  },
  googleHeaderSub: {
    fontSize: 13,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  sheetLabel: {
    fontSize: 13,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  sheetInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.gray100,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
    borderWidth: 1.5,
    borderColor: Colors.light.gray200,
    marginBottom: 12,
  },
  sheetInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.text,
    paddingVertical: 0,
  },
  sheetHint: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: Colors.light.textSecondary,
    marginBottom: 24,
    lineHeight: 17,
  },
  emailChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.tintLight,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  emailChipText: {
    fontSize: 13,
    fontFamily: 'DMSans_500Medium',
    color: Colors.light.tint,
  },
  sheetButtonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 8,
  },
  sheetSecondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sheetSecondaryText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.light.tint,
  },
  sheetPrimaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    backgroundColor: Colors.light.tint,
    minWidth: 80,
    alignItems: 'center',
  },
  sheetPrimaryText: {
    fontSize: 15,
    fontFamily: 'DMSans_600SemiBold',
    color: '#fff',
  },
});
