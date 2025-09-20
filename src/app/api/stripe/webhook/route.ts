// src/app/api/stripe/webhook/route.ts

import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { supabase } from '@/lib/supabaseClient'

// Create Stripe client only if we have the secret key
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || 'placeholder_key'
const stripe = stripeSecretKey !== 'placeholder_key' 
  ? new Stripe(stripeSecretKey, { apiVersion: '2025-05-28.basil' })
  : null

// Platform fee percentage (e.g., 10%)
const PLATFORM_FEE_PERCENTAGE = 0.10

export async function POST(req: Request) {
  // If we don't have a valid Stripe client, return an error
  if (!stripe) {
    return NextResponse.json(
      { error: 'Payment service not available' },
      { status: 503 }
    )
  }

  const rawBody = await req.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature') as string

  let event

  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('❌ Stripe webhook signature error:', err.message)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      const votes = JSON.parse(session.metadata?.votes || '{}')
      const voiceCommentIds = JSON.parse(session.metadata?.voiceCommentIds || '[]')
      const artistVotes = JSON.parse(session.metadata?.artistVotes || '{}')
      const totalAmount = parseFloat(session.metadata?.totalAmount || '0')

      console.log('Processing checkout session:', session.id)
      console.log('Artist votes:', artistVotes)

      // Process immediate payouts to artists
      for (const [artistId, songVotes] of Object.entries(artistVotes as { [key: string]: { [key: string]: number } })) {
        try {
          // Get artist information
          const { data: artist, error: artistError } = await supabase
            .from('artists')
            .select('id, name, stripe_account_id')
            .eq('id', artistId)
            .single()

          if (artistError || !artist) {
            console.error(`Artist not found: ${artistId}`, artistError)
            continue
          }

          // Calculate artist's portion of this purchase
          let artistAmount = 0
          for (const [songId, quantity] of Object.entries(songVotes)) {
            const songVotePrice = votes[songId] ? totalAmount / Object.values(votes).reduce((sum: number, val: any) => sum + val, 0) : 0
            artistAmount += songVotePrice * (quantity as number)
          }

          // Calculate platform fee and artist payout
          const platformFee = artistAmount * PLATFORM_FEE_PERCENTAGE
          const artistPayout = artistAmount - platformFee

          console.log(`Artist ${artist.name}: Amount=${artistAmount}, Platform Fee=${platformFee}, Payout=${artistPayout}`)

          // If artist has connected Stripe account, transfer funds immediately
          if (artist.stripe_account_id) {
            try {
              // Create transfer to artist's connected account
              const transfer = await stripe.transfers.create({
                amount: Math.round(artistPayout * 100), // Convert to cents
                currency: 'usd',
                destination: artist.stripe_account_id,
                description: `Payout for rocket fuel purchases - Session ${session.id}`,
                metadata: {
                  session_id: session.id,
                  artist_id: artistId,
                  platform_fee: platformFee.toString(),
                  artist_amount: artistAmount.toString()
                }
              })

              console.log(`✅ Transfer created for artist ${artist.name}: ${transfer.id}`)

              // Record successful transaction
              await recordTransaction({
                artistId,
                sessionId: session.id,
                stripeTransferId: transfer.id,
                amount: artistAmount,
                platformFee,
                artistPayout,
                status: 'completed',
                customerEmail: session.customer_details?.email || null
              })

            } catch (transferError: any) {
              console.error(`❌ Transfer failed for artist ${artist.name}:`, transferError.message)
              
              // Record failed transaction
              await recordTransaction({
                artistId,
                sessionId: session.id,
                amount: artistAmount,
                platformFee,
                artistPayout,
                status: 'failed',
                customerEmail: session.customer_details?.email || null,
                errorMessage: transferError.message
              })
            }
          } else {
            console.log(`⚠️ Artist ${artist.name} doesn't have connected Stripe account`)
            
            // Record pending transaction (artist needs to connect Stripe)
            await recordTransaction({
              artistId,
              sessionId: session.id,
              amount: artistAmount,
              platformFee,
              artistPayout,
              status: 'pending_stripe_connection',
              customerEmail: session.customer_details?.email || null
            })
          }

        } catch (artistError) {
          console.error(`Error processing payout for artist ${artistId}:`, artistError)
        }
      }

      // Update vote counts for songs
      for (const [songId, voteCount] of Object.entries(votes)) {
        await supabase.rpc('increment_votes', {
          song_id: songId,
          increment_by: Number(voteCount),
        })
      }

      // Update voice comments status if any were included in the purchase
      if (voiceCommentIds.length > 0) {
        try {
          const { data, error } = await supabase
            .from('voice_comments')
            .update({
              status: 'purchased',
              purchase_session_id: session.id
            })
            .in('id', voiceCommentIds)
            .select()

          if (error) {
            console.error('Error updating voice comments:', error)
          } else {
            console.log(`Updated ${data?.length || 0} voice comments to purchased status`)
            
            // Send email notifications to artists
            if (data && data.length > 0) {
              // Group comments by artist
              const commentsByArtist = data.reduce((acc, comment) => {
                if (!acc[comment.artist_id]) {
                  acc[comment.artist_id] = []
                }
                acc[comment.artist_id].push(comment)
                return acc
              }, {} as { [artistId: string]: any[] })

              // Send notification to each artist
              for (const [artistId, comments] of Object.entries(commentsByArtist)) {
                try {
                  const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL}/api/notify-artist`, {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                      artistId,
                      purchaseSessionId: session.id
                    }),
                  })

                  if (response.ok) {
                    console.log(`Email notification sent to artist ${artistId}`)
                  } else {
                    console.error(`Failed to send email notification to artist ${artistId}`)
                  }
                } catch (emailError) {
                  console.error(`Error sending email notification to artist ${artistId}:`, emailError)
                }
              }
            }
          }
        } catch (error) {
          console.error('Error in voice comment update:', error)
        }
      }

      break
    }

    default:
      console.log(`Unhandled event type: ${event.type}`)
  }

  return NextResponse.json({ received: true })
}

// Helper function to record transactions in the database
async function recordTransaction({
  artistId,
  sessionId,
  stripeTransferId,
  amount,
  platformFee,
  artistPayout,
  status,
  customerEmail,
  errorMessage
}: {
  artistId: string
  sessionId: string
  stripeTransferId?: string
  amount: number
  platformFee: number
  artistPayout: number
  status: string
  customerEmail: string | null
  errorMessage?: string
}) {
  try {
    // Insert into purchase_transactions table
    const { error: transactionError } = await supabase
      .from('purchase_transactions')
      .insert({
        artist_id: artistId,
        stripe_payment_intent_id: sessionId,
        amount: amount,
        platform_fee: platformFee,
        artist_payout: artistPayout,
        status: status,
        customer_email: customerEmail,
        payout_date: status === 'completed' ? new Date().toISOString() : null
      })

    if (transactionError) {
      console.error('Error recording transaction:', transactionError)
    }

    // Update artist revenue totals
    const { error: revenueError } = await supabase
      .from('artist_revenue')
      .upsert({
        artist_id: artistId,
        total_revenue: amount,
        pending_payouts: status === 'pending_stripe_connection' ? artistPayout : 0,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'artist_id'
      })

    if (revenueError) {
      console.error('Error updating artist revenue:', revenueError)
    }

    console.log(`Transaction recorded for artist ${artistId}: ${status}`)
  } catch (error) {
    console.error('Error in recordTransaction:', error)
  }
}