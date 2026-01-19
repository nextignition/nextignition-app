import React, { useState, useEffect } from 'react';
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
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
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
import { Zap, ShieldCheck, Eye, EyeOff, CheckCircle2 } from 'lucide-react-native';
import { Logo } from '@/components/Logo';
import { isAdminEmail } from '@/constants/admin';

// Format number with suffix (K, M, B)
const formatNumber = (num: number): string => {
  if (num >= 1000000000) {
    return `${(num / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return num.toString();
};

// Format currency
const formatCurrency = (amount: number): string => {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  }
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  }
  if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  }
  return `$${amount.toFixed(0)}`;
};

// Platform stats type
interface PlatformStats {
  investor_count: number;
  founder_count: number;
  capital_raised: number;
}

export default function LoginScreen() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [platformStats, setPlatformStats] = useState<PlatformStats | null>(null);

  // Fetch platform stats on mount
  useEffect(() => {
    const fetchPlatformStats = async () => {
      try {
        const { data, error } = await supabase.rpc('get_platform_stats');
        
        if (error) {
          console.error('Error fetching platform stats:', error);
          return;
        }
        
        if (data) {
          setPlatformStats(data);
        }
      } catch (err) {
        console.error('Error fetching platform stats:', err);
      }
    };

    fetchPlatformStats();
  }, []);

  // Check for password reset success
  useEffect(() => {
    // Check URL params
    if (params.reset === 'success') {
      setShowSuccessMessage(true);
      // Clear the param from URL
      router.replace('/(auth)/login');
      // Hide message after 5 seconds
      setTimeout(() => {
        setShowSuccessMessage(false);
      }, 5000);
    }

    // Check sessionStorage (for web)
    if (Platform.OS === 'web' && typeof window !== 'undefined' && window.sessionStorage) {
      const success = window.sessionStorage.getItem('passwordResetSuccess');
      if (success === 'true') {
        setShowSuccessMessage(true);
        window.sessionStorage.removeItem('passwordResetSuccess');
        // Hide message after 5 seconds
        setTimeout(() => {
          setShowSuccessMessage(false);
        }, 5000);
      }
    }
  }, [params.reset]);

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
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {platformStats !== null
                    ? `${formatNumber(platformStats.investor_count)}+` 
                    : '70+'}
                </Text>
                <Text style={styles.statLabel}>Active investors</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {platformStats !== null
                    ? formatNumber(platformStats.founder_count) 
                    : '12k'}
                </Text>
                <Text style={styles.statLabel}>Global founders</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>
                  {platformStats !== null
                    ? formatCurrency(platformStats.capital_raised) 
                    : '$180M'}
                </Text>
                <Text style={styles.statLabel}>Capital raised</Text>
              </View>
            </View>
          </View>

          <LinearGradient colors={GRADIENTS.primary} style={styles.formCard}>
            <View style={styles.formHeader}>
              <Logo size={48} variant="icon" />
              <View style={styles.formHeaderText}>
                <Text style={styles.formTitle}>Welcome back</Text>
                <Text style={styles.formSubtitle}>Let&apos;s pick up where you left off</Text>
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setEmailError('');
                    setGeneralError('');
                  }}
                  placeholder="your@email.com"
                  placeholderTextColor="rgba(0,0,0,0.5)"
                  autoComplete="email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
              {emailError && <Text style={styles.inputErrorText}>{emailError}</Text>}
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    setPasswordError('');
                    setGeneralError('');
                  }}
                  placeholder="Enter your password"
                  placeholderTextColor="rgba(0,0,0,0.5)"
                  autoComplete="password"
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowPassword(!showPassword)}>
                  {showPassword ? (
                    <EyeOff size={20} color={COLORS.textSecondary} />
                  ) : (
                    <Eye size={20} color={COLORS.textSecondary} />
                  )}
                </TouchableOpacity>
              </View>
              {passwordError && <Text style={styles.inputErrorText}>{passwordError}</Text>}
            </View>

            <TouchableOpacity
              onPress={() => router.push('/(auth)/reset-password')}
              style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Forgot password?</Text>
            </TouchableOpacity>

            {showSuccessMessage && (
              <View style={styles.successContainer}>
                <CheckCircle2 size={20} color={COLORS.success} style={styles.successIcon} />
                <Text style={styles.successText}>
                  Password updated successfully! Please sign in with your new password.
                </Text>
              </View>
            )}

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

            <View style={styles.footer}>
              <Text style={styles.footerText}>Don&apos;t have an account?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/register')}>
                <Text style={styles.footerLink}>Create one in minutes</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
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
    // Standard auth layout on web: centered, constrained column
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
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
    backgroundColor: 'transparent',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    gap: SPACING.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
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
    color: COLORS.background,
  },
  formSubtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.85)',
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    ...TYPOGRAPHY.bodyStrong,
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
  },
  successContainer: {
    backgroundColor: `${COLORS.success}15`,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: `${COLORS.success}40`,
  },
  successIcon: {
    flexShrink: 0,
  },
  successText: {
    ...TYPOGRAPHY.body,
    color: COLORS.success,
    fontSize: FONT_SIZES.sm,
    flex: 1,
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
    ...(Platform.OS === 'web' && {
      maxWidth: 400,
      alignSelf: 'center',
    }),
    marginBottom: SPACING.lg,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.background,
    marginBottom: SPACING.xs,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  input: {
    height: 54,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.lg,
    paddingRight: 50,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    backgroundColor: 'transparent',
  },
  eyeIcon: {
    position: 'absolute',
    right: SPACING.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  inputErrorText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.background,
    marginTop: SPACING.xs,
  },
  securityCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  securityText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    flexWrap: 'wrap',
  },
  footerText: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.75)',
  },
  footerLink: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
  },
});
