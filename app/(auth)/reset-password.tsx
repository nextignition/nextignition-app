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
  TextInput,
  Alert,
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
  GRADIENTS,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { supabase } from '@/lib/supabase';
import { validateEmail, validatePassword, validateConfirmPassword } from '@/utils/validation';
import { ArrowLeft, Mail, Sparkles, Eye, EyeOff } from 'lucide-react-native';
import Constants from 'expo-constants';

export default function ResetPasswordScreen() {
  const params = useLocalSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isResetting, setIsResetting] = useState(false); // true when user is setting new password

  // Check if we're in password update mode (has token from email link)
  useEffect(() => {
    // Check if we have URL parameters indicating a password reset flow
    // Supabase redirects with hash fragments that get parsed by the SDK
    const checkForResetSession = async () => {
      try {
        // Check URL params first (type=recovery indicates password reset)
        const urlType = params.type as string;
        const hasAccessToken = !!params.access_token;
        const hasTokenHash = !!params.token_hash;
        
        console.log('[Reset Password] Checking for reset session:', {
          urlType,
          hasAccessToken,
          hasTokenHash,
          params: Object.keys(params),
        });
        
        if (urlType === 'recovery' || hasAccessToken || hasTokenHash) {
          // User came from reset link - show password update form
          console.log('[Reset Password] Detected reset link, showing password form');
          setIsResetting(true);
          return;
        }
        
        // Also check if there's a session (user clicked reset link)
        // This handles the case where Supabase has already processed the token
        const { data: { session } } = await supabase.auth.getSession();
        
        console.log('[Reset Password] Session check:', {
          hasSession: !!session,
          userId: session?.user?.id,
        });
        
        // If we have a session and we're on this page, it might be from a password reset
        // Show the password update form to allow user to set new password
        if (session) {
          console.log('[Reset Password] Session found, showing password form');
          setIsResetting(true);
        }
      } catch (error) {
        console.error('[Reset Password] Error checking reset session:', error);
      }
    };
    
    checkForResetSession();
  }, [params]);

  const handleRequestReset = async () => {
    setEmailError('');
    setGeneralError('');

    const emailValidation = validateEmail(email);
    if (!emailValidation.isValid) {
      setEmailError(emailValidation.error || '');
      return;
    }

    setLoading(true);

    try {
      // Build redirect URL for password reset
      // IMPORTANT: This must match EXACTLY one of the redirect URLs in Supabase Dashboard
      // NO trailing slashes, NO spaces, NO wildcards - exact match only
      let redirectUrl: string;
      
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        // For web, use the full URL with /reset-password route
        // Trim any whitespace and ensure no trailing slash
        const baseUrl = window.location.origin.trim();
        redirectUrl = `${baseUrl}/reset-password`.trim();
        console.log('[Reset Password] Email redirect URL (web):', redirectUrl);
      } else {
        // For mobile, use deep link that opens the app
        const scheme = (Constants.expoConfig?.scheme || 'nextignition').trim();
        redirectUrl = `${scheme}://reset-password`.trim();
        console.log('[Reset Password] Email redirect URL (mobile):', redirectUrl);
      }

      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: redirectUrl,
        }
      );

      if (error) throw error;

      // Navigate to check-email screen with the email address
      router.replace({
        pathname: '/(auth)/check-email-reset',
        params: { email: email.trim() },
      });
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'Failed to send reset email'
      );
      setLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      setPasswordError(passwordValidation.error || '');
      return;
    }

    const confirmValidation = validateConfirmPassword(password, confirmPassword);
    if (!confirmValidation.isValid) {
      setConfirmPasswordError(confirmValidation.error || '');
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      // Show success and redirect to login
      Alert.alert(
        'Password Updated',
        'Your password has been successfully updated. Please sign in with your new password.',
        [
          {
            text: 'Sign In',
            onPress: () => {
              router.replace('/(auth)/login');
            },
          },
        ]
      );
      
      // Also redirect after a short delay
      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err) {
      setGeneralError(
        err instanceof Error ? err.message : 'Failed to update password'
      );
    } finally {
      setLoading(false);
    }
  };

  // Show success screen after requesting reset
  if (success && !isResetting) {
    return (
      <SafeAreaView style={styles.container}>
        <LinearGradient colors={GRADIENTS.navy} style={StyleSheet.absoluteFill} />
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <Mail size={48} color={COLORS.accent} />
          </View>
          <Text style={styles.successTitle}>Check your inbox</Text>
          <Text style={styles.successText}>
            We&apos;ve sent password reset instructions to {email}. Follow the secure link to set a
            new password.
          </Text>
          <Button
            title="Return to login"
            onPress={() => router.push('/(auth)/login')}
            variant="secondary"
            style={styles.successCta}
          />
        </View>
      </SafeAreaView>
    );
  }

  // Show password update form if user came from reset link
  if (isResetting) {
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
            <View style={styles.heroCard}>
              <View style={styles.heroBadge}>
                <Sparkles size={16} color={COLORS.accent} />
                <Text style={styles.heroBadgeText}>Security first</Text>
              </View>
              <Text style={styles.title}>Set new password</Text>
              <Text style={styles.subtitle}>
                Enter your new password below. Make sure it&apos;s strong and secure.
              </Text>
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={password}
                    onChangeText={(text) => {
                      setPassword(text);
                      setPasswordError('');
                      setGeneralError('');
                    }}
                    placeholder="Enter new password"
                    placeholderTextColor={COLORS.textSecondary}
                    autoComplete="password-new"
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

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={confirmPassword}
                    onChangeText={(text) => {
                      setConfirmPassword(text);
                      setConfirmPasswordError('');
                      setGeneralError('');
                    }}
                    placeholder="Confirm new password"
                    placeholderTextColor={COLORS.textSecondary}
                    autoComplete="password-new"
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    {showConfirmPassword ? (
                      <EyeOff size={20} color={COLORS.textSecondary} />
                    ) : (
                      <Eye size={20} color={COLORS.textSecondary} />
                    )}
                  </TouchableOpacity>
                </View>
                {confirmPasswordError && <Text style={styles.inputErrorText}>{confirmPasswordError}</Text>}
              </View>

              {generalError && (
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{generalError}</Text>
                </View>
              )}

              <Button
                title="Update Password"
                onPress={handleUpdatePassword}
                loading={loading}
                style={styles.submitButton}
              />

              <View style={styles.footer}>
                <Text style={styles.footerText}>Remember your password?</Text>
                <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                  <Text style={styles.footerLink}>Back to login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Show request reset form (default)
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
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={COLORS.background} />
          </TouchableOpacity>

          <View style={styles.heroCard}>
            <View style={styles.heroBadge}>
              <Sparkles size={16} color={COLORS.accent} />
              <Text style={styles.heroBadgeText}>Security first</Text>
            </View>
            <Text style={styles.title}>Reset your access</Text>
            <Text style={styles.subtitle}>
              We'll email you a secure link to update your password. The link stays live for 1 hour.
            </Text>
            <View style={styles.supportList}>
              <Text style={styles.supportItem}>• Secure reset flow</Text>
              <Text style={styles.supportItem}>• Support team on standby</Text>
            </View>
          </View>

          <View style={styles.form}>
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

            {generalError && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{generalError}</Text>
              </View>
            )}

            <Button
              title="Send reset instructions"
              onPress={handleRequestReset}
              loading={loading}
              style={styles.submitButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Remember your password?</Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.footerLink}>Back to login</Text>
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
    gap: SPACING.lg,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.16)',
    backgroundColor: 'rgba(255,255,255,0.08)',
    ...SHADOWS.sm,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'flex-start',
    marginBottom: SPACING.md,
  },
  heroBadgeText: {
    ...TYPOGRAPHY.label,
    color: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.display,
    color: COLORS.background,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.78)',
    lineHeight: 26,
  },
  supportList: {
    marginTop: SPACING.lg,
    gap: SPACING.xs,
  },
  supportItem: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
    opacity: 0.9,
  },
  form: {
    width: '100%',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
    gap: SPACING.md,
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
  submitButton: {
    marginBottom: SPACING.lg,
  },
  footer: {
    flexDirection: 'row',
    gap: SPACING.xs,
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
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  successIconContainer: {
    width: 96,
    height: 96,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successTitle: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.background,
    textAlign: 'center',
  },
  successText: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
    textAlign: 'center',
    opacity: 0.85,
  },
  successCta: {
    minWidth: 200,
  },
  inputContainer: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    ...TYPOGRAPHY.label,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    letterSpacing: 0.6,
  },
  inputWrapper: {
    position: 'relative',
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
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
    backgroundColor: COLORS.inputBackground,
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
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
