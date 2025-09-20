-- Add genre column to songs table
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre text DEFAULT 'Unknown'; 