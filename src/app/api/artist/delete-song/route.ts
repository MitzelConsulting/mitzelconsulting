import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function DELETE(request: NextRequest) {
  try {
    const { songId, artistId } = await request.json()

    if (!songId || !artistId) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the song belongs to the artist and is private
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .eq('artist_id', artistId)
      .eq('is_public', false)
      .single()

    if (songError || !song) {
      return NextResponse.json(
        { success: false, message: 'Song not found or cannot be deleted' },
        { status: 404 }
      )
    }

    // Check if song is submitted for approval (don't allow deletion)
    if (song.submitted_for_approval) {
      return NextResponse.json(
        { success: false, message: 'Cannot delete song that is submitted for approval' },
        { status: 400 }
      )
    }

    // Delete the song from database
    const { error: deleteError } = await supabase
      .from('songs')
      .delete()
      .eq('id', songId)
      .eq('artist_id', artistId)

    if (deleteError) {
      console.error('Delete error:', deleteError)
      return NextResponse.json(
        { success: false, message: 'Error deleting song from database' },
        { status: 500 }
      )
    }

    // Try to delete the file from storage (optional - don't fail if this doesn't work)
    if (song.file_url) {
      try {
        // Extract filename from URL
        const urlParts = song.file_url.split('/')
        const fileName = urlParts[urlParts.length - 1]
        const fullPath = `${artistId}/${fileName}`

        await supabase.storage
          .from('song-files')
          .remove([fullPath])
      } catch (storageError) {
        console.log('Storage deletion failed (non-critical):', storageError)
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Song deleted successfully'
    })

  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 