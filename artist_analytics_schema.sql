-- Artist Analytics System
-- Comprehensive tracking for artist page performance

-- Analytics events table
CREATE TABLE IF NOT EXISTS artist_analytics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id uuid REFERENCES artists(id) ON DELETE CASCADE,
  event_type text NOT NULL, -- 'pageview', 'vote', 'audio_play', 'audio_pause', 'time_spent', 'click'
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

-- Artist page views and visitor tracking
CREATE TABLE IF NOT EXISTS artist_page_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    visitor_ip VARCHAR(45),
    user_agent TEXT,
    referrer TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id VARCHAR(255),
    page_load_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Visitor sessions for tracking time spent
CREATE TABLE IF NOT EXISTS visitor_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    session_id VARCHAR(255) UNIQUE NOT NULL,
    visitor_ip VARCHAR(45),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    total_time_seconds INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audio listening sessions
CREATE TABLE IF NOT EXISTS audio_listening_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    visitor_ip VARCHAR(45),
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER DEFAULT 0,
    audio_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Revenue tracking per song
CREATE TABLE IF NOT EXISTS song_revenue (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    total_revenue DECIMAL(10,2) DEFAULT 0.00,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    artist_payout DECIMAL(10,2) DEFAULT 0.00,
    purchase_count INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual purchase transactions
CREATE TABLE IF NOT EXISTS purchase_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
    song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
    stripe_payment_intent_id VARCHAR(255),
    amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) DEFAULT 0.00,
    artist_payout DECIMAL(10,2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending',
    customer_email VARCHAR(255),
    purchase_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    payout_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_artist_analytics_artist_id ON artist_analytics(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_analytics_event_type ON artist_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_artist_analytics_timestamp ON artist_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_user_sessions_artist_id ON user_sessions(artist_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session_id ON user_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_artist_id ON audio_sessions(artist_id);
CREATE INDEX IF NOT EXISTS idx_audio_sessions_song_id ON audio_sessions(song_id);
CREATE INDEX IF NOT EXISTS idx_artist_page_views_artist_id ON artist_page_views(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_page_views_timestamp ON artist_page_views(timestamp);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_artist_id ON visitor_sessions(artist_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_session_id ON visitor_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_song_revenue_song_id ON song_revenue(song_id);
CREATE INDEX IF NOT EXISTS idx_song_revenue_artist_id ON song_revenue(artist_id);
CREATE INDEX IF NOT EXISTS idx_artist_revenue_artist_id ON artist_revenue(artist_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_artist_id ON purchase_transactions(artist_id);
CREATE INDEX IF NOT EXISTS idx_purchase_transactions_song_id ON purchase_transactions(song_id);

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

-- Insert default revenue records for existing artists
INSERT INTO artist_revenue (artist_id, total_revenue, total_payouts, pending_payouts, platform_fees)
SELECT id, 0.00, 0.00, 0.00, 0.00
FROM artists
WHERE id NOT IN (SELECT artist_id FROM artist_revenue);

-- Insert default revenue records for existing songs
INSERT INTO song_revenue (song_id, artist_id, total_revenue, platform_fee, artist_payout, purchase_count)
SELECT id, artist_id, 0.00, 0.00, 0.00, 0
FROM songs
WHERE id NOT IN (SELECT song_id FROM song_revenue); 