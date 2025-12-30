import React, { useCallback, useEffect, useMemo, useState, useRef } from 'react';
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
import { showAlert } from '@/utils/platformAlert';
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
  Upload,
  Video,
  Users,
  MessageSquare,
  Calendar,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  Award,
  Bell,
  BarChart3,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { useSubscription } from '@/hooks/useSubscription';
import { useProfileStats } from '@/hooks/useProfileStats';
import { useMentorshipRequests } from '@/hooks/useMentorshipRequests';
import { useFundingStatus } from '@/hooks/useFundingStatus';
import { usePitchMaterials } from '@/hooks/usePitchMaterials';
import { useMeetings } from '@/hooks/useMeetings';
import { Alert } from 'react-native';

const QUICK_ACTIONS = [
  {
    icon: Upload,
    title: 'Upload Pitch Deck',
    subtitle: 'Share your deck',
    route: '/(tabs)/pitch-upload',
    color: COLORS.primary,
  },
  {
    icon: Video,
    title: 'Record Pitch Video',
    subtitle: '2-minute pitch',
    route: '/(tabs)/pitch-video',
    color: COLORS.accent,
  },
  {
    icon: Users,
    title: 'Find Investors',
    subtitle: 'Browse network',
    route: '/(tabs)/network',
    color: COLORS.primary,
  },
  {
    icon: MessageSquare,
    title: 'Messages',
    subtitle: 'View chats',
    route: '/(tabs)/chat',
    color: COLORS.primary,
  },
];

