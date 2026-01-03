import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type FeedPostType = 'funding' | 'event' | 'onboarding' | 'achievement' | 'milestone' | 'announcement';

export interface FeedPost {
  id: string;
  user_id: string;
  type: FeedPostType;
  content: string;
  company_name?: string;
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  updated_at: string;
  // User details from join
  user_name?: string;
  user_role?: string;
  email?: string;
  time_ago?: string;
  // Current user's interaction
  is_liked?: boolean;
  is_bookmarked?: boolean;
}

export interface FeedPostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  // User details from join
  user_name?: string;
  user_role?: string;
  email?: string;
}

export interface CreatePostData {
  type: FeedPostType;
  content: string;
  company_name?: string;
}

export function useFeed() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch all feed posts with user details and current user's interactions
  const fetchPosts = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch posts with user details via join
      // Note: We filter onboarding_completed in the application layer since Supabase
      // doesn't support filtering on nested relations in the query
      const { data: postsData, error: postsError } = await supabase
        .from('feed_posts')
        .select(
          `
          *,
          profile:profiles!feed_posts_user_id_fkey(
            id,
            full_name,
            role,
            email,
            onboarding_completed
          )
        `
        )
        .order('created_at', { ascending: false })
        .limit(50);

      if (postsError) throw postsError;

      // Fetch current user's likes and bookmarks
      const { data: likesData } = await supabase
        .from('feed_post_likes')
        .select('post_id')
        .eq('user_id', user.id);

      const { data: bookmarksData } = await supabase
        .from('feed_post_bookmarks')
        .select('post_id')
        .eq('user_id', user.id);

      const likedPostIds = new Set(likesData?.map((l) => l.post_id) || []);
      const bookmarkedPostIds = new Set(bookmarksData?.map((b) => b.post_id) || []);

      // Helper function to calculate time ago
      const getTimeAgo = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
        return date.toLocaleDateString();
      };

      // Combine data
      const postsWithInteractions: FeedPost[] = (postsData || [])
        .filter((post: any) => post.profile?.onboarding_completed) // Filter out incomplete profiles
        .map((post: any) => ({
          id: post.id,
          user_id: post.user_id,
          type: post.type,
          content: post.content,
          company_name: post.company_name,
          likes_count: post.likes_count || 0,
          comments_count: post.comments_count || 0,
          shares_count: post.shares_count || 0,
          created_at: post.created_at,
          updated_at: post.updated_at,
          user_name: post.profile?.full_name,
          user_role: post.profile?.role,
          email: post.profile?.email,
          time_ago: getTimeAgo(post.created_at),
          is_liked: likedPostIds.has(post.id),
          is_bookmarked: bookmarkedPostIds.has(post.id),
        }));

      setPosts(postsWithInteractions);
    } catch (err) {
      console.error('Error fetching feed posts:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch posts');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // Create a new post
  const createPost = useCallback(
    async (postData: CreatePostData) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create posts');
      }

      try {
        // Get company name from startup profile if available
        let companyName = postData.company_name;

        if (!companyName) {
          const { data: startupProfile } = await supabase
            .from('startup_profiles')
            .select('name')
            .eq('owner_id', user.id)
            .maybeSingle();

          if (startupProfile?.name) {
            companyName = startupProfile.name;
          } else {
            // Try to get from profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('venture_name')
              .eq('id', user.id)
              .maybeSingle();

            if (profile?.venture_name) {
              companyName = profile.venture_name;
            }
          }
        }

        const { data, error: insertError } = await supabase
          .from('feed_posts')
          .insert({
            user_id: user.id,
            type: postData.type,
            content: postData.content,
            company_name: companyName,
          })
          .select()
          .single();

        if (insertError) throw insertError;

        // Refresh posts
        await fetchPosts();

        return data;
      } catch (err) {
        console.error('Error creating post:', err);
        throw err;
      }
    },
    [user?.id]
  );

  // Toggle like on a post
  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to like posts');
      }

      // Find the current post state
      const currentPost = posts.find((p) => p.id === postId);
      if (!currentPost) return;

      const currentIsLiked = currentPost.is_liked;
      const newIsLiked = !currentIsLiked;

      // Update local state optimistically FIRST (instant UI update)
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              is_liked: newIsLiked,
              likes_count: newIsLiked ? post.likes_count + 1 : Math.max(0, post.likes_count - 1),
            };
          }
          return post;
        })
      );

      try {
        // Then perform the database operation
        if (newIsLiked) {
          // Like
          const { error: insertError } = await supabase
            .from('feed_post_likes')
            .insert({
              post_id: postId,
              user_id: user.id,
            });

          if (insertError) {
            // Revert optimistic update on error
            setPosts((prevPosts) =>
              prevPosts.map((post) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    is_liked: currentIsLiked,
                    likes_count: currentPost.likes_count,
                  };
                }
                return post;
              })
            );
            throw insertError;
          }
        } else {
          // Unlike
          const { error: deleteError } = await supabase
            .from('feed_post_likes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (deleteError) {
            // Revert optimistic update on error
            setPosts((prevPosts) =>
              prevPosts.map((post) => {
                if (post.id === postId) {
                  return {
                    ...post,
                    is_liked: currentIsLiked,
                    likes_count: currentPost.likes_count,
                  };
                }
                return post;
              })
            );
            throw deleteError;
          }
        }
        // Count updated optimistically - database triggers will update the count in the background
      } catch (err) {
        console.error('Error toggling like:', err);
        throw err;
      }
    },
    [user?.id, posts]
  );

  // Toggle bookmark on a post
  const toggleBookmark = useCallback(
    async (postId: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to bookmark posts');
      }

      try {
        // Check if already bookmarked
        const { data: existingBookmark } = await supabase
          .from('feed_post_bookmarks')
          .select('id')
          .eq('post_id', postId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existingBookmark) {
          // Unbookmark
          const { error: deleteError } = await supabase
            .from('feed_post_bookmarks')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', user.id);

          if (deleteError) throw deleteError;
        } else {
          // Bookmark
          const { error: insertError } = await supabase
            .from('feed_post_bookmarks')
            .insert({
              post_id: postId,
              user_id: user.id,
            });

          if (insertError) throw insertError;
        }

        // Update local state optimistically
        setPosts((prevPosts) =>
          prevPosts.map((post) => {
            if (post.id === postId) {
              return {
                ...post,
                is_bookmarked: !post.is_bookmarked,
              };
            }
            return post;
          })
        );
      } catch (err) {
        console.error('Error toggling bookmark:', err);
        throw err;
      }
    },
    [user?.id]
  );

  // Delete a post (only by owner)
  const deletePost = useCallback(
    async (postId: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to delete posts');
      }

      try {
        const { error: deleteError } = await supabase
          .from('feed_posts')
          .delete()
          .eq('id', postId)
          .eq('user_id', user.id); // Ensure user owns the post

        if (deleteError) throw deleteError;

        // Remove from local state
        setPosts((prevPosts) => prevPosts.filter((post) => post.id !== postId));
      } catch (err) {
        console.error('Error deleting post:', err);
        throw err;
      }
    },
    [user?.id]
  );

  // Fetch comments for a post
  const fetchComments = useCallback(async (postId: string): Promise<FeedPostComment[]> => {
    try {
      const { data, error: commentsError } = await supabase
        .from('feed_post_comments')
        .select(
          `
          *,
          profile:profiles!feed_post_comments_user_id_fkey(
            id,
            full_name,
            role,
            email
          )
        `
        )
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (commentsError) throw commentsError;

      return (
        data?.map((comment: any) => ({
          id: comment.id,
          post_id: comment.post_id,
          user_id: comment.user_id,
          content: comment.content,
          created_at: comment.created_at,
          updated_at: comment.updated_at,
          user_name: comment.profile?.full_name,
          user_role: comment.profile?.role,
          email: comment.profile?.email,
        })) || []
      );
    } catch (err) {
      console.error('Error fetching comments:', err);
      throw err;
    }
  }, []);

  // Add a comment to a post
  const addComment = useCallback(
    async (postId: string, content: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to comment');
      }

      if (!content.trim()) {
        throw new Error('Comment cannot be empty');
      }

      // Find the current post state
      const currentPost = posts.find((p) => p.id === postId);
      if (!currentPost) return;

      const currentCommentsCount = currentPost.comments_count;

      // Update local state optimistically FIRST (instant UI update)
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: post.comments_count + 1,
            };
          }
          return post;
        })
      );

      try {
        // Then perform the database operation
        const { data, error: insertError } = await supabase
          .from('feed_post_comments')
          .insert({
            post_id: postId,
            user_id: user.id,
            content: content.trim(),
          })
          .select()
          .single();

        if (insertError) {
          // Revert optimistic update on error
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  comments_count: currentCommentsCount,
                };
              }
              return post;
            })
          );
          throw insertError;
        }

        // Count updated optimistically - database triggers will update the count in the background
        return data;
      } catch (err) {
        console.error('Error adding comment:', err);
        throw err;
      }
    },
    [user?.id, posts]
  );

  // Delete a comment (only by owner)
  const deleteComment = useCallback(
    async (commentId: string, postId: string) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to delete comments');
      }

      // Find the current post state
      const currentPost = posts.find((p) => p.id === postId);
      if (!currentPost) {
        throw new Error('Post not found');
      }

      const currentCommentsCount = currentPost.comments_count;

      // Update local state optimistically FIRST (instant UI update)
      setPosts((prevPosts) =>
        prevPosts.map((post) => {
          if (post.id === postId) {
            return {
              ...post,
              comments_count: Math.max(0, post.comments_count - 1),
            };
          }
          return post;
        })
      );

      try {
        // Perform the delete operation
        // RLS policy will ensure only the owner can delete
        const { data: deletedData, error: deleteError } = await supabase
          .from('feed_post_comments')
          .delete()
          .eq('id', commentId)
          .eq('user_id', user.id)
          .select(); // Return deleted row to verify deletion

        if (deleteError) {
          console.error('Delete comment error:', deleteError);
          // Revert optimistic update on error
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  comments_count: currentCommentsCount,
                };
              }
              return post;
            })
          );
          throw new Error(`Failed to delete comment: ${deleteError.message}`);
        }

        // Verify deletion succeeded
        if (!deletedData || deletedData.length === 0) {
          console.warn('Comment deletion returned no data - comment may not exist or user may not own it');
          // Revert optimistic update
          setPosts((prevPosts) =>
            prevPosts.map((post) => {
              if (post.id === postId) {
                return {
                  ...post,
                  comments_count: currentCommentsCount,
                };
              }
              return post;
            })
          );
          throw new Error('Comment not found or you do not have permission to delete it');
        }

        // Count updated optimistically - database triggers will update the count in the background
        console.log('Comment deleted successfully:', commentId);
        return { success: true };
      } catch (err) {
        console.error('Error deleting comment:', err);
        throw err;
      }
    },
    [user?.id, posts]
  );

  // Set up realtime subscription
  useEffect(() => {
    if (!user?.id) return;

    fetchPosts();

    // Debounce function to avoid too many refetches
    let fetchTimeout: NodeJS.Timeout;
    const debouncedFetch = () => {
      clearTimeout(fetchTimeout);
      fetchTimeout = setTimeout(() => {
        fetchPosts();
      }, 1000); // Wait 1 second after last change before refetching
    };

    // Subscribe to new posts only (INSERT events)
    // We don't subscribe to likes/comments changes because:
    // 1. Optimistic updates handle our own actions instantly
    // 2. Subscribing to likes/comments causes conflicts with optimistic updates
    // 3. Counts are updated via database triggers, so they're accurate on next fetch
    const postsChannel = supabase
      .channel(`feed_posts_changes_${user.id}_${Date.now()}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_posts',
        },
        () => {
          // Only refetch on new posts
          debouncedFetch();
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[useFeed] Subscribed to new posts');
        }
      });

    return () => {
      clearTimeout(fetchTimeout);
      supabase.removeChannel(postsChannel);
    };
  }, [user?.id, fetchPosts]);

  return {
    posts,
    loading,
    error,
    refetch: fetchPosts,
    createPost,
    toggleLike,
    toggleBookmark,
    deletePost,
    fetchComments,
    addComment,
    deleteComment,
  };
}

