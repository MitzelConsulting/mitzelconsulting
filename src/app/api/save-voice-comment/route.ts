import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { songId, artistId, songTitle, artistName, audioData, audioFilename } = await request.json()

    // Validate required fields
    if (!songId || !artistId || !songTitle || !artistName || !audioData || !audioFilename) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('voice_comments')
      .insert({
        song_id: songId,
        artist_id: artistId,
        song_title: songTitle,
        artist_name: artistName,
        audio_data: audioData,
        audio_filename: audioFilename,
        status: 'draft'
      })
      .select()
      .single()

    if (error) {
      console.error('Error saving voice comment:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to save voice comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Voice comment saved successfully',
      commentId: data.id
    })

  } catch (error) {
    console.error('Error in save-voice-comment:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 