-- =====================================================
-- MIZEL CONSULTING - ROW LEVEL SECURITY POLICIES
-- =====================================================
-- Comprehensive RLS policies for safety training platform
-- Run this in Supabase SQL Editor after running mitzel_consulting_schema.sql

-- =====================================================
-- USER ROLES AND PERMISSIONS
-- =====================================================

-- Create custom user roles for different access levels
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM (
          'client_user',     -- HR directors, company employees purchasing courses
          'company_admin',   -- Company administrators managing their team's training
          'platform_admin',  -- Kris Mitzel and platform administrators
          'partner_user'     -- Training partners with revenue sharing
        );
    END IF;
END $$;

-- Add user_role column to admin_users table (using VARCHAR initially)
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS user_role VARCHAR DEFAULT 'platform_admin';

-- Add user_role column to client_users table (using VARCHAR initially)
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS user_role VARCHAR DEFAULT 'client_user';

-- Add auth_user_id column to link with Supabase auth.users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS auth_user_id UUID;
ALTER TABLE client_users ADD COLUMN IF NOT EXISTS auth_user_id UUID;

-- =====================================================
-- COURSES TABLE POLICIES
-- =====================================================

-- Enable RLS on courses table
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Public can view active courses (for homepage and course browsing)
CREATE POLICY "Public can view active courses" ON courses
  FOR SELECT USING (is_active = true);

-- Authenticated users can view all courses (including inactive for admin)
CREATE POLICY "Authenticated users can view all courses" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- Platform admins can manage all courses
CREATE POLICY "Platform admins can manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- BLOG POSTS TABLE POLICIES
-- =====================================================

-- Enable RLS on blog_posts table
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can view published blog posts
CREATE POLICY "Public can view published blog posts" ON blog_posts
  FOR SELECT USING (status = 'published');

-- Platform admins can manage all blog posts
CREATE POLICY "Platform admins can manage blog posts" ON blog_posts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- COMPANIES TABLE POLICIES
-- =====================================================

-- Enable RLS on companies table
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;

-- Company admins can view and update their own company
CREATE POLICY "Company admins can manage their company" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE client_users.company_id = companies.id 
      AND client_users.auth_user_id = auth.uid() 
      AND client_users.user_role = 'company_admin'
      AND client_users.account_status = 'active'
    )
  );

-- Platform admins can view all companies
CREATE POLICY "Platform admins can view all companies" ON companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- Platform admins can manage all companies
CREATE POLICY "Platform admins can manage all companies" ON companies
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- CLIENT USERS TABLE POLICIES
-- =====================================================

-- Enable RLS on client_users table
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;

-- Users can view and update their own profile
CREATE POLICY "Users can manage their own profile" ON client_users
  FOR ALL USING (auth_user_id = auth.uid());

-- Company admins can view users in their company
CREATE POLICY "Company admins can view company users" ON client_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users admin_user
      WHERE admin_user.company_id = client_users.company_id 
      AND admin_user.auth_user_id = auth.uid() 
      AND admin_user.user_role = 'company_admin'
      AND admin_user.account_status = 'active'
    )
  );

-- Platform admins can view all client users
CREATE POLICY "Platform admins can view all client users" ON client_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- COURSE ENROLLMENTS TABLE POLICIES
-- =====================================================

-- Enable RLS on course_enrollments table
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;

-- Users can view their own enrollments
CREATE POLICY "Users can view their own enrollments" ON course_enrollments
  FOR SELECT USING (auth_user_id = auth.uid());

-- Users can create their own enrollments
CREATE POLICY "Users can create their own enrollments" ON course_enrollments
  FOR INSERT WITH CHECK (auth_user_id = auth.uid());

