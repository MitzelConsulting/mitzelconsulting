-- Create course search analytics table
CREATE TABLE IF NOT EXISTS course_search_analytics (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    search_query TEXT NOT NULL,
    user_email TEXT,
    search_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE course_search_analytics ENABLE ROW LEVEL SECURITY;

-- Create policies for public access
CREATE POLICY "Enable insert for all users" ON course_search_analytics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable select for service role" ON course_search_analytics
    FOR SELECT USING (true);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_timestamp 
ON course_search_analytics(search_timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_course_search_analytics_query 
ON course_search_analytics USING gin(to_tsvector('english', search_query));