import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabaseClient';

export async function GET(request: NextRequest) {
  try {
    // Fetch registered users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('clients')
      .select('*', { count: 'exact', head: true });

    if (usersError) {
      console.error('Error fetching users count:', usersError);
    }

    // Fetch digital clients count (users who have purchased digital courses)
    // This would need to be based on your course enrollment/purchase system
    // For now, we'll use a placeholder query that you can update based on your actual schema
    const { count: digitalClients, error: digitalClientsError } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('course_type', 'digital'); // Assuming you have a course_type field

    if (digitalClientsError) {
      console.error('Error fetching digital clients count:', digitalClientsError);
    }

    // Fetch total revenue (placeholder - you'll need to implement based on your payment system)
    const { data: revenueData, error: revenueError } = await supabase
      .from('course_enrollments')
      .select('price')
      .not('price', 'is', null);

    let totalRevenue = 0;
    if (!revenueError && revenueData) {
      totalRevenue = revenueData.reduce((sum, enrollment) => sum + (enrollment.price || 0), 0);
    }

    // Fetch pending approvals (placeholder - you'll need to implement based on your approval system)
    const { count: pendingApprovals, error: approvalsError } = await supabase
      .from('course_enrollments')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'); // Assuming you have a status field

    if (approvalsError) {
      console.error('Error fetching pending approvals count:', approvalsError);
    }

    // Fetch total inquiries (from contact forms, chat sessions, etc.)
    const { count: totalInquiries, error: inquiriesError } = await supabase
      .from('email_captures')
      .select('*', { count: 'exact', head: true });

    if (inquiriesError) {
      console.error('Error fetching inquiries count:', inquiriesError);
    }

    return NextResponse.json({
      success: true,
      analytics: {
        totalUsers: totalUsers || 0,
        digitalClients: digitalClients || 0,
        totalRevenue: totalRevenue,
        pendingApprovals: pendingApprovals || 0,
        totalInquiries: totalInquiries || 0
      }
    });

  } catch (error) {
    console.error('Dashboard analytics error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      analytics: {
        totalUsers: 0,
        digitalClients: 0,
        totalRevenue: 0,
        pendingApprovals: 0,
        totalInquiries: 0
      }
    }, { status: 500 });
  }
}
