import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Get keyword analytics
    const { data: keywordAnalytics, error: keywordError } = await supabase
      .rpc('get_keyword_analytics', { 
        p_days: days, 
        p_limit: limit 
      });

    if (keywordError) {
      console.error('Error fetching keyword analytics:', keywordError);
      return NextResponse.json({ error: 'Failed to fetch keyword analytics' }, { status: 500 });
    }

    // Get search trends
    const { data: searchTrends, error: trendsError } = await supabase
      .rpc('get_search_trends', { p_days: days });

    if (trendsError) {
      console.error('Error fetching search trends:', trendsError);
    }

    // Get popular search combinations
    const { data: popularSearches, error: popularError } = await supabase
      .rpc('get_popular_search_combinations', { 
        p_days: days, 
        p_limit: 20 
      });

    if (popularError) {
      console.error('Error fetching popular searches:', popularError);
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
