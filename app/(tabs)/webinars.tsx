import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
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
  Video,
  Calendar,
  Clock,
  Users,
  Play,
  Filter,
  Search,
  Plus,
  Star,
} from 'lucide-react-native';

const UPCOMING_WEBINARS = [
  {
    id: '1',
    title: 'Scaling Your SaaS Startup',
    host: 'Sarah Johnson',
    date: '2024-02-15',
    time: '2:00 PM',
    duration: '60 min',
    attendees: 45,
    type: 'live',
  },
  {
    id: '2',
    title: 'Fundraising Strategies for Seed Stage',
    host: 'Michael Chen',
    date: '2024-02-20',
    time: '3:00 PM',
    duration: '45 min',
    attendees: 32,
    type: 'live',
  },
];

const RECORDINGS = [
  {
    id: '1',
    title: 'Product-Market Fit Essentials',
    host: 'Emily Davis',
    recordedAt: '2024-01-15',
    duration: '50 min',
    views: 234,
    rating: 4.8,
    accessUntil: '2024-02-22',
  },
  {
    id: '2',
    title: 'Building a Strong Team Culture',
    host: 'John Smith',
    recordedAt: '2024-01-10',
    duration: '55 min',
    views: 189,
    rating: 4.9,
    accessUntil: '2024-02-17',
  },
];

export default function WebinarsScreen() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'recordings'>('upcoming');
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1000);
  };

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
              <Text style={styles.heroTitle}>Webinars & Events</Text>
              <Text style={styles.heroSubtitle}>
                Learn from experts and connect with the community
              </Text>
            </View>
          </View>
        </LinearGradient>

        <View style={styles.tabs}>
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
            style={[styles.tab, activeTab === 'recordings' && styles.tabActive]}
            onPress={() => setActiveTab('recordings')}
            activeOpacity={0.7}>
            <Play size={18} color={activeTab === 'recordings' ? COLORS.primary : COLORS.textSecondary} strokeWidth={2} />
            <Text
              style={[
                styles.tabText,
                activeTab === 'recordings' && styles.tabTextActive,
              ]}>
              Recordings
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'upcoming' ? (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Sessions</Text>
              <TouchableOpacity
                style={styles.createButton}
                onPress={() => router.push('/(tabs)/host-webinar')}>
                <Plus size={18} color={COLORS.primary} strokeWidth={2} />
                <Text style={styles.createButtonText}>Host</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.webinarsList}>
              {UPCOMING_WEBINARS.map((webinar) => (
                <TouchableOpacity
                  key={webinar.id}
                  style={styles.webinarCard}
                  onPress={() => router.push(`/(tabs)/webinar/${webinar.id}`)}
                  activeOpacity={0.7}>
                  <View style={styles.webinarHeader}>
                    <View style={styles.webinarIcon}>
                      <Video size={24} color={COLORS.primary} strokeWidth={2} />
                    </View>
                    <View style={styles.webinarInfo}>
                      <Text style={styles.webinarTitle}>{webinar.title}</Text>
                      <Text style={styles.webinarHost}>Hosted by {webinar.host}</Text>
                    </View>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>Live</Text>
                    </View>
                  </View>
                  <View style={styles.webinarDetails}>
                    <View style={styles.detailItem}>
                      <Calendar size={16} color={COLORS.textSecondary} strokeWidth={2} />
                      <Text style={styles.detailText}>
                        {webinar.date} at {webinar.time}
                      </Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Clock size={16} color={COLORS.textSecondary} strokeWidth={2} />
                      <Text style={styles.detailText}>{webinar.duration}</Text>
                    </View>
                    <View style={styles.detailItem}>
                      <Users size={16} color={COLORS.textSecondary} strokeWidth={2} />
                      <Text style={styles.detailText}>{webinar.attendees} attending</Text>
                    </View>
                  </View>
                  <TouchableOpacity style={styles.joinButton}>
                    <Text style={styles.joinButtonText}>Join Session</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recordings</Text>
              <TouchableOpacity style={styles.filterButton}>
                <Filter size={18} color={COLORS.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <View style={styles.recordingsList}>
              {RECORDINGS.map((recording) => (
                <TouchableOpacity
                  key={recording.id}
                  style={styles.recordingCard}
                  onPress={() => router.push(`/(tabs)/webinar/recording/${recording.id}`)}
                  activeOpacity={0.7}>
                  <View style={styles.recordingThumbnail}>
                    <Play size={32} color={COLORS.background} strokeWidth={2} />
                  </View>
                  <View style={styles.recordingInfo}>
                    <Text style={styles.recordingTitle}>{recording.title}</Text>
                    <Text style={styles.recordingHost}>by {recording.host}</Text>
                    <View style={styles.recordingMeta}>
                      <View style={styles.recordingRating}>
                        <Star size={14} color={COLORS.warning} fill={COLORS.warning} strokeWidth={2} />
                        <Text style={styles.recordingRatingText}>{recording.rating}</Text>
                      </View>
                      <Text style={styles.recordingViews}>{recording.views} views</Text>
                      <Text style={styles.recordingDuration}>{recording.duration}</Text>
                    </View>
                    <View style={styles.accessInfo}>
                      <Clock size={14} color={COLORS.warning} strokeWidth={2} />
                      <Text style={styles.accessText}>
                        Access until {recording.accessUntil}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
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
    gap: SPACING.md,
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
  createButton: {
    ...(Platform.OS === 'web' && {
      maxWidth: 300,
      alignSelf: 'center',
    }),
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.primaryLight,
    borderRadius: BORDER_RADIUS.md,
  },
  createButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  filterButton: {
    padding: SPACING.xs,
  },
  webinarsList: {
    gap: SPACING.md,
  },
  webinarCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  webinarHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },
  webinarIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  webinarInfo: {
    flex: 1,
  },
  webinarTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  webinarHost: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error + '20',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
  },
  liveText: {
    ...TYPOGRAPHY.label,
    fontSize: FONT_SIZES.xs,
    color: COLORS.error,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  webinarDetails: {
    gap: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  detailText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
  joinButton: {
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    ...(Platform.OS === 'web' && {
      maxWidth: 300,
      alignSelf: 'center',
    }),
  },
  joinButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  recordingsList: {
    gap: SPACING.md,
  },
  recordingCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  recordingThumbnail: {
    width: 120,
    height: 80,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.navy,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  recordingTitle: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  recordingHost: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  recordingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  recordingRating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  recordingRatingText: {
    ...TYPOGRAPHY.caption,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
  },
  recordingViews: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  recordingDuration: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  accessInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
    marginTop: SPACING.xs / 2,
  },
  accessText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.warning,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
});

