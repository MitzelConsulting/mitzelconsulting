import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const searchTerm = searchParams.get('search')

    let query = supabase
      .from('artists')
      .select('id, name, email, status, created_at')

    if (searchTerm) {
      query = query.ilike('name', `%${searchTerm}%`)
    }

    const { data: artists, error } = await query
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: 'Error fetching artists', details: error })
    }

    return NextResponse.json({
      success: true,
      count: artists.length,
      artists: artists
    })

  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error', details: String(e) })
  }
}