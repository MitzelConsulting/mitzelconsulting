-- =====================================================
-- MIZEL CONSULTING DATABASE SCHEMA
-- Safety Training Platform - Complete Schema
-- =====================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- PARTNERSHIP & REVENUE SHARING (CREATE FIRST)
-- =====================================================

-- Partnerships table
CREATE TABLE partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_name VARCHAR NOT NULL,
  partner_email VARCHAR,
  partner_phone VARCHAR,
  
  -- Stripe Connect
  stripe_account_id VARCHAR,
  stripe_connect_status VARCHAR DEFAULT 'pending',
  
  -- Partnership details
  partnership_type VARCHAR DEFAULT 'reseller' CHECK (partnership_type IN ('reseller', 'instructor', 'affiliate')),
  commission_rate DECIMAL(5,2) DEFAULT 10.00, -- Default 10%
  
  -- Course assignments
  assigned_courses UUID[] DEFAULT ARRAY[]::UUID[],
  commission_per_course JSONB DEFAULT '{}', -- Override rates per course
  
  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CORE PLATFORM TABLES
-- =====================================================

-- Courses table (replaces artists table)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  description TEXT,
  short_description TEXT,
  category VARCHAR NOT NULL, -- OSHA Construction, General Industry, etc.
  subcategory VARCHAR, -- Fall Protection, Electrical Safety, etc.
  duration_hours INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  certification_type VARCHAR, -- OSHA 30, OSHA 10, etc.
  certification_valid_years INTEGER,
  difficulty_level VARCHAR CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  
  -- Training delivery options
  delivery_method VARCHAR[] DEFAULT ARRAY['digital'], -- digital, onsite, hybrid
  max_participants INTEGER, -- for onsite training
  
  -- LMS Tutor integration
  lms_course_id INTEGER, -- WordPress LMS Tutor course ID
  lms_enrollment_url VARCHAR,
  
  -- Media and branding
  featured_image_url VARCHAR,
  course_preview_video_url VARCHAR,
  course_materials_url VARCHAR[], -- PDFs, handouts, etc.
  
  -- Business logic
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  partner_id UUID REFERENCES partnerships(id),
  commission_percentage DECIMAL(5,2), -- Partner commission %
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- SEO
  slug VARCHAR UNIQUE,
  meta_title VARCHAR,
  meta_description TEXT,
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  enrollment_count INTEGER DEFAULT 0,
  completion_rate DECIMAL(5,2) DEFAULT 0.00
);

-- Training sessions table (replaces songs table)
CREATE TABLE training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  session_name VARCHAR NOT NULL,
  session_type VARCHAR CHECK (session_type IN ('digital', 'onsite', 'hybrid')),
  
  -- Scheduling
  scheduled_date TIMESTAMP WITH TIME ZONE,
  scheduled_end_date TIMESTAMP WITH TIME ZONE,
  timezone VARCHAR DEFAULT 'America/New_York',
  
  -- Location (for onsite sessions)
  location_name VARCHAR,
  location_address TEXT,
  location_city VARCHAR,
  location_state VARCHAR,
  location_zip VARCHAR,
  
  -- Capacity and enrollment
  max_participants INTEGER DEFAULT 30,
  enrolled_participants INTEGER DEFAULT 0,
  waiting_list_count INTEGER DEFAULT 0,
  
  -- Status tracking
  status VARCHAR DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'postponed')),
  
  -- Instructor information
  instructor_name VARCHAR DEFAULT 'Kris Mizel',
  instructor_email VARCHAR,
  
  -- Pricing (can override course pricing)
  session_price DECIMAL(10,2),
  early_bird_price DECIMAL(10,2),
  early_bird_deadline DATE,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Notes
  instructor_notes TEXT,
  special_requirements TEXT
);

-- =====================================================
-- CLIENT & COMPANY MANAGEMENT
-- =====================================================

