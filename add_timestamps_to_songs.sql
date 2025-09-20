-- This script adds missing timestamp columns to the 'songs' table.
-- Run this in your Supabase SQL Editor to fix the final "column not found" error.

-- Add created_at column if it does not exist
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Add updated_at column if it does not exist
ALTER TABLE songs
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- Verify that the columns were added successfully
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM
  information_schema.columns
WHERE
  table_schema = 'public' AND table_name = 'songs'
  AND column_name IN ('created_at', 'updated_at');

-- After running this, the artist signup process should be able to create song records successfully. 