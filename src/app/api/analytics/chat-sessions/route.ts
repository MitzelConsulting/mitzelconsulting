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

    // First try to use the database function
    const { data: sessions, error: rpcError } = await supabase
      .rpc('get_all_chat_sessions');

    if (rpcError) {
      console.log('RPC function not available, falling back to direct query:', rpcError);
      
      // Fallback: Query chat_sessions table directly
      const { data: sessions, error: queryError } = await supabase
        .from('chat_sessions')
        .select(`
          id,
          created_at,
          user_name,
          user_email,
          message_count,
          source_page,
          chat_mode,
          session_duration,
          is_completed
        `)
        .order('created_at', { ascending: false });

      if (queryError) {
        console.error('Error fetching chat sessions:', queryError);
        return NextResponse.json({ 
          success: false,
          error: 'Failed to fetch chat sessions',
          details: queryError.message 
        }, { status: 500 });
      }

      // Transform data to match expected format
      const transformedSessions = (sessions || []).map(session => ({
        ...session,
        user_name: session.user_name || 'Unknown',
        user_email: session.user_email || 'No email provided'
      }));

      return NextResponse.json({
        success: true,
        sessions: transformedSessions
      });
    }

    return NextResponse.json({
      success: true,
      sessions: sessions || []
    });

  } catch (error) {
    console.error('Chat sessions analytics error:', error);
    return NextResponse.json({ 
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
