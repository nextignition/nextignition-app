import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams } from 'expo-router';
import { Logo } from '@/components/Logo';
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
import { Mail, CheckCircle, Lock } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function CheckEmailResetScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;

  const handleGoToLogin = () => {
    router.replace('/(auth)/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={GRADIENTS.navy} style={StyleSheet.absoluteFill} />
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Logo size={80} variant="icon" />
        </View>

        <View style={styles.card}>
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Lock size={48} color={COLORS.primary} strokeWidth={2} />
            </View>
          </View>

          <Text style={styles.title}>Check Your Email</Text>
          <Text style={styles.subtitle}>
            We've sent password reset instructions to
          </Text>
          
          {email && (
            <Text style={styles.emailText}>{email}</Text>
          )}

          <View style={styles.infoBox}>
            <View style={styles.infoRow}>
              <CheckCircle size={20} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.infoText}>
                Click the link in the email to reset your password
              </Text>
            </View>
            <View style={styles.infoRow}>
              <CheckCircle size={20} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.infoText}>
                Check your spam folder if you don't see it
              </Text>
            </View>
            <View style={styles.infoRow}>
              <CheckCircle size={20} color={COLORS.warning} strokeWidth={2} />
              <Text style={styles.infoText}>
                The reset link will expire in 1 hour for security
              </Text>
            </View>
          </View>

          <View style={styles.noteBox}>
            <Text style={styles.noteText}>
              After clicking the link, you'll be able to set a new password for your NextIgnition account.
            </Text>
          </View>

          <Button
            title="Back to Login"
            onPress={handleGoToLogin}
            style={styles.loginButton}
          />

          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}>
            <Text style={styles.backButtonText}>Try Different Email</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
    gap: SPACING.xl,
  },
  logoContainer: {
    marginBottom: SPACING.lg,
  },
  card: {
    width: '100%',
    maxWidth: 520,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    gap: SPACING.lg,
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  iconContainer: {
    marginBottom: SPACING.sm,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight + '20',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  title: {
    ...TYPOGRAPHY.display,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
    textAlign: 'center',
    fontSize: FONT_SIZES.xxl,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
  },
  emailText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.primary,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.lg,
  },
  infoBox: {
    width: '100%',
    backgroundColor: COLORS.successLight + '20',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.success,
    gap: SPACING.md,
    marginTop: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    flex: 1,
  },
  noteBox: {
    width: '100%',
    backgroundColor: COLORS.primaryLight + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    marginTop: SPACING.sm,
  },
  noteText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: SPACING.md,
    ...(Platform.OS === 'web' && {
      maxWidth: 400,
      alignSelf: 'center',
      width: 'auto',
    }),
  },
  backButton: {
    marginTop: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  backButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: FONT_SIZES.sm,
  },
});
