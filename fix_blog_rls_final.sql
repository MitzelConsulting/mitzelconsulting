-- Fix Blog RLS Policies for Public Access
-- Enable RLS on blog tables
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON blog_posts;
DROP POLICY IF EXISTS "Enable read access for all users" ON blog_categories;

-- Create simple public read policies
CREATE POLICY "Enable read access for all users" ON blog_posts
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON blog_categories
    FOR SELECT USING (true);

-- Ensure the tables exist and have the right structure
CREATE TABLE IF NOT EXISTS blog_posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    slug TEXT UNIQUE NOT NULL,
    category_id UUID REFERENCES blog_categories(id),
    author_name TEXT DEFAULT 'Mitzel Consulting Team',
    published_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    featured_image_url TEXT,
    tags TEXT[],
    status TEXT DEFAULT 'published',
    view_count INTEGER DEFAULT 0,
    read_time_minutes INTEGER DEFAULT 5
);

CREATE TABLE IF NOT EXISTS blog_categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default categories if they don't exist
INSERT INTO blog_categories (name, slug, description, color) VALUES
('OSHA Training', 'osha-training', 'OSHA safety training updates and requirements', '#3B82F6'),
('Workplace Safety', 'workplace-safety', 'General workplace safety topics and best practices', '#10B981'),
('Construction Safety', 'construction-safety', 'Construction industry safety training and updates', '#F59E0B'),
('Environmental Safety', 'environmental-safety', 'Environmental safety and HAZWOPER training', '#EF4444'),
('Training Tips', 'training-tips', 'Tips and best practices for safety training delivery', '#8B5CF6'),
('Industry News', 'industry-news', 'Latest safety industry news and updates', '#6B7280')
ON CONFLICT (slug) DO NOTHING;
