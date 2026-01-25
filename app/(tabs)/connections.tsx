import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '@/contexts/AuthContext';
import { getOrCreateDirectConversation } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';
import { LoadingScreen } from '@/components/LoadingScreen';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import {
  Users,
  MessageSquare,
  ChevronRight,
  AlertCircle,
} from 'lucide-react-native';
import { Alert } from 'react-native';

interface ConnectionUser {
  id: string;
  full_name: string | null;
  email: string;
  role: string | null;
  conversation_id: string;
}

export default function ConnectionsScreen() {
  const { user, profile } = useAuth();
  const [connections, setConnections] = useState<ConnectionUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchConnections = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get all direct conversations for the user
      const { data: allMemberships, error: membershipsError } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          conversations (
            id,
            is_group
          )
        `)
        .eq('profile_id', user.id);

      if (membershipsError) throw membershipsError;

      // Filter to only direct conversations (is_group = false)
      const directConversations = (allMemberships || []).filter((cm: any) => {
        const conv = cm.conversations;
        return conv && conv.is_group === false;
      });

      const directConversationIds = directConversations
        .map((dc: any) => dc.conversation_id)
        .filter((id: string) => id);

      if (directConversationIds.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      // Get other members from these direct conversations
      const { data: otherMembers, error: membersError } = await supabase
        .from('conversation_members')
        .select('profile_id, conversation_id')
        .in('conversation_id', directConversationIds)
        .neq('profile_id', user.id);

      if (membersError) throw membersError;

      // Get unique user IDs and their conversation IDs
      const userConversationMap = new Map<string, string>();
      otherMembers?.forEach((m: any) => {
        if (!userConversationMap.has(m.profile_id)) {
          userConversationMap.set(m.profile_id, m.conversation_id);
        }
      });

      const userIds = Array.from(userConversationMap.keys());

      if (userIds.length === 0) {
        setConnections([]);
        setLoading(false);
        return;
      }

      // Fetch profile data for these users
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .in('id', userIds);

      if (profilesError) throw profilesError;

      // Map profiles to connections with conversation_id
      const connectionsList: ConnectionUser[] = (profilesData || []).map((profile: any) => ({
        id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        role: profile.role,
        conversation_id: userConversationMap.get(profile.id) || '',
      }));

      // Sort by name
      connectionsList.sort((a, b) => {
        const nameA = a.full_name || a.email || '';
        const nameB = b.full_name || b.email || '';
        return nameA.localeCompare(nameB);
      });

      setConnections(connectionsList);
    } catch (err: any) {
      console.error('Error fetching connections:', err);
      setError(err.message || 'Failed to fetch connections');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConnections();
    setRefreshing(false);
  };

  const handleChat = async (connection: ConnectionUser) => {
    if (!user?.id) {
      Alert.alert('Error', 'You must be logged in to start a chat');
      return;
    }

    setActionLoading(`chat-${connection.id}`);
    try {
      // If we already have a conversation_id, use it directly
      if (connection.conversation_id) {
        const userName = connection.full_name || connection.email || 'User';
        router.push(`/(tabs)/chat?conversationId=${connection.conversation_id}&userName=${encodeURIComponent(userName)}`);
        setActionLoading(null);
        return;
      }

      // Otherwise, create a new conversation
      const userName = connection.full_name || connection.email || 'User';
      const { conversationId, error: chatError } = await getOrCreateDirectConversation(
        user.id,
        connection.id,
        userName
      );

      if (chatError || !conversationId) {
        Alert.alert('Error', chatError || 'Failed to start conversation');
        setActionLoading(null);
        return;
      }

      router.push(`/(tabs)/chat?conversationId=${conversationId}&userName=${encodeURIComponent(userName)}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to start chat');
    } finally {
      setActionLoading(null);
    }
  };

  const handleViewProfile = (profileId: string, role: string) => {
    Alert.alert('Coming Soon', 'Profile view feature will be available soon!');
  };

  const renderConnectionItem = ({ item }: { item: ConnectionUser }) => {
    const userName = item.full_name || item.email || 'Unknown User';
    const userRole = item.role || 'user';
    const isLoading = actionLoading === `chat-${item.id}`;

    return (
      <View style={styles.connectionCard}>
        <TouchableOpacity
          style={styles.connectionContent}
          onPress={() => handleViewProfile(item.id, userRole)}
          activeOpacity={0.7}>
          <View style={styles.avatarContainer}>
            <View style={styles.avatar}>
              <Users size={24} color={COLORS.primary} strokeWidth={2} />
            </View>
          </View>
          <View style={styles.connectionInfo}>
            <Text style={styles.connectionName}>{userName}</Text>
            <Text style={styles.connectionRole}>{userRole.charAt(0).toUpperCase() + userRole.slice(1)}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.connectionActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => handleChat(item)}
            disabled={isLoading}
            activeOpacity={0.7}>
            {isLoading ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MessageSquare size={18} color={COLORS.primary} strokeWidth={2} />
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.viewButton}
            onPress={() => handleViewProfile(item.id, userRole)}
            activeOpacity={0.7}>
            <ChevronRight size={20} color={COLORS.textSecondary} strokeWidth={2} />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  if (loading && !refreshing) {
    return <LoadingScreen />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          activeOpacity={0.7}>
          <ChevronRight
            size={24}
            color={COLORS.text}
            strokeWidth={2}
            style={styles.backIcon}
          />
        </TouchableOpacity>
        <Text style={styles.title}>Connections</Text>
        <View style={styles.headerSpacer} />
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <AlertCircle size={20} color={COLORS.error} strokeWidth={2} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {connections.length === 0 ? (
        <View style={styles.emptyState}>
          <Users size={64} color={COLORS.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>No connections yet</Text>
          <Text style={styles.emptySubtitle}>
            Start connecting with others from the network page
          </Text>
        </View>
      ) : (
        <FlatList
          data={connections}
          renderItem={renderConnectionItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={COLORS.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backIcon: {
    transform: [{ rotate: '180deg' }],
  },
  title: {
    ...TYPOGRAPHY.heading,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    margin: SPACING.lg,
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.error,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    flex: 1,
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  connectionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  connectionContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  avatarContainer: {
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectionInfo: {
    flex: 1,
    gap: SPACING.xs / 2,
  },
  connectionName: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    fontSize: FONT_SIZES.md,
  },
  connectionRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    textTransform: 'capitalize',
  },
  connectionActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  viewButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl * 2,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },
  emptySubtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});

