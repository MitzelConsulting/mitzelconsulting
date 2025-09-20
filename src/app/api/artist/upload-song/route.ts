import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      songTitle,
      genre,
      votePrice,
      voteGoal,
      songFileUrl,
      songFileSize,
      songFileType
    } = body;

    if (!songTitle || !songFileUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate vote goal and price
    if (voteGoal < 1 || voteGoal > 10000) {
      return NextResponse.json(
        { success: false, message: 'Vote goal must be between 1 and 10,000' },
        { status: 400 }
      )
    }
    if (votePrice < 0.10 || votePrice > 100) {
      return NextResponse.json(
        { success: false, message: 'Vote price must be between $0.10 and $100' },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    // Get artist ID
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .select('id')
      .eq('email', user.email)
      .single()

    if (artistError || !artistData) {
      return NextResponse.json(
        { success: false, message: 'Artist profile not found' },
        { status: 404 }
      )
    }

    const artistId = artistData.id

    // Create song record in database with enhanced metadata
    const songDataToInsert = {
      title: songTitle,
      artist_id: artistId,
      genre: genre || 'Unknown',
      vote_goal: voteGoal,
      vote_price: votePrice,
      current_votes: 0,
      original_vote_count: 0,
      file_url: songFileUrl,
      audio_url: songFileUrl, // Also set audio_url for compatibility
      file_size: songFileSize,
      file_hash: null, // Not calculated here
      created_at: new Date().toISOString(),
      status: 'pending'
    }

    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert(songDataToInsert)
      .select()
      .single()

    if (songError) {
      console.error('Database error details:', songError)
      return NextResponse.json(
        { success: false, message: `Error saving song to database: ${songError.message}` },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Song uploaded successfully with direct storage',
      song: songData
    })

  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
} 