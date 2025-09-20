import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, sessionId, totalTimeSeconds } = body

    if (!artistId || !sessionId) {
      return NextResponse.json(
        { success: false, message: 'Artist ID and session ID are required' },
        { status: 400 }
      )
    }

    // Update visitor session with end time and total time
    const { error } = await supabase
      .from('visitor_sessions')
      .update({
        end_time: new Date().toISOString(),
        total_time_seconds: totalTimeSeconds || 0,
        is_active: false
      })
      .eq('artist_id', artistId)
      .eq('session_id', sessionId)
      .is('end_time', null)

    if (error) {
      console.error('Error updating session:', error)
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Session tracking error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 