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

    // Verify the song belongs to the artist
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .eq('artist_id', artistId)
      .single()

    if (songError || !song) {
      return NextResponse.json(
        { success: false, message: 'Song not found or access denied' },
        { status: 404 }
      )
    }

    // Check if song is already submitted for approval
    if (song.submitted_for_approval) {
      return NextResponse.json(
        { success: false, message: 'Song is already submitted for approval' },
        { status: 400 }
      )
    }

    // Allow re-submission if song was previously approved but is now private
    // (removed from public view)
    if (song.status === 'approved' && song.is_public === true) {
      return NextResponse.json(
        { success: false, message: 'Song is already approved and public' },
        { status: 400 }
      )
    }

    // Submit song for approval
    const { error: updateError } = await supabase
      .from('songs')
      .update({
        submitted_for_approval: true,
        status: 'pending'
      })
      .eq('id', songId)

    if (updateError) {
      console.error('Update error:', updateError)
      return NextResponse.json(
        { success: false, message: 'Error submitting song for approval' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Song submitted for approval successfully'
    })

  } catch (error) {
    console.error('Submit error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 