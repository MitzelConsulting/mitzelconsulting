-- Complete songs table update for song management feature
-- Run this in Supabase SQL editor

-- Add missing columns (using correct field names)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre text DEFAULT 'Unknown';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_url text;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_size integer;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS submitted_for_approval boolean DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS removed_at timestamp with time zone;

-- Note: vote_goal, current_votes, and original_vote_count already exist 