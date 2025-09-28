import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Create a Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'

// Only create the client if we have real credentials
const supabase = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseServiceKey !== 'placeholder_key'
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function GET(request: NextRequest) {
  try {
    // If we don't have a valid Supabase client, return an error
    if (!supabase) {
      return NextResponse.json(
        { success: false, error: 'Database connection not available' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');

    // First try to use the database function
    const { data: keywordAnalytics, error: keywordError } = await supabase
      .rpc('get_keyword_analytics', { 
        p_days: days, 
        p_limit: limit 
      });

    if (keywordError) {
      console.log('RPC function not available, falling back to direct query:', keywordError);
      
      // Fallback: Query keywords directly
      const { data: keywordAnalytics, error: fallbackError } = await supabase
        .from('course_search_keywords')
        .select(`
          keyword,
          created_at
        `)
        .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
        .limit(limit);

      if (fallbackError) {
        console.error('Error fetching keyword analytics:', fallbackError);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to fetch keyword analytics',
          details: fallbackError.message 
        }, { status: 500 });
      }

      // Group keywords by count for fallback
      const keywordCounts: Record<string, number> = {};
      keywordAnalytics?.forEach(item => {
        keywordCounts[item.keyword] = (keywordCounts[item.keyword] || 0) + 1;
      });

      const fallbackAnalytics = Object.entries(keywordCounts)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, limit);

      return NextResponse.json({
        success: true,
        analytics: {
          keywordAnalytics: fallbackAnalytics,
          searchTrends: [],
          popularSearches: [],
          summary: {
            totalSearches: keywordAnalytics?.length || 0,
            uniqueKeywords: Object.keys(keywordCounts).length,
            avgSearchesPerDay: Math.round((keywordAnalytics?.length || 0) / days)
          }
        }
      });
    }

    // Get search trends (with fallback)
    const { data: searchTrends, error: trendsError } = await supabase
      .rpc('get_search_trends', { p_days: days });

    if (trendsError) {
      console.log('Search trends RPC not available:', trendsError);
    }

    // Get popular search combinations (with fallback)
    const { data: popularSearches, error: popularError } = await supabase
      .rpc('get_popular_search_combinations', { 
        p_days: days, 
        p_limit: 20 
      });

    if (popularError) {
      console.log('Popular searches RPC not available:', popularError);
    }

    // Get total search statistics
    const { count: totalSearches, error: totalError } = await supabase
      .from('course_search_analytics')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (totalError) {
      console.error('Error fetching total searches:', totalError);
    }

    // Get unique keywords count
    const { count: uniqueKeywords, error: uniqueError } = await supabase
      .from('course_search_keywords')
      .select('keyword', { count: 'exact', head: true })
      .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

    if (uniqueError) {
      console.error('Error fetching unique keywords:', uniqueError);
    }

    return NextResponse.json({
      success: true,
      analytics: {
        keywordAnalytics: keywordAnalytics || [],
        searchTrends: searchTrends || [],
        popularSearches: popularSearches || [],
        summary: {
          totalSearches: totalSearches || 0,
          uniqueKeywords: uniqueKeywords || 0,
          avgSearchesPerDay: searchTrends ? Math.round((totalSearches || 0) / days) : 0
        }
      }
    });

  } catch (error) {
    console.error('Keywords analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      analytics: {
        keywordAnalytics: [],
        searchTrends: [],
        popularSearches: [],
        summary: {
          totalSearches: 0,
          uniqueKeywords: 0,
          avgSearchesPerDay: 0
        }
      }
    }, { status: 500 });
  }
}
