import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
  GRADIENTS,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { validateEmail } from '@/utils/validation';
import { Zap, ShieldCheck } from 'lucide-react-native';
import { Logo } from '@/components/Logo';
import { isAdminEmail } from '@/constants/admin';

const HERO_STATS = [
  { label: 'Active investors', value: '70+' },
  { label: 'Global founders', value: '12k' },
  { label: 'Capital raised', value: '$180M' },
];

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setEmailError('');
    setPasswordError('');
    setGeneralError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    if (!password) {
      setPasswordError('Password is required');
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) throw error;

      if (data.user) {
        if (!data.user.email_confirmed_at) {
          setGeneralError('Please verify your email before signing in.');
          Alert.alert(
            'Verification required',
            'Check your inbox for the confirmation link, then try signing in again.',
          );
          await supabase.auth.signOut();
          setLoading(false);
          return;
        }

        // Check if this is an admin login
        if (isAdminEmail(email)) {
          // Verify user has admin role set in database
          const { data: profile } = await supabase
            .from('profiles')
            .select('role, onboarding_completed')
            .eq('id', data.user.id)
            .maybeSingle();

          if (profile?.role === 'admin') {
            // Redirect directly to admin dashboard
            router.replace('/(admin)/dashboard');
            return;
          } else {
            // Admin email but role not set - show error
            setGeneralError('Admin access not configured. Please contact support.');
            await supabase.auth.signOut();
            setLoading(false);
            return;
          }
        }

        // Regular user flow
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, onboarding_completed')
          .eq('id', data.user.id)
          .maybeSingle();

        if (!profile?.role) {
          router.replace('/(auth)/role-selection');
        } else if (!profile?.onboarding_completed) {
          router.replace('/(auth)/onboarding');
        } else {
          router.replace('/(tabs)');
        }
      }
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'Failed to sign in'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={GRADIENTS.navy} style={StyleSheet.absoluteFill} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.hero}>
            <Image
              source={{ uri: 'https://raw.githubusercontent.com/nextignition/public-logo/refs/heads/main/Logo%20Design/Secondary.png' }}
              style={styles.heroLogo}
              resizeMode="contain"
            />
            
            <Text style={styles.heroTitle}>Ignite the next chapter of your startup</Text>
            <Text style={styles.heroSubtitle}>
              Tap into curated capital, operator knowledge, and a private network designed for
              breakout founders.
            </Text>
            <View style={styles.heroStats}>
              {HERO_STATS.map((stat) => (
                <View key={stat.label} style={styles.statCard}>
                  <Text style={styles.statValue}>{stat.value}</Text>
                  <Text style={styles.statLabel}>{stat.label}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.formCard}>
            <View style={styles.formHeader}>
              <Logo size={48} variant="icon" />
              <View style={styles.formHeaderText}>
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>Let&apos;s pick up where you left off</Text>
              </View>
            </View>

            <Input
              label="Email"
              type="email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError('');
                setGeneralError('');
              }}
              error={emailError}
              placeholder="your@email.com"
              autoComplete="email"
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError('');
                setGeneralError('');
              }}
              error={passwordError}
              placeholder="Enter your password"
              autoComplete="password"
            />

            <TouchableOpacity
              onPress={() => router.push('/(auth)/reset-password')}
              style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {generalError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            )}

            <Button 
              title="Sign In" 
              onPress={handleLogin} 
              loading={loading} 
              style={styles.loginButton}
            />

            <View style={styles.securityCallout}>
              <ShieldCheck size={16} color={COLORS.primary} />
              <Text style={styles.securityText}>Enterprise-grade authentication secured by Supabase</Text>
            </View>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>Create one in minutes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: SPACING.lg,
    justifyContent: 'center',
    gap: SPACING.xl,
  },
  hero: {
    padding: SPACING.xl,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.18)',
    ...SHADOWS.sm,
  },
  heroLogo: {
    width: 200,
    height: 80,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  heroBadgeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyMedium,
    letterSpacing: 0.5,
  },
  heroTitle: {
    ...TYPOGRAPHY.display,
    color: COLORS.background,
    marginBottom: SPACING.sm,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: SPACING.lg,
  },
  heroStats: {
    flexDirection: 'row',
    gap: SPACING.md,
    flexWrap: 'wrap',
  },
  statCard: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    flex: 1,
    minWidth: 120,
  },
  statValue: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: 28,
    color: COLORS.background,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.76)',
    marginTop: SPACING.xs / 2,
  },
  formCard: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  formHeaderText: {
    flex: 1,
  },
  formTitle: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.text,
  },
  formSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodyStrong,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
  },
  errorContainer: {
    backgroundColor: `${COLORS.error}15`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  loginButton: {
    marginBottom: SPACING.lg,
  },
  securityCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  footer: {
    gap: SPACING.xs,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  footerLink: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
  },
});
