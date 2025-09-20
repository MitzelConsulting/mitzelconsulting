-- This script adds missing vote-related columns to the 'songs' table.
-- Run this in your Supabase SQL Editor to fix the "column not found" errors.

-- Add vote_count column if it does not exist
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0;

-- Add vote_goal column if it does not exist
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS vote_goal INTEGER DEFAULT 100;

-- Verify that the columns were added successfully
SELECT
  column_name,
  data_type,
  column_default
FROM
  information_schema.columns
WHERE
  table_schema = 'public' AND table_name = 'songs'
  AND column_name IN ('vote_count', 'vote_goal');

-- After running this, the artist signup process should be able to create song records successfully. 