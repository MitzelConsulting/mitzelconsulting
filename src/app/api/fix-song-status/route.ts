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

    // Update the song status from private to pending
    const { data, error } = await supabase
      .from('songs')
      .update({
        status: 'pending'
      })
      .eq('id', songId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({
        success: false,
        message: 'Error updating song status',
        error: error.message
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'Song status updated to pending successfully',
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