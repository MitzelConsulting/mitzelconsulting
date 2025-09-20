-- Signup Analytics Table for Admin Monitoring
-- Run this in Supabase SQL Editor

-- Create signup_analytics table
CREATE TABLE IF NOT EXISTS signup_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  artist_name TEXT NOT NULL,
  email TEXT NOT NULL,
  song_name TEXT,
  signup_status TEXT DEFAULT 'success' CHECK (signup_status IN ('success', 'failed', 'pending')),
  email_sent BOOLEAN DEFAULT false,
  email_confirmed BOOLEAN DEFAULT false,
  email_confirmed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_signup_analytics_artist_id ON signup_analytics(artist_id);
CREATE INDEX IF NOT EXISTS idx_signup_analytics_email ON signup_analytics(email);
CREATE INDEX IF NOT EXISTS idx_signup_analytics_status ON signup_analytics(signup_status);
CREATE INDEX IF NOT EXISTS idx_signup_analytics_created_at ON signup_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_signup_analytics_email_sent ON signup_analytics(email_sent);

-- Create RLS policies
ALTER TABLE signup_analytics ENABLE ROW LEVEL SECURITY;

-- Admin users can read all signup analytics
CREATE POLICY "Admin users can read signup analytics" ON signup_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Admin users can insert signup analytics
CREATE POLICY "Admin users can insert signup analytics" ON signup_analytics
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Admin users can update signup analytics
CREATE POLICY "Admin users can update signup analytics" ON signup_analytics
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Function to update email confirmation status
CREATE OR REPLACE FUNCTION update_signup_email_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Update signup analytics when email is confirmed
  IF NEW.email_confirmed_at IS NOT NULL AND OLD.email_confirmed_at IS NULL THEN
    UPDATE signup_analytics 
    SET 
      email_confirmed = true,
      email_confirmed_at = NEW.email_confirmed_at,
      updated_at = NOW()
    WHERE artist_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update signup analytics when email is confirmed
CREATE TRIGGER trigger_update_signup_email_confirmation
  AFTER UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION update_signup_email_confirmation();

-- Insert some sample data for testing (optional)
-- INSERT INTO signup_analytics (artist_id, artist_name, email, song_name, signup_status, email_sent, notes)
-- VALUES 
--   ('00000000-0000-0000-0000-000000000001', 'Test Artist', 'test@example.com', 'Test Song', 'success', false, 'Sample signup for testing');

-- Verify the table was created
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'signup_analytics'
ORDER BY ordinal_position; 