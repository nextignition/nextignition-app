import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  FONT_FAMILY,
  BORDER_RADIUS,
  SHADOWS,
} from '@/constants/theme';
import {
  UserRound,
  Settings,
  LogOut,
  HelpCircle,
  Bell,
  CreditCard,
  ShieldCheck,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useResponsive } from '@/hooks/useResponsive';

interface ProfileMenuProps {
  visible: boolean;
  onClose: () => void;
}

export function ProfileMenu({ visible, onClose }: ProfileMenuProps) {
  const { profile, signOut } = useAuth();
  const { isMobile } = useResponsive();

  const baseMenuItems = [
    {
      icon: UserRound,
      label: 'View Profile',
      route: '/(tabs)/profile',
      color: COLORS.text,
    },
    // Settings option commented out - keep for future use
    // {
    //   icon: Settings,
    //   label: 'Settings',
    //   route: '/(tabs)/settings',
    //   color: COLORS.text,
    // },
    {
      icon: Bell,
      label: 'Notifications',
      route: '/(tabs)/notifications',
      color: COLORS.text,
    },
    {
      icon: CreditCard,
      label: 'Subscription',
      route: '/(tabs)/subscription',
      color: COLORS.text,
    },
    {
      icon: HelpCircle,
      label: 'Help & Support',
      route: '/(tabs)/help',
      color: COLORS.text,
    },
    {
      icon: LogOut,
      label: 'Sign Out',
      action: signOut,
      color: COLORS.error,
    },
  ];

  // Add admin dashboard option if user is admin
  const menuItems = profile?.role === 'admin'
    ? [
        {
          icon: ShieldCheck,
          label: 'Admin Dashboard',
          route: '/(admin)/dashboard',
          color: COLORS.primary,
        },
        ...baseMenuItems,
      ]
    : baseMenuItems;

  const handleItemPress = (item: typeof menuItems[0]) => {
    onClose();
    
    // Prevent redundant navigation - use setTimeout to ensure modal closes first
    setTimeout(() => {
      if (item.action) {
        item.action();
      } else if (item.route) {
        router.push(item.route);
      }
    }, 100);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Close menu">
        <View
          style={[
            styles.menu,
            isMobile && styles.menuMobile,
          ]}
          onStartShouldSetResponder={() => true}>
          <View style={styles.menuHeader}>
            <View style={styles.avatar}>
              <UserRound size={24} color={COLORS.primary} strokeWidth={2} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{profile?.full_name || 'User'}</Text>
              <Text style={styles.userEmail}>{profile?.email || 'user@example.com'}</Text>
            </View>
          </View>

          <View style={styles.menuItems}>
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <TouchableOpacity
                  key={item.label}
                  style={styles.menuItem}
                  onPress={() => handleItemPress(item)}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={item.label}>
                  <Icon size={20} color={item.color} strokeWidth={2} />
                  <Text style={[styles.menuItemText, { color: item.color }]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: SPACING.md,
  },
  menu: {
    width: 320,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xl,
    ...SHADOWS.lg,
    overflow: 'hidden',
  },
  menuMobile: {
    width: '100%',
    maxWidth: 320,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  userEmail: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  menuItems: {
    padding: SPACING.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  menuItemText: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
  },
});

