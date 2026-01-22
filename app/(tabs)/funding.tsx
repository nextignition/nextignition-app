import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, Grid3x3, List, RefreshCw, BarChart3, Plus } from 'lucide-react-native';
import { useFundingOpportunities } from '@/hooks/useFunding';
import { OpportunityCard } from '@/components/funding/OpportunityCard';
import { OpportunityTable } from '@/components/funding/OpportunityTable';
import { FilterModal } from '@/components/funding/FilterModal';
import { OpportunityDetailsModal } from '@/components/funding/OpportunityDetailsModal';
import { CreateFundingRequestModal } from '@/components/funding/CreateFundingRequestModal';
import { ExpressInterestModal } from '@/components/funding/ExpressInterestModal';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONT_FAMILY, TYPOGRAPHY, GRADIENTS } from '@/constants/theme';
import { FundingOpportunity } from '@/types/funding';
import { useAuth } from '@/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';

type ViewMode = 'grid' | 'table';

// Memoized SearchInput component to prevent re-renders
const SearchInput = React.memo(({ 
  value, 
  onChangeText, 
  onSubmit, 
  onKeyPress,
  placeholder,
  showSearchButton,
  onSearchPress 
}: { 
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  onKeyPress: (e: any) => void;
  placeholder: string;
  showSearchButton: boolean;
  onSearchPress: () => void;
}) => (
  <View style={styles.searchContainer}>
    <Search size={20} color={COLORS.textSecondary} strokeWidth={2} />
    <TextInput
      style={styles.searchInput}
      placeholder={placeholder}
      placeholderTextColor={COLORS.textSecondary}
      value={value}
      onChangeText={onChangeText}
      onSubmitEditing={onSubmit}
      onKeyPress={onKeyPress}
      autoCapitalize="none"
      autoCorrect={false}
      returnKeyType="search"
      clearButtonMode="while-editing"
    />
    {showSearchButton && (
      <TouchableOpacity
        onPress={onSearchPress}
        style={styles.searchButton}
        activeOpacity={0.7}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    )}
  </View>
));

SearchInput.displayName = 'SearchInput';

export default function FundingScreen() {
  const { profile, user } = useAuth();
  const {
    opportunities,
    allOpportunities,
    loading,
    filters,
    updateFilters,
    resetFilters,
    refresh,
  } = useFundingOpportunities();

  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [createRequestModalVisible, setCreateRequestModalVisible] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<FundingOpportunity | null>(null);
  const [showExpressInterestModal, setShowExpressInterestModal] = useState(false);
  const [expressInterestOpportunity, setExpressInterestOpportunity] = useState<FundingOpportunity | null>(null);
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null);
  const [pendingReopenId, setPendingReopenId] = useState<string | null>(null);
  // Separate states for input and applied search
  const [searchInput, setSearchInput] = useState('');
  const [appliedSearch, setAppliedSearch] = useState('');
  const params = useLocalSearchParams();

  const isInvestor = profile?.role === 'investor';
  const isFounder = profile?.role === 'founder' || profile?.role === 'cofounder';

  // Watch for opportunity updates after edit and reopen modal
  useEffect(() => {
    if (pendingReopenId && (allOpportunities.length > 0 || opportunities.length > 0)) {
      // Use a small delay to ensure refresh has completed
      const timer = setTimeout(() => {
        const updatedOpportunity = opportunities.find(o => o.id === pendingReopenId) || 
                                   allOpportunities.find(o => o.id === pendingReopenId);
        
        if (updatedOpportunity) {
          console.log('[Funding] Found updated opportunity, reopening details modal:', updatedOpportunity.id);
          setSelectedOpportunity(updatedOpportunity);
          setPendingReopenId(null);
        } else {
          console.log('[Funding] Updated opportunity not found yet, will retry...');
        }
      }, 300);
      
      return () => clearTimeout(timer);
    }
  }, [allOpportunities, opportunities, pendingReopenId]);

  // Watch for opportunity changes and update selectedOpportunity when it changes
  useEffect(() => {
    if (selectedOpportunity) {
      const updated = allOpportunities.find(o => o.id === selectedOpportunity.id) ||
                     opportunities.find(o => o.id === selectedOpportunity.id);
      if (updated && updated !== selectedOpportunity) {
        // Only update if the opportunity actually changed (e.g., pitch_deck removed)
        const hasChanged = 
          (updated.pitch_deck?.id !== selectedOpportunity.pitch_deck?.id) ||
          (updated.video_url !== selectedOpportunity.video_url);
        if (hasChanged) {
          console.log('[Funding] Opportunity updated, refreshing selected opportunity');
          setSelectedOpportunity(updated);
        }
      }
    }
  }, [allOpportunities, opportunities, selectedOpportunity]);

  // Check if we need to open edit modal or create modal
  useEffect(() => {
    if (params.editRequestId && isFounder) {
      const requestId = params.editRequestId as string;
      // Find the opportunity
      const opp = opportunities.find(o => o.id === requestId);
      if (opp) {
        setSelectedOpportunity(opp);
        setCreateRequestModalVisible(true);
        // Clear the param
        router.setParams({ editRequestId: undefined });
      }
    } else if (params.openCreateModal === 'true' && isFounder) {
      // Open create modal when returning from upload
      // Use setTimeout to ensure navigation is complete
      setTimeout(() => {
        setCreateRequestModalVisible(true);
        // Clear the param
        router.setParams({ openCreateModal: undefined, requestId: undefined });
      }, 200);
    }
  }, [params.editRequestId, params.openCreateModal, opportunities, isFounder]);

  // Update filters only when search is submitted
  useEffect(() => {
    if (appliedSearch !== filters.search) {
      updateFilters({ search: appliedSearch });
    }
  }, [appliedSearch]);

  const handleSearchSubmit = useCallback(() => {
    setAppliedSearch(searchInput);
  }, [searchInput]);

  const handleSearchKeyPress = useCallback((e: any) => {
    if (e.nativeEvent.key === 'Enter') {
      handleSearchSubmit();
    }
  }, [handleSearchSubmit]);

  const activeFilterCount =
    filters.industries.length +
    filters.stages.length +
    filters.statuses.length;

  const totalRaised = allOpportunities.reduce(
    (sum, opp) => sum + opp.raised_amount,
    0
  );

  const activeDeals = allOpportunities.filter((opp) => opp.status === 'active').length;

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    }
    return `$${(amount / 1000).toFixed(0)}K`;
  };

  // Role-specific subtitle
  const getSubtitle = () => {
    if (isFounder) {
      return 'Track your funding requests';
    } else if (isInvestor) {
      return 'Discover investment opportunities';
    }
    return 'Funding Portal';
  };

  // Empty state component
  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyTitle}>
        {isFounder ? 'No funding requests yet' : isInvestor ? 'No opportunities found' : 'No data available'}
      </Text>
      <Text style={styles.emptyText}>
        {isFounder
          ? 'Create a funding request to start raising capital'
          : isInvestor
          ? 'Try adjusting your filters or search criteria'
          : 'Please log in to view funding opportunities'}
      </Text>
      {isFounder && (
        <TouchableOpacity
          style={styles.createRequestButtonEmpty}
          onPress={() => setCreateRequestModalVisible(true)}
          activeOpacity={0.7}>
          <Plus size={20} color={COLORS.background} strokeWidth={2.5} />
          <Text style={styles.createRequestButtonText}>Create Your First Request</Text>
        </TouchableOpacity>
      )}
      {activeFilterCount > 0 && (
        <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
          <Text style={styles.resetButtonText}>Reset Filters</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  // Header component to be used in ListHeaderComponent
  const renderHeader = () => (
    <View style={styles.headerContent}>
      <LinearGradient colors={GRADIENTS.primary} style={styles.heroCard}>
        <View style={styles.heroHeader}>
          <View style={styles.heroText}>
            <Text style={styles.heroTitle}>Funding Portal</Text>
            <Text style={styles.heroSubtitle}>{getSubtitle()}</Text>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={refresh}>
            <RefreshCw size={18} color={COLORS.background} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue} numberOfLines={1}>{allOpportunities.length}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>
              {isFounder ? 'Requests' : 'Total Deals'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue} numberOfLines={1}>{activeDeals}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Active</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue} numberOfLines={1}>{formatCurrency(totalRaised)}</Text>
            <Text style={styles.statLabel} numberOfLines={1}>Total Raised</Text>
          </View>
        </View>
      </LinearGradient>

      {isFounder && (
        <TouchableOpacity
          style={styles.createRequestButton}
          onPress={() => {
            if (!user?.id) {
              console.warn('User not authenticated, cannot create funding request');
              return;
            }
            console.log('Create Funding Request button clicked');
            setCreateRequestModalVisible(true);
          }}
          activeOpacity={0.7}>
          <Plus size={20} color={COLORS.background} strokeWidth={2.5} />
          <Text style={styles.createRequestButtonText}>Create Funding Request</Text>
        </TouchableOpacity>
      )}

      <View style={styles.controls}>
        <SearchInput
          value={searchInput}
          onChangeText={setSearchInput}
          onSubmit={handleSearchSubmit}
          onKeyPress={handleSearchKeyPress}
          placeholder={isFounder ? "Search your requests..." : "Search companies, industries..."}
          showSearchButton={searchInput.length > 0 && searchInput !== appliedSearch}
          onSearchPress={handleSearchSubmit}
        />

        <View style={styles.actionButtons}>
          {!isFounder && (
            <TouchableOpacity
              style={styles.filterButton}
              onPress={() => setFilterModalVisible(true)}
              activeOpacity={0.7}>
              <Filter size={18} color={COLORS.primary} strokeWidth={2} />
              {activeFilterCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          {!isFounder && (
            <View style={styles.viewToggle}>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
                onPress={() => setViewMode('grid')}
                activeOpacity={0.7}>
                <Grid3x3
                  size={18}
                  color={viewMode === 'grid' ? COLORS.background : COLORS.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.viewButton, viewMode === 'table' && styles.viewButtonActive]}
                onPress={() => setViewMode('table')}
                activeOpacity={0.7}>
                <List
                  size={18}
                  color={viewMode === 'table' ? COLORS.background : COLORS.textSecondary}
                  strokeWidth={2}
                />
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>

      {activeFilterCount > 0 && (
        <View style={styles.activeFilters}>
          <Text style={styles.activeFiltersText}>
            {activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''} applied
          </Text>
          <TouchableOpacity onPress={resetFilters}>
            <Text style={styles.clearFiltersText}>Clear All</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading opportunities...</Text>
        </View>
      ) : opportunities.length === 0 ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {renderHeader()}
          {renderEmptyState()}
        </ScrollView>
      ) : viewMode === 'grid' || isFounder ? (
        <FlatList
          data={opportunities}
          renderItem={({ item }) => (
            <OpportunityCard
              opportunity={item}
              onPress={() => setSelectedOpportunity(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {renderHeader()}
          <View style={styles.tableContainer}>
            <OpportunityTable
              opportunities={opportunities}
              onPress={(opportunity) => setSelectedOpportunity(opportunity)}
            />
          </View>
        </ScrollView>
      )}

      <FilterModal
        visible={filterModalVisible}
        filters={filters}
        onApply={updateFilters}
        onReset={resetFilters}
        onClose={() => setFilterModalVisible(false)}
      />

      <OpportunityDetailsModal
        visible={selectedOpportunity !== null && !showExpressInterestModal}
        opportunity={selectedOpportunity}
        onClose={() => setSelectedOpportunity(null)}
        onRefresh={async () => {
          // Refresh opportunities to get updated data
          await refresh();
          // Update the selected opportunity with fresh data after refresh completes
          if (selectedOpportunity) {
            // Find the updated opportunity from the refreshed list
            const updated = allOpportunities.find(o => o.id === selectedOpportunity.id) ||
                           opportunities.find(o => o.id === selectedOpportunity.id);
            if (updated) {
              setSelectedOpportunity(updated);
            }
          }
        }}
        onEdit={(opportunity) => {
          // Store the opportunity ID for editing
          setEditingRequestId(opportunity.id);
          // Close the details modal
          setSelectedOpportunity(null);
          // Open the create/edit modal with the opportunity ID
          setTimeout(() => {
            setCreateRequestModalVisible(true);
          }, 300);
        }}
        onExpressInterest={(opportunity) => {
          console.log('[Funding] Opening Express Interest modal for:', opportunity.id);
          console.log('[Funding] Current state before change:', {
            selectedOpportunity: selectedOpportunity?.id,
            showExpressInterestModal,
            expressInterestOpportunity: expressInterestOpportunity?.id,
          });
          
          // Set the opportunity first to preserve it
          setExpressInterestOpportunity(opportunity);
          
          // Close the details modal first, then open express interest modal
          setSelectedOpportunity(null);
          
          // Use setTimeout to ensure the first modal closes before opening the second
          setTimeout(() => {
            console.log('[Funding] Opening Express Interest modal after delay');
            setShowExpressInterestModal(true);
            console.log('[Funding] State after opening:', {
              showExpressInterestModal: true,
              expressInterestOpportunity: opportunity.id,
            });
          }, 300);
        }}
      />

      <ExpressInterestModal
        visible={showExpressInterestModal}
        opportunity={expressInterestOpportunity}
        onClose={() => {
          console.log('[Funding] Closing Express Interest modal');
          setShowExpressInterestModal(false);
          setExpressInterestOpportunity(null);
        }}
        onSuccess={() => {
          console.log('[Funding] Express Interest submitted successfully');
          setShowExpressInterestModal(false);
          setExpressInterestOpportunity(null);
          // Refresh opportunities to show updated data
          refresh();
        }}
      />

      <CreateFundingRequestModal
        visible={createRequestModalVisible}
        onClose={() => {
          setCreateRequestModalVisible(false);
          setEditingRequestId(null);
          // Clear params
          router.setParams({ requestId: undefined, openCreateModal: undefined, editRequestId: undefined });
        }}
        onSuccess={async () => {
          const wasEditing = !!editingRequestId;
          const requestIdToReopen = editingRequestId;
          
          // Close the edit modal first
          setCreateRequestModalVisible(false);
          setEditingRequestId(null);
          
          // Refresh opportunities to get updated data
          refresh();
          
          // If we were editing, set pending reopen ID to trigger useEffect
          if (wasEditing && requestIdToReopen) {
            setPendingReopenId(requestIdToReopen);
          }
          
          // Clear params
          router.setParams({ requestId: undefined, openCreateModal: undefined, editRequestId: undefined });
        }}
        editingRequestId={
          editingRequestId || 
          (params.requestId && params.requestId !== 'new' ? params.requestId as string : null) ||
          (params.editRequestId ? params.editRequestId as string : null)
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  headerContent: {
    padding: SPACING.lg,
    gap: SPACING.lg,
    backgroundColor: COLORS.background,
    ...(Platform.OS === 'web' && {
      maxWidth: 1200,
      alignSelf: 'center',
      width: '100%',
    }),
  },
  emptyListContent: {
    flexGrow: 1,
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
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
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
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsRow: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  statCard: {
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'flex-start',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    width: '100%',
  },
  statValue: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZES.xl,
    color: COLORS.background,
    textAlign: 'left',
    marginBottom: SPACING.xs / 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    fontSize: FONT_SIZES.sm,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'left',
  },
  controls: {
    gap: SPACING.md,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 52,
    gap: SPACING.sm,
    ...(Platform.OS === 'web' && {
      maxWidth: 600,
      alignSelf: 'center',
      width: '100%',
    }),
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '60',
    ...SHADOWS.sm,
  },
  searchInput: {
    flex: 1,
    fontFamily: FONT_FAMILY.body,
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    paddingVertical: 0,
    margin: 0,
    ...(Platform.OS === 'web' && {
      outlineStyle: 'none',
    }),
  },
  searchButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  searchButtonText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  filterButton: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  filterBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    minWidth: 20,
    height: 20,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  viewToggle: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 2,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  viewButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.sm,
  },
  viewButtonActive: {
    backgroundColor: COLORS.primary,
  },
  activeFilters: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.md,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  activeFiltersText: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.text,
  },
  clearFiltersText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  resetButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  resetButtonText: {
    fontFamily: FONT_FAMILY.bodyBold,
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
  },
  gridContent: {
    padding: SPACING.lg,
    paddingTop: 0,
    flexGrow: 1,
  },
  tableWrapper: {
    flex: 1,
  },
  tableContainer: {
    flex: 1,
    padding: SPACING.lg,
    paddingTop: 0,
  },
  createRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
  },
  createRequestButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
    fontSize: FONT_SIZES.md,
  },
  createRequestButtonEmpty: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    ...SHADOWS.sm,
    marginTop: SPACING.md,
  },
});
