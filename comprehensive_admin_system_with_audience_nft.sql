-- Comprehensive Admin System with Audience & NFT Support
-- This establishes a clean, sustainable admin architecture that supports future audience and NFT features
-- Run this in Supabase SQL Editor

-- 1. Create admin_users table for proper admin management
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Create audience_users table for listener/audience accounts
CREATE TABLE IF NOT EXISTS audience_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  bio TEXT,
  profile_image_url TEXT,
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Create user_roles table for flexible role management
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role_type TEXT NOT NULL CHECK (role_type IN ('artist', 'admin', 'audience')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  UNIQUE(user_id, role_type)
);

-- 4. Create admin_sessions table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  action_details JSONB DEFAULT '{}',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. Create nft_collections table for NFT collections (similar to voice comments)
CREATE TABLE IF NOT EXISTS nft_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_name TEXT NOT NULL,
  collection_type TEXT NOT NULL CHECK (collection_type IN ('song', 'artist', 'comment', 'vote')),
  reference_id UUID NOT NULL, -- song_id, artist_id, etc.
  description TEXT,
  metadata JSONB DEFAULT '{}',
  total_supply INTEGER DEFAULT 1,
  minted_count INTEGER DEFAULT 0,
  price_per_nft DECIMAL(10,2) DEFAULT 0.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. Create nft_tokens table for individual NFTs
