import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
import {
  HelpCircle,
  Mail,
  BookOpen,
  Video,
  FileText,
  ChevronRight,
} from 'lucide-react-native';

const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: BookOpen,
    questions: [
      {
        q: 'How do I create an account?',
        a: 'Click on "Sign Up" and fill in your details. You\'ll need to verify your email address.',
      },
      {
        q: 'How do I choose my role?',
        a: 'After signing up, you\'ll be prompted to select your role: Founder, Investor, or Expert.',
      },
    ],
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    icon: FileText,
    questions: [
      {
        q: 'How do I update my profile?',
        a: 'Go to your Profile tab and click "Edit Profile" to update your information.',
      },
      {
        q: 'How do I change my password?',
        a: 'Go to Settings > Security > Change Password to update your password.',
      },
    ],
  },
  {
    id: 'funding',
    title: 'Funding & Investment',
    icon: Video,
    questions: [
      {
        q: 'How do I submit a pitch deck?',
        a: 'Go to Funding Portal and click "Upload Pitch Deck" to submit your deck.',
      },
      {
        q: 'How do investors find my startup?',
        a: 'Make sure your profile is set to "Public" and complete your startup information.',
      },
    ],
  },
];

const SUPPORT_EMAIL = 'support@nextignition.com';

export default function HelpScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const handleMailSupport = () => {
    const mailtoUrl = `mailto:${SUPPORT_EMAIL}`;
    Linking.openURL(mailtoUrl).catch((err) => {
      console.error('Failed to open email client:', err);
      alert('Unable to open email client. Please email us at ' + SUPPORT_EMAIL);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.accent} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <HelpCircle size={28} color={COLORS.background} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Help & Support</Text>
              <Text style={styles.heroSubtitle}>
                Find answers or get in touch with our support team
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
          <View style={styles.faqList}>
            {FAQ_CATEGORIES.map((category) => {
              const Icon = category.icon;
              return (
                <View key={category.id} style={styles.faqCategory}>
                  <TouchableOpacity
                    style={styles.faqCategoryHeader}
                    onPress={() =>
                      setSelectedCategory(
                        selectedCategory === category.id ? null : category.id
                      )
                    }
                    activeOpacity={0.7}>
                    <View style={styles.faqCategoryIcon}>
                      <Icon size={20} color={COLORS.primary} strokeWidth={2} />
                    </View>
                    <Text style={styles.faqCategoryTitle}>{category.title}</Text>
                    <ChevronRight
                      size={20}
                      color={COLORS.textSecondary}
                      strokeWidth={2}
                      style={[
                        styles.chevron,
                        selectedCategory === category.id && styles.chevronRotated,
                      ]}
                    />
                  </TouchableOpacity>
                  {selectedCategory === category.id && (
                    <View style={styles.faqQuestions}>
                      {category.questions.map((item, index) => (
                        <View key={index} style={styles.faqItem}>
                          <Text style={styles.faqQuestion}>{item.q}</Text>
                          <Text style={styles.faqAnswer}>{item.a}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Support</Text>
          <View style={styles.supportCard}>
            <Text style={styles.supportSubtitle}>
              Can&apos;t find what you&apos;re looking for? Email us directly
            </Text>
            <View style={styles.emailContainer}>
              <Mail size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.emailText}>{SUPPORT_EMAIL}</Text>
            </View>
            <TouchableOpacity
              style={styles.mailButton}
              onPress={handleMailSupport}
              activeOpacity={0.7}>
              <Mail size={20} color={COLORS.background} strokeWidth={2} />
              <Text style={styles.mailButtonText}>Mail Us</Text>
            </TouchableOpacity>
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
    padding: SPACING.lg,
    gap: SPACING.xl,
  },
  heroCard: {
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    ...SHADOWS.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  heroIcon: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroText: {
    flex: 1,
  },
  heroTitle: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZES.xxl,
    color: COLORS.background,
    marginBottom: SPACING.xs / 2,
  },
  heroSubtitle: {
    ...TYPOGRAPHY.body,
    color: 'rgba(255,255,255,0.85)',
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  faqList: {
    gap: SPACING.md,
  },
  faqCategory: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    overflow: 'hidden',
  },
  faqCategoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  faqCategoryIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  faqCategoryTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    flex: 1,
  },
  chevron: {
    transform: [{ rotate: '0deg' }],
  },
  chevronRotated: {
    transform: [{ rotate: '90deg' }],
  },
  faqQuestions: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
    gap: SPACING.md,
  },
  faqItem: {
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  faqQuestion: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  faqAnswer: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  supportCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.lg,
    alignItems: 'center',
  },
  supportSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emailContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    paddingVertical: SPACING.md,
  },
  emailText: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
  },
  mailButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  mailButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: FONT_SIZES.md,
  },
});
