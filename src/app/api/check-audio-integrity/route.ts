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

    // Get song details
    const { data: song, error: songError } = await supabase
      .from('songs')
      .select('*')
      .eq('id', songId)
      .single()

    if (songError || !song) {
      return NextResponse.json({
        success: false,
        message: 'Song not found'
      }, { status: 404 })
    }

    // Check if song has audio URL
    const audioUrl = song.audio_url || song.file_url
    if (!audioUrl) {
      return NextResponse.json({
        success: false,
        message: 'No audio URL found for this song',
        song: {
          id: song.id,
          title: song.title,
          audio_url: song.audio_url,
          file_url: song.file_url
        }
      }, { status: 400 })
    }

    // Try to download and verify the audio file
    try {
      // Extract filename from URL
      const urlParts = audioUrl.split('/')
      const fileName = urlParts[urlParts.length - 1]
      
      // Remove query parameters if present
      const cleanFileName = fileName.split('?')[0]
      
      // Determine bucket based on URL pattern
      let bucket = 'songs'
      if (audioUrl.includes('song-files')) {
        bucket = 'song-files'
      }

      console.log('Attempting to download file for integrity check:', {
        fileName: cleanFileName,
        bucket: bucket,
        url: audioUrl
      })

      // Download the file
      const { data: fileData, error: downloadError } = await supabase.storage
        .from(bucket)
        .download(cleanFileName)

      if (downloadError) {
        console.error('Download error:', downloadError)
        return NextResponse.json({
          success: false,
          message: 'Failed to download audio file for verification',
          error: downloadError.message,
          song: {
            id: song.id,
            title: song.title,
            audio_url: audioUrl
          }
        }, { status: 500 })
      }

      // Check file size
      const fileSize = fileData.size
      const expectedSize = song.file_size

      // Calculate hash
      const fileBuffer = await fileData.arrayBuffer()
      const fileHash = await calculateFileHash(fileBuffer)

      // Check if file is corrupted (too small or hash mismatch)
      const isCorrupted = fileSize < 1024 || (song.file_hash && song.file_hash !== fileHash)

      const recommendations: string[] = []

      // Add recommendations based on findings
      if (isCorrupted) {
        recommendations.push('File appears to be corrupted - recommend re-upload')
      }
      if (fileSize < 1024) {
        recommendations.push('File is too small to be a valid audio file')
      }
      if (song.file_hash && song.file_hash !== fileHash) {
        recommendations.push('File hash mismatch indicates corruption during upload or storage')
      }
      if (expectedSize && Math.abs(fileSize - expectedSize) > 1024) {
        recommendations.push('File size differs significantly from expected size')
      }

      const result = {
        success: true,
        song: {
          id: song.id,
          title: song.title,
          audio_url: audioUrl,
          file_size: fileSize,
          expected_size: expectedSize,
          file_hash: fileHash,
          stored_hash: song.file_hash
        },
        integrity: {
          is_corrupted: isCorrupted,
          file_size_valid: fileSize >= 1024,
          hash_matches: !song.file_hash || song.file_hash === fileHash,
          file_size_matches: !expectedSize || Math.abs(fileSize - expectedSize) < 1024 // Allow 1KB difference
        },
        recommendations
      }

      return NextResponse.json(result)

    } catch (error) {
      console.error('File verification error:', error)
      return NextResponse.json({
        success: false,
        message: 'Error verifying audio file',
        error: error instanceof Error ? error.message : 'Unknown error',
        song: {
          id: song.id,
          title: song.title,
          audio_url: audioUrl
        }
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Audio integrity check error:', error)
    return NextResponse.json({
      success: false,
      message: 'Internal server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// Helper function to calculate file hash
async function calculateFileHash(buffer: ArrayBuffer): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
} 