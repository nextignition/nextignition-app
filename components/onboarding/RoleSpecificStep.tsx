import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from '@/components/Input';
import { SPACING, FONT_SIZES, FONT_WEIGHTS, COLORS } from '@/constants/theme';
import { OnboardingData } from '@/types/onboarding';
import { UserRole } from '@/types/user';
import { Picker } from '@/components/Picker';
import { INDUSTRIES } from '@/constants/industries';

interface RoleSpecificStepProps {
  role: UserRole;
  data: OnboardingData;
  onChange: (field: keyof OnboardingData, value: any) => void;
  errors: Partial<Record<keyof OnboardingData, string>>;
}

const VENTURE_STAGES = [
  { label: 'Select stage', value: '' },
  { label: 'Idea', value: 'idea' },
  { label: 'MVP', value: 'mvp' },
  { label: 'Growth', value: 'growth' },
  { label: 'Scale', value: 'scale' },
];

const INVESTMENT_STAGES = [
  { label: 'Select preferred stage', value: '' },
  { label: 'Pre-seed', value: 'pre_seed' },
  { label: 'Seed', value: 'seed' },
  { label: 'Series A', value: 'series_a' },
  { label: 'Series B', value: 'series_b' },
  { label: 'Series C+', value: 'series_c_plus' },
  { label: 'Growth', value: 'growth' },
];

const INVESTOR_TYPES = [
  { label: 'Select investor type', value: '' },
  { label: 'Angel Investor', value: 'angel' },
  { label: 'Venture Capital', value: 'vc' },
  { label: 'Corporate VC', value: 'corporate_vc' },
  { label: 'Family Office', value: 'family_office' },
  { label: 'Private Equity', value: 'private_equity' },
  { label: 'Accelerator/Incubator', value: 'accelerator' },
];

export function RoleSpecificStep({ role, data, onChange, errors }: RoleSpecificStepProps) {
  const renderFounderFields = () => (
    <>
      <Input
        label="Venture Name"
        value={data.ventureName || ''}
        onChangeText={(text) => onChange('ventureName', text)}
        error={errors.ventureName}
        placeholder="Your startup name"
      />

      <Input
        label="Venture Description"
        value={data.ventureDescription || ''}
        onChangeText={(text) => onChange('ventureDescription', text)}
        error={errors.ventureDescription}
        placeholder="What problem are you solving?"
        multiline
        numberOfLines={4}
        style={styles.textArea}
      />

      <Picker
        label="Industry"
        selectedValue={data.ventureIndustry || ''}
        onValueChange={(value) => onChange('ventureIndustry', value)}
        items={INDUSTRIES}
      />

      <Picker
        label="Current Stage"
        selectedValue={data.ventureStage || ''}
        onValueChange={(value) => onChange('ventureStage', value)}
        items={VENTURE_STAGES}
      />
    </>
  );

  const renderInvestorFields = () => (
    <>
      <Input
        label="Company/Firm Name"
        value={data.investmentFirm || ''}
        onChangeText={(text) => onChange('investmentFirm', text)}
        error={errors.investmentFirm}
        placeholder="e.g., Sequoia Capital, Individual Investor"
      />

      <Picker
        label="Investor Type"
        selectedValue={data.investorType || ''}
        onValueChange={(value) => onChange('investorType', value)}
        items={INVESTOR_TYPES}
        error={errors.investorType}
      />

      <Input
        label="Years of Investment Experience"
        value={data.yearsExperience?.toString() || ''}
        onChangeText={(text) => onChange('yearsExperience', text)}
        error={errors.yearsExperience}
        placeholder="e.g., 5"
        keyboardType="numeric"
      />

      <Picker
        label="Industry Focus"
        selectedValue={data.ventureIndustry || ''}
        onValueChange={(value) => onChange('ventureIndustry', value)}
        items={INDUSTRIES}
        error={errors.ventureIndustry}
      />

      <Picker
        label="Preferred Investment Stage"
        selectedValue={data.ventureStage || ''}
        onValueChange={(value) => onChange('ventureStage', value)}
        items={INVESTMENT_STAGES}
        error={errors.ventureStage}
      />

      <Input
        label="Typical Investment Range"
        value={data.investmentRange || ''}
        onChangeText={(text) => onChange('investmentRange', text)}
        error={errors.investmentRange}
        placeholder="e.g., $50K - $500K or $1M - $5M"
      />

      <Input
        label="Number of Active Investments"
        value={data.portfolioSize || ''}
        onChangeText={(text) => onChange('portfolioSize', text)}
        placeholder="e.g., 15"
        keyboardType="numeric"
      />

      <Input
        label="Investment Focus Areas (Optional)"
        value={data.investmentFocus || ''}
        onChangeText={(text) => onChange('investmentFocus', text)}
        placeholder="e.g., AI, SaaS, Healthcare Tech, B2B"
        multiline
        numberOfLines={3}
        style={styles.textArea}
      />
    </>
  );

  const renderExpertFields = () => {
    // Handle expertise areas as comma-separated string for input
    const expertiseAreasString = Array.isArray(data.expertiseAreas) 
      ? data.expertiseAreas.join(', ') 
      : (data.expertiseAreas as any) || '';

    return (
      <>
        <Input
          label="Expertise Areas"
          value={expertiseAreasString}
          onChangeText={(text) => {
            // Convert comma-separated string to array
            const areas = text.split(',').map(area => area.trim()).filter(Boolean);
            onChange('expertiseAreas', areas);
          }}
          error={errors.expertiseAreas as string}
          placeholder="e.g., Product Strategy, Growth Marketing, Engineering (comma-separated)"
          multiline
          numberOfLines={3}
          style={styles.textArea}
        />

        <Input
          label="Years of Experience"
          value={data.yearsExperience?.toString() || ''}
          onChangeText={(text) => {
            const num = text ? parseInt(text, 10) : undefined;
            onChange('yearsExperience', num);
          }}
          error={errors.yearsExperience}
          placeholder="e.g., 10"
          keyboardType="numeric"
        />

        <Input
          label="Hourly Rate (USD) - Optional"
          value={data.hourlyRate?.toString() || ''}
          onChangeText={(text) => {
            const num = text ? parseFloat(text) : undefined;
            onChange('hourlyRate', num);
          }}
          placeholder="e.g., 150"
          keyboardType="decimal-pad"
        />
      </>
    );
  };

  const getTitle = () => {
    switch (role) {
      case 'founder':
      case 'cofounder':
        return 'Tell us about your venture';
      case 'investor':
        return 'Your investment profile';
      case 'expert':
        return 'Share your expertise';
      default:
        return 'Additional information';
    }
  };

  const getSubtitle = () => {
    switch (role) {
      case 'founder':
      case 'cofounder':
        return 'Help potential investors and partners understand your startup';
      case 'investor':
        return 'Let founders know what you\'re looking for';
      case 'expert':
        return 'Show how you can help others succeed';
      default:
        return '';
    }
  };

  // Ensure only the correct role fields are shown
  const isFounder = role === 'founder' || role === 'cofounder';
  const isInvestor = role === 'investor';
  const isExpert = role === 'expert';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{getTitle()}</Text>
      <Text style={styles.subtitle}>{getSubtitle()}</Text>

      {isFounder && renderFounderFields()}
      {isInvestor && renderInvestorFields()}
      {isExpert && renderExpertFields()}
      
      {!isFounder && !isInvestor && !isExpert && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Invalid role. Please select a valid role.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: 22,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  errorContainer: {
    padding: SPACING.lg,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
  },
});
