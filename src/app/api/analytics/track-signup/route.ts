import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { artistId, artistName, email, songName, signupStatus, emailSent, timestamp } = body

    // Validate required fields
    if (!artistId || !artistName || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Insert signup analytics record
    const { data, error } = await supabase
      .from('signup_analytics')
      .insert({
        artist_id: artistId,
        artist_name: artistName,
        email: email,
        song_name: songName || null,
        signup_status: signupStatus || 'success',
        email_sent: emailSent || false,
        created_at: timestamp || new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error inserting signup analytics:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to log signup analytics' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Signup analytics logged successfully',
      data
    })

  } catch (error) {
    console.error('Signup analytics error:', error)
    return NextResponse.json(
      { success: false, message: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 