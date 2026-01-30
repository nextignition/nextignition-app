import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Text,
} from 'react-native';
import { router } from 'expo-router';
import { Button } from '@/components/Button';
import { ProgressIndicator } from '@/components/onboarding/ProgressIndicator';
import { PersonalInfoStep } from '@/components/onboarding/PersonalInfoStep';
import { RoleSpecificStep } from '@/components/onboarding/RoleSpecificStep';
import { ReviewStep } from '@/components/onboarding/ReviewStep';
import { COLORS, SPACING, FONT_SIZES } from '@/constants/theme';
import { OnboardingData } from '@/types/onboarding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

// Role-specific step configurations
const FOUNDER_STEPS = [
  { id: 'personal', label: 'Personal' },
  { id: 'venture', label: 'Venture' },
  { id: 'review', label: 'Review' },
];

const INVESTOR_STEPS = [
  { id: 'personal', label: 'Personal' },
  { id: 'investment', label: 'Investment' },
  { id: 'review', label: 'Review' },
];

const EXPERT_STEPS = [
  { id: 'personal', label: 'Personal' },
  { id: 'expertise', label: 'Expertise' },
  { id: 'review', label: 'Review' },
];

export default function OnboardingScreen() {
  const { profile, refreshProfile, user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [data, setData] = useState<OnboardingData>({
    fullName: '',
    location: '',
    bio: '',
    skills: [],
  });
  const [errors, setErrors] = useState<Partial<Record<keyof OnboardingData, string>>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Refresh profile on mount to ensure role is loaded
  useEffect(() => {
    const loadProfile = async () => {
      if (user?.id) {
        setProfileLoading(true);
        await refreshProfile();
        setProfileLoading(false);
      } else {
        setProfileLoading(false);
      }
    };
    loadProfile();
  }, [user?.id, refreshProfile]);

  // Redirect to role-selection if no role is set
  useEffect(() => {
    if (!profileLoading && !profile?.role && user?.id) {
      // Small delay to avoid flash
      const timer = setTimeout(() => {
        router.replace('/(auth)/role-selection');
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [profile?.role, profileLoading, user?.id]);

  useEffect(() => {
    if (profile) {
      setData((prev) => {
        const newData: OnboardingData = {
          ...prev,
          fullName: prev.fullName || profile.full_name || '',
          location: prev.location || profile.location || '',
          bio: prev.bio || profile.bio || '',
          linkedinUrl: prev.linkedinUrl || profile.linkedin_url || '',
          twitterUrl: prev.twitterUrl || profile.twitter_url || '',
          websiteUrl: prev.websiteUrl || profile.website_url || '',
          skills: prev.skills && prev.skills.length > 0 ? prev.skills : profile.skills || [],
        };

        // Role-specific fields - only set for the user's role
        if (profile.role === 'founder' || profile.role === 'cofounder') {
          newData.ventureName = prev.ventureName || profile.venture_name || '';
          newData.ventureDescription = prev.ventureDescription || profile.venture_description || '';
          newData.ventureIndustry = prev.ventureIndustry || profile.venture_industry || '';
          newData.ventureStage = prev.ventureStage || profile.venture_stage || '';
        }

        if (profile.role === 'investor') {
          newData.investmentFirm = prev.investmentFirm || profile.investment_firm || '';
          newData.investorType = prev.investorType || profile.investor_type || '';
          newData.yearsExperience = prev.yearsExperience || profile.years_experience || undefined;
          newData.ventureIndustry = prev.ventureIndustry || profile.venture_industry || '';
          newData.ventureStage = prev.ventureStage || profile.venture_stage || '';
          newData.investmentRange = prev.investmentRange || profile.investment_range || '';
          newData.portfolioSize = prev.portfolioSize || profile.portfolio_size?.toString() || '';
          newData.investmentFocus = prev.investmentFocus || profile.investment_focus || '';
        }

        if (profile.role === 'expert') {
          newData.expertiseAreas = prev.expertiseAreas || profile.expertise_areas || [];
          newData.yearsExperience = prev.yearsExperience || profile.years_experience || undefined;
          newData.hourlyRate = prev.hourlyRate || profile.hourly_rate || undefined;
        }

        return newData;
      });
    }
  }, [profile]);

  // Get role-specific steps - calculate early so it's available everywhere
  const getSteps = () => {
    const role = profile?.role;
    if (role === 'founder' || role === 'cofounder') return FOUNDER_STEPS;
    if (role === 'investor') return INVESTOR_STEPS;
    if (role === 'expert') return EXPERT_STEPS;
    return []; // Return empty array if no role
  };

  const steps = getSteps();

  // Reset currentStep if it exceeds the new steps length (e.g., if role changes)
  useEffect(() => {
    if (steps.length > 0 && currentStep >= steps.length) {
      setCurrentStep(0);
    }
  }, [steps.length, currentStep]);

  const handleChange = (field: keyof OnboardingData, value: any) => {
    setData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateStep = (): boolean => {
    const newErrors: Partial<Record<keyof OnboardingData, string>> = {};

    // Safety check - ensure steps and currentStep are valid
    if (!steps || steps.length === 0 || !steps[currentStep]) {
      return false;
    }

    const stepId = steps[currentStep]?.id;

    if (stepId === 'personal') {
      if (!data.fullName.trim()) {
        newErrors.fullName = 'Full name is required';
      }
      if (!data.location.trim()) {
        newErrors.location = 'Location is required';
      }
      if (!data.bio.trim()) {
        newErrors.bio = 'Bio is required';
      }
    }

    if (stepId === 'venture' || stepId === 'investment' || stepId === 'expertise') {
      if (profile?.role === 'founder' || profile?.role === 'cofounder') {
        if (!data.ventureName?.trim()) {
          newErrors.ventureName = 'Venture name is required';
        }
        if (!data.ventureDescription?.trim()) {
          newErrors.ventureDescription = 'Venture description is required';
        }
      } else if (profile?.role === 'investor') {
        if (!data.investmentFirm?.trim()) {
          newErrors.investmentFirm = 'Company/Firm name is required';
        }
        if (!data.investorType?.trim()) {
          newErrors.investorType = 'Investor type is required';
        }
        if (!data.yearsExperience) {
          newErrors.yearsExperience = 'Years of experience is required';
        }
        if (!data.ventureIndustry?.trim()) {
          newErrors.ventureIndustry = 'Industry focus is required';
        }
        if (!data.ventureStage?.trim()) {
          newErrors.ventureStage = 'Preferred investment stage is required';
        }
        if (!data.investmentRange?.trim()) {
          newErrors.investmentRange = 'Investment range is required';
        }
      } else if (profile?.role === 'expert') {
        const expertiseAreasStr = Array.isArray(data.expertiseAreas)
          ? data.expertiseAreas.join(', ')
          : (data.expertiseAreas as string || '');
        if (!expertiseAreasStr.trim()) {
          newErrors.expertiseAreas = 'Expertise areas are required';
        }
        if (!data.yearsExperience) {
          newErrors.yearsExperience = 'Years of experience is required';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep()) {
      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!validateStep()) return;

    // Prevent multiple submissions
    if (loading) {
      console.warn('[Onboarding] Already submitting, ignoring duplicate call');
      return;
    }

    setLoading(true);
    setSubmitError(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('No user found. Please log in again.');
      }

      console.log('[Onboarding] Starting submission for user:', user.id);

      const payload: Record<string, any> = {
        full_name: data.fullName,
        location: data.location,
        bio: data.bio,
        linkedin_url: data.linkedinUrl || null,
        twitter_url: data.twitterUrl || null,
        website_url: data.websiteUrl || null,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
        skills: data.skills && data.skills.length > 0 ? data.skills : null,
      };

      // Role-specific fields - save only for the user's role
      if (profile?.role === 'founder' || profile?.role === 'cofounder') {
        payload.venture_name = data.ventureName?.trim() || null;
        payload.venture_description = data.ventureDescription?.trim() || null;
        payload.venture_industry = data.ventureIndustry?.trim() || null;
        payload.venture_stage = data.ventureStage?.trim() || null;
      }

      if (profile?.role === 'investor') {
        payload.investment_firm = data.investmentFirm?.trim() || null;
        payload.investor_type = data.investorType?.trim() || null;
        payload.years_experience = data.yearsExperience ?? null;
        payload.venture_industry = data.ventureIndustry?.trim() || null;
        payload.venture_stage = data.ventureStage?.trim() || null;
        payload.investment_range = data.investmentRange?.trim() || null;
        payload.portfolio_size = data.portfolioSize
          ? (typeof data.portfolioSize === 'string' ? parseInt(data.portfolioSize) : data.portfolioSize)
          : null;
        payload.investment_focus = data.investmentFocus?.trim() || null;
      }

      if (profile?.role === 'expert') {
        // Handle expertise_areas - convert to array if string
        const expertiseAreas = Array.isArray(data.expertiseAreas)
          ? data.expertiseAreas
          : (typeof data.expertiseAreas === 'string'
            ? data.expertiseAreas.split(',').map(a => a.trim()).filter(Boolean)
            : []);
        payload.expertise_areas = expertiseAreas.length > 0 ? expertiseAreas : null;
        payload.years_experience = data.yearsExperience ?? null;
        payload.hourly_rate = data.hourlyRate ?? null;
      }

      console.log('[Onboarding] Updating profile with payload:', Object.keys(payload));

      // Update profile with timeout
      const profileUpdatePromise = supabase
        .from('profiles')
        .update(payload)
        .eq('id', user.id);

      const timeoutPromise = new Promise<{ error: any }>((resolve) => {
        setTimeout(() => {
          resolve({ error: { message: 'Request timeout. Please check your connection and try again.' } });
        }, 15000); // 15 second timeout
      });

      const { error: profileError } = await Promise.race([
        profileUpdatePromise,
        timeoutPromise,
      ]) as any;

      if (profileError) {
        console.error('[Onboarding] Profile update error:', profileError);
        throw profileError;
      }

      console.log('[Onboarding] Profile updated successfully');

      // For founders/cofounders, also create startup_profiles entry
      if (profile?.role === 'founder' || profile?.role === 'cofounder') {
        try {
          const startupPayload = {
            owner_id: user.id,
            name: data.ventureName || '',
            description: data.ventureDescription || null,
            industry: data.ventureIndustry || null,
            stage: data.ventureStage || null,
            is_public: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          };

          const { error: startupError } = await supabase
            .from('startup_profiles')
            .upsert(startupPayload, { onConflict: 'owner_id' });

          if (startupError) {
            console.error('[Onboarding] Error creating startup profile:', startupError);
            // Don't throw - allow onboarding to complete even if startup_profiles fails
          } else {
            console.log('[Onboarding] Startup profile created/updated successfully');
          }
        } catch (startupErr) {
          console.error('[Onboarding] Startup profile error (non-blocking):', startupErr);
          // Continue even if this fails
        }
      }

      // Refresh profile before navigation
      console.log('[Onboarding] Refreshing profile...');
      try {
        await Promise.race([
          refreshProfile(),
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Profile refresh timeout')), 10000)
          ),
        ]);
        console.log('[Onboarding] Profile refreshed successfully');
      } catch (refreshErr) {
        console.warn('[Onboarding] Profile refresh warning (non-blocking):', refreshErr);
        // Continue with navigation even if refresh fails
      }

      // Navigate to main app - use a small delay to ensure state is updated
      console.log('[Onboarding] Navigating to main app...');
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 300);

    } catch (err) {
      console.error('[Onboarding] Error completing onboarding:', err);
      const message =
        err instanceof Error ? err.message : 'Failed to complete onboarding. Please try again.';
      setSubmitError(message);
      setLoading(false); // Reset loading on error
      Alert.alert('Something went wrong', message);
    }
    // Note: Don't reset loading in finally - only reset on error or let navigation handle it
  };


  // Show loading while profile is being fetched
  if (profileLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <Text style={{ color: COLORS.text, fontSize: FONT_SIZES.md }}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // If no role, show message (will redirect)
  if (!profile?.role || steps.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: SPACING.lg }}>
          <Text style={{ color: COLORS.text, fontSize: FONT_SIZES.md, textAlign: 'center' }}>
            Redirecting to role selection...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const renderStep = () => {
    // Safety check
    if (!steps || steps.length === 0 || !steps[currentStep]) {
      return null;
    }

    const stepId = steps[currentStep]?.id;
    const role = profile?.role;

    if (!role) {
      return null;
    }

    switch (stepId) {
      case 'personal':
        return (
          <PersonalInfoStep
            data={data}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 'venture':
      case 'investment':
      case 'expertise':
        return (
          <RoleSpecificStep
            role={role}
            data={data}
            onChange={handleChange}
            errors={errors}
          />
        );
      case 'review':
        return <ReviewStep data={data} role={role} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}>
        <View style={styles.header}>
          <ProgressIndicator steps={steps} currentStep={currentStep} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {renderStep()}
        </ScrollView>

        <View style={styles.footer}>
          {submitError && <Text style={styles.submitError}>{submitError}</Text>}
          <View style={styles.buttonRow}>
            {currentStep > 0 && (
              <Button
                title="Back"
                onPress={handleBack}
                variant="outline"
                style={styles.backButton}
              />
            )}
            <Button
              title={currentStep === steps.length - 1 ? 'Complete' : 'Next'}
              onPress={currentStep === steps.length - 1 ? handleComplete : handleNext}
              loading={loading}
              style={styles.nextButton}
            />
          </View>
        </View>
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
  header: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.lg,
    paddingBottom: SPACING.lg,
  },
  footer: {
    gap: SPACING.md,
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.lg,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  submitError: {
    color: COLORS.error,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
});
