import { useState, useEffect, useCallback, useRef } from 'react';
import React from 'react';
import { Message, Conversation, TypingIndicator } from '@/types/chat';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Global callback to refresh conversations when messages are marked as read
let refreshConversationsCallback: (() => void) | null = null;

export function setRefreshConversationsCallback(callback: (() => void) | null) {
  refreshConversationsCallback = callback;
}

// Export function to mark messages as read
export async function markMessagesAsRead(conversationId: string, userId: string) {
  try {
    console.log('[markMessagesAsRead] Starting:', { conversationId, userId });
    
    // Call the database function to mark messages as read
    const { data, error } = await supabase.rpc('mark_messages_as_read', {
      p_conversation_id: conversationId,
      p_profile_id: userId,
    });

    if (error) {
      console.error('[markMessagesAsRead] Error:', error);
      throw error;
    }
    
    console.log('[markMessagesAsRead] Success:', data);
    
    // Immediately trigger conversation list refresh to update unread counts
    if (refreshConversationsCallback) {
      console.log('[markMessagesAsRead] Triggering immediate conversation refresh');
      refreshConversationsCallback();
    }
    
    return true;
  } catch (err) {
    console.error('[markMessagesAsRead] Exception:', err);
    return false;
  }
}

export function useConversations() {
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const fetchingRef = useRef(false);
  const communityChannelEnsuredRef = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!user?.id || !profile?.role) {
      setLoading(false);
      return;
    }

    // Prevent concurrent calls
    if (fetchingRef.current) {
      console.log('[useConversations] Already fetching, skipping...');
      return;
    }

    try {
      fetchingRef.current = true;
      setLoading(true);

      // Ensure community channel exists and user is a member (only once)
      if (!communityChannelEnsuredRef.current) {
        await ensureCommunityChannel(user.id, profile.role);
        communityChannelEnsuredRef.current = true;
      }

      // Get conversations where user is a member
      const { data: memberData, error: memberError } = await supabase
        .from('conversation_members')
        .select(`
          conversation_id,
          conversations:conversation_id (
            id,
            title,
            is_group,
            metadata,
            created_at,
            updated_at
          )
        `)
        .eq('profile_id', user.id);

      if (memberError) throw memberError;

      // Get last message for each conversation and format data
      const conversationIds = memberData.map(m => m.conversation_id);
      
      const conversationsWithMessages = await Promise.all(
        memberData.map(async (member) => {
          const conv = (member as any).conversations;
          
          if (!conv) return null;
          
          // Get last message
          const { data: lastMsg } = await supabase
            .from('messages')
            .select('content, created_at, sender_id')
            .eq('conversation_id', conv.id)
            .eq('deleted', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          // Get unread count - messages that user hasn't read yet
          // Count messages where sender is not the current user and no read receipt exists
          const { data: unreadMessages, error: unreadError } = await supabase
            .from('messages')
            .select('id')
            .eq('conversation_id', conv.id)
            .eq('deleted', false)
            .neq('sender_id', user.id);

          if (unreadError) {
            console.error('[useConversations] Error fetching unread messages:', unreadError);
          }

          let unreadCount = 0;
          if (unreadMessages && unreadMessages.length > 0) {
            console.log(`[useConversations] Conversation ${conv.id}: ${unreadMessages.length} messages from others`);
            
            // Check which messages have been read
            const { data: readReceipts, error: readError } = await supabase
              .from('message_reads')
              .select('message_id')
              .in('message_id', unreadMessages.map(m => m.id))
              .eq('profile_id', user.id);

            if (readError) {
              console.error('[useConversations] Error fetching read receipts:', readError);
            }

            const readMessageIds = new Set(readReceipts?.map(r => r.message_id) || []);
            unreadCount = unreadMessages.filter(m => !readMessageIds.has(m.id)).length;
            
            console.log(`[useConversations] Conversation ${conv.id}: ${readReceipts?.length || 0} read receipts, ${unreadCount} unread messages`);
            console.log(`[useConversations] Unread message IDs:`, unreadMessages.filter(m => !readMessageIds.has(m.id)).map(m => m.id));
          } else {
            console.log(`[useConversations] Conversation ${conv.id}: No unread messages`);
          }

          // Get all members for this conversation
          const { data: allMembers, error: membersError } = await supabase
            .from('conversation_members')
            .select('profile_id, profiles:profile_id(full_name)')
            .eq('conversation_id', conv.id);

          // If there's an error fetching members or no members, filter out the conversation
          if (membersError || !allMembers || allMembers.length === 0) {
            console.log(`[useConversations] Filtering out conversation with no members or error: ${conv.id}`, membersError);
            return null;
          }

          // Get other members (excluding current user)
          const otherMembers = allMembers.filter(m => m.profile_id !== user.id);
          
          // Get current user's profile name for comparison
          const currentUserName = profile?.full_name || '';
          
          // Filter out self-conversations:
          // 1. Direct conversations with only 1 member (the current user)
          // 2. Direct conversations where all members are the same user (duplicate entries)
          // 3. Direct conversations with no other members
          // 4. Direct conversations where the title matches the current user's name (self-chat)
          const isSelfConversation = !conv.is_group && (
            allMembers.length === 1 || 
            otherMembers.length === 0 ||
            (allMembers.length === 2 && allMembers[0].profile_id === allMembers[1].profile_id) ||
            (conv.title && currentUserName && conv.title.trim() === currentUserName.trim())
          );
          
          if (isSelfConversation) {
            console.log(`[useConversations] Filtering out self-conversation: ${conv.id} (members: ${allMembers.length}, title: ${conv.title}, user: ${currentUserName})`);
            return null;
          }

          const isGroup = conv.is_group || (allMembers && allMembers.length > 2);
          const otherMember = otherMembers && otherMembers.length > 0 
            ? (otherMembers[0] as any).profiles?.full_name 
            : null;

          // For direct messages, ensure we use the other member's name, not the conversation title
          // (in case the title was incorrectly set to the current user's name)
          const conversationName = isGroup 
            ? (conv.title || 'Channel')
            : (otherMember || conv.title || 'Unknown');

          return {
            id: conv.id,
            type: isGroup ? 'channel' : 'direct',
            name: conversationName,
            description: conv.metadata?.description || null,
            last_message: lastMsg?.content || null,
            last_message_at: lastMsg?.created_at || conv.created_at,
            unread_count: unreadCount,
            members: [], // simplified
            created_at: conv.created_at,
          } as Conversation;
        })
      );

      // Filter out nulls and deduplicate community channels (only keep one)
      const validConversations = conversationsWithMessages.filter(c => c !== null);
      
      // Deduplicate community channels - only keep the one matching the cached global channel ID
      // If we have a cached channel ID, prefer that one; otherwise use the first one found
      const communityChannelId = globalCommunityChannelId;
      const seenCommunityChannelIds = new Set<string>();
      
      const deduplicatedConversations = validConversations.filter((conv) => {
        if (conv && conv.type === 'channel' && conv.name === 'Community Chat') {
          // If we have a cached channel ID, only keep that one
          if (communityChannelId) {
            if (conv.id === communityChannelId) {
              // This is the canonical community channel
              if (seenCommunityChannelIds.has(conv.id)) {
                return false; // Already seen this one
              }
              seenCommunityChannelIds.add(conv.id);
              return true;
            } else {
              // This is a duplicate, skip it
              return false;
            }
          } else {
            // No cached ID yet, keep the first one we see
            if (seenCommunityChannelIds.has('Community Chat')) {
              return false; // Already seen a community channel
            }
            seenCommunityChannelIds.add('Community Chat');
            return true;
          }
        }
        return true;
      });

      setConversations(deduplicatedConversations.sort((a, b) => {
        const dateA = a?.last_message_at ? new Date(a.last_message_at).getTime() : 0;
        const dateB = b?.last_message_at ? new Date(b.last_message_at).getTime() : 0;
        return dateB - dateA;
      }));
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
      fetchingRef.current = false;
    }
  }, [user?.id, profile?.role]);

  useEffect(() => {
    // Register refresh callback so markMessagesAsRead can trigger immediate refresh
    setRefreshConversationsCallback(fetchConversations);
    
    fetchConversations();

      // Set up realtime subscription for new messages to update conversation list
    if (user?.id) {
      console.log('[useConversations] Setting up realtime subscriptions for user:', user.id);
      
      // Create separate channels to avoid conflicts
      const messagesChannel = supabase
        .channel(`conv_messages_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('[useConversations] New message event detected:', payload.eventType);
            // Debounce refresh to avoid too many updates
            if (!fetchingRef.current) {
              setTimeout(() => {
                fetchConversations();
              }, 500);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          (payload) => {
            console.log('[useConversations] Message update event detected');
            if (!fetchingRef.current) {
              setTimeout(() => {
                fetchConversations();
              }, 500);
            }
          }
        )
        .subscribe((status) => {
          console.log('[useConversations] Messages channel status:', status);
        });

      const readsChannel = supabase
        .channel(`conv_reads_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reads',
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[useConversations] Message read event detected (by current user), refreshing...', payload);
            // Immediate refresh when messages are marked as read by current user
            if (!fetchingRef.current) {
              fetchConversations();
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reads',
          },
          (payload) => {
            console.log('[useConversations] Message read event detected (any user), refreshing...', payload);
            // Also refresh when any user marks messages as read (to update unread counts)
            if (!fetchingRef.current) {
              setTimeout(() => {
                fetchConversations();
              }, 200);
            }
          }
        )
        .subscribe((status) => {
          console.log('[useConversations] Reads channel status:', status);
        });

      // Also listen to conversation updates
      const conversationsChannel = supabase
        .channel(`conv_updates_${user.id}_${Date.now()}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'conversation_members',
            filter: `profile_id=eq.${user.id}`,
          },
          (payload) => {
            console.log('[useConversations] Conversation member change detected');
            if (!fetchingRef.current) {
              setTimeout(() => {
                fetchConversations();
              }, 500);
            }
          }
        )
        .subscribe((status) => {
          console.log('[useConversations] Conversations channel status:', status);
        });

      return () => {
        console.log('[useConversations] Cleaning up subscriptions');
        // Clear refresh callback on unmount
        setRefreshConversationsCallback(null);
        supabase.removeChannel(messagesChannel);
        supabase.removeChannel(readsChannel);
        supabase.removeChannel(conversationsChannel);
      };
    }
  }, [fetchConversations, user?.id, profile?.role]);

  const channels = conversations.filter((c) => c.type === 'channel');
  const directMessages = conversations.filter((c) => c.type === 'direct');
  const totalUnread = conversations.reduce((sum, c) => sum + c.unread_count, 0);

  return { conversations, channels, directMessages, totalUnread, loading, refresh: fetchConversations };
}

// Global variable to cache the community channel ID to prevent multiple lookups
let globalCommunityChannelId: string | null = null;
let globalCommunityChannelPromise: Promise<string | null> | null = null;

// Function to ensure community channel exists and auto-join users
export async function ensureCommunityChannel(userId: string, userRole: string): Promise<string | null> {
  try {
    // Only allow founders, investors, and experts
    const allowedRoles = ['founder', 'cofounder', 'investor', 'expert'];
    if (!allowedRoles.includes(userRole)) {
      return null;
    }

    // If we already have the channel ID cached, use it
    if (globalCommunityChannelId) {
      // Still check if user is a member
      const { data: existingMember } = await supabase
        .from('conversation_members')
        .select('id')
        .eq('conversation_id', globalCommunityChannelId)
        .eq('profile_id', userId)
        .maybeSingle();

      if (!existingMember) {
        await supabase
          .from('conversation_members')
          .insert({
            conversation_id: globalCommunityChannelId,
            profile_id: userId,
            role: 'member',
          });
      }
      return globalCommunityChannelId;
    }

    // If there's already a lookup in progress, wait for it
    if (globalCommunityChannelPromise) {
      return await globalCommunityChannelPromise;
    }

    // Start the lookup process
    globalCommunityChannelPromise = (async () => {
      try {
        // Check if community channel already exists - find THE single one
        // Use a more specific query to find the canonical community channel
        const { data: existingChannels, error: findError } = await supabase
          .from('conversations')
          .select('id, created_at, metadata')
          .eq('is_group', true)
          .eq('title', 'Community Chat')
          .order('created_at', { ascending: true })
          .limit(50); // Get more to ensure we find the right one

        if (findError && findError.code !== 'PGRST116') {
          console.error('[ensureCommunityChannel] Error finding channel:', findError);
          throw findError;
        }

        let channelId: string;

        if (existingChannels && existingChannels.length > 0) {
          // Prioritize channels with metadata.type = 'community' or unique_id = 'global-community-chat'
          const preferredChannel = existingChannels.find(
            (ch: any) => 
              (ch.metadata && typeof ch.metadata === 'object' && 
               (ch.metadata.type === 'community' || ch.metadata.unique_id === 'global-community-chat'))
          );
          
          // Use preferred channel if found, otherwise use the oldest one
          channelId = preferredChannel?.id || existingChannels[0].id;
          console.log('[ensureCommunityChannel] Found existing community channel:', channelId);
          
          // If multiple channels exist, log warning
          if (existingChannels.length > 1) {
            console.warn(`[ensureCommunityChannel] Multiple community channels found (${existingChannels.length}), using:`, channelId);
          }
        } else {
          // Create community channel with unique identifier in metadata
          const { data: newChannel, error: createError } = await supabase
            .from('conversations')
            .insert({
              title: 'Community Chat',
              is_group: true,
              metadata: {
                description: 'A shared channel for Founders, Investors, and Experts to connect and collaborate',
                type: 'community',
                unique_id: 'global-community-chat', // Unique identifier to prevent duplicates
              },
            })
            .select('id')
            .single();

          if (createError) {
            // If creation fails due to duplicate, try to find existing one
            if (createError.code === '23505' || createError.message?.includes('duplicate')) {
              console.log('[ensureCommunityChannel] Channel creation failed (duplicate), finding existing...');
              const { data: retryChannels } = await supabase
                .from('conversations')
                .select('id')
                .eq('is_group', true)
                .eq('title', 'Community Chat')
                .order('created_at', { ascending: true })
                .limit(1)
                .maybeSingle();
              
              if (retryChannels) {
                channelId = retryChannels.id;
              } else {
                throw createError;
              }
            } else {
              console.error('[ensureCommunityChannel] Error creating channel:', createError);
              throw createError;
            }
          } else {
            channelId = newChannel.id;
            console.log('[ensureCommunityChannel] Created new community channel:', channelId);
          }
        }

        // Cache the channel ID globally
        globalCommunityChannelId = channelId;

        // Check if user is already a member
        const { data: existingMember } = await supabase
          .from('conversation_members')
          .select('id')
          .eq('conversation_id', channelId)
          .eq('profile_id', userId)
          .maybeSingle();

        if (!existingMember) {
          // Add user as member
          const { error: memberError } = await supabase
            .from('conversation_members')
            .insert({
              conversation_id: channelId,
              profile_id: userId,
              role: 'member',
            });

          if (memberError) {
            console.error('[ensureCommunityChannel] Error adding member:', memberError);
            // Don't throw - user might already be a member from concurrent call
          }
        }

        return channelId;
      } finally {
        // Clear the promise so next call can start fresh if needed
        globalCommunityChannelPromise = null;
      }
    })();

    return await globalCommunityChannelPromise;
  } catch (err) {
    console.error('[ensureCommunityChannel] Error:', err);
    return null;
  }
}

export function useMessages(conversationId: string | null) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user?.id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Fetch messages with sender profiles (avoid join with message_reads to prevent issues)
      const { data, error } = await supabase
        .from('messages')
        .select(`
          id,
          conversation_id,
          sender_id,
          content,
          metadata,
          created_at,
          profiles:sender_id(full_name, role)
        `)
        .eq('conversation_id', conversationId)
        .eq('deleted', false)
        .order('created_at', { ascending: true });

      if (error) throw error;

      // Get read receipts separately to avoid join issues
      const messageIds = (data || []).map((m: any) => m.id);
      let readReceipts: any[] = [];
      if (messageIds.length > 0) {
        const { data: receipts } = await supabase
          .from('message_reads')
          .select('message_id, profile_id')
          .in('message_id', messageIds);
        readReceipts = receipts || [];
      }

      // Create a map of message_id -> read_by array
      const readByMap = new Map<string, string[]>();
      readReceipts?.forEach((receipt: any) => {
        if (!readByMap.has(receipt.message_id)) {
          readByMap.set(receipt.message_id, []);
        }
        readByMap.get(receipt.message_id)?.push(receipt.profile_id);
      });

      const formattedMessages: Message[] = (data || []).map((msg: any) => ({
        id: msg.id,
        conversation_id: msg.conversation_id,
        sender_id: msg.sender_id,
        sender_name: msg.profiles?.full_name || 'Unknown',
        sender_role: msg.profiles?.role || null,
        content: msg.content,
        type: 'text',
        created_at: msg.created_at,
        read_by: readByMap.get(msg.id) || [],
      }));

      setMessages(formattedMessages);
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    fetchMessages();

    // Mark messages as read when viewing the conversation
    if (conversationId && user?.id) {
      markMessagesAsRead(conversationId, user.id).then(() => {
        console.log('[useMessages] Messages marked as read, unread count should update');
      });
    }

    // Set up realtime subscription for new messages
    if (conversationId && user?.id) {
      console.log(`[useMessages] Setting up realtime subscription for conversation: ${conversationId}`);
      
      // Use a unique channel name to avoid conflicts
      const channelName = `messages:${conversationId}:${user.id}:${Date.now()}`;
      const channel = supabase.channel(channelName)
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `conversation_id=eq.${conversationId}`,
          },
          async (payload) => {
            console.log('[useMessages] New message received via realtime:', payload);
            
            const newMessage = payload.new as any;
            
            // Check if message already exists (avoid duplicates)
            setMessages(prev => {
              if (prev.some(m => m.id === newMessage.id)) {
                console.log('[useMessages] Message already exists, skipping');
                return prev;
              }
              return prev;
            });
            
            // Fetch the message with sender profile and read receipts
            const { data: msgData, error: msgError } = await supabase
              .from('messages')
              .select('id, conversation_id, sender_id, content, created_at, profiles:sender_id(full_name, role)')
              .eq('id', newMessage.id)
              .single();

            if (msgData && !msgError) {
              // Get read receipts for this message
              const { data: readReceipts } = await supabase
                .from('message_reads')
                .select('profile_id')
                .eq('message_id', newMessage.id);

              const formattedMessage: Message = {
                id: msgData.id,
                conversation_id: msgData.conversation_id,
                sender_id: msgData.sender_id,
                sender_name: (msgData as any).profiles?.full_name || 'Unknown',
                sender_role: (msgData as any).profiles?.role || null,
                content: msgData.content,
                type: 'text',
                created_at: msgData.created_at,
                read_by: readReceipts?.map((r: any) => r.profile_id) || [],
              };

              setMessages(prev => {
                // Double-check to avoid duplicates
                if (prev.some(m => m.id === formattedMessage.id)) {
                  console.log('[useMessages] Duplicate detected, skipping');
                  return prev;
                }
                console.log('[useMessages] Adding new message to state:', formattedMessage.id);
                // Add to end of array (newest messages at bottom)
                return [...prev, formattedMessage];
              });

              // Mark as read since conversation is open
              if (newMessage.sender_id !== user.id) {
                markMessagesAsRead(conversationId, user.id).then(() => {
                  console.log('[useMessages] Marked incoming message as read');
                  // Update read_by for this message
                  setMessages(prev => 
                    prev.map(m => 
                      m.id === formattedMessage.id 
                        ? { ...m, read_by: [...(m.read_by || []), user.id] }
                        : m
                    )
                  );
                });
              }
            } else {
              console.error('[useMessages] Error fetching message data:', msgError);
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'message_reads',
          },
          (payload) => {
            console.log('[useMessages] Read receipt added:', payload);
            const newRead = payload.new as any;
            setMessages(prev =>
              prev.map(m => {
                if (m.id === newRead.message_id && !m.read_by?.includes(newRead.profile_id)) {
                  return { ...m, read_by: [...(m.read_by || []), newRead.profile_id] };
                }
                return m;
              })
            );
          }
        )
        .subscribe((status) => {
          console.log(`[useMessages] Channel ${channelName} status:`, status);
          if (status === 'SUBSCRIBED') {
            console.log('[useMessages] ✅ Successfully subscribed to realtime updates');
          } else if (status === 'CHANNEL_ERROR') {
            console.error('[useMessages] ❌ Channel subscription error');
          } else if (status === 'TIMED_OUT') {
            console.warn('[useMessages] ⚠️ Channel subscription timed out, retrying...');
            // Channel will auto-retry
          }
        });

      return () => {
        console.log(`[useMessages] Cleaning up realtime subscription for ${conversationId}`);
        supabase.removeChannel(channel);
      };
    }
  }, [conversationId, user?.id, fetchMessages]);

  const sendMessage = async (content: string) => {
    if (!conversationId || !content.trim() || !user?.id) return;

    try {
      console.log('Sending message:', content);
      
      // Optimistic update - add message immediately to UI
      const optimisticMessage: Message = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        sender_name: profile?.full_name || 'You',
        sender_role: profile?.role || null,
        content: content.trim(),
        type: 'text',
        created_at: new Date().toISOString(),
        read_by: [],
      };
      
      setMessages(prev => [...prev, optimisticMessage]);

      // Insert into database
      const { data, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content.trim(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error sending message:', error);
        // Remove optimistic message on error
        setMessages(prev => prev.filter(m => m.id !== optimisticMessage.id));
        throw error;
      }

      console.log('Message sent successfully:', data);
      
      // Replace optimistic message with real one
      if (data) {
        setMessages(prev => {
          // Check if message already exists (from realtime)
          const exists = prev.some(m => m.id === data.id);
          if (exists) {
            // Remove optimistic message if real one already exists
            return prev.filter(m => m.id !== optimisticMessage.id);
          }
          // Replace optimistic with real
          return prev.map(m => m.id === optimisticMessage.id ? {
            ...optimisticMessage,
            id: data.id,
            created_at: data.created_at,
          } : m);
        });
      }
    } catch (err) {
      console.error('Error sending message:', err);
    }
  };

  return { messages, loading, sendMessage };
}

export function useTypingIndicator(conversationId: string | null) {
  const { user, profile } = useAuth();
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const channelRef = React.useRef<any>(null);

  useEffect(() => {
    if (!conversationId || !user?.id) {
      setTypingUsers([]);
      return;
    }

    console.log(`[useTypingIndicator] Setting up typing indicator for conversation: ${conversationId}`);

    // Subscribe to typing events on conversation-specific channel (consistent name, no timestamp)
    const channel = supabase.channel(`typing:${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Filter out current user and only get users who are typing
        const typing: string[] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            // Only add if it's not the current user and they are typing
            if (presence.user_id !== user.id && presence.typing) {
              typing.push(presence.name || 'User');
            }
          }
        });
        console.log(`[useTypingIndicator] Typing users:`, typing);
        setTypingUsers(typing);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('[useTypingIndicator] User joined typing:', newPresences);
        const typing = newPresences
          .filter((p: any) => p.user_id !== user.id && p.typing)
          .map((p: any) => p.name || 'User');
        if (typing.length > 0) {
          setTypingUsers(prev => [...new Set([...prev, ...typing])]);
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('[useTypingIndicator] User left typing:', leftPresences);
        const leftUserIds = leftPresences.map((p: any) => p.user_id);
        setTypingUsers(prev => prev.filter(name => {
          // Remove users who left (we'd need to track user_id -> name mapping for this)
          // For now, just re-sync from state
          return true;
        }));
        // Re-sync from state
        const state = channel.presenceState();
        const typing: string[] = [];
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            const presence = presences[0] as any;
            if (presence.user_id !== user.id && presence.typing) {
              typing.push(presence.name || 'User');
            }
          }
        });
        setTypingUsers(typing);
      })
      .subscribe(async (status, err) => {
        if (err) {
          console.error(`[useTypingIndicator] Channel error:`, err);
        } else {
          console.log(`[useTypingIndicator] Channel status:`, status);
          if (status === 'SUBSCRIBED') {
            // Channel is ready, ensure we can track typing
            console.log(`[useTypingIndicator] Channel subscribed successfully`);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[useTypingIndicator] Cleaning up typing indicator`);
      if (channelRef.current) {
        channelRef.current.untrack();
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [conversationId, user?.id]);

  const startTyping = useCallback(async () => {
    if (!conversationId || !user?.id) {
      console.log('[useTypingIndicator] Cannot start typing - missing conversationId or user.id');
      return;
    }

    // Use the channel from ref
    const channel = channelRef.current;
    if (!channel) {
      console.error('[useTypingIndicator] Channel not available');
      return;
    }

    console.log('[useTypingIndicator] Channel state:', channel.state);

    if (!isTyping) {
      setIsTyping(true);
    }
    
    try {
      // Track typing with user_id to filter out own typing
      // Note: track() will work even if channel is still subscribing
      await channel.track({ 
        typing: true, 
        name: profile?.full_name || 'User', 
        user_id: user.id 
      });
      
      console.log('[useTypingIndicator] ✅ Started typing - tracked successfully');
    } catch (err) {
      console.error('[useTypingIndicator] Error tracking typing:', err);
      // If tracking fails, try again after a short delay
      setTimeout(() => {
        if (channelRef.current) {
          channelRef.current.track({ 
            typing: true, 
            name: profile?.full_name || 'User', 
            user_id: user.id 
          }).catch((e: any) => console.error('[useTypingIndicator] Retry failed:', e));
        }
      }, 200);
    }

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      stopTyping();
    }, 3000) as ReturnType<typeof setTimeout>;
  }, [conversationId, user?.id, profile?.full_name, isTyping]);

  const stopTyping = useCallback(async () => {
    if (!conversationId) return;

    setIsTyping(false);
    
    // Use the channel from ref
    const channel = channelRef.current;
    if (channel && (channel.state === 'joined' || channel.state === 'SUBSCRIBED')) {
      try {
        await channel.untrack();
        console.log('[useTypingIndicator] ✅ Stopped typing');
      } catch (err) {
        console.error('[useTypingIndicator] Error untracking typing:', err);
      }
    }
    
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }
  }, [conversationId]);

  return { typingUsers, startTyping, stopTyping };
}

// Helper function to get or create a support conversation
export async function getOrCreateSupportConversation(
  userId: string
): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    console.log('getOrCreateSupportConversation:', { userId });
    
    // First, try to find a support user profile
    // Look for support email first, then admin user
    let supportProfiles = null;
    let supportError = null;
    
    // Try to find support email first
    const { data: supportEmailProfile, error: emailError } = await supabase
      .from('profiles')
      .select('id, full_name, email, role')
      .eq('email', 'support@nextignition.com')
      .limit(1)
      .maybeSingle();
    
    if (supportEmailProfile) {
      supportProfiles = supportEmailProfile;
    } else {
      // If no support email found, try to find any admin user
      const { data: adminProfile, error: adminError } = await supabase
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('role', 'admin')
        .limit(1)
        .maybeSingle();
      
      if (adminProfile) {
        supportProfiles = adminProfile;
      } else {
        supportError = adminError || emailError;
      }
    }

    let supportUserId: string | null = null;
    let supportUserName = 'Support Team';

    if (supportProfiles) {
      supportUserId = supportProfiles.id;
      supportUserName = supportProfiles.full_name || 'Support Team';
      console.log('Found support profile:', { supportUserId, supportUserName });
    } else {
      if (supportError) {
        console.error('Error finding support profile:', supportError);
      }
      console.warn('No support or admin profile found, cannot create support conversation');
      return { conversationId: null, error: 'Support team not available. Please contact support@nextignition.com' };
    }

    if (!supportUserId) {
      return { conversationId: null, error: 'Support team not available' };
    }

    // Prevent self-conversations
    if (userId === supportUserId) {
      console.error('Cannot create support conversation with yourself');
      return { conversationId: null, error: 'Cannot create support conversation with yourself' };
    }

    // Check if conversation already exists
    const { data: existingMembers, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations:conversation_id(is_group)')
      .eq('profile_id', userId);

    if (memberError) throw memberError;

    // Find direct conversation with support user
    for (const member of existingMembers || []) {
      const conv = (member as any).conversations;
      if (conv && !conv.is_group) {
        // Check if support user is also a member
        const { data: supportMember, error: supportMemberError } = await supabase
          .from('conversation_members')
          .select('id')
          .eq('conversation_id', member.conversation_id)
          .eq('profile_id', supportUserId)
          .single();

        if (!supportMemberError && supportMember) {
          console.log('Found existing support conversation:', member.conversation_id);
          return { conversationId: member.conversation_id, error: null };
        }
      }
    }

    console.log('No existing support conversation found, creating new one...');

    // Create new support conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        title: supportUserName,
        is_group: false,
        metadata: {
          type: 'support',
          is_support_conversation: true,
        },
      })
      .select()
      .single();

    if (convError) throw convError;

    // Add both users as members
    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: newConv.id, profile_id: userId },
        { conversation_id: newConv.id, profile_id: supportUserId },
      ]);

    if (membersError) throw membersError;

    console.log('Successfully created support conversation:', newConv.id);
    return { conversationId: newConv.id, error: null };
  } catch (err: any) {
    console.error('Error creating support conversation:', err);
    return { conversationId: null, error: err.message || 'Failed to create support conversation' };
  }
}

// Helper function to create or get a direct conversation between two users
export async function getOrCreateDirectConversation(
  userId: string,
  otherUserId: string,
  otherUserName: string
): Promise<{ conversationId: string | null; error: string | null }> {
  try {
    console.log('getOrCreateDirectConversation:', { userId, otherUserId, otherUserName });
    
    // Prevent self-conversations
    if (userId === otherUserId) {
      console.error('Cannot create conversation with yourself');
      return { conversationId: null, error: 'Cannot create conversation with yourself' };
    }
    
    // Check if conversation already exists
    const { data: existingMembers, error: memberError } = await supabase
      .from('conversation_members')
      .select('conversation_id, conversations:conversation_id(is_group)')
      .eq('profile_id', userId);

    console.log('Existing members query:', { existingMembers, memberError });

    if (memberError) throw memberError;

    // Find direct conversation with the other user
    for (const member of existingMembers || []) {
      const conv = (member as any).conversations;
      if (conv && !conv.is_group) {
        // Check if other user is also a member
        const { data: otherMember, error: otherError } = await supabase
          .from('conversation_members')
          .select('id')
          .eq('conversation_id', member.conversation_id)
          .eq('profile_id', otherUserId)
          .single();

        console.log('Checking for existing conversation:', { 
          conversationId: member.conversation_id,
          otherMember, 
          otherError 
        });

        if (!otherError && otherMember) {
          console.log('Found existing conversation:', member.conversation_id);
          return { conversationId: member.conversation_id, error: null };
        }
      }
    }

    console.log('No existing conversation found, creating new one...');

    // Create new conversation
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        title: otherUserName,
        is_group: false,
      })
      .select()
      .single();

    console.log('New conversation created:', { newConv, convError });

    if (convError) throw convError;

    // Add both users as members
    const { error: membersError } = await supabase
      .from('conversation_members')
      .insert([
        { conversation_id: newConv.id, profile_id: userId },
        { conversation_id: newConv.id, profile_id: otherUserId },
      ]);

    console.log('Members added:', { membersError });

    if (membersError) throw membersError;

    console.log('Successfully created conversation:', newConv.id);
    return { conversationId: newConv.id, error: null };
  } catch (err: any) {
    console.error('Error creating conversation:', err);
    return { conversationId: null, error: err.message || 'Failed to create conversation' };
  }
}

// Hook for presence (online/offline status) - uses shared global presence channel
export function usePresence(userId: string | null) {
  const [isOnline, setIsOnline] = useState(false);
  const { user } = useAuth();
  const channelRef = React.useRef<any>(null);

  useEffect(() => {
    if (!userId || !user?.id) {
      setIsOnline(false);
      return;
    }

    console.log(`[usePresence] Setting up presence tracking for user: ${userId}`);

    // Use a shared global presence channel where all users broadcast their status
    // This allows any user to see any other user's online status
    const channel = supabase.channel('presence:global')
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        // Check if the target user is present
        let targetUserPresent = false;
        Object.keys(state).forEach(key => {
          const presences = state[key] as any[];
          if (presences && presences.length > 0) {
            presences.forEach((p: any) => {
              if (p.user_id === userId) {
                targetUserPresent = true;
              }
            });
          }
        });
        console.log(`[usePresence] Presence sync - User ${userId} is ${targetUserPresent ? 'online' : 'offline'}`, state);
        setIsOnline(targetUserPresent);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        console.log(`[usePresence] Presence join event:`, newPresences);
        const targetJoined = newPresences.some((p: any) => p.user_id === userId);
        if (targetJoined) {
          console.log(`[usePresence] ✅ User ${userId} came online`);
          setIsOnline(true);
        }
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        console.log(`[usePresence] Presence leave event:`, leftPresences);
        const targetLeft = leftPresences.some((p: any) => p.user_id === userId);
        if (targetLeft) {
          console.log(`[usePresence] ❌ User ${userId} went offline`);
          setIsOnline(false);
        } else {
          // Re-check state in case of multiple presences
          const state = channel.presenceState();
          let targetUserPresent = false;
          Object.keys(state).forEach(key => {
            const presences = state[key] as any[];
            if (presences && presences.length > 0) {
              presences.forEach((p: any) => {
                if (p.user_id === userId) {
                  targetUserPresent = true;
                }
              });
            }
          });
          setIsOnline(targetUserPresent);
        }
      })
      .subscribe(async (status, err) => {
        if (err) {
          console.error(`[usePresence] Channel error:`, err);
        } else {
          console.log(`[usePresence] Channel status:`, status);
          if (status === 'SUBSCRIBED') {
            // After subscribing, check current presence state
            const state = channel.presenceState();
            let targetUserPresent = false;
            Object.keys(state).forEach(key => {
              const presences = state[key] as any[];
              if (presences && presences.length > 0) {
                presences.forEach((p: any) => {
                  if (p.user_id === userId) {
                    targetUserPresent = true;
                  }
                });
              }
            });
            console.log(`[usePresence] Initial state - User ${userId} is ${targetUserPresent ? 'online' : 'offline'}`, state);
            setIsOnline(targetUserPresent);
          }
        }
      });

    channelRef.current = channel;

    return () => {
      console.log(`[usePresence] Cleaning up presence tracking for ${userId}`);
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [userId, user?.id]);

  return { isOnline };
}

// Hook to broadcast own presence - uses shared global channel
export function useBroadcastPresence() {
  const { user, profile } = useAuth();
  const channelRef = React.useRef<any>(null);
  const keepAliveIntervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    console.log(`[useBroadcastPresence] Setting up presence broadcast for user: ${user.id}`);

    // Use the same global channel that others listen to
    const channel = supabase.channel('presence:global')
      .on('presence', { event: 'sync' }, () => {
        console.log('[useBroadcastPresence] Presence synced');
      })
      .subscribe(async (status, err) => {
        if (err) {
          console.error(`[useBroadcastPresence] Channel error:`, err);
        } else {
          console.log(`[useBroadcastPresence] Channel status:`, status);
          if (status === 'SUBSCRIBED') {
            try {
              await channel.track({
                user_id: user.id,
                online_at: new Date().toISOString(),
                name: profile?.full_name || 'User',
              });
              console.log('[useBroadcastPresence] ✅ Presence tracked on global channel');
            } catch (err) {
              console.error('[useBroadcastPresence] Error tracking presence:', err);
            }
          }
        }
      });

    channelRef.current = channel;

    // Track presence on mount and keep it alive
    keepAliveIntervalRef.current = setInterval(async () => {
      if (channelRef.current && channelRef.current.state === 'joined') {
        try {
          await channelRef.current.track({
            user_id: user.id,
            online_at: new Date().toISOString(),
            name: profile?.full_name || 'User',
          });
          console.log('[useBroadcastPresence] Presence keep-alive updated');
        } catch (err) {
          console.error('[useBroadcastPresence] Error in keep-alive:', err);
        }
      }
    }, 15000); // Update every 15 seconds to keep presence alive

    return () => {
      console.log(`[useBroadcastPresence] Cleaning up presence broadcast for ${user.id}`);
      if (keepAliveIntervalRef.current) {
        clearInterval(keepAliveIntervalRef.current);
        keepAliveIntervalRef.current = null;
      }
      if (channelRef.current) {
        try {
          channelRef.current.untrack();
        } catch (err) {
          console.error('[useBroadcastPresence] Error untracking:', err);
        }
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, [user?.id, profile?.full_name]);
}
