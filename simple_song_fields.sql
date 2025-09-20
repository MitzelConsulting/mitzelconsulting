-- Simple addition of essential song fields
-- Run this in Supabase SQL editor

-- Add file URL field
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_url text;

-- Add file size field  
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_size integer;

-- Add status field (if not exists)
ALTER TABLE songs ADD COLUMN IF NOT EXISTS status text DEFAULT 'pending';

-- Add public visibility field
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT false;

-- Add submitted for approval field
ALTER TABLE songs ADD COLUMN IF NOT EXISTS submitted_for_approval boolean DEFAULT false; 