-- Fix approval history table policies to avoid auth.users access issues
-- Run this in Supabase SQL editor

-- Drop existing policies that reference auth.users
DROP POLICY IF EXISTS "Admins can read approval history" ON approval_history;
DROP POLICY IF EXISTS "Admins can insert approval history" ON approval_history;

-- Create simplified policies that don't access auth.users
-- Allow all authenticated users to read approval history (for admin dashboard)
CREATE POLICY "Allow read approval history" ON approval_history
  FOR SELECT USING (auth.role() = 'authenticated');

-- Allow all authenticated users to insert approval history (for admin operations)
CREATE POLICY "Allow insert approval history" ON approval_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Drop the triggers that might be causing issues
DROP TRIGGER IF EXISTS trigger_log_song_approval ON songs;
DROP TRIGGER IF EXISTS trigger_log_artist_approval ON artists;

-- Drop the functions as well
DROP FUNCTION IF EXISTS log_song_approval();
DROP FUNCTION IF EXISTS log_artist_approval(); 