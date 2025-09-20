import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { songId } = await request.json()

    if (!songId) {
      return NextResponse.json({
        success: false,
        message: 'Song ID is required'
      }, { status: 400 })
    }

    // Update the song to make it public
    const { data, error } = await supabase
      .from('songs')
      .update({
        is_public: true,
        status: 'approved'
      })
      .eq('id', songId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Error updating song',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Song made public successfully',
      song: data
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
} 