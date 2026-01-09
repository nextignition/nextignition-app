import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
import { CheckCircle } from 'lucide-react-native';
import { Button } from '@/components/Button';

export default function EmailVerifiedScreen() {
  useEffect(() => {
    // Auto-redirect to login after 5 seconds
    const timer = setTimeout(() => {
      router.replace('/(auth)/login');
    }, 5000);

    return () => clearTimeout(timer);
  }, []);

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
            <CheckCircle size={64} color={COLORS.success} strokeWidth={2.5} fill={COLORS.success + '20'} />
          </View>

          <Text style={styles.title}>Email Verified!</Text>
          <Text style={styles.subtitle}>
            Your email address has been successfully verified. You can now sign in to your account.
          </Text>

          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              You'll be redirected to the login page automatically in a few seconds, or you can click the button below to go there now.
            </Text>
          </View>

          <Button
            title="Go to Login"
            onPress={handleGoToLogin}
            style={styles.loginButton}
          />
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
  title: {
    ...TYPOGRAPHY.display,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
    textAlign: 'center',
    fontSize: FONT_SIZES.xxl,
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontSize: FONT_SIZES.md,
  },
  infoBox: {
    backgroundColor: COLORS.primaryLight + '15',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    width: '100%',
    marginTop: SPACING.sm,
  },
  infoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  loginButton: {
    width: '100%',
    marginTop: SPACING.md,
  },
});