-- Companies table (HR directors' organizations)
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name VARCHAR NOT NULL,
  industry VARCHAR,
  company_size VARCHAR CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
  website VARCHAR,
  
  -- Contact information
  primary_contact_name VARCHAR,
  primary_contact_email VARCHAR,
  primary_contact_phone VARCHAR,
  
  -- Address
  address_line1 VARCHAR,
  address_line2 VARCHAR,
  city VARCHAR,
  state VARCHAR,
  zip_code VARCHAR,
  country VARCHAR DEFAULT 'US',
  
  -- Business details
  tax_id VARCHAR,
  duns_number VARCHAR,
  
  -- Preferences
  preferred_contact_method VARCHAR DEFAULT 'email',
  communication_preferences JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Client users table (HR directors and company representatives)
CREATE TABLE client_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  
  -- Personal information
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR,
  job_title VARCHAR,
  
  -- Company association
  company_id UUID REFERENCES companies(id),
  is_primary_contact BOOLEAN DEFAULT false,
  permission_level VARCHAR DEFAULT 'standard' CHECK (permission_level IN ('standard', 'admin', 'super_admin')),
  
  -- Account status
  email_verified BOOLEAN DEFAULT false,
  account_status VARCHAR DEFAULT 'active' CHECK (account_status IN ('active', 'suspended', 'deactivated')),
  
  -- Preferences
  notification_preferences JSONB DEFAULT '{"email": true, "sms": false, "push": true}',
  communication_preferences JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE,
  
  -- Stripe integration
  stripe_customer_id VARCHAR
);

-- =====================================================
-- ENROLLMENT & BOOKING SYSTEM
-- =====================================================

-- Course enrollments table
CREATE TABLE course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  client_user_id UUID REFERENCES client_users(id),
  company_id UUID REFERENCES companies(id),
  
  -- Enrollment details
  enrollment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  enrollment_type VARCHAR DEFAULT 'individual' CHECK (enrollment_type IN ('individual', 'company_bulk')),
  
  -- Payment information
  payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method VARCHAR,
  amount_paid DECIMAL(10,2),
  currency VARCHAR DEFAULT 'USD',
  
  -- Progress tracking
  progress_percentage DECIMAL(5,2) DEFAULT 0.00,
  completion_date TIMESTAMP WITH TIME ZONE,
  certificate_issued BOOLEAN DEFAULT false,
  certificate_url VARCHAR,
  
  -- LMS integration
  lms_enrollment_id VARCHAR,
  lms_progress_data JSONB DEFAULT '{}',
  
  -- Status
  status VARCHAR DEFAULT 'enrolled' CHECK (status IN ('enrolled', 'in_progress', 'completed', 'dropped', 'expired')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(course_id, client_user_id)
);

-- Training session bookings table
CREATE TABLE session_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES training_sessions(id),
  client_user_id UUID REFERENCES client_users(id),
  company_id UUID REFERENCES companies(id),
  
  -- Booking details
  booking_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  booking_type VARCHAR DEFAULT 'individual' CHECK (booking_type IN ('individual', 'group', 'company')),
  
  -- Participant information
  participant_count INTEGER DEFAULT 1,
  participant_details JSONB DEFAULT '[]', -- Array of participant info
  
  -- Payment information
  payment_status VARCHAR DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'refunded', 'failed')),
  payment_method VARCHAR,
  amount_paid DECIMAL(10,2),
  currency VARCHAR DEFAULT 'USD',
  
  -- Special requirements
  special_requirements TEXT,
  dietary_restrictions TEXT,
  accessibility_needs TEXT,
  
  -- Status
  status VARCHAR DEFAULT 'booked' CHECK (status IN ('booked', 'confirmed', 'attended', 'no_show', 'cancelled', 'refunded')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(session_id, client_user_id)
);

-- =====================================================
-- REVENUE TRACKING
-- =====================================================

