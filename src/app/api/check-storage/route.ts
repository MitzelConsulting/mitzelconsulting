import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const artistId = searchParams.get('artistId') || '51da1dd7-a6b9-4304-a6e9-ee2ebad3f787'

    // List files in the song-files bucket
    const { data: files, error: filesError } = await supabase.storage
      .from('song-files')
      .list(artistId, {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (filesError) {
      return NextResponse.json({
        success: false,
        error: 'Error listing files',
        details: filesError
      })
    }

    // Get public URLs for any files found
    const filesWithUrls = files?.map(file => {
      const { data: urlData } = supabase.storage
        .from('song-files')
        .getPublicUrl(`${artistId}/${file.name}`)
      
      return {
        name: file.name,
        size: file.metadata?.size,
        url: urlData.publicUrl,
        path: `${artistId}/${file.name}`
      }
    }) || []

    return NextResponse.json({
      success: true,
      artistId: artistId,
      filesFound: filesWithUrls.length,
      files: filesWithUrls
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    })
  }
} 