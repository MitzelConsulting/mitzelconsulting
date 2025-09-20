import { NextResponse } from 'next/server'
import Stripe from 'stripe'

export async function GET() {
  try {
    // Check if Stripe key exists
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({
        success: false,
        error: 'STRIPE_SECRET_KEY not configured',
        message: 'Add STRIPE_SECRET_KEY to your .env.local file'
      })
    }

    // Test Stripe connection
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-05-28.basil',
    })

    // Test basic API call
    const account = await stripe.accounts.list({ limit: 1 })

    return NextResponse.json({
      success: true,
      message: 'Stripe connection working!',
      accountCount: account.data.length,
      hasConnect: true
    })

  } catch (error) {
    console.error('Stripe test error:', error)
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      message: 'Stripe connection failed - check your API key and account settings'
    })
  }
} 