import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const { query, email } = await request.json()

    if (!query) {
      return NextResponse.json({ error: 'Search query is required' }, { status: 400 })
    }

    // Store the search query for analytics
    const { error: analyticsError } = await supabase
      .from('course_search_analytics')
      .insert({
        search_query: query,
        user_email: email || null,
        search_timestamp: new Date().toISOString(),
        ip_address: request.headers.get('x-forwarded-for') || 'unknown'
      })

    if (analyticsError) {
      console.error('Analytics error:', analyticsError)
      // Don't fail the request if analytics fails
    }

    // Search courses based on query
    const { data: courses, error: coursesError } = await supabase
      .from('courses')
      .select('*')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,category.ilike.%${query}%,tags.cs.{${query}}`)
      .limit(5)

    if (coursesError) {
      console.error('Courses search error:', coursesError)
      return NextResponse.json({ error: 'Failed to search courses' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      courses: courses || [],
      query,
      message: `Found ${courses?.length || 0} courses matching "${query}"`
    })

  } catch (error) {
    console.error('Course search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get search analytics for admin dashboard
    const { data: analytics, error } = await supabase
      .from('course_search_analytics')
      .select('*')
      .order('search_timestamp', { ascending: false })
      .limit(100)

    if (error) {
      console.error('Analytics fetch error:', error)
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      analytics: analytics || []
    })

  } catch (error) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
