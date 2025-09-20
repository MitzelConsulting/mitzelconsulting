import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { songId, audioUrl } = await request.json()

    if (!songId || !audioUrl) {
      return NextResponse.json({
        success: false,
        message: 'Song ID and audio URL are required'
      }, { status: 400 })
    }

    // Update the song with the audio URL
    const { data, error } = await supabase
      .from('songs')
      .update({
        audio_url: audioUrl,
        file_url: audioUrl, // Also update file_url for consistency
        is_public: true, // Make it public so it shows on the artist page
        status: 'approved'
      })
      .eq('id', songId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Error updating song',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Song audio URL updated successfully',
      song: data
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 