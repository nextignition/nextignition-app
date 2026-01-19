import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { Briefcase, MapPin, TrendingUp, MessageCircle, User, Building2, Video, Calendar } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_FAMILY, FONT_SIZES, TYPOGRAPHY } from '@/constants/theme';
import { NetworkProfile, StartupProfile } from '@/hooks/useExploreNetwork';

interface FounderProfileCardProps {
  profile: NetworkProfile;
  startup?: StartupProfile;
  onChat: () => void;
  onViewDetails: () => void;
  onViewPitch?: () => void;
  onScheduleMeeting?: () => void;
  chatLoading?: boolean;
}

export function FounderProfileCard({
  profile,
  startup,
  onChat,
  onViewDetails,
  onViewPitch,
  onScheduleMeeting,
  chatLoading,
}: FounderProfileCardProps) {
  // Get initials from name for fallback avatar
  const getInitials = (name: string | null) => {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const initials = getInitials(profile.full_name);

  return (
    <TouchableOpacity 
      style={styles.card} 
      onPress={onViewDetails}
      activeOpacity={0.9}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarSection}>
          {profile.avatar_url ? (
            <Image
              source={{ uri: profile.avatar_url }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <User size={36} color={COLORS.primary} strokeWidth={2.5} />
            </View>
          )}
          {startup && (
            <View style={styles.startupBadge}>
              <Building2 size={16} color={COLORS.background} strokeWidth={2.5} />
            </View>
          )}
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.full_name || 'Unknown User'}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {startup?.company_name || 'Founder'}
          </Text>
          {startup?.stage && (
            <View style={styles.stageTag}>
              <Text style={styles.stageText}>{startup.stage}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Startup Info Section */}
      {startup && (
        <View style={styles.infoSection}>
          {startup.industry && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Briefcase size={16} color={COLORS.background} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>{startup.industry}</Text>
            </View>
          )}
          {startup.funding_stage && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <TrendingUp size={16} color={COLORS.background} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>{startup.funding_stage}</Text>
            </View>
          )}
          {startup.location && (
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <MapPin size={16} color={COLORS.background} strokeWidth={2.5} />
              </View>
              <Text style={styles.infoText} numberOfLines={1}>{startup.location}</Text>
            </View>
          )}
        </View>
      )}

      {/* Description */}
      {(startup?.problem_statement || profile.bio) && (
        <Text style={styles.description} numberOfLines={2}>
          {startup?.problem_statement || profile.bio}
        </Text>
      )}

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity 
          style={styles.chatButton} 
          onPress={(e) => {
            e.stopPropagation();
            onChat();
          }}
          disabled={chatLoading}
          activeOpacity={0.8}
        >
          {chatLoading ? (
            <ActivityIndicator size="small" color={COLORS.background} />
          ) : (
            <>
              <MessageCircle size={20} color={COLORS.background} strokeWidth={2.5} />
              <Text style={styles.chatButtonText}>Chat</Text>
            </>
          )}
        </TouchableOpacity>
        
        {onScheduleMeeting && (
          <TouchableOpacity 
            style={styles.scheduleButton}
            onPress={(e) => {
              e.stopPropagation();
              onScheduleMeeting();
            }}
            activeOpacity={0.8}
          >
            <Calendar size={20} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.scheduleButtonText}>Schedule</Text>
          </TouchableOpacity>
        )}
        
        {startup && onViewPitch && (
          <TouchableOpacity 
            style={styles.pitchButton}
            onPress={(e) => {
              e.stopPropagation();
              onViewPitch();
            }}
            activeOpacity={0.8}
          >
            <Video size={20} color={COLORS.primary} strokeWidth={2.5} />
            <Text style={styles.pitchButtonText}>Pitch</Text>
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.xl,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
  },
  avatarSection: {
    position: 'relative',
    marginRight: SPACING.lg,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  avatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  startupBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    borderWidth: 3,
    borderColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  headerInfo: {
    flex: 1,
    paddingTop: SPACING.xs,
  },
  name: {
    fontFamily: FONT_FAMILY.displayBold,
    fontSize: FONT_SIZES.xl,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    lineHeight: 28,
  },
  role: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: 20,
  },
  stageTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    marginTop: SPACING.xs,
  },
  stageText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    fontWeight: '600',
  },
  infoSection: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primaryLight,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    flex: 1,
    minWidth: '45%',
  },
  infoIcon: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.bodyBold,
    flex: 1,
    fontWeight: '600',
  },
  description: {
    fontSize: FONT_SIZES.md,
    color: COLORS.text,
    fontFamily: FONT_FAMILY.body,
    lineHeight: 22,
    marginBottom: SPACING.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  chatButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    gap: SPACING.sm,
    ...SHADOWS.sm,
    ...(Platform.OS === 'web' && {
      flex: 0,
      maxWidth: 150,
      alignSelf: 'center',
      minWidth: 120,
    }),
  },
  chatButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.background,
    fontFamily: FONT_FAMILY.bodyBold,
    fontWeight: '700',
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  scheduleButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    fontWeight: '700',
  },
  pitchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceMuted,
    borderWidth: 2,
    borderColor: COLORS.primary,
    gap: SPACING.sm,
  },
  pitchButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    fontWeight: '700',
  },
});
