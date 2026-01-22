import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams } from 'expo-router';
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
import { Mail, CheckCircle } from 'lucide-react-native';

export default function CheckEmailScreen() {
  const params = useLocalSearchParams();
  const email = params.email as string;

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={GRADIENTS.navy} style={StyleSheet.absoluteFill} />
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <View style={styles.card}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconCircle}>
              <Mail size={32} color={COLORS.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.checkBadge}>
              <CheckCircle size={18} color={COLORS.success} fill={COLORS.success} strokeWidth={2.5} />
            </View>
          </View>

          <Text style={styles.title}>Email Sent</Text>
          
          {email && (
            <View style={styles.emailContainer}>
              <Text style={styles.emailLabel}>Sent to:</Text>
            <Text style={styles.emailText}>{email}</Text>
            </View>
          )}

          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>
              Please check your email and click the verification link to complete your registration.
              </Text>
            <Text style={styles.subMessageText}>
              After verification, you'll be able to login to your account.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    minHeight: '100%',
  },
  card: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    ...SHADOWS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  iconWrapper: {
    position: 'relative',
    marginBottom: SPACING.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  checkBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: '#FFFFFF',
    borderRadius: BORDER_RADIUS.full,
    padding: 2,
    ...SHADOWS.sm,
  },
  title: {
    ...TYPOGRAPHY.heading,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    fontSize: FONT_SIZES.xxl,
  },
  emailContainer: {
    width: '100%',
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emailLabel: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
    fontSize: FONT_SIZES.sm,
  },
  emailText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.primary,
    fontSize: FONT_SIZES.md,
    lineHeight: 22,
  },
  messageContainer: {
    width: '100%',
    gap: SPACING.sm,
  },
  messageText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    textAlign: 'center',
    fontSize: FONT_SIZES.md,
    lineHeight: 24,
  },
  subMessageText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
    marginTop: SPACING.xs,
  },
});
