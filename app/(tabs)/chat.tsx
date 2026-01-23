import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  Alert,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useConversations, useMessages, useTypingIndicator, useBroadcastPresence, usePresence, markMessagesAsRead } from '@/hooks/useChat';
import { supabase } from '@/lib/supabase';
import { MessageBubble } from '@/components/chat/MessageBubble';
import { ChatInput } from '@/components/chat/ChatInput';
import { ConversationItem } from '@/components/chat/ConversationItem';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { LoadingScreen } from '@/components/LoadingScreen';
import { useAuth } from '@/contexts/AuthContext';
import { COLORS, SPACING, FONT_SIZES, BORDER_RADIUS, SHADOWS, FONT_FAMILY, TYPOGRAPHY } from '@/constants/theme';
import { Hash, MessageSquare, ChevronLeft } from 'lucide-react-native';
import { Conversation, Message } from '@/types/chat';

type TabType = 'channels' | 'direct';

// MessageList component with auto-scroll
const MessageList = React.forwardRef<FlatList, { 
  messages: Message[]; 
  typingUsers: string[]; 
  conversationId: string | null;
  onReply?: (message: Message) => void;
  onDelete?: (messageId: string) => void;
}>(({ 
  messages, 
  typingUsers, 
  conversationId,
  onReply,
  onDelete,
}, ref) => {
  const flatListRef = useRef<FlatList>(null);
  
  // Use forwarded ref or internal ref
  const listRef = (ref as React.RefObject<FlatList>) || flatListRef;
  const { user } = useAuth();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      requestAnimationFrame(() => {
        listRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  return (
    <FlatList
      ref={listRef}
      data={messages}
      renderItem={({ item }) => (
        <MessageBubble 
          message={item} 
          onReply={onReply}
          onDelete={onDelete}
        />
      )}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.messagesList}
      style={styles.messagesListContainer}
      showsVerticalScrollIndicator={false}
      inverted={false}
      keyboardShouldPersistTaps="handled"
      ListEmptyComponent={
        <View style={styles.emptyMessages}>
          <MessageSquare size={48} color={COLORS.textSecondary} />
          <Text style={styles.emptyMessagesText}>No messages yet</Text>
          <Text style={styles.emptyMessagesSubtext}>
            Start the conversation!
          </Text>
        </View>
      }
      ListFooterComponent={<TypingIndicator typingUsers={typingUsers} />}
    />
  );
});

MessageList.displayName = 'MessageList';

export default function ChatScreen() {
  const params = useLocalSearchParams();
  const { profile } = useAuth();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<TabType>('direct');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const { channels, directMessages, loading: conversationsLoading, conversations, refresh } = useConversations();
  const { messages, sendMessage, loading: messagesLoading } = useMessages(selectedConversation?.id || null);
  const { typingUsers, startTyping, stopTyping } = useTypingIndicator(selectedConversation?.id || null);
  const messageListRef = useRef<FlatList>(null);
  
  // Broadcast own presence
  useBroadcastPresence();
  
  // Scroll to bottom when keyboard opens
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        // Small delay to ensure layout has adjusted
        setTimeout(() => {
          messageListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);
  
  // Get other user's presence in direct chat
  // Need to fetch the other user's ID from conversation members
  const [otherUserId, setOtherUserId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchOtherUserId = async () => {
      if (!selectedConversation?.id || !profile?.id || selectedConversation.type !== 'direct') {
        setOtherUserId(null);
        return;
      }

      try {
        // Get conversation members to find the other user
        const { data: members, error } = await supabase
          .from('conversation_members')
          .select('profile_id')
          .eq('conversation_id', selectedConversation.id)
          .neq('profile_id', profile.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error('[ChatScreen] Error fetching other user ID:', error);
          // If error fetching members, this might be a self-conversation or invalid conversation
          // Close the conversation to prevent errors
          if (error.code === 'PGRST116' || error.message?.includes('No rows')) {
            console.log('[ChatScreen] No other members found, closing conversation');
            setSelectedConversation(null);
          }
          setOtherUserId(null);
          return;
        }

        if (members && members.profile_id) {
          console.log('[ChatScreen] Other user ID:', members.profile_id);
          setOtherUserId(members.profile_id);
        } else {
          // No other member found - this is likely a self-conversation
          console.log('[ChatScreen] No other member found, closing conversation');
          setSelectedConversation(null);
          setOtherUserId(null);
        }
      } catch (err: any) {
        console.error('[ChatScreen] Error in fetchOtherUserId:', err);
        // If connection error or other error, close the conversation
        if (err.message?.includes('CONNECTION_CLOSED') || err.message?.includes('network')) {
          console.log('[ChatScreen] Connection error, closing conversation');
          setSelectedConversation(null);
        }
        setOtherUserId(null);
      }
    };

    fetchOtherUserId();
  }, [selectedConversation?.id, profile?.id, selectedConversation?.type]);

  const { isOnline } = usePresence(otherUserId);

  // Debug: Log status changes
  useEffect(() => {
    if (selectedConversation?.type === 'direct') {
      console.log('[ChatScreen] Status Debug:', {
        otherUserId,
        isOnline,
        conversationId: selectedConversation.id,
        conversationName: selectedConversation.name,
      });
    }
  }, [otherUserId, isOnline, selectedConversation]);

  // Debug: Log typing changes
  useEffect(() => {
    console.log('[ChatScreen] Typing Debug:', {
      typingUsers,
      conversationId: selectedConversation?.id,
    });
  }, [typingUsers, selectedConversation?.id]);

  // Handle opening conversation from params (from network page)
  useEffect(() => {
    console.log('Chat params:', params);
    console.log('Conversations count:', conversations.length);
    
    if (params.conversationId) {
      const convId = params.conversationId as string;
      console.log('Looking for conversation:', convId);
      
      // First try to find it in existing conversations
      const conv = conversations.find(c => c.id === convId);
      
      if (conv) {
        console.log('Found existing conversation:', conv);
        setSelectedConversation(conv);
        setActiveTab('direct');
      } else {
        // If not found, create a minimal conversation object
        console.log('Creating minimal conversation object');
        const minimalConv: Conversation = {
          id: convId,
          type: 'direct',
          name: (params.userName as string) || 'User',
          description: undefined,
          last_message: undefined,
          last_message_at: new Date().toISOString(),
          unread_count: 0,
          members: [],
          created_at: new Date().toISOString(),
          is_online: false,
        };
        setSelectedConversation(minimalConv);
        setActiveTab('direct');
        
        // Refresh conversations to get the new one
        if (refresh) {
          console.log('Refreshing conversations...');
          refresh();
        }
      }
    }
  }, [params.conversationId, params.userName, conversations, refresh]);

  // Mark messages as read when screen is focused and conversation is open
  useFocusEffect(
    React.useCallback(() => {
      if (selectedConversation?.id && profile?.id) {
        console.log('Screen focused - marking messages as read');
        markMessagesAsRead(selectedConversation.id, profile.id).then((success) => {
          // Immediate refresh to update unread count in UI
          if (refresh && success) {
            console.log('Refreshing conversation list after marking as read');
            // Refresh immediately - the markMessagesAsRead function will also trigger a refresh
            refresh();
            // Also refresh after a short delay to ensure count updates (for realtime delay)
            setTimeout(() => {
              refresh();
            }, 300);
          }
        });
      }
    }, [selectedConversation?.id, profile?.id, refresh])
  );

  if (conversationsLoading && !selectedConversation) {
    return <LoadingScreen />;
  }

  const currentList = activeTab === 'channels' ? channels : directMessages;

  if (selectedConversation) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.chatContainer}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : -insets.bottom}>
          <View style={styles.chatHeader}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => setSelectedConversation(null)}
              activeOpacity={0.7}>
              <ChevronLeft size={24} color={COLORS.text} strokeWidth={2} />
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatTitle}>{selectedConversation.name}</Text>
              {selectedConversation.description && (
                <Text style={styles.chatSubtitle} numberOfLines={1}>
                  {selectedConversation.description}
                </Text>
              )}
              {selectedConversation.type === 'direct' && (
                <View style={styles.statusRow}>
                  <View
                    style={[
                      styles.statusDot,
                      isOnline ? styles.statusDotOnline : styles.statusDotOffline,
                    ]}
                  />
                  <Text style={[styles.statusText, isOnline && styles.statusTextOnline]}>
                    {isOnline ? 'Online' : 'Offline'}
                  </Text>
                  {__DEV__ && otherUserId && (
                    <Text style={{ fontSize: 9, color: COLORS.textSecondary, marginLeft: 4 }}>
                      ({otherUserId.substring(0, 8)})
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>

          {messagesLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : (
            <MessageList
              ref={messageListRef}
              messages={messages}
              typingUsers={typingUsers}
              conversationId={selectedConversation?.id || null}
              onReply={(message) => {
                // TODO: Implement reply functionality
                Alert.alert('Reply', `Replying to: ${message.content.substring(0, 50)}...`);
              }}
              onDelete={async (messageId) => {
                // Delete message
                try {
                  const { error } = await supabase
                    .from('messages')
                    .update({ deleted: true })
                    .eq('id', messageId);
                  
                  if (error) {
                    Alert.alert('Error', 'Failed to delete message');
                  }
                } catch (err) {
                  Alert.alert('Error', 'Failed to delete message');
                }
              }}
            />
          )}

          <ChatInput 
            onSend={sendMessage} 
            onTypingStart={startTyping}
            onTypingStop={stopTyping}
          />
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
        <TouchableOpacity
          style={styles.newMessageButton}
          onPress={() => {
            // TODO: Open new message modal to search and select user
            Alert.alert('New Message', 'Feature coming soon! Use the network page to start a conversation.');
          }}
          activeOpacity={0.7}>
          <MessageSquare size={20} color={COLORS.primary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'channels' && styles.activeTab]}
          onPress={() => setActiveTab('channels')}
          activeOpacity={0.7}>
          <Hash
            size={20}
            color={activeTab === 'channels' ? COLORS.primary : COLORS.textSecondary}
            strokeWidth={2}
          />
          <Text
            style={[styles.tabText, activeTab === 'channels' && styles.activeTabText]}>
            Channels
          </Text>
          {channels.some((c) => c.unread_count > 0) && <View style={styles.tabBadge} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'direct' && styles.activeTab]}
          onPress={() => setActiveTab('direct')}
          activeOpacity={0.7}>
          <MessageSquare
            size={20}
            color={activeTab === 'direct' ? COLORS.primary : COLORS.textSecondary}
            strokeWidth={2}
          />
          <Text style={[styles.tabText, activeTab === 'direct' && styles.activeTabText]}>
            Direct
          </Text>
          {directMessages.some((c) => c.unread_count > 0) && <View style={styles.tabBadge} />}
        </TouchableOpacity>
      </View>

      {currentList.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={64} color={COLORS.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>
            {activeTab === 'direct' ? 'No conversations yet' : 'No channels yet'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {activeTab === 'direct' 
              ? 'Start a conversation from the network page or create a new message'
              : 'Join a channel to start chatting with the community'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={currentList}
          renderItem={({ item }) => (
            <ConversationItem
              conversation={item}
              onPress={() => setSelectedConversation(item)}
            />
          )}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={conversationsLoading}
              onRefresh={refresh}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  title: {
    ...TYPOGRAPHY.heading,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
    flex: 1,
  },
  newMessageButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    position: 'relative',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  activeTab: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  tabText: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  activeTabText: {
    color: COLORS.primary,
    fontFamily: FONT_FAMILY.bodyBold,
  },
  tabBadge: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.error,
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
  },
  listContent: {
    paddingTop: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  chatContainer: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    ...SHADOWS.xs,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.inputBackground,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatTitle: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  chatSubtitle: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs / 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.textSecondary,
  },
  statusDotOnline: {
    backgroundColor: COLORS.success,
  },
  statusDotOffline: {
    backgroundColor: COLORS.textSecondary,
  },
  statusText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontSize: FONT_SIZES.xs,
  },
  statusTextOnline: {
    color: COLORS.success,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontFamily: FONT_FAMILY.bodyMedium,
    fontSize: FONT_SIZES.md,
    color: COLORS.textSecondary,
  },
  messagesListContainer: {
    flex: 1,
  },
  messagesList: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    flexGrow: 1,
  },
  emptyMessages: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  emptyMessagesText: {
    fontFamily: FONT_FAMILY.displayMedium,
    fontSize: FONT_SIZES.lg,
    color: COLORS.text,
    marginTop: SPACING.md,
  },
  emptyMessagesSubtext: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
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
