-- Enable Realtime for feed tables
-- This allows real-time updates when posts, likes, comments, or bookmarks change

-- Enable Realtime for feed_posts table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_posts;

-- Enable Realtime for feed_post_likes table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_likes;

-- Enable Realtime for feed_post_comments table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_comments;

-- Enable Realtime for feed_post_bookmarks table
ALTER PUBLICATION supabase_realtime ADD TABLE public.feed_post_bookmarks;

-- Set REPLICA IDENTITY to FULL for better realtime updates
ALTER TABLE public.feed_posts REPLICA IDENTITY FULL;
ALTER TABLE public.feed_post_likes REPLICA IDENTITY FULL;
ALTER TABLE public.feed_post_comments REPLICA IDENTITY FULL;

-- Add comments for documentation
COMMENT ON TABLE public.feed_posts IS 'Activity feed posts with Realtime enabled for instant updates';
COMMENT ON TABLE public.feed_post_likes IS 'Post likes with Realtime enabled';
COMMENT ON TABLE public.feed_post_comments IS 'Post comments with Realtime enabled';
COMMENT ON TABLE public.feed_post_bookmarks IS 'Post bookmarks with Realtime enabled';

