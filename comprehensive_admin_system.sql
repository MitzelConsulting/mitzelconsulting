-- Comprehensive Admin System Setup
-- This establishes a clean, sustainable admin architecture
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

-- 2. Create admin_sessions table for tracking admin actions
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  target_table TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. Update approval_history table to remove auth.users dependencies
DROP POLICY IF EXISTS "Admins can read approval history" ON approval_history;
DROP POLICY IF EXISTS "Admins can insert approval history" ON approval_history;
DROP POLICY IF EXISTS "Allow read approval history" ON approval_history;
DROP POLICY IF EXISTS "Allow insert approval history" ON approval_history;

-- Create clean policies for approval_history
CREATE POLICY "Admin users can manage approval history" ON approval_history
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- 4. Remove problematic triggers and functions
DROP TRIGGER IF EXISTS trigger_log_song_approval ON songs;
DROP TRIGGER IF EXISTS trigger_log_artist_approval ON artists;
DROP FUNCTION IF EXISTS log_song_approval();
DROP FUNCTION IF EXISTS log_artist_approval();

-- 5. Create clean admin functions that don't access auth.users
CREATE OR REPLACE FUNCTION is_admin_user()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.user_id = auth.uid() 
    AND admin_users.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
  p_action_type TEXT,
  p_target_table TEXT DEFAULT NULL,
  p_target_id UUID DEFAULT NULL,
  p_details JSONB DEFAULT '{}'
)
RETURNS VOID AS $$
DECLARE
  v_admin_user_id UUID;
BEGIN
  -- Get admin user ID
  SELECT id INTO v_admin_user_id 
  FROM admin_users 
  WHERE user_id = auth.uid() 
  AND is_active = true;
  
  -- Log the action
  INSERT INTO admin_sessions (
    admin_user_id,
    session_id,
    action_type,
    target_table,
    target_id,
    details
  ) VALUES (
    v_admin_user_id,
    gen_random_uuid()::TEXT,
    p_action_type,
    p_target_table,
    p_target_id,
    p_details
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to log approval history
CREATE OR REPLACE FUNCTION log_approval_history(
  p_item_type TEXT,
  p_item_id UUID,
  p_action TEXT,
  p_item_title TEXT,
  p_item_artist_name TEXT,
  p_notes TEXT DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_admin_user_id UUID;
  v_admin_email TEXT;
BEGIN
  -- Get admin user details
  SELECT au.id, au.email INTO v_admin_user_id, v_admin_email
  FROM admin_users au
  WHERE au.user_id = auth.uid() 
  AND au.is_active = true;
  
  -- Log to approval history
  INSERT INTO approval_history (
    item_type,
    item_id,
    action,
    admin_user_id,
    admin_email,
    item_title,
    item_artist_name,
    notes
  ) VALUES (
    p_item_type,
    p_item_id,
    p_action,
    v_admin_user_id,
    v_admin_email,
    p_item_title,
    p_item_artist_name,
    p_notes
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_users_user_id ON admin_users(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_action_type ON admin_sessions(action_type);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_created_at ON admin_sessions(created_at);

-- 9. Enable RLS on new tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for admin tables
CREATE POLICY "Users can view their own admin record" ON admin_users
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin users can view admin sessions" ON admin_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.user_id = auth.uid() 
      AND admin_users.is_active = true
    )
  );

-- 11. Create function to check if current user is admin
CREATE OR REPLACE FUNCTION current_user_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = auth.uid() 
    AND is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Add comments for documentation
COMMENT ON TABLE admin_users IS 'Stores admin user accounts and roles';
COMMENT ON TABLE admin_sessions IS 'Tracks admin actions for audit trail';
COMMENT ON FUNCTION is_admin_user() IS 'Returns true if current user is an admin';
COMMENT ON FUNCTION log_admin_action() IS 'Logs admin actions for audit trail';
COMMENT ON FUNCTION log_approval_history() IS 'Logs approval/rejection actions';
COMMENT ON FUNCTION current_user_is_admin() IS 'Returns true if current user is an admin';

-- 13. Insert initial admin user (replace with your actual admin email)
-- IMPORTANT: Replace 'your-admin-email@example.com' with your actual admin email
-- You'll need to get the user_id from auth.users table after creating the auth user
INSERT INTO admin_users (email, role) 
VALUES ('your-admin-email@example.com', 'super_admin')
ON CONFLICT (email) DO NOTHING; 