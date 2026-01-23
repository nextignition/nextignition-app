import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import {
  X,
  Building2,
  MapPin,
  Users,
  Calendar,
  BarChart3,
  FileText,
  ExternalLink,
  DollarSign,
  Target,
  Award,
  Download,
  Edit,
} from 'lucide-react-native';
import { Button } from '@/components/Button';
import { COLORS, SPACING, FONT_SIZES, FONT_WEIGHTS, BORDER_RADIUS, TYPOGRAPHY } from '@/constants/theme';
import { FundingOpportunity } from '@/types/funding';
import { useInvestorViews } from '@/hooks/useInvestorViews';
import { useAuth } from '@/contexts/AuthContext';
import { usePitchMaterials } from '@/hooks/usePitchMaterials';
import { useNotification } from '@/hooks/useNotification';
import { router } from 'expo-router';
import { Plus, Trash2, Upload, Video as VideoIcon } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

interface OpportunityDetailsModalProps {
  visible: boolean;
  opportunity: FundingOpportunity | null;
  onClose: () => void;
  onExpressInterest?: (opportunity: FundingOpportunity) => void;
  onEdit?: (opportunity: FundingOpportunity) => void;
  onRefresh?: () => void;
}

export function OpportunityDetailsModal({
  visible,
  opportunity,
  onClose,
  onExpressInterest,
  onEdit,
  onRefresh,
}: OpportunityDetailsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'details' | 'documents'>('overview');
  const { trackView } = useInvestorViews();
  const { profile, user } = useAuth();
  const { pitchDecks, pitchVideos, deletePitchMaterial, refresh: refreshPitchMaterials } = usePitchMaterials();
  const { showSuccess, showError } = useNotification();
  const isInvestor = profile?.role === 'investor';
  const isFounder = profile?.role === 'founder' || profile?.role === 'cofounder';
  
  // Reset to details tab when modal opens (especially after edit)
  useEffect(() => {
    if (visible && isFounder) {
      setActiveTab('details');
    }
  }, [visible, isFounder]);

  // Track investor view when modal opens (for any tab/view)
  // Note: This is non-blocking - errors are logged but don't prevent modal from opening
  useEffect(() => {
    if (!visible || !opportunity || !isInvestor) return;
    
    // Track view if pitch deck exists - but don't block if it fails
    if (opportunity.pitch_deck?.id) {
      // Use a small delay to ensure component is mounted
      const timer = setTimeout(() => {
        // Track view asynchronously - don't await, don't block
        // trackView returns void, so we call it without await
        trackView(opportunity.pitch_deck!.id);
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [visible, opportunity?.pitch_deck?.id, isInvestor, trackView]);

  // Refresh pitch materials when modal opens for founders
  useEffect(() => {
    if (visible && isFounder) {
      refreshPitchMaterials();
    }
  }, [visible, isFounder, refreshPitchMaterials]);

  // Watch for opportunity changes and ensure documents tab shows correct state
  useEffect(() => {
    // If opportunity changes and pitch_deck/video_url are removed, ensure we're on documents tab
    if (visible && isFounder && opportunity && !opportunity.pitch_deck && !opportunity.video_url) {
      setActiveTab('documents');
    }
  }, [opportunity?.pitch_deck, opportunity?.video_url, visible, isFounder]);

  const handleUploadPitchDeck = () => {
    onClose();
    router.push({
      pathname: '/(tabs)/pitch-upload',
      params: { returnTo: 'funding-request', requestId: opportunity?.id },
    });
  };

  const handleRecordVideo = () => {
    onClose();
    router.push({
      pathname: '/(tabs)/pitch-video',
      params: { returnTo: 'funding-request', requestId: opportunity?.id },
    });
  };

  const handleRemovePitchDeck = async (materialId: string) => {
    if (!opportunity) return;
    
    // Use platform-aware confirmation
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Remove Pitch Deck\n\nAre you sure you want to remove this pitch deck? This action cannot be undone.');
    } else {
      // For mobile, we'll use a promise-based approach
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Remove Pitch Deck',
          'Are you sure you want to remove this pitch deck? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Remove',
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
      // Find the material to get storage path - try both pitchDecks and all pitchMaterials
      let material = pitchDecks.find(d => d.id === materialId);
      
      // If not found in pitchDecks, try to find it by matching the opportunity's pitch_deck
      if (!material && opportunity.pitch_deck?.id) {
        // Use the opportunity's pitch_deck id directly
        const allMaterials = [...pitchDecks, ...pitchVideos];
        material = allMaterials.find(m => m.id === opportunity.pitch_deck!.id);
      }
      
      // If still not found, try to get it from the database
      if (!material) {
        const { data: materialData, error: fetchError } = await supabase
          .from('pitch_materials')
          .select('id, storage_path, type')
          .eq('id', materialId)
          .eq('owner_profile_id', user?.id)
          .single();
        
        if (fetchError || !materialData) {
          showError('Pitch deck not found');
          return;
        }
        
        material = {
          id: materialData.id,
          storage_path: materialData.storage_path,
          type: materialData.type as 'deck' | 'video',
        } as any;
      }

      if (!material) {
        showError('Pitch deck not found');
        return;
      }

      console.log('[OpportunityDetailsModal] Calling deletePitchMaterial with:', { id: material.id, storagePath: material.storage_path });
      const result = await deletePitchMaterial(material.id, material.storage_path);
      console.log('[OpportunityDetailsModal] Delete result:', result);
      
      if (result.success) {
        // Update funding request to remove pitch_material_id (already done in deletePitchMaterial, but ensure it's cleared)
        const { error: fundingError } = await supabase
          .from('funding_requests')
          .update({ pitch_material_id: null })
          .eq('id', opportunity.id);
        
        if (fundingError) {
          console.error('Error updating funding request:', fundingError);
          // Non-fatal - material is already deleted
        }
        
        // Show success notification
        showSuccess('Pitch deck deleted successfully');
        
        // Refresh pitch materials to update the list
        await refreshPitchMaterials();
        
        // Refresh opportunity data to get updated opportunity without the pitch_deck
        if (onRefresh) {
          onRefresh();
        }
        
        // Switch to documents tab to show updated state
        setActiveTab('documents');
        
        // Don't close modal - keep it open to show updated state
        // The opportunity will be refreshed and pitch_deck will be null/undefined
      } else {
        const errorMsg = result.error || 'Failed to remove pitch deck';
        console.error('[OpportunityDetailsModal] Delete failed:', errorMsg);
        showError(errorMsg);
      }
    } catch (err: any) {
      console.error('Error removing pitch deck:', err);
      showError(err.message || 'Failed to remove pitch deck');
    }
  };

  const handleRemovePitchVideo = async () => {
    if (!opportunity) return;
    
    // Use platform-aware confirmation
    let confirmed = false;
    if (Platform.OS === 'web') {
      confirmed = window.confirm('Remove Pitch Video\n\nAre you sure you want to remove this pitch video? This action cannot be undone.');
    } else {
      // For mobile, we'll use a promise-based approach
      await new Promise<void>((resolve) => {
        Alert.alert(
          'Remove Pitch Video',
          'Are you sure you want to remove this pitch video? This action cannot be undone.',
          [
            { text: 'Cancel', style: 'cancel', onPress: () => resolve() },
            {
              text: 'Remove',
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
      // Find the video material from pitchVideos
      let videoMaterial = pitchVideos.find(v => v.url === opportunity.video_url);
      
      // If not found, try to get it from the database
      if (!videoMaterial && opportunity.video_url) {
        const { data: materialData, error: fetchError } = await supabase
          .from('pitch_materials')
          .select('id, storage_path, type, url')
          .eq('url', opportunity.video_url)
          .eq('owner_profile_id', user?.id)
          .eq('type', 'video')
          .maybeSingle();
        
        if (!fetchError && materialData) {
          videoMaterial = {
            id: materialData.id,
            storage_path: materialData.storage_path,
            url: materialData.url,
            type: 'video',
          } as any;
        }
      }
      
      if (videoMaterial) {
        const result = await deletePitchMaterial(videoMaterial.id, videoMaterial.storage_path);
        
        if (result.success) {
          // Update funding request to remove pitch_video_id
          const { error: fundingError } = await supabase
            .from('funding_requests')
            .update({ pitch_video_id: null })
            .eq('id', opportunity.id);
          
          if (fundingError) {
            console.error('Error updating funding request:', fundingError);
          }
          
          // Show success notification
          showSuccess('Pitch video deleted successfully');
          
          // Refresh pitch materials to update the list
          await refreshPitchMaterials();
          
          // Refresh opportunity data to get updated opportunity without the video
          if (onRefresh) {
            onRefresh();
          }
          
          // Switch to documents tab to show updated state
          setActiveTab('documents');
          
          // Don't close modal - keep it open to show updated state
        } else {
          const errorMsg = result.error || 'Failed to remove pitch video';
          console.error('[OpportunityDetailsModal] Delete failed:', errorMsg);
          showError(errorMsg);
        }
      } else {
        // If video is not in pitch_materials, just update funding request
        const { error: fundingError } = await supabase
          .from('funding_requests')
          .update({ pitch_video_id: null })
          .eq('id', opportunity.id);
        
        if (fundingError) {
          console.error('Error updating funding request:', fundingError);
        }
        
        // Show success notification
        showSuccess('Pitch video deleted successfully');
        
        // Refresh pitch materials
        await refreshPitchMaterials();
        
        // Refresh opportunity data
        if (onRefresh) {
          onRefresh();
        }
        
        // Switch to documents tab
        setActiveTab('documents');
      }
    } catch (err: any) {
      console.error('Error removing pitch video:', err);
      showError(err.message || 'Failed to remove pitch video');
    }
  };

  if (!opportunity) return null;

  const progressPercentage = (opportunity.raised_amount / opportunity.target_amount) * 100;
  const daysLeft = Math.ceil(
    (new Date(opportunity.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStageLabel = () => {
    return opportunity.stage
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{opportunity.company_name}</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'overview' && styles.tabActive]}
            onPress={() => setActiveTab('overview')}>
            <Text style={[styles.tabText, activeTab === 'overview' && styles.tabTextActive]}>
              Overview
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}>
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Details
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'documents' && styles.tabActive]}
            onPress={() => setActiveTab('documents')}>
            <Text style={[styles.tabText, activeTab === 'documents' && styles.tabTextActive]}>
              Documents
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {activeTab === 'overview' && (
            <View style={styles.tabContent}>
              {opportunity.images && opportunity.images.length > 0 && (
                <Image source={{ uri: opportunity.images[0] }} style={styles.heroImage} />
              )}

              <View style={styles.section}>
                <Text style={styles.tagline}>{opportunity.tagline}</Text>
                <View style={styles.metaBadges}>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>{getStageLabel()}</Text>
                  </View>
                  <View style={styles.metaBadge}>
                    <Text style={styles.metaBadgeText}>
                      {opportunity.industry.toUpperCase()}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={styles.fundingCard}>
                <View style={styles.fundingRow}>
                  <View style={styles.fundingItem}>
                    <Text style={styles.fundingLabel}>Target</Text>
                    <Text style={styles.fundingValue}>
                      {formatCurrency(opportunity.target_amount)}
                    </Text>
                  </View>
                  <View style={styles.fundingItem}>
                    <Text style={styles.fundingLabel}>Raised</Text>
                    <Text style={[styles.fundingValue, { color: COLORS.primary }]}>
                      {formatCurrency(opportunity.raised_amount)}
                    </Text>
                  </View>
                </View>
                <View style={styles.progressBar}>
                  <View
                    style={[styles.progressFill, { width: `${Math.min(progressPercentage, 100)}%` }]}
                  />
                </View>
                <Text style={styles.progressText}>{progressPercentage.toFixed(1)}% funded</Text>
                {opportunity.status === 'active' && (
                  <Text style={styles.deadlineText}>
                    {daysLeft} days remaining to invest
                  </Text>
                )}
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>About</Text>
                <Text style={styles.description}>{opportunity.description}</Text>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Key Highlights</Text>
                <View style={styles.highlightsList}>
                  {opportunity.highlights.map((highlight, index) => (
                    <View key={index} style={styles.highlightItem}>
                      <Award size={16} color={COLORS.primary} />
                      <Text style={styles.highlightText}>{highlight}</Text>
                    </View>
                  ))}
                </View>
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Team</Text>
                <View style={styles.foundersList}>
                  {opportunity.founders.map((founder) => (
                    <View key={founder.id} style={styles.founderCard}>
                      <View style={styles.founderAvatar}>
                        <Users size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.founderInfo}>
                        <Text style={styles.founderName}>{founder.name}</Text>
                        <Text style={styles.founderRole}>{founder.role}</Text>
                      </View>
                      {founder.linkedin && (
                        <TouchableOpacity style={styles.linkedinButton}>
                          <ExternalLink size={16} color={COLORS.primary} />
                        </TouchableOpacity>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </View>
          )}

          {activeTab === 'details' && (
            <View style={styles.tabContent}>
              {isFounder && opportunity && onEdit && (
                <TouchableOpacity
                  style={styles.editButton}
                  onPress={() => {
                    onEdit(opportunity);
                  }}
                  activeOpacity={0.7}>
                  <Edit size={18} color={COLORS.primary} strokeWidth={2} />
                  <Text style={styles.editButtonText}>Edit Information</Text>
                </TouchableOpacity>
              )}
              <View style={styles.detailsGrid}>
                <DetailItem
                  icon={<DollarSign size={20} color={COLORS.primary} />}
                  label="Valuation"
                  value={formatCurrency(opportunity.valuation)}
                />
                <DetailItem
                  icon={<Target size={20} color={COLORS.primary} />}
                  label="Equity Offered"
                  value={`${opportunity.equity_offered}%`}
                />
                <DetailItem
                  icon={<BarChart3 size={20} color={COLORS.primary} strokeWidth={2} />}
                  label="Revenue"
                  value={formatCurrency(opportunity.revenue)}
                />
                <DetailItem
                  icon={<BarChart3 size={20} color={COLORS.primary} strokeWidth={2} />}
                  label="Growth Rate"
                  value={`${opportunity.growth_rate}% YoY`}
                />
                <DetailItem
                  icon={<Building2 size={20} color={COLORS.primary} />}
                  label="Founded"
                  value={opportunity.founded_year.toString()}
                />
                <DetailItem
                  icon={<Users size={20} color={COLORS.primary} />}
                  label="Team Size"
                  value={opportunity.team_size.toString()}
                />
                <DetailItem
                  icon={<MapPin size={20} color={COLORS.primary} />}
                  label="Location"
                  value={opportunity.location}
                />
                <DetailItem
                  icon={<Calendar size={20} color={COLORS.primary} />}
                  label="Deadline"
                  value={new Date(opportunity.deadline).toLocaleDateString()}
                />
              </View>

              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Investment Range</Text>
                <View style={styles.investmentRange}>
                  <View style={styles.rangeItem}>
                    <Text style={styles.rangeLabel}>Minimum</Text>
                    <Text style={styles.rangeValue}>
                      {formatCurrency(opportunity.min_investment)}
                    </Text>
                  </View>
                  <View style={styles.rangeSeparator} />
                  <View style={styles.rangeItem}>
                    <Text style={styles.rangeLabel}>Maximum</Text>
                    <Text style={styles.rangeValue}>
                      {formatCurrency(opportunity.max_investment)}
                    </Text>
                  </View>
                </View>
              </View>

              {opportunity.metrics && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Key Metrics</Text>
                  <View style={styles.metricsGrid}>
                    {opportunity.metrics.mrr && (
                      <MetricCard label="MRR" value={formatCurrency(opportunity.metrics.mrr)} />
                    )}
                    {opportunity.metrics.arr && (
                      <MetricCard label="ARR" value={formatCurrency(opportunity.metrics.arr)} />
                    )}
                    {opportunity.metrics.users && (
                      <MetricCard
                        label="Users"
                        value={opportunity.metrics.users.toLocaleString()}
                      />
                    )}
                    {opportunity.metrics.customers && (
                      <MetricCard
                        label="Customers"
                        value={opportunity.metrics.customers.toLocaleString()}
                      />
                    )}
                  </View>
                </View>
              )}
            </View>
          )}

          {activeTab === 'documents' && (
            <View style={styles.tabContent}>
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pitch Deck</Text>
                  {isFounder && (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handleUploadPitchDeck}>
                      <Plus size={16} color={COLORS.primary} />
                      <Text style={styles.uploadButtonText}>Upload</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {opportunity.pitch_deck ? (
                  <View style={styles.documentCard}>
                    <View style={styles.documentIcon}>
                      <FileText size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>{opportunity.pitch_deck.filename}</Text>
                      <Text style={styles.documentMeta}>
                        {opportunity.pitch_deck.pages} pages • PDF
                      </Text>
                    </View>
                    <View style={styles.documentActions}>
                      <TouchableOpacity
                        style={styles.documentActionButton}
                        onPress={() => {
                          if (opportunity.pitch_deck?.url) {
                            // Open URL
                            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                              window.open(opportunity.pitch_deck.url, '_blank');
                            } else {
                              // For mobile, use Linking
                              import('expo-linking').then(({ default: Linking }) => {
                                Linking.openURL(opportunity.pitch_deck!.url!);
                              });
                            }
                          }
                        }}>
                        <Download size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      {isFounder && (
                        <TouchableOpacity
                          style={styles.documentActionButton}
                          onPress={() => handleRemovePitchDeck(opportunity.pitch_deck!.id)}>
                          <Trash2 size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyDocumentState}>
                    <FileText size={32} color={COLORS.textSecondary} />
                    <Text style={styles.emptyDocumentText}>No pitch deck uploaded</Text>
                    {isFounder && (
                      <Text style={styles.emptyDocumentHint}>
                        Click "Upload" to add a pitch deck
                      </Text>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={styles.sectionTitle}>Pitch Video</Text>
                  {isFounder && (
                    <TouchableOpacity
                      style={styles.uploadButton}
                      onPress={handleRecordVideo}>
                      <VideoIcon size={16} color={COLORS.primary} />
                      <Text style={styles.uploadButtonText}>Record</Text>
                    </TouchableOpacity>
                  )}
                </View>
                {opportunity.video_url ? (
                  <View style={styles.documentCard}>
                    <View style={styles.documentIcon}>
                      <VideoIcon size={24} color={COLORS.primary} />
                    </View>
                    <View style={styles.documentInfo}>
                      <Text style={styles.documentName}>Pitch Video</Text>
                      <Text style={styles.documentMeta}>MP4 • Video</Text>
                    </View>
                    <View style={styles.documentActions}>
                      <TouchableOpacity
                        style={styles.documentActionButton}
                        onPress={() => {
                          if (opportunity.video_url) {
                            // Open video URL
                            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                              window.open(opportunity.video_url, '_blank');
                            } else {
                              import('expo-linking').then(({ default: Linking }) => {
                                Linking.openURL(opportunity.video_url!);
                              });
                            }
                          }
                        }}>
                        <Download size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                      {isFounder && (
                        <TouchableOpacity
                          style={styles.documentActionButton}
                          onPress={() => handleRemovePitchVideo()}>
                          <Trash2 size={18} color={COLORS.error} />
                        </TouchableOpacity>
                      )}
                    </View>
                  </View>
                ) : (
                  <View style={styles.emptyDocumentState}>
                    <VideoIcon size={32} color={COLORS.textSecondary} />
                    <Text style={styles.emptyDocumentText}>No pitch video recorded</Text>
                    {isFounder && (
                      <Text style={styles.emptyDocumentHint}>
                        Click "Record" to record a pitch video
                      </Text>
                    )}
                  </View>
                )}
              </View>

              {opportunity.documents && opportunity.documents.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Additional Documents</Text>
                  {opportunity.documents.map((doc) => (
                    <View key={doc.id} style={styles.documentCard}>
                      <View style={styles.documentIcon}>
                        <FileText size={24} color={COLORS.primary} />
                      </View>
                      <View style={styles.documentInfo}>
                        <Text style={styles.documentName}>{doc.name}</Text>
                        <Text style={styles.documentMeta}>{doc.type.toUpperCase()}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.documentActionButton}
                        onPress={() => {
                          if (doc.url) {
                            if (Platform.OS === 'web' && typeof window !== 'undefined') {
                              window.open(doc.url, '_blank');
                            } else {
                              import('expo-linking').then(({ default: Linking }) => {
                                Linking.openURL(doc.url);
                              });
                            }
                          }
                        }}>
                        <Download size={18} color={COLORS.primary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {!opportunity.pitch_deck && !opportunity.video_url && (!opportunity.documents || opportunity.documents.length === 0) && !isFounder && (
                <View style={styles.emptyState}>
                  <FileText size={48} color={COLORS.textSecondary} />
                  <Text style={styles.emptyText}>No documents available</Text>
                </View>
              )}
            </View>
          )}
        </ScrollView>

          {opportunity.status === 'active' && isInvestor && (
          <View style={styles.footer}>
            <Button 
              title="Express Interest" 
              onPress={() => {
                console.log('[OpportunityDetailsModal] Express Interest button clicked');
                if (opportunity && onExpressInterest) {
                  onExpressInterest(opportunity);
                } else {
                  console.error('[OpportunityDetailsModal] Missing opportunity or onExpressInterest callback');
                }
              }} 
              style={styles.actionButton} 
            />
          </View>
        )}
      </View>
    </Modal>
  );
}

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>{icon}</View>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  placeholder: {
    width: 40,
  },
  tabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  tab: {
    flex: 1,
    paddingVertical: SPACING.md,
    alignItems: 'center',
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
  },
  tabText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontWeight: FONT_WEIGHTS.bold,
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: SPACING.lg,
  },
  heroImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: COLORS.inputBackground,
    marginBottom: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  tagline: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  metaBadges: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  metaBadge: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: `${COLORS.primary}15`,
    borderRadius: BORDER_RADIUS.sm,
  },
  metaBadgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  fundingCard: {
    backgroundColor: COLORS.inputBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.xl,
  },
  fundingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
  },
  fundingItem: {
    flex: 1,
  },
  fundingLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  fundingValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: BORDER_RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    fontSize: FONT_SIZES.sm,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.xs,
  },
  deadlineText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 24,
  },
  highlightsList: {
    gap: SPACING.md,
  },
  highlightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  highlightText: {
    flex: 1,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  foundersList: {
    gap: SPACING.md,
  },
  founderCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
  },
  founderAvatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  founderInfo: {
    flex: 1,
  },
  founderName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  founderRole: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
  },
  linkedinButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.xl,
    justifyContent: 'space-between',
  },
  detailItem: {
    width: '48%',
    backgroundColor: COLORS.inputBackground,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  detailLabel: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  investmentRange: {
    flexDirection: 'row',
    backgroundColor: COLORS.inputBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
  },
  rangeItem: {
    flex: 1,
    alignItems: 'center',
  },
  rangeSeparator: {
    width: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.md,
  },
  rangeLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  rangeValue: {
    fontSize: FONT_SIZES.lg,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.text,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: COLORS.inputBackground,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  metricLabel: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  metricValue: {
    fontSize: FONT_SIZES.xl,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.primary,
  },
  documentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.sm,
  },
  documentIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: FONT_SIZES.md,
    fontWeight: FONT_WEIGHTS.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  documentMeta: {
    fontSize: FONT_SIZES.xs,
    color: COLORS.textSecondary,
  },
  footer: {
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  actionButton: {
    width: '100%',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl * 2,
    gap: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.sm,
  },
  uploadButtonText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontFamily: FONT_WEIGHTS.bold,
    fontSize: FONT_SIZES.sm,
  },
  documentActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
    alignItems: 'center',
  },
  documentActionButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surface,
  },
  emptyDocumentState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.sm,
  },
  emptyDocumentText: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_WEIGHTS.medium,
    color: COLORS.text,
  },
  emptyDocumentHint: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    alignSelf: 'flex-end',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
  },
  editButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontSize: FONT_SIZES.sm,
  },
});
