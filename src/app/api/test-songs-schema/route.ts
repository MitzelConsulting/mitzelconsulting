import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    // Get all artists with "Douggert" in the name
    const { data: artists, error: artistsError } = await supabase
      .from('artists')
      .select('id, name, email, status, created_at')
      .ilike('name', '%Douggert%')
      .order('created_at', { ascending: false })

    if (artistsError) {
      return NextResponse.json({ error: 'Error fetching artists', details: artistsError })
    }

    // Get all songs with "Killswitch" in the title
    const { data: songs, error: songsError } = await supabase
      .from('songs')
      .select('id, title, artist_id, audio_url, file_url, file_size, status, created_at')
      .ilike('title', '%Killswitch%')
      .order('created_at', { ascending: false })

    if (songsError) {
      return NextResponse.json({ error: 'Error fetching songs', details: songsError })
    }

    // Get all songs for Douggert artists
    const douggertSongIds = songs.map(s => s.artist_id)
    const { data: allDouggertSongs, error: allSongsError } = await supabase
      .from('songs')
      .select('id, title, artist_id, audio_url, file_url, file_size, status, created_at')
      .in('artist_id', douggertSongIds)
      .order('created_at', { ascending: false })

    return NextResponse.json({
      success: true,
      artists: artists || [],
      killswitchSongs: songs || [],
      allDouggertSongs: allDouggertSongs || []
    })

  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error', details: String(e) })
  }
} 