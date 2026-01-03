import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { X, Send, Trash2 } from 'lucide-react-native';
import {
  BORDER_RADIUS,
  COLORS,
  FONT_FAMILY,
  FONT_SIZES,
  SHADOWS,
  SPACING,
  TYPOGRAPHY,
} from '@/constants/theme';
import { FeedPostComment } from '@/hooks/useFeed';
import { useAuth } from '@/contexts/AuthContext';

interface CommentsModalProps {
  visible: boolean;
  onClose: () => void;
  postId: string;
  postAuthorId: string;
  fetchComments: (postId: string) => Promise<FeedPostComment[]>;
  addComment: (postId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string, postId: string) => Promise<void>;
}

export function CommentsModal({
  visible,
  onClose,
  postId,
  postAuthorId,
  fetchComments,
  addComment,
  deleteComment,
}: CommentsModalProps) {
  const { user } = useAuth();
  const [comments, setComments] = useState<FeedPostComment[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [commentText, setCommentText] = useState('');

  const loadComments = async () => {
    try {
      setLoading(true);
      const fetchedComments = await fetchComments(postId);
      setComments(fetchedComments);
    } catch (error) {
      Alert.alert('Error', 'Failed to load comments');
      console.error('Error loading comments:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && postId) {
      loadComments();
    } else {
      setComments([]);
      setCommentText('');
    }
  }, [visible, postId]);

  const handleAddComment = async () => {
    if (!commentText.trim()) {
      return;
    }

    try {
      setSubmitting(true);
      await addComment(postId, commentText);
      setCommentText('');
      // Reload comments to get the new one with user details
      await loadComments();
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add comment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    Alert.alert('Delete Comment', 'Are you sure you want to delete this comment?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            // Remove from UI immediately (optimistic update)
            const commentToDelete = comments.find((c) => c.id === commentId);
            setComments((prev) => prev.filter((c) => c.id !== commentId));
            
            // Then delete from database
            await deleteComment(commentId, postId);
            
            // If successful, the comment is already removed from UI
            // The deleteComment function handles updating the post's comment count
          } catch (error) {
            // On error, reload comments to restore the deleted comment
            console.error('Error deleting comment:', error);
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            Alert.alert('Error', `Failed to delete comment: ${errorMessage}`);
            
            // Reload comments to restore state
            try {
              await loadComments();
            } catch (reloadError) {
              console.error('Error reloading comments:', reloadError);
            }
          }
        },
      },
    ]);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.header}>
            <Text style={styles.title}>Comments</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <X size={24} color={COLORS.text} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.commentsList} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={COLORS.primary} />
              </View>
            ) : comments.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No comments yet. Be the first to comment!</Text>
              </View>
            ) : (
              comments.map((comment) => {
                const isOwner = comment.user_id === user?.id;
                return (
                  <View key={comment.id} style={styles.commentItem}>
                    <View style={styles.commentHeader}>
                      <View style={styles.commentUserInfo}>
                        <View style={styles.commentAvatar}>
                          <Text style={styles.commentAvatarText}>
                            {comment.user_name?.[0]?.toUpperCase() || 'U'}
                          </Text>
                        </View>
                        <View style={styles.commentUserDetails}>
                          <Text style={styles.commentUserName}>
                            {comment.user_name || 'Anonymous'}
                            {comment.user_role && (
                              <Text style={styles.commentUserRole}> • {comment.user_role}</Text>
                            )}
                          </Text>
                          <Text style={styles.commentTime}>{formatTimeAgo(comment.created_at)}</Text>
                        </View>
                      </View>
                      {isOwner && (
                        <TouchableOpacity
                          onPress={() => handleDeleteComment(comment.id)}
                          style={styles.deleteButton}>
                          <Trash2 size={16} color={COLORS.error} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.commentContent}>{comment.content}</Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Write a comment..."
              placeholderTextColor={COLORS.textSecondary}
              value={commentText}
              onChangeText={setCommentText}
              multiline
              maxLength={500}
              editable={!submitting}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!commentText.trim() || submitting) && styles.sendButtonDisabled]}
              onPress={handleAddComment}
              disabled={!commentText.trim() || submitting}>
              {submitting ? (
                <ActivityIndicator size="small" color={COLORS.background} />
              ) : (
                <Send size={20} color={COLORS.background} strokeWidth={2} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xl,
    borderTopRightRadius: BORDER_RADIUS.xl,
    maxHeight: '90%',
    ...SHADOWS.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    ...TYPOGRAPHY.h2,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
  },
  closeButton: {
    padding: SPACING.xs,
  },
  commentsList: {
    flex: 1,
    padding: SPACING.lg,
  },
  loadingContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  commentItem: {
    marginBottom: SPACING.lg,
    paddingBottom: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  commentUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: SPACING.md,
  },
  commentAvatar: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  commentUserDetails: {
    flex: 1,
  },
  commentUserName: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  commentUserRole: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.body,
  },
  commentTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: SPACING.xs,
  },
  commentContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 20,
    marginLeft: 56, // Align with user info
  },
  inputContainer: {
    flexDirection: 'row',
    padding: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.md,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    ...TYPOGRAPHY.body,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