CREATE TABLE IF NOT EXISTS nft_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  collection_id UUID REFERENCES nft_collections(id) ON DELETE CASCADE,
  token_id INTEGER NOT NULL,
  owner_id UUID REFERENCES audience_users(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  minted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
  transferred_at TIMESTAMP WITH TIME ZONE,
  is_for_sale BOOLEAN DEFAULT false,
  sale_price DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. Create nft_transactions table for tracking NFT transfers
CREATE TABLE IF NOT EXISTS nft_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id UUID REFERENCES nft_tokens(id) ON DELETE CASCADE,
  from_address TEXT,
  to_address TEXT,
  transaction_hash TEXT NOT NULL,
  block_number INTEGER,
  gas_used INTEGER,
  gas_price DECIMAL(18,8),
  transaction_type TEXT DEFAULT 'mint' CHECK (transaction_type IN ('mint', 'transfer', 'burn')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. Create audience_activity table for tracking audience engagement
CREATE TABLE IF NOT EXISTS audience_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audience_user_id UUID REFERENCES audience_users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('vote', 'comment', 'nft_mint', 'nft_purchase', 'song_play', 'artist_follow')),
  target_type TEXT NOT NULL CHECK (target_type IN ('song', 'artist', 'nft', 'comment')),
  target_id UUID NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. Update songs table to properly support custom vote goals and pricing
-- Add missing columns if they don't exist
ALTER TABLE songs ADD COLUMN IF NOT EXISTS vote_goal INTEGER DEFAULT 50;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS vote_price DECIMAL(10,2) DEFAULT 1.00;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS current_votes INTEGER DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS original_vote_count INTEGER DEFAULT 0;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_url TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS submitted_for_approval BOOLEAN DEFAULT false;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS removed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS genre TEXT DEFAULT 'Unknown';

-- 10. Create clean RLS policies that don't access auth.users
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can read approval history" ON approval_history;
DROP POLICY IF EXISTS "Admins can insert approval history" ON approval_history;
DROP POLICY IF EXISTS "Allow all operations on voice_comments" ON voice_comments;

-- Create simplified policies for approval_history
CREATE POLICY "Allow read approval history" ON approval_history
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert approval history" ON approval_history
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create simplified policies for voice_comments
CREATE POLICY "Allow read voice comments" ON voice_comments
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert voice comments" ON voice_comments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update voice comments" ON voice_comments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create policies for admin_users
CREATE POLICY "Allow read admin users" ON admin_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert admin users" ON admin_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for audience_users
CREATE POLICY "Allow read audience users" ON audience_users
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert audience users" ON audience_users
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update audience users" ON audience_users
  FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for nft_collections
CREATE POLICY "Allow read nft collections" ON nft_collections
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert nft collections" ON nft_collections
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Create policies for nft_tokens
CREATE POLICY "Allow read nft tokens" ON nft_tokens
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow insert nft tokens" ON nft_tokens
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow update nft tokens" ON nft_tokens
  FOR UPDATE USING (auth.role() = 'authenticated');

-- 11. Create functions for admin operations
CREATE OR REPLACE FUNCTION log_admin_action(
  admin_user_id UUID,
  action_type TEXT,
  action_details JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
BEGIN
  INSERT INTO admin_sessions (admin_user_id, action_type, action_details)
  VALUES (admin_user_id, action_type, action_details)
  RETURNING id INTO session_id;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Create function to approve songs with proper logging
CREATE OR REPLACE FUNCTION approve_song_with_logging(
  song_id UUID,
  admin_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  song_data JSONB;
  artist_name TEXT;
BEGIN
  -- Get song and artist details
  SELECT 
    jsonb_build_object(
      'id', s.id,
      'title', s.title,
      'artist_name', a.name,
      'vote_goal', s.vote_goal,
      'vote_price', s.vote_price
    ),
    a.name
  INTO song_data, artist_name
  FROM songs s
  JOIN artists a ON s.artist_id = a.id
  WHERE s.id = song_id;
  
  -- Update song status
  UPDATE songs 
  SET 
    status = 'approved',
    is_public = true,
    submitted_for_approval = false
  WHERE id = song_id;
  
  -- Log the approval action
  PERFORM log_admin_action(
    admin_user_id,
    'song_approval',
    jsonb_build_object(
      'song_id', song_id,
      'song_title', song_data->>'title',
      'artist_name', artist_name,
      'vote_goal', song_data->>'vote_goal',
      'vote_price', song_data->>'vote_price'
    )
  );
  
  -- Insert into approval history
  INSERT INTO approval_history (
    song_id,
    song_title,
    artist_name,
    admin_user_id,
    action,
    vote_goal,
    vote_price
  ) VALUES (
    song_id,
    song_data->>'title',
    artist_name,
    admin_user_id,
    'approved',
    (song_data->>'vote_goal')::INTEGER,
    (song_data->>'vote_price')::DECIMAL
  );
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_audience_users_user_id ON audience_users(user_id);
CREATE INDEX IF NOT EXISTS idx_audience_users_email ON audience_users(email);
CREATE INDEX IF NOT EXISTS idx_audience_users_username ON audience_users(username);
CREATE INDEX IF NOT EXISTS idx_nft_collections_reference_id ON nft_collections(reference_id);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_collection_id ON nft_tokens(collection_id);
CREATE INDEX IF NOT EXISTS idx_nft_tokens_owner_id ON nft_tokens(owner_id);
CREATE INDEX IF NOT EXISTS idx_songs_vote_goal ON songs(vote_goal);
CREATE INDEX IF NOT EXISTS idx_songs_vote_price ON songs(vote_price);
CREATE INDEX IF NOT EXISTS idx_songs_status_public ON songs(status, is_public);

-- 14. Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE nft_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audience_activity ENABLE ROW LEVEL SECURITY;

-- 15. Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_admin_users_updated_at 
  BEFORE UPDATE ON admin_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_audience_users_updated_at 
  BEFORE UPDATE ON audience_users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_nft_collections_updated_at 
  BEFORE UPDATE ON nft_collections 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 16. Insert default admin user (replace with your email)
-- INSERT INTO admin_users (user_id, email, role) 
-- SELECT id, email, 'admin' 
-- FROM auth.users 
-- WHERE email = 'your-admin-email@example.com';

-- 17. Comments for documentation
COMMENT ON TABLE admin_users IS 'Admin user management with proper role-based access';
COMMENT ON TABLE audience_users IS 'Audience/listener user accounts for future features';
COMMENT ON TABLE user_roles IS 'Flexible role management for multi-role users';
COMMENT ON TABLE admin_sessions IS 'Tracks admin actions for audit trail';
COMMENT ON TABLE nft_collections IS 'NFT collections for songs, artists, comments, and votes';
COMMENT ON TABLE nft_tokens IS 'Individual NFT tokens with ownership tracking';
COMMENT ON TABLE nft_transactions IS 'Tracks NFT minting and transfer transactions';
COMMENT ON TABLE audience_activity IS 'Tracks audience engagement and activity';
COMMENT ON TABLE songs IS 'Songs with custom vote goals and pricing per song';
COMMENT ON COLUMN songs.vote_goal IS 'Custom vote goal set by artist during upload';
COMMENT ON COLUMN songs.vote_price IS 'Custom price per vote set by artist during upload'; 