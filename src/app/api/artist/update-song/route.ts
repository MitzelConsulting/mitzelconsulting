import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    const { songId, title, genre, votePrice, voteGoal } = await request.json()

    // Validate required fields
    if (!songId || !title || votePrice === undefined || voteGoal === undefined) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate vote price and goal
    if (votePrice < 0.01) {
      return NextResponse.json(
        { success: false, message: 'Contribution amount must be at least $0.01' },
        { status: 400 }
      )
    }

    if (voteGoal < 1) {
      return NextResponse.json(
        { success: false, message: 'Contribution goal must be at least 1' },
        { status: 400 }
      )
    }

    // Get the access token from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      )
    }

    const accessToken = authHeader.replace('Bearer ', '')

    // Create a Supabase client with service role key
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verify the access token and get user info
    const { data: { user }, error: userError } = await supabase.auth.getUser(accessToken)
    if (userError || !user) {
      console.error('User authentication error:', userError)
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
      console.error('Artist lookup error:', artistError)
      return NextResponse.json(
        { success: false, message: 'Artist profile not found' },
        { status: 404 }
      )
    }

    const artistId = artistData.id

    // Verify the song belongs to this artist
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .select('artist_id')
      .eq('id', songId)
      .single()

    if (songError || !songData) {
      console.error('Song lookup error:', songError)
      return NextResponse.json(
        { success: false, message: 'Song not found' },
        { status: 404 }
      )
    }

    if (songData.artist_id !== artistId) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized to edit this song' },
        { status: 403 }
      )
    }

    // Update the song in the database
    const { data, error } = await supabase
      .from('songs')
      .update({
        title: title.trim(),
        genre: genre?.trim() || null,
        vote_price: votePrice,
        vote_goal: voteGoal,
        updated_at: new Date().toISOString()
      })
      .eq('id', songId)
      .select()

    if (error) {
      console.error('Error updating song:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update song' },
        { status: 500 }
      )
    }

    if (!data || data.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Song not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Song updated successfully',
      song: data[0]
    })

  } catch (error) {
    console.error('Error in update-song API:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 