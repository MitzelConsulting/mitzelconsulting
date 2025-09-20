-- Fix the preserve_song_votes trigger function to use correct field names
-- Run this in Supabase SQL editor

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS preserve_votes_trigger ON songs;

-- Recreate the function with correct field names
CREATE OR REPLACE FUNCTION preserve_song_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- When a song is marked as not public, preserve its vote count
  IF OLD.is_public = true AND NEW.is_public = false THEN
    NEW.original_vote_count = COALESCE(OLD.current_votes, 0);
    NEW.removed_at = timezone('utc'::text, now());
    
    -- Create a version record
    INSERT INTO song_versions (song_id, version_number, vote_count, is_public, removed_at)
    VALUES (NEW.id, 1, COALESCE(OLD.current_votes, 0), false, timezone('utc'::text, now()));
  END IF;
  
  -- When a song is restored to public view, restore vote count
  IF OLD.is_public = false AND NEW.is_public = true AND NEW.original_vote_count > 0 THEN
    NEW.current_votes = NEW.original_vote_count;
    NEW.removed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER preserve_votes_trigger
  BEFORE UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION preserve_song_votes();

-- Verify the trigger is working
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing, 
  action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'preserve_votes_trigger'; 