import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
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
  TrendingUp,
  Users,
  Calendar,
  Award,
  Heart,
  MessageCircle,
  MoreVertical,
  Plus,
  Trash2,
  Search,
  SlidersHorizontal,
  X,
} from 'lucide-react-native';
import { useFeed, FeedPost, FeedPostType } from '@/hooks/useFeed';
import { useAuth } from '@/contexts/AuthContext';
import { CreatePostModal } from '@/components/feed/CreatePostModal';
import { CommentsModal } from '@/components/feed/CommentsModal';
import { Picker } from '@/components/Picker';

const POST_TYPE_CONFIG: Record<
  FeedPostType,
  { icon: any; color: string; label: string }
> = {
  funding: { icon: TrendingUp, color: COLORS.success, label: 'Funding' },
  event: { icon: Calendar, color: COLORS.primary, label: 'Event' },
  onboarding: { icon: Users, color: COLORS.accent, label: 'Welcome' },
  achievement: { icon: Award, color: COLORS.warning, label: 'Achievement' },
  milestone: { icon: Award, color: COLORS.accent, label: 'Milestone' },
  announcement: { icon: TrendingUp, color: COLORS.primary, label: 'Announcement' },
};

const POST_TYPES = [
  { label: 'All Types', value: '' },
  { label: 'Funding', value: 'funding' },
  { label: 'Event', value: 'event' },
  { label: 'Welcome', value: 'onboarding' },
  { label: 'Achievement', value: 'achievement' },
  { label: 'Milestone', value: 'milestone' },
  { label: 'Announcement', value: 'announcement' },
];

