-- Artist Song Management System Migration
-- This adds support for private song storage, approval workflow, and vote preservation

-- Add new fields to songs table for song management
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_size integer;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS submitted_for_approval boolean DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS original_vote_count integer DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS removed_at timestamp with time zone;

-- Create a song_versions table to track song history and vote preservation
CREATE TABLE IF NOT EXISTS song_versions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE,
  version_number integer DEFAULT 1,
  vote_count integer DEFAULT 0,
  is_public boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  removed_at timestamp with time zone
);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_songs_artist_status ON songs(artist_id, status);
CREATE INDEX IF NOT EXISTS idx_songs_public ON songs(is_public) WHERE is_public = true;
CREATE INDEX IF NOT EXISTS idx_song_versions_song_id ON song_versions(song_id);

-- Function to preserve vote count when song is removed from public view
CREATE OR REPLACE FUNCTION preserve_song_votes()
RETURNS TRIGGER AS $$
BEGIN
  -- When a song is marked as not public, preserve its vote count
  IF OLD.is_public = true AND NEW.is_public = false THEN
    NEW.original_vote_count = COALESCE(OLD.vote_count, 0);
    NEW.removed_at = timezone('utc'::text, now());
    
    -- Create a version record
    INSERT INTO song_versions (song_id, version_number, vote_count, is_public, removed_at)
    VALUES (NEW.id, 1, COALESCE(OLD.vote_count, 0), false, timezone('utc'::text, now()));
  END IF;
  
  -- When a song is restored to public view, restore vote count
  IF OLD.is_public = false AND NEW.is_public = true AND NEW.original_vote_count > 0 THEN
    NEW.vote_count = NEW.original_vote_count;
    NEW.removed_at = NULL;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically preserve votes (only if it doesn't exist)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'preserve_votes_trigger' 
    AND tgrelid = 'songs'::regclass
  ) THEN
    CREATE TRIGGER preserve_votes_trigger
      BEFORE UPDATE ON songs
      FOR EACH ROW
      EXECUTE FUNCTION preserve_song_votes();
  END IF;
END $$;

-- Add comment to explain the new system
COMMENT ON TABLE songs IS 'Songs table with support for private storage, approval workflow, and vote preservation';
COMMENT ON TABLE song_versions IS 'Tracks song version history and vote preservation when songs are removed/restored'; 