import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, sessionId, pageLoadTime } = body

    if (!artistId) {
      return NextResponse.json(
        { success: false, message: 'Artist ID is required' },
        { status: 400 }
      )
    }

    // Get client IP and user agent
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'
    const userAgent = request.headers.get('user-agent') || 'unknown'
    const referrer = request.headers.get('referer') || ''

    // Record page view
    const { error: pageViewError } = await supabase
      .from('artist_page_views')
      .insert({
        artist_id: artistId,
        visitor_ip: ip,
        user_agent: userAgent,
        referrer: referrer,
        session_id: sessionId,
        page_load_time_ms: pageLoadTime || 0
      })

    if (pageViewError) {
      console.error('Error recording page view:', pageViewError)
    }

    // Create or update visitor session
    if (sessionId) {
      const { data: existingSession } = await supabase
        .from('visitor_sessions')
        .select('id')
        .eq('session_id', sessionId)
        .eq('artist_id', artistId)
        .single()

      if (!existingSession) {
        // Create new session
        const { error: sessionError } = await supabase
          .from('visitor_sessions')
          .insert({
            artist_id: artistId,
            session_id: sessionId,
            visitor_ip: ip,
            start_time: new Date().toISOString()
          })

        if (sessionError) {
          console.error('Error creating session:', sessionError)
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Analytics tracking error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 