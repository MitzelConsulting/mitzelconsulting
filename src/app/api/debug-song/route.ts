import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistName = searchParams.get('artist')
    const songTitle = searchParams.get('song')
    let artistId = searchParams.get('artistId')

    // If artistId is not provided, look up by artist name
    if (!artistId && artistName) {
      const { data: artist, error: artistError } = await supabase
        .from('artists')
        .select('id, name, email')
        .ilike('name', `%${artistName}%`)
        .order('created_at', { ascending: false }) // Get most recent if multiple
        .limit(1)
        .single()
      if (artistError || !artist) {
        return NextResponse.json({ error: 'Artist not found', artistName })
      }
      artistId = artist.id
    }

    if (!artistId) {
      return NextResponse.json({ error: 'artistId or artist name required' })
    }

    // Build query
    let query = supabase
      .from('songs')
      .select('*')
      .eq('artist_id', artistId)

    // If song title is provided, filter by it
    if (songTitle) {
      query = query.ilike('title', `%${songTitle}%`)
    }

    // Fetch songs
    const { data: songs, error: songsError } = await query
      .order('created_at', { ascending: false })

    if (songsError) {
      return NextResponse.json({ error: 'Error fetching songs', details: songsError })
    }

    // Get artist info
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, name, email, status')
      .eq('id', artistId)
      .single()

    return NextResponse.json({
      artist: artist,
      artistId,
      songCount: songs.length,
      songs: songs.map(s => ({
        id: s.id,
        title: s.title,
        is_public: s.is_public,
        status: s.status,
        submitted_for_approval: s.submitted_for_approval,
        created_at: s.created_at,
        file_url: s.file_url,
        audio_url: s.audio_url,
        file_size: s.file_size,
        vote_count: s.vote_count,
        vote_goal: s.vote_goal
      }))
    })
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error', details: String(e) })
  }
} 