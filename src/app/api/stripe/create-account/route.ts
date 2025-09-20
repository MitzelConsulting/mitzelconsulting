// app/api/stripe/create-account/route.ts

import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

// Create Stripe client only if we have the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'placeholder_key'
const stripe = stripeSecretKey !== 'placeholder_key' 
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' })
  : null

export async function POST(request: NextRequest) {
  try {
    // If we don't have a valid Stripe client, return an error
    if (!stripe) {
      return NextResponse.json(
        { success: false, message: 'Payment service not available' },
        { status: 503 }
      )
    }

    const { artistId, email } = await request.json()

    if (!artistId || !email) {
      return NextResponse.json(
        { success: false, message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if Stripe key is configured
    if (!process.env.STRIPE_SECRET_KEY) {
      console.error('STRIPE_SECRET_KEY not configured')
      return NextResponse.json(
        { success: false, message: 'Stripe not configured' },
        { status: 500 }
      )
    }

    // Check if artist already has a Stripe account
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('stripe_account_id')
      .eq('id', artistId)
      .single()

    if (artistError) {
      console.error('Artist lookup error:', artistError)
      return NextResponse.json(
        { success: false, message: 'Artist not found' },
        { status: 404 }
      )
    }

    if (artist.stripe_account_id) {
      return NextResponse.json(
        { success: false, message: 'Artist already has a Stripe account' },
        { status: 400 }
      )
    }

    // Create Stripe Connect account
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'US',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
    })

    console.log('Stripe account created:', account.id)

    // Update artist with Stripe account ID
    const { error: updateError } = await supabase
      .from('artists')
      .update({ stripe_account_id: account.id })
      .eq('id', artistId)

    if (updateError) {
      console.error('Error updating artist with Stripe account:', updateError)
      return NextResponse.json(
        { success: false, message: 'Failed to save Stripe account' },
        { status: 500 }
      )
    }

    // Create account link for onboarding
    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/artist-dashboard?tab=payouts`,
      return_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/artist-dashboard?tab=payouts`,
      type: 'account_onboarding',
    })

    console.log('Account link created:', accountLink.url)

    return NextResponse.json({
      success: true,
      message: 'Stripe account created successfully',
      accountId: account.id,
      accountLink: accountLink.url
    })

  } catch (error) {
    console.error('Error creating Stripe account:', error)
    
    // Provide more specific error messages
    if (error instanceof Error) {
      if (error.message.includes('api_key')) {
        return NextResponse.json(
          { success: false, message: 'Invalid Stripe API key' },
          { status: 500 }
        )
      }
      if (error.message.includes('permission')) {
        return NextResponse.json(
          { success: false, message: 'Stripe account creation not allowed' },
          { status: 500 }
        )
      }
    }
    
    return NextResponse.json(
      { success: false, message: 'Failed to create Stripe account: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    )
  }
}