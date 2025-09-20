-- Voice Comments Table
-- This table stores voice comments recorded by listeners for songs

CREATE TABLE voice_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  artist_id UUID REFERENCES artists(id) ON DELETE CASCADE,
  song_title TEXT NOT NULL,
  artist_name TEXT NOT NULL,
  audio_data TEXT NOT NULL, -- Base64 encoded audio
  audio_filename TEXT NOT NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'purchased', 'sent')),
  purchase_session_id TEXT, -- Stripe session ID when purchased
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster queries
CREATE INDEX idx_voice_comments_song_id ON voice_comments(song_id);
CREATE INDEX idx_voice_comments_status ON voice_comments(status);
CREATE INDEX idx_voice_comments_purchase_session ON voice_comments(purchase_session_id);

-- Enable Row Level Security
ALTER TABLE voice_comments ENABLE ROW LEVEL SECURITY;

-- Policy to allow all operations (you can restrict this later)
CREATE POLICY "Allow all operations on voice_comments" ON voice_comments
  FOR ALL USING (true);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_voice_comments_updated_at 
  BEFORE UPDATE ON voice_comments 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column(); 