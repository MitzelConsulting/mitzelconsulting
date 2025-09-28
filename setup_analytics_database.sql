-- Analytics Database Setup Script
-- This script ensures all required tables and functions exist for the analytics system

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CHAT SESSIONS AND EMAIL CAPTURES
-- =====================================================

-- 1. Create chat_sessions table if not exists
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

-- 2. Create chat_messages table if not exists
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES chat_sessions(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_user_message BOOLEAN NOT NULL,
  message_type TEXT DEFAULT 'text', -- text, image, file, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB -- for additional message data
);

-- 3. Create email_captures table if not exists
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

-- =====================================================
-- COURSE SEARCH ANALYTICS
-- =====================================================

-- 4. Create course_search_analytics table if not exists
CREATE TABLE IF NOT EXISTS course_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_query TEXT NOT NULL,
  keywords TEXT[],
  user_email TEXT,
  ip_address TEXT,
  user_agent TEXT,
  results_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create course_search_keywords table if not exists
CREATE TABLE IF NOT EXISTS course_search_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES course_search_analytics(id) ON DELETE CASCADE,
  keyword TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Chat sessions indexes
CREATE INDEX IF NOT EXISTS idx_chat_sessions_created_at ON chat_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_email ON chat_sessions(user_email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session_id ON chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_email_captures_session_id ON email_captures(session_id);
CREATE INDEX IF NOT EXISTS idx_email_captures_email ON email_captures(email);

-- Course search indexes
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_created_at ON course_search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_keywords ON course_search_analytics USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_user_email ON course_search_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_course_search_keywords_keyword ON course_search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_course_search_keywords_created_at ON course_search_keywords(created_at);
CREATE INDEX IF NOT EXISTS idx_course_search_keywords_search_id ON course_search_keywords(search_id);

-- =====================================================
-- FUNCTIONS
-- =====================================================

-- Function to update session message count
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

-- Function to get all chat sessions with summary
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

-- Function to get keyword analytics
CREATE OR REPLACE FUNCTION get_keyword_analytics(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  keyword TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csk.keyword,
    COUNT(*) as count
  FROM course_search_keywords csk
  JOIN course_search_analytics csa ON csk.search_id = csa.id
  WHERE csa.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY csk.keyword
  ORDER BY count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get search trends
CREATE OR REPLACE FUNCTION get_search_trends(p_days INTEGER DEFAULT 30)
RETURNS TABLE(
  date DATE,
  search_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(csa.created_at) as date,
    COUNT(*) as search_count
  FROM course_search_analytics csa
  LEFT JOIN course_search_keywords csk ON csa.id = csk.search_id
  WHERE csa.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY DATE(csa.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get popular search combinations
CREATE OR REPLACE FUNCTION get_popular_search_combinations(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  search_query TEXT,
  search_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csa.search_query,
    COUNT(*) as search_count
  FROM course_search_analytics csa
  WHERE csa.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY csa.search_query
  ORDER BY search_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS
-- =====================================================

-- Trigger to automatically update message count
DROP TRIGGER IF EXISTS trigger_update_message_count ON chat_messages;
CREATE TRIGGER trigger_update_message_count
  AFTER INSERT ON chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION update_session_message_count();

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_captures ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_search_keywords ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (insert only)
-- Drop existing policies first to avoid conflicts
DROP POLICY IF EXISTS "Public can insert chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Public can insert chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Public can insert email captures" ON email_captures;
DROP POLICY IF EXISTS "Public can insert search analytics" ON course_search_analytics;
DROP POLICY IF EXISTS "Public can insert search keywords" ON course_search_keywords;

-- Drop admin policies first
DROP POLICY IF EXISTS "Admin can view all chat sessions" ON chat_sessions;
DROP POLICY IF EXISTS "Admin can view all chat messages" ON chat_messages;
DROP POLICY IF EXISTS "Admin can view all email captures" ON email_captures;
DROP POLICY IF EXISTS "Admin can view all search analytics" ON course_search_analytics;
DROP POLICY IF EXISTS "Admin can view all search keywords" ON course_search_keywords;

-- Create policies for public access (insert only)
CREATE POLICY "Public can insert chat sessions" ON chat_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert chat messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert email captures" ON email_captures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert search analytics" ON course_search_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert search keywords" ON course_search_keywords
  FOR INSERT WITH CHECK (true);

-- Create policies for admin access (select)
CREATE POLICY "Admin can view all chat sessions" ON chat_sessions
  FOR SELECT USING (true);

CREATE POLICY "Admin can view all chat messages" ON chat_messages
  FOR SELECT USING (true);

CREATE POLICY "Admin can view all email captures" ON email_captures
  FOR SELECT USING (true);

CREATE POLICY "Admin can view all search analytics" ON course_search_analytics
  FOR SELECT USING (true);

CREATE POLICY "Admin can view all search keywords" ON course_search_keywords
  FOR SELECT USING (true);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================

COMMENT ON TABLE chat_sessions IS 'Stores AI assistant chat session information';
COMMENT ON TABLE chat_messages IS 'Stores individual messages within chat sessions';
COMMENT ON TABLE email_captures IS 'Stores captured email addresses from chat sessions';
COMMENT ON TABLE course_search_analytics IS 'Stores course search queries and analytics data';
COMMENT ON TABLE course_search_keywords IS 'Stores individual keywords extracted from search queries';

COMMENT ON FUNCTION get_all_chat_sessions() IS 'Returns all chat sessions with summary information';
COMMENT ON FUNCTION get_keyword_analytics(INTEGER, INTEGER) IS 'Returns keyword analytics for specified time period';
COMMENT ON FUNCTION get_search_trends(INTEGER) IS 'Returns search trends over time';
COMMENT ON FUNCTION get_popular_search_combinations(INTEGER, INTEGER) IS 'Returns most popular search queries';

-- Success message
SELECT 'Analytics database setup completed successfully!' as status;
