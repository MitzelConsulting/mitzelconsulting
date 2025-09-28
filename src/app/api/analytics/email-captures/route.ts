import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Get all email captures with session details
    const { data: emailCaptures, error } = await supabase
      .from('email_captures')
      .select(`
        *,
        chat_sessions!inner(
          id,
          session_id,
          created_at,
          total_messages
        )
      `)
      .order('captured_at', { ascending: false });

    if (error) {
      console.error('Error fetching email captures:', error);
      return NextResponse.json({ error: 'Failed to fetch email captures' }, { status: 500 });
    }

    // Get summary statistics
    const { data: stats, error: statsError } = await supabase
      .from('email_captures')
      .select('captured_at, total_messages');

    if (statsError) {
      console.error('Error fetching stats:', statsError);
      return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 });
    }

    // Calculate statistics
    const totalCaptures = stats?.length || 0;
    const totalMessages = stats?.reduce((sum, capture) => sum + (capture.total_messages || 0), 0) || 0;
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
