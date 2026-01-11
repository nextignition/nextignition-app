import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  LucideIcon,
  Building2,
  UsersRound,
  Award,
  ShieldCheck,
  BriefcaseBusiness,
  TrendingUp,
} from 'lucide-react-native';
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
import { UserRole } from '@/types/user';

interface RoleCardProps {
  id: UserRole;
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}

const ICON_MAP: Record<string, LucideIcon> = {
  rocket: Building2,
  users: UsersRound,
  sparkles: Award,
  shield: ShieldCheck,
  briefcase: BriefcaseBusiness,
  trending: TrendingUp,
};

export function RoleCard({
  id,
  title,
  description,
  icon,
  selected,
  onPress,
}: RoleCardProps) {
  const IconComponent = ICON_MAP[icon] || Building2;

  const handlePress = (e: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (onPress) {
      onPress();
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      disabled={false}
      style={[
        styles.card,
        selected && styles.cardSelected,
        Platform.OS === 'web' && styles.cardWeb,
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}>
      <View style={styles.iconShell} pointerEvents="none">
        {selected ? (
          <LinearGradient
            colors={GRADIENTS.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconGradient}>
            <IconComponent size={28} color={COLORS.background} />
          </LinearGradient>
        ) : (
          <View style={styles.iconContainer}>
            <IconComponent size={28} color={COLORS.primary} />
          </View>
        )}
      </View>
      <View style={styles.copy} pointerEvents="none">
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.description}>{description}</Text>
      </View>
      {selected && <View style={styles.selectedIndicator} pointerEvents="none" />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    minHeight: 150,
    flexDirection: 'row',
    gap: SPACING.md,
    alignItems: 'center',
    position: 'relative',
    zIndex: 1,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.surface,
    ...SHADOWS.md,
  },
  cardWeb: {
    cursor: 'pointer',
    // @ts-ignore - Web-specific styles
    userSelect: 'none',
  },
  iconShell: {
    width: 72,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: `${COLORS.primaryLight}`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  description: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.sm,
    lineHeight: 20,
  },
  selectedIndicator: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs / 2,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primaryLight}`,
  },
});
