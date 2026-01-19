import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Platform } from 'react-native';
import { Building2, MapPin, DollarSign, MessageCircle, TrendingUp, User, Briefcase } from 'lucide-react-native';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS, FONT_FAMILY, FONT_SIZES, TYPOGRAPHY } from '@/constants/theme';
import { NetworkProfile } from '@/hooks/useExploreNetwork';

interface InvestorProfileCardProps {
  profile: NetworkProfile;
  onChat: () => void;
  onViewDetails: () => void;
  chatLoading?: boolean;
}

export function InvestorProfileCard({
  profile,
  onChat,
  onViewDetails,
  chatLoading,
}: InvestorProfileCardProps) {
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
          <View style={styles.investorBadge}>
            <DollarSign size={16} color={COLORS.background} strokeWidth={2.5} />
          </View>
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.name} numberOfLines={1}>
            {profile.full_name || 'Unknown User'}
          </Text>
          <Text style={styles.role} numberOfLines={1}>
            {profile.investment_firm || 'Investor'}
          </Text>
          {profile.investment_type && (
            <View style={styles.typeTag}>
              <Text style={styles.typeText}>{profile.investment_type}</Text>
            </View>
          )}
        </View>
      </View>

      {/* Investor Info Section */}
      <View style={styles.infoSection}>
        {profile.investment_range && (
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <DollarSign size={16} color={COLORS.background} strokeWidth={2.5} />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>{profile.investment_range}</Text>
          </View>
        )}
        {profile.investment_industries && profile.investment_industries.length > 0 && (
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <Building2 size={16} color={COLORS.background} strokeWidth={2.5} />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>
              {profile.investment_industries.slice(0, 2).join(', ')}
              {profile.investment_industries.length > 2 && '...'}
            </Text>
          </View>
        )}
        {profile.location && (
          <View style={styles.infoItem}>
            <View style={styles.infoIcon}>
              <MapPin size={16} color={COLORS.background} strokeWidth={2.5} />
            </View>
            <Text style={styles.infoText} numberOfLines={1}>{profile.location}</Text>
          </View>
        )}
      </View>

      {/* Description */}
      {profile.bio && (
        <Text style={styles.description} numberOfLines={2}>
          {profile.bio}
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
        
        <TouchableOpacity 
          style={styles.viewButton}
          onPress={(e) => {
            e.stopPropagation();
            onViewDetails();
          }}
          activeOpacity={0.8}
        >
          <Briefcase size={20} color={COLORS.primary} strokeWidth={2.5} />
          <Text style={styles.viewButtonText}>Profile</Text>
        </TouchableOpacity>
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
  investorBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accent,
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
  typeTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.accentLight,
    marginTop: SPACING.xs,
  },
  typeText: {
    fontSize: FONT_SIZES.sm,
    color: COLORS.accent,
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
  viewButton: {
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
    ...(Platform.OS === 'web' && {
      maxWidth: 150,
      alignSelf: 'center',
      minWidth: 120,
    }),
  },
  viewButtonText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
    fontWeight: '700',
  },
});
