import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Linking,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMeetings, Meeting } from '@/hooks/useMeetings';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
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
  Video,
  MapPin,
  Users,
  CheckCircle,
  XCircle,
  MessageSquare,
  ExternalLink,
} from 'lucide-react-native';

export default function SessionsScreen() {
  const { user, profile } = useAuth();
  const { getUpcomingMeetings, loading: meetingsLoading } = useMeetings();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [pastMeetings, setPastMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Check if user is founder (should hide Schedule New button)
  const isFounder = profile?.role === 'founder' || profile?.role === 'cofounder';
  const isInvestor = profile?.role === 'investor';

  // Fetch meetings
  const fetchMeetings = async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch upcoming meetings
      const upcomingResult = await getUpcomingMeetings();
      if (upcomingResult.success && upcomingResult.meetings) {
        setUpcomingMeetings(upcomingResult.meetings);
      }

      // Fetch past meetings (also check participant_email for founders)
      const userEmail = user.email;
      const { data: pastData, error: pastError } = await supabase
        .from('meetings')
        .select(`
          *,
          organizer:profiles!meetings_organizer_id_fkey(id, full_name, email),
          participant:profiles!meetings_participant_id_fkey(id, full_name, email)
        `)
        .or(`organizer_id.eq.${user.id},participant_id.eq.${user.id}${userEmail ? `,participant_email.eq.${userEmail}` : ''}`)
        .lt('scheduled_at', new Date().toISOString())
        .in('status', ['completed', 'cancelled'])
        .order('scheduled_at', { ascending: false })
        .limit(20);

      if (!pastError && pastData) {
        setPastMeetings(pastData as Meeting[]);
      }
    } catch (error) {
      console.error('Error fetching meetings:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchMeetings();
  }, [user?.id]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchMeetings();
  };

  // Format date and time
  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    const dateStr = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return { date: dateStr, time: timeStr };
  };

  // Get participant name/email
  const getParticipantInfo = (meeting: Meeting) => {
    if (meeting.organizer_id === user?.id) {
      // User is organizer, show participant
      return meeting.participant?.full_name || meeting.participant?.email || meeting.participant_email || 'Participant';
    } else {
      // User is participant, show organizer
      return meeting.organizer?.full_name || meeting.organizer?.email || 'Organizer';
    }
  };

  // Handle join meeting
  const handleJoinMeeting = async (meetingUrl: string | null) => {
    if (!meetingUrl) {
      return;
    }

    const canOpen = await Linking.canOpenURL(meetingUrl);
    if (canOpen) {
      await Linking.openURL(meetingUrl);
    } else {
      console.error('Cannot open meeting URL:', meetingUrl);
    }
  };

  // Handle chat navigation
  const handleChat = (meeting: Meeting) => {
    const otherUserId = meeting.organizer_id === user?.id 
      ? meeting.participant_id 
      : meeting.organizer_id;
    
    if (otherUserId) {
      router.push(`/(tabs)/chat?userId=${otherUserId}`);
    } else {
      // If no participant_id, use email to find user or show message
      router.push('/(tabs)/chat');
    }
  };

  const getTypeIcon = (meetingType: string) => {
    switch (meetingType) {
      case 'video':
        return <Video size={20} color={COLORS.primary} strokeWidth={2} />;
      case 'in-person':
        return <MapPin size={20} color={COLORS.primary} strokeWidth={2} />;
      default:
        return <Calendar size={20} color={COLORS.primary} strokeWidth={2} />;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }>
        <LinearGradient colors={GRADIENTS.primary as any} style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={styles.heroIcon}>
              <Calendar size={28} color={COLORS.background} strokeWidth={2} />
            </View>
            <View style={styles.heroText}>
              <Text style={styles.heroTitle}>Sessions</Text>
              <Text style={styles.heroSubtitle}>Manage your meetings and sessions</Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'upcoming' && styles.tabActive]}
            onPress={() => setActiveTab('upcoming')}
            activeOpacity={0.7}>
            <Clock size={18} color={activeTab === 'upcoming' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
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
            <CheckCircle size={18} color={activeTab === 'past' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'past' && styles.tabTextActive,
              ]}>
              Past
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'upcoming' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
              {/* Only show Schedule New for investors, not founders */}
              {!isFounder && (
                <TouchableOpacity
                  onPress={() => router.push('/(tabs)/schedule-meeting')}
                  activeOpacity={0.7}>
                  <Text style={styles.newButtonText}>+ Schedule New</Text>
                </TouchableOpacity>
              )}
            </View>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading meetings...</Text>
              </View>
            ) : upcomingMeetings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Calendar size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No upcoming meetings</Text>
                <Text style={styles.emptySubtext}>
                  {isFounder 
                    ? 'Meetings scheduled with you will appear here'
                    : 'Schedule a new meeting to get started'}
                </Text>
              </View>
            ) : (
              <View style={styles.sessionsList}>
                {upcomingMeetings.map((meeting) => {
                  const { date, time } = formatDateTime(meeting.scheduled_at);
                  const participantName = getParticipantInfo(meeting);
                  const canJoin = meeting.meeting_url && meeting.status === 'scheduled';
                  
                  return (
                    <View key={meeting.id} style={styles.sessionCard}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionIcon}>
                          {getTypeIcon(meeting.meeting_type)}
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionTitle}>{meeting.title}</Text>
                          <Text style={styles.sessionType}>
                            {meeting.meeting_type === 'video' ? 'Video Call' : 
                             meeting.meeting_type === 'in-person' ? 'In-Person' : 
                             meeting.meeting_type}
                          </Text>
                        </View>
                        {meeting.status === 'scheduled' ? (
                          <CheckCircle size={20} color={COLORS.success} strokeWidth={2} />
                        ) : (
                          <Clock size={20} color={COLORS.warning} strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.sessionDetails}>
                        <View style={styles.detailRow}>
                          <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                          <Text style={styles.detailText}>
                            {date} at {time}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Clock size={16} color={COLORS.textSecondary} strokeWidth={2} />
                          <Text style={styles.detailText}>
                            {meeting.duration_minutes} minutes
                          </Text>
                        </View>
                        {meeting.location && (
                          <View style={styles.detailRow}>
                            <MapPin size={16} color={COLORS.textSecondary} strokeWidth={2} />
                            <Text style={styles.detailText}>{meeting.location}</Text>
                          </View>
                        )}
                        <View style={styles.detailRow}>
                          <Users size={16} color={COLORS.textSecondary} strokeWidth={2} />
                          <Text style={styles.detailText}>{participantName}</Text>
                        </View>
                      </View>
                      <View style={styles.sessionActions}>
                        <TouchableOpacity
                          style={styles.messageButton}
                          onPress={() => handleChat(meeting)}
                          activeOpacity={0.7}>
                          <MessageSquare size={16} color={COLORS.primary} strokeWidth={2} />
                          <Text style={styles.messageButtonText}>Message</Text>
                        </TouchableOpacity>
                        {canJoin && (
                          <TouchableOpacity
                            style={styles.joinButton}
                            onPress={() => handleJoinMeeting(meeting.meeting_url)}
                            activeOpacity={0.7}>
                            <ExternalLink size={16} color={COLORS.background} strokeWidth={2} />
                            <Text style={styles.joinButtonText}>Join Session</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        )}

        {activeTab === 'past' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Past Sessions</Text>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
                <Text style={styles.loadingText}>Loading meetings...</Text>
              </View>
            ) : pastMeetings.length === 0 ? (
              <View style={styles.emptyContainer}>
                <CheckCircle size={48} color={COLORS.textSecondary} strokeWidth={1.5} />
                <Text style={styles.emptyText}>No past meetings</Text>
                <Text style={styles.emptySubtext}>
                  Completed and cancelled meetings will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.sessionsList}>
                {pastMeetings.map((meeting) => {
                  const { date, time } = formatDateTime(meeting.scheduled_at);
                  const participantName = getParticipantInfo(meeting);
                  
                  return (
                    <View key={meeting.id} style={styles.sessionCard}>
                      <View style={styles.sessionHeader}>
                        <View style={styles.sessionIcon}>
                          {getTypeIcon(meeting.meeting_type)}
                        </View>
                        <View style={styles.sessionInfo}>
                          <Text style={styles.sessionTitle}>{meeting.title}</Text>
                          <Text style={styles.sessionType}>
                            {meeting.meeting_type === 'video' ? 'Video Call' : 
                             meeting.meeting_type === 'in-person' ? 'In-Person' : 
                             meeting.meeting_type}
                          </Text>
                        </View>
                        {meeting.status === 'completed' ? (
                          <CheckCircle size={20} color={COLORS.success} strokeWidth={2} />
                        ) : (
                          <XCircle size={20} color={COLORS.error} strokeWidth={2} />
                        )}
                      </View>
                      <View style={styles.sessionDetails}>
                        <View style={styles.detailRow}>
                          <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                          <Text style={styles.detailText}>
                            {date} at {time}
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Clock size={16} color={COLORS.textSecondary} strokeWidth={2} />
                          <Text style={styles.detailText}>
                            {meeting.duration_minutes} minutes
                          </Text>
                        </View>
                        <View style={styles.detailRow}>
                          <Users size={16} color={COLORS.textSecondary} strokeWidth={2} />
                          <Text style={styles.detailText}>{participantName}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
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
  sessionTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  sessionType: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  sessionDetails: {
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    flex: 1,
  },
  sessionActions: {
    flexDirection: 'row',
    gap: SPACING.md,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
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
    ...(Platform.OS === 'web' && {
      flex: 0,
      maxWidth: 200,
      alignSelf: 'center',
      minWidth: 150,
    }),
  },
  messageButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  rescheduleButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...(Platform.OS === 'web' && {
      flex: 0,
      maxWidth: 200,
      alignSelf: 'center',
      minWidth: 150,
    }),
  },
  rescheduleButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  joinButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    ...(Platform.OS === 'web' && {
      flex: 0,
      maxWidth: 300,
      alignSelf: 'center',
      minWidth: 200,
    }),
  },
  joinButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  loadingText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.md,
  },
  emptyText: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptySubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
});

