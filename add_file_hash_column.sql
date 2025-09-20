-- Add file_hash column to songs table for integrity checking
-- Run this in Supabase SQL Editor

-- Add file_hash column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'songs' AND column_name = 'file_hash') THEN
        ALTER TABLE songs ADD COLUMN file_hash TEXT;
    END IF;
END $$;

-- Create index on file_hash for faster lookups
CREATE INDEX IF NOT EXISTS idx_songs_file_hash ON songs(file_hash);

-- Verify the changes
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'songs' AND column_name = 'file_hash'; 