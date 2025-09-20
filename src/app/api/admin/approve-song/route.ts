import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with service role key for admin operations
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder_key'

// Only create the client if we have real credentials
const supabaseAdmin = supabaseUrl !== 'https://placeholder.supabase.co' && supabaseServiceKey !== 'placeholder_key'
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null

export async function POST(request: NextRequest) {
  try {
    // If we don't have a valid Supabase client, return an error
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, message: 'Database connection not available' },
        { status: 503 }
      )
    }

    const { songId } = await request.json()

    if (!songId) {
      return NextResponse.json(
        { success: false, message: 'Missing songId' },
        { status: 400 }
      )
    }

    // Fetch song details for logging
    const { data: songData, error: songError } = await supabaseAdmin
      .from('songs')
      .select('title, artists(name)')
      .eq('id', songId)
      .single()

    if (songError || !songData) {
      console.error('Error fetching song data:', songError)
      return NextResponse.json(
        { success: false, message: 'Error fetching song data' },
        { status: 500 }
      )
    }

    // Directly update the song status (no logging, no triggers, no RPC)
    const { error: updateError } = await supabaseAdmin
      .from('songs')
      .update({ 
        status: 'approved',
        is_public: true,
        submitted_for_approval: false
      })
      .eq('id', songId)

    if (updateError) {
      console.error('Admin approve song error:', updateError)
      return NextResponse.json(
        { success: false, message: updateError.message },
        { status: 500 }
      )
    }

    // Log to approval_history
    let artistName = 'Unknown Artist';
    if (songData.artists) {
      const artistsField = songData.artists as any;
      if (Array.isArray(artistsField)) {
        artistName = artistsField[0]?.name || 'Unknown Artist';
      } else if (typeof artistsField === 'object' && artistsField !== null) {
        artistName = artistsField.name || 'Unknown Artist';
      }
    }
    await supabaseAdmin
      .from('approval_history')
      .insert({
        item_type: 'song',
        item_id: songId,
        action: 'approved',
        item_title: songData.title,
        item_artist_name: artistName,
        notes: 'Song approved by admin'
      })

    return NextResponse.json({ success: true, message: 'Song approved successfully' })
  } catch (error) {
    console.error('Error in admin approve song:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 