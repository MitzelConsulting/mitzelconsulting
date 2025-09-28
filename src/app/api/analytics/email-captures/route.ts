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

    // Get all email captures with session details
    const { data: emailCaptures, error } = await supabase
      .from('email_captures')
      .select(`
        *,
        chat_sessions(
          id,
          created_at,
          message_count
        )
      `)
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Error fetching email captures:', error);
      return NextResponse.json({ 
        success: false,
        error: 'Failed to fetch email captures',
        details: error.message 
      }, { status: 500 });
    }

    // Calculate statistics from the email captures data
    const totalCaptures = emailCaptures?.length || 0;
    const totalMessages = emailCaptures?.reduce((sum, capture) => {
      // Get message count from the related chat session
      const chatSession = capture.chat_sessions;
      return sum + (chatSession?.message_count || 0);
    }, 0) || 0;
    const avgMessagesPerCapture = totalCaptures > 0 ? Math.round(totalMessages / totalCaptures) : 0;

    // Get captures by day for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: dailyCaptures, error: dailyError } = await supabase
      .from('email_captures')
      .select('captured_at')
      .gte('captured_at', thirtyDaysAgo.toISOString())
      .order('captured_at', { ascending: true });

    if (dailyError) {
      console.error('Error fetching daily captures:', dailyError);
    }

    // Group by day
    const dailyStats = dailyCaptures?.reduce((acc: any, capture) => {
      const date = new Date(capture.captured_at).toISOString().split('T')[0];
      acc[date] = (acc[date] || 0) + 1;
      return acc;
    }, {}) || {};

    return NextResponse.json({
      success: true,
      data: {
        emailCaptures: emailCaptures || [],
        statistics: {
          totalCaptures,
          totalMessages,
          avgMessagesPerCapture,
          dailyStats
        }
      }
    });

  } catch (error) {
    console.error('Email captures analytics error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
