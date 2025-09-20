import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, songId, sessionId, action, duration, audioUrl } = body

    if (!artistId || !songId || !action) {
      return NextResponse.json(
        { success: false, message: 'Artist ID, Song ID, and action are required' },
        { status: 400 }
      )
    }

    // Get client IP
    const forwarded = request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown'

    if (action === 'start') {
      // Start audio session
      const { error } = await supabase
        .from('audio_listening_sessions')
        .insert({
          artist_id: artistId,
          song_id: songId,
          session_id: sessionId,
          visitor_ip: ip,
          start_time: new Date().toISOString(),
          audio_url: audioUrl
        })

      if (error) {
        console.error('Error starting audio session:', error)
      }
    } else if (action === 'end') {
      // End audio session and update duration
      const { data: session, error: fetchError } = await supabase
        .from('audio_listening_sessions')
        .select('id, start_time')
        .eq('artist_id', artistId)
        .eq('song_id', songId)
        .eq('session_id', sessionId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      if (session && !fetchError) {
        const endTime = new Date()
        const startTime = new Date(session.start_time)
        const durationSeconds = Math.round((endTime.getTime() - startTime.getTime()) / 1000)

        const { error: updateError } = await supabase
          .from('audio_listening_sessions')
          .update({
            end_time: endTime.toISOString(),
            duration_seconds: durationSeconds
          })
          .eq('id', session.id)

        if (updateError) {
          console.error('Error updating audio session:', updateError)
        }
      }
    } else if (action === 'update') {
      // Update session duration (for periodic updates)
      const { data: session, error: fetchError } = await supabase
        .from('audio_listening_sessions')
        .select('id')
        .eq('artist_id', artistId)
        .eq('song_id', songId)
        .eq('session_id', sessionId)
        .is('end_time', null)
        .order('start_time', { ascending: false })
        .limit(1)
        .single()

      if (session && !fetchError && duration) {
        const { error: updateError } = await supabase
          .from('audio_listening_sessions')
          .update({
            duration_seconds: duration
          })
          .eq('id', session.id)

        if (updateError) {
          console.error('Error updating audio session duration:', updateError)
        }
      }
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Audio tracking error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 