-- Revenue tracking table
CREATE TABLE revenue_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  enrollment_id UUID REFERENCES course_enrollments(id),
  partner_id UUID REFERENCES partnerships(id),
  
  -- Transaction details
  transaction_type VARCHAR CHECK (transaction_type IN ('course_sale', 'session_booking', 'commission_payout')),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR DEFAULT 'USD',
  
  -- Stripe information
  stripe_payment_intent_id VARCHAR,
  stripe_transfer_id VARCHAR,
  
  -- Commission details
  commission_amount DECIMAL(10,2) DEFAULT 0.00,
  commission_rate DECIMAL(5,2),
  
  -- Status
  status VARCHAR DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- BLOG SYSTEM
-- =====================================================

-- Blog categories table
CREATE TABLE blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  description TEXT,
  color VARCHAR DEFAULT '#6366f1',
  
  -- SEO
  meta_title VARCHAR,
  meta_description TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Blog posts table
CREATE TABLE blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR NOT NULL,
  slug VARCHAR UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  
  -- Media
  featured_image_url VARCHAR,
  featured_image_alt VARCHAR,
  
  -- Author information
  author_name VARCHAR DEFAULT 'Kris Mizel',
  author_bio TEXT,
  author_image_url VARCHAR,
  
  -- Publishing
  published_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  
  -- Categories and tags
  category_id UUID REFERENCES blog_categories(id),
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  
  -- SEO
  seo_title VARCHAR,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Analytics
  view_count INTEGER DEFAULT 0,
  read_time_minutes INTEGER,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ADMIN SYSTEM
-- =====================================================

-- Admin users table (Kris and other admins)
CREATE TABLE admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR UNIQUE NOT NULL,
  password_hash VARCHAR,
  
  -- Personal information
  first_name VARCHAR NOT NULL,
  last_name VARCHAR NOT NULL,
  phone VARCHAR,
  
  -- Admin permissions
  role VARCHAR DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
  permissions JSONB DEFAULT '{"courses": true, "users": true, "analytics": true, "blog": true}',
  
  -- Account status
  is_active BOOLEAN DEFAULT true,
  email_verified BOOLEAN DEFAULT false,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Admin sessions table (audit trail)
CREATE TABLE admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id),
  
  -- Session details
  action VARCHAR NOT NULL,
  resource_type VARCHAR, -- courses, users, enrollments, etc.
  resource_id UUID,
  details JSONB DEFAULT '{}',
  
  -- Request information
  ip_address INET,
  user_agent TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- ANALYTICS & TRACKING
-- =====================================================

-- Page views analytics
CREATE TABLE page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Page information
  page_url VARCHAR NOT NULL,
  page_title VARCHAR,
  page_type VARCHAR, -- course, blog, homepage, etc.
  
  -- User information
  user_id UUID, -- Can be client_user_id or admin_user_id
  session_id VARCHAR,
  
  -- Visitor information
  ip_address INET,
  user_agent TEXT,
  referrer VARCHAR,
  
  -- Location data
  country VARCHAR,
  city VARCHAR,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Course engagement tracking
CREATE TABLE course_engagement (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  user_id UUID REFERENCES client_users(id),
  
  -- Engagement metrics
  time_spent_seconds INTEGER DEFAULT 0,
  pages_viewed INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  quizzes_completed INTEGER DEFAULT 0,
  
  -- Progress tracking
  last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completion_percentage DECIMAL(5,2) DEFAULT 0.00,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- CHATBOT & AI SYSTEM
-- =====================================================

-- Chatbot conversations
CREATE TABLE chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id VARCHAR NOT NULL,
  
  -- User information
  user_id UUID REFERENCES client_users(id),
  visitor_email VARCHAR,
  
  -- Conversation details
  conversation_data JSONB DEFAULT '[]',
  total_messages INTEGER DEFAULT 0,
  
  -- Lead qualification
  is_qualified_lead BOOLEAN DEFAULT false,
  lead_score INTEGER DEFAULT 0,
  interested_courses UUID[] DEFAULT ARRAY[]::UUID[],
  
  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'closed', 'escalated')),
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Courses indexes
CREATE INDEX idx_courses_category ON courses(category);
CREATE INDEX idx_courses_active ON courses(is_active);
CREATE INDEX idx_courses_featured ON courses(is_featured);
CREATE INDEX idx_courses_slug ON courses(slug);

