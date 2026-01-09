import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect } from 'expo-router';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
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
  Building2,
  Eye,
  EyeOff,
  Share2,
  Download,
  FileText,
  Video,
  Link as LinkIcon,
  CheckCircle,
  TrendingUp,
  Trash2,
  ExternalLink,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { usePitchMaterials } from '@/hooks/usePitchMaterials';
import { supabase } from '@/lib/supabase';
import { showAlert } from '@/utils/platformAlert';
import { useNotification } from '@/hooks/useNotification';
import { NotificationContainer } from '@/components/NotificationContainer';

const STAGES = [
  { label: 'Select stage', value: '' },
  { label: 'Idea', value: 'idea' },
  { label: 'MVP', value: 'mvp' },
  { label: 'Growth', value: 'growth' },
  { label: 'Scale', value: 'scale' },
];

const INDUSTRIES = [
  { label: 'Select industry', value: '' },
  { label: 'Technology', value: 'technology' },
  { label: 'Healthcare', value: 'healthcare' },
  { label: 'Finance', value: 'finance' },
  { label: 'Education', value: 'education' },
  { label: 'E-commerce', value: 'ecommerce' },
];

type StartupProfileRecord = {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  website: string | null;
  is_public: boolean;
  pitch_deck_url: string | null;
  pitch_video_url: string | null;
};

