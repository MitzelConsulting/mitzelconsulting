import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const { commentIds, purchaseSessionId } = await request.json()

    // Validate required fields
    if (!commentIds || !Array.isArray(commentIds) || commentIds.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Missing or invalid comment IDs' },
        { status: 400 }
      )
    }

    if (!purchaseSessionId) {
      return NextResponse.json(
        { success: false, message: 'Missing purchase session ID' },
        { status: 400 }
      )
    }

    // Update voice comments status to 'purchased'
    const { data, error } = await supabase
      .from('voice_comments')
      .update({
        status: 'purchased',
        purchase_session_id: purchaseSessionId
      })
      .in('id', commentIds)
      .select()

    if (error) {
      console.error('Error updating voice comments:', error)
      return NextResponse.json(
        { success: false, message: 'Failed to update voice comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Voice comments updated successfully',
      updatedCount: data?.length || 0
    })

  } catch (error) {
    console.error('Error in update-voice-comments:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 