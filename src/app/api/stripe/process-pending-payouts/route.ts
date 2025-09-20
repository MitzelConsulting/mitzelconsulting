import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

// Create Stripe client only if we have the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'placeholder_key'
const stripe = stripeSecretKey !== 'placeholder_key' 
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' })
  : null

// Platform fee percentage (should match webhook)
const PLATFORM_FEE_PERCENTAGE = 0.10

export async function POST(request: NextRequest) {
  try {
    // If we don't have a valid Stripe client, return an error
    if (!stripe) {
      return NextResponse.json(
        { success: false, message: 'Payment service not available' },
        { status: 503 }
      )
    }

    const { artistId } = await request.json()

    if (!artistId) {
      return NextResponse.json(
        { success: false, message: 'Artist ID is required' },
        { status: 400 }
      )
    }

    // Get artist information
    const { data: artist, error: artistError } = await supabase
      .from('artists')
      .select('id, name, stripe_account_id')
      .eq('id', artistId)
      .single()

    if (artistError || !artist) {
      return NextResponse.json(
        { success: false, message: 'Artist not found' },
        { status: 404 }
      )
    }

    if (!artist.stripe_account_id) {
      return NextResponse.json(
        { success: false, message: 'Artist does not have connected Stripe account' },
        { status: 400 }
      )
    }

    // Get all pending transactions for this artist
    const { data: pendingTransactions, error: transactionsError } = await supabase
      .from('purchase_transactions')
      .select('*')
      .eq('artist_id', artistId)
      .eq('status', 'pending_stripe_connection')

    if (transactionsError) {
      console.error('Error fetching pending transactions:', transactionsError)
      return NextResponse.json(
        { success: false, message: 'Error fetching pending transactions' },
        { status: 500 }
      )
    }

    if (!pendingTransactions || pendingTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending payouts to process',
        processedCount: 0
      })
    }

    let processedCount = 0
    let totalPayoutAmount = 0

    // Process each pending transaction
    for (const transaction of pendingTransactions) {
      try {
        // Create transfer to artist's connected account
        const transfer = await stripe.transfers.create({
          amount: Math.round(transaction.artist_payout * 100), // Convert to cents
          currency: 'usd',
          destination: artist.stripe_account_id,
          description: `Pending payout for rocket fuel purchases - Transaction ${transaction.id}`,
          metadata: {
            transaction_id: transaction.id,
            artist_id: artistId,
            platform_fee: transaction.platform_fee.toString(),
            artist_amount: transaction.amount.toString()
          }
        })

        // Update transaction status to completed
        const { error: updateError } = await supabase
          .from('purchase_transactions')
          .update({
            status: 'completed',
            payout_date: new Date().toISOString()
          })
          .eq('id', transaction.id)

        if (updateError) {
          console.error('Error updating transaction status:', updateError)
        } else {
          processedCount++
          totalPayoutAmount += transaction.artist_payout
          console.log(`✅ Processed pending payout for transaction ${transaction.id}: ${transfer.id}`)
        }

      } catch (transferError: any) {
        console.error(`❌ Failed to process pending payout for transaction ${transaction.id}:`, transferError.message)
        
        // Update transaction status to failed
        await supabase
          .from('purchase_transactions')
          .update({
            status: 'failed'
          })
          .eq('id', transaction.id)
      }
    }

    // Update artist revenue totals
    if (processedCount > 0) {
      const { error: revenueError } = await supabase
        .from('artist_revenue')
        .upsert({
          artist_id: artistId,
          total_payouts: totalPayoutAmount,
          pending_payouts: 0, // Clear pending payouts
          last_updated: new Date().toISOString()
        }, {
          onConflict: 'artist_id'
        })

      if (revenueError) {
        console.error('Error updating artist revenue:', revenueError)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${processedCount} pending payouts`,
      processedCount,
      totalPayoutAmount
    })

  } catch (error) {
    console.error('Error processing pending payouts:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
} 