export default function StartupProfileScreen() {
  const { profile, refreshProfile } = useAuth();
  const { permissions, currentPlan } = useSubscription();
  const { pitchDecks, pitchVideos, deletePitchMaterial, loading: pitchLoading, refresh: refreshPitchMaterials } = usePitchMaterials();
  const { notifications, showSuccess, showError, dismissNotification } = useNotification();
  
  const [startupName, setStartupName] = useState('');
  const [description, setDescription] = useState('');
  const [stage, setStage] = useState('');
  const [industry, setIndustry] = useState('');
  const [website, setWebsite] = useState('');
  const [isPublic, setIsPublic] = useState(true);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Social links state
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');

  const canUploadPitchAssets = permissions.canUploadPitchDeck || permissions.canRecordPitchVideo;

  // Extract primitive values from profile to prevent infinite re-renders
  const profileId = profile?.id;
  const ventureName = profile?.venture_name;
  const ventureDescription = profile?.venture_description;
  const ventureStage = profile?.venture_stage;
  const ventureIndustry = profile?.venture_industry;

  // Use useFocusEffect to refresh data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      let isActive = true;

      const loadData = async () => {
        if (!profileId) {
          setLoadingProfile(false);
          return;
        }
        
        if (!isActive) return;

        setLoadingProfile(true);
        try {
          // Refresh pitch materials and load profile data in parallel
          const [
            ,
            { data: startupData, error: startupError },
            { data: profileData, error: profileError },
          ] = await Promise.all([
            // Refresh pitch materials to show newly uploaded files
            refreshPitchMaterials(),
            // Load startup profile
            supabase
              .from('startup_profiles')
              .select('*')
              .eq('owner_id', profileId)
              .maybeSingle<StartupProfileRecord>(),
            // Load user profile for social links
            supabase
              .from('profiles')
              .select('linkedin_url, twitter_url, website_url')
              .eq('id', profileId)
              .single(),
          ]);

          if (startupError && startupError.code !== 'PGRST116') {
            throw startupError;
          }

          if (profileError) {
            console.error('Error loading profile data:', profileError);
          }

          if (!isActive) return; // Check again before updating state

          // Update startup profile fields
          if (startupData) {
            setStartupName(startupData.name || '');
            setDescription(startupData.description || '');
            setStage(startupData.stage || '');
            setIndustry(startupData.industry || '');
            setWebsite(startupData.website || '');
            setIsPublic(startupData.is_public ?? true);
          } else {
            // Fallback to profile data if no startup profile exists
            setStartupName(ventureName || '');
            setDescription(ventureDescription || '');
            setStage(ventureStage || '');
            setIndustry(ventureIndustry || '');
          }

          // Update social links
          if (profileData) {
            setLinkedinUrl(profileData.linkedin_url || '');
            setTwitterUrl(profileData.twitter_url || '');
            setWebsiteUrl(profileData.website_url || '');
          }
        } catch (err) {
          console.error('Error loading startup profile', err);
          if (isActive) {
            Alert.alert('Error', 'Unable to load startup profile. Please try again.');
          }
        } finally {
          if (isActive) {
            setLoadingProfile(false);
          }
        }
      };

      loadData();

      return () => {
        isActive = false;
      };
    }, [profileId, ventureName, ventureDescription, ventureStage, ventureIndustry, refreshPitchMaterials])
  );

  const hasPitchDeck = pitchDecks.length > 0;
  const hasPitchVideo = pitchVideos.length > 0;

  const profileCompleteness = () => {
    let completed = 0;
    const total = 8;
    if (startupName) completed++;
    if (description) completed++;
    if (stage) completed++;
    if (industry) completed++;
    if (website) completed++;
    if (hasPitchDeck) completed++;
    if (hasPitchVideo) completed++;
    if (linkedinUrl || twitterUrl || websiteUrl) completed++;
    return Math.round((completed / total) * 100);
  };

  const handleSave = async () => {
    if (!profileId) {
      Alert.alert('Error', 'No user profile found. Please log in again.');
      return;
    }
    
    // Validation
    if (!startupName.trim()) {
      Alert.alert('Required Field', 'Please enter your startup name before saving.');
      return;
    }

    if (!industry || industry === '') {
      Alert.alert('Required Field', 'Please select an industry.');
      return;
    }

    if (!stage || stage === '') {
      Alert.alert('Required Field', 'Please select your current stage.');
      return;
    }

    setSaving(true);
    try {
      // Get the latest pitch deck and video URLs from pitch_materials
      const latestPitchDeck = pitchDecks.length > 0 ? pitchDecks[0] : null;
      const latestPitchVideo = pitchVideos.length > 0 ? pitchVideos[0] : null;
      const nowIso = new Date().toISOString();

      // Prepare payloads
      const startupPayload = {
        owner_id: profileId,
        name: startupName.trim(),
        description: description.trim() || null,
        industry: industry,
        stage: stage,
        website: website.trim() || null,
        is_public: isPublic,
        pitch_deck_url: latestPitchDeck?.url || null,
        pitch_deck_uploaded_at: latestPitchDeck?.created_at || null,
        pitch_video_url: latestPitchVideo?.url || null,
        pitch_video_uploaded_at: latestPitchVideo?.created_at || null,
        updated_at: nowIso,
      };

      const profilePayload = {
        linkedin_url: linkedinUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        website_url: websiteUrl.trim() || null,
      };

      // Save startup profile and social links in parallel for faster submit
      const [{ error: startupError }, { error: profileError }] = await Promise.all([
        supabase
          .from('startup_profiles')
          .upsert(startupPayload, { onConflict: 'owner_id' })
          .select()
          .single<StartupProfileRecord>(),
        supabase
          .from('profiles')
          .update(profilePayload)
          .eq('id', profileId),
      ]);

      if (startupError) throw startupError;
      if (profileError) throw profileError;

      showSuccess('Startup profile updated successfully!');
      
      // Refresh auth profile to sync updated data
      await refreshProfile();
    } catch (err: any) {
      console.error('Error saving startup profile', err);
      showError(err.message || 'Unable to save your startup profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = () => {
    Alert.alert('Share Profile', 'Choose sharing option', [
      { text: 'Copy Link', onPress: () => alert('Link copied!') },
      { text: 'Export PDF', onPress: handleExportPDF },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const handleExportPDF = async () => {
    try {
      // Generate HTML content for the PDF
      const html = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${startupName || 'Startup Profile'}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #1f2937;
              padding: 40px;
              background: #ffffff;
            }
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 30px;
              border-radius: 12px;
              margin-bottom: 30px;
            }
            .header h1 {
              font-size: 32px;
              font-weight: 700;
              margin-bottom: 10px;
            }
            .header p {
              font-size: 16px;
              opacity: 0.9;
            }
            .section {
              background: #f9fafb;
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 20px;
            }
            .section-title {
              font-size: 20px;
              font-weight: 600;
              color: #667eea;
              margin-bottom: 15px;
              display: flex;
              align-items: center;
            }
            .field {
              margin-bottom: 15px;
            }
            .field-label {
              font-size: 12px;
              font-weight: 600;
              text-transform: uppercase;
              color: #6b7280;
              margin-bottom: 5px;
            }
            .field-value {
              font-size: 16px;
              color: #1f2937;
              word-wrap: break-word;
            }
            .badge {
              display: inline-block;
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 14px;
              font-weight: 500;
            }
            .badge-public {
              background: #d1fae5;
              color: #065f46;
            }
            .badge-private {
              background: #fee2e2;
              color: #991b1b;
            }
            .footer {
              text-align: center;
              margin-top: 40px;
              padding-top: 20px;
              border-top: 2px solid #e5e7eb;
              color: #6b7280;
              font-size: 14px;
            }
            .materials-list {
              list-style: none;
              padding: 0;
            }
            .materials-list li {
              background: white;
              padding: 12px;
              border-radius: 6px;
              margin-bottom: 8px;
              border: 1px solid #e5e7eb;
            }
            .materials-list li strong {
              color: #667eea;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>${startupName || 'Startup Profile'}</h1>
            <p>${profile?.full_name || 'Founder'} • Generated on ${new Date().toLocaleDateString()}</p>
          </div>

          <div class="section">
            <div class="section-title">Basic Information</div>
            <div class="field">
              <div class="field-label">Startup Name</div>
              <div class="field-value">${startupName || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">Industry</div>
              <div class="field-value">${INDUSTRIES.find(i => i.value === industry)?.label || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">Stage</div>
              <div class="field-value">${STAGES.find(s => s.value === stage)?.label || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">Website</div>
              <div class="field-value">${website || 'Not provided'}</div>
            </div>
            <div class="field">
              <div class="field-label">Visibility</div>
              <div class="field-value">
                <span class="badge ${isPublic ? 'badge-public' : 'badge-private'}">
                  ${isPublic ? 'Public' : 'Private'}
                </span>
              </div>
            </div>
          </div>

          <div class="section">
            <div class="section-title">Description</div>
            <div class="field-value">${description || 'No description provided'}</div>
          </div>

          ${pitchDecks.length > 0 ? `
          <div class="section">
            <div class="section-title">Pitch Materials</div>
            <ul class="materials-list">
              ${pitchDecks.map(deck => `
                <li>
                  <strong>Pitch Deck:</strong> ${deck.filename || 'Untitled'}
                  <br>
                  <small>Uploaded: ${new Date(deck.created_at).toLocaleDateString()}</small>
                </li>
              `).join('')}
              ${pitchVideos.map(video => `
                <li>
                  <strong>Pitch Video:</strong> ${video.filename || 'Untitled'}
                  <br>
                  <small>Uploaded: ${new Date(video.created_at).toLocaleDateString()}</small>
                </li>
              `).join('')}
            </ul>
          </div>
          ` : ''}

          <div class="footer">
            <p>This profile was generated from the Next Ignition platform</p>
            <p>${new Date().toLocaleString()}</p>
          </div>
        </body>
        </html>
      `;

      // Generate PDF
      const { uri } = await Print.printToFileAsync({ html });

      if (Platform.OS === 'web') {
        // On web, trigger download
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${startupName || 'startup-profile'}.pdf`;
        link.click();
        showAlert('Success', 'PDF downloaded successfully!');
      } else {
        // On mobile, use sharing
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(uri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Share Startup Profile',
            UTI: 'com.adobe.pdf',
          });
        } else {
          showAlert('Success', `PDF saved to: ${uri}`);
        }
      }
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      showAlert('Error', 'Failed to export PDF. Please try again.');
    }
  };

  const handlePitchNavigation = (route: any) => {
    if (!canUploadPitchAssets) {
      showAlert(
        'Upgrade required',
        'Pitch materials are unlocked on the Pro plan and above. Upgrade your subscription to share decks and videos.'
      );
      return;
    }
    router.push(route as any);
  };

  const handleDeletePitchDeck = async (deckId: string, storagePath: string | null) => {
    // Use platform-aware confirmation
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Delete Pitch Deck\n\nAre you sure you want to delete this pitch deck? This action cannot be undone.');
    } else {
      // For mobile, we'll use a promise-based approach
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Delete Pitch Deck',
          'Are you sure you want to delete this pitch deck? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                confirmed = true;
                resolve();
              },
            },
          ]
        );
      });
    }
    
    if (!confirmed) return;
    
    try {
      console.log('[startup-profile] Calling deletePitchMaterial with:', { deckId, storagePath });
      const result = await deletePitchMaterial(deckId, storagePath);
      console.log('[startup-profile] Delete result:', result);
      if (result.success) {
        showSuccess('Pitch deck deleted successfully');
        // Refresh to ensure UI is updated
        await refreshPitchMaterials();
      } else {
        const errorMsg = result.error || 'Failed to delete pitch deck';
        console.error('[startup-profile] Delete failed:', errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error('Error in handleDeletePitchDeck:', err);
      showError(err.message || 'Failed to delete pitch deck');
    }
  };

  const handleViewPitchDeck = (url: string | null) => {
    if (!url) {
      showAlert('No URL', 'This pitch deck does not have a URL set.');
      return;
    }
    
    // Open URL directly - works for both external links and storage URLs
    Linking.openURL(url).catch((err) => {
      console.error('Error opening pitch deck:', err);
      showAlert('Error', 'Unable to open pitch deck. Please check the URL is valid.');
    });
  };

  const handleDeletePitchVideo = async (videoId: string, storagePath: string | null) => {
    // Use platform-aware confirmation
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Delete Pitch Video\n\nAre you sure you want to delete this pitch video? This action cannot be undone.');
    } else {
      // For mobile, we'll use a promise-based approach
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Delete Pitch Video',
          'Are you sure you want to delete this pitch video? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Delete',
              style: 'destructive',
              onPress: () => {
                confirmed = true;
                resolve();
              },
            },
          ]
        );
      });
    }
    
    if (!confirmed) return;
    
    try {
      console.log('[startup-profile] Calling deletePitchMaterial with:', { videoId, storagePath });
      const result = await deletePitchMaterial(videoId, storagePath);
      console.log('[startup-profile] Delete result:', result);
      if (result.success) {
        showSuccess('Pitch video deleted successfully');
        // Refresh to ensure UI is updated
        await refreshPitchMaterials();
      } else {
        const errorMsg = result.error || 'Failed to delete pitch video';
        console.error('[startup-profile] Delete failed:', errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error('Error in handleDeletePitchVideo:', err);
      showError(err.message || 'Failed to delete pitch video');
    }
  };

  const handleViewPitchVideo = (url: string | null) => {
    if (!url) {
      showAlert('No URL', 'This pitch video does not have a URL set.');
      return;
    }
    
    // Open URL directly - works for both external links and storage URLs
    Linking.openURL(url).catch((err) => {
      console.error('Error opening pitch video:', err);
      showAlert('Error', 'Unable to open pitch video. Please check the URL is valid.');
    });
  };

  if (loadingProfile) {
    return (
      <SafeAreaView style={[styles.container, styles.loadingState]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <NotificationContainer notifications={notifications} onDismiss={dismissNotification} />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <LinearGradient colors={GRADIENTS.primary as any} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Building2 size={28} color={COLORS.background} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Startup Profile</Text>
              <Text style={styles.heroSubtitle}>Manage your startup information</Text>
            </View>
          </View>
          <View style={styles.progressCard}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressLabel}>Profile Completeness</Text>
              <Text style={styles.progressValue}>{profileCompleteness()}%</Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${profileCompleteness()}%` },
                ]}
              />
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Startup Details</Text>
          <Input
            label="Startup Name"
            value={startupName}
            onChangeText={setStartupName}
            placeholder="Your startup name"
          />
          <Input
            label="Description"
            value={description}
            onChangeText={setDescription}
            placeholder="What problem are you solving?"
            multiline
            numberOfLines={4}
          />
          <Picker
            label="Industry"
            selectedValue={industry}
            onValueChange={setIndustry}
            items={INDUSTRIES}
          />
          <Picker
            label="Current Stage"
            selectedValue={stage}
            onValueChange={setStage}
            items={STAGES}
          />
          <Input
            label="Website"
            value={website}
            onChangeText={setWebsite}
            placeholder="https://yourstartup.com"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pitch Materials</Text>
          
          {/* Pitch Decks */}
          <View style={styles.materialsList}>
            {pitchDecks.length > 0 ? (
              pitchDecks.map((deck) => (
                <View key={deck.id} style={styles.materialCard}>
                  <View style={styles.materialIcon}>
                    <FileText size={24} color={COLORS.success} strokeWidth={2} />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialTitle}>{deck.filename || 'Pitch Deck'}</Text>
                    <Text style={styles.materialStatus}>
                      {deck.visibility === 'public' ? 'Public' : 'Private'} • 
                      {deck.reviewed ? ' Reviewed' : ' Pending Review'}
                    </Text>
                  </View>
                  <View style={styles.materialActions}>
                    <TouchableOpacity
                      onPress={() => handleViewPitchDeck(deck.url)}
                      style={styles.actionButton}>
                      <ExternalLink size={20} color={COLORS.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePitchDeck(deck.id, deck.storage_path)}
                      style={styles.actionButton}>
                      <Trash2 size={20} color={COLORS.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <TouchableOpacity
                style={styles.materialCard}
                onPress={() => handlePitchNavigation('/(tabs)/pitch-upload')}
                activeOpacity={0.7}>
                <View style={styles.materialIcon}>
                  <FileText size={24} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialTitle}>Pitch Deck</Text>
                  <Text style={styles.materialStatus}>Not uploaded</Text>
                </View>
                <Text style={styles.uploadLink}>Upload</Text>
              </TouchableOpacity>
            )}

            {/* Add another deck button if user has uploaded deck and can upload more */}
            {pitchDecks.length > 0 && canUploadPitchAssets && (
              <TouchableOpacity
                style={styles.addMaterialButton}
                onPress={() => handlePitchNavigation('/(tabs)/pitch-upload')}
                activeOpacity={0.7}>
                <FileText size={20} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.addMaterialText}>Add Another Pitch Deck</Text>
              </TouchableOpacity>
            )}

            {/* Pitch Videos */}
            {pitchVideos.length > 0 ? (
              pitchVideos.map((video) => (
                <View key={video.id} style={styles.materialCard}>
                  <View style={styles.materialIcon}>
                    <Video size={24} color={COLORS.success} strokeWidth={2} />
                  </View>
                  <View style={styles.materialInfo}>
                    <Text style={styles.materialTitle}>{video.filename || 'Pitch Video'}</Text>
                    <Text style={styles.materialStatus}>
                      {video.visibility === 'public' ? 'Public' : 'Private'} • 
                      {video.reviewed ? ' Reviewed' : ' Pending Review'}
                    </Text>
                  </View>
                  <View style={styles.materialActions}>
                    <TouchableOpacity
                      onPress={() => handleViewPitchVideo(video.url)}
                      style={styles.actionButton}>
                      <ExternalLink size={20} color={COLORS.primary} strokeWidth={2} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => handleDeletePitchVideo(video.id, video.storage_path)}
                      style={styles.actionButton}>
                      <Trash2 size={20} color={COLORS.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            ) : (
              <TouchableOpacity
                style={styles.materialCard}
                onPress={() => handlePitchNavigation('/(tabs)/pitch-video')}
                activeOpacity={0.7}>
                <View style={styles.materialIcon}>
                  <Video size={24} color={COLORS.primary} strokeWidth={2} />
                </View>
                <View style={styles.materialInfo}>
                  <Text style={styles.materialTitle}>Pitch Video (2 min)</Text>
                  <Text style={styles.materialStatus}>Not recorded</Text>
                </View>
                <Text style={styles.uploadLink}>Record</Text>
              </TouchableOpacity>
            )}

            {/* Add another video button if user has uploaded video and can upload more */}
            {pitchVideos.length > 0 && canUploadPitchAssets && (
              <TouchableOpacity
                style={styles.addMaterialButton}
                onPress={() => handlePitchNavigation('/(tabs)/pitch-video')}
                activeOpacity={0.7}>
                <Video size={20} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.addMaterialText}>Record Another Pitch Video</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visibility Settings</Text>
            <View style={styles.visibilityToggle}>
              <Eye size={18} color={isPublic ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
              <Switch
                value={isPublic}
                onValueChange={setIsPublic}
                trackColor={{ false: COLORS.border, true: COLORS.primary }}
                thumbColor={COLORS.background}
              />
              <Text style={styles.visibilityLabel}>{isPublic ? 'Public' : 'Private'}</Text>
            </View>
          </View>
          <View style={styles.visibilityInfo}>
            <Text style={styles.visibilityInfoText}>
              {isPublic
                ? 'Your profile is visible to all investors on the platform'
                : 'Your profile is only visible to investors you connect with'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Social Links</Text>
          <View style={styles.socialLinks}>
            <View style={styles.socialLinkItem}>
              <LinkIcon size={18} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.socialLinkText}>
                {linkedinUrl || 'LinkedIn not set'}
              </Text>
            </View>
            <View style={styles.socialLinkItem}>
              <LinkIcon size={18} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.socialLinkText}>
                {twitterUrl || 'Twitter not set'}
              </Text>
            </View>
            <View style={styles.socialLinkItem}>
              <LinkIcon size={18} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.socialLinkText}>
                {websiteUrl || 'Website not set'}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.editLinksButton}
            onPress={() => router.push('/(tabs)/edit-profile')}
            activeOpacity={0.7}>
            <Text style={styles.editLinksText}>Edit Social Links</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsSection}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={handleShare}
            activeOpacity={0.7}>
            <Share2 size={20} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.shareButtonText}>Share Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={handleExportPDF}
            activeOpacity={0.7}>
            <Download size={20} color={COLORS.primary} strokeWidth={2} />
            <Text style={styles.exportButtonText}>Export PDF</Text>
          </TouchableOpacity>
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
    gap: SPACING.lg,
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
  progressCard: {
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    gap: SPACING.sm,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
  },
  progressValue: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.background,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.accent,
    borderRadius: BORDER_RADIUS.full,
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
  visibilityToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  visibilityLabel: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  visibilityInfo: {
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceMuted,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  visibilityInfoText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  materialsList: {
    gap: SPACING.md,
  },
  materialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  materialIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  materialInfo: {
    flex: 1,
  },
  materialTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  materialStatus: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  materialActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  actionButton: {
    padding: SPACING.xs,
  },
  addMaterialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
  },
  addMaterialText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  uploadLink: {
    ...TYPOGRAPHY.bodyStrong,
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
  socialLinkText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  editLinksButton: {
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  editLinksText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  actionsSection: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  shareButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  shareButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  exportButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  exportButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  saveButton: {
    marginTop: SPACING.md,
  },
  loadingState: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