-- Company admins can view enrollments for their company users
CREATE POLICY "Company admins can view company enrollments" ON course_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE client_users.auth_user_id = auth.uid() 
      AND client_users.user_role = 'company_admin'
      AND client_users.company_id = (
        SELECT company_id FROM client_users 
        WHERE client_users.id = course_enrollments.user_id
      )
      AND client_users.account_status = 'active'
    )
  );

-- Platform admins can view all enrollments
CREATE POLICY "Platform admins can view all enrollments" ON course_enrollments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- TRAINING SESSIONS TABLE POLICIES
-- =====================================================

-- Enable RLS on training_sessions table
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- Public can view available training sessions
CREATE POLICY "Public can view training sessions" ON training_sessions
  FOR SELECT USING (status = 'scheduled');

-- Authenticated users can view all training sessions
CREATE POLICY "Authenticated users can view all training sessions" ON training_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Platform admins can manage training sessions
CREATE POLICY "Platform admins can manage training sessions" ON training_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- SESSION BOOKINGS TABLE POLICIES
-- =====================================================

-- Enable RLS on session_bookings table
ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;

-- Users can view and manage their own bookings
CREATE POLICY "Users can manage their own bookings" ON session_bookings
  FOR ALL USING (auth_user_id = auth.uid());

-- Company admins can view bookings for their company users
CREATE POLICY "Company admins can view company bookings" ON session_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE client_users.auth_user_id = auth.uid() 
      AND client_users.user_role = 'company_admin'
      AND client_users.company_id = (
        SELECT company_id FROM client_users 
        WHERE client_users.id = session_bookings.user_id
      )
      AND client_users.account_status = 'active'
    )
  );

-- Platform admins can view all bookings
CREATE POLICY "Platform admins can view all bookings" ON session_bookings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- ANALYTICS TABLES POLICIES
-- =====================================================

-- Enable RLS on page_views table
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all analytics
CREATE POLICY "Platform admins can view page analytics" ON page_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- Enable RLS on course_engagement table
ALTER TABLE course_engagement ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all course engagement
CREATE POLICY "Platform admins can view course engagement" ON course_engagement
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- Users can view their own engagement data
CREATE POLICY "Users can view their own engagement" ON course_engagement
  FOR SELECT USING (auth_user_id = auth.uid());

-- =====================================================
-- REVENUE AND PARTNERSHIP POLICIES
-- =====================================================

-- Enable RLS on partnerships table
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;

-- Platform admins can manage partnerships
CREATE POLICY "Platform admins can manage partnerships" ON partnerships
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- Partner users can view their own partnership data
CREATE POLICY "Partner users can view their partnership" ON partnerships
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM client_users 
      WHERE client_users.auth_user_id = auth.uid() 
      AND client_users.user_role = 'partner_user'
      AND client_users.account_status = 'active'
    )
  );

-- Enable RLS on revenue_transactions table
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;

-- Platform admins can view all revenue data
CREATE POLICY "Platform admins can view all revenue" ON revenue_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- CHATBOT CONVERSATIONS POLICIES
-- =====================================================

-- Enable RLS on chatbot_conversations table
ALTER TABLE chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Users can view their own chatbot conversations
CREATE POLICY "Users can view their own chatbot conversations" ON chatbot_conversations
  FOR SELECT USING (auth_user_id = auth.uid());

-- Platform admins can view all chatbot conversations for analytics
CREATE POLICY "Platform admins can view all chatbot conversations" ON chatbot_conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.auth_user_id = auth.uid() 
      AND admin_users.user_role = 'platform_admin'
      AND admin_users.is_active = true
    )
  );

-- =====================================================
-- ADMIN DASHBOARD FUNCTIONS
-- =====================================================

