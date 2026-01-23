import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/Input';
import { Button } from '@/components/Button';
import { RoleSpecificFields } from '@/components/RoleSpecificFields';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS } from '@/constants/theme';
import { ArrowLeft, Camera, UserRound } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/NotificationContainer';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';

export default function EditProfileScreen() {
  const { profile, refreshProfile, user } = useAuth();
  const { notifications, showSuccess, showError, dismissNotification } = useNotification();
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [fullName, setFullName] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const [founderValues, setFounderValues] = useState({
    ventureName: '',
    ventureDescription: '',
    ventureIndustry: '',
    ventureStage: '',
  });

  const [investorValues, setInvestorValues] = useState({
    investmentFirm: '',
    investorType: '',
    yearsExperience: '',
    ventureIndustry: '',
    ventureStage: '',
    investmentRange: '',
    portfolioSize: '',
    investmentFocus: '',
  });

  const [expertValues, setExpertValues] = useState({
    yearsExperience: '',
    hourlyRate: '',
    expertiseAreas: '',
  });
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');

  // Only initialize form fields once when profile first loads
  useEffect(() => {
    if (profile && !isInitialized) {
      // Prefill all fields from profile (including onboarding data)
      setFullName(profile.full_name || '');
      setLocation(profile.location || '');
      setBio(profile.bio || '');
      setLinkedinUrl(profile.linkedin_url || '');
      setTwitterUrl(profile.twitter_url || '');
      setWebsiteUrl(profile.website_url || '');

      // Founder/Co-founder fields
      setFounderValues({
        ventureName: profile.venture_name || '',
        ventureDescription: profile.venture_description || '',
        ventureIndustry: profile.venture_industry || '',
        ventureStage: profile.venture_stage || '',
      });

      // Investor fields
      setInvestorValues({
        investmentFirm: profile.investment_firm || '',
        investorType: profile.investor_type || '',
        yearsExperience: profile.years_experience?.toString() || '',
        ventureIndustry: profile.venture_industry || '',
        ventureStage: profile.venture_stage || '',
        investmentRange: profile.investment_range || '',
        portfolioSize: profile.portfolio_size?.toString() || '',
        investmentFocus: profile.investment_focus || '',
      });

      // Expert fields
      setExpertValues({
        yearsExperience: profile.years_experience?.toString() || '',
        hourlyRate: profile.hourly_rate?.toString() || '',
        expertiseAreas: Array.isArray(profile.expertise_areas) 
          ? profile.expertise_areas.join(', ') 
          : (profile.expertise_areas || ''),
      });
      
      setAvatarUrl(profile.avatar_url || '');
      setIsInitialized(true);
    }
  }, [profile, isInitialized]);

  const handleUploadAvatar = async () => {
    if (!user?.id) {
      showError('User not authenticated');
      return;
    }

    try {
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission to access camera roll is required!');
        return;
      }

      const result = await launchImageLibraryAsync({
        mediaTypes: 'images',
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled) {
        return;
      }

      const image = result.assets[0];
      if (!image.uri) {
        showError('Failed to get image');
        return;
      }

      setAvatarUploading(true);

      let fileData: Blob | ArrayBuffer;
      let contentType = 'image/jpeg';

      if (Platform.OS === 'web') {
        const response = await fetch(image.uri);
        fileData = await response.blob();
        contentType = response.headers.get('content-type') || 'image/jpeg';
      } else {
        const response = await fetch(image.uri);
        fileData = await response.arrayBuffer();
        if (image.uri.includes('.png')) {
          contentType = 'image/png';
        } else if (image.uri.includes('.jpg') || image.uri.includes('.jpeg')) {
          contentType = 'image/jpeg';
        }
      }

      const fileName = `avatar_${user.id}_${Date.now()}.${contentType.includes('png') ? 'png' : 'jpg'}`;
      const storagePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, fileData, {
          contentType,
          upsert: true,
        });

      if (uploadError) {
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket "avatars" not found. Please create it in Supabase Dashboard > Storage.');
        }
        throw uploadError;
      }

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(storagePath);

      const newAvatarUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: newAvatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Update local and global profile immediately
      setAvatarUrl(newAvatarUrl);
      await refreshProfile();
      showSuccess('Profile photo updated successfully!');
    } catch (error: any) {
      console.error('EditProfile avatar upload error:', error);
      showError(error.message || 'Failed to upload profile photo. Please try again.');
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleSave = async () => {
    // Prevent multiple simultaneous saves
    if (loading) {
      return;
    }

    if (!fullName.trim()) {
      Alert.alert('Validation Error', 'Full name is required');
      return;
    }

    if (!location.trim()) {
      Alert.alert('Validation Error', 'Location is required');
      return;
    }

    if (!bio.trim()) {
      Alert.alert('Validation Error', 'Bio is required');
      return;
    }

    if (!profile?.id) {
      Alert.alert('Error', 'User profile not found');
      return;
    }

    setLoading(true);

    try {
      // Build the update data object based on role
      const updateData: any = {
        full_name: fullName.trim(),
        location: location.trim(),
        bio: bio.trim(),
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
        updated_at: new Date().toISOString(),
      };

      // Add role-specific fields
      if (profile.role === 'founder' || profile.role === 'cofounder') {
        updateData.venture_name = founderValues.ventureName.trim() || null;
        updateData.venture_description = founderValues.ventureDescription.trim() || null;
        updateData.venture_industry = founderValues.ventureIndustry.trim() || null;
        updateData.venture_stage = founderValues.ventureStage.trim() || null;
      } else if (profile.role === 'investor') {
        updateData.investment_firm = investorValues.investmentFirm.trim() || null;
        updateData.investor_type = investorValues.investorType.trim() || null;
        updateData.years_experience = investorValues.yearsExperience.trim() 
          ? parseInt(investorValues.yearsExperience) 
          : null;
        updateData.venture_industry = investorValues.ventureIndustry.trim() || null;
        updateData.venture_stage = investorValues.ventureStage.trim() || null;
        updateData.investment_range = investorValues.investmentRange.trim() || null;
        updateData.portfolio_size = investorValues.portfolioSize.trim() || null;
        updateData.investment_focus = investorValues.investmentFocus.trim() || null;
      } else if (profile.role === 'expert') {
        updateData.years_experience = expertValues.yearsExperience.trim() 
          ? parseInt(expertValues.yearsExperience) 
          : null;
        updateData.hourly_rate = expertValues.hourlyRate.trim() 
          ? parseFloat(expertValues.hourlyRate) 
          : null;
        updateData.expertise_areas = expertValues.expertiseAreas.trim()
          ? expertValues.expertiseAreas.split(',').map(area => area.trim()).filter(Boolean)
          : null;
      }

      // Update the profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('id', profile.id);

      if (error) {
        throw error;
      }

      // Refresh the profile in AuthContext
      await refreshProfile();

      showSuccess('Profile updated successfully!');
      
      // Navigate back after a short delay to show notification
      setTimeout(() => {
        setLoading(false);
        router.back();
      }, 1500);
    } catch (error: any) {
      console.error('Save error:', error);
      showError(error.message || 'Failed to update profile. Please try again.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.title}>Edit Profile</Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleUploadAvatar}
              disabled={avatarUploading}
              activeOpacity={0.7}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <UserRound size={40} color={COLORS.primary} />
              )}
              <View style={styles.avatarEditOverlay}>
                {avatarUploading ? (
                  <ActivityIndicator size="small" color={COLORS.background} />
                ) : (
                  <Camera size={16} color={COLORS.background} strokeWidth={2} />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarLabel}>Profile Photo</Text>
          </View>

          <Input
            label="Full Name"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Your full name"
          />

          <Input
            label="Location"
            value={location}
            onChangeText={setLocation}
            placeholder="City, Country"
          />

          <Input
            label="Bio"
            value={bio}
            onChangeText={setBio}
            placeholder="Tell us about yourself"
            multiline
            numberOfLines={4}
            style={styles.textArea}
          />

          <Text style={styles.sectionTitle}>Social Links</Text>

          <Input
            label="LinkedIn"
            value={linkedinUrl}
            onChangeText={setLinkedinUrl}
            placeholder="https://linkedin.com/in/yourprofile"
            autoCapitalize="none"
          />

          <Input
            label="Twitter"
            value={twitterUrl}
            onChangeText={setTwitterUrl}
            placeholder="https://twitter.com/yourhandle"
            autoCapitalize="none"
          />

          <Input
            label="Website"
            value={websiteUrl}
            onChangeText={setWebsiteUrl}
            placeholder="https://yourwebsite.com"
            autoCapitalize="none"
          />

          <RoleSpecificFields
            role={profile?.role}
            founderValues={founderValues}
            investorValues={investorValues}
            expertValues={expertValues}
            onFounderChange={(field, value) =>
              setFounderValues((prev) => ({ ...prev, [field]: value }))
            }
            onInvestorChange={(field, value) =>
              setInvestorValues((prev) => ({ ...prev, [field]: value }))
            }
            onExpertChange={(field, value) =>
              setExpertValues((prev) => ({ ...prev, [field]: value }))
            }
          />

          <Button
            title="Save Changes"
            onPress={handleSave}
            loading={loading}
            style={styles.saveButton}
          />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
  },
  avatarEditOverlay: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  avatarLabel: {
    marginTop: SPACING.sm,
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
    paddingTop: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.md,
  },
  saveButton: {
    marginTop: SPACING.xl,
  },
});
