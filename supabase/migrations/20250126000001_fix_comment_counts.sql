-- Fix comment counts by ensuring they're calculated correctly
-- This migration ensures comment counts are accurate by recalculating them

-- First, create a function to recalculate comment counts
CREATE OR REPLACE FUNCTION recalculate_feed_post_counts()
RETURNS void AS $$
BEGIN
  -- Recalculate comments_count for all posts
  UPDATE feed_posts fp
  SET comments_count = COALESCE((
    SELECT COUNT(*)::integer
    FROM feed_post_comments fpc
    WHERE fpc.post_id = fp.id
  ), 0);
  
  -- Recalculate likes_count for all posts
  UPDATE feed_posts fp
  SET likes_count = COALESCE((
    SELECT COUNT(*)::integer
    FROM feed_post_likes fpl
    WHERE fpl.post_id = fp.id
  ), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the recalculation
SELECT recalculate_feed_post_counts();

-- Drop the temporary function
DROP FUNCTION IF EXISTS recalculate_feed_post_counts();

-- Ensure triggers are properly set up and working
DROP TRIGGER IF EXISTS update_comments_count_trigger ON feed_post_comments;
DROP FUNCTION IF EXISTS update_feed_post_comments_count();

-- Recreate the function with proper error handling
CREATE OR REPLACE FUNCTION update_feed_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feed_posts 
    SET comments_count = COALESCE(comments_count, 0) + 1,
        updated_at = now()
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feed_posts 
    SET comments_count = GREATEST(0, COALESCE(comments_count, 0) - 1),
        updated_at = now()
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_comments_count_trigger
  AFTER INSERT OR DELETE ON feed_post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_feed_post_comments_count();

COMMENT ON FUNCTION update_feed_post_comments_count() IS 'Automatically updates comments_count in feed_posts when comments are added or deleted';