export default function FounderDashboard() {
  const { profile, user } = useAuth();
  const { permissions, currentPlan, loading: subLoading } = useSubscription();
  const { stats, loading: statsLoading, refresh: refreshStats } = useProfileStats();
  const { upcomingSessions: mentorshipSessions, loading: mentorshipLoading } = useMentorshipRequests();
  const { fundingRequests, refresh: refreshFunding, loading: fundingLoading } = useFundingStatus();
  const { pitchDecks, pitchVideos, loading: pitchLoading } = usePitchMaterials();
  const { getUpcomingMeetings } = useMeetings();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [startup, setStartup] = useState<{ name?: string; stage?: string; pitch_deck_url?: string | null; pitch_video_url?: string | null; is_public?: boolean }>({});
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; status: 'pending' | 'in_progress' }>>([]);
  const [isNavigating, setIsNavigating] = useState(false);
  const [allUpcomingSessions, setAllUpcomingSessions] = useState<Array<{
    id: string;
    title: string;
    date: Date;
    type: 'mentorship' | 'meeting';
    participant?: string;
  }>>([]);
  const [meetings, setMeetings] = useState<any[]>([]);
  const [meetingsLoading, setMeetingsLoading] = useState(true);
  const hasInitialized = useRef(false);

  const canUploadPitchAssets = permissions.canUploadPitchDeck || permissions.canRecordPitchVideo;

  // Check if all data is loaded - memoize to prevent recalculation
  const allDataLoaded = useMemo(() => 
    !pitchLoading && !fundingLoading && !mentorshipLoading && !statsLoading && !meetingsLoading,
    [pitchLoading, fundingLoading, mentorshipLoading, statsLoading, meetingsLoading]
  );

  // Build task list function - kept simple and stable
  const buildTaskList = (
    hasPitchDeck: boolean,
    hasPitchVideo: boolean,
    hasFundingRequest: boolean,
  ): Array<{ id: string; title: string; status: 'pending' | 'in_progress' }> => {
    const items: Array<{ id: string; title: string; status: 'pending' | 'in_progress' }> = [];
    if (!hasPitchDeck) {
      items.push({ id: 'deck', title: 'Upload your pitch deck', status: 'pending' });
    }
    if (!hasPitchVideo) {
      items.push({ id: 'video', title: 'Record your 2-minute pitch video', status: 'pending' });
    }
    if (!hasFundingRequest) {
      items.push({
        id: 'funding',
        title: 'Create your first funding request',
        status: 'pending',
      });
    }
    return items;
  };

  const fetchDashboardData = useCallback(async () => {
    if (!profile?.id) return;
    
    try {
      // Fetch startup profile
      const startupRes = await supabase
        .from('startup_profiles')
        .select('name, stage, pitch_deck_url, pitch_video_url, is_public')
        .eq('owner_id', profile.id)
        .maybeSingle();

      if (startupRes.error && startupRes.error.code !== 'PGRST116') throw startupRes.error;

      const startupData = startupRes.data || {};
      setStartup(startupData);
      
      // Fetch upcoming meetings
      setMeetingsLoading(true);
      const meetingsResult = await getUpcomingMeetings();
      const fetchedMeetings = meetingsResult.success && meetingsResult.meetings ? meetingsResult.meetings : [];
      setMeetings(fetchedMeetings);
      setMeetingsLoading(false);
    } catch (err) {
      console.error('Error loading founder dashboard', err);
      setMeetingsLoading(false);
      Alert.alert('Error', 'Unable to load your dashboard data. Please try again.');
    }
  }, [profile?.id]);

  // Use primitive values for dependencies to prevent infinite loops
  const pitchDecksCount = pitchDecks.length;
  const pitchVideosCount = pitchVideos.length;
  const fundingRequestsCount = fundingRequests.length;
  const mentorshipSessionsCount = mentorshipSessions.length;
  const meetingsCount = meetings.length;
  const userId = user?.id;

  // Store previous values in refs to detect changes
  const prevMentorshipKey = useRef('');
  const prevMeetingsKey = useRef('');
  const prevPitchDecksCount = useRef(0);
  const prevPitchVideosCount = useRef(0);
  const prevFundingRequestsCount = useRef(0);

  // Track previous values to prevent unnecessary updates
  const prevAllDataLoaded = useRef(false);

  // Update state only once when all data is loaded
  useEffect(() => {
    if (!profile?.id) {
      setLoading(true);
      return;
    }

    if (!allDataLoaded) {
      if (!prevAllDataLoaded.current) {
        setLoading(true);
      }
      return;
    }

    // Compute keys inside useEffect to avoid dependency issues
    const currentMentorshipKey = mentorshipSessions.length > 0
      ? mentorshipSessions.map(s => `${s.id}-${s.requested_start_time}`).join('|')
      : '';
    const currentMeetingsKey = meetings.length > 0
      ? meetings.map(m => `${m.id}-${m.scheduled_at}`).join('|')
      : '';

    // Check if data actually changed
    const tasksChanged = 
      prevPitchDecksCount.current !== pitchDecksCount ||
      prevPitchVideosCount.current !== pitchVideosCount ||
      prevFundingRequestsCount.current !== fundingRequestsCount;
    
    const sessionsChanged = 
      prevMentorshipKey.current !== currentMentorshipKey ||
      prevMeetingsKey.current !== currentMeetingsKey;
    
    const dataJustLoaded = !prevAllDataLoaded.current && allDataLoaded;

    // Only update if data changed or just finished loading
    if (tasksChanged || sessionsChanged || dataJustLoaded) {
      prevAllDataLoaded.current = true;
      prevPitchDecksCount.current = pitchDecksCount;
      prevPitchVideosCount.current = pitchVideosCount;
      prevFundingRequestsCount.current = fundingRequestsCount;
      prevMentorshipKey.current = currentMentorshipKey;
      prevMeetingsKey.current = currentMeetingsKey;
      
      // Compute tasks
      const hasPitchDeck = pitchDecksCount > 0;
      const hasPitchVideo = pitchVideosCount > 0;
      const hasFundingRequest = fundingRequestsCount > 0;
      const newTasks = buildTaskList(hasPitchDeck, hasPitchVideo, hasFundingRequest);
      
      // Compute sessions
      const combinedSessions: Array<{
        id: string;
        title: string;
        date: Date;
        type: 'mentorship' | 'meeting';
        participant?: string;
      }> = [];

      // Add mentorship sessions
      mentorshipSessions.forEach((session) => {
        combinedSessions.push({
          id: session.id,
          title: session.topic === 'custom' ? session.custom_topic || 'Custom Topic' : session.topic,
          date: new Date(session.requested_start_time),
          type: 'mentorship',
          participant: session.expert?.full_name || 'Expert',
        });
      });

      // Add regular meetings
      meetings.forEach((meeting) => {
        const participantName = meeting.organizer_id === userId
          ? (meeting.participant?.full_name || meeting.participant?.email || meeting.participant_email || 'Participant')
          : (meeting.organizer?.full_name || meeting.organizer?.email || 'Organizer');
        
        combinedSessions.push({
          id: meeting.id,
          title: meeting.title,
          date: new Date(meeting.scheduled_at),
          type: 'meeting',
          participant: participantName,
        });
      });

      // Sort by date and take latest 2
      combinedSessions.sort((a, b) => a.date.getTime() - b.date.getTime());
      
      setLoading(false);
      setTasks(newTasks);
      setAllUpcomingSessions(combinedSessions.slice(0, 2));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDataLoaded, pitchDecksCount, pitchVideosCount, fundingRequestsCount, mentorshipSessionsCount, meetingsCount, profile?.id, userId]);

  // Initial data fetch - only run once when profile.id changes
  useEffect(() => {
    if (profile?.id && !hasInitialized.current) {
      fetchDashboardData();
    }
  }, [profile?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    hasInitialized.current = false;
    prevAllDataLoaded.current = false;
    prevPitchDecksCount.current = 0;
    prevPitchVideosCount.current = 0;
    prevFundingRequestsCount.current = 0;
    prevMentorshipKey.current = '';
    prevMeetingsKey.current = '';
    await Promise.all([fetchDashboardData(), refreshStats(), refreshFunding()]);
    setRefreshing(false);
  };

  const handleQuickAction = (route: string, requiresPremium = false) => {
    // Prevent multiple rapid clicks
    if (isNavigating) return;

    if (requiresPremium && !canUploadPitchAssets) {
      showAlert(
        'Upgrade required',
        'Pitch materials are part of the Pro plan and above. Upgrade to unlock this action.',
      );
      return;
    }

    setIsNavigating(true);
    router.push(route);
    // Reset after navigation completes
    setTimeout(() => setIsNavigating(false), 500);
  };

  const quickActions = QUICK_ACTIONS.map((action) => ({
    ...action,
    requiresPremium:
      action.route === '/(tabs)/pitch-upload' || action.route === '/(tabs)/pitch-video',
  }));

  const fundingVisibilityCopy = startup?.is_public
    ? 'Your pitch is visible across investor discovery'
    : 'Your pitch is only shared with approved investors';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={COLORS.primary} />
        }>
        <LinearGradient colors={GRADIENTS.primary} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Welcome back, {profile?.full_name || 'Founder'}</Text>
              <Text style={styles.heroSubtitle}>
                {startup?.name || profile?.venture_name || 'Your Startup'} •{' '}
                {startup?.stage || profile?.venture_stage || 'Early Stage'}
              </Text>
            </View>
          </View>
          <View style={styles.statsRow}>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalConnections || 0}</Text>
              <Text style={styles.statLabel}>Connections</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.totalChats || 0}</Text>
              <Text style={styles.statLabel}>Active Chats</Text>
            </View>
            <View style={styles.statCard}>
              <Text style={styles.statValue}>{stats.profileViews || 0}</Text>
              <Text style={styles.statLabel}>Investor Views</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => {
              const IconComponent = action.icon;
              return (
                <TouchableOpacity
                  key={action.title}
                  style={styles.actionCard}
                  onPress={() => handleQuickAction(action.route, action.requiresPremium)}
                  activeOpacity={0.7}>
                  <View style={[styles.actionIcon, { backgroundColor: `${action.color}15` }]}>
                    <IconComponent size={24} color={action.color} strokeWidth={2} />
                  </View>
                  <Text style={styles.actionTitle}>{action.title}</Text>
                  <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Main Features</Text>
          <View style={styles.featuresGrid}>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/startup-profile')}
              activeOpacity={0.7}>
              <Building2 size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Startup Profile</Text>
              <Text style={styles.featureSubtitle}>Manage your profile</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/funding-status')}
              activeOpacity={0.7}>
              <TrendingUp size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Funding Status</Text>
              <Text style={styles.featureSubtitle}>Track progress</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/mentorship')}
              activeOpacity={0.7}>
              <Award size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Mentorship</Text>
              <Text style={styles.featureSubtitle}>Find experts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/webinars')}
              activeOpacity={0.7}>
              <Video size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Webinars</Text>
              <Text style={styles.featureSubtitle}>Events & sessions</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/feed')}
              activeOpacity={0.7}>
              <BarChart3 size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Activity Feed</Text>
              <Text style={styles.featureSubtitle}>Network updates</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.featureCard}
              onPress={() => router.push('/(tabs)/notifications')}
              activeOpacity={0.7}>
              <Bell size={24} color={COLORS.primary} strokeWidth={2} />
              <Text style={styles.featureTitle}>Notifications</Text>
              <Text style={styles.featureSubtitle}>View updates</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pending Tasks</Text>
          <View style={styles.tasksList}>
            {tasks.length === 0 ? (
              <Text style={styles.emptyStateText}>Nice work! Your core tasks are up to date.</Text>
            ) : (
              tasks.map((task) => (
                <View key={task.id} style={styles.taskCard}>
                  <View style={styles.taskContent}>
                    <Clock
                      size={18}
                      color={task.status === 'pending' ? COLORS.warning : COLORS.accent}
                      strokeWidth={2}
                    />
                    <Text style={styles.taskText}>{task.title}</Text>
                  </View>
                  <View style={styles.taskStatus}>
                    <Text style={styles.taskStatusText}>
                      {task.status === 'pending' ? 'Pending' : 'In Progress'}
                    </Text>
                  </View>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Funding Portal</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/funding')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {fundingRequests.length === 0 ? (
            <View style={styles.fundingCard}>
              <View style={styles.fundingHeader}>
                <TrendingUp size={24} color={COLORS.primary} strokeWidth={2} />
                <View style={styles.fundingInfo}>
                  <Text style={styles.fundingTitle}>No Funding Requests Yet</Text>
                  <Text style={styles.fundingSubtitle}>Create your first funding request to get started</Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.fundingButton}
                onPress={() => router.push('/(tabs)/funding')}>
                <Text style={styles.fundingButtonText}>Create Request</Text>
              </TouchableOpacity>
            </View>
          ) : (
            fundingRequests.slice(0, 1).map((request) => (
              <View key={request.id} style={styles.fundingCard}>
                <View style={styles.fundingHeader}>
                  <TrendingUp size={24} color={COLORS.primary} strokeWidth={2} />
                  <View style={styles.fundingInfo}>
                    <Text style={styles.fundingTitle}>
                      {request.title || 'Funding Request'}
                    </Text>
                    <Text style={styles.fundingSubtitle}>
                      {request.amount_requested 
                        ? `$${request.amount_requested.toLocaleString()}` 
                        : 'Amount not specified'} • {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </Text>
                    <Text style={styles.fundingStats}>
                      {request.interestedCount} interested • {request.investorsViewed} views
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.fundingButton}
                  onPress={() => router.push('/(tabs)/funding-status')}>
                  <Text style={styles.fundingButtonText}>View Details</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/sessions')}>
              <Text style={styles.seeAllText}>View All</Text>
            </TouchableOpacity>
          </View>
          {allUpcomingSessions.length === 0 ? (
            <View style={styles.sessionCard}>
              <Calendar size={20} color={COLORS.textSecondary} strokeWidth={2} />
              <View style={styles.sessionInfo}>
                <Text style={styles.sessionTitle}>No sessions scheduled</Text>
                <Text style={styles.sessionTime}>Schedule a meeting or request mentorship</Text>
              </View>
            </View>
          ) : (
            allUpcomingSessions.map((session) => (
              <View key={session.id} style={styles.sessionCard}>
                <Calendar size={20} color={COLORS.primary} strokeWidth={2} />
                <View style={styles.sessionInfo}>
                  <Text style={styles.sessionTitle}>{session.title}</Text>
                  <Text style={styles.sessionTime}>
                    {session.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })} • {session.participant}
                  </Text>
                </View>
                <CheckCircle
                  size={20}
                  color={COLORS.primary}
                  strokeWidth={2}
                />
              </View>
            ))
          )}

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
    paddingBottom: SPACING.xxl,
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
  statsRow: {
    flexDirection: 'column',
    gap: SPACING.sm,
  },
  statCard: {
    width: '100%',
    flexDirection: 'column',
    backgroundColor: 'rgba(255,255,255,0.12)',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    alignItems: 'flex-start',
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
    marginBottom: SPACING.lg,
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
    marginBottom: SPACING.sm,
  },
  seeAllText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
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
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
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
  tasksList: {
    gap: SPACING.sm,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  taskContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flex: 1,
  },
  taskText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  taskStatus: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.warning + '20',
  },
  taskStatusText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.warning,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  fundingCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  fundingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  fundingInfo: {
    flex: 1,
  },
  fundingTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  fundingSubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  fundingStats: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs / 2,
  },
  fundingButton: {
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  fundingButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
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
  emptyStateText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  activitiesList: {
    gap: SPACING.sm,
  },
  activitiesSection: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  activityCard: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activityBullet: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    marginTop: SPACING.sm,
  },
  activityInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  activityTitle: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.text,
  },
  activitySubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  activityTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.subtle,
  },
});

