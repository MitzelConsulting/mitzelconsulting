-- Course Search Keywords Analytics Schema
-- This creates tables to track keywords used during course searches

-- 1. Create course_search_analytics table
CREATE TABLE IF NOT EXISTS course_search_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  search_query TEXT NOT NULL,
  keywords TEXT[] NOT NULL, -- Array of extracted keywords
  user_email TEXT, -- Optional user email if provided
  source_page TEXT, -- Page where search was performed
  search_mode TEXT DEFAULT 'default', -- default, course-search, etc.
  results_count INTEGER DEFAULT 0, -- Number of results returned
  session_id TEXT, -- Optional session ID for tracking
  ip_address INET, -- For basic analytics
  user_agent TEXT -- Browser information
);

-- 2. Create course_search_keywords table for individual keyword tracking
CREATE TABLE IF NOT EXISTS course_search_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  keyword TEXT NOT NULL,
  search_id UUID REFERENCES course_search_analytics(id) ON DELETE CASCADE,
  frequency INTEGER DEFAULT 1, -- How many times this keyword appears in the search
  position INTEGER, -- Position of keyword in the search query
  is_primary BOOLEAN DEFAULT false -- Whether this is the main keyword
);

-- 3. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_created_at ON course_search_analytics(created_at);
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_keywords ON course_search_analytics USING GIN(keywords);
CREATE INDEX IF NOT EXISTS idx_course_search_analytics_user_email ON course_search_analytics(user_email);
CREATE INDEX IF NOT EXISTS idx_course_search_keywords_keyword ON course_search_keywords(keyword);
CREATE INDEX IF NOT EXISTS idx_course_search_keywords_created_at ON course_search_keywords(created_at);
CREATE INDEX IF NOT EXISTS idx_course_search_keywords_search_id ON course_search_keywords(search_id);

-- 4. Create function to extract keywords from search query
CREATE OR REPLACE FUNCTION extract_keywords(search_text TEXT)
RETURNS TEXT[] AS $$
DECLARE
  keywords TEXT[];
  cleaned_text TEXT;
BEGIN
  -- Clean and normalize the search text
  cleaned_text := LOWER(TRIM(search_text));
  
  -- Remove common stop words and split into keywords
  -- This is a basic implementation - you can enhance it as needed
  keywords := string_to_array(
    regexp_replace(
      cleaned_text,
      '\b(the|and|or|but|in|on|at|to|for|of|with|by|from|up|about|into|through|during|before|after|above|below|between|among|under|over|around|near|far|here|there|where|when|why|how|what|who|which|that|this|these|those|a|an|is|are|was|were|be|been|being|have|has|had|do|does|did|will|would|could|should|may|might|must|can|shall|i|you|he|she|it|we|they|me|him|her|us|them|my|your|his|her|its|our|their|mine|yours|ours|theirs)\b',
      '',
      'gi'
    ),
    ' '
  );
  
  -- Remove empty strings and filter out very short keywords
  keywords := array_remove(keywords, '');
  keywords := array_remove(keywords, '');
  
  -- Filter out keywords shorter than 2 characters
  SELECT array_agg(keyword) INTO keywords
  FROM unnest(keywords) AS keyword
  WHERE length(keyword) >= 2;
  
  RETURN COALESCE(keywords, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- 5. Create function to get keyword analytics
CREATE OR REPLACE FUNCTION get_keyword_analytics(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 50
)
RETURNS TABLE(
  keyword TEXT,
  search_count BIGINT,
  unique_searches BIGINT,
  last_searched TIMESTAMP WITH TIME ZONE,
  avg_results_count NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csk.keyword,
    COUNT(*) as search_count,
    COUNT(DISTINCT csk.search_id) as unique_searches,
    MAX(csa.created_at) as last_searched,
    ROUND(AVG(csa.results_count), 2) as avg_results_count
  FROM course_search_keywords csk
  JOIN course_search_analytics csa ON csk.search_id = csa.id
  WHERE csa.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY csk.keyword
  ORDER BY search_count DESC, unique_searches DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Create function to get search trends over time
CREATE OR REPLACE FUNCTION get_search_trends(
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE(
  date DATE,
  total_searches BIGINT,
  unique_keywords BIGINT,
  avg_results_per_search NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    DATE(csa.created_at) as date,
    COUNT(*) as total_searches,
    COUNT(DISTINCT csk.keyword) as unique_keywords,
    ROUND(AVG(csa.results_count), 2) as avg_results_per_search
  FROM course_search_analytics csa
  LEFT JOIN course_search_keywords csk ON csa.id = csk.search_id
  WHERE csa.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY DATE(csa.created_at)
  ORDER BY date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Create function to get popular search combinations
CREATE OR REPLACE FUNCTION get_popular_search_combinations(
  p_days INTEGER DEFAULT 30,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
  search_query TEXT,
  search_count BIGINT,
  avg_results_count NUMERIC,
  last_searched TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    csa.search_query,
    COUNT(*) as search_count,
    ROUND(AVG(csa.results_count), 2) as avg_results_count,
    MAX(csa.created_at) as last_searched
  FROM course_search_analytics csa
  WHERE csa.created_at >= NOW() - INTERVAL '1 day' * p_days
  GROUP BY csa.search_query
  ORDER BY search_count DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Enable RLS (Row Level Security)
ALTER TABLE course_search_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_search_keywords ENABLE ROW LEVEL SECURITY;

-- 9. Create RLS policies for admin access
CREATE POLICY "Admin can view all search analytics" ON course_search_analytics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND admin_users.is_active = true
    )
  );

CREATE POLICY "Admin can view all search keywords" ON course_search_keywords
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users 
      WHERE admin_users.email = current_setting('request.jwt.claims', true)::json->>'email'
      AND admin_users.is_active = true
    )
  );

-- 10. Allow public access for inserting new searches
CREATE POLICY "Public can insert search analytics" ON course_search_analytics
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public can insert search keywords" ON course_search_keywords
  FOR INSERT WITH CHECK (true);

-- 11. Add comments for documentation
COMMENT ON TABLE course_search_analytics IS 'Stores course search queries and analytics data';
COMMENT ON TABLE course_search_keywords IS 'Stores individual keywords extracted from search queries';
COMMENT ON FUNCTION extract_keywords(TEXT) IS 'Extracts meaningful keywords from search text';
COMMENT ON FUNCTION get_keyword_analytics(INTEGER, INTEGER) IS 'Returns keyword analytics for specified time period';
COMMENT ON FUNCTION get_search_trends(INTEGER) IS 'Returns search trends over time';
COMMENT ON FUNCTION get_popular_search_combinations(INTEGER, INTEGER) IS 'Returns most popular search queries';

-- 12. Show success message
SELECT 'Course search keywords schema created successfully!' as status;
