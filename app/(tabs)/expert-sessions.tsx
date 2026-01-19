import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ActivityIndicator,
  Linking,
  Platform,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button } from '@/components/Button';
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
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Star,
  UserRound,
  MessageSquare,
  TrendingUp,
  Video,
  X,
  Search,
  SlidersHorizontal,
} from 'lucide-react-native';
import { useMentorshipRequests } from '@/hooks/useMentorshipRequests';
import { useGoogleAuth } from '@/hooks/useGoogleAuth';
import { Picker } from '@/components/Picker';

export default function ExpertSessionsScreen() {
  const params = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState<'requests' | 'upcoming' | 'past'>('requests');
  const [refreshing, setRefreshing] = useState(false);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  const {
    requests,
    loading,
    error,
    fetchRequests,
    acceptRequest,
    rejectRequest,
    pendingRequests,
    upcomingSessions,
    pastSessions,
  } = useMentorshipRequests();

  const { tokenStatus, checkGoogleConnection, connectGoogle } = useGoogleAuth();

  // Set active tab from query parameter
  useEffect(() => {
    if (params.tab && ['requests', 'upcoming', 'past'].includes(params.tab)) {
      setActiveTab(params.tab as 'requests' | 'upcoming' | 'past');
    }
  }, [params.tab]);

  useFocusEffect(
    React.useCallback(() => {
      fetchRequests(true);
      checkGoogleConnection();
    }, [fetchRequests, checkGoogleConnection])
  );

  // Debug: Log when requests change
  useEffect(() => {
    console.log('📊 Expert Sessions - Requests state changed:', {
      totalRequests: requests.length,
      pendingCount: pendingRequests.length,
      loading,
      error,
    });
  }, [requests, pendingRequests, loading, error]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAccept = async (requestId: string) => {
    console.log('🔴 HANDLE ACCEPT CALLED - Button clicked!');
    console.log('Request ID:', requestId);
    
    // Find the request details
    const request = pendingRequests.find(r => r.id === requestId);
    if (!request) {
      if (Platform.OS === 'web') {
        window.alert('Error: Request not found');
      } else {
        Alert.alert('Error', 'Request not found');
      }
      return;
    }
    
    console.log('Request details:', request);
    console.log('Founder email:', request.founder?.email);
    console.log('Requested time:', request.requested_start_time);
    console.log('Topic:', request.topic);
    console.log('Duration:', request.duration_minutes);
    
    // Redirect to schedule-meeting page with prefilled data
    router.push({
      pathname: '/(tabs)/schedule-meeting',
      params: {
        requestId: request.id,
        email: request.founder?.email || '',
        founderName: request.founder?.full_name || '',
        scheduledAt: request.requested_start_time,
        duration: request.duration_minutes?.toString() || '60',
        title: `Mentorship: ${request.topic}`,
        description: request.message || '',
      },
    });
  };

  const handleDecline = async (requestId: string) => {
    console.log('🔴 HANDLE DECLINE CALLED - Button clicked!');
    console.log('Request ID:', requestId);
    
    // Show confirmation dialog
    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Reject this session request?\n\n' +
        'The time slot will become available again for other founders to book.'
      );
      
      if (!confirmed) {
        console.log('❌ User cancelled reject');
        return;
      }
    } else {
      Alert.alert(
        'Reject Request',
        'Are you sure you want to reject this session request? The slot will become available again.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Reject', style: 'destructive', onPress: () => performReject(requestId) },
        ]
      );
      return;
    }
    
    // For web, continue directly
    await performReject(requestId);
  };

  const performReject = async (requestId: string) => {
    try {
      console.log('=== REJECT REQUEST STARTED ===');
      console.log('Request ID:', requestId);
      
      // Set loading state
      setRejectingId(requestId);
      
      await rejectRequest({
        request_id: requestId,
        response_message: 'Request declined by expert',
      });
      
      console.log('=== REJECT REQUEST SUCCESSFUL ===');
      
      // Show success message
      if (Platform.OS === 'web') {
        window.alert('✅ Request rejected. The slot is now available again.');
      } else {
        Alert.alert(
          'Request Rejected',
          'The slot is now available again.',
          [{ 
            text: 'OK',
            onPress: () => fetchRequests()
          }]
        );
      }
      
      // Force refresh
      await fetchRequests();
      
    } catch (err: any) {
      console.error('=== REJECT REQUEST ERROR ===');
      console.error('Error details:', err);
      
      // Show error message
      if (Platform.OS === 'web') {
        window.alert('❌ Error: ' + (err.message || 'Failed to reject request. Please try again.'));
      } else {
        Alert.alert(
          'Error',
          err.message || 'Failed to reject request. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setRejectingId(null);
    }
  };

  const handleJoinMeeting = (meetLink: string) => {
    Linking.openURL(meetLink).catch(() => {
      Alert.alert('Error', 'Could not open meeting link');
    });
  };

  const handleReview = (sessionId: string) => {
    // TODO: Implement review functionality
    Alert.alert('Review', 'Review functionality coming soon');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }>
        <LinearGradient colors={['#6666FF', '#4B4FDB']} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Session Management</Text>
              <Text style={styles.heroSubtitle}>
                Manage mentorship requests and sessions
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search by founder name or topic"
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={COLORS.textSecondary} />
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

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              {(searchQuery || statusFilter) && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setStatusFilter('');
                  }}
                  style={styles.clearAllButton}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filtersContent}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Status</Text>
                <Picker
                  value={statusFilter}
                  onValueChange={setStatusFilter}
                  items={[
                    { label: 'All Status', value: '' },
                    { label: 'Pending', value: 'pending' },
                    { label: 'Accepted', value: 'accepted' },
                    { label: 'Completed', value: 'completed' },
                  ]}
                  placeholder="Select status"
                />
              </View>
            </View>
          </View>
        )}

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'requests' && styles.tabActive]}
            onPress={() => setActiveTab('requests')}
            activeOpacity={0.7}>
            <Clock size={18} color={activeTab === 'requests' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'requests' && styles.tabTextActive,
              ]}>
              Requests
            </Text>
            {pendingRequests.length > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{pendingRequests.length}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.7}>
            <Calendar size={18} color={activeTab === 'upcoming' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'upcoming' && styles.tabTextActive,
              ]}>
              Upcoming
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'past' && styles.tabActive]}
            onPress={() => setActiveTab('past')}
            activeOpacity={0.7}>
            <TrendingUp size={18} color={activeTab === 'past' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'past' && styles.tabTextActive,
              ]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'requests' && (
          <View style={styles.section}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>Pending Requests</Text>
              {__DEV__ && (
                <Text style={{ fontSize: 10, color: COLORS.textSecondary }}>
                  Loading: {loading ? 'Yes' : 'No'} | Count: {pendingRequests.length}
                </Text>
              )}
            </View>
            {loading && !refreshing && requests.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading requests...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <XCircle size={48} color={COLORS.error} strokeWidth={1.5} />
                <Text style={styles.errorTitle}>Failed to Load</Text>
                <Text style={styles.errorText}>{error}</Text>
                <TouchableOpacity onPress={() => fetchRequests(true)} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : pendingRequests.length > 0 ? (
              <View style={styles.requestsList}>
                {pendingRequests
                  .filter((request) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch =
                        request.founder?.full_name?.toLowerCase().includes(query) ||
                        request.founder?.email?.toLowerCase().includes(query) ||
                        request.topic?.toLowerCase().includes(query) ||
                        request.message?.toLowerCase().includes(query);
                      if (!matchesSearch) return false;
                    }
                    if (statusFilter && request.status !== statusFilter) {
                      return false;
                    }
                    return true;
                  })
                  .map((request) => (
                  <View key={request.id} style={styles.requestCard}>
                    <View style={styles.requestHeader}>
                      <View style={styles.requestIcon}>
                        <UserRound size={20} color={COLORS.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.requestInfo}>
                        <Text style={styles.requestFounder}>
                          {request.founder?.full_name || 'Founder'}
                        </Text>
                        <Text style={styles.requestCompany}>
                          {request.founder?.email || 'No email'}
                        </Text>
                        <Text style={styles.requestTopic}>{request.topic}</Text>
                        {request.message && (
                          <Text style={styles.requestMessage} numberOfLines={2}>
                            {request.message}
                          </Text>
                        )}
                      </View>
                    </View>
                    <View style={styles.requestDetails}>
                      <View style={styles.requestDetailItem}>
                        <Clock size={14} color={COLORS.textSecondary} strokeWidth={2} />
                        <Text style={styles.requestDetailText}>
                          {request.duration_minutes} min
                        </Text>
                      </View>
                      <Text style={styles.requestDate}>
                        {new Date(request.requested_start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                    </View>
                    <View style={styles.requestActions}>
                      <Button
                        title={rejectingId === request.id ? "Rejecting..." : "Decline"}
                        onPress={() => handleDecline(request.id)}
                        variant="outline"
                        style={styles.declineButton}
                        disabled={rejectingId === request.id || acceptingId === request.id}
                      />
                      <Button
                        title={acceptingId === request.id ? "Accepting..." : "Accept"}
                        onPress={() => handleAccept(request.id)}
                        variant="primary"
                        style={styles.acceptButton}
                        loading={acceptingId === request.id}
                        disabled={rejectingId === request.id || acceptingId === request.id}
                      />
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Clock size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>No pending requests</Text>
                <Text style={styles.emptyStateText}>
                  New mentorship requests will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'upcoming' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading sessions...</Text>
              </View>
            ) : upcomingSessions.length > 0 ? (
              <View style={styles.sessionsList}>
                {upcomingSessions
                  .filter((session) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch =
                        session.founder?.full_name?.toLowerCase().includes(query) ||
                        session.founder?.email?.toLowerCase().includes(query) ||
                        session.topic?.toLowerCase().includes(query);
                      if (!matchesSearch) return false;
                    }
                    if (statusFilter && session.status !== statusFilter) {
                      return false;
                    }
                    return true;
                  })
                  .map((session) => (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionIcon}>
                        <Calendar size={20} color={COLORS.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionFounder}>
                          {session.founder?.full_name || 'Founder'}
                        </Text>
                        <Text style={styles.sessionCompany}>
                          {session.founder?.email || 'No email'}
                        </Text>
                        <Text style={styles.sessionTopic}>{session.topic}</Text>
                      </View>
                      <View style={styles.confirmedBadge}>
                        <CheckCircle size={14} color={COLORS.success} strokeWidth={2} />
                        <Text style={styles.confirmedText}>Confirmed</Text>
                      </View>
                    </View>
                    <View style={styles.sessionDetails}>
                      <Text style={styles.sessionDateTime}>
                        {new Date(session.requested_start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.sessionDuration}>
                        {session.duration_minutes} min
                      </Text>
                    </View>
                    {session.google_meet_link && (
                      <TouchableOpacity
                        style={styles.joinButton}
                        onPress={() => handleJoinMeeting(session.google_meet_link!)}
                        activeOpacity={0.7}>
                        <Video size={16} color={COLORS.background} strokeWidth={2} />
                        <Text style={styles.joinButtonText}>Join Meeting</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Calendar size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>No upcoming sessions</Text>
                <Text style={styles.emptyStateText}>
                  Accepted sessions will appear here
                </Text>
              </View>
            )}
          </View>
        )}

        {activeTab === 'past' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Sessions</Text>
            {loading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading sessions...</Text>
              </View>
            ) : pastSessions.length > 0 ? (
              <View style={styles.sessionsList}>
                {pastSessions
                  .filter((session) => {
                    if (searchQuery) {
                      const query = searchQuery.toLowerCase();
                      const matchesSearch =
                        session.founder?.full_name?.toLowerCase().includes(query) ||
                        session.founder?.email?.toLowerCase().includes(query) ||
                        session.topic?.toLowerCase().includes(query);
                      if (!matchesSearch) return false;
                    }
                    if (statusFilter && session.status !== statusFilter) {
                      return false;
                    }
                    return true;
                  })
                  .map((session) => (
                  <View key={session.id} style={styles.sessionCard}>
                    <View style={styles.sessionHeader}>
                      <View style={styles.sessionIcon}>
                        <UserRound size={20} color={COLORS.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.sessionInfo}>
                        <Text style={styles.sessionFounder}>
                          {session.founder?.full_name || 'Founder'}
                        </Text>
                        <Text style={styles.sessionCompany}>
                          {session.founder?.email || 'No email'}
                        </Text>
                        <Text style={styles.sessionTopic}>{session.topic}</Text>
                      </View>
                      <Text style={styles.sessionDate}>
                        {new Date(session.requested_start_time).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </Text>
                    </View>
                    {session.founder_rating && (
                      <View style={styles.sessionRating}>
                        <Text style={styles.ratingLabel}>Rating received:</Text>
                        <View style={styles.ratingStars}>
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              size={16}
                              color={star <= session.founder_rating! ? COLORS.warning : COLORS.border}
                              fill={star <= session.founder_rating! ? COLORS.warning : 'none'}
                              strokeWidth={2}
                            />
                          ))}
                        </View>
                        {session.founder_review && (
                          <Text style={styles.sessionReview}>{session.founder_review}</Text>
                        )}
                      </View>
                    )}
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.emptyState}>
                <TrendingUp size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyStateTitle}>No past sessions</Text>
                <Text style={styles.emptyStateText}>
                  Completed sessions will appear here
                </Text>
              </View>
            )}
          </View>
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
    backgroundColor: 'rgba(255,255,255,0.12)',
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
  tabs: {
    flexDirection: 'row',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: 4,
    gap: SPACING.xs,
    ...SHADOWS.xs,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    position: 'relative',
  },
  tabActive: {
    backgroundColor: COLORS.primaryLight,
  },
  tabText: {
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.bodyMedium,
    color: COLORS.textSecondary,
  },
  tabTextActive: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: 'bold',
    color: COLORS.background,
  },
  section: {
    gap: SPACING.md,
  },
  sectionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  errorTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  requestsList: {
    gap: SPACING.md,
  },
  requestCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  requestIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
  },
  requestFounder: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  requestCompany: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  requestTopic: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  requestDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  requestDetailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  requestDetailText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  requestDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  acceptButton: {
    flex: 1,
  },
  declineButton: {
    flex: 1,
  },
  sessionsList: {
    gap: SPACING.md,
  },
  sessionCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  sessionIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionFounder: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  sessionCompany: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  sessionTopic: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  confirmedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + '20',
  },
  confirmedText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  sessionDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  sessionDateTime: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  sessionDuration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  messageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  messageButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  scheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  scheduleButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  sessionDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sessionRating: {
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  ratingLabel: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  ratingStars: {
    flexDirection: 'row',
    gap: 2,
  },
  sessionReview: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 20,
  },
  reviewButton: {
    marginTop: SPACING.sm,
  },
  emptyState: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyStateTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  requestMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    lineHeight: 18,
  },
  loadingContainer: {
    padding: SPACING.xl * 2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.error + '10',
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error + '30',
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    ...(Platform.OS === 'web' && {
      maxWidth: 300,
      alignSelf: 'center',
      width: 'auto',
    }),
  },
  joinButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
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
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
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
});

