import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ 
        authenticated: false, 
        error: userError?.message || 'No user found',
        user: null,
        adminUser: null
      })
    }

    // Check if user is in admin_users table
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    // Check if user is in artists table
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('*')
      .eq('email', user.email)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      },
      adminUser: adminUser || null,
      adminError: adminError?.message || null,
      artist: artist || null,
      artistError: artistError?.message || null,
      isAdmin: !adminError && adminUser !== null,
      isArtist: !artistError && artist !== null
    })

  } catch (error) {
    console.error('Debug auth error:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 