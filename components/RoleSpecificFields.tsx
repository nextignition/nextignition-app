import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Input } from './Input';
import { Picker } from './Picker';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
import { UserRole } from '@/types/user';
import { INDUSTRIES } from '@/constants/industries';

interface RoleSpecificFieldsProps {
  role?: UserRole;
  founderValues: {
    ventureName: string;
    ventureDescription: string;
    ventureIndustry: string;
    ventureStage: string;
  };
  investorValues: {
    investmentFirm: string;
    investorType: string;
    investmentFocus: string;
    investmentRange: string;
    portfolioSize: string;
    ventureIndustry: string;
    ventureStage: string;
    yearsExperience: string;
  };
  expertValues: {
    yearsExperience: string;
    hourlyRate: string;
    expertiseAreas: string;
  };
  onFounderChange: (field: string, value: string) => void;
  onInvestorChange: (field: string, value: string) => void;
  onExpertChange: (field: string, value: string) => void;
}


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

export function RoleSpecificFields({
  role,
  founderValues,
  investorValues,
  expertValues,
  onFounderChange,
  onInvestorChange,
  onExpertChange,
}: RoleSpecificFieldsProps) {
  if (!role) return null;

  const isFounderRole = role === 'founder' || role === 'cofounder';

  return (
    <View>
      <Text style={styles.sectionTitle}>
        {isFounderRole ? 'Venture Information' : role === 'investor' ? 'Investment Profile' : 'Expertise'}
      </Text>

      {isFounderRole && (
        <>
          <Input
            label="Venture Name"
            value={founderValues.ventureName}
            onChangeText={(value) => onFounderChange('ventureName', value)}
            placeholder="Your startup name"
          />

          <Input
            label="Venture Description"
            value={founderValues.ventureDescription}
            onChangeText={(value) => onFounderChange('ventureDescription', value)}
            placeholder="What does your venture do?"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />

          <Input
            label="Industry"
            value={founderValues.ventureIndustry}
            onChangeText={(value) => onFounderChange('ventureIndustry', value)}
            placeholder="e.g., SaaS, HealthTech, FinTech"
          />

          <Input
            label="Stage"
            value={founderValues.ventureStage}
            onChangeText={(value) => onFounderChange('ventureStage', value)}
            placeholder="e.g., Idea, MVP, Growth"
          />
        </>
      )}

      {role === 'investor' && (
        <>
          <Input
            label="Company/Firm Name"
            value={investorValues.investmentFirm}
            onChangeText={(value) => onInvestorChange('investmentFirm', value)}
            placeholder="e.g., Sequoia Capital, Individual Investor"
          />

          <Picker
            label="Investor Type"
            selectedValue={investorValues.investorType}
            onValueChange={(value) => onInvestorChange('investorType', value)}
            items={INVESTOR_TYPES}
          />

          <Input
            label="Years of Investment Experience"
            value={investorValues.yearsExperience}
            onChangeText={(value) => onInvestorChange('yearsExperience', value)}
            placeholder="e.g., 5"
            keyboardType="numeric"
          />

          <Picker
            label="Industry Focus"
            selectedValue={investorValues.ventureIndustry}
            onValueChange={(value) => onInvestorChange('ventureIndustry', value)}
            items={INDUSTRIES}
          />

          <Picker
            label="Preferred Investment Stage"
            selectedValue={investorValues.ventureStage}
            onValueChange={(value) => onInvestorChange('ventureStage', value)}
            items={INVESTMENT_STAGES}
          />

          <Input
            label="Typical Investment Range"
            value={investorValues.investmentRange}
            onChangeText={(value) => onInvestorChange('investmentRange', value)}
            placeholder="e.g., $50K - $500K or $1M - $5M"
          />

          <Input
            label="Number of Active Investments"
            value={investorValues.portfolioSize}
            onChangeText={(value) => onInvestorChange('portfolioSize', value)}
            placeholder="e.g., 15"
            keyboardType="numeric"
          />

          <Input
            label="Investment Focus Areas (Optional)"
            value={investorValues.investmentFocus}
            onChangeText={(value) => onInvestorChange('investmentFocus', value)}
            placeholder="e.g., AI, SaaS, Healthcare Tech, B2B"
            multiline
            numberOfLines={3}
            style={styles.textArea}
          />
        </>
      )}

      {role === 'expert' && (
        <>
          <Input
            label="Years of Experience"
            value={expertValues.yearsExperience}
            onChangeText={(value) => onExpertChange('yearsExperience', value)}
            placeholder="e.g., 10"
            keyboardType="numeric"
          />

          <Input
            label="Hourly Rate (USD)"
            value={expertValues.hourlyRate}
            onChangeText={(value) => onExpertChange('hourlyRate', value)}
            placeholder="e.g., 150"
            keyboardType="decimal-pad"
          />

          <Input
            label="Expertise Areas"
            value={expertValues.expertiseAreas}
            onChangeText={(value) => onExpertChange('expertiseAreas', value)}
            placeholder="e.g., Product Strategy, Growth Hacking, Design (comma-separated)"
            multiline
            numberOfLines={2}
            style={styles.textArea}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
    marginTop: SPACING.lg,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
});
