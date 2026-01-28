import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, ScrollView, TouchableOpacity, Alert, Linking, Dimensions, Platform, RefreshControl, Image, ActivityIndicator, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileStats } from '@/hooks/useProfileStats';
import { Button } from '@/components/Button';
import { ProfileMenu } from '@/components/ProfileMenu';
import { launchImageLibraryAsync, requestMediaLibraryPermissionsAsync } from 'expo-image-picker';
import { supabase } from '@/lib/supabase';
import { useNotification } from '@/hooks/useNotification';
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
import { UserRound, MapPin, Pencil, ExternalLink, MoreVertical, Mail, Briefcase, Award, TrendingUp, Users, MessageSquare } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const isSmallScreen = width < 380;

export default function ProfileScreen() {
  const { signOut, profile, user, refreshProfile } = useAuth();
  const { currentPlan, subscription, loading: subLoading } = useSubscription();
  const { stats, loading: statsLoading, refresh } = useProfileStats();
  const { showSuccess, showError } = useNotification();
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarPreviewVisible, setAvatarPreviewVisible] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  const handleSignOut = async () => {
    // Platform-aware confirmation dialog
    const confirmSignOut = () => {
      if (Platform.OS === 'web') {
        return window.confirm('Are you sure you want to sign out?');
      } else {
        return new Promise<boolean>((resolve) => {
          Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
            {
              text: 'Sign Out',
              style: 'destructive',
              onPress: () => resolve(true),
            },
          ]);
        });
      }
    };

    const confirmed = await confirmSignOut();
    
    if (confirmed) {
      try {
        setLoading(true);
        await signOut();
        router.replace('/(auth)/login');
      } catch (error) {
        console.error('Sign out error:', error);
        if (Platform.OS === 'web') {
          window.alert('Failed to sign out. Please try again.');
        } else {
          Alert.alert('Error', 'Failed to sign out. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditProfile = () => {
    router.push('/(tabs)/edit-profile');
  };

  const handleUploadAvatar = async () => {
    if (!user?.id) {
      showError('User not authenticated');
      return;
    }

    try {
      // Request permissions
      const { status } = await requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        showError('Permission to access camera roll is required!');
        return;
      }

      // Launch image picker
      const result = await launchImageLibraryAsync({
        mediaTypes: 'images', // Use string value instead of MediaType.Images
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

      // Show uploading state immediately after crop/selection
      setUploadingAvatar(true);

      // Read the image file
      let fileData: Blob | ArrayBuffer;
      let contentType = 'image/jpeg';

      if (Platform.OS === 'web') {
        // On web, fetch and convert to blob
        const response = await fetch(image.uri);
        fileData = await response.blob();
        contentType = response.headers.get('content-type') || 'image/jpeg';
      } else {
        // On mobile, fetch as ArrayBuffer
        const response = await fetch(image.uri);
        fileData = await response.arrayBuffer();
        // Try to determine content type from URI
        if (image.uri.includes('.png')) {
          contentType = 'image/png';
        } else if (image.uri.includes('.jpg') || image.uri.includes('.jpeg')) {
          contentType = 'image/jpeg';
        }
      }

      // Upload to Supabase storage
      const fileName = `avatar_${user.id}_${Date.now()}.${contentType.includes('png') ? 'png' : 'jpg'}`;
      const storagePath = `${user.id}/${fileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(storagePath, fileData, {
          contentType,
          upsert: true, // Replace if exists
        });

      if (uploadError) {
        // Check if bucket doesn't exist
        if (uploadError.message?.includes('Bucket not found') || uploadError.message?.includes('not found')) {
          throw new Error('Storage bucket "avatars" not found. Please create it in Supabase Dashboard > Storage.');
        }
        throw uploadError;
      }

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(storagePath);

      const avatarUrl = urlData.publicUrl;

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: avatarUrl })
        .eq('id', user.id);

      if (updateError) {
        throw updateError;
      }

      // Refresh profile to show new avatar
      await refreshProfile();
      showSuccess('Profile photo updated successfully!');
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      showError(error.message || 'Failed to upload profile photo. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleAvatarPress = () => {
    if (profile?.avatar_url) {
      // If avatar exists, show preview instead of reopening picker
      setAvatarPreviewVisible(true);
    } else {
      // No avatar yet - open picker to upload
      handleUploadAvatar();
    }
  };

  const handleOpenLink = (url: string) => {
    if (url) {
      Linking.openURL(url).catch(() => {
        Alert.alert('Error', 'Could not open link');
      });
    }
  };

  const getRoleSpecificInfo = () => {
    if (!profile) return null;

    switch (profile.role) {
      case 'founder':
        return (
          <>
            {profile.venture_name && (
              <View style={styles.infoRow}>
                <Briefcase size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Venture:</Text>
                <Text style={styles.infoValue}>{profile.venture_name}</Text>
              </View>
            )}
            {profile.venture_stage && (
              <View style={styles.infoRow}>
                <TrendingUp size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Stage:</Text>
                <Text style={styles.infoValue}>{profile.venture_stage}</Text>
              </View>
            )}
            {profile.venture_industry && (
              <View style={styles.infoRow}>
                <Award size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Industry:</Text>
                <Text style={styles.infoValue}>{profile.venture_industry}</Text>
              </View>
            )}
          </>
        );
      case 'investor':
        return (
          <>
            {profile.investment_focus && (
              <View style={styles.infoRow}>
                <TrendingUp size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Focus:</Text>
                <Text style={styles.infoValue}>{profile.investment_focus}</Text>
              </View>
            )}
            {profile.investment_range && (
              <View style={styles.infoRow}>
                <Award size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Range:</Text>
                <Text style={styles.infoValue}>{profile.investment_range}</Text>
              </View>
            )}
          </>
        );
      case 'expert':
        return (
          <>
            {profile.years_experience && (
              <View style={styles.infoRow}>
                <Award size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Experience:</Text>
                <Text style={styles.infoValue}>{profile.years_experience} years</Text>
              </View>
            )}
            {profile.hourly_rate && (
              <View style={styles.infoRow}>
                <TrendingUp size={18} color={COLORS.primary} />
                <Text style={styles.infoLabel}>Rate:</Text>
                <Text style={styles.infoValue}>${profile.hourly_rate}/hr</Text>
              </View>
            )}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={GRADIENTS.navy} style={styles.backgroundGradient} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={COLORS.primary}
            colors={[COLORS.primary]}
          />
        }>
        {/* Profile Header Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <TouchableOpacity
              style={styles.avatarContainer}
              onPress={handleAvatarPress}
              disabled={uploadingAvatar}
              activeOpacity={0.7}>
              {profile?.avatar_url ? (
                <Image
                  source={{ uri: profile.avatar_url }}
                  style={styles.avatarImage}
                  resizeMode="cover"
                />
              ) : (
                <UserRound size={isSmallScreen ? 32 : 40} color={COLORS.accent} />
              )}
            </TouchableOpacity>
            <View style={styles.heroInfo}>
              <Text style={styles.name} numberOfLines={2} ellipsizeMode="tail">
                {profile?.full_name || 'No name set'}
              </Text>
              {profile?.role && (
                <View style={styles.roleBadge}>
                  <Text style={styles.roleText}>{profile.role}</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
                <Pencil size={16} color={COLORS.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => setMenuVisible(true)}
                activeOpacity={0.7}>
                <MoreVertical size={16} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.contactRow}>
            {profile?.email && (
              <View style={styles.contactItem}>
                <Mail size={14} color={COLORS.textSecondary} />
                <Text style={styles.contactText} numberOfLines={1}>{profile.email}</Text>
              </View>
            )}
            {profile?.location && (
              <View style={styles.contactItem}>
                <MapPin size={14} color={COLORS.textSecondary} />
                <Text style={styles.contactText}>{profile.location}</Text>
              </View>
            )}
          </View>

          <View style={styles.metaPill}>
            <Text style={styles.metaText}>
              {currentPlan?.name?.toUpperCase() || 'FREE'} PLAN
            </Text>
          </View>
        </View>

        {/* Stats Card */}
        {stats && (
          <View style={styles.statsCard}>
            <TouchableOpacity
              style={styles.statItem}
              onPress={() => router.push('/(tabs)/connections')}
              activeOpacity={0.7}>
              <Users size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.totalConnections || 0}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </TouchableOpacity>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <MessageSquare size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.totalChats || 0}</Text>
              <Text style={styles.statLabel}>Chats</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TrendingUp size={20} color={COLORS.primary} />
              <Text style={styles.statValue}>{stats.profileViews || 0}</Text>
              <Text style={styles.statLabel}>Views</Text>
            </View>
          </View>
        )}

        {/* Bio Section */}
        {profile?.bio && (
          <View style={styles.surfaceCard}>
            <Text style={styles.sectionTitle}>About</Text>
            <Text style={styles.bioText}>{profile.bio}</Text>
          </View>
        )}

        {/* Role Specific Info */}
        {getRoleSpecificInfo() && (
          <View style={styles.surfaceCard}>
            <Text style={styles.sectionTitle}>Professional Info</Text>
            <View style={styles.infoContainer}>
              {getRoleSpecificInfo()}
            </View>
          </View>
        )}

        {/* Links Section */}
        {(profile?.linkedin_url || profile?.twitter_url || profile?.website_url) && (
          <View style={styles.surfaceCard}>
            <Text style={styles.sectionTitle}>Links</Text>
            {profile.linkedin_url && (
              <TouchableOpacity 
                style={styles.linkItem}
                onPress={() => handleOpenLink(profile.linkedin_url)}>
                <ExternalLink size={18} color={COLORS.primary} />
                <Text style={styles.linkText}>LinkedIn</Text>
              </TouchableOpacity>
            )}
            {profile.twitter_url && (
              <TouchableOpacity 
                style={styles.linkItem}
                onPress={() => handleOpenLink(profile.twitter_url)}>
                <ExternalLink size={18} color={COLORS.primary} />
                <Text style={styles.linkText}>Twitter</Text>
              </TouchableOpacity>
            )}
            {profile.website_url && (
              <TouchableOpacity 
                style={styles.linkItem}
                onPress={() => handleOpenLink(profile.website_url)}>
                <ExternalLink size={18} color={COLORS.primary} />
                <Text style={styles.linkText}>Website</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Subscription Card */}
        <View style={styles.surfaceCard}>
          <Text style={styles.sectionTitle}>Subscription</Text>
          <View style={styles.subscriptionCard}>
            <View style={styles.subscriptionHeader}>
              <Text style={styles.subscriptionTier}>
                {currentPlan?.name?.toUpperCase() || 'FREE'}
              </Text>
              <View
                style={[
                  styles.statusBadge,
                  subscription?.status === 'active' && styles.statusActive,
                ]}>
                <Text style={styles.statusText}>{subscription?.status?.toUpperCase() || 'ACTIVE'}</Text>
              </View>
            </View>
            {currentPlan?.description && (
              <Text style={styles.subscriptionDescription}>{currentPlan.description}</Text>
            )}
            {currentPlan?.name !== 'Premium' && (
              <Button
                title="Upgrade Plan"
                onPress={() => router.push('/(tabs)/subscription')}
                variant="outline"
                style={styles.upgradeButton}
              />
            )}
          </View>
        </View>

        <Button
          title="Sign Out"
          onPress={handleSignOut}
          variant="outline"
          loading={loading}
          style={styles.signOutButton}
        />
      </ScrollView>
      <ProfileMenu visible={menuVisible} onClose={() => setMenuVisible(false)} />
      {/* Avatar Preview Modal */}
      {profile?.avatar_url && (
        <Modal
          visible={avatarPreviewVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setAvatarPreviewVisible(false)}>
          <TouchableOpacity
            style={styles.previewOverlay}
            activeOpacity={1}
            onPress={() => setAvatarPreviewVisible(false)}>
            <View style={styles.previewContainer} onStartShouldSetResponder={() => true}>
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewActions}>
                <TouchableOpacity
                  style={styles.previewButton}
                  onPress={() => {
                    setAvatarPreviewVisible(false);
                    handleUploadAvatar();
                  }}
                  activeOpacity={0.7}>
                  <Text style={styles.previewButtonText}>Change Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.previewButton, styles.previewCloseButton]}
                  onPress={() => setAvatarPreviewVisible(false)}
                  activeOpacity={0.7}>
                  <Text style={styles.previewButtonText}>Close</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </Modal>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  backgroundGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: isSmallScreen ? SPACING.md : SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  heroCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: isSmallScreen ? SPACING.md : SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
    marginBottom: SPACING.md,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  headerActions: {
    flexDirection: 'column',
    gap: SPACING.xs,
  },
  editButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    width: isSmallScreen ? 64 : 80,
    height: isSmallScreen ? 64 : 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
    position: 'relative',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: BORDER_RADIUS.full,
  },
  previewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  previewContainer: {
    width: '100%',
    maxWidth: 400,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.surface,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 320,
    backgroundColor: COLORS.inputBackground,
  },
  previewActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  previewButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
  },
  previewCloseButton: {
    backgroundColor: COLORS.inputBackground,
  },
  previewButtonText: {
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: FONT_SIZES.sm,
    color: COLORS.background,
  },
  heroInfo: {
    flex: 1,
    minWidth: 0,
    gap: SPACING.xs,
  },
  name: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: isSmallScreen ? FONT_SIZES.lg : FONT_SIZES.xl,
    color: COLORS.text,
    lineHeight: isSmallScreen ? 22 : 26,
  },
  roleBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    alignSelf: 'flex-start',
  },
  roleText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
    textTransform: 'capitalize',
  },
  contactRow: {
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  contactText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  metaPill: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.inputBackground,
  },
  metaText: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: isSmallScreen ? SPACING.md : SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    marginBottom: SPACING.md,
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statValue: {
    fontSize: isSmallScreen ? FONT_SIZES.lg : FONT_SIZES.xl,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
  },
  statLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.border,
  },
  surfaceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: isSmallScreen ? SPACING.md : SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  bioText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  infoContainer: {
    gap: SPACING.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.sm,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
  },
  infoLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  infoValue: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    flex: 1,
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
  },
  linkText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  subscriptionCard: {
    padding: SPACING.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  subscriptionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  subscriptionTier: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  subscriptionDescription: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusActive: {
    backgroundColor: `${COLORS.success}25`,
  },
  statusText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.success,
    textTransform: 'capitalize',
  },
  upgradeButton: {
    height: 40,
  },
  signOutButton: {
    marginTop: SPACING.md,
  },
});
