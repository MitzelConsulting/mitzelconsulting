import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      artistName,
      email,
      password,
      confirmPassword,
      songName,
      bio,
      website,
      bioImageUrl,
      songFileUrl,
      songFileSize,
      songFileType
    } = body;

    // Validation
    if (!artistName || !email || !password || !songName || !bio || !bioImageUrl || !songFileUrl) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    // Check if email already exists
    const { data: existingArtist, error: checkError } = await supabase
      .from('artists')
      .select('id')
      .eq('email', email)
      .single()

    if (existingArtist) {
      return NextResponse.json(
        { success: false, message: 'An artist with this email already exists' },
        { status: 400 }
      )
    }

    // Create Supabase Auth user with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/login?verified=true`,
        data: {
          artist_name: artistName,
          signup_type: 'artist'
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, message: 'Failed to create account: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create artist record
    const { data: artistData, error: artistError } = await supabase
      .from('artists')
      .insert({
        id: authData.user.id,
        name: artistName,
        email: email,
        bio: bio,
        image_url: bioImageUrl,
        website_link: website || null,
        status: 'pending', // Will be approved by admin
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (artistError) {
      console.error('Artist creation error:', artistError)
      return NextResponse.json(
        { success: false, message: 'Failed to create artist profile' },
        { status: 500 }
      )
    }

    // Create song record as private song with enhanced metadata
    const { data: songData, error: songError } = await supabase
      .from('songs')
      .insert({
        title: songName,
        artist_id: authData.user.id,
        audio_url: songFileUrl,
        file_url: songFileUrl, // Also set file_url for consistency
        file_size: songFileSize,
        file_hash: null, // Not calculated here
        vote_count: 0,
        vote_goal: 100,
        status: 'private', // Private song, not public yet
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (songError) {
      console.error('Song creation error:', songError)
      return NextResponse.json(
        { success: false, message: 'Failed to create song record' },
        { status: 500 }
      )
    }

    console.log('Artist signup completed successfully:', {
      artistId: authData.user.id,
      songId: songData.id
    })

    return NextResponse.json({
      success: true,
      message: 'Artist account created successfully! Please check your email to confirm your account. You can then login to access your dashboard.',
      artist: artistData,
      song: songData
    })

  } catch (error) {
    console.error('Artist signup error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}

// Helper function to calculate file hash
async function calculateFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
} 