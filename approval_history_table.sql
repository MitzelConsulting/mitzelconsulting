-- Create approval history table (simplified version)
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS approval_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  item_type VARCHAR(20) NOT NULL CHECK (item_type IN ('song', 'artist')),
  item_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL CHECK (action IN ('approved', 'rejected', 'removed')),
  admin_user_id UUID,
  admin_email VARCHAR(255),
  item_title VARCHAR(255),
  item_artist_name VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_approval_history_item_type ON approval_history(item_type);
CREATE INDEX IF NOT EXISTS idx_approval_history_item_id ON approval_history(item_id);
CREATE INDEX IF NOT EXISTS idx_approval_history_created_at ON approval_history(created_at);

-- Add RLS policies
ALTER TABLE approval_history ENABLE ROW LEVEL SECURITY;

-- Allow admins to read all approval history
CREATE POLICY "Admins can read approval history" ON approval_history
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%admin%' OR auth.users.email LIKE '%launchthatsong.com%')
    )
  );

-- Allow admins to insert approval history
CREATE POLICY "Admins can insert approval history" ON approval_history
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM auth.users 
      WHERE auth.users.id = auth.uid() 
      AND (auth.users.email LIKE '%admin%' OR auth.users.email LIKE '%launchthatsong.com%')
    )
  );

-- Function to automatically log song approvals
CREATE OR REPLACE FUNCTION log_song_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when a song is approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    INSERT INTO approval_history (
      item_type,
      item_id,
      action,
      admin_user_id,
      admin_email,
      item_title,
      item_artist_name,
      notes
    )
    VALUES (
      'song',
      NEW.id,
      'approved',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      NEW.title,
      (SELECT name FROM artists WHERE id = NEW.artist_id),
      'Song approved and made public'
    );
  END IF;
  
  -- Log when a song is rejected
  IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
    INSERT INTO approval_history (
      item_type,
      item_id,
      action,
      admin_user_id,
      admin_email,
      item_title,
      item_artist_name,
      notes
    )
    VALUES (
      'song',
      NEW.id,
      'rejected',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      NEW.title,
      (SELECT name FROM artists WHERE id = NEW.artist_id),
      'Song rejected'
    );
  END IF;
  
  -- Log when a song is removed from public view
  IF OLD.is_public = true AND NEW.is_public = false THEN
    INSERT INTO approval_history (
      item_type,
      item_id,
      action,
      admin_user_id,
      admin_email,
      item_title,
      item_artist_name,
      notes
    )
    VALUES (
      'song',
      NEW.id,
      'removed',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      NEW.title,
      (SELECT name FROM artists WHERE id = NEW.artist_id),
      'Song removed from public view by artist'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for song approval logging
DROP TRIGGER IF EXISTS trigger_log_song_approval ON songs;
CREATE TRIGGER trigger_log_song_approval
  AFTER UPDATE ON songs
  FOR EACH ROW
  EXECUTE FUNCTION log_song_approval();

-- Function to log artist approvals
CREATE OR REPLACE FUNCTION log_artist_approval()
RETURNS TRIGGER AS $$
BEGIN
  -- Log when an artist is approved
  IF OLD.status != 'approved' AND NEW.status = 'approved' THEN
    INSERT INTO approval_history (
      item_type,
      item_id,
      action,
      admin_user_id,
      admin_email,
      item_title,
      item_artist_name,
      notes
    )
    VALUES (
      'artist',
      NEW.id,
      'approved',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      NEW.name,
      NEW.name,
      'Artist account approved'
    );
  END IF;
  
  -- Log when an artist is rejected
  IF OLD.status != 'rejected' AND NEW.status = 'rejected' THEN
    INSERT INTO approval_history (
      item_type,
      item_id,
      action,
      admin_user_id,
      admin_email,
      item_title,
      item_artist_name,
      notes
    )
    VALUES (
      'artist',
      NEW.id,
      'rejected',
      auth.uid(),
      current_setting('request.jwt.claims', true)::json->>'email',
      NEW.name,
      NEW.name,
      'Artist account rejected'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for artist approval logging
DROP TRIGGER IF EXISTS trigger_log_artist_approval ON artists;
CREATE TRIGGER trigger_log_artist_approval
  AFTER UPDATE ON artists
  FOR EACH ROW
  EXECUTE FUNCTION log_artist_approval(); 