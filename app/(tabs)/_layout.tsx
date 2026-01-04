import { useEffect } from 'react';
import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Home, UsersRound, UserRound, MessageSquare, BarChart3, BriefcaseBusiness, Users } from 'lucide-react-native';
import { useConversations } from '@/hooks/useChat';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, BORDER_RADIUS, FONT_SIZES, FONT_WEIGHTS, FONT_FAMILY } from '@/constants/theme';
import type { UserRole } from '@/types/user';

function ChatTabIcon({ size, color }: { size: number; color: string }) {
  const { totalUnread } = useConversations();

  return (
    <View style={{ position: 'relative' }}>
      <MessageSquare size={22} color={color} strokeWidth={2.5} />
      {totalUnread > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {totalUnread > 99 ? '99+' : totalUnread}
          </Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const { session, loading, profile } = useAuth();
  const userRole = profile?.role as UserRole | undefined;

  useEffect(() => {
    if (!loading && !session) {
      router.replace('/(auth)/login');
    }
  }, [session, loading]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!session) {
    return null;
  }
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.background,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingTop: Platform.OS === 'ios' ? 4 : 2,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          height: Platform.OS === 'ios' ? 90 : 72,
          elevation: 8,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.1,
          shadowRadius: 4,
        },
        tabBarLabelStyle: {
          fontSize: FONT_SIZES.xs,
          fontFamily: FONT_FAMILY.bodyMedium,
          fontWeight: FONT_WEIGHTS.medium.toString(),
          marginTop: 2,
          marginBottom: 0,
          paddingBottom: 0,
          lineHeight: 16,
          textTransform: 'none',
          includeFontPadding: false,
          textAlignVertical: 'center',
        },
        tabBarIconStyle: {
          marginTop: 0,
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 0,
          paddingTop: 4,
          paddingBottom: 2,
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarShowLabel: true,
        tabBarHideOnKeyboard: true,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Home 
                size={22} 
                color={focused ? COLORS.primary : color || COLORS.textSecondary} 
                strokeWidth={2.5} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="founder-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="investor-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="expert-dashboard"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="network"
        options={{
          title: 'Network',
          tabBarLabel: 'Network',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <UsersRound 
                size={22} 
                color={focused ? COLORS.primary : color || COLORS.textSecondary} 
                strokeWidth={2.5} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarLabel: 'Chat',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <ChatTabIcon 
                size={22} 
                color={focused ? COLORS.primary : color || COLORS.textSecondary} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="funding"
        options={{
          title: 'Funding',
          tabBarLabel: 'Funding',
          // Show for founders and investors
          href: (userRole === 'founder' || userRole === 'cofounder' || userRole === 'investor') ? '/funding' : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <BarChart3 
                size={22} 
                color={focused ? COLORS.primary : color || COLORS.textSecondary} 
                strokeWidth={2.5} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="mentorship"
        options={{
          title: 'Mentorship',
          tabBarLabel: 'Find Experts',
          // Show for founders and cofounders
          href: (userRole === 'founder' || userRole === 'cofounder') ? '/mentorship' : null,
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <Users 
                size={22} 
                color={focused ? COLORS.primary : color || COLORS.textSecondary} 
                strokeWidth={2.5} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="opportunities"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={styles.iconContainer}>
              <UserRound 
                size={22} 
                color={focused ? COLORS.primary : color || COLORS.textSecondary} 
                strokeWidth={2.5} 
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="edit-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pitch-upload"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="pitch-video"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="webinars"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="documents"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="feed"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="reviews"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="payment"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="subscription"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="startup-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="funding-status"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="device-management"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="startup-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="expert-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="expert-sessions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="expert-analytics"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="host-webinar"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="investor-profile"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="investor-detail"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="startup-discovery"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="help"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="schedule-meeting"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="request-mentorship"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="availability"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="review-session"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 22,
    height: 22,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: 18,
    height: 18,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    zIndex: 1,
  },
  badgeText: {
    fontSize: FONT_SIZES.xs,
    fontWeight: FONT_WEIGHTS.bold,
    color: COLORS.background,
  },
});