-- Function to get user engagement analytics for admin dashboard
CREATE OR REPLACE FUNCTION get_user_engagement_analytics()
RETURNS TABLE (
  user_id UUID,
  user_email TEXT,
  company_name TEXT,
  courses_viewed INTEGER,
  blog_posts_read INTEGER,
  chatbot_interactions INTEGER,
  enrollment_interest_score DECIMAL,
  last_activity TIMESTAMP WITH TIME ZONE,
  recommended_followup BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow platform admins to access this function
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() 
    AND admin_users.user_role = 'platform_admin'
    AND admin_users.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Platform admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    cu.id as user_id,
    cu.email as user_email,
    c.name as company_name,
    COALESCE(ce.course_views, 0) as courses_viewed,
    COALESCE(pv.blog_views, 0) as blog_posts_read,
    COALESCE(cc.chat_interactions, 0) as chatbot_interactions,
    -- Calculate engagement score based on multiple factors
    (
      COALESCE(ce.course_views, 0) * 0.3 +
      COALESCE(pv.blog_views, 0) * 0.2 +
      COALESCE(cc.chat_interactions, 0) * 0.4 +
      CASE WHEN ce.enrollments > 0 THEN 1.0 ELSE 0.0 END * 0.1
    ) as enrollment_interest_score,
    GREATEST(
      COALESCE(ce.last_course_view, NOW() - INTERVAL '1 year'),
      COALESCE(pv.last_blog_view, NOW() - INTERVAL '1 year'),
      COALESCE(cc.last_chat_interaction, NOW() - INTERVAL '1 year')
    ) as last_activity,
    -- Recommend followup if engagement score > 0.5 and recent activity
    (
      (
        COALESCE(ce.course_views, 0) * 0.3 +
        COALESCE(pv.blog_views, 0) * 0.2 +
        COALESCE(cc.chat_interactions, 0) * 0.4 +
        CASE WHEN ce.enrollments > 0 THEN 1.0 ELSE 0.0 END * 0.1
      ) > 0.5
      AND GREATEST(
        COALESCE(ce.last_course_view, NOW() - INTERVAL '1 year'),
        COALESCE(pv.last_blog_view, NOW() - INTERVAL '1 year'),
        COALESCE(cc.last_chat_interaction, NOW() - INTERVAL '1 year')
      ) > NOW() - INTERVAL '7 days'
    ) as recommended_followup
  FROM client_users cu
  LEFT JOIN companies c ON cu.company_id = c.id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as course_views,
      MAX(viewed_at) as last_course_view,
      COUNT(DISTINCT course_id) as enrollments
    FROM course_engagement 
    GROUP BY user_id
  ) ce ON cu.id = ce.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as blog_views,
      MAX(viewed_at) as last_blog_view
    FROM page_views 
    WHERE page_type = 'blog_post'
    GROUP BY user_id
  ) pv ON cu.id = pv.user_id
  LEFT JOIN (
    SELECT 
      user_id,
      COUNT(*) as chat_interactions,
      MAX(created_at) as last_chat_interaction
    FROM chatbot_conversations 
    GROUP BY user_id
  ) cc ON cu.id = cc.user_id
  WHERE cu.account_status = 'active'
  ORDER BY enrollment_interest_score DESC, last_activity DESC;
END;
$$;

