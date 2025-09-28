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
    const limit = parseInt(searchParams.get('limit') || '100');

    // Get email captures with associated data
    const { data: emailCaptures, error: emailError } = await supabase
      .from('email_captures')
      .select(`
        *,
        chat_sessions!inner(
          id,
          user_name,
          user_email,
          created_at,
          source_page,
          chat_mode
        )
      `)
      .gte('captured_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString())
      .order('captured_at', { ascending: false })
      .limit(limit);

    if (emailError) {
      console.error('Error fetching email captures:', emailError);
      return NextResponse.json({ error: 'Failed to fetch email captures' }, { status: 500 });
    }

    // Get keywords associated with each email capture
    const emailCaptureData = await Promise.all(
      (emailCaptures || []).map(async (capture) => {
        // Get keywords from chat sessions
        const { data: chatKeywords, error: chatError } = await supabase
          .from('chat_messages')
          .select('message')
          .eq('session_id', capture.session_id)
          .eq('is_user_message', true);

        // Get keywords from course searches
        const { data: searchKeywords, error: searchError } = await supabase
          .from('course_search_analytics')
          .select('keywords, search_query')
          .eq('user_email', capture.email)
          .gte('created_at', new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString());

        // Check if user has created an account
        const { data: userAccount, error: userError } = await supabase
          .from('clients')
          .select('id, created_at, email')
          .eq('email', capture.email)
          .single();

        // Extract keywords from chat messages
        const chatKeywordsList = chatKeywords?.map(msg => 
          msg.message.toLowerCase().split(' ').filter((word: string) => 
            word.length > 2 && 
            !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over', 'around', 'near', 'far', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which', 'that', 'this', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs'].includes(word)
          )
        ).flat() || [];

        // Extract keywords from search queries
        const searchKeywordsList = searchKeywords?.map(search => 
          search.search_query.toLowerCase().split(' ').filter((word: string) => 
            word.length > 2 && 
            !['the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'among', 'under', 'over', 'around', 'near', 'far', 'here', 'there', 'where', 'when', 'why', 'how', 'what', 'who', 'which', 'that', 'this', 'these', 'those', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'shall', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them', 'my', 'your', 'his', 'her', 'its', 'our', 'their', 'mine', 'yours', 'ours', 'theirs'].includes(word)
          )
        ).flat() || [];

        // Combine and deduplicate keywords
        const allKeywords = [...new Set([...chatKeywordsList, ...searchKeywordsList])];
        
        // Get keyword frequency
        const keywordFrequency = allKeywords.reduce((acc, keyword) => {
          acc[keyword] = (acc[keyword] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);

        // Sort keywords by frequency
        const topKeywords = Object.entries(keywordFrequency)
          .sort(([,a], [,b]) => (b as number) - (a as number))
          .slice(0, 10)
          .map(([keyword, count]) => ({ keyword, count }));

        return {
          ...capture,
          chat_session: capture.chat_sessions,
          keywords: topKeywords,
          has_user_account: !!userAccount,
          user_account_created: userAccount?.created_at || null,
          total_keywords: allKeywords.length,
          search_queries: searchKeywords?.map(s => s.search_query) || []
        };
      })
    );

    // Get summary statistics
    const totalCaptures = emailCaptureData.length;
    const withUserAccounts = emailCaptureData.filter(capture => capture.has_user_account).length;
    const withoutUserAccounts = totalCaptures - withUserAccounts;

    return NextResponse.json({
      success: true,
      emailCaptures: emailCaptureData,
      summary: {
        totalCaptures,
        withUserAccounts,
        withoutUserAccounts,
        conversionRate: totalCaptures > 0 ? Math.round((withUserAccounts / totalCaptures) * 100) : 0
      }
    });

  } catch (error) {
    console.error('Email captures detailed analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      emailCaptures: [],
      summary: {
        totalCaptures: 0,
        withUserAccounts: 0,
        withoutUserAccounts: 0,
        conversionRate: 0
      }
    }, { status: 500 });
  }
}
