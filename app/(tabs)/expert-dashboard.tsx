import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
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
  Video,
  TrendingUp,
  Clock,
  CheckCircle,
  BarChart3,
  UserRound,
  Bell,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useMentorshipRequests } from '@/hooks/useMentorshipRequests';

export default function ExpertDashboard() {
  const { profile } = useAuth();
  const [refreshing, setRefreshing] = useState(false);
  const { requests, fetchRequests, pendingRequests, upcomingSessions, pastSessions } = useMentorshipRequests();

  // Calculate real statistics
  const stats = useMemo(() => {
    const reviews = pastSessions.filter(s => s.founder_rating);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, s) => sum + (s.founder_rating || 0), 0) / reviews.length 
      : 0;
    
    const uniqueFounders = new Set(requests.map(r => r.founder_id)).size;

    return {
      activeSessions: upcomingSessions.length,
      totalMentees: uniqueFounders,
      avgRating: avgRating > 0 ? avgRating.toFixed(1) : '-',
    };
  }, [requests, upcomingSessions, pastSessions]);

  // Get latest 2 upcoming sessions, sorted by date
  const latestUpcomingSessions = useMemo(() => {
    return [...upcomingSessions]
      .sort((a, b) => new Date(a.requested_start_time).getTime() - new Date(b.requested_start_time).getTime())
      .slice(0, 2);
  }, [upcomingSessions]);

  // Calculate performance metrics
  const performance = useMemo(() => {
    const totalSessions = pastSessions.length;
    
    const reviews = pastSessions.filter(s => s.founder_rating);
    const avgRating = reviews.length > 0 
      ? reviews.reduce((sum, s) => sum + (s.founder_rating || 0), 0) / reviews.length 
      : 0;
    
    // Response rate: (accepted + rejected) / total requests * 100
    const respondedRequests = requests.filter(r => 
      r.status === 'accepted' || r.status === 'rejected'
    ).length;
    const responseRate = requests.length > 0 
      ? Math.round((respondedRequests / requests.length) * 100) 
      : 0;

    return {
      totalSessions,
      avgRating: avgRating > 0 ? avgRating.toFixed(1) : '0.0',
      responseRate,
    };
  }, [pastSessions, requests]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchRequests();
    setTimeout(() => setRefreshing(false), 500);
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
              <Text style={styles.heroTitle}>Welcome, {profile?.full_name || 'Expert'}</Text>
              <Text style={styles.heroSubtitle}>
                {profile?.expertise_areas?.join(', ') || 'Your Expertise'} • {profile?.years_experience || 0}+ years
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.activeSessions}</Text>
              <Text style={styles.statLabel}>Active Sessions</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalMentees}</Text>
              <Text style={styles.statLabel}>Total Mentees</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.avgRating}</Text>
              <Text style={styles.statLabel}>Avg Rating</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Mentorship Requests</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expert-sessions?tab=requests')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.requestsList}>
            {pendingRequests.slice(0, 3).map((request) => (
              <TouchableOpacity
                key={request.id}
                style={styles.requestCard}
                onPress={() => router.push('/(tabs)/expert-sessions')}
                activeOpacity={0.7}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestIcon}>
                    <Users size={20} color={COLORS.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.requestInfo}>
                    <Text style={styles.requestFounder}>
                      {request.founder?.full_name || 'Founder'}
                    </Text>
                    <Text style={styles.requestCompany}>
                      {request.founder?.email || 'No email'}
                    </Text>
                    <Text style={styles.requestTopic}>{request.topic}</Text>
                  </View>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>Pending</Text>
                  </View>
                </View>
                <Text style={styles.requestTime}>
                  {new Date(request.created_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  })}
                </Text>
              </TouchableOpacity>
            ))}
            {pendingRequests.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No pending requests</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/availability')}
              activeOpacity={0.7}>
              <Calendar size={24} color={COLORS.success} strokeWidth={2} />
              <Text style={styles.actionTitle}>Availability</Text>
              <Text style={styles.actionSubtitle}>Set time slots</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/expert-sessions')}
              activeOpacity={0.7}>
              <Clock size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.actionTitle}>Sessions</Text>
              <Text style={styles.actionSubtitle}>Manage requests</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/network')}
              activeOpacity={0.7}>
              <Users size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.actionTitle}>Find Founders</Text>
              <Text style={styles.actionSubtitle}>Browse network</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(tabs)/chat')}
              activeOpacity={0.7}>
              <MessageSquare size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.actionTitle}>Messages</Text>
              <Text style={styles.actionSubtitle}>View chats</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/expert-profile')}
              activeOpacity={0.7}>
              <UserRound size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Profile</Text>
              <Text style={styles.featureSubtitle}>Manage expertise</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/expert-sessions')}
              activeOpacity={0.7}>
              <Calendar size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Sessions</Text>
              <Text style={styles.featureSubtitle}>Manage requests</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/expert-analytics')}
              activeOpacity={0.7}>
              <BarChart3 size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Analytics</Text>
              <Text style={styles.featureSubtitle}>View metrics</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/feed')}
              activeOpacity={0.7}>
              <TrendingUp size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Network Feed</Text>
              <Text style={styles.featureSubtitle}>Activity updates</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/expert-sessions?tab=upcoming')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {latestUpcomingSessions.length > 0 ? (
            <View style={styles.sessionsList}>
              {latestUpcomingSessions.map((session) => {
                const sessionDate = new Date(session.requested_start_time);
                const isToday = sessionDate.toDateString() === new Date().toDateString();
                const isTomorrow = sessionDate.toDateString() === new Date(Date.now() + 86400000).toDateString();
                
                let dateLabel = '';
                if (isToday) {
                  dateLabel = 'Today';
                } else if (isTomorrow) {
                  dateLabel = 'Tomorrow';
                } else {
                  dateLabel = sessionDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                }
                
                const timeLabel = sessionDate.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                });

                return (
                  <View key={session.id} style={styles.sessionCard}>
                    <Calendar size={20} color={COLORS.primary} strokeWidth={2} />
                    <View style={styles.sessionInfo}>
                      <Text style={styles.sessionTitle}>
                        Mentorship with {session.founder?.full_name || 'Founder'}
                      </Text>
                      <Text style={styles.sessionTime}>
                        {dateLabel} at {timeLabel} • {session.topic}
                      </Text>
                    </View>
                    <CheckCircle size={20} color={COLORS.success} strokeWidth={2} />
                  </View>
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No upcoming sessions</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Your Performance</Text>
          </View>
          <View style={styles.performanceCard}>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Total Sessions</Text>
              <Text style={styles.performanceValue}>{performance.totalSessions}</Text>
            </View>
            <View style={styles.performanceRow}>
              <Text style={styles.performanceLabel}>Average Rating</Text>
              <View style={styles.ratingContainer}>
                <TrendingUp size={16} color={COLORS.success} strokeWidth={2} />
                <Text style={styles.performanceValue}>{performance.avgRating}/5.0</Text>
              </View>
            </View>
            <View style={[styles.performanceRow, styles.performanceRowLast]}>
              <Text style={styles.performanceLabel}>Response Rate</Text>
              <Text style={styles.performanceValue}>{performance.responseRate}%</Text>
            </View>
          </View>
        </View>
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
  statsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
  },
  statValue: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZES.xl,
    color: COLORS.background,
    marginBottom: SPACING.xs / 2,
  },
  statLabel: {
    ...TYPOGRAPHY.caption,
    color: 'rgba(255,255,255,0.75)',
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
  seeAllText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  viewAllText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  requestsList: {
    gap: SPACING.md,
  },
  emptyState: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
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
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  requestFounder: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  requestCompany: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  requestTopic: {
    ...TYPOGRAPHY.caption,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  statusBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.warning + '20',
  },
  statusAccepted: {
    backgroundColor: COLORS.success + '20',
  },
  statusText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  statusTextAccepted: {
    color: COLORS.success,
  },
  requestFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  requestTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  declineButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.error + '15',
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  declineButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  acceptButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    ...TYPOGRAPHY.body,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  actionCard: {
    width: '48%',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  actionTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    textAlign: 'center',
  },
  actionSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  sessionsList: {
    gap: SPACING.md,
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  sessionInfo: {
    flex: 1,
  },
  sessionTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  sessionTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  performanceCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  performanceRowLast: {
    borderBottomWidth: 0,
    paddingBottom: 0,
  },
  performanceLabel: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  performanceValue: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 0,
  },
  featureCard: {
    width: '48%',
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  featureTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    textAlign: 'center',
  },
  featureSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