-- Training sessions indexes
CREATE INDEX idx_training_sessions_course_id ON training_sessions(course_id);
CREATE INDEX idx_training_sessions_date ON training_sessions(scheduled_date);
CREATE INDEX idx_training_sessions_status ON training_sessions(status);

-- Client users indexes
CREATE INDEX idx_client_users_email ON client_users(email);
CREATE INDEX idx_client_users_company_id ON client_users(company_id);

-- Enrollments indexes
CREATE INDEX idx_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX idx_enrollments_user_id ON course_enrollments(client_user_id);
CREATE INDEX idx_enrollments_status ON course_enrollments(status);

-- Blog posts indexes
CREATE INDEX idx_blog_posts_published ON blog_posts(published_at) WHERE status = 'published';
CREATE INDEX idx_blog_posts_slug ON blog_posts(slug);
CREATE INDEX idx_blog_posts_category ON blog_posts(category_id);

-- Analytics indexes
CREATE INDEX idx_page_views_page_url ON page_views(page_url);
CREATE INDEX idx_page_views_created_at ON page_views(created_at);
CREATE INDEX idx_course_engagement_course_id ON course_engagement(course_id);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE revenue_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;

-- Public read access for courses and blog posts
CREATE POLICY "Courses are publicly readable" ON courses FOR SELECT USING (is_active = true);
CREATE POLICY "Blog posts are publicly readable" ON blog_posts FOR SELECT USING (status = 'published');
CREATE POLICY "Blog categories are publicly readable" ON blog_categories FOR SELECT USING (is_active = true);

-- Admin full access (will be refined with proper auth)
CREATE POLICY "Admin full access to courses" ON courses FOR ALL USING (true);
CREATE POLICY "Admin full access to training_sessions" ON training_sessions FOR ALL USING (true);
CREATE POLICY "Admin full access to companies" ON companies FOR ALL USING (true);
CREATE POLICY "Admin full access to client_users" ON client_users FOR ALL USING (true);

-- =====================================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all relevant tables
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON training_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_client_users_updated_at BEFORE UPDATE ON client_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_enrollments_updated_at BEFORE UPDATE ON course_enrollments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_session_bookings_updated_at BEFORE UPDATE ON session_bookings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_partnerships_updated_at BEFORE UPDATE ON partnerships FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_categories_updated_at BEFORE UPDATE ON blog_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blog_posts_updated_at BEFORE UPDATE ON blog_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_course_engagement_updated_at BEFORE UPDATE ON course_engagement FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chatbot_conversations_updated_at BEFORE UPDATE ON chatbot_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SAMPLE DATA FOR DEMO
-- =====================================================

-- Insert sample blog categories
INSERT INTO blog_categories (name, slug, description, color) VALUES
('OSHA Training', 'osha-training', 'Comprehensive OSHA safety training information', '#dc2626'),
('Workplace Safety', 'workplace-safety', 'General workplace safety tips and best practices', '#059669'),
('Industry News', 'industry-news', 'Latest safety industry news and updates', '#7c3aed'),
('Case Studies', 'case-studies', 'Real-world safety training success stories', '#ea580c');

