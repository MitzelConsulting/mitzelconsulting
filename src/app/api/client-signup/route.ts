import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      fullName,
      title,
      company,
      teamSize,
      industry,
      email,
      phone,
      password,
      confirmPassword,
      safetyInterests,
      agreeToTerms
    } = body;

    // Validation
    if (!fullName || !email || !password || !company || !teamSize || !phone) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password !== confirmPassword) {
      return NextResponse.json(
        { success: false, message: 'Passwords do not match' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: 'Password must be at least 6 characters' },
        { status: 400 }
      )
    }

    if (!agreeToTerms) {
      return NextResponse.json(
        { success: false, message: 'You must agree to the terms and conditions' },
        { status: 400 }
      )
    }

    // Check if email already exists in clients table
    const { data: existingClient, error: checkError } = await supabase
      .from('clients')
      .select('id')
      .eq('email', email)
      .single()

    if (existingClient) {
      return NextResponse.json(
        { success: false, message: 'A client account with this email already exists' },
        { status: 400 }
      )
    }

    // Check if email already exists in auth users
    const { data: authUser, error: authCheckError } = await supabase.auth.admin.getUserByEmail(email)
    
    if (authUser && authUser.user) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists' },
        { status: 400 }
      )
    }

    // Create Supabase Auth user with email confirmation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${request.nextUrl.origin}/login?verified=true`,
        data: {
          full_name: fullName,
          signup_type: 'client'
        }
      }
    })

    if (authError) {
      console.error('Auth error:', authError)
      return NextResponse.json(
        { success: false, message: 'Failed to create account: ' + authError.message },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { success: false, message: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create client record
    const { data: clientData, error: clientError } = await supabase
      .from('clients')
      .insert({
        id: authData.user.id,
        full_name: fullName,
        title: title || null,
        company: company,
        team_size: teamSize,
        industry: industry || null,
        email: email,
        phone: phone,
        safety_interests: safetyInterests || [],
        status: 'pending', // Will be approved by admin
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    if (clientError) {
      console.error('Client creation error:', clientError)
      return NextResponse.json(
        { success: false, message: 'Failed to create client profile: ' + clientError.message },
        { status: 500 }
      )
    }

    console.log('Client signup completed successfully:', {
      clientId: authData.user.id,
      email: email
    })

    return NextResponse.json({
      success: true,
      message: 'Client account created successfully! Please check your email to confirm your account. You can then login to access your dashboard.',
      client: clientData
    })

  } catch (error) {
    console.error('Client signup error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}
