import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { artistId, artistName } = await request.json()
    
    let targetArtistId = artistId

    // If artistId is not provided, look up by artist name
    if (!targetArtistId && artistName) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id')
        .ilike('name', `%${artistName}%`)
        .single()

      if (artistError || !artist) {
        return NextResponse.json({
          success: false,
          error: 'Artist not found',
          artistName
        }, { status: 404 })
      }
      targetArtistId = artist.id
    }

    if (!targetArtistId) {
      return NextResponse.json({
        success: false,
        error: 'artistId or artistName is required'
      }, { status: 400 })
    }

    // Update all songs for the artist to be public and approved
    const { data, error } = await supabase
      .from('songs')
      .update({
        is_public: true,
        status: 'approved',
        submitted_for_approval: true
      })
      .eq('artist_id', targetArtistId)
      .select()

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Error updating songs',
        details: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Successfully approved ${data.length} songs for artist`,
      artistId: targetArtistId,
      updatedSongs: data.map(song => ({
        id: song.id,
        title: song.title,
        is_public: song.is_public,
        status: song.status
      }))
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Unexpected error',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
} 