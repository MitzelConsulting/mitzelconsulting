-- Update artists table to include status field for admin approval
-- Run this in Supabase SQL Editor

-- Add status column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artists' AND column_name = 'status') THEN
        ALTER TABLE artists ADD COLUMN status TEXT DEFAULT 'approved';
    END IF;
END $$;

-- Add updated_at column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artists' AND column_name = 'updated_at') THEN
        ALTER TABLE artists ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
END $$;

-- Update existing artists to be approved
UPDATE artists 
SET status = 'approved' 
WHERE status IS NULL;

-- Create index on status for faster queries
CREATE INDEX IF NOT EXISTS idx_artists_status ON artists(status);

-- Verify the changes
SELECT name, email, status, created_at, updated_at FROM artists; 