export default function FeedScreen() {
  const { user } = useAuth();
  const {
    posts,
    loading,
    error,
    refetch,
    createPost,
    toggleLike,
    deletePost,
    fetchComments,
    addComment,
    deleteComment,
  } = useFeed();
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCommentsModal, setShowCommentsModal] = useState(false);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [selectedPostAuthorId, setSelectedPostAuthorId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [postTypeFilter, setPostTypeFilter] = useState('');

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await refetch();
    } catch (err) {
      console.error('Error refreshing feed:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleCreatePost = async (data: { type: FeedPostType; content: string; company_name?: string }) => {
    try {
      await createPost(data);
      setShowCreateModal(false);
    } catch (err) {
      throw err; // Let the modal handle the error
    }
  };

  const handleToggleLike = async (postId: string) => {
    try {
      await toggleLike(postId);
    } catch (err) {
      Alert.alert('Error', 'Failed to update like');
    }
  };

  const handleDeletePost = (postId: string) => {
    Alert.alert('Delete Post', 'Are you sure you want to delete this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePost(postId);
          } catch (err) {
            Alert.alert('Error', 'Failed to delete post');
          }
        },
      },
    ]);
  };

  const handleOpenComments = (postId: string, authorId: string) => {
    setSelectedPostId(postId);
    setSelectedPostAuthorId(authorId);
    setShowCommentsModal(true);
  };

  const getPostIcon = (post: FeedPost) => {
    const config = POST_TYPE_CONFIG[post.type];
    const IconComponent = config.icon;
    return (
      <View style={[styles.postIcon, { backgroundColor: `${config.color}15` }]}>
        <IconComponent size={20} color={config.color} strokeWidth={2} />
      </View>
    );
  };

  if (loading && posts.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      </SafeAreaView>
    );
  }

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
              <Text style={styles.heroTitle}>Activity Feed</Text>
              <Text style={styles.heroSubtitle}>
                Stay updated with the latest from your network
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setShowCreateModal(true)}
            activeOpacity={0.8}>
            <Plus size={20} color={COLORS.background} strokeWidth={2} />
            <Text style={styles.createButtonText}>Create Post</Text>
          </TouchableOpacity>
        </LinearGradient>

        <View style={styles.searchSection}>
          <View style={styles.searchBar}>
            <Search size={20} color={COLORS.textSecondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search posts by content or author"
              placeholderTextColor={COLORS.textSecondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={[styles.filterToggleButton, showFilters && styles.filterToggleButtonActive]}
            onPress={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal size={20} color={showFilters ? COLORS.background : COLORS.primary} />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <View style={styles.filtersContainer}>
            <View style={styles.filtersHeader}>
              <Text style={styles.filtersTitle}>Filters</Text>
              {(searchQuery || postTypeFilter) && (
                <TouchableOpacity
                  onPress={() => {
                    setSearchQuery('');
                    setPostTypeFilter('');
                  }}
                  style={styles.clearAllButton}
                >
                  <Text style={styles.clearAllText}>Clear All</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.filtersContent}>
              <View style={styles.filterRow}>
                <Text style={styles.filterLabel}>Post Type</Text>
                <Picker
                  value={postTypeFilter}
                  onValueChange={setPostTypeFilter}
                  items={POST_TYPES}
                  placeholder="Select post type"
                />
              </View>
            </View>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={refetch} style={styles.retryButton}>
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {posts.length === 0 && !loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No posts yet</Text>
            <Text style={styles.emptyText}>
              Be the first to share something with the community!
            </Text>
            <TouchableOpacity
              style={styles.emptyCreateButton}
              onPress={() => setShowCreateModal(true)}
              activeOpacity={0.8}>
              <Plus size={20} color={COLORS.background} strokeWidth={2} />
              <Text style={styles.emptyCreateButtonText}>Create Your First Post</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.postsList}>
            {posts
              .filter((post) => {
                if (searchQuery) {
                  const query = searchQuery.toLowerCase();
                  const matchesSearch =
                    post.content?.toLowerCase().includes(query) ||
                    post.user_name?.toLowerCase().includes(query) ||
                    post.company_name?.toLowerCase().includes(query);
                  if (!matchesSearch) return false;
                }
                if (postTypeFilter && post.type !== postTypeFilter) {
                  return false;
                }
                return true;
              })
              .map((post) => {
                const isOwner = post.user_id === user?.id;
                return (
                <View key={post.id} style={styles.postCard}>
                  <View style={styles.postHeader}>
                    <View style={styles.postUserInfo}>
                      {getPostIcon(post)}
                      <View style={styles.postUserDetails}>
                        <Text style={styles.postUserName}>
                          {post.user_name || 'Anonymous'}
                        </Text>
                        <Text style={styles.postCompany}>
                          {post.company_name || post.user_role || 'Member'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.postHeaderActions}>
                      {isOwner && (
                        <TouchableOpacity
                          style={styles.deletePostButton}
                          onPress={() => handleDeletePost(post.id)}
                          activeOpacity={0.7}>
                          <Trash2 size={18} color={COLORS.error} strokeWidth={2} />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.moreButton} activeOpacity={0.7}>
                        <MoreVertical size={18} color={COLORS.textSecondary} strokeWidth={2} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <Text style={styles.postContent}>{post.content}</Text>

                  <View style={styles.postFooter}>
                    <Text style={styles.postTimestamp}>
                      {post.time_ago || new Date(post.created_at).toLocaleDateString()}
                    </Text>
                    <View style={styles.postActions}>
                      <TouchableOpacity
                        style={styles.postAction}
                        onPress={() => handleToggleLike(post.id)}
                        activeOpacity={0.7}>
                        <Heart
                          size={18}
                          color={post.is_liked ? COLORS.error : COLORS.textSecondary}
                          fill={post.is_liked ? COLORS.error : 'none'}
                          strokeWidth={2}
                        />
                        <Text
                          style={[
                            styles.postActionText,
                            post.is_liked && styles.postActionTextActive,
                          ]}>
                          {post.likes_count}
                        </Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.postAction}
                        onPress={() => handleOpenComments(post.id, post.user_id)}
                        activeOpacity={0.7}>
                        <MessageCircle size={18} color={COLORS.textSecondary} strokeWidth={2} />
                        <Text style={styles.postActionText}>{post.comments_count}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <CreatePostModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreatePost={handleCreatePost}
      />

      {selectedPostId && selectedPostAuthorId && (
        <CommentsModal
          visible={showCommentsModal}
          onClose={() => {
            setShowCommentsModal(false);
            setSelectedPostId(null);
            setSelectedPostAuthorId(null);
          }}
          postId={selectedPostId}
          postAuthorId={selectedPostAuthorId}
          fetchComments={fetchComments}
          addComment={addComment}
          deleteComment={deleteComment}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.sm,
  },
  createButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  errorContainer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.errorLight,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    gap: SPACING.sm,
  },
  errorText: {
    ...TYPOGRAPHY.body,
    color: COLORS.error,
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.error,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
    gap: SPACING.md,
  },
  emptyTitle: {
    ...TYPOGRAPHY.title,
    fontFamily: FONT_FAMILY.displayBold,
    color: COLORS.text,
  },
  emptyText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  emptyCreateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  emptyCreateButtonText: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.background,
  },
  postsList: {
    gap: SPACING.md,
  },
  postCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
    gap: SPACING.md,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  postIcon: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  postUserDetails: {
    flex: 1,
  },
  postUserName: {
    ...TYPOGRAPHY.bodyStrong,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs / 2,
  },
  postCompany: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  postHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  deletePostButton: {
    padding: SPACING.xs,
  },
  moreButton: {
    padding: SPACING.xs,
  },
  postContent: {
    ...TYPOGRAPHY.body,
    color: COLORS.text,
    lineHeight: 22,
  },
  postFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  postTimestamp: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
  },
  postActions: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  postAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs / 2,
  },
  postActionText: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontFamily: FONT_FAMILY.bodyMedium,
  },
  postActionTextActive: {
    color: COLORS.error,
  },
  searchSection: {
    flexDirection: 'row',
    padding: SPACING.lg,
    gap: SPACING.md,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingBottom: SPACING.sm,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  searchInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    paddingVertical: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONT_FAMILY.body,
    color: COLORS.text,
  },
  clearButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.xs,
  },
  filterToggleButton: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.inputBackground,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.xs,
  },
  filterToggleButtonActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filtersContainer: {
    backgroundColor: COLORS.surfaceMuted,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    paddingBottom: SPACING.lg,
    paddingTop: SPACING.sm,
  },
  filtersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
  },
  filtersTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONT_FAMILY.displayMedium,
    color: COLORS.text,
  },
  clearAllButton: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm,
  },
  clearAllText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.primary,
  },
  filtersContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.md,
  },
  filterRow: {
    gap: SPACING.xs,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONT_FAMILY.bodyBold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
});
