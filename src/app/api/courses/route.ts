import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET() {
  try {
    console.log('Fetching courses from database...');
    
    const { data: courses, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching courses:', error);
      return NextResponse.json({ error: 'Failed to fetch courses' }, { status: 500 });
    }

    console.log('Successfully fetched', courses?.length || 0, 'courses');
    
    return NextResponse.json({ 
      courses: courses || [],
      count: courses?.length || 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
