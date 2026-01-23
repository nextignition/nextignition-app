import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';
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
  Award,
  Users,
  MessageSquare,
  Calendar,
  Star,
  Send,
  CheckCircle,
  Clock,
  TrendingUp,
  X,
  Video,
  AlertCircle,
} from 'lucide-react-native';
import { useExperts } from '@/hooks/useExperts';
import { useMentorshipRequests, MentorshipRequest } from '@/hooks/useMentorshipRequests';
import { getOrCreateDirectConversation } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

export default function MentorshipScreen() {
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'experts' | 'sessions' | 'reviews'>('experts');
  const [userRole, setUserRole] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [chatLoading, setChatLoading] = useState<Record<string, boolean>>({});

  const { experts, loading: expertsLoading, error: expertsError, refresh: refreshExperts } = useExperts();
  const {
    requests,
    loading: requestsLoading,
    error: requestsError,
    fetchRequests,
    acceptRequest,
    rejectRequest,
    cancelRequest,
    pendingRequests,
    upcomingSessions,
    pastSessions,
  } = useMentorshipRequests();

  // Handle tab parameter from navigation
  useEffect(() => {
    if (params.tab) {
      const tab = params.tab as string;
      if (tab === 'experts' || tab === 'sessions' || tab === 'reviews') {
        setActiveTab(tab);
      }
    }
  }, [params.tab]);

  // Refresh data when reviews tab is focused
  useFocusEffect(
    React.useCallback(() => {
      if (activeTab === 'reviews') {
        console.log('🔄 Reviews tab focused, refreshing data...');
        fetchRequests();
      }
    }, [activeTab, fetchRequests])
  );

  // Debug: Log reviews data
  useEffect(() => {
    if (activeTab === 'reviews') {
      console.log('📊 Reviews Tab Debug:', {
        userRole,
        totalPastSessions: pastSessions.length,
        sessionsWithReviews: pastSessions.filter(s => 
          userRole === 'expert' 
            ? s.founder_rating && s.founder_review 
            : s.founder_rating && s.founder_review
        ).length,
        pastSessionsDetails: pastSessions.map(s => ({
          id: s.id,
          status: s.status,
          founder_rating: s.founder_rating,
          founder_review: s.founder_review ? 'has review' : 'no review',
          expert_rating: s.expert_rating,
          expert_review: s.expert_review ? 'has review' : 'no review',
        })),
      });
    }
  }, [activeTab, pastSessions, userRole]);

  // Get user role
  useEffect(() => {
    const fetchUserRole = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setUserRole(profile?.role || null);
      }
    };
    fetchUserRole();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshExperts(), fetchRequests()]);
    setTimeout(() => setRefreshing(false), 500);
  };

  const handleAcceptRequest = async (requestId: string) => {
    Alert.alert(
      'Accept Request',
      'This will create a Google Meet link and confirm the session. Make sure you have Google Calendar connected.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              await acceptRequest({ request_id: requestId });
              Alert.alert('Success', 'Session confirmed! Meeting link has been created.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to accept request');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = async (requestId: string) => {
    Alert.alert(
      'Reject Request',
      'Are you sure you want to reject this session request? The slot will become available again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await rejectRequest({
                request_id: requestId,
                response_message: 'Request declined by expert',
              });
              Alert.alert('Request Rejected', 'The slot is now available again.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to reject request');
            }
          },
        },
      ]
    );
  };

  const handleCancelRequest = async (requestId: string) => {
    Alert.alert(
      'Cancel Request',
      'Are you sure you want to cancel this request?',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              await cancelRequest(requestId);
              Alert.alert('Cancelled', 'Your request has been cancelled.');
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to cancel request');
            }
          },
        },
      ]
    );
  };

  const handleJoinMeeting = (meetLink: string) => {
    Linking.openURL(meetLink).catch(() => {
      Alert.alert('Error', 'Could not open meeting link');
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }>
        <LinearGradient colors={GRADIENTS.navy} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Mentorship & Networking</Text>
              <Text style={styles.heroSubtitle}>
                Connect with experts and grow your startup
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'experts' && styles.tabActive]}
            onPress={() => setActiveTab('experts')}
            activeOpacity={0.7}>
            <Users size={18} color={activeTab === 'experts' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'experts' && styles.tabTextActive,
              ]}>
              Experts
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'sessions' && styles.tabActive]}
            onPress={() => setActiveTab('sessions')}
            activeOpacity={0.7}>
            <Calendar size={18} color={activeTab === 'sessions' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'sessions' && styles.tabTextActive,
              ]}>
              Sessions
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'reviews' && styles.tabActive]}
            onPress={() => setActiveTab('reviews')}
            activeOpacity={0.7}>
            <Star size={18} color={activeTab === 'reviews' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'reviews' && styles.tabTextActive,
              ]}>
              Reviews
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'experts' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Available Experts</Text>
            {expertsLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading experts...</Text>
              </View>
            ) : expertsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{expertsError}</Text>
                <TouchableOpacity onPress={refreshExperts} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : experts.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Award size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No experts available</Text>
                <Text style={styles.emptySubtitle}>
                  Check back later for available mentors
                </Text>
              </View>
            ) : (
              <View style={styles.expertsList}>
                {experts.map((expert) => (
                  <View key={expert.id} style={styles.expertCard}>
                    <View style={styles.expertHeader}>
                      <View style={styles.expertIcon}>
                        <Award size={24} color={COLORS.primary} strokeWidth={2} />
                      </View>
                      <View style={styles.expertInfo}>
                        <View style={styles.expertNameRow}>
                          <Text style={styles.expertName}>{expert.name}</Text>
                          {expert.available && (
                            <View style={styles.availableBadge}>
                              <View style={styles.availableDot} />
                              <Text style={styles.availableText}>Available</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.expertExpertise}>{expert.expertise}</Text>
                        <View style={styles.expertMeta}>
                          {expert.rating > 0 && (
                            <View style={styles.expertRating}>
                              <Star size={14} color={COLORS.warning} fill={COLORS.warning} strokeWidth={2} />
                              <Text style={styles.expertRatingText}>{expert.rating.toFixed(1)}</Text>
                            </View>
                          )}
                          <Text style={styles.expertMetaText}>{expert.experience}</Text>
                          <Text style={styles.expertMetaText}>{expert.sessions} session{expert.sessions !== 1 ? 's' : ''}</Text>
                          <Text style={styles.expertMetaText}>{expert.hourlyRate}/hr</Text>
                        </View>
                      </View>
                    </View>
                    <View style={styles.expertActions}>
                      <TouchableOpacity
                        style={[styles.messageButton, chatLoading[expert.id] && styles.messageButtonLoading]}
                        onPress={async () => {
                          if (!user?.id) {
                            Alert.alert('Error', 'You must be logged in to start a chat');
                            return;
                          }

                          setChatLoading(prev => ({ ...prev, [expert.id]: true }));
                          
                          try {
                            console.log('Creating/getting conversation with expert:', expert.id);
                            const { conversationId, error } = await getOrCreateDirectConversation(
                              user.id,
                              expert.id,
                              expert.name
                            );

                            if (error || !conversationId) {
                              Alert.alert('Error', error || 'Failed to start conversation');
                              setChatLoading(prev => ({ ...prev, [expert.id]: false }));
                              return;
                            }

                            console.log('Navigating to chat with conversationId:', conversationId);
                            router.push(`/(tabs)/chat?conversationId=${conversationId}&userName=${encodeURIComponent(expert.name)}`);
                            
                            setTimeout(() => {
                              setChatLoading(prev => ({ ...prev, [expert.id]: false }));
                            }, 500);
                          } catch (err: any) {
                            console.error('Chat error:', err);
                            Alert.alert('Error', err.message || 'Failed to start chat');
                            setChatLoading(prev => ({ ...prev, [expert.id]: false }));
                          }
                        }}
                        disabled={chatLoading[expert.id]}
                        activeOpacity={0.7}>
                        {chatLoading[expert.id] ? (
                          <ActivityIndicator size="small" color={COLORS.primary} />
                        ) : (
                          <MessageSquare size={18} color={COLORS.primary} strokeWidth={2} />
                        )}
                        <Text style={styles.messageButtonText}>
                          {chatLoading[expert.id] ? 'Opening...' : 'Message'}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.requestButton}
                        onPress={() => router.push(`/(tabs)/request-mentorship?expertId=${expert.id}`)}
                        activeOpacity={0.7}>
                        <Send size={18} color={COLORS.background} strokeWidth={2} />
                        <Text style={styles.requestButtonText}>Request Session</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {activeTab === 'sessions' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                {userRole === 'expert' ? 'Session Requests' : 'My Sessions'}
              </Text>
              {userRole !== 'expert' && (
                <TouchableOpacity onPress={() => router.push('/(tabs)/request-mentorship')}>
                  <Text style={styles.newButtonText}>New Request</Text>
                </TouchableOpacity>
              )}
            </View>

            {requestsLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading sessions...</Text>
              </View>
            ) : requestsError ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{requestsError}</Text>
                <TouchableOpacity onPress={fetchRequests} style={styles.retryButton}>
                  <Text style={styles.retryButtonText}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.sessionsList}>
                {/* Pending Requests */}
                {pendingRequests.length > 0 && (
                  <View style={styles.sessionGroup}>
                    <Text style={styles.sessionGroupTitle}>
                      {userRole === 'expert' ? 'Pending Requests' : 'Awaiting Response'}
                    </Text>
                    {pendingRequests.map((request) => (
                      <View key={request.id} style={styles.sessionCard}>
                        <View style={styles.sessionHeader}>
                          <View style={styles.sessionIcon}>
                            <Clock size={20} color={COLORS.warning} strokeWidth={2} />
                          </View>
                          <View style={styles.sessionInfo}>
                            <Text style={styles.sessionExpert}>
                              {userRole === 'expert' ? request.founder?.full_name : request.expert?.full_name}
                            </Text>
                            <Text style={styles.sessionTopic}>{request.topic}</Text>
                            {request.message && (
                              <Text style={styles.sessionMessage} numberOfLines={2}>
                                {request.message}
                              </Text>
                            )}
                          </View>
                          <View style={styles.pendingBadge}>
                            <Clock size={14} color={COLORS.warning} strokeWidth={2} />
                            <Text style={styles.pendingText}>Pending</Text>
                          </View>
                        </View>
                        <View style={styles.sessionDetails}>
                          <Text style={styles.sessionDateTime}>
                            {new Date(request.requested_start_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                          <Text style={styles.sessionDuration}>
                            {request.duration_minutes} min
                          </Text>
                        </View>
                        {userRole === 'expert' ? (
                          <View style={styles.sessionActions}>
                            <TouchableOpacity
                              style={styles.rejectButton}
                              onPress={() => handleRejectRequest(request.id)}
                              activeOpacity={0.7}>
                              <X size={16} color={COLORS.error} strokeWidth={2} />
                              <Text style={styles.rejectButtonText}>Reject</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.acceptButton}
                              onPress={() => handleAcceptRequest(request.id)}
                              activeOpacity={0.7}>
                              <CheckCircle size={16} color={COLORS.background} strokeWidth={2} />
                              <Text style={styles.acceptButtonText}>Accept</Text>
                            </TouchableOpacity>
                          </View>
                        ) : (
                          <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancelRequest(request.id)}
                            activeOpacity={0.7}>
                            <Text style={styles.cancelButtonText}>Cancel Request</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Upcoming Sessions */}
                {upcomingSessions.length > 0 && (
                  <View style={styles.sessionGroup}>
                    <Text style={styles.sessionGroupTitle}>Upcoming Sessions</Text>
                    {upcomingSessions.map((request) => (
                      <View key={request.id} style={styles.sessionCard}>
                        <View style={styles.sessionHeader}>
                          <View style={styles.sessionIcon}>
                            <Calendar size={20} color={COLORS.primary} strokeWidth={2} />
                          </View>
                          <View style={styles.sessionInfo}>
                            <Text style={styles.sessionExpert}>
                              {userRole === 'expert' ? request.founder?.full_name : request.expert?.full_name}
                            </Text>
                            <Text style={styles.sessionTopic}>{request.topic}</Text>
                          </View>
                          <View style={styles.upcomingBadge}>
                            <Calendar size={14} color={COLORS.success} strokeWidth={2} />
                            <Text style={styles.upcomingText}>Confirmed</Text>
                          </View>
                        </View>
                        <View style={styles.sessionDetails}>
                          <Text style={styles.sessionDateTime}>
                            {new Date(request.requested_start_time).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                            })}
                          </Text>
                          <Text style={styles.sessionDuration}>
                            {request.duration_minutes} min
                          </Text>
                        </View>
                        {request.google_meet_link && (
                          <TouchableOpacity
                            style={styles.joinButton}
                            onPress={() => handleJoinMeeting(request.google_meet_link!)}
                            activeOpacity={0.7}>
                            <Video size={16} color={COLORS.background} strokeWidth={2} />
                            <Text style={styles.joinButtonText}>Join Meeting</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                )}

                {/* Past Sessions */}
                {pastSessions.length > 0 && (
                  <View style={styles.sessionGroup}>
                    <Text style={styles.sessionGroupTitle}>Past Sessions</Text>
                    {pastSessions.map((request) => {
                      const needsReview =
                        userRole !== 'expert' && !request.founder_rating && !request.founder_review;
                      
                      return (
                        <View key={request.id} style={styles.sessionCard}>
                          <View style={styles.sessionHeader}>
                            <View style={styles.sessionIcon}>
                              <CheckCircle size={20} color={COLORS.textSecondary} strokeWidth={2} />
                            </View>
                            <View style={styles.sessionInfo}>
                              <Text style={styles.sessionExpert}>
                                {userRole === 'expert' ? request.founder?.full_name : request.expert?.full_name}
                              </Text>
                              <Text style={styles.sessionTopic}>{request.topic}</Text>
                            </View>
                            <View style={styles.completedBadge}>
                              <CheckCircle size={14} color={COLORS.success} strokeWidth={2} />
                              <Text style={styles.completedText}>Completed</Text>
                            </View>
                          </View>
                          <View style={styles.sessionDetails}>
                            <Text style={styles.sessionDateTime}>
                              {new Date(request.requested_start_time).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })}
                            </Text>
                            {(request.founder_rating || request.expert_rating) && (
                              <View style={styles.sessionRating}>
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    size={14}
                                    color={
                                      star <= (userRole === 'expert' ? request.founder_rating! : request.expert_rating!)
                                        ? COLORS.warning
                                        : COLORS.border
                                    }
                                    fill={
                                      star <= (userRole === 'expert' ? request.founder_rating! : request.expert_rating!)
                                        ? COLORS.warning
                                        : 'none'
                                    }
                                    strokeWidth={2}
                                  />
                                ))}
                              </View>
                            )}
                          </View>
                          {needsReview && (
                            <TouchableOpacity
                              style={styles.reviewButton}
                              onPress={() => router.push(`/(tabs)/review-session?sessionId=${request.id}`)}
                              activeOpacity={0.7}>
                              <Star size={16} color={COLORS.background} strokeWidth={2} />
                              <Text style={styles.reviewButtonText}>Leave Review</Text>
                            </TouchableOpacity>
                          )}
                        </View>
                      );
                    })}
                  </View>
                )}

                {/* Empty State */}
                {pendingRequests.length === 0 &&
                  upcomingSessions.length === 0 &&
                  pastSessions.length === 0 && (
                    <View style={styles.emptyContainer}>
                      <Calendar size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                      <Text style={styles.emptyTitle}>No sessions yet</Text>
                      <Text style={styles.emptySubtitle}>
                        {userRole === 'expert'
                          ? 'Session requests will appear here'
                          : 'Request a session with an expert to get started'}
                      </Text>
                      {userRole !== 'expert' && (
                        <TouchableOpacity
                          style={styles.requestButton}
                          onPress={() => router.push('/(tabs)/request-mentorship')}
                          activeOpacity={0.7}>
                          <Send size={18} color={COLORS.background} strokeWidth={2} />
                          <Text style={styles.requestButtonText}>Request Session</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
              </View>
            )}
          </View>
        )}

        {activeTab === 'reviews' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {userRole === 'expert' ? 'Reviews Received' : 'My Reviews'}
            </Text>
            
            {requestsLoading && !refreshing ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading reviews...</Text>
              </View>
            ) : (
              <View style={styles.reviewsList}>
                {pastSessions
                  .filter((session) => {
                    // For experts: Show reviews they RECEIVED from founders
                    // For founders: Show reviews they GAVE to experts
                    if (userRole === 'expert') {
                      return session.founder_rating && session.founder_review;
                    } else {
                      // Founders see reviews they gave (founder_rating and founder_review)
                      return session.founder_rating && session.founder_review;
                    }
                  })
                  .map((session) => (
                    <View key={session.id} style={styles.reviewCard}>
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewIcon}>
                          <Award size={20} color={COLORS.primary} strokeWidth={2} />
                        </View>
                        <View style={styles.reviewInfo}>
                          <Text style={styles.reviewFrom}>
                            {userRole === 'expert'
                              ? session.founder?.full_name || 'Founder'
                              : session.expert?.full_name || 'Expert'}
                          </Text>
                          <View style={styles.reviewRating}>
                            {[1, 2, 3, 4, 5].map((star) => {
                              const rating = userRole === 'expert'
                                ? session.founder_rating!
                                : session.founder_rating!;
                              return (
                                <Star
                                  key={star}
                                  size={16}
                                  color={star <= rating ? COLORS.warning : COLORS.border}
                                  fill={star <= rating ? COLORS.warning : 'none'}
                                  strokeWidth={2}
                                />
                              );
                            })}
                          </View>
                        </View>
                        <Text style={styles.reviewDate}>
                          {new Date(session.requested_start_time).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <Text style={styles.reviewTopic}>{session.topic}</Text>
                      <Text style={styles.reviewComment}>
                        {userRole === 'expert'
                          ? session.founder_review
                          : session.founder_review}
                      </Text>
                    </View>
                  ))}

                {pastSessions.filter((s) => {
                  if (userRole === 'expert') {
                    return s.founder_rating && s.founder_review;
                  } else {
                    return s.founder_rating && s.founder_review;
                  }
                }).length === 0 && (
                  <View style={styles.emptyContainer}>
                    <Star size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                    <Text style={styles.emptyTitle}>No reviews yet</Text>
                    <Text style={styles.emptySubtitle}>
                      {userRole === 'expert'
                        ? 'Reviews from founders will appear here after completed sessions'
                        : 'Your reviews for experts will appear here'}
                    </Text>
                  </View>
                )}
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
  newButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
  },
  expertsList: {
    gap: SPACING.md,
  },
  expertCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  expertHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  expertIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expertInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  expertNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  expertName: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  availableBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + '20',
  },
  availableDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success,
  },
  availableText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.success,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  expertExpertise: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  expertMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  expertRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  expertRatingText: {
    ...TYPOGRAPHY.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  expertMetaText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  messageButtonLoading: {
    opacity: 0.6,
  },
  expertActions: {
    flexDirection: 'column',
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  messageButton: {
    width: '100%',
    ...(Platform.OS === 'web' && {
      maxWidth: 200,
      alignSelf: 'center',
      width: 'auto',
    }),
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
  requestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 300,
      alignSelf: 'center',
      width: 'auto',
    }),
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
  },
  requestButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
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
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionExpert: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  sessionTopic: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.warning + '20',
  },
  upcomingText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success + '20',
  },
  completedText: {
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
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  sessionRating: {
    flexDirection: 'row',
    gap: 2,
  },
  sessionGroup: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  sessionGroupTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    fontSize: FONT_SIZES.lg,
    marginBottom: SPACING.xs,
  },
  sessionMessage: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
    lineHeight: 18,
  },
  sessionDuration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  pendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.warning + '20',
  },
  pendingText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: SPACING.sm,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
  },
  acceptButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
  },
  rejectButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.error,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  cancelButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    alignSelf: 'flex-start',
    marginTop: SPACING.sm,
  },
  cancelButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
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
  reviewsList: {
    gap: SPACING.md,
  },
  reviewCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  reviewHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  reviewIcon: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reviewInfo: {
    flex: 1,
  },
  reviewFrom: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  reviewComment: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  reviewTopic: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  reviewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.warning,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  reviewButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
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
  emptyContainer: {
    // Mobile-friendly spacing (old padding was too large and looked misaligned on small screens)
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
    width: '100%',
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 520,
    }),
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