-- Insert sample courses
INSERT INTO courses (title, description, short_description, category, subcategory, duration_hours, price, certification_type, certification_valid_years, difficulty_level, delivery_method, featured_image_url, slug, meta_title, meta_description) VALUES
('OSHA 30-Hour Construction Safety', 'Comprehensive construction safety training covering all major OSHA standards for the construction industry. Perfect for supervisors, foremen, and safety coordinators.', 'Complete OSHA 30-hour construction safety certification course', 'Construction Safety', 'OSHA 30-Hour', 30, 399.00, 'OSHA 30-Hour Construction', 5, 'intermediate', ARRAY['digital', 'onsite'], 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', 'osha-30-construction-safety', 'OSHA 30-Hour Construction Safety Training | Mizel Consulting', 'Get your OSHA 30-Hour Construction Safety certification. Comprehensive training for supervisors and safety professionals.'),
('OSHA 10-Hour General Industry', 'Essential safety training for general industry workers. Covers workplace hazards, safety procedures, and OSHA standards.', 'Basic OSHA 10-hour general industry safety certification', 'General Industry', 'OSHA 10-Hour', 10, 149.00, 'OSHA 10-Hour General Industry', 5, 'beginner', ARRAY['digital'], 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', 'osha-10-general-industry', 'OSHA 10-Hour General Industry Training | Mizel Consulting', 'Complete OSHA 10-Hour General Industry safety training. Essential certification for workplace safety.'),
('Fall Protection Training', 'Specialized training on fall protection systems, equipment, and procedures for construction and general industry.', 'Comprehensive fall protection safety training', 'Construction Safety', 'Fall Protection', 8, 199.00, 'Fall Protection Competent Person', 3, 'intermediate', ARRAY['digital', 'onsite'], 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', 'fall-protection-training', 'Fall Protection Training | Mizel Consulting', 'Expert fall protection training for construction and general industry workers.'),
('Electrical Safety Training', 'Critical electrical safety training covering electrical hazards, lockout/tagout, and safe work practices.', 'Essential electrical safety training for all workers', 'Electrical Safety', 'General Electrical', 16, 249.00, 'Electrical Safety Qualified Person', 3, 'advanced', ARRAY['digital', 'onsite'], 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', 'electrical-safety-training', 'Electrical Safety Training | Mizel Consulting', 'Comprehensive electrical safety training for qualified and non-qualified workers.'),
('Hazard Communication (GHS)', 'Understanding the Globally Harmonized System for chemical safety communication and workplace safety.', 'GHS Hazard Communication training for chemical safety', 'Chemical Safety', 'Hazard Communication', 4, 89.00, 'Hazard Communication GHS', 3, 'beginner', ARRAY['digital'], 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?w=800', 'hazard-communication-ghs', 'Hazard Communication GHS Training | Mizel Consulting', 'Learn GHS standards for chemical safety communication in the workplace.'),
('Workplace Violence Prevention', 'Essential training for preventing and responding to workplace violence incidents.', 'Comprehensive workplace violence prevention training', 'Workplace Safety', 'Violence Prevention', 6, 129.00, 'Workplace Violence Prevention', 2, 'beginner', ARRAY['digital'], 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800', 'workplace-violence-prevention', 'Workplace Violence Prevention Training | Mizel Consulting', 'Essential training to prevent and respond to workplace violence incidents.');

-- Insert sample blog posts
INSERT INTO blog_posts (title, slug, excerpt, content, author_name, published_at, status, category_id, tags, seo_title, seo_description) VALUES
('OSHA 30-Hour Construction Safety: What You Need to Know', 'osha-30-construction-safety-guide', 'Everything you need to know about OSHA 30-Hour Construction Safety certification, including requirements, benefits, and what to expect from the training.', 'The OSHA 30-Hour Construction Safety course is one of the most comprehensive safety training programs available for construction industry professionals. This certification is essential for supervisors, foremen, safety coordinators, and anyone with safety responsibilities on construction sites.

## What is OSHA 30-Hour Construction Safety?

The OSHA 30-Hour Construction Safety course is an in-depth training program designed to educate workers about construction safety hazards and OSHA standards. Unlike the 10-hour course, the 30-hour version provides more comprehensive coverage of safety topics and is typically required for supervisory positions.

## Who Should Take This Course?

- Construction supervisors and foremen
- Safety coordinators and managers
- Project managers with safety responsibilities
- Workers seeking career advancement
- Anyone required by their employer or state regulations

## Course Topics Covered

The 30-hour course covers a wide range of safety topics including:

- Introduction to OSHA and construction safety
- Managing safety and health programs
- Personal protective equipment (PPE)
- Health hazards in construction
- Stairways and ladders
- Fall protection
- Electrical safety
- Excavation and trenching
- Scaffolding safety
- Cranes, derricks, hoists, and conveyors
- Materials handling and storage
- Tool safety
- Welding and cutting
- Confined spaces
- Fire prevention and protection

## Benefits of Certification

- Enhanced job opportunities and career advancement
- Reduced workplace injuries and incidents
- Compliance with OSHA regulations
- Improved safety culture in your organization
- Professional development and skill enhancement

## How to Get Started

Ready to begin your OSHA 30-Hour Construction Safety training? Contact Mizel Consulting today to learn about our comprehensive training programs, available in both digital and on-site formats.', 'Kris Mizel', NOW(), 'published', (SELECT id FROM blog_categories WHERE slug = 'osha-training'), ARRAY['OSHA', 'Construction Safety', 'Training', 'Certification'], 'OSHA 30-Hour Construction Safety Training Guide | Mizel Consulting', 'Complete guide to OSHA 30-Hour Construction Safety certification. Learn requirements, benefits, and how to get started with professional safety training.'),
('5 Essential Workplace Safety Tips for HR Directors', 'workplace-safety-tips-hr-directors', 'As an HR Director, workplace safety is your responsibility. Here are 5 essential tips to create a safer work environment and protect your employees.', 'As an HR Director, you play a crucial role in ensuring workplace safety. Your responsibilities extend beyond hiring and employee relations to include creating and maintaining a safe work environment. Here are five essential workplace safety tips that every HR Director should implement.

## 1. Develop a Comprehensive Safety Program

A well-structured safety program is the foundation of workplace safety. This should include:

- Clear safety policies and procedures
- Regular safety training for all employees
- Incident reporting and investigation procedures
- Emergency response protocols
- Regular safety audits and inspections

## 2. Ensure Proper Training and Certification

All employees should receive appropriate safety training based on their job functions and workplace hazards. This includes:

- New employee safety orientation
- Job-specific safety training
- Regular refresher training
- Certification requirements for specialized roles
- Documentation of all training activities

## 3. Conduct Regular Safety Assessments

Regular safety assessments help identify potential hazards before they become problems:

- Monthly safety inspections
- Annual comprehensive safety audits
- Job hazard analyses
- Employee safety surveys
- Incident trend analysis

## 4. Foster a Culture of Safety

Creating a culture where safety is everyone''s responsibility is essential:

- Lead by example in safety practices
- Encourage employee participation in safety programs
- Recognize and reward safe behaviors
- Address unsafe behaviors promptly
- Provide open communication channels for safety concerns

## 5. Stay Current with Regulations

OSHA regulations and safety standards are constantly evolving:

- Subscribe to OSHA updates and newsletters
- Attend safety conferences and training sessions
- Network with other safety professionals
- Review and update policies regularly
- Consult with safety experts when needed

## Partner with Safety Experts

Working with experienced safety training providers like Mizel Consulting can help you implement these strategies effectively. We offer comprehensive safety training programs, consultation services, and ongoing support to help you maintain a safe workplace.

Ready to enhance your workplace safety program? Contact us today to learn how we can help protect your employees and ensure regulatory compliance.', 'Kris Mizel', NOW(), 'published', (SELECT id FROM blog_categories WHERE slug = 'workplace-safety'), ARRAY['HR', 'Workplace Safety', 'Safety Management', 'OSHA Compliance'], 'Workplace Safety Tips for HR Directors | Mizel Consulting', 'Essential workplace safety tips for HR Directors. Learn how to create a safer work environment and protect your employees with expert guidance.');

-- Insert sample admin user (Kris Mizel)
INSERT INTO admin_users (email, first_name, last_name, role, is_active, email_verified) VALUES
('kris@mizelconsulting.com', 'Kris', 'Mizel', 'super_admin', true, true);

COMMIT;
