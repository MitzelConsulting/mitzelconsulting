-- Update artists table to include email and stripe_account_id
-- Run this in Supabase SQL Editor

-- Add email column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artists' AND column_name = 'email') THEN
        ALTER TABLE artists ADD COLUMN email TEXT;
    END IF;
END $$;

-- Add stripe_account_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'artists' AND column_name = 'stripe_account_id') THEN
        ALTER TABLE artists ADD COLUMN stripe_account_id TEXT;
    END IF;
END $$;

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_artists_email ON artists(email);

-- Create index on stripe_account_id
CREATE INDEX IF NOT EXISTS idx_artists_stripe_account ON artists(stripe_account_id);

-- Update existing artists with placeholder emails (you should update these with real emails)
UPDATE artists 
SET email = CASE 
    WHEN name = 'Joey Hendrickson' THEN 'joey@launchthatsong.com'
    WHEN name = 'Douggert' THEN 'douggert@launchthatsong.com'
    WHEN name = 'Columbus Songwriters Association' THEN 'csa@launchthatsong.com'
    ELSE CONCAT(LOWER(REPLACE(name, ' ', '.')), '@launchthatsong.com')
END
WHERE email IS NULL;

-- Verify the changes
SELECT name, email, stripe_account_id FROM artists; 