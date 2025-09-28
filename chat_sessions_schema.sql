-- Chat Sessions and Email Captures Schema
-- This creates tables to track AI assistant conversations and user information

-- 1. Create chat_sessions table
CREATE TABLE IF NOT EXISTS chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_page TEXT,
  chat_mode TEXT DEFAULT 'default',
  user_name TEXT,
  user_email TEXT,
  session_duration INTEGER, -- in seconds
  message_count INTEGER DEFAULT 0,
  is_completed BOOLEAN DEFAULT false
);

-- 2. Create chat_messages table
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, file, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- for additional message data
);

-- 3. Create email_captures table (if not exists)
CREATE TABLE IF NOT EXISTS email_captures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  captured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  source_page TEXT,
  chat_mode TEXT DEFAULT 'default',
  is_verified BOOLEAN DEFAULT false,
  UNIQUE(session_id, email)
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_email ON chat_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_email_captures_session_id ON email_captures(session_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON email_captures(email);

-- 5. Create function to update session message count
CREATE OR REPLACE FUNCTION update_session_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE chat_sessions 
  SET message_count = message_count + 1,
      updated_at = NOW()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Create trigger to automatically update message count
DROP TRIGGER IF EXISTS trigger_update_message_count ON chat_messages;
CREATE TRIGGER trigger_update_message_count
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();

-- 7. Create function to get chat session with messages
CREATE OR REPLACE FUNCTION get_chat_session_with_messages(p_session_id UUID)
RETURNS TABLE(
  session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_email TEXT,
  message_count INTEGER,
  messages JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.created_at,
    cs.user_name,
    cs.user_email,
    cs.message_count,
    COALESCE(
      json_agg(
        json_build_object(
          'id', cm.id,
          'message', cm.message,
          'is_user_message', cm.is_user_message,
          'created_at', cm.created_at
        ) ORDER BY cm.created_at
      ) FILTER (WHERE cm.id IS NOT NULL),
      '[]'::json
    ) as messages
  FROM chat_sessions cs
  LEFT JOIN chat_messages cm ON cs.id = cm.session_id
  WHERE cs.id = p_session_id
  GROUP BY cs.id, cs.created_at, cs.user_name, cs.user_email, cs.message_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Create function to get all chat sessions with summary
CREATE OR REPLACE FUNCTION get_all_chat_sessions()
RETURNS TABLE(
  id UUID,
  created_at TIMESTAMP WITH TIME ZONE,
  user_name TEXT,
  user_email TEXT,
  message_count INTEGER,
  source_page TEXT,
  chat_mode TEXT,
  session_duration INTEGER,
  is_completed BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cs.id,
    cs.created_at,
    COALESCE(cs.user_name, 'Unknown') as user_name,
    COALESCE(cs.user_email, 'No email provided') as user_email,
    cs.message_count,
    cs.source_page,
    cs.chat_mode,
    cs.session_duration,
    cs.is_completed
  FROM chat_sessions cs
  ORDER BY cs.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Enable RLS (Row Level Security)
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;

-- 10. Create RLS policies for admin access
CREATE POLICY "Admin can view all chat sessions" ON chat_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin can view all chat messages" ON chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin can view all email captures" ON email_captures
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND admin_users.is_active = true
    )
  );

-- 11. Allow public access for inserting new sessions and messages
CREATE POLICY "Public can insert chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert email captures" ON email_captures
  FOR INSERT WITH CHECK (true);

-- 12. Add comments for documentation
COMMENT ON TABLE chat_sessions IS 'Stores AI assistant chat session information';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON TABLE email_captures IS 'Stores captured email addresses from chat sessions';
COMMENT ON FUNCTION get_chat_session_with_messages(UUID) IS 'Returns a chat session with all its messages';
COMMENT ON FUNCTION get_all_chat_sessions() IS 'Returns all chat sessions with summary information';

-- 13. Show success message
SELECT 'Chat sessions schema created successfully!' as status;