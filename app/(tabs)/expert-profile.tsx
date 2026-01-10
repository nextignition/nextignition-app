import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { Picker } from '@/components/Picker';
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
  Award,
  Link,
  Briefcase,
  Calendar,
  CheckCircle,
  X,
  Plus,
  Globe,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

import { INDUSTRIES } from '@/constants/industries';

const SKILLS_OPTIONS = [
  'Product Strategy',
  'Go-to-Market',
  'Fundraising',
  'Financial Planning',
  'Team Building',
  'Marketing',
  'Sales',
  'Operations',
  'Technology',
  'Legal',
];

export default function ExpertProfileScreen() {
  const { profile } = useAuth();
  const [experience, setExperience] = useState('10+ years in startup ecosystem');
  const [specialization, setSpecialization] = useState('Product Strategy, Go-to-Market');
  const [portfolio, setPortfolio] = useState('Helped 50+ startups scale from seed to Series A');
  const [industry, setIndustry] = useState('technology');
  const [selectedSkills, setSelectedSkills] = useState<string[]>(['Product Strategy', 'Go-to-Market']);
  const [isAvailable, setIsAvailable] = useState(true);
  const [hourlyRate, setHourlyRate] = useState('$150');
  const [linkedinUrl, setLinkedinUrl] = useState(profile?.linkedin_url || '');
  const [twitterUrl, setTwitterUrl] = useState(profile?.twitter_url || '');
  const [websiteUrl, setWebsiteUrl] = useState(profile?.website_url || '');
  const [saving, setSaving] = useState(false);

  const toggleSkill = (skill: string) => {
    setSelectedSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSave = async () => {
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      Alert.alert('Success', 'Expert profile updated successfully!');
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.accent} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Award size={28} color={COLORS.background} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Expert Profile</Text>
              <Text style={styles.heroSubtitle}>Manage your expertise and availability</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Experience & Specialization</Text>
          <Input
            label="Experience"
            value={experience}
            onChangeText={setExperience}
            placeholder="e.g., 10+ years in startup ecosystem"
            multiline
            numberOfLines={2}
          />
          <Input
            label="Specialization"
            value={specialization}
            onChangeText={setSpecialization}
            placeholder="e.g., Product Strategy, Go-to-Market"
          />
          <Input
            label="Portfolio"
            value={portfolio}
            onChangeText={setPortfolio}
            placeholder="Describe your achievements and track record"
            multiline
            numberOfLines={4}
          />
          <Picker
            label="Primary Industry"
            selectedValue={industry}
            onValueChange={setIndustry}
            items={INDUSTRIES}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Skills & Business Domains</Text>
          <Text style={styles.sectionSubtitle}>Select your areas of expertise</Text>
          <View style={styles.skillsGrid}>
            {SKILLS_OPTIONS.map((skill) => {
              const isSelected = selectedSkills.includes(skill);
              return (
                <TouchableOpacity
                  key={skill}
                  style={[styles.skillTag, isSelected && styles.skillTagSelected]}
                  onPress={() => toggleSkill(skill)}
                  activeOpacity={0.7}>
                  {isSelected ? (
                    <CheckCircle size={16} color={COLORS.primary} strokeWidth={2} />
                  ) : (
                    <View style={styles.skillTagDot} />
                  )}
                  <Text
                    style={[
                      styles.skillTagText,
                      isSelected && styles.skillTagTextSelected,
                    ]}>
                    {skill}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mentorship Availability</Text>
            <View style={styles.availabilityToggle}>
              <Calendar size={18} color={isAvailable ? COLORS.success : COLORS.textSecondary} strokeWidth={2} />
              <Switch
                value={isAvailable}
                onValueChange={setIsAvailable}
                trackColor={{ false: COLORS.border, true: COLORS.success }}
                thumbColor={COLORS.background}
              />
              <Text style={styles.availabilityLabel}>
                {isAvailable ? 'Available' : 'Unavailable'}
              </Text>
            </View>
          </View>
          {isAvailable && (
            <View style={styles.availabilityInfo}>
              <Input
                label="Hourly Rate"
                value={hourlyRate}
                onChangeText={setHourlyRate}
                placeholder="$150"
                keyboardType="numeric"
              />
              <Text style={styles.availabilityHint}>
                Set your hourly rate for mentorship sessions. This will be visible to founders
                requesting sessions.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>
          <View style={styles.socialLinks}>
            <View style={styles.socialLinkItem}>
              <Link size={18} color={COLORS.primary} strokeWidth={2} />
              <TextInput
                style={styles.socialLinkInput}
                value={linkedinUrl}
                onChangeText={setLinkedinUrl}
                placeholder="LinkedIn URL"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.socialLinkItem}>
              <Globe size={18} color={COLORS.primary} strokeWidth={2} />
              <TextInput
                style={styles.socialLinkInput}
                value={twitterUrl}
                onChangeText={setTwitterUrl}
                placeholder="Twitter URL"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
            <View style={styles.socialLinkItem}>
              <Globe size={18} color={COLORS.primary} strokeWidth={2} />
              <TextInput
                style={styles.socialLinkInput}
                value={websiteUrl}
                onChangeText={setWebsiteUrl}
                placeholder="Website URL"
                placeholderTextColor={COLORS.textSecondary}
              />
            </View>
          </View>
        </View>

        <Button
          title="Save Changes"
          onPress={handleSave}
          loading={saving}
          style={styles.saveButton}
        />
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  sectionSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  availabilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  availabilityLabel: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  availabilityInfo: {
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  availabilityHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  skillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  skillTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  skillTagSelected: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  skillTagDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.border,
  },
  skillTagText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  skillTagTextSelected: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  socialLinks: {
    gap: SPACING.sm,
  },
  socialLinkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  socialLinkInput: {
    flex: 1,
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
});

