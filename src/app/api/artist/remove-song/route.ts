import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { songId, artistId } = await request.json()

    if (!songId || !artistId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the song belongs to the artist and is approved
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .eq('artist_id', artistId)
      .eq('status', 'approved')
      .single()

    if (songError || !song) {
      return NextResponse.json(
        { success: false, message: 'Song not found or not approved' },
        { status: 404 }
      )
    }

    // Remove song from public view (preserves vote count via database trigger)
    const { error: updateError } = await supabase
      .from('songs')
      .update({
        is_public: false,
        submitted_for_approval: false
      })
      .eq('id', songId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Error removing song from public view' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Song removed from public view successfully. Vote count has been preserved.',
      preservedVotes: song.current_votes
    })

  } catch (error) {
    console.error('Remove error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 