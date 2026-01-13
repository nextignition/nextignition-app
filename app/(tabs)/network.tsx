import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { EmptyState } from '@/components/EmptyState';
import { FounderProfileCard } from '@/components/network/FounderProfileCard';
import { InvestorProfileCard } from '@/components/network/InvestorProfileCard';
import { Picker } from '@/components/Picker';
import { useExploreNetwork } from '@/hooks/useExploreNetwork';
import { getOrCreateDirectConversation } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SPACING, BORDER_RADIUS, FONT_SIZES, FONT_FAMILY, GRADIENTS, SHADOWS, theme } from '@/constants/theme';
import { Search, Filter, Network, X, SlidersHorizontal } from 'lucide-react-native';

import { INDUSTRIES_WITH_ALL } from '@/constants/industries';

const INDUSTRIES = INDUSTRIES_WITH_ALL;

const STAGES = [
  { label: 'All Stages', value: '' },
  { label: 'Idea', value: 'idea' },
  { label: 'MVP', value: 'mvp' },
  { label: 'Growth', value: 'growth' },
  { label: 'Scale', value: 'scale' },
  { label: 'Pre-seed', value: 'pre_seed' },
  { label: 'Seed', value: 'seed' },
  { label: 'Series A', value: 'series_a' },
  { label: 'Series B', value: 'series_b' },
  { label: 'Series C+', value: 'series_c_plus' },
];

const ROLES = [
  { label: 'All Roles', value: '' },
  { label: 'Founder', value: 'founder' },
  { label: 'Investor', value: 'investor' },
  { label: 'Expert', value: 'expert' },
];

export default function NetworkScreen() {
  const router = useRouter();
  const { user, profile } = useAuth();
  // Separate states for input and applied search
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [chatLoading, setChatLoading] = useState<Record<string, boolean>>({});

  const {
    profiles,
    startups,
    loading: networkLoading,
    error: networkError,
    refetch,
  } = useExploreNetwork({
    search: appliedSearch,
    industry: industryFilter,
    stage: stageFilter,
    location: locationFilter,
    role: roleFilter as 'founder' | 'investor' | 'expert' | undefined,
  });

  // Filter profiles by role if role filter is set
  const filteredProfiles = roleFilter
    ? profiles.filter(p => {
        if (roleFilter === 'founder') return p.role === 'founder' || p.role === 'cofounder';
        return p.role === roleFilter;
      })
    : profiles;

  const hasActiveFilters = !!(
    appliedSearch ||
    industryFilter ||
    stageFilter ||
    locationFilter ||
    roleFilter
  );

  const clearAllFilters = () => {
    setSearchInput('');
    setAppliedSearch('');
    setIndustryFilter('');
    setStageFilter('');
    setLocationFilter('');
    setRoleFilter('');
  };

  const handleSearchSubmit = () => {
    setAppliedSearch(searchInput);
  };

  const handleSearchKeyPress = (e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSearchSubmit();
    }
  };

  const handleChat = async (targetId: string, targetName: string) => {
    console.log('handleChat called with:', { targetId, targetName, userId: user?.id });
    
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to start a chat');
      return;
    }

    // Set loading for this specific profile only
    setChatLoading(prev => ({ ...prev, [targetId]: true }));
    
    try {
      console.log('Creating/getting conversation...');
      const { conversationId, error } = await getOrCreateDirectConversation(
        user.id,
        targetId,
        targetName
      );

      console.log('Conversation result:', { conversationId, error });

      if (error || !conversationId) {
        Alert.alert('Error', error || 'Failed to start conversation');
        setChatLoading(prev => ({ ...prev, [targetId]: false }));
        return;
      }

      console.log('Navigating to chat with conversationId:', conversationId);
      // Navigate to chat with conversation ID using query params
      router.push(`/(tabs)/chat?conversationId=${conversationId}&userName=${encodeURIComponent(targetName)}`);
      // Don't reset loading immediately - let navigation happen
      setTimeout(() => {
        setChatLoading(prev => ({ ...prev, [targetId]: false }));
      }, 500);
    } catch (err: any) {
      console.error('Chat error:', err);
      Alert.alert('Error', err.message || 'Failed to start chat');
      setChatLoading(prev => ({ ...prev, [targetId]: false }));
    }
  };

  const handleViewDetails = (profileId: string) => {
    // Navigate to profile details based on role
    const targetProfile = profiles.find(p => p.id === profileId);
    if (targetProfile?.role === 'investor') {
      router.push(`/(tabs)/investor-detail?id=${profileId}`);
    } else if (targetProfile?.role === 'founder' || targetProfile?.role === 'cofounder') {
      // For founders, navigate to their startup detail page
      router.push(`/(tabs)/startup-detail?ownerId=${profileId}`);
    } else {
      router.push(`/(tabs)/founder-profile?id=${profileId}`);
    }
  };

  const handleViewPitch = (profileId: string) => {
    const startup = startups?.find(s => s.owner_id === profileId);
    if (startup) {
      router.push(`/(tabs)/pitch-materials?startupId=${startup.id}`);
    }
  };

  const handleScheduleMeeting = (founderEmail: string) => {
    if (founderEmail) {
      router.push(`/(tabs)/schedule-meeting?email=${encodeURIComponent(founderEmail)}`);
    } else {
      router.push('/(tabs)/schedule-meeting');
    }
  };

  if (networkError) {
    return (
      <SafeAreaView style={styles.container}>
        <EmptyState
          icon={Network}
          title="Error loading network"
          message={networkError}
          actionLabel="Try Again"
          onAction={refetch}
        />
      </SafeAreaView>
    );
  }

  const showFounders = profile?.role === 'investor' || profile?.role === 'expert';
  const showInvestors = profile?.role === 'founder' || profile?.role === 'cofounder' || profile?.role === 'expert';

  return (
    <SafeAreaView style={styles.container}>
      {networkLoading && (
        <View style={styles.loadingOverlay} pointerEvents="none">
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      )}
      <LinearGradient colors={GRADIENTS.primary} style={styles.header}>
        <Text style={styles.headerTitle}>Explore Network</Text>
        <Text style={styles.headerSubtitle}>
          {profile?.role === 'expert' 
            ? 'Discover innovative startups and founders • Connect with founders and investors'
            : showFounders 
              ? 'Discover innovative startups and founders'
              : showInvestors 
                ? 'Connect with investors' 
                : 'Connect with the startup ecosystem'}
        </Text>
      </LinearGradient>

      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={COLORS.textSecondary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, company, or industry"
            placeholderTextColor={COLORS.textSecondary}
            value={searchInput}
            onChangeText={setSearchInput}
            onSubmitEditing={handleSearchSubmit}
            onKeyPress={handleSearchKeyPress}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchInput.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchInput('');
                setAppliedSearch('');
              }}
              style={styles.clearButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <X size={18} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
          {searchInput.length > 0 && searchInput !== appliedSearch && (
            <TouchableOpacity
              onPress={handleSearchSubmit}
              style={styles.searchButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity
          style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <SlidersHorizontal size={20} color={showFilters ? COLORS.background : COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Advanced Filters Panel */}
      {showFilters && (
        <View style={styles.filtersContainer}>
          <View style={styles.filtersHeader}>
            <Text style={styles.filtersTitle}>Filters</Text>
            {hasActiveFilters && (
              <TouchableOpacity onPress={clearAllFilters} style={styles.clearAllButton}>
                <Text style={styles.clearAllText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.filtersContent}>
            {profile?.role === 'expert' && (
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Role</Text>
                <Picker
                  value={roleFilter}
                  onValueChange={setRoleFilter}
                  items={ROLES}
                  placeholder="Select role"
                />
              </View>
            )}

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Industry</Text>
              <Picker
                value={industryFilter}
                onValueChange={setIndustryFilter}
                items={INDUSTRIES}
                placeholder="Select industry"
              />
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Stage</Text>
              <Picker
                value={stageFilter}
                onValueChange={setStageFilter}
                items={STAGES}
                placeholder="Select stage"
              />
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Location</Text>
              <TextInput
                style={styles.filterInput}
                placeholder="Enter location"
                placeholderTextColor={COLORS.textSecondary}
                value={locationFilter}
                onChangeText={setLocationFilter}
              />
            </View>
          </View>
        </View>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <View style={styles.activeFiltersContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.activeFiltersContent}>
            {appliedSearch && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Search: {appliedSearch}</Text>
                <TouchableOpacity onPress={() => {
                  setSearchInput('');
                  setAppliedSearch('');
                }} style={styles.removeFilterButton}>
                  <X size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {industryFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Industry: {INDUSTRIES.find(i => i.value === industryFilter)?.label || industryFilter}
                </Text>
                <TouchableOpacity onPress={() => setIndustryFilter('')} style={styles.removeFilterButton}>
                  <X size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {stageFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Stage: {STAGES.find(s => s.value === stageFilter)?.label || stageFilter}
                </Text>
                <TouchableOpacity onPress={() => setStageFilter('')} style={styles.removeFilterButton}>
                  <X size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {locationFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>Location: {locationFilter}</Text>
                <TouchableOpacity onPress={() => setLocationFilter('')} style={styles.removeFilterButton}>
                  <X size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
            {roleFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  Role: {ROLES.find(r => r.value === roleFilter)?.label || roleFilter}
                </Text>
                <TouchableOpacity onPress={() => setRoleFilter('')} style={styles.removeFilterButton}>
                  <X size={14} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredProfiles.length === 0 ? (
          <EmptyState
            icon={Network}
            title="No profiles found"
            message="Try adjusting your search or filters"
            actionLabel="Clear Filters"
            onAction={clearAllFilters}
          />
        ) : (
          <>
            {showFounders && (!roleFilter || roleFilter === 'founder') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Founders ({filteredProfiles.filter(p => p.role === 'founder' || p.role === 'cofounder').length})
                </Text>
                {filteredProfiles
                  .filter(p => p.role === 'founder' || p.role === 'cofounder')
                  .map(founderProfile => {
                    const startup = startups?.find(s => s.owner_id === founderProfile.id);
                    return (
                      <FounderProfileCard
                        key={founderProfile.id}
                        profile={founderProfile}
                        startup={startup}
                        onChat={() => handleChat(founderProfile.id, founderProfile.full_name || 'User')}
                        onViewDetails={() => handleViewDetails(founderProfile.id)}
                        onViewPitch={profile?.role !== 'investor' ? () => handleViewPitch(founderProfile.id) : undefined}
                        onScheduleMeeting={profile?.role === 'investor' ? () => handleScheduleMeeting(founderProfile.email || '') : undefined}
                        chatLoading={chatLoading[founderProfile.id] || false}
                      />
                    );
                  })}
              </View>
            )}

            {showInvestors && (!roleFilter || roleFilter === 'investor') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Investors ({filteredProfiles.filter(p => p.role === 'investor').length})
                </Text>
                {filteredProfiles
                  .filter(p => p.role === 'investor')
                  .map(investorProfile => (
                    <InvestorProfileCard
                      key={investorProfile.id}
                      profile={investorProfile}
                      onChat={() => handleChat(investorProfile.id, investorProfile.full_name || 'User')}
                      onViewDetails={() => handleViewDetails(investorProfile.id)}
                      chatLoading={chatLoading[investorProfile.id] || false}
                    />
                  ))}
              </View>
            )}

            {profile?.role === 'expert' && (!roleFilter || roleFilter === 'expert') && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>
                  Experts ({filteredProfiles.filter(p => p.role === 'expert').length})
                </Text>
                {filteredProfiles
                  .filter(p => p.role === 'expert')
                  .map(expertProfile => (
                    <InvestorProfileCard
                      key={expertProfile.id}
                      profile={expertProfile}
                      onChat={() => handleChat(expertProfile.id, expertProfile.full_name || 'User')}
                      onViewDetails={() => handleViewDetails(expertProfile.id)}
                      chatLoading={chatLoading[expertProfile.id] || false}
                    />
                  ))}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.xl,
  },
  headerTitle: {
    fontSize: FONT_SIZES.xxxl,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.background,
    marginBottom: SPACING.xs,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.body,
    color: 'rgba(255,255,255,0.9)',
  },
  searchSection: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  searchButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  searchButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  filterToggleButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  filterToggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipsContainer: {
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.xs,
    paddingBottom: SPACING.xs,
    gap: SPACING.xs,
    minHeight: 0,
  },
  chip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 4,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginRight: SPACING.xs,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
    lineHeight: 14,
  },
  chipTextActive: {
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  filtersContainer: {
    backgroundColor: COLORS.surfaceMuted,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filtersTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  clearAllButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  clearAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.primary,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  filterRow: {
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  filterInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
    borderWidth: 1,
    borderColor: COLORS.border,
    minHeight: 56,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  activeFiltersContainer: {
    backgroundColor: COLORS.surfaceMuted,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: SPACING.sm,
  },
  activeFiltersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    marginRight: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.primary + '40',
  },
  activeFilterText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.primaryDark,
    marginRight: SPACING.xs,
  },
  removeFilterButton: {
    padding: SPACING.xs / 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xl,
  },
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.md,
    letterSpacing: -0.3,
  },
});