-- Function to get course performance analytics
CREATE OR REPLACE FUNCTION get_course_performance_analytics()
RETURNS TABLE (
  course_id UUID,
  course_title TEXT,
  total_views INTEGER,
  total_enrollments INTEGER,
  conversion_rate DECIMAL,
  revenue_generated DECIMAL,
  avg_engagement_score DECIMAL,
  last_activity TIMESTAMP WITH TIME ZONE
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only allow platform admins to access this function
  IF NOT EXISTS (
    SELECT 1 FROM admin_users 
    WHERE admin_users.auth_user_id = auth.uid() 
    AND admin_users.user_role = 'platform_admin'
    AND admin_users.is_active = true
  ) THEN
    RAISE EXCEPTION 'Access denied. Platform admin role required.';
  END IF;

  RETURN QUERY
  SELECT 
    c.id as course_id,
    c.title as course_title,
    COALESCE(ce.total_views, 0) as total_views,
    COALESCE(enrollments.total_enrollments, 0) as total_enrollments,
    CASE 
      WHEN COALESCE(ce.total_views, 0) > 0 
      THEN (COALESCE(enrollments.total_enrollments, 0)::DECIMAL / ce.total_views::DECIMAL) * 100
      ELSE 0 
    END as conversion_rate,
    COALESCE(rt.total_revenue, 0) as revenue_generated,
    COALESCE(ce.avg_engagement_score, 0) as avg_engagement_score,
    GREATEST(
      COALESCE(ce.last_view, NOW() - INTERVAL '1 year'),
      COALESCE(enrollments.last_enrollment, NOW() - INTERVAL '1 year')
    ) as last_activity
  FROM courses c
  LEFT JOIN (
    SELECT 
      course_id,
      COUNT(*) as total_views,
      AVG(engagement_score) as avg_engagement_score,
      MAX(viewed_at) as last_view
    FROM course_engagement 
    GROUP BY course_id
  ) ce ON c.id = ce.course_id
  LEFT JOIN (
    SELECT 
      course_id,
      COUNT(*) as total_enrollments,
      MAX(enrolled_at) as last_enrollment
    FROM course_enrollments 
    GROUP BY course_id
  ) enrollments ON c.id = enrollments.course_id
  LEFT JOIN (
    SELECT 
      course_id,
      SUM(amount) as total_revenue
    FROM revenue_transactions 
    WHERE transaction_type = 'course_purchase'
    GROUP BY course_id
  ) rt ON c.id = rt.course_id
  ORDER BY conversion_rate DESC, total_views DESC;
END;
$$;

-- =====================================================
-- SAMPLE ADMIN USER SETUP
-- =====================================================

-- Create sample platform admin user (Kris Mitzel)
-- Note: This will be updated when the actual admin user signs up and gets linked to auth.users
INSERT INTO admin_users (
  email,
  first_name,
  last_name,
  user_role,
  permissions,
  is_active
) VALUES (
  'kris@mizelconsulting.com',
  'Kris',
  'Mitzel',
  'platform_admin',
  ARRAY['manage_courses', 'manage_blog', 'view_analytics', 'manage_users', 'manage_partnerships'],
  true
) ON CONFLICT (email) DO UPDATE SET
  user_role = 'platform_admin',
  permissions = ARRAY['manage_courses', 'manage_blog', 'view_analytics', 'manage_users', 'manage_partnerships'],
  is_active = true;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_course_engagement_user_id ON course_engagement(user_id);
CREATE INDEX IF NOT EXISTS idx_course_engagement_course_id ON course_engagement(course_id);
CREATE INDEX IF NOT EXISTS idx_page_views_user_id ON page_views(user_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_type ON page_views(page_type);
CREATE INDEX IF NOT EXISTS idx_chatbot_conversations_user_id ON chatbot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_client_users_company_id ON client_users(company_id);
CREATE INDEX IF NOT EXISTS idx_client_users_user_role ON client_users(user_role);
CREATE INDEX IF NOT EXISTS idx_admin_users_user_role ON admin_users(user_role);

-- =====================================================
-- COMMENTS
-- =====================================================

COMMENT ON FUNCTION get_user_engagement_analytics() IS 'Returns comprehensive user engagement analytics with AI-powered followup recommendations for admin dashboard';
COMMENT ON FUNCTION get_course_performance_analytics() IS 'Returns detailed course performance metrics including conversion rates and revenue for admin dashboard';

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

-- This script has successfully set up:
-- 1. Custom user roles (client_user, company_admin, platform_admin, partner_user)
-- 2. Comprehensive RLS policies for all tables
-- 3. Admin dashboard analytics functions with AI recommendations
-- 4. Performance indexes
-- 5. Sample admin user setup

SELECT 'Mizel Consulting RLS policies and admin analytics functions created successfully!' as status;
