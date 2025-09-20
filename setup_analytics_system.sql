-- Launch That Song Analytics System Setup
-- This script creates all necessary tables and functions for comprehensive artist analytics

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Analytics events table
CREATE TABLE IF NOT EXISTS artist_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'pageview', 'vote', 'audio_play', 'audio_pause', 'time_spent', 'click', 'session_start', 'session_end'
  event_data jsonb DEFAULT '{}', -- Store additional event data
  user_agent text,
  ip_address text,
  session_id text, -- To track user sessions
  timestamp timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- User sessions table for tracking time spent
CREATE TABLE IF NOT EXISTS user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text UNIQUE NOT NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  ip_address text,
  user_agent text,
  start_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  end_time timestamp with time zone,
  total_time_seconds integer DEFAULT 0,
  is_active boolean DEFAULT true
);

-- Audio listening sessions
CREATE TABLE IF NOT EXISTS audio_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id text NOT NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE,
  start_time timestamp with time zone DEFAULT timezone('utc'::text, now()),
  end_time timestamp with time zone,
  duration_seconds integer DEFAULT 0,
  is_complete boolean DEFAULT false
);

-- Revenue tracking per artist
CREATE TABLE IF NOT EXISTS artist_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  total_revenue decimal(10,2) DEFAULT 0,
  total_payouts decimal(10,2) DEFAULT 0,
  pending_payouts decimal(10,2) DEFAULT 0,
  last_updated timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_analytics_artist_id ON artist_analytics(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_analytics_event_type ON artist_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_artist_analytics_timestamp ON artist_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_artist_analytics_session_id ON artist_analytics(session_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_artist_id ON user_sessions(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_artist_id ON audio_sessions(artist_id);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_song_id ON audio_sessions(song_id);
CREATE INDEX IF NOT EXISTS idx_artist_revenue_artist_id ON artist_revenue(artist_id);

-- Function to update session time when user leaves
CREATE OR REPLACE FUNCTION update_session_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.end_time IS NOT NULL AND OLD.end_time IS NULL THEN
    NEW.total_time_seconds = EXTRACT(EPOCH FROM (NEW.end_time - NEW.start_time));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for session time updates
DROP TRIGGER IF EXISTS session_time_trigger ON user_sessions;
CREATE TRIGGER session_time_trigger
  BEFORE UPDATE ON user_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_session_time();

-- Function to automatically create revenue record for new artists
CREATE OR REPLACE FUNCTION create_artist_revenue()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO artist_revenue (artist_id) VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to create revenue record for new artists
DROP TRIGGER IF EXISTS artist_revenue_trigger ON artists;
CREATE TRIGGER artist_revenue_trigger
  AFTER INSERT ON artists
  FOR EACH ROW
  EXECUTE FUNCTION create_artist_revenue();

-- Insert sample analytics data for testing (optional)
-- Uncomment the lines below to add some test data

/*
-- Sample page views
INSERT INTO artist_analytics (artist_id, event_type, event_data, session_id, timestamp) VALUES
('your-artist-id-here', 'pageview', '{"referrer": "homepage"}', 'session_1', NOW() - INTERVAL '1 day'),
('your-artist-id-here', 'pageview', '{"referrer": "search"}', 'session_2', NOW() - INTERVAL '2 hours'),
('your-artist-id-here', 'vote', '{"songId": "song-1", "voteCount": 1}', 'session_1', NOW() - INTERVAL '30 minutes');

-- Sample session data
INSERT INTO user_sessions (session_id, artist_id, ip_address, start_time, end_time, total_time_seconds) VALUES
('session_1', 'your-artist-id-here', '192.168.1.1', NOW() - INTERVAL '1 hour', NOW() - INTERVAL '30 minutes', 1800),
('session_2', 'your-artist-id-here', '192.168.1.2', NOW() - INTERVAL '30 minutes', NOW(), 1800);

-- Sample audio sessions
INSERT INTO audio_sessions (session_id, artist_id, song_id, start_time, end_time, duration_seconds) VALUES
('session_1', 'your-artist-id-here', 'song-1', NOW() - INTERVAL '45 minutes', NOW() - INTERVAL '30 minutes', 900);
*/

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT ALL PRIVILEGES ON TABLE artist_analytics TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE user_sessions TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE audio_sessions TO your_app_user;
-- GRANT ALL PRIVILEGES ON TABLE artist_revenue TO your_app_user;

-- Create a view for easy analytics queries
CREATE OR REPLACE VIEW artist_analytics_summary AS
SELECT 
  a.id as artist_id,
  a.name as artist_name,
  a.email as artist_email,
  COUNT(DISTINCT aa.session_id) as unique_sessions,
  COUNT(CASE WHEN aa.event_type = 'pageview' THEN 1 END) as page_views,
  COUNT(CASE WHEN aa.event_type = 'vote' THEN 1 END) as votes,
  COUNT(CASE WHEN aa.event_type = 'click' THEN 1 END) as clicks,
  AVG(us.total_time_seconds) as avg_session_time,
  SUM(aud.duration_seconds) as total_audio_time,
  ar.total_revenue,
  ar.total_payouts,
  ar.pending_payouts
FROM artists a
LEFT JOIN artist_analytics aa ON a.id = aa.artist_id
LEFT JOIN user_sessions us ON a.id = us.artist_id
LEFT JOIN audio_sessions aud ON a.id = aud.artist_id
LEFT JOIN artist_revenue ar ON a.id = ar.artist_id
WHERE a.status = 'approved'
GROUP BY a.id, a.name, a.email, ar.total_revenue, ar.total_payouts, ar.pending_payouts;

-- Success message
SELECT 'Analytics system setup completed successfully!' as